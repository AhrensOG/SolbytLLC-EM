import { requireUserId } from "@/lib/auth-helpers";
import { BankConnection, ImportDraft } from "@/lib/models";
import { handleApiError, json } from "@/lib/api";

export async function GET() {
  try {
    const userId = await requireUserId();

    const connections = await BankConnection.findAll({
      where: { userId },
      order: [["createdAt", "ASC"]],
    });

    const pendingCounts = await ImportDraft.findAll({
      where: { userId, status: "pending" },
      attributes: ["connectionId"],
      raw: true,
    });
    const pendingMap: Record<string, number> = {};
    for (const row of pendingCounts) {
      const id = String(row.connectionId);
      pendingMap[id] = (pendingMap[id] ?? 0) + 1;
    }

    const totalPending = Object.values(pendingMap).reduce((a, b) => a + b, 0);

    return json({
      connections: connections.map((c) => ({
        id: c.id,
        institutionId: c.institutionId,
        institutionName: c.institutionName,
        accountName: c.accountName,
        accountIban: c.accountIban,
        accountCurrency: c.accountCurrency,
        status: c.status,
        validUntil: c.validUntil ? new Date(c.validUntil).toISOString() : null,
        lastSyncedAt: c.lastSyncedAt,
        pendingCount: c.id ? pendingMap[c.id] ?? 0 : 0,
      })),
      totalPending,
    });
  } catch (err) {
    return handleApiError(err);
  }
}