import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth-helpers";
import { BankConnection } from "@/lib/models";
import { syncBankTransactions } from "@/lib/bank-import";
import { error, handleApiError, json } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const connection = await BankConnection.findOne({ where: { userId } });
    if (!connection) return error("No hay ninguna cuenta bancaria conectada", 400);

    const daysParam = new URL(req.url).searchParams.get("days");
    const days = daysParam && /^\d+$/.test(daysParam) ? Number(daysParam) : undefined;

    const result = await syncBankTransactions(connection, userId, { days });

    return json({ ...result, syncedAt: new Date().toISOString() });
  } catch (err) {
    return handleApiError(err);
  }
}