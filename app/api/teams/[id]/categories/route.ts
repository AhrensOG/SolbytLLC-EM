import { NextRequest } from "next/server";
import { requireMembership } from "@/lib/auth-helpers";
import { Category } from "@/lib/models";
import { serializeCategory } from "@/lib/serialize";
import { categorySchema } from "@/lib/validation";
import { handleApiError, json } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await requireMembership(id);

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const categories = await Category.findAll({
      where: {
        teamId: id,
        ...(type ? { type } : {}),
      },
      order: [
        ["type", "ASC"],
        ["name", "ASC"],
      ],
    });

    return json(categories.map(serializeCategory));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await requireMembership(id);

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
      userId: null,
      teamId: id,
    });

    return json(serializeCategory(category), 201);
  } catch (err) {
    return handleApiError(err);
  }
}
