import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { Op } from "sequelize";
import { requireUserId } from "@/lib/auth-helpers";
import { BankConnection } from "@/lib/models";
import { startAuth } from "@/lib/enablebanking";
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

    const [name, country] = parsed.data.institutionId.split("|");
    if (!name || !country) return error("Banco inválido", 422);

    const baseUrl = process.env.AUTH_URL ?? new URL(req.url).origin;

    // Remove only pending connections (not yet authorized).
    await BankConnection.destroy({
      where: { userId, authState: { [Op.ne]: null } },
    });

    const state = randomUUID();
    const { url } = await startAuth({
      aspsp: { name, country },
      redirectUrl: `${baseUrl}/bank/callback`,
      state,
    });

    await BankConnection.create({
      userId,
      institutionId: `${name}|${country}`,
      institutionName: name,
      authState: state,
      status: "pending",
    });

    return json({ link: url });
  } catch (err) {
    return handleApiError(err);
  }
}