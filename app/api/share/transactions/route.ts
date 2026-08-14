import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth-helpers";
import { TeamMember, Transaction } from "@/lib/models";
import { shareTransactionsSchema } from "@/lib/validation";
import { resolveTeamCategory } from "@/lib/team-category";
import { error, handleApiError, json } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();

    const body = await req.json();
    const parsed = shareTransactionsSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        422,
      );
    }

    const { transactionIds, teamIds } = parsed.data;

    for (const teamId of teamIds) {
      const member = await TeamMember.findOne({ where: { teamId, userId } });
      if (!member) {
        return error("No eres miembro de uno de los equipos seleccionados", 403);
      }
    }

    const transactions = await Transaction.findAll({
      where: { id: transactionIds, userId, teamId: null },
    });
    if (transactions.length !== transactionIds.length) {
      return error("Algunas transacciones no existen o no te pertenecen", 404);
    }

    let created = 0;
    let skipped = 0;

    for (const tx of transactions) {
      for (const teamId of teamIds) {
        const importKey = `imp:${tx.id}:${teamId}`;
        const exists = await Transaction.findOne({ where: { importKey } });
        if (exists) {
          skipped++;
          continue;
        }

        const teamCategoryId = await resolveTeamCategory(
          teamId,
          tx.categoryId,
        );
        if (!teamCategoryId) {
          skipped++;
          continue;
        }

        await Transaction.create({
          type: tx.type,
          amount: Number(tx.amount),
          convertedAmount: Number(tx.convertedAmount ?? 0),
          currencyId: tx.currencyId,
          description: tx.description,
          date: String(tx.date),
          categoryId: teamCategoryId,
          userId,
          teamId,
          importKey,
        });
        created++;
      }
    }

    return json({ created, skipped });
  } catch (err) {
    return handleApiError(err);
  }
}
