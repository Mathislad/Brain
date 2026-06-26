"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  currentName: string;
}

export function UpdateNameForm({ currentName }: Props) {
  const [name, setName] = useState(currentName);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const errorId = "update-name-error";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);

    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setErrorMsg("Le nom doit contenir au moins 2 caractères.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { name: trimmed },
    });

    if (error) {
      setErrorMsg("Impossible de mettre à jour le nom. Réessayez.");
      setStatus("error");
      return;
    }

    setStatus("success");
    setTimeout(() => setStatus("idle"), 3000);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-xs font-medium text-zinc-400">
          Nom
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setStatus("idle");
          }}
          placeholder="Votre nom"
          disabled={status === "loading"}
          aria-invalid={status === "error"}
          aria-describedby={errorMsg ? errorId : undefined}
        />
      </div>

      {errorMsg && (
        <p id={errorId} role="alert" className="text-sm text-red-400">
          {errorMsg}
        </p>
      )}
      {status === "success" && (
        <p className="text-sm text-emerald-400">Nom mis à jour.</p>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={status === "loading"}
          className="w-auto px-6"
        >
          {status === "loading" ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
