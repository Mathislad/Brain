"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className="text-sm text-zinc-400 underline-offset-4 transition-colors hover:text-white hover:underline disabled:opacity-60"
    >
      {pending ? "Déconnexion…" : "Se déconnecter"}
    </button>
  );
}
