import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-6 py-6 sm:px-8">
      <header className="flex items-center justify-between gap-4 py-3">
        <Link href="/" className="text-sm font-medium tracking-tight text-white">
          Brain
        </Link>
        <nav aria-label="Navigation principale" className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-zinc-400 underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-white px-4 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
          >
            Créer un compte
          </Link>
        </nav>
      </header>

      <section className="grid flex-1 items-center gap-12 py-16 md:grid-cols-[1fr_0.82fr]">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
            Prospection CRM
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-medium tracking-tight text-white sm:text-5xl">
            Organisez vos prospects, rendez-vous et clients au même endroit.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-zinc-400">
            Brain centralise votre pipeline commercial, vos prochaines actions
            et vos canaux de prospection dans un espace privé conçu pour avancer
            vite.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-white px-5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
            >
              Créer un compte
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-zinc-800 px-5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
            >
              Se connecter
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-5">
          <div className="border-b border-zinc-800 pb-3">
            <p className="text-xs uppercase tracking-widest text-zinc-600">
              Pipeline
            </p>
          </div>
          <div className="mt-4 space-y-3">
            {[
              ["Prospects", "Niches, contacts et prochaines actions"],
              ["Rendez-vous", "Suivi des échanges en cours"],
              ["Clients", "Historique et actions terminées"],
            ].map(([title, text]) => (
              <div
                key={title}
                className="rounded-lg border border-zinc-800/80 bg-zinc-950/60 p-4"
              >
                <p className="text-sm font-medium text-white">{title}</p>
                <p className="mt-1 text-sm text-zinc-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
