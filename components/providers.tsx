"use client";

import { SessionProvider } from "next-auth/react";
import { SWRConfig } from "swr";
import { Toaster } from "sonner";
import NextTopLoader from "nextjs-toploader";
import { ThemeProvider } from "./theme-provider";
import { fetcher } from "@/lib/fetcher";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NextTopLoader color="#a855f7" showSpinner={false} height={3} />
      <SWRConfig
        value={{
          fetcher,
          revalidateOnFocus: false,
          shouldRetryOnError: false,
        }}
      >
        <ThemeProvider>{children}</ThemeProvider>
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            style: { borderRadius: "0.75rem" },
          }}
        />
      </SWRConfig>
    </SessionProvider>
  );
}
