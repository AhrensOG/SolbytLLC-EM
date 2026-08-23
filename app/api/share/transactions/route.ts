import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth-helpers";
import { TeamMember, Transaction } from "@/lib/models";
import { shareTransactionsSchema } from "@/lib/validation";
import { copyTransactionToTeams } from "@/lib/share-transaction";
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
      const result = await copyTransactionToTeams(tx, teamIds);
      created += result.created;
      skipped += result.skipped;
    }

    return json({ created, skipped });
  } catch (err) {
    return handleApiError(err);
  }
}
