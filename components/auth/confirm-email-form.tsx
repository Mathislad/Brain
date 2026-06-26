"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { getOtpError, getResendError, devLogAuthError } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  email: string;
}

export function ConfirmEmailForm({ email: initialEmail }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resendMessage, setResendMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [resendLocked, setResendLocked] = useState(false);
  const errorId = "confirm-email-error";

  async function handleConfirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Veuillez saisir votre adresse email.");
      return;
    }
    if (token.length !== 8) {
      setError("Le code doit contenir exactement 8 chiffres.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: "email",
    });

    if (error) {
      devLogAuthError("verifyOtp", error);
      setError(getOtpError(error));
      setPending(false);
      return;
    }

    // Session créée — rafraîchit le layout serveur puis redirige.
    router.replace("/dashboard");
    router.refresh();
  }

  async function handleResend() {
    setError(null);
    setResendMessage(null);

    if (resendLocked) {
      setResendMessage({
        text: "Patientez quelques secondes avant de renvoyer un code.",
        type: "error",
      });
      return;
    }

    if (!email.trim()) {
      setError("Veuillez saisir votre adresse email avant de renvoyer.");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
    });

    if (error) {
      devLogAuthError("resend", error);
      setResendMessage({ text: getResendError(error), type: "error" });
      return;
    }

    setResendMessage({ text: "Code renvoyé ! Vérifiez votre boîte mail.", type: "success" });
    setResendLocked(true);
    setTimeout(() => setResendMessage(null), 5000);
    setTimeout(() => setResendLocked(false), 60_000);
  }

  return (
    <form onSubmit={handleConfirm} className="flex flex-col gap-5" noValidate>
      {/* Email — prérempli mais modifiable (faute de frappe possible) */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-xs font-medium text-zinc-400">
          Adresse email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.com"
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
        />
      </div>

      {/* Code OTP — chiffres uniquement, 8 caractères max */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="token" className="text-xs font-medium text-zinc-400">
          Code de confirmation
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
          onChange={(e) =>
            setToken(e.target.value.replace(/\D/g, "").slice(0, 8))
          }
          placeholder="00000000"
          className="tracking-[0.4em] text-center"
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
        {pending ? "Vérification…" : "Confirmer"}
      </Button>

      {/* Renvoi du code */}
      <div className="text-center">
        {resendMessage ? (
          <p
            className={`text-sm ${
              resendMessage.type === "success"
                ? "text-emerald-400"
                : "text-red-400"
            }`}
          >
            {resendMessage.text}
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLocked}
            className="text-sm text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-300 hover:underline"
          >
            Renvoyer le code
          </button>
        )}
      </div>
    </form>
  );
}
