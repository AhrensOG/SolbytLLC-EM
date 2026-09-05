import { requireUserId } from "@/lib/auth-helpers";
import { BankConnection, ImportDraft } from "@/lib/models";
import { deleteRequisition } from "@/lib/gocardless";
import { error, handleApiError, json } from "@/lib/api";
import { sequelize } from "@/lib/db";

export async function DELETE() {
  try {
    const userId = await requireUserId();
    const connection = await BankConnection.findOne({ where: { userId } });
    if (!connection) return error("No hay ninguna cuenta bancaria conectada", 404);

    try {
      await deleteRequisition(connection.requisitionId);
    } catch {
      // Ignore remote cleanup failures.
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