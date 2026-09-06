import { NextRequest } from "next/server";
import { z } from "zod";
import { Op } from "sequelize";
import { requireUserId } from "@/lib/auth-helpers";
import {
  Currency,
  ImportDraft,
  TeamMember,
  Transaction,
} from "@/lib/models";
import { computeConvertedAmount } from "@/lib/conversion";
import { copyTransactionToTeams } from "@/lib/share-transaction";
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

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const connectionId = new URL(req.url).searchParams.get("connectionId");

    const where: Record<string, unknown> = { userId, status: "pending" };
    if (connectionId) where.connectionId = connectionId;

    const drafts = await ImportDraft.findAll({
      where,
      order: [["bookingDate", "DESC"], ["createdAt", "DESC"]],
    });
    return json(drafts.map(serializeDraft));
  } catch (err) {
    return handleApiError(err);
  }
}

const bulkSchema = z.object({
  action: z.enum(["confirm", "reject"]).default("confirm"),
  ids: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  categories: z.record(z.string(), z.string()).optional(),
  teamIds: z.array(z.string()).max(50).optional(),
});

async function ensureTeamMembership(
  teamIds: string[] | undefined,
  userId: string,
) {
  if (!teamIds || teamIds.length === 0) return;
  const count = await TeamMember.count({
    where: { userId, teamId: { [Op.in]: teamIds } },
  });
  if (count !== new Set(teamIds).size) {
    throw new Error("FORBIDDEN");
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json().catch(() => ({}));
    const parsed = bulkSchema.safeParse(body);

    const teamIds = parsed.success ? parsed.data.teamIds : undefined;
    await ensureTeamMembership(teamIds, userId);

    const where: Record<string, unknown> = { userId, status: "pending" };
    if (parsed.success && parsed.data.ids && parsed.data.ids.length > 0) {
      where.id = { [Op.in]: parsed.data.ids };
    }

    const drafts = await ImportDraft.findAll({
      where,
      order: [["bookingDate", "ASC"]],
    });

    if (parsed.success && parsed.data.action === "reject") {
      await ImportDraft.update(
        { status: "rejected" },
        { where: { id: { [Op.in]: drafts.map((d) => d.id) } } },
      );
      return json({ rejected: drafts.length });
    }

    let confirmed = 0;
    let skipped = 0;
    let shared = 0;

    const globalCategoryId = parsed.success ? parsed.data.categoryId : undefined;
    const categories = parsed.success ? parsed.data.categories : undefined;

    for (const draft of drafts) {
      const categoryId =
        draft.categoryId ??
        (categories && categories[draft.id]) ??
        globalCategoryId;
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
      confirmed += 1;

      if (teamIds && teamIds.length > 0) {
        const result = await copyTransactionToTeams(transaction, teamIds);
        shared += result.created;
      }
    }

    return json({ confirmed, skipped, shared });
  } catch (err) {
    return handleApiError(err);
  }
}