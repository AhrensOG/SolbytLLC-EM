import { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser, requireUserId } from "@/lib/auth-helpers";
import { User } from "@/lib/models";
import { error, handleApiError, json, unauthorized } from "@/lib/api";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    return json({
      id: user.id,
      name: user.name,
      email: user.email,
      defaultCurrencyId: user.defaultCurrencyId,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const updateSchema = z.object({
  name: z.string().min(2).trim().optional(),
  defaultCurrencyId: z.string().nullable().optional(),
});

export async function PUT(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return error("Datos inválidos", 422);
    }

    const { name, defaultCurrencyId } = parsed.data;
    await User.update(
      {
        ...(name !== undefined ? { name } : {}),
        ...(defaultCurrencyId !== undefined ? { defaultCurrencyId } : {}),
      },
      { where: { id: userId } },
    );

    const user = await User.findByPk(userId);
    return json({
      id: user?.id,
      name: user?.name,
      email: user?.email,
      defaultCurrencyId: user?.defaultCurrencyId,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
