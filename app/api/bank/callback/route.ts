import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth-helpers";
import { BankConnection } from "@/lib/models";
import { authorizeSession } from "@/lib/enablebanking";
import { error, handleApiError, json } from "@/lib/api";

const callbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = callbackSchema.safeParse(body);
    if (!parsed.success) return error("Datos inválidos", 422);

    const connection = await BankConnection.findOne({
      where: { userId, authState: parsed.data.state },
    });
    if (!connection) return error("Conexión no encontrada", 404);

    const session = await authorizeSession(parsed.data.code);

    await connection.update({
      sessionId: session.sessionId,
      status: "linked",
      validUntil: session.validUntil ? new Date(session.validUntil) : null,
      accountsJson: JSON.stringify(session.accounts),
      authState: null,
    });

    return json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}