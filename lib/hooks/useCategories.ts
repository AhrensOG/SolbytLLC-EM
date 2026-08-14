import useSWR from "swr";
import type { Category } from "@/types";

export function useCategories(params?: { type?: string }) {
  const qs = new URLSearchParams();
  if (params?.type) qs.set("type", params.type);
  const query = qs.toString();
  return useSWR<Category[]>(`/api/categories${query ? `?${query}` : ""}`);
}
