import { NextRequest } from "next/server";
import { requireAdmin, requireMembership } from "@/lib/auth-helpers";
import { Category, Invitation, Team, TeamMember, Transaction } from "@/lib/models";
import { sequelize } from "@/lib/db";
import { serializeTeam } from "@/lib/serialize";
import { teamSchema } from "@/lib/validation";
import { error, handleApiError, json } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const member = await requireMembership(id);
    const team = await Team.findByPk(id);
    if (!team) return error("Equipo no encontrado", 404);

    const memberCount = await TeamMember.count({ where: { teamId: id } });

    return json(serializeTeam(team, { role: member.role, memberCount }));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await requireAdmin(id);

    const team = await Team.findByPk(id);
    if (!team) return error("Equipo no encontrado", 404);

    const body = await req.json();
    const parsed = teamSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        422,
      );
    }

    const { name, description } = parsed.data;
    await team.update({ name, description: description ?? null });

    return json(serializeTeam(team));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await requireAdmin(id);

    const team = await Team.findByPk(id);
    if (!team) return error("Equipo no encontrado", 404);

    await sequelize.transaction(async (t) => {
      await Transaction.destroy({ where: { teamId: id }, transaction: t });
      await Category.destroy({ where: { teamId: id }, transaction: t });
      await Invitation.destroy({ where: { teamId: id }, transaction: t });
      await TeamMember.destroy({ where: { teamId: id }, transaction: t });
      await team.destroy({ transaction: t });
    });

    return json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
