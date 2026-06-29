import Link from "next/link";
import type { Metadata } from "next";

import {
  HeroImage,
  OfferGrid,
  PrimaryCta,
  PublicFooter,
  PublicHeader,
  SectionIntro,
  results,
  systemSteps,
} from "@/components/public/f5l-site";

export const metadata: Metadata = {
  title: "F5L Agency | Acquisition client, CRM et IA",
  description:
    "F5L construit les systèmes qui transforment votre visibilité en clients : sites, Meta Ads, Google Ads, CRM, automatisations et agents IA.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <PublicHeader />

      <section className="relative min-h-[92svh] overflow-hidden">
        <div className="absolute inset-0">
          <HeroImage />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#09090b_0%,rgba(9,9,11,0.92)_34%,rgba(9,9,11,0.46)_72%,rgba(9,9,11,0.32)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent" />
        </div>

        <div className="relative mx-auto flex min-h-[92svh] max-w-6xl flex-col justify-center px-4 pb-20 pt-28 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.26em] text-cyan-300/80">
              F5L Agency
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-medium tracking-tight text-white sm:text-6xl lg:text-7xl">
              Votre acquisition client, pilotée depuis un seul système.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300">
              F5L réunit sites professionnels, campagnes Meta et Google, CRM, relances et agents IA pour aider les entreprises locales et PME à générer plus de demandes qualifiées.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-white px-5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
              >
                Demander un diagnostic
              </Link>
              <Link
                href="/client/login"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-white/15 px-5 text-sm font-medium text-white transition-colors hover:border-white/35"
              >
                Connexion F5L Brain
              </Link>
            </div>
          </div>

          <div className="mt-16 grid max-w-4xl gap-3 sm:grid-cols-3">
            {results.map((item) => (
              <div key={item.value} className="rounded-lg border border-white/10 bg-black/20 p-4 backdrop-blur">
                <p className="text-2xl font-medium text-white">{item.value}</p>
                <p className="mt-1 text-sm leading-5 text-zinc-400">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionIntro
          eyebrow="Positionnement"
          title="Une agence premium pour les systèmes qui vendent."
          text="F5L ne traite pas le site, les publicités et le CRM comme des sujets séparés. Chaque brique sert un même objectif : transformer la visibilité en conversations, puis les conversations en clients."
        />
        <div className="mt-12 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-xl font-medium text-white">Pour les dirigeants qui veulent de la clarté.</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Un système simple à suivre, des priorités lisibles et un espace client pour voir ce qui est actif, en cours et à préparer.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
            <h2 className="text-xl font-medium text-white">Pour les équipes qui veulent avancer.</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Moins d&apos;outils dispersés, plus de contrôle sur les leads, les campagnes, les documents et les prochaines actions.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionIntro
            eyebrow="Offres"
            title="Les briques utiles, sans surcharge."
            text="Chaque module peut vivre seul, mais prend plus de valeur lorsqu'il est connecté au reste du système F5L."
          />
          <div className="mt-12">
            <OfferGrid />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <SectionIntro
            eyebrow="Méthode"
            title="Un système visible côté client."
            text="Le portail F5L Brain donne une base claire pour suivre les services actifs, documents, campagnes, leads, automatisations et prochaines actions."
          />
          <div className="grid gap-3">
            {systemSteps.map((item) => (
              <div key={item.step} className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-start gap-5">
                  <span className="text-sm font-medium text-cyan-300">{item.step}</span>
                  <div>
                    <h2 className="font-medium text-white">{item.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">{item.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PrimaryCta />
      <PublicFooter />
    </main>
  );
}
