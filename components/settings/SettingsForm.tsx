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
import { PageLoader } from "@/components/ui/Spinner";
import type { Currency, PublicUser } from "@/types";

export function SettingsForm() {
  const { data: me, isLoading } = useMe();
  const { data: currencies } = useCurrencies();

  if (isLoading || !me) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="p-6">
          <PageLoader />
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
