import { requireUserId } from "@/lib/auth-helpers";
import { Transaction } from "@/lib/models";
import { error, handleApiError, json } from "@/lib/api";

type Params = { params: Promise<{ id: string; teamId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id, teamId } = await params;

    const copy = await Transaction.findOne({
      where: {
        userId,
        teamId,
        importKey: `imp:${id}:${teamId}`,
      },
    });
    if (!copy) return error("La transacción no está en ese equipo", 404);

    await copy.destroy();
    return json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}