import { requireUserId } from "@/lib/auth-helpers";
import { BankConnection, ImportDraft } from "@/lib/models";
import { deleteSession } from "@/lib/enablebanking";
import { error, handleApiError, json } from "@/lib/api";
import { sequelize } from "@/lib/db";

export async function DELETE() {
  try {
    const userId = await requireUserId();
    const connection = await BankConnection.findOne({ where: { userId } });
    if (!connection) return error("No hay ninguna cuenta bancaria conectada", 404);

    if (connection.sessionId) {
      try {
        await deleteSession(connection.sessionId);
      } catch {
        // Ignore remote cleanup failures.
      }
    }

    await sequelize.transaction(async (t) => {
      await ImportDraft.destroy({ where: { userId }, transaction: t });
      await connection.destroy({ transaction: t });
    });

    return json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}