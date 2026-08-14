import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { Invitation, Team, TeamMember } from "@/lib/models";
import { invitationActionSchema } from "@/lib/validation";
import { error, handleApiError, json } from "@/lib/api";

type Params = { params: Promise<{ id: string; invId: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id, invId } = await params;
    const user = await getSessionUser();
    if (!user) return error("No autorizado", 401);

    const invitation = await Invitation.findOne({
      where: { id: invId, teamId: id },
      include: [{ model: Team, as: "team" }],
    });
    if (!invitation) return error("Invitación no encontrada", 404);
    if (invitation.status !== "pending") {
      return error("Esta invitación ya fue respondida", 409);
    }
    if (invitation.inviteeEmail.toLowerCase() !== user.email.toLowerCase()) {
      return error("Esta invitación no es para tu email", 403);
    }

    const body = await req.json();
    const parsed = invitationActionSchema.safeParse(body);
    if (!parsed.success) return json({ error: "Acción inválida" }, 422);

    if (parsed.data.action === "reject") {
      await invitation.update({ status: "rejected" });
      return json({ ok: true, action: "rejected" });
    }

    const existing = await TeamMember.findOne({
      where: { teamId: id, userId: user.id },
    });
    if (!existing) {
      await TeamMember.create({
        teamId: id,
        userId: user.id,
        role: "member",
      });
    }

    await invitation.update({ status: "accepted" });
    return json({ ok: true, action: "accepted", teamName: invitation.team?.name });
  } catch (err) {
    return handleApiError(err);
  }
}
