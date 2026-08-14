import { NextRequest } from "next/server";
import { requireMembership, requireUserId } from "@/lib/auth-helpers";
import { Invitation, Team, TeamMember, User } from "@/lib/models";
import { serializeInvitation } from "@/lib/serialize";
import { inviteSchema } from "@/lib/validation";
import { error, handleApiError, json } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await requireMembership(id);

    const invitations = await Invitation.findAll({
      where: { teamId: id, status: "pending" },
      include: [{ model: User, as: "invitedBy" }],
      order: [["createdAt", "DESC"]],
    });

    return json(invitations.map((inv) => serializeInvitation(inv)));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const userId = await requireUserId();
    await requireMembership(id);

    const body = await req.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        422,
      );
    }

    const email = parsed.data.email;
    const team = await Team.findByPk(id);
    if (!team) return error("Equipo no encontrado", 404);

    const invitee = await User.findOne({ where: { email } });
    if (invitee) {
      const alreadyMember = await TeamMember.findOne({
        where: { teamId: id, userId: invitee.id },
      });
      if (alreadyMember) return error("Este usuario ya es miembro del equipo", 409);
    }

    const duplicate = await Invitation.findOne({
      where: { teamId: id, inviteeEmail: email, status: "pending" },
    });
    if (duplicate) return error("Ya existe una invitación pendiente para este email", 409);

    const invitation = await Invitation.create({
      teamId: id,
      invitedByUserId: userId,
      inviteeEmail: email,
      status: "pending",
    });

    return json(serializeInvitation(invitation, team.name), 201);
  } catch (err) {
    return handleApiError(err);
  }
}
