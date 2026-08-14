import { NextRequest } from "next/server";
import { requireMembership, requireUserId } from "@/lib/auth-helpers";
import { Category, Currency, Transaction } from "@/lib/models";
import { serializeTransaction } from "@/lib/serialize";
import { transactionSchema } from "@/lib/validation";
import { computeConvertedAmount } from "@/lib/conversion";
import { error, handleApiError, json } from "@/lib/api";

type Params = { params: Promise<{ id: string; txId: string }> };

async function findTeamTransaction(txId: string, teamId: string) {
  return Transaction.findOne({
    where: { id: txId, teamId },
    include: [
      { model: Category, as: "category" },
      { model: Currency, as: "currency" },
    ],
  });
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id, txId } = await params;
    const userId = await requireUserId();
    await requireMembership(id);

    const transaction = await findTeamTransaction(txId, id);
    if (!transaction) return error("Transacción no encontrada", 404);
    if (transaction.userId !== userId) {
      return error("Solo el autor puede editar esta transacción", 403);
    }

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

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id, txId } = await params;
    const userId = await requireUserId();
    await requireMembership(id);

    const transaction = await findTeamTransaction(txId, id);
    if (!transaction) return error("Transacción no encontrada", 404);
    if (transaction.userId !== userId) {
      return error("Solo el autor puede eliminar esta transacción", 403);
    }

    await transaction.destroy();
    return json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
