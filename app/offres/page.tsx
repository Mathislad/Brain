import type { Metadata } from "next";

import {
  OfferGrid,
  PrimaryCta,
  PublicPageShell,
  SectionIntro,
} from "@/components/public/f5l-site";

export const metadata: Metadata = {
  title: "Offres F5L",
  description:
    "Sites internet, Meta Ads, Google Ads, CRM, automatisations et agents IA pour structurer votre acquisition client.",
  alternates: { canonical: "/offres" },
};

export default function OffersPage() {
  return (
    <PublicPageShell>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-32 sm:px-6">
        <SectionIntro
          eyebrow="Offres"
          title="Des modules sobres, reliés, pilotables."
          text="F5L assemble les briques utiles à votre acquisition : une vitrine solide, des campagnes suivies, un CRM clair et des automatisations qui gardent le rythme."
        />
        <div className="mt-12">
          <OfferGrid />
        </div>
      </section>
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-3">
          {[
            ["Starter", "Poser une base propre : site, tracking, premiers formulaires."],
            ["Growth", "Lancer et piloter les campagnes avec un CRM de suivi."],
            ["System", "Brancher relances, automatisations et agents IA métier."],
          ].map(([title, text]) => (
            <article key={title} className="rounded-lg border border-white/10 p-6">
              <h2 className="text-xl font-medium text-white">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{text}</p>
            </article>
          ))}
        </div>
      </section>
      <PrimaryCta />
    </PublicPageShell>
  );
}
