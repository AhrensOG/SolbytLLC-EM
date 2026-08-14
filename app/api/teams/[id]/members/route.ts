import { NextRequest } from "next/server";
import { requireMembership } from "@/lib/auth-helpers";
import { TeamMember, User } from "@/lib/models";
import { serializeMember } from "@/lib/serialize";
import { handleApiError, json } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    await requireMembership(id);

    const members = await TeamMember.findAll({
      where: { teamId: id },
      include: [{ model: User, as: "user" }],
      order: [["joinedAt", "ASC"]],
    });

    return json(members.map(serializeMember));
  } catch (err) {
    return handleApiError(err);
  }
}
