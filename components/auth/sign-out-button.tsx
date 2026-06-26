"use client";

import { useFormStatus } from "react-dom";

import { signOutAction } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-sm text-zinc-400 underline-offset-4 transition-colors hover:text-white hover:underline disabled:opacity-60"
    >
      {pending ? "Déconnexion…" : "Se déconnecter"}
    </button>
  );
}

// Formulaire HTML simple : la déconnexion se fait côté serveur (Server Action)
// pour effacer les cookies de session de façon fiable avant la redirection.
export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <SubmitButton />
    </form>
  );
}
