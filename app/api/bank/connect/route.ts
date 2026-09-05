import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/auth-helpers";
import { BankConnection } from "@/lib/models";
import {
  createRequisition,
  deleteRequisition,
  getInstitutions,
} from "@/lib/gocardless";
import { error, handleApiError, json } from "@/lib/api";

const connectSchema = z.object({
  institutionId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const parsed = connectSchema.safeParse(body);
    if (!parsed.success) return error("Datos inválidos", 422);

    const institutionId = parsed.data.institutionId;
    const origin = new URL(req.url).origin;

    const existing = await BankConnection.findOne({ where: { userId } });
    if (existing) {
      try {
        await deleteRequisition(existing.requisitionId);
      } catch {
        // Ignore remote cleanup failures.
      }
      await existing.destroy();
    }

    const institutions = await getInstitutions("ES");
    const institution = institutions.find((i) => i.id === institutionId);

    const { requisitionId, link } = await createRequisition(
      institutionId,
      `${origin}/bank/callback`,
      userId,
    );

    await BankConnection.create({
      userId,
      institutionId,
      institutionName: institution?.name ?? null,
      requisitionId,
      status: "pending",
      accountsJson: null,
    });

    return json({ link });
  } catch (err) {
    return handleApiError(err);
  }
}