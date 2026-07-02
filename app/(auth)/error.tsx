"use client";

export default function AuthError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="text-center">
      <p className="text-xs uppercase tracking-widest text-zinc-600">Erreur</p>
      <h1 className="mt-2 text-lg font-medium text-white">Connexion indisponible</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Le service d&apos;authentification est momentanément inaccessible.
      </p>
      <button
        onClick={reset}
        className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-lg bg-white px-5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
      >
        Réessayer
      </button>
    </div>
  );
}
