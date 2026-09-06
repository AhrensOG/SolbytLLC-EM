"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import Link from "next/link";
import { preloadBankDetail } from "@/lib/nav-prefetch";
import { Landmark, Link2, Plus, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ListSkeleton, Skeleton } from "@/components/ui/Skeleton";
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

interface BankConnectionInfo {
  id: string;
  institutionId: string;
  institutionName: string | null;
  accountName: string | null;
  accountIban: string | null;
  accountCurrency: string | null;
  status: string | null;
  validUntil: string | null;
  lastSyncedAt: string | null;
  pendingCount: number;
}

interface BankStatus {
  connections: BankConnectionInfo[];
  totalPending: number;
}

interface Institution {
  id: string;
  name: string;
  country: string;
}

function shortIban(iban: string | null): string {
  if (!iban) return "";
  return `${iban.slice(0, 4)}••${iban.slice(-4)}`;
}

function displayAccount(c: BankConnectionInfo): string {
  if (c.accountName) return c.accountName;
  if (c.accountIban) return shortIban(c.accountIban);
  return c.institutionName ?? "Cuenta";
}

function displaySub(c: BankConnectionInfo): string {
  if (c.accountIban) return `${shortIban(c.accountIban)}${c.accountCurrency ? ` · ${c.accountCurrency}` : ""}`;
  return c.institutionName ?? "";
}

export function BankView() {
  const { data: status, isLoading: statusLoading } = useSWR<BankStatus>(
    "/api/bank/status",
  );

  const [institutionsOpen, setInstitutionsOpen] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [institutionsLoading, setInstitutionsLoading] = useState(false);
  const [institutionsError, setInstitutionsError] = useState(false);
  const [country, setCountry] = useState("ES");
  const [search, setSearch] = useState("");
  const [linkingId, setLinkingId] = useState<string | null>(null);

  async function loadInstitutions(countryCode: string) {
    setInstitutionsLoading(true);
    setInstitutionsError(false);
    try {
      const res = await fetch(`/api/bank/institutions?country=${countryCode}`);
      if (!res.ok) throw new Error();
      setInstitutions(await res.json());
    } catch {
      setInstitutionsError(true);
      toast.error("No se pudieron cargar los bancos. Inténtalo de nuevo.");
    } finally {
      setInstitutionsLoading(false);
    }
  }

  async function openInstitutions() {
    setInstitutionsOpen(true);
    if (institutions.length === 0 || institutionsError) {
      void loadInstitutions(country);
    }
  }

  async function handleCountryChange(code: string) {
    setCountry(code);
    setSearch("");
    setInstitutions([]);
    void loadInstitutions(code);
  }

  async function handleLink(institutionId: string) {
    setLinkingId(institutionId);
    const res = await fetch("/api/bank/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ institutionId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setLinkingId(null);
      toast.error(body?.error ?? "No se pudo iniciar la conexión");
      return;
    }
    const data = await res.json();
    window.location.assign(data.link);
  }

  if (statusLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="space-y-4 p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-2/3" />
        </Card>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const connections = status?.connections ?? [];
  const filteredInstitutions = institutions.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
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

      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-foreground">Tus cuentas</h3>

        {connections.length === 0 ? (
          <Card className="p-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <Landmark className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Todavía no has conectado ninguna cuenta.
              </p>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {connections.map((connection) => (
              <Link
                key={connection.id}
                href={`/bank/${connection.id}`}
                onPointerDown={() => preloadBankDetail(connection.id)}
                onMouseEnter={() => preloadBankDetail(connection.id)}
                className="flex items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-muted/40 active:scale-[0.99]"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Landmark className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-card-foreground">
                    {displayAccount(connection)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {displaySub(connection)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {connection.institutionName} ·{" "}
                    {connection.validUntil
                      ? `acceso hasta ${new Date(connection.validUntil).toLocaleDateString("es")}`
                      : "conectada"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {connection.pendingCount > 0 ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {connection.pendingCount} pendiente
                      {connection.pendingCount === 1 ? "" : "s"}
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      al día
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

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
          ) : institutionsError ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/40 p-6 text-center">
              <Landmark className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Bancos no disponibles. El servicio puede estar ocupado o en
                mantenimiento. Vuelve a intentarlo.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadInstitutions(country)}
              >
                <RefreshCw className="h-4 w-4" /> Reintentar
              </Button>
            </div>
          ) : (
            <ul className="flex max-h-80 flex-col gap-1 overflow-y-auto">
              {filteredInstitutions.map((institution) => {
                const linkingRow = linkingId === institution.id;
                return (
                  <li key={institution.id}>
                    <button
                      type="button"
                      disabled={!!linkingId}
                      onClick={() => handleLink(institution.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-all active:scale-[0.98] active:bg-muted",
                        linkingRow && "bg-muted/60",
                      )}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Landmark className="h-4 w-4" />
                      </div>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-card-foreground">
                        {institution.name}
                      </span>
                      <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs font-semibold uppercase text-muted-foreground">
                        {institution.country}
                      </span>
                    </button>
                  </li>
                );
              })}
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