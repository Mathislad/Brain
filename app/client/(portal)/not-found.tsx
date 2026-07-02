import Link from "next/link";

export default function ClientPortalNotFound() {
  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-8 text-center">
      <p className="text-xs uppercase tracking-widest text-zinc-600">404</p>
      <h1 className="mt-2 text-xl font-medium tracking-tight text-white">Page introuvable</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Cette page n&apos;existe pas dans votre espace client.
      </p>
      <Link
        href="/client"
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-white px-5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
      >
        Retour à mon espace
      </Link>
    </div>
  );
}
