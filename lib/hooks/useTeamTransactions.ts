import useSWR from "swr";
import type { Transaction } from "@/types";

export interface TeamTransactionFilters {
  type?: string;
  categoryId?: string;
  month?: string;
}

export function useTeamTransactions(teamId: string, filters?: TeamTransactionFilters) {
  const qs = new URLSearchParams();
  if (filters?.type) qs.set("type", filters.type);
  if (filters?.categoryId) qs.set("categoryId", filters.categoryId);
  if (filters?.month) qs.set("month", filters.month);
  const query = qs.toString();
  return useSWR<Transaction[]>(
    `/api/teams/${teamId}/transactions${query ? `?${query}` : ""}`,
  );
}
