import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth-helpers";
import { Currency, ImportDraft, Transaction } from "@/lib/models";
import { computeConvertedAmount } from "@/lib/conversion";
import { error, handleApiError, json } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

const actionSchema = z.object({
  action: z.enum(["confirm", "reject"]),
  categoryId: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const draft = await ImportDraft.findOne({ where: { id, userId } });
    if (!draft) return error("Movimiento no encontrado", 404);

    const body = await req.json();
    const parsed = actionSchema.safeParse(body);
    if (!parsed.success) return error("Datos inválidos", 422);

    if (parsed.data.action === "reject") {
      await draft.update({ status: "rejected" });
      return json({ ok: true });
    }

    const categoryId = draft.categoryId ?? parsed.data.categoryId;
    if (!categoryId) return error("Selecciona una categoría para confirmar", 422);

    const currency = await Currency.findOne({
      where: { code: draft.currencyCode.toUpperCase() },
    });
    const fallback = await Currency.findOne({ where: { code: "USD" } });
    const currencyId = currency?.id ?? fallback?.id;
    if (!currencyId) return error("Moneda no soportada", 422);

    const convertedAmount = await computeConvertedAmount(
      Math.abs(draft.amount),
      currencyId,
    );
    await Transaction.create({
      type: draft.amount < 0 ? "expense" : "income",
      amount: Math.abs(draft.amount),
      convertedAmount,
      currencyId,
      description: draft.description,
      date: draft.bookingDate,
      categoryId,
      userId,
      teamId: null,
      importKey: draft.transactionExternalId,
    });
    await draft.update({ status: "confirmed", categoryId });

    return json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}