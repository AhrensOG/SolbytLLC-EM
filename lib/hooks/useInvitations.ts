import useSWR from "swr";
import type { Invitation } from "@/types";

export function useInvitations() {
  return useSWR<Invitation[]>("/api/invitations");
}
