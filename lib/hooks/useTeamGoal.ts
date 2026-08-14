import useSWR from "swr";
import type { TeamGoalInfo } from "@/types";

export function useTeamGoal(teamId: string) {
  return useSWR<TeamGoalInfo>(`/api/teams/${teamId}/goal`);
}
