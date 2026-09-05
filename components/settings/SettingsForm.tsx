"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
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

      {me.hasPassword && (
        <Card className="p-6">
          <h3 className="mb-4 text-base font-semibold text-card-foreground">
            Contraseña
          </h3>
          <PasswordCard />
        </Card>
      )}

      <Card className="p-6">
        <h3 className="mb-2 text-base font-semibold text-card-foreground">
          Sesión
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Cierra tu sesión actual en este dispositivo.
        </p>
        <SignOutButton />
      </Card>

      <DeleteAccountCard hasPassword={me.hasPassword} />
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

function DeleteAccountCard({ hasPassword }: { hasPassword: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/users/me", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      setLoading(false);
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "No se pudo eliminar la cuenta");
      return;
    }

    toast.success("Cuenta eliminada. ¡Hasta pronto!");
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  }

  return (
    <Card className="border-destructive/40 p-6">
      <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-card-foreground">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        Zona de peligro
      </h3>
      <p className="mb-4 text-sm text-muted-foreground">
        Eliminar tu cuenta borra de forma permanente tu perfil, tus
        transacciones y tus categorías personales. Si eres administrador de un
        equipo con otros miembros, la administración se transferirá a otro
        miembro. Esta acción no se puede deshacer.
      </p>
      <Button
        variant="destructive"
        onClick={() => setOpen(true)}
        className="self-start"
      >
        Eliminar mi cuenta
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Eliminar cuenta">
        <form onSubmit={handleDelete} className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Esta acción es permanente: se borrarán tu perfil y todos tus datos.
            Para continuar, {hasPassword ? "introduce tu contraseña" : "confirma la eliminación"}.
          </p>
          {hasPassword && (
            <Input
              label="Contraseña"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" loading={loading}>
              Eliminar mi cuenta
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
