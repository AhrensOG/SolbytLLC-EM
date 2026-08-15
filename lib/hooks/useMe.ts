import useSWR from "swr";
import type { PublicUser } from "@/types";

export function useMe() {
  return useSWR<PublicUser>("/api/users/me", { keepPreviousData: true });
}
