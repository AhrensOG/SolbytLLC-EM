"use client";

import { SessionProvider } from "next-auth/react";
import { SWRConfig } from "swr";
import { Toaster } from "sonner";
import { ThemeProvider } from "./theme-provider";
import { fetcher } from "@/lib/fetcher";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SWRConfig
        value={{
          fetcher,
          revalidateOnFocus: false,
          shouldRetryOnError: false,
        }}
      >
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster
          position="bottom-right"
          richColors
          toastOptions={{
            style: { borderRadius: "0.75rem" },
          }}
        />
      </SWRConfig>
    </SessionProvider>
  );
}
