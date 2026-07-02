"use client";

import Link from "next/link";

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 px-6 py-12 text-center">
        <p className="text-xs uppercase tracking-widest text-zinc-600">Erreur</p>
        <h1 className="mt-2 text-xl font-medium tracking-tight text-white">
          Impossible de charger cette page
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Une erreur est survenue côté serveur. Réessayez dans un instant.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex h-9 items-center rounded-lg bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
          >
            Réessayer
          </button>
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center rounded-lg border border-zinc-700 px-4 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
