"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function ClientLoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [isPending, start]      = useTransition();

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.signOut();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    start(async () => {
      const supabase = createClient();
      const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });

      if (authErr) {
        setError("Email ou mot de passe incorrect.");
        return;
      }

      router.push("/client");
      router.refresh();
    });
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 px-6 py-12">
      <div className="mb-10 text-center">
        <p className="text-xs uppercase tracking-widest text-zinc-600">Portail client</p>
        <p className="mt-1 text-xl font-medium tracking-tight text-white">F5L Brain</p>
      </div>

      <div className="w-full max-w-sm rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-6 shadow-2xl shadow-black/40 sm:rounded-2xl sm:p-8">
        <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
          <span className="rounded-md bg-white px-3 py-2 text-center text-xs font-medium text-zinc-950">
            Client
          </span>
          <Link
            href="/login"
            className="rounded-md px-3 py-2 text-center text-xs font-medium text-zinc-500 transition-colors hover:text-white"
          >
            Admin
          </Link>
        </div>

        <h1 className="mb-1 text-base font-medium text-white">Connexion client</h1>
        <p className="mb-6 text-sm text-zinc-500">Accédez à votre espace client.</p>
        <p className="mb-6 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs leading-5 text-zinc-500">
          Par sécurité, cette page demande une identification à chaque passage.
        </p>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-zinc-500">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-zinc-500">Mot de passe</span>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors focus:border-zinc-600"
            />
          </label>

          {error && (
            <p className="rounded-lg border border-red-900/50 bg-red-950/20 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="h-10 w-full rounded-lg bg-white text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-50"
          >
            {isPending ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <div className="mt-6 grid gap-3">
          <Link
            href="/register"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-700 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Première inscription
          </Link>
          <p className="text-center text-xs leading-5 text-zinc-600">
            Pour un accès client F5L, utilisez votre invitation ou contactez votre conseiller.
          </p>
        </div>
      </div>
    </main>
  );
}
