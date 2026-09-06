import { requireUserId } from "@/lib/auth-helpers";
import { BankConnection, ImportDraft } from "@/lib/models";
import { handleApiError, json } from "@/lib/api";

export async function GET() {
  try {
    const userId = await requireUserId();

    const connection = await BankConnection.findOne({ where: { userId } });
    const pendingCount = await ImportDraft.count({
      where: { userId, status: "pending" },
    });

    return json({
      connected: !!connection,
      pendingCount,
      connection: connection
        ? {
            id: connection.id,
            institutionId: connection.institutionId,
            institutionName: connection.institutionName,
            status: connection.status,
            validUntil: connection.validUntil
              ? new Date(connection.validUntil).toISOString()
              : null,
            lastSyncedAt: connection.lastSyncedAt,
            accountCount: connection.accountsJson
              ? (JSON.parse(connection.accountsJson) as unknown[]).length
              : 0,
          }
        : null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}