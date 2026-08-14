import useSWR from "swr";
import type { Stats } from "@/types";

export function useStats(month?: string, currencyCode?: string) {
  const qs = new URLSearchParams();
  if (month) qs.set("month", month);
  if (currencyCode) qs.set("currency", currencyCode);
  const query = qs.toString();
  return useSWR<Stats>(`/api/stats${query ? `?${query}` : ""}`);
}
