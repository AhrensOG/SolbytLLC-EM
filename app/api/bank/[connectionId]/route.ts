import { requireUserId } from "@/lib/auth-helpers";
import { BankConnection, ImportDraft } from "@/lib/models";
import { deleteSession } from "@/lib/enablebanking";
import { error, handleApiError, json } from "@/lib/api";
import { sequelize } from "@/lib/db";

type Params = { params: Promise<{ connectionId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { connectionId } = await params;

    const connection = await BankConnection.findOne({
      where: { id: connectionId, userId },
    });
    if (!connection) return error("Cuenta bancaria no encontrada", 404);

    if (connection.sessionId) {
      try {
        await deleteSession(connection.sessionId);
      } catch {
        // Ignore remote cleanup failures.
      }
    }

    await sequelize.transaction(async (t) => {
      await ImportDraft.destroy({
        where: { userId, connectionId },
        transaction: t,
      });
      await connection.destroy({ transaction: t });
    });

    return json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}