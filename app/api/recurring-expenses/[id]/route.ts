import { NextRequest } from "next/server";
import { requireMembership, requireUserId } from "@/lib/auth-helpers";
import {
  Category,
  RecurringExpense,
  RecurringExpenseTeam,
  TeamMember,
} from "@/lib/models";
import { serializeRecurringExpense } from "@/lib/serialize";
import { recurringExpenseSchema } from "@/lib/validation";
import { error, handleApiError, json } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

async function validateTeamData(
  teamId: string,
  categoryId: string,
  payedByUserId: string | null | undefined,
  currentUserId: string,
) {
  const category = await Category.findOne({
    where: { id: categoryId, teamId },
  });
  if (!category) {
    return error("La categoría no pertenece a este equipo", 422);
  }

  const payerId = payedByUserId ?? currentUserId;
  const payer = await TeamMember.findOne({
    where: { teamId, userId: payerId },
  });
  if (!payer) return error("El pagador no es miembro del equipo", 422);

  return null;
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const recurring = await RecurringExpense.findByPk(id);
    if (!recurring) return error("Recurrente no encontrado", 404);

    const body = await req.json();
    const parsed = recurringExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        422,
      );
    }

    const data = parsed.data;

    if (recurring.teamId) {
      await requireMembership(recurring.teamId);

      const invalid = await validateTeamData(
        recurring.teamId,
        data.categoryId,
        data.payedByUserId,
        userId,
      );
      if (invalid) return invalid;

      await recurring.update({
        name: data.name,
        type: data.type,
        amount: data.amount,
        currencyId: data.currencyId,
        categoryId: data.categoryId,
        frequency: data.frequency,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        active: data.active ?? true,
        payedByUserId: data.payedByUserId ?? userId,
      });

      return json(serializeRecurringExpense(recurring));
    }

    if (recurring.userId !== userId) {
      return error("No tienes permisos para editar este recurrente", 403);
    }

    for (const teamId of data.teamIds) {
      const member = await TeamMember.findOne({ where: { teamId, userId } });
      if (!member) {
        return error("No eres miembro de uno de los equipos seleccionados", 403);
      }
    }

    await recurring.update({
      name: data.name,
      type: data.type,
      amount: data.amount,
      currencyId: data.currencyId,
      categoryId: data.categoryId,
      frequency: data.frequency,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      active: data.active ?? true,
    });

    await RecurringExpenseTeam.destroy({
      where: { recurringExpenseId: recurring.id },
    });
    await RecurringExpenseTeam.bulkCreate(
      data.teamIds.map((teamId) => ({
        recurringExpenseId: recurring.id,
        teamId,
      })),
    );

    return json(serializeRecurringExpense(recurring, data.teamIds));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const recurring = await RecurringExpense.findByPk(id);
    if (!recurring) return error("Recurrente no encontrado", 404);

    if (recurring.teamId) {
      await requireMembership(recurring.teamId);
    } else if (recurring.userId !== userId) {
      return error("No tienes permisos para eliminar este recurrente", 403);
    }

    await RecurringExpenseTeam.destroy({
      where: { recurringExpenseId: recurring.id },
    });
    await recurring.destroy();

    return json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
