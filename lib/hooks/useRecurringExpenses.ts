import useSWR from "swr";
import type { RecurringExpense } from "@/types";

export function useRecurringExpenses(teamId?: string) {
  const qs = teamId ? `?teamId=${encodeURIComponent(teamId)}` : "";
  return useSWR<RecurringExpense[]>(`/api/recurring-expenses${qs}`, {
    keepPreviousData: true,
  });
}
