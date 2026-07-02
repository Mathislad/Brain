"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12 text-center">
      <div className="w-full max-w-md rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-8">
        <p className="text-xs uppercase tracking-widest text-zinc-600">Erreur</p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight text-white">
          Quelque chose s&apos;est mal passé
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Une erreur inattendue est survenue. Vous pouvez réessayer.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex h-10 items-center rounded-lg bg-white px-5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-lg border border-zinc-700 px-4 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
