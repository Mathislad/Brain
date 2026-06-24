import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-medium tracking-tight text-white">
          Brain
        </h1>
        <p className="mt-3 text-sm text-zinc-400">Espace privé.</p>

        <div className="mt-10 flex flex-col gap-3">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-800 px-5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </main>
  );
}
