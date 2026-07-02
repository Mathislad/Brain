import Link from "next/link";
import type { Metadata } from "next";

import {
  PrimaryCta,
  PublicFooter,
  PublicHeader,
  SectionIntro,
  brainBenefits,
  brainModules,
} from "@/components/public/f5l-site";

export const metadata: Metadata = {
  title: "F5L Brain — Logiciel de pilotage client",
  description:
    "F5L Brain centralise l'acquisition, les leads, les rendez-vous et le suivi client dans un seul logiciel conçu pour les agences et leurs clients.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <PublicHeader />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92svh] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.12),transparent)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-zinc-950 to-transparent" />

        <div className="relative mx-auto flex min-h-[92svh] max-w-6xl flex-col justify-center px-4 pb-20 pt-32 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.26em] text-cyan-300/80">
              F5L Brain
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-medium tracking-tight text-white sm:text-6xl lg:text-7xl">
              Le logiciel qui centralise votre activité client.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
              Leads, rendez-vous, campagnes, documents et suivi projet — tout au même endroit, accessible pour vous comme pour vos clients.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-white px-6 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
              >
                Réserver un échange gratuit
              </Link>
              <Link
                href="/client/login"
                className="inline-flex h-12 items-center justify-center rounded-lg border border-white/15 px-6 text-sm font-medium text-white transition-colors hover:border-white/35"
              >
                Connexion F5L Brain
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Concept ──────────────────────────────────────────────────────── */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionIntro
            eyebrow="Concept"
            title="Le cockpit de pilotage F5L."
            text="Brain est le logiciel central de l'agence F5L. Il réunit les outils internes et l'espace client dans une interface unique, claire et structurée."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: "Pour l'agence",
                text: "Gérez vos prospects, clients, rendez-vous, campagnes et contenus depuis un tableau de bord unifié.",
              },
              {
                title: "Pour le client",
                text: "Suivez l'avancement de votre projet, accédez à vos documents et visualisez vos résultats en temps réel.",
              },
              {
                title: "Pour la relation",
                text: "Un espace partagé qui réduit les échanges inutiles et renforce la confiance à chaque étape.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-lg border border-white/10 bg-white/[0.03] p-6"
              >
                <h2 className="font-medium text-white">{card.title}</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bénéfices ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <SectionIntro
          eyebrow="Bénéfices"
          title="Ce que Brain change concrètement."
          text="Moins d'outils dispersés, plus de clarté. Brain est conçu pour simplifier le travail quotidien de l'agence et améliorer l'expérience de chaque client."
        />
        <div className="mt-12 grid gap-3 sm:grid-cols-2">
          {brainBenefits.map((b) => (
            <div
              key={b.title}
              className="rounded-lg border border-white/10 bg-white/[0.03] p-6"
            >
              <h3 className="font-medium text-white">{b.title}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Modules ──────────────────────────────────────────────────────── */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionIntro
            eyebrow="Modules"
            title="Six espaces, un seul logiciel."
            text="Chaque module couvre une dimension clé de la relation client. Ils fonctionnent ensemble pour donner une vue complète à tout moment."
          />
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {brainModules.map((mod, i) => (
              <div
                key={mod.title}
                className="relative rounded-lg border border-white/10 bg-white/[0.03] p-5"
              >
                <p className="mb-3 text-xs font-medium text-cyan-300/60">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="font-medium text-white">{mod.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{mod.text}</p>
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
