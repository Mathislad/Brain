"use client";

import { useState } from "react";

import { deleteAccountAction } from "@/app/actions/account";

export function DeleteAccountButton() {
  const [step, setStep] = useState<"idle" | "confirm" | "loading">("idle");
  const [emailConfirmation, setEmailConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleDelete() {
    setStep("loading");
    setErrorMsg(null);

    const result = await deleteAccountAction({ emailConfirmation, password });
    if (result?.error) {
      setErrorMsg(result.error);
      setStep("confirm");
    }
    // Pas de else : le server action redirige, le composant se démonte.
  }

  if (step === "confirm" || step === "loading") {
    return (
      <div className="flex w-full max-w-xs flex-col items-stretch gap-2">
        <p className="text-xs text-zinc-500">
          Confirmez votre email et votre mot de passe.
        </p>
        <label className="sr-only" htmlFor="delete-account-email">
          Email de confirmation
        </label>
        <input
          id="delete-account-email"
          type="email"
          value={emailConfirmation}
          onChange={(e) => setEmailConfirmation(e.target.value)}
          disabled={step === "loading"}
          placeholder="votre email"
          aria-invalid={!!errorMsg}
          aria-describedby={errorMsg ? "delete-account-error" : undefined}
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors focus:border-zinc-600 disabled:opacity-50"
        />
        <label className="sr-only" htmlFor="delete-account-password">
          Mot de passe
        </label>
        <input
          id="delete-account-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={step === "loading"}
          placeholder="mot de passe"
          aria-invalid={!!errorMsg}
          aria-describedby={errorMsg ? "delete-account-error" : undefined}
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors focus:border-zinc-600 disabled:opacity-50"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setStep("idle");
              setEmailConfirmation("");
              setPassword("");
              setErrorMsg(null);
            }}
            disabled={step === "loading"}
            className="rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={step === "loading"}
            className="rounded-lg border border-red-900/50 px-3 py-1.5 text-sm text-red-400 transition-colors hover:border-red-700/60 hover:text-red-300 disabled:opacity-50"
          >
            {step === "loading" ? "Suppression…" : "Confirmer"}
          </button>
        </div>
        {errorMsg && (
          <p id="delete-account-error" role="alert" className="text-xs text-red-400">
            {errorMsg}
          </p>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setStep("confirm")}
      className="shrink-0 rounded-lg border border-red-900/40 px-3 py-1.5 text-sm text-red-500 transition-colors hover:border-red-700/40 hover:text-red-400"
    >
      Supprimer
    </button>
  );
}
