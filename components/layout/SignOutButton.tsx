"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <LogOut className="h-5 w-5" />
      Cerrar sesión
    </button>
  );
}
