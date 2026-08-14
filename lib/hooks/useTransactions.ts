import useSWR from "swr";
import type { Transaction } from "@/types";

export interface TransactionFilters {
  type?: string;
  categoryId?: string;
  month?: string;
}

export function useTransactions(filters?: TransactionFilters) {
  const qs = new URLSearchParams();
  if (filters?.type) qs.set("type", filters.type);
  if (filters?.categoryId) qs.set("categoryId", filters.categoryId);
  if (filters?.month) qs.set("month", filters.month);
  const query = qs.toString();
  return useSWR<Transaction[]>(
    `/api/transactions${query ? `?${query}` : ""}`,
  );
}
