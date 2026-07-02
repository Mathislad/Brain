import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 px-6 py-12 text-center">
        <p className="text-xs uppercase tracking-widest text-zinc-600">404</p>
        <h1 className="mt-2 text-xl font-medium tracking-tight text-white">Introuvable</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Cet élément n&apos;existe pas ou a été supprimé.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-9 items-center rounded-lg bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
