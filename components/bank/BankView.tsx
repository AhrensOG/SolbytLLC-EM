"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { Landmark, Link2, Plus, RefreshCw, Search, Unlink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { useCategories } from "@/lib/hooks/useCategories";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";

const COUNTRIES = [
  { code: "ES", label: "España" },
  { code: "FR", label: "Francia" },
  { code: "DE", label: "Alemania" },
  { code: "IT", label: "Italia" },
  { code: "PT", label: "Portugal" },
  { code: "NL", label: "Países Bajos" },
  { code: "BE", label: "Bélgica" },
  { code: "IE", label: "Irlanda" },
  { code: "AT", label: "Austria" },
  { code: "PL", label: "Polonia" },
];

interface BankStatus {
  connected: boolean;
  pendingCount: number;
  connection: {
    id: string;
    institutionId: string | null;
    institutionName: string | null;
    status: string | null;
    validUntil: string | null;
    lastSyncedAt: string | null;
    accountCount: number;
  } | null;
}

interface Institution {
  id: string;
  name: string;
  country: string;
}

interface BankDraft {
  id: string;
  amount: number;
  currencyCode: string;
  bookingDate: string;
  description: string;
  categoryId: string | null;
  status: "pending" | "confirmed" | "rejected";
}

function money(draft: BankDraft) {
  return `${draft.amount < 0 ? "-" : "+"}${formatMoney(Math.abs(draft.amount), draft.currencyCode)}`;
}

