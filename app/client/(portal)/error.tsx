"use client";

import Link from "next/link";

export default function ClientPortalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-8 text-center">
      <p className="text-xs uppercase tracking-widest text-zinc-600">Erreur</p>
      <h1 className="mt-2 text-xl font-medium tracking-tight text-white">
        Impossible d&apos;afficher cette page
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Un problème est survenu lors du chargement de vos données. Réessayez, ou
        contactez votre conseiller F5L si cela persiste.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex h-10 items-center rounded-lg bg-white px-5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
        >
          Réessayer
        </button>
        <Link
          href="/client/support"
          className="inline-flex h-10 items-center rounded-lg border border-zinc-700 px-4 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
        >
          Contacter F5L
        </Link>
      </div>
    </div>
  );
}
