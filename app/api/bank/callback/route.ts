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

    const pending = await BankConnection.findOne({
      where: { userId, authState: parsed.data.state },
    });
    if (!pending) return error("Conexión no encontrada", 404);

    const session = await authorizeSession(parsed.data.code);
    const validUntil = session.validUntil ? new Date(session.validUntil) : null;

    for (const account of session.accounts) {
      if (!account.id) continue;
      const existing = await BankConnection.findOne({
        where: {
          userId,
          provider: "enablebanking",
          institutionId: pending.institutionId,
          accountExternalId: account.id,
        },
      });

      if (existing) {
        await existing.update({
          sessionId: session.sessionId,
          status: "linked",
          validUntil,
          authState: null,
          accountName: account.name ?? existing.accountName,
          accountIban: account.iban ?? existing.accountIban,
          accountCurrency: account.currency ?? existing.accountCurrency,
        });
      } else {
        await BankConnection.create({
          userId,
          provider: "enablebanking",
          sessionId: session.sessionId,
          institutionId: pending.institutionId,
          institutionName: pending.institutionName,
          authState: null,
          accountExternalId: account.id,
          accountName: account.name,
          accountIban: account.iban,
          accountCurrency: account.currency,
          status: "linked",
          validUntil,
        });
      }
    }

    await pending.destroy();

    return json({ ok: true, added: session.accounts.length });
  } catch (err) {
    return handleApiError(err);
  }
}