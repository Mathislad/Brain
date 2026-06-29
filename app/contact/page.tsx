import Link from "next/link";
import type { Metadata } from "next";

import { PublicPageShell, SectionIntro } from "@/components/public/f5l-site";

export const metadata: Metadata = {
  title: "Contact F5L",
  description:
    "Demandez un rendez-vous F5L pour clarifier votre système d'acquisition client.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <PublicPageShell>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-20 pt-32 sm:px-6 lg:grid-cols-[1fr_0.8fr]">
        <SectionIntro
          eyebrow="Contact"
          title="Parlons de votre acquisition client."
          text="Expliquez brièvement votre activité, votre objectif et les canaux déjà utilisés. F5L revient vers vous avec une prochaine étape claire."
        />
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
          <h1 className="text-xl font-medium text-white">Demande de rendez-vous</h1>
          <form className="mt-6 grid gap-4">
            {[
              ["Nom", "Votre nom"],
              ["Entreprise", "Nom de l'entreprise"],
              ["Email", "vous@entreprise.fr"],
              ["Téléphone", "06 00 00 00 00"],
            ].map(([label, placeholder]) => (
              <label key={label} className="grid gap-1.5">
                <span className="text-xs font-medium text-zinc-500">{label}</span>
                <input
                  type={label === "Email" ? "email" : "text"}
                  placeholder={placeholder}
                  className="h-11 rounded-lg border border-white/10 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-cyan-400/60"
                />
              </label>
            ))}
            <label className="grid gap-1.5">
              <span className="text-xs font-medium text-zinc-500">Besoin principal</span>
              <textarea
                rows={5}
                placeholder="Site, campagnes, CRM, relances, IA..."
                className="resize-none rounded-lg border border-white/10 bg-zinc-950 px-3 py-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-cyan-400/60"
              />
            </label>
            <button
              type="button"
              className="h-11 rounded-lg bg-white text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
            >
              Préparer ma demande
            </button>
          </form>
          <p className="mt-4 text-xs leading-5 text-zinc-600">
            Formulaire vitrine prêt pour branchement. En attendant, utilisez votre canal de contact habituel.
          </p>
        </div>
      </section>
      <section className="border-t border-white/10 bg-white text-zinc-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium">Déjà client ?</p>
            <p className="mt-1 text-sm text-zinc-600">Retrouvez vos documents, services et prochaines actions dans F5L Brain.</p>
          </div>
          <Link href="/client/login" className="inline-flex h-10 items-center rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white">
            Connexion client
          </Link>
        </div>
      </section>
    </PublicPageShell>
  );
}
