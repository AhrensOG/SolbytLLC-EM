import useSWR from "swr";
import type { Team } from "@/types";

export function useTeams() {
  return useSWR<Team[]>("/api/teams", { keepPreviousData: true });
}
