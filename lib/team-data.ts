import { cache } from "react";
import { Team, TeamMember } from "@/lib/models";
import { getSessionUserId } from "@/lib/auth-helpers";
import type { TeamRole } from "@/types";

export const getTeamForUser = cache(
  async (
    teamId: string,
  ): Promise<{ team: Team; role: TeamRole } | null> => {
    const userId = await getSessionUserId();
    if (!userId) return null;

    const member = await TeamMember.findOne({ where: { teamId, userId } });
    if (!member) return null;

    const team = await Team.findByPk(teamId);
    if (!team) return null;

    return { team, role: member.role };
  },
);
