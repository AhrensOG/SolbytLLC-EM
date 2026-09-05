import { Op } from "sequelize";
import { requireUserId } from "@/lib/auth-helpers";
import { Team, Transaction } from "@/lib/models";
import { error, handleApiError, json } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const source = await Transaction.findOne({
      where: { id, userId, teamId: null },
    });
    if (!source) return error("Transacción no encontrada", 404);

    const copies = await Transaction.findAll({
      where: {
        userId,
        teamId: { [Op.ne]: null },
        importKey: { [Op.like]: `imp:${source.id}:%` },
      },
      include: [{ model: Team, as: "team" }],
    });

    return json(
      copies.map((copy) => ({
        teamId: copy.teamId,
        copyId: copy.id,
        teamName: (copy as unknown as { team?: Team }).team?.name ?? "Equipo",
      })),
    );
  } catch (err) {
    return handleApiError(err);
  }
}