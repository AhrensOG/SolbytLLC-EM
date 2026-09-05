import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth-helpers";
import { BankConnection } from "@/lib/models";
import { getAccountDetails, getRequisition } from "@/lib/gocardless";
import { error, handleApiError, json } from "@/lib/api";

const callbackSchema = z.object({
  requisitionId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = callbackSchema.safeParse(body);
    if (!parsed.success) return error("Datos inválidos", 422);

    const connection = await BankConnection.findOne({
      where: { userId, requisitionId: parsed.data.requisitionId },
    });
    if (!connection) return error("Conexión no encontrada", 404);

    const requisition = await getRequisition(connection.requisitionId);

    if (requisition.status === "RJ") {
      await connection.destroy();
      return error("El acceso fue rechazado en tu banco", 400);
    }

    if (requisition.status === "LN" && requisition.accounts.length > 0) {
      const accounts = [];
      for (const accountId of requisition.accounts) {
        try {
          accounts.push(await getAccountDetails(accountId));
        } catch {
          // Skip inaccessible accounts.
        }
      }
      await connection.update({
        status: "linked",
        accountsJson: JSON.stringify(accounts),
      });
      return json({ ok: true });
    }

    return json({ ok: false, status: requisition.status });
  } catch (err) {
    return handleApiError(err);
  }
}