import { NextRequest } from "next/server";
import { requireMembership, requireUserId } from "@/lib/auth-helpers";
import { TeamMember } from "@/lib/models";
import { memberGoalSchema } from "@/lib/validation";
import { error, handleApiError, json } from "@/lib/api";

type Params = { params: Promise<{ id: string; userId: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id, userId } = await params;
    const currentUserId = await requireUserId();
    await requireMembership(id);

    const member = await TeamMember.findOne({ where: { teamId: id, userId } });
    if (!member) return error("Miembro no encontrado", 404);

    const isAdmin = await TeamMember.findOne({
      where: { teamId: id, userId: currentUserId, role: "admin" },
    });
    if (!isAdmin && userId !== currentUserId) {
      return error("Solo puedes editar tu propia meta", 403);
    }

    const body = await req.json();
    const parsed = memberGoalSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
        422,
      );
    }

    await member.update({
      individualGoalAmount: parsed.data.individualGoalAmount,
    });

    return json({
      userId: member.userId,
      individualGoalAmount: member.individualGoalAmount,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
