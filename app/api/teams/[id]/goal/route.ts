import { NextRequest } from "next/server";
import { requireAdmin, requireMembership } from "@/lib/auth-helpers";
import { Currency, Team, TeamMember, Transaction, User } from "@/lib/models";
import { getDisplayCurrencyInfo, toDisplay } from "@/lib/conversion";
import { teamGoalSchema } from "@/lib/validation";
import { error, handleApiError, json } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await requireMembership(id);

    const team = await Team.findByPk(id);
    if (!team) return error("Equipo no encontrado", 404);

    const goalCurrency = team.goalCurrencyId
      ? await Currency.findByPk(team.goalCurrencyId)
      : null;
    const display = await getDisplayCurrencyInfo(
      goalCurrency?.code ?? (await getDisplayCurrencyInfo(null)).code,
    );

    const [transactions, members] = await Promise.all([
      Transaction.findAll({ where: { teamId: id } }),
      TeamMember.findAll({
        where: { teamId: id },
        include: [{ model: User, as: "user" }],
        order: [["joinedAt", "ASC"]],
      }),
    ]);

    let balanceBase = 0;
    const memberBalance = new Map<string, number>();
    for (const tx of transactions) {
      const value = Number(tx.convertedAmount ?? 0);
      const signed = tx.type === "income" ? value : -value;
      balanceBase += signed;
      memberBalance.set(tx.userId, (memberBalance.get(tx.userId) ?? 0) + signed);
    }

    return json({
      goalAmount: team.goalAmount == null ? null : Number(team.goalAmount),
      goalCurrencyId: team.goalCurrencyId,
      currency: { code: display.code, symbol: display.symbol },
      progress: toDisplay(balanceBase, display.rate),
      members: members.map((m) => ({
        userId: m.userId,
        name: m.user?.name ?? "Usuario",
        goalAmount:
          m.individualGoalAmount == null ? null : Number(m.individualGoalAmount),
        progress: toDisplay(memberBalance.get(m.userId) ?? 0, display.rate),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await requireAdmin(id);

    const team = await Team.findByPk(id);
    if (!team) return error("Equipo no encontrado", 404);

    const body = await req.json();
    const parsed = teamGoalSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        422,
      );
    }

    const { goalAmount, goalCurrencyId } = parsed.data;

    if (goalAmount == null) {
      await team.update({ goalAmount: null, goalCurrencyId: null });
    } else {
      const currency = goalCurrencyId
        ? await Currency.findByPk(goalCurrencyId)
        : null;
      if (!currency) return error("Moneda inválida", 422);
      await team.update({ goalAmount, goalCurrencyId: currency.id });
    }

    return json({
      goalAmount: team.goalAmount == null ? null : Number(team.goalAmount),
      goalCurrencyId: team.goalCurrencyId,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
