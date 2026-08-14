import { NextRequest } from "next/server";
import { getSessionUserId } from "@/lib/auth-helpers";
import { Category } from "@/lib/models";
import { serializeCategory } from "@/lib/serialize";
import { categorySchema } from "@/lib/validation";
import { handleApiError, json, unauthorized } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const categories = await Category.findAll({
      where: {
        userId,
        teamId: null,
        ...(type ? { type } : {}),
      },
      order: [["type", "ASC"], ["name", "ASC"]],
    });

    return json(categories.map(serializeCategory));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const body = await req.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        422,
      );
    }

    const { name, type, color, icon } = parsed.data;
    const category = await Category.create({
      name,
      type,
      color: color ?? "#a855f7",
      icon: icon ?? null,
      userId,
      teamId: null,
    });

    return json(serializeCategory(category), 201);
  } catch (err) {
    return handleApiError(err);
  }
}
