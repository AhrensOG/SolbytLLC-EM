import { NextRequest } from "next/server";
import {
  getSessionUserId,
  requireMembership,
  requireUserId,
} from "@/lib/auth-helpers";
import {
  Category,
  Currency,
  RecurringExpense,
  RecurringExpenseTeam,
  TeamMember,
  User,
} from "@/lib/models";
import { serializeRecurringExpense } from "@/lib/serialize";
import { recurringExpenseSchema } from "@/lib/validation";
import { error, handleApiError, json, unauthorized } from "@/lib/api";

async function validateSharedTeams(userId: string, teamIds: string[]) {
  for (const teamId of teamIds) {
    const member = await TeamMember.findOne({ where: { teamId, userId } });
    if (!member) {
      throw new Error("NOT_MEMBER");
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId");

    let where: Record<string, unknown>;
    if (teamId) {
      await requireMembership(teamId);
      where = { teamId };
    } else {
      where = { userId, teamId: null };
    }

    const recurring = await RecurringExpense.findAll({
      where,
      include: [
        { model: Category, as: "category" },
        { model: Currency, as: "currency" },
        { model: RecurringExpenseTeam, as: "teams" },
        { model: User, as: "payedBy" },
      ],
      order: [["createdAt", "DESC"]],
    });

    return json(
      recurring.map((r) =>
        serializeRecurringExpense(
          r,
          r.teams?.map((t) => t.teamId) ?? [],
        ),
      ),
    );
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();

    const body = await req.json();
    const parsed = recurringExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        422,
      );
    }

    const data = parsed.data;
    const teamId = data.teamId ?? null;

    if (teamId) {
      await requireMembership(teamId);

      const category = await Category.findOne({
        where: { id: data.categoryId, teamId },
      });
      if (!category) {
        return error("La categoría no pertenece a este equipo", 422);
      }

      const payedByUserId = data.payedByUserId ?? userId;
      const payerMember = await TeamMember.findOne({
        where: { teamId, userId: payedByUserId },
      });
      if (!payerMember) {
        return error("El pagador no es miembro del equipo", 422);
      }

      const recurring = await RecurringExpense.create({
        userId,
        name: data.name,
        type: data.type,
        amount: data.amount,
        currencyId: data.currencyId,
        categoryId: data.categoryId,
        frequency: data.frequency,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        active: data.active ?? true,
        teamId,
        payedByUserId,
      });

      const payerUser = await User.findByPk(payedByUserId);
      if (payerUser) recurring.payedBy = payerUser;

      return json(serializeRecurringExpense(recurring), 201);
    }

    try {
      await validateSharedTeams(userId, data.teamIds);
    } catch {
      return error("No eres miembro de uno de los equipos seleccionados", 403);
    }

    const recurring = await RecurringExpense.create({
      userId,
      name: data.name,
      type: data.type,
      amount: data.amount,
      currencyId: data.currencyId,
      categoryId: data.categoryId,
      frequency: data.frequency,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      active: data.active ?? true,
      teamId: null,
      payedByUserId: null,
    });

    await RecurringExpenseTeam.bulkCreate(
      data.teamIds.map((sharedTeamId) => ({
        recurringExpenseId: recurring.id,
        teamId: sharedTeamId,
      })),
    );

    return json(serializeRecurringExpense(recurring, data.teamIds), 201);
  } catch (err) {
    return handleApiError(err);
  }
}
