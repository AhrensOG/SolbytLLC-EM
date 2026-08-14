"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function InviteForm({ teamId }: { teamId: string }) {
  const { mutate } = useSWRConfig();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch(`/api/teams/${teamId}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setLoading(false);
      toast.error(body?.error ?? "No se pudo enviar la invitación");
      return;
    }

    setLoading(false);
    setEmail("");
    await mutate(`/api/teams/${teamId}/invitations`);
    toast.success("Invitación enviada");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Input
          label="Invitar por email"
          name="email"
          type="email"
          placeholder="ejemplo@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <Button type="submit" loading={loading}>
        <Mail className="h-4 w-4" /> Invitar
      </Button>
    </form>
  );
}
