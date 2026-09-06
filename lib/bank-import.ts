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
  getSession,
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

  const session = await getSession(connection.sessionId);
  const accountIds = session.accountIds;
  if (session.validUntil) {
    await connection.update({ validUntil: new Date(session.validUntil) });
  }
  if (accountIds.length === 0) {
    return { created: 0, skipped: 0 };
  }

  const accounts: {
    id: string;
    iban: string | null;
    name: string | null;
    currency: string | null;
  }[] = [];
  for (const accountId of accountIds) {
    try {
      accounts.push(await getAccountDetails(accountId));
    } catch {
      // Unknown/inaccessible account: skip.
    }
  }

  await connection.update({
    accountsJson: JSON.stringify(accounts),
  });

  let created = 0;
  let skipped = 0;

  for (const account of accounts) {
    const transactions = await getAccountTransactions(account.id, {
      dateFrom,
      psuHeaders: opts.psuHeaders,
    });
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
      const normalized = normalizeTx(tx);
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