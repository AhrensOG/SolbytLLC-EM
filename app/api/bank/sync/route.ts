import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/auth-helpers";
import { BankConnection } from "@/lib/models";
import { syncBankTransactions } from "@/lib/bank-import";
import { EnableError } from "@/lib/enablebanking";
import { error, handleApiError, json } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();

    const connectionId = new URL(req.url).searchParams.get("connectionId");
    const where: { id?: string; userId: string } = { userId };
    if (connectionId) where.id = connectionId;

    const connection = await BankConnection.findOne({ where });
    if (!connection) return error("Cuenta bancaria no encontrada", 404);
    if (!connection.sessionId) return error("La conexión no tiene sesión activa", 400);

    const daysParam = new URL(req.url).searchParams.get("days");
    const days = daysParam && /^\d+$/.test(daysParam) ? Number(daysParam) : undefined;

    const psuHeaders: Record<string, string> = {};
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ua = req.headers.get("user-agent");
    if (ip) psuHeaders["Psu-Ip-Address"] = ip;
    if (ua) psuHeaders["Psu-User-Agent"] = ua;

    const result = await syncBankTransactions(connection, userId, {
      days,
      psuHeaders,
    });

    return json({ ...result, syncedAt: new Date().toISOString() });
  } catch (err) {
    if (err instanceof EnableError && err.code === "EXPIRED_SESSION") {
      return error("El acceso a este banco caducó. Conéctalo de nuevo.", 401);
    }
    return handleApiError(err);
  }
}