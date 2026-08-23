import { Transaction } from "@/lib/models";
import { resolveTeamCategory } from "@/lib/team-category";

export interface ShareTxnResult {
  created: number;
  skipped: number;
}

export async function copyTransactionToTeams(
  tx: Transaction,
  teamIds: string[],
): Promise<ShareTxnResult> {
  let created = 0;
  let skipped = 0;

  for (const teamId of teamIds) {
    const importKey = `imp:${tx.id}:${teamId}`;
    const exists = await Transaction.findOne({ where: { importKey } });
    if (exists) {
      skipped++;
      continue;
    }

    const teamCategoryId = await resolveTeamCategory(teamId, tx.categoryId);
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
      userId: tx.userId,
      teamId,
      importKey,
    });
    created++;
  }

  return { created, skipped };
}