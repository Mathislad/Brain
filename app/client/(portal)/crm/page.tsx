import type { Metadata } from "next";

import { requireClient } from "@/lib/auth/roles";
import { formatDate, getCrmOverview } from "@/lib/f5l-portal";

export const metadata: Metadata = { title: "CRM" };

export default async function ClientCrmPage() {
  const { organization } = await requireClient();
  const data = await getCrmOverview(organization.id);

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-zinc-600">CRM</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">Leads et pipeline</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          Suivi des prospects, sources, statuts et prochaines relances.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Leads" value={String(data.leads.length)} />
        <Stat label="Sources" value={String(new Set(data.leads.map((lead) => lead.source).filter(Boolean)).size)} />
        <Stat label="Relances" value={String(data.leads.filter((lead) => lead.nextActionAt).length)} />
      </div>
      <section className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-6">
        <h2 className="text-base font-medium text-white">Pipeline</h2>
        {data.stages.length === 0 && (
          <p className="mt-4 text-sm text-zinc-600">Votre pipeline sera configuré au lancement du service CRM.</p>
        )}
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {data.stages.map((stage) => (
            <div key={stage.id} className="rounded-lg border border-zinc-800 p-4">
              <p className="text-sm text-white">{stage.name}</p>
              <p className="mt-1 text-xs text-zinc-600">Position {stage.position}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-6">
        <h2 className="text-base font-medium text-white">Leads récents</h2>
        {data.leads.length === 0 && (
          <p className="mt-4 text-sm text-zinc-600">Aucun lead pour l&apos;instant. Ils apparaîtront ici dès les premières demandes.</p>
        )}
        <div className="mt-5 grid gap-3">
          {data.leads.map((lead) => (
            <div key={lead.id} className="rounded-lg border border-zinc-800 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">{lead.fullName}</p>
                  <p className="mt-1 text-xs text-zinc-500">{lead.email ?? lead.phone ?? "Coordonnées à compléter"}</p>
                </div>
                <span className="text-xs text-zinc-500">{lead.status}</span>
              </div>
              <p className="mt-3 text-xs text-zinc-600">Prochaine action : {formatDate(lead.nextActionAt)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
      <p className="text-xs uppercase tracking-wider text-zinc-600">{label}</p>
      <p className="mt-1 text-xl font-medium text-white">{value}</p>
    </div>
  );
}