export function BankView() {
  const { mutate } = useSWRConfig();
  const { data: status, isLoading: statusLoading } = useSWR<BankStatus>(
    "/api/bank/status",
  );
  const { data: drafts, isLoading: draftsLoading } = useSWR<BankDraft[]>(
    "/api/bank/drafts",
  );
  const { data: categories } = useCategories();

  const [institutionsOpen, setInstitutionsOpen] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [institutionsLoading, setInstitutionsLoading] = useState(false);
  const [country, setCountry] = useState("ES");
  const [search, setSearch] = useState("");
  const [linking, setLinking] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pendingCategoryId, setPendingCategoryId] = useState("");
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [disconnecting, setDisconnecting] = useState(false);

  const autoSynced = useRef(false);

  const pending = (drafts ?? []).filter((d) => d.status === "pending");

  useEffect(() => {
    if (autoSynced.current) return;
    if (status?.connected) {
      autoSynced.current = true;
      void syncNow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.connected]);

  async function loadInstitutions(countryCode: string) {
    setInstitutionsLoading(true);
    try {
      const res = await fetch(`/api/bank/institutions?country=${countryCode}`);
      if (!res.ok) throw new Error();
      setInstitutions(await res.json());
    } catch {
      toast.error("No se pudieron cargar los bancos");
    } finally {
      setInstitutionsLoading(false);
    }
  }

  async function openInstitutions() {
    setInstitutionsOpen(true);
    if (institutions.length === 0) {
      void loadInstitutions(country);
    }
  }

  async function handleCountryChange(code: string) {
    setCountry(code);
    setSearch("");
    void loadInstitutions(code);
  }

  async function handleLink(institutionId: string) {
    setLinking(true);
    const res = await fetch("/api/bank/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ institutionId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setLinking(false);
      toast.error(body?.error ?? "No se pudo iniciar la conexión");
      return;
    }
    const data = await res.json();
    window.location.href = data.link;
  }

  async function handleRenew() {
    if (!status?.connection?.institutionId) return;
    setLinking(true);
    const res = await fetch("/api/bank/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ institutionId: status.connection.institutionId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setLinking(false);
      toast.error(body?.error ?? "No se pudo renovar el acceso");
      return;
    }
    const data = await res.json();
    window.location.href = data.link;
  }

  async function syncNow() {
    setSyncing(true);
    const res = await fetch("/api/bank/sync?days=30", { method: "POST" });
    setSyncing(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(body?.error ?? "No se pudo sincronizar el banco");
      return;
    }
    const data = await res.json();
    await mutate("/api/bank/status");
    await mutate("/api/bank/drafts");
    toast.success(
      data.created > 0
        ? `Sincronizado: ${data.created} movimiento${data.created === 1 ? "" : "s"} nuevo${data.created === 1 ? "" : "s"}`
        : "Sin movimientos nuevos",
    );
  }

  async function handleDraftAction(id: string, action: "confirm" | "reject") {
    const categoryId = categoryMap[id] ?? pendingCategoryId;
    if (action === "confirm" && !categoryId) {
      toast.error("Selecciona una categoría");
      return;
    }
    const res = await fetch(`/api/bank/drafts/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, categoryId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(body?.error ?? "No se pudo procesar el movimiento");
      return;
    }
    await mutate("/api/bank/drafts");
    await mutate("/api/bank/status");
    await mutate((key) => typeof key === "string" && key.startsWith("/api/transactions"));
    await mutate((key) => typeof key === "string" && key.startsWith("/api/stats"));
    toast.success(action === "confirm" ? "Movimiento confirmado" : "Movimiento descartado");
  }

  async function handleConfirmAll() {
    setConfirming(true);
    const res = await fetch("/api/bank/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: pendingCategoryId || undefined }),
    });
    setConfirming(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(body?.error ?? "No se pudieron confirmar los movimientos");
      return;
    }
    const data = await res.json();
    await mutate("/api/bank/drafts");
    await mutate("/api/bank/status");
    await mutate((key) => typeof key === "string" && key.startsWith("/api/transactions"));
    await mutate((key) => typeof key === "string" && key.startsWith("/api/stats"));
    toast.success(
      data.skipped > 0
        ? `${data.confirmed} confirmados · ${data.skipped} requieren categoría`
        : `${data.confirmed} confirmados`,
    );
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    const res = await fetch("/api/bank", { method: "DELETE" });
    setDisconnecting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      toast.error(body?.error ?? "No se pudo desconectar");
      return;
    }
    await mutate("/api/bank/status");
    await mutate("/api/bank/drafts");
    toast.success("Cuenta bancaria desconectada");
  }

  if (statusLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="space-y-4 p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-10 w-40" />
        </Card>
      </div>
    );
  }

  const filteredInstitutions = institutions.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      {status?.connected && status.connection ? (
        <Card className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-card-foreground">
                  {status.connection.institutionName ?? "Cuenta conectada"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {status.connection.accountCount} cuenta
                  {status.connection.accountCount === 1 ? "" : "s"} · Última
                  sincronización:{" "}
                  {status.connection.lastSyncedAt
                    ? new Date(status.connection.lastSyncedAt).toLocaleString("es")
                    : "nunca"}
                </p>
                {status.connection.validUntil && (
                  <p className="text-xs text-muted-foreground">
                    Acceso válido hasta{" "}
                    {new Date(status.connection.validUntil).toLocaleDateString("es")}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button size="sm" variant="outline" loading={syncing} onClick={syncNow}>
                <RefreshCw className="h-4 w-4" /> Sincronizar
              </Button>
              <Button
                size="sm"
                variant="outline"
                loading={linking}
                onClick={handleRenew}
              >
                Renovar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10"
                loading={disconnecting}
                onClick={handleDisconnect}
              >
                <Unlink className="h-4 w-4" /> Desconectar
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Link2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-card-foreground">
                  Conecta tu banco
                </h3>
                <p className="text-sm text-muted-foreground">
                  Importa tus movimientos automáticamente (solo lectura, vía
                  open banking / Enable Banking).
                </p>
              </div>
            </div>
            <Button onClick={openInstitutions}>
              <Plus className="h-4 w-4" /> Conectar banco
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-card-foreground">
            Movimientos del banco
          </h3>
          {pending.length > 0 && (
            <Button size="sm" loading={confirming} onClick={handleConfirmAll}>
              Confirmar todo
            </Button>
          )}
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          Revisa y confirma los movimientos importados. Los confirmados se
          agregan a tus transacciones; los descartados se ignoran.
        </p>

        {pending.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <Select
              label="Categoría para todos"
              value={pendingCategoryId}
              onChange={(e) => setPendingCategoryId(e.target.value)}
              className="max-w-xs"
            >
              <option value="">Sin categoría</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        {draftsLoading ? (
          <ListSkeleton rows={4} />
        ) : pending.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title="Sin movimientos pendientes"
            description={
              status?.connected
                ? "Pulsa «Sincronizar» para buscar movimientos nuevos en tu banco."
                : "Conecta tu banco para empezar a importar movimientos."
            }
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {pending.map((draft) => (
              <li
                key={draft.id}
                className="flex flex-col gap-3 rounded-xl border border-border p-3 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-card-foreground">
                    {draft.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(draft.bookingDate)} · {draft.currencyCode}
                  </p>
                </div>

                <span
                  className={cn(
                    "text-sm font-semibold",
                    draft.amount < 0 ? "text-expense" : "text-income",
                  )}
                >
                  {money(draft)}
                </span>

                <div className="flex items-center gap-2">
                  <Select
                    aria-label="Categoría"
                    value={categoryMap[draft.id] ?? draft.categoryId ?? ""}
                    onChange={(e) =>
                      setCategoryMap((prev) => ({
                        ...prev,
                        [draft.id]: e.target.value,
                      }))
                    }
                    className="h-9 w-36 py-1 text-xs"
                  >
                    <option value="">Categoría</option>
                    {(categories ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleDraftAction(draft.id, "confirm")
                    }
                  >
                    Confirmar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={() => handleDraftAction(draft.id, "reject")}
                  >
                    Ignorar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={institutionsOpen}
        onClose={() => setInstitutionsOpen(false)}
        title="Selecciona tu banco"
      >
        <div className="flex flex-col gap-4">
          <Select
            label="País"
            value={country}
            onChange={(e) => handleCountryChange(e.target.value)}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </Select>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Buscar banco"
              placeholder="Buscar banco…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {institutionsLoading ? (
            <ListSkeleton rows={5} />
          ) : (
            <ul className="max-h-80 flex-col gap-1 overflow-y-auto">
              {filteredInstitutions.map((institution) => (
                <li key={institution.id}>
                  <button
                    type="button"
                    disabled={linking}
                    onClick={() => handleLink(institution.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-muted"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Landmark className="h-4 w-4" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-card-foreground">
                      {institution.name}
                    </span>
                    <span className="text-xs uppercase text-muted-foreground">
                      {institution.country}
                    </span>
                  </button>
                </li>
              ))}
              {filteredInstitutions.length === 0 && (
                <li className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No se encontraron bancos
                </li>
              )}
            </ul>
          )}
        </div>
      </Modal>
    </div>
  );
}