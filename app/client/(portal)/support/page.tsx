import type { Metadata } from "next";

import { requireClient } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "Support",
};

export default async function ClientSupportPage() {
  const { organization } = await requireClient();

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-zinc-600">Support</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">Demander une action</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          Envoyez une demande liée à {organization.name}. Le formulaire est prêt pour être relié à un flux support ou à une notification interne.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <form className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-6">
          <div className="grid gap-4">
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-zinc-500">Sujet</span>
              <input
                type="text"
                placeholder="Site, campagne, document, CRM..."
                className="h-11 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-cyan-500/70"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-zinc-500">Priorité</span>
              <select className="h-11 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors focus:border-cyan-500/70">
                <option>Normal</option>
                <option>Important</option>
                <option>Bloquant</option>
              </select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-zinc-500">Message</span>
              <textarea
                rows={7}
                placeholder="Décrivez la demande ou l'information à mettre à jour."
                className="resize-none rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-cyan-500/70"
              />
            </label>
            <button type="button" className="h-11 rounded-lg bg-white text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200">
              Préparer la demande
            </button>
          </div>
        </form>

        <aside className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-6">
          <h2 className="text-base font-medium text-white">Demandes recommandées</h2>
          <div className="mt-5 grid gap-3">
            {[
              "Partager un nouvel accès",
              "Ajouter un document",
              "Mettre à jour une page du site",
              "Préparer une nouvelle campagne",
            ].map((item) => (
              <div key={item} className="rounded-lg border border-zinc-800 px-4 py-3 text-sm text-zinc-400">
                {item}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
