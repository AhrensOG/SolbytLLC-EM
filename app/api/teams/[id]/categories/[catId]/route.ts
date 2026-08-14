import { NextRequest } from "next/server";
import { requireMembership } from "@/lib/auth-helpers";
import { Category, Transaction } from "@/lib/models";
import { serializeCategory } from "@/lib/serialize";
import { categorySchema } from "@/lib/validation";
import { error, handleApiError, json } from "@/lib/api";

type Params = { params: Promise<{ id: string; catId: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id, catId } = await params;
    await requireMembership(id);

    const category = await Category.findOne({
      where: { id: catId, teamId: id },
    });
    if (!category) return error("Categoría no encontrada", 404);

    const body = await req.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        422,
      );
    }

    const { name, type, color, icon } = parsed.data;
    await category.update({ name, type, ...(color ? { color } : {}), icon: icon ?? null });

    return json(serializeCategory(category));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id, catId } = await params;
    await requireMembership(id);

    const category = await Category.findOne({
      where: { id: catId, teamId: id },
    });
    if (!category) return error("Categoría no encontrada", 404);

    const inUse = await Transaction.count({ where: { categoryId: catId } });
    if (inUse > 0) {
      return error(
        "No puedes eliminar una categoría que tiene transacciones asociadas",
        409,
      );
    }

    await category.destroy();
    return json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
