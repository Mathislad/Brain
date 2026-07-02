import Link from "next/link";
import type { Metadata } from "next";

import { PublicPageShell, SectionIntro, f5lMethod } from "@/components/public/f5l-site";

export const metadata: Metadata = {
  title: "À propos — F5L",
  description:
    "F5L est une agence digitale qui aide les entreprises locales et PME à générer plus de clients grâce à des systèmes d'acquisition simples, mesurables et efficaces.",
  alternates: { canonical: "/a-propos" },
};

export default function AProposPage() {
  return (
    <PublicPageShell>
      {/* ── Présentation ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-36 sm:px-6">
        <div className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.26em] text-cyan-300/80">
            À propos de F5L
          </p>
          <h1 className="mt-5 text-5xl font-medium tracking-tight text-white sm:text-6xl">
            Une agence qui construit des systèmes, pas des pages.
          </h1>
          <p className="mt-7 text-lg leading-8 text-zinc-400">
            F5L aide les petites entreprises et PME à obtenir plus de clients grâce au web, aux tunnels d&apos;acquisition, aux publicités et aux outils digitaux. L&apos;objectif n&apos;est pas de livrer des prestations isolées — c&apos;est de construire un système complet qui transforme votre visibilité en rendez-vous qualifiés.
          </p>
        </div>
      </section>

      {/* ── Vision ───────────────────────────────────────────────────────── */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <SectionIntro
            eyebrow="Vision"
            title="Des systèmes simples, propres et mesurables."
            text="Créer des systèmes simples, propres et mesurables pour aider les entreprises locales à mieux vendre. Pas de jargon inutile, pas de complexité artificielle — juste ce qui fonctionne, bien exécuté."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Pour les dirigeants qui veulent de la clarté",
                text: "Un système simple à suivre, des priorités lisibles et un espace client pour voir ce qui est actif, en cours et à préparer.",
              },
              {
                title: "Pour les équipes qui veulent avancer",
                text: "Moins d'outils dispersés, plus de contrôle sur les leads, les campagnes, les documents et les prochaines actions.",
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

      {/* ── Méthode ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <SectionIntro
            eyebrow="Méthode"
            title="Un accompagnement structuré en cinq étapes."
            text="Chaque client F5L suit le même processus, adapté à sa situation. Rien n'est laissé au hasard — chaque étape prépare la suivante."
          />
          <div className="grid gap-3">
            {f5lMethod.map((item) => (
              <div
                key={item.step}
                className="rounded-lg border border-white/10 bg-white/[0.03] p-5"
              >
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

      {/* ── CTA bas de page ──────────────────────────────────────────────── */}
      <section className="border-t border-white/10 bg-white text-zinc-950">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
              Première étape
            </p>
            <h2 className="mt-3 text-2xl font-medium tracking-tight">
              Voyons si F5L peut vous aider.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-600">
              Un échange de 30 minutes pour comprendre votre situation et identifier les vraies priorités.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-zinc-950 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Réserver un échange
          </Link>
        </div>
      </section>
    </PublicPageShell>
  );
}
