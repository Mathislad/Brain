"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import {
  devLogAuthError,
  getOtpError,
  getPasswordUpdateError,
} from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  email: string;
}

export function ResetPasswordForm({ email: initialEmail }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const errorId = "reset-password-error";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();

    if (!cleanEmail) {
      setError("Veuillez saisir votre adresse email.");
      return;
    }
    if (cleanToken.length !== 8) {
      setError("Le code doit contenir exactement 8 chiffres.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: "recovery",
    });

    if (otpError) {
      devLogAuthError("verifyOtp:recovery", otpError);
      setError(getOtpError(otpError));
      setPending(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      devLogAuthError("updateUser:password", updateError);
      setError(getPasswordUpdateError(updateError));
      setPending(false);
      return;
    }

    await supabase.auth.signOut();
    router.replace("/reset-password/success");
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

      <div className="flex flex-col gap-1.5">
        <label htmlFor="token" className="text-xs font-medium text-zinc-400">
          Code reçu par email
        </label>
        <Input
          id="token"
          name="token"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={8}
          autoComplete="one-time-code"
          required
          value={token}
          onChange={(event) =>
            setToken(event.target.value.replace(/\D/g, "").slice(0, 8))
          }
          placeholder="00000000"
          className="tracking-[0.4em] text-center"
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-xs font-medium text-zinc-400">
          Nouveau mot de passe
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="8 caractères minimum"
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirmPassword" className="text-xs font-medium text-zinc-400">
          Confirmer le mot de passe
        </label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Répétez le mot de passe"
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
        {pending ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
      </Button>
    </form>
  );
}
