import type { Metadata } from "next";
import Link from "next/link";

import { PublicPageShell, SectionIntro } from "@/components/public/f5l-site";

export const metadata: Metadata = {
  title: "Contact F5L",
  description:
    "Réservez un échange gratuit avec F5L pour voir si Brain ou l'accompagnement F5L peut réellement vous aider.",
  alternates: { canonical: "/contact" },
};

const CALENDLY_URL =
  process.env.NEXT_PUBLIC_CALENDLY_URL ??
  "https://calendly.com/ladouceurmc-contact/audit-gratuit-30-min";

const CONTACT_EMAIL = "contact@f5l-agency.fr";

function buildCalendlyEmbedUrl(base: string) {
  const params = new URLSearchParams({
    hide_gdpr_banner: "1",
    primary_color: "22d3ee",
    background_color: "09090b",
    text_color: "f4f4f5",
  });
  return `${base}?${params.toString()}`;
}

export default function ContactPage() {
  const embedUrl = buildCalendlyEmbedUrl(CALENDLY_URL);

  return (
    <PublicPageShell>
      {/* ── Intro ────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-36 sm:px-6">
        <SectionIntro
          eyebrow="Contact"
          title="Parlons de votre situation."
          text="Réservez un échange de 30 minutes pour voir si F5L Brain ou l'accompagnement F5L peut réellement vous aider. Sans engagement — juste une conversation utile."
        />
        <div className="mt-6 flex flex-wrap gap-6 text-sm text-zinc-500">
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            30 minutes
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            Sans engagement
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            100 % personnalisé
          </span>
        </div>
      </section>

      {/* ── Calendly embed ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
          {/* Loader visible derrière l'iframe pendant le chargement */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
          </div>
          <iframe
            src={embedUrl}
            title="Réserver un échange avec F5L"
            loading="lazy"
            className="relative z-10 h-[760px] w-full border-0 sm:h-[700px]"
          />
        </div>
        <p className="mt-4 text-center text-sm text-zinc-600">
          Le calendrier ne s&apos;affiche pas ?{" "}
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 underline-offset-4 hover:text-white hover:underline"
          >
            Ouvrir dans un nouvel onglet
          </a>{" "}
          ou écrire à{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-zinc-400 underline-offset-4 hover:text-white hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </section>

      {/* ── Contact alternatif ───────────────────────────────────────────── */}
      <section className="border-t border-white/10">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:px-6 sm:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
              Email
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-3 block text-lg font-medium text-white transition-colors hover:text-cyan-300"
            >
              {CONTACT_EMAIL}
            </a>
            <p className="mt-2 text-sm text-zinc-500">
              Pour toute demande d&apos;information ou de devis.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
              Déjà client F5L ?
            </p>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Retrouvez vos documents, services actifs et prochaines étapes directement dans votre espace F5L Brain.
            </p>
            <Link
              href="/client/login"
              className="mt-4 inline-flex h-9 items-center rounded-lg border border-white/10 px-4 text-sm text-zinc-300 transition-colors hover:border-white/25 hover:text-white"
            >
              Connexion client
            </Link>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
