import { Op } from "sequelize";
import {
  BankConnection,
  Category,
  ImportDraft,
  Transaction,
} from "@/lib/models";
import {
  getAccountTransactions,
  type EnableTransaction,
} from "@/lib/enablebanking";

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

function normalizeTx(tx: EnableTransaction): {
  amount: number;
  date: string;
  currencyCode: string;
  description: string;
} {
  return {
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
  opts: { days?: number; psuHeaders?: Record<string, string> } = {},
): Promise<{ created: number; skipped: number }> {
  const days = opts.days ?? defaultSyncDays();
  const dateFrom = dateFromDaysAgo(days);

  if (!connection.sessionId) {
    throw new Error("La conexión bancaria no tiene sesión activa");
  }
  if (!connection.accountExternalId) {
    throw new Error("La conexión no tiene cuenta asignada");
  }

  const transactions = await getAccountTransactions(connection.accountExternalId, {
    dateFrom,
    psuHeaders: opts.psuHeaders,
  });

  let created = 0;
  let skipped = 0;

  if (transactions.length === 0) {
    await connection.update({ lastSyncedAt: new Date() });
    return { created, skipped };
  }

  const importKeys = transactions.map((tx) =>
    importKeyFor(connection.accountExternalId!, tx.externalId),
  );

  const existingConfirmed = await Transaction.findAll({
    where: { userId, importKey: { [Op.in]: importKeys } },
    attributes: ["importKey"],
  });
  const existingDrafts = await ImportDraft.findAll({
    where: { userId, transactionExternalId: { [Op.in]: importKeys } },
    attributes: ["transactionExternalId"],
  });

  const confirmedKeys = new Set(existingConfirmed.map((t) => t.importKey));
  const draftKeys = new Set(
    existingDrafts.map((d) => d.transactionExternalId),
  );

  for (const tx of transactions) {
    const key = importKeyFor(connection.accountExternalId!, tx.externalId);
    if (confirmedKeys.has(key) || draftKeys.has(key)) {
      skipped += 1;
      continue;
    }

    const normalized = normalizeTx(tx);
    const categoryId = await suggestCategory(normalized.description, userId);
    await ImportDraft.create({
      userId,
      connectionId: connection.id,
      accountExternalId: connection.accountExternalId!,
      transactionExternalId: key,
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

  await connection.update({ lastSyncedAt: new Date() });
  return { created, skipped };
}