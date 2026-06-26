"use client";

import { useState } from "react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { devLogAuthError, getPasswordResetRequestError } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState("");
  const errorId = "forgot-password-error";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Veuillez saisir votre adresse email.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password?email=${encodeURIComponent(cleanEmail)}`,
    });

    if (error) {
      devLogAuthError("resetPasswordForEmail", error);
      setError(getPasswordResetRequestError(error));
      setPending(false);
      return;
    }

    setSentTo(cleanEmail);
    setPending(false);
  }

  if (sentTo) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-4 py-3">
          <p className="text-sm font-medium text-emerald-400">
            Email envoyé
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            Ouvrez le lien reçu par email, puis entrez le code de récupération
            sur la page de réinitialisation.
          </p>
        </div>
        <Link
          href={`/reset-password?email=${encodeURIComponent(sentTo)}`}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-white px-5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
        >
          Entrer le code
        </Link>
        <button
          type="button"
          onClick={() => setSentTo("")}
          className="w-full text-sm text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-300 hover:underline"
        >
          Renvoyer un email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs font-medium text-zinc-400">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="vous@exemple.com"
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
        />
      </div>

      {error ? (
        <p id={errorId} role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Envoi..." : "Recevoir le lien"}
      </Button>
    </form>
  );
}
