import useSWR from "swr";
import type { TeamMemberInfo } from "@/types";

export function useTeamMembers(teamId: string) {
  return useSWR<TeamMemberInfo[]>(`/api/teams/${teamId}/members`);
}
