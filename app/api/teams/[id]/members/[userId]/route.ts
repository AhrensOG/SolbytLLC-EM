import { NextRequest } from "next/server";
import { requireAdmin, requireUserId } from "@/lib/auth-helpers";
import { TeamMember } from "@/lib/models";
import { roleSchema } from "@/lib/validation";
import { error, handleApiError, json } from "@/lib/api";

type Params = { params: Promise<{ id: string; userId: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id, userId } = await params;
    await requireAdmin(id);

    const body = await req.json();
    const parsed = roleSchema.safeParse(body);
    if (!parsed.success) return json({ error: "Rol inválido" }, 422);

    const member = await TeamMember.findOne({ where: { teamId: id, userId } });
    if (!member) return error("Miembro no encontrado", 404);

    await member.update({ role: parsed.data.role });
    return json({ ok: true, role: member.role });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id, userId } = await params;
    const currentUserId = await requireUserId();

    const member = await TeamMember.findOne({ where: { teamId: id, userId } });
    if (!member) return error("Miembro no encontrado", 404);

    // El admin puede expulsar a cualquiera; un miembro solo puede salirse él mismo.
    const isAdmin = await TeamMember.findOne({
      where: { teamId: id, userId: currentUserId, role: "admin" },
    });
    if (!isAdmin && userId !== currentUserId) {
      return error("No tienes permisos para expulsar miembros", 403);
    }

    await member.destroy();
    return json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
