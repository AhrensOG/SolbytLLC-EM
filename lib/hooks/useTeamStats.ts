import useSWR from "swr";
import type { TeamStats } from "@/types";

export function useTeamStats(teamId: string, month?: string, currencyCode?: string) {
  const qs = new URLSearchParams();
  if (month) qs.set("month", month);
  if (currencyCode) qs.set("currency", currencyCode);
  const query = qs.toString();
  return useSWR<TeamStats>(
    `/api/teams/${teamId}/stats${query ? `?${query}` : ""}`,
  );
}
