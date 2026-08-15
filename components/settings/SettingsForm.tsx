"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { useMe } from "@/lib/hooks/useMe";
import { useCurrencies } from "@/lib/hooks/useCurrencies";
import { SignOutButton } from "@/components/layout/SignOutButton";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Currency, PublicUser } from "@/types";

export function SettingsForm() {
  const { data: me, isLoading } = useMe();
  const { data: currencies } = useCurrencies();

  if (isLoading || !me) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="space-y-4 p-6">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-40" />
        </Card>
      </div>
    );
  }

  return <SettingsFormInner me={me} currencies={currencies ?? []} />;
}

function SettingsFormInner({
  me,
  currencies,
}: {
  me: PublicUser;
  currencies: Currency[];
}) {
  const { mutate } = useSWRConfig();
  const [name, setName] = useState(me.name);
  const [defaultCurrencyId, setDefaultCurrencyId] = useState(
    me.defaultCurrencyId ?? "",
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, defaultCurrencyId: defaultCurrencyId || null }),
    });

    if (!res.ok) {
      setLoading(false);
      toast.error("No se pudieron guardar los cambios");
      return;
    }

    setLoading(false);
    await mutate("/api/users/me");
    toast.success("Cambios guardados");
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <h3 className="mb-4 text-base font-semibold text-card-foreground">
          Perfil
        </h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            value={me.email}
            disabled
            hint="El email no se puede modificar."
          />
          <Input
            label="Nombre"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Select
            label="Moneda por defecto"
            value={defaultCurrencyId}
            onChange={(e) => setDefaultCurrencyId(e.target.value)}
          >
            <option value="">Seleccionar moneda</option>
            {currencies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} ({c.symbol})
              </option>
            ))}
          </Select>
          <Button type="submit" loading={loading} className="self-start">
            Guardar cambios
          </Button>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-base font-semibold text-card-foreground">
          Contraseña
        </h3>
        <PasswordCard />
      </Card>

      <Card className="p-6">
        <h3 className="mb-2 text-base font-semibold text-card-foreground">
          Sesión
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Cierra tu sesión actual en este dispositivo.
        </p>
        <SignOutButton />
      </Card>
    </div>
  );
}

function PasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/users/me/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });

    if (!res.ok) {
      setLoading(false);
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "No se pudo cambiar la contraseña");
      return;
    }

    setLoading(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Contraseña actualizada");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Contraseña actual"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        required
      />
      <Input
        label="Nueva contraseña"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        hint="Mínimo 6 caracteres."
      />
      <Input
        label="Confirmar nueva contraseña"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        error={error ?? undefined}
      />
      <Button type="submit" loading={loading} className="self-start">
        Cambiar contraseña
      </Button>
    </form>
  );
}
