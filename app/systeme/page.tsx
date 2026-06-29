import Link from "next/link";
import type { Metadata } from "next";

import {
  PrimaryCta,
  PublicPageShell,
  SectionIntro,
  systemSteps,
} from "@/components/public/f5l-site";

export const metadata: Metadata = {
  title: "Système F5L",
  description:
    "Découvrez la méthode F5L pour relier site, publicités, CRM, automatisations et portail client F5L Brain.",
  alternates: { canonical: "/systeme" },
};

export default function SystemPage() {
  return (
    <PublicPageShell>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-32 sm:px-6">
        <SectionIntro
          eyebrow="Système F5L"
          title="Moins d'outils dispersés. Plus de contrôle."
          text="Le système F5L donne une place à chaque action : attirer, convertir, relancer, suivre. Votre portail client rend l'ensemble lisible."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {systemSteps.map((item) => (
            <article key={item.step} className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs font-medium text-cyan-300">{item.step}</p>
              <h2 className="mt-5 text-xl font-medium text-white">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{item.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="border-y border-white/10 bg-zinc-900/30">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-cyan-300/80">
              F5L Brain
            </p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight text-white">
              Un portail client pour suivre l&apos;abonnement.
            </h2>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              Services actifs, documents, prochaines actions, campagnes et CRM : la base est prête pour connecter les données réelles au fil de l&apos;accompagnement.
            </p>
            <Link
              href="/client/login"
              className="mt-7 inline-flex h-10 items-center rounded-lg border border-white/15 px-4 text-sm text-white transition-colors hover:border-white/35"
            >
              Accéder au portail
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Site internet", "Meta Ads", "Google Ads", "CRM / leads", "Automatisations", "Agents IA"].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
      <PrimaryCta />
    </PublicPageShell>
  );
}
