"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TransactionForm } from "@/components/transactions/TransactionForm";

export function NewTeamTransactionButton({ teamId }: { teamId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Nueva transacción</span>
        <span className="sm:hidden">Nueva</span>
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva transacción">
        <TransactionForm teamId={teamId} onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}