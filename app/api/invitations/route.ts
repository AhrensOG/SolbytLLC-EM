import { getSessionUser } from "@/lib/auth-helpers";
import { Invitation, Team, User } from "@/lib/models";
import { serializeInvitation } from "@/lib/serialize";
import { handleApiError, json, unauthorized } from "@/lib/api";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const invitations = await Invitation.findAll({
      where: { inviteeEmail: user.email.toLowerCase(), status: "pending" },
      include: [
        { model: Team, as: "team" },
        { model: User, as: "invitedBy" },
      ],
      order: [["createdAt", "DESC"]],
    });

    return json(invitations.map((inv) => serializeInvitation(inv)));
  } catch (err) {
    return handleApiError(err);
  }
}
