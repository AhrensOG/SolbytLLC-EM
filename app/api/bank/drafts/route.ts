import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth-helpers";
import { Currency, ImportDraft, Transaction } from "@/lib/models";
import { computeConvertedAmount } from "@/lib/conversion";
import { handleApiError, json } from "@/lib/api";

function serializeDraft(draft: ImportDraft) {
  return {
    id: draft.id,
    amount: Number(draft.amount),
    currencyCode: draft.currencyCode,
    bookingDate: draft.bookingDate,
    description: draft.description,
    counterpartyName: draft.counterpartyName,
    categoryId: draft.categoryId,
    status: draft.status,
    createdAt: draft.createdAt,
  };
}

export async function GET() {
  try {
    const userId = await requireUserId();
    const drafts = await ImportDraft.findAll({
      where: { userId, status: "pending" },
      order: [["bookingDate", "DESC"], ["createdAt", "DESC"]],
    });
    return json(drafts.map(serializeDraft));
  } catch (err) {
    return handleApiError(err);
  }
}

const confirmAllSchema = z.object({
  categoryId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json().catch(() => ({}));
    const parsed = confirmAllSchema.safeParse(body);

    const drafts = await ImportDraft.findAll({
      where: { userId, status: "pending" },
      order: [["bookingDate", "ASC"]],
    });

    let confirmed = 0;
    let skipped = 0;

    const globalCategoryId = parsed.success ? parsed.data.categoryId : undefined;

    for (const draft of drafts) {
      const categoryId = draft.categoryId ?? globalCategoryId;
      if (!categoryId) {
        skipped += 1;
        continue;
      }

      const currency = await Currency.findOne({
        where: { code: draft.currencyCode.toUpperCase() },
      });
      const fallback = await Currency.findOne({ where: { code: "USD" } });
      const currencyId = currency?.id ?? fallback?.id;
      if (!currencyId) {
        skipped += 1;
        continue;
      }

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
      confirmed += 1;
    }

    return json({ confirmed, skipped });
  } catch (err) {
    return handleApiError(err);
  }
}