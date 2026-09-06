import { NextRequest } from "next/server";
import { z } from "zod";
import { Op } from "sequelize";
import { requireUserId } from "@/lib/auth-helpers";
import { Currency, ImportDraft, TeamMember, Transaction } from "@/lib/models";
import { computeConvertedAmount } from "@/lib/conversion";
import { copyTransactionToTeams } from "@/lib/share-transaction";
import { error, handleApiError, json } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

const actionSchema = z.object({
  action: z.enum(["confirm", "reject"]),
  categoryId: z.string().optional(),
  teamIds: z.array(z.string()).max(50).optional(),
});

const updateSchema = z.object({
  description: z.string().trim().max(255).optional(),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida").optional(),
  amount: z.coerce.number().positive("El importe debe ser mayor a 0").optional(),
});

async function ensureMembership(teamIds: string[] | undefined, userId: string) {
  if (!teamIds || teamIds.length === 0) return;
  const count = await TeamMember.count({
    where: { userId, teamId: { [Op.in]: teamIds } },
  });
  if (count !== new Set(teamIds).size) {
    throw new Error("FORBIDDEN");
  }
}

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

    await ensureMembership(parsed.data.teamIds, userId);

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
    const transaction = await Transaction.create({
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

    let shared = 0;
    if (parsed.data.teamIds && parsed.data.teamIds.length > 0) {
      const result = await copyTransactionToTeams(transaction, parsed.data.teamIds);
      shared = result.created;
    }

    return json({ ok: true, shared });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const draft = await ImportDraft.findOne({ where: { id, userId } });
    if (!draft) return error("Movimiento no encontrado", 404);

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return error("Datos inválidos", 422);

    await draft.update({
      ...(parsed.data.description !== undefined
        ? { description: parsed.data.description }
        : {}),
      ...(parsed.data.bookingDate !== undefined
        ? { bookingDate: parsed.data.bookingDate }
        : {}),
      ...(parsed.data.amount !== undefined ? { amount: parsed.data.amount } : {}),
    });

    return json({
      id: draft.id,
      amount: Number(draft.amount),
      currencyCode: draft.currencyCode,
      bookingDate: draft.bookingDate,
      description: draft.description,
      counterpartyName: draft.counterpartyName,
      categoryId: draft.categoryId,
      status: draft.status,
      createdAt: draft.createdAt,
    });
  } catch (err) {
    return handleApiError(err);
  }
}