"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { getLoginError, devLogAuthError } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [lastEmail, setLastEmail] = useState("");
  const [pending, setPending] = useState(false);
  const errorId = "login-error";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setEmailNotConfirmed(false);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    setLastEmail(email);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      devLogAuthError("signInWithPassword", error);
      const result = getLoginError(error);
      setError(result.message);
      setEmailNotConfirmed(result.emailNotConfirmed ?? false);
      setPending(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
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
          placeholder="vous@exemple.com"
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="password" className="text-xs font-medium text-zinc-400">
            Mot de passe
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-300 hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
        />
      </div>

      {error && (
        <div className="flex flex-col gap-2">
          <p id={errorId} role="alert" className="text-sm text-red-400">
            {error}
          </p>

          {/* Cas spécial : l'email existe mais n'est pas encore confirmé.
              On propose un raccourci direct vers la page de confirmation. */}
          {emailNotConfirmed && lastEmail && (
            <Link
              href={`/confirm-email?email=${encodeURIComponent(lastEmail)}`}
              className="text-sm text-zinc-300 underline underline-offset-4 transition-colors hover:text-white"
            >
              Entrer mon code de confirmation →
            </Link>
          )}
        </div>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
