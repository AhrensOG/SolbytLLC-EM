"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function BankCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const errorParam = searchParams.get("error");

    (async () => {
      if (errorParam) {
        toast.error("No se pudo completar la conexión bancaria");
      } else if (code && state) {
        const res = await fetch("/api/bank/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, state }),
        });
        if (res.ok) {
          toast.success("Cuenta bancaria conectada");
        } else {
          const data = await res.json().catch(() => null);
          toast.error(data?.error ?? "Error al conectar la cuenta bancaria");
        }
      }
      router.replace("/bank");
    })();
  }, [router, searchParams]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Banco</h1>
        <p className="text-sm text-muted-foreground">
          Completando la conexión…
        </p>
      </header>
    </div>
  );
}