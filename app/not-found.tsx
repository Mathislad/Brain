import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12 text-center">
      <div className="w-full max-w-md rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-8">
        <p className="text-xs uppercase tracking-widest text-zinc-600">404</p>
        <h1 className="mt-2 text-2xl font-medium tracking-tight text-white">
          Page introuvable
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-white px-5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
