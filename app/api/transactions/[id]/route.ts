import { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/auth-helpers";
import { Category, Currency, Transaction } from "@/lib/models";
import { serializeTransaction } from "@/lib/serialize";
import { transactionSchema } from "@/lib/validation";
import { computeConvertedAmount } from "@/lib/conversion";
import { error, handleApiError, json, unauthorized } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

async function findOwnedTransaction(id: string, userId: string) {
  return Transaction.findOne({
    where: { id, userId, teamId: null },
    include: [
      { model: Category, as: "category" },
      { model: Currency, as: "currency" },
    ],
  });
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const { id } = await params;
    const transaction = await findOwnedTransaction(id, userId);
    if (!transaction) return error("Transacción no encontrada", 404);

    const body = await req.json();
    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        422,
      );
    }

    const { type, amount, currencyId, description, date, categoryId } = parsed.data;

    const convertedAmount = await computeConvertedAmount(amount, currencyId);

    await transaction.update({
      type,
      amount,
      convertedAmount,
      currencyId,
      description,
      date,
      categoryId,
    });

    return json(serializeTransaction(transaction));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();

    const { id } = await params;
    const transaction = await findOwnedTransaction(id, userId);
    if (!transaction) return error("Transacción no encontrada", 404);

    const body = await req.json().catch(() => ({}));
    const parsed = z
      .object({ removeFromTeams: z.array(z.string()).optional() })
      .safeParse(body);
    const teamIds = parsed.success ? parsed.data.removeFromTeams : undefined;

    let removedTeams = 0;
    if (teamIds && teamIds.length > 0) {
      for (const teamId of teamIds) {
        await Transaction.destroy({
          where: { userId, teamId, importKey: `imp:${transaction.id}:${teamId}` },
        });
        removedTeams += 1;
      }
    }

    await transaction.destroy();
    return json({ ok: true, removedTeams });
  } catch (err) {
    return handleApiError(err);
  }
}
