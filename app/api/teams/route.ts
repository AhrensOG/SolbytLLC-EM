import { NextRequest } from "next/server";
import { getSessionUserId } from "@/lib/auth-helpers";
import { Currency, Team, TeamMember, Transaction } from "@/lib/models";
import { sequelize } from "@/lib/db";
import { serializeTeam } from "@/lib/serialize";
import { teamSchema } from "@/lib/validation";
import { handleApiError, json, unauthorized } from "@/lib/api";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const memberships = await TeamMember.findAll({
      where: { userId },
      include: [{ model: Team, as: "team" }],
    });

    if (memberships.length === 0) return json([]);

    const teamIds = memberships.map((m) => m.teamId);
    const counts = await TeamMember.findAll({
      attributes: [
        "teamId",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: { teamId: teamIds },
      group: ["teamId"],
    });
    const countMap = new Map<string, number>(
      counts.map((c) => [c.teamId, Number(c.get("count"))]),
    );

    // Progreso de metas: balance acumulado (convertido) por team.
    const transactions = await Transaction.findAll({
      where: { teamId: teamIds },
      attributes: ["teamId", "type", "convertedAmount"],
    });
    const balanceByTeam = new Map<string, number>();
    for (const tx of transactions) {
      const teamId = tx.teamId ?? "";
      const value =
        Number(tx.convertedAmount ?? 0) * (tx.type === "income" ? 1 : -1);
      balanceByTeam.set(teamId, (balanceByTeam.get(teamId) ?? 0) + value);
    }

    const currencies = await Currency.findAll();
    const rateByCurrency = new Map<string, number>(
      currencies.map((c) => [c.id, Number(c.exchangeRateToBase)]),
    );

    const teams = memberships
      .map((m) => {
        const team = m.team!;
        let progress: number | null = null;
        const goalCurrencyId = team.goalCurrencyId;
        if (team.goalAmount != null && goalCurrencyId) {
          const rate = rateByCurrency.get(goalCurrencyId) ?? 1;
          progress =
            Math.round(((balanceByTeam.get(team.id) ?? 0) / rate) * 100) / 100;
        }
        return serializeTeam(team, {
          role: m.role,
          memberCount: countMap.get(m.teamId) ?? 1,
          progress,
        });
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return json(teams);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const body = await req.json();
    const parsed = teamSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        422,
      );
    }

    const { name, description } = parsed.data;

    const team = await sequelize.transaction(async (t) => {
      const created = await Team.create(
        {
          name,
          description: description ?? null,
          createdById: userId,
        },
        { transaction: t },
      );
      await TeamMember.create(
        { teamId: created.id, userId, role: "admin" },
        { transaction: t },
      );
      return created;
    });

    return json(serializeTeam(team, { role: "admin", memberCount: 1 }), 201);
  } catch (err) {
    return handleApiError(err);
  }
}
