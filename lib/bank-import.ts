import { Op } from "sequelize";
import {
  BankConnection,
  Category,
  ImportDraft,
  Transaction,
} from "@/lib/models";
import {
  getAccountDetails,
  getAccountTransactions,
  getRequisition,
} from "@/lib/gocardless";
import type { GcTransaction } from "@/lib/gocardless";

export const IMPORT_KEY_PREFIX = "b:";

export function importKeyFor(accountExternalId: string, txExternalId: string) {
  return `${IMPORT_KEY_PREFIX}${accountExternalId}:${txExternalId}`;
}

export function defaultSyncDays(): number {
  return 30;
}

export function dateFromDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function normalizeGcTx(tx: GcTransaction): {
  isExpense: boolean;
  amount: number;
  date: string;
  currencyCode: string;
  description: string;
} {
  const isExpense = tx.amount < 0;
  return {
    isExpense,
    amount: tx.amount,
    date: tx.bookingDate || new Date().toISOString().slice(0, 10),
    currencyCode: tx.currency || "EUR",
    description: tx.description.trim() || "Movimiento bancario",
  };
}

async function suggestCategory(
  description: string,
  userId: string,
): Promise<string | null> {
  const categories = await Category.findAll({
    where: { userId, teamId: null },
    attributes: ["id", "name"],
  });
  const lower = description.toLowerCase();
  for (const category of categories) {
    const name = category.name.toLowerCase();
    if (name.length >= 3 && lower.includes(name)) {
      return category.id;
    }
  }
  return null;
}

export async function syncBankTransactions(
  connection: BankConnection,
  userId: string,
  opts: { days?: number } = {},
): Promise<{ created: number; skipped: number }> {
  const days = opts.days ?? defaultSyncDays();
  const dateFrom = dateFromDaysAgo(days);

  const requisition = await getRequisition(connection.requisitionId);
  const accountIds = requisition.accounts;
  if (accountIds.length === 0) {
    return { created: 0, skipped: 0 };
  }

  const accounts: { id: string; iban: string | null; name: string | null; currency: string | null }[] = [];
  for (const accountId of accountIds) {
    try {
      accounts.push(await getAccountDetails(accountId));
    } catch {
      // Unknown/inaccessible account: skip.
    }
  }
  if (connection.status !== requisition.status) {
    await connection.update({ status: requisition.status });
  }

  const newAccounts = accounts.map((a) => ({
    id: a.id,
    iban: a.iban,
    name: a.name,
    currency: a.currency,
  }));
  await connection.update({ accountsJson: JSON.stringify(newAccounts) });

  let created = 0;
  let skipped = 0;

  for (const account of accounts) {
    const transactions = await getAccountTransactions(account.id, dateFrom);
    if (transactions.length === 0) continue;

    const importKeys = transactions.map((tx) =>
      importKeyFor(account.id, tx.externalId),
    );

    const existingConfirmed = await Transaction.findAll({
      where: { userId, importKey: { [Op.in]: importKeys } },
      attributes: ["importKey"],
    });
    const existingDrafts = await ImportDraft.findAll({
      where: { userId, transactionExternalId: { [Op.in]: importKeys } },
      attributes: ["transactionExternalId"],
    });

    const confirmedKeys = new Set(
      existingConfirmed.map((t) => t.importKey),
    );
    const draftKeys = new Set(
      existingDrafts.map((d) => d.transactionExternalId),
    );
    const pending = transactions.filter((tx) => {
      const key = importKeyFor(account.id, tx.externalId);
      return !confirmedKeys.has(key) && !draftKeys.has(key);
    });

    for (const tx of pending) {
      const normalized = normalizeGcTx(tx);
      const categoryId = await suggestCategory(
        normalized.description,
        userId,
      );
      await ImportDraft.create({
        userId,
        connectionId: connection.id,
        accountExternalId: account.id,
        transactionExternalId: importKeyFor(account.id, tx.externalId),
        bookingDate: normalized.date,
        amount: normalized.amount,
        currencyCode: normalized.currencyCode,
        description: normalized.description,
        counterpartyName: null,
        categoryId,
        status: "pending",
      });
      created += 1;
    }
    skipped += pending.length === 0 ? transactions.length : 0;
  }

  await connection.update({ lastSyncedAt: new Date() });
  return { created, skipped };
}