import Image from "next/image";
import Link from "next/link";

export const publicNav = [
  { label: "Offres", href: "/offres" },
  { label: "À propos", href: "/a-propos" },
  { label: "Contact", href: "/contact" },
];

export const brainModules = [
  {
    title: "Dashboard",
    text: "Vue d'ensemble de l'activité en temps réel.",
  },
  {
    title: "Leads",
    text: "Pipeline de prospects, statuts et relances centralisés.",
  },
  {
    title: "Rendez-vous",
    text: "Agenda, prise de RDV et suivi des échanges clients.",
  },
  {
    title: "Clients",
    text: "Fiches clients, historique et espace de suivi dédié.",
  },
  {
    title: "Campagnes",
    text: "Pilotage des publicités Meta et Google depuis un seul endroit.",
  },
  {
    title: "Suivi projet",
    text: "Avancement, livrables et prochaines étapes visibles par le client.",
  },
];

export const brainBenefits = [
  {
    title: "Tout centraliser",
    text: "Un seul outil pour les prospects, les clients, les campagnes et les contenus. Plus rien ne se perd.",
  },
  {
    title: "Gagner du temps",
    text: "Moins de copier-coller entre les outils. Les informations sont là où il faut, quand il faut.",
  },
  {
    title: "Suivre les résultats",
    text: "Des indicateurs lisibles à chaque étape pour prendre de meilleures décisions, plus vite.",
  },
  {
    title: "Fluidifier la relation client",
    text: "Le client suit l'avancement de son projet en temps réel, sans avoir à demander.",
  },
];

export const f5lMethod = [
  { step: "01", title: "Analyse", text: "Audit de la situation actuelle, des objectifs et des priorités." },
  { step: "02", title: "Mise en place", text: "Construction de l'infrastructure : site, CRM, campagnes, outils." },
  { step: "03", title: "Acquisition", text: "Lancement des canaux d'acquisition et des systèmes de leads." },
  { step: "04", title: "Suivi", text: "Reporting régulier, accompagnement et ajustements opérationnels." },
  { step: "05", title: "Optimisation", text: "Amélioration continue des performances sur chaque levier actif." },
];

export const offers = [
  {
    title: "Site professionnel",
    text: "Une présence claire, rapide et crédible pour transformer les visites en demandes qualifiées.",
    items: ["Positionnement", "Pages de conversion", "Connexion CRM"],
  },
  {
    title: "Meta Ads",
    text: "Des campagnes structurées pour générer des conversations, des leads et des rendez-vous.",
    items: ["Créatifs", "Ciblages", "Suivi mensuel"],
  },
  {
    title: "Google Ads",
    text: "Captez la demande existante au moment où vos futurs clients cherchent une solution.",
    items: ["Recherche locale", "Landing pages", "Pilotage budget"],
  },
  {
    title: "CRM & relances",
    text: "Un pipeline simple pour ne plus perdre les prospects après le premier contact.",
    items: ["Leads centralisés", "Statuts", "Relances automatiques"],
  },
  {
    title: "Automatisations",
    text: "Des actions répétitives prises en charge pour garder votre équipe concentrée sur la vente.",
    items: ["Notifications", "Workflows", "Suivi opérationnel"],
  },
  {
    title: "Agents IA métier",
    text: "Des assistants adaptés à votre activité pour accélérer le support, la qualification et la production.",
    items: ["Qualification", "Réponses", "Briefs"],
  },
];

export const systemSteps = [
  {
    step: "01",
    title: "Clarifier l'offre",
    text: "F5L structure votre message, vos cibles et le parcours idéal avant de lancer les outils.",
  },
  {
    step: "02",
    title: "Construire l'infrastructure",
    text: "Site, campagnes, CRM et automatisations sont reliés dans un système lisible.",
  },
  {
    step: "03",
    title: "Piloter la performance",
    text: "Chaque mois, les actions et priorités sont suivies depuis votre espace F5L Brain.",
  },
];

export function PublicHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-zinc-950/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-sm font-semibold tracking-[0.18em] text-white">
          F5L
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {publicNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-zinc-400 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/client/login"
            className="hidden rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-white/25 hover:text-white sm:inline-flex"
          >
            Portail client
          </Link>
          <Link
            href="/contact"
            className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
          >
            Prendre rendez-vous
          </Link>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-zinc-950">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm text-zinc-500 sm:px-6 md:grid-cols-[1fr_auto]">
        <div>
          <p className="font-medium tracking-[0.18em] text-white">F5L</p>
          <p className="mt-3 max-w-md">
            Acquisition client, sites, publicités, CRM et automatisations pour entreprises locales et PME.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 md:justify-end">
          <Link href="/login" className="transition-colors hover:text-white">
            Admin Brain
          </Link>
          <Link href="/client/login" className="transition-colors hover:text-white">
            F5L Brain
          </Link>
          <Link href="/mentions-legales" className="transition-colors hover:text-white">
            Mentions légales
          </Link>
          <Link href="/confidentialite" className="transition-colors hover:text-white">
            Confidentialité
          </Link>
        </div>
      </div>
    </footer>
  );
}

export function PublicPageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <PublicHeader />
      {children}
      <PublicFooter />
    </main>
  );
}

export function HeroImage() {
  return (
    <Image
      src="/f5l/hero-acquisition-system.png"
      alt=""
      fill
      priority
      sizes="100vw"
      className="object-cover object-center opacity-75"
    />
  );
}

export function SectionIntro({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-medium uppercase tracking-[0.24em] text-cyan-300/80">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-medium tracking-tight text-white sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-zinc-400">{text}</p>
    </div>
  );
}

export function OfferGrid() {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {offers.map((offer) => (
        <article
          key={offer.title}
          className="rounded-lg border border-white/10 bg-white/[0.03] p-5"
        >
          <h3 className="text-lg font-medium text-white">{offer.title}</h3>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{offer.text}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {offer.items.map((item) => (
              <span
                key={item}
                className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-zinc-400"
              >
                {item}
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

export function PrimaryCta() {
  return (
    <section className="bg-white text-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
            Échange gratuit
          </p>
          <h2 className="mt-3 text-3xl font-medium tracking-tight">
            Voyons si F5L Brain peut vous aider.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
            Réservez un échange de 30 minutes pour faire le point sur votre situation et identifier les priorités.
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
  );
}
