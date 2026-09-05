import useSWR from "swr";

export interface SharedTeam {
  teamId: string;
  copyId: string;
  teamName: string;
}

export function useTransactionTeams(txId: string | null) {
  return useSWR<SharedTeam[]>(
    txId ? `/api/transactions/${txId}/teams` : null,
  );
}