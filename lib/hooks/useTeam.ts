import useSWR from "swr";
import type { Team } from "@/types";

export function useTeam(teamId: string) {
  return useSWR<Team>(`/api/teams/${teamId}`, {
    keepPreviousData: true,
    shouldRetryOnError: false,
  });
}