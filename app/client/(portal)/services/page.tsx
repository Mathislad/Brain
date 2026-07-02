import type { Metadata } from "next";
import Link from "next/link";

import { requireClient } from "@/lib/auth/roles";
import { formatDate, getPortalServices, serviceLabels, statusLabels } from "@/lib/f5l-portal";

export const metadata: Metadata = {
  title: "Services",
};

const detailHref: Record<string, string> = {
  website: "/client/site-internet",
  meta_ads: "/client/meta-ads",
  google_ads: "/client/google-ads",
  crm: "/client/crm",
  ai_agent: "/client/agents-ia",
  automation: "/client/automatisations",
  support: "/client/support",
};

export default async function ClientServicesPage() {
  const { organization } = await requireClient();
  const services = await getPortalServices(organization.id);

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-zinc-600">Services actifs</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">Système F5L de {organization.name}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          Cette vue sert de base de pilotage. Les modules marqués à connecter recevront leurs données réelles dès que les intégrations seront branchées.
        </p>
      </div>

      {services.length === 0 && (
        <p className="rounded-lg border border-dashed border-zinc-800 px-6 py-12 text-center text-sm text-zinc-600">
          Vos services apparaîtront ici dès leur mise en place par F5L.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {services.map((service) => (
          <article key={service.id} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-medium text-white">{service.name || serviceLabels[service.type]}</h2>
                <p className="mt-1 text-sm text-zinc-500">{service.description}</p>
              </div>
              <span className="rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
                {statusLabels[service.status] ?? service.status}
              </span>
            </div>
            <div className="mt-5">
              <div className="h-2 overflow-hidden rounded-full bg-zinc-900">
                <div className="h-full rounded-full bg-cyan-400/80" style={{ width: `${service.progress}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-4 text-xs text-zinc-600">
                <span>{service.progress}% complété</span>
                <span>Mis à jour le {formatDate(service.updatedAt)}</span>
              </div>
            </div>
            <Link
              href={detailHref[service.type] ?? "/client/support"}
              className="mt-5 inline-flex h-9 items-center rounded-lg border border-zinc-700 px-3 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Voir le détail
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
