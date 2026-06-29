import type { Metadata } from "next";

import { requireClient } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "Services",
};

const services = [
  {
    title: "Site internet",
    status: "En suivi",
    progress: "Base opérationnelle",
    details: ["Pages de conversion", "Formulaires", "Connexion CRM à finaliser"],
  },
  {
    title: "Meta Ads",
    status: "À connecter",
    progress: "Préparation des accès",
    details: ["Business Manager", "Créatifs", "Suivi des leads"],
  },
  {
    title: "Google Ads",
    status: "À connecter",
    progress: "Structure prête",
    details: ["Campagnes Search", "Mots-clés", "Conversions"],
  },
  {
    title: "CRM / leads",
    status: "Préparé",
    progress: "Pipeline initial",
    details: ["Nouveaux leads", "Relances", "Statuts d'avancement"],
  },
  {
    title: "Automatisations",
    status: "Préparé",
    progress: "Workflows à brancher",
    details: ["Notifications", "Rappels", "Synchronisations"],
  },
  {
    title: "Agents IA",
    status: "Préparé",
    progress: "Cas d'usage à valider",
    details: ["Qualification", "Support", "Préparation de briefs"],
  },
];

export default async function ClientServicesPage() {
  const { organization } = await requireClient();

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-zinc-600">Services actifs</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">Système F5L de {organization.name}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          Cette vue sert de base de pilotage. Les modules marqués à connecter recevront leurs données réelles dès que les intégrations seront branchées.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {services.map((service) => (
          <article key={service.title} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-medium text-white">{service.title}</h2>
                <p className="mt-1 text-sm text-zinc-500">{service.progress}</p>
              </div>
              <span className="rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
                {service.status}
              </span>
            </div>
            <div className="mt-5 grid gap-2">
              {service.details.map((detail) => (
                <div key={detail} className="flex items-center gap-3 text-sm text-zinc-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/70" />
                  {detail}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
