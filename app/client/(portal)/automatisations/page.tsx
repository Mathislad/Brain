import type { Metadata } from "next";

import { requireClient } from "@/lib/auth/roles";
import { formatDate, getAutomationOverview } from "@/lib/f5l-portal";

export const metadata: Metadata = { title: "Automatisations" };

export default async function ClientAutomationsPage() {
  const { organization } = await requireClient();
  const data = await getAutomationOverview(organization.id);

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-zinc-600">Automatisations</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">Workflows et relances</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          Suivi des automatisations de notification, relance et synchronisation.
        </p>
      </div>
      {data.automations.length === 0 && (
        <p className="rounded-lg border border-dashed border-zinc-800 px-6 py-12 text-center text-sm text-zinc-600">
          Aucune automatisation active pour l&apos;instant.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {data.automations.map((automation) => (
          <article key={automation.id} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-medium text-white">{automation.name}</h2>
                <p className="mt-1 text-sm text-zinc-500">{automation.description ?? automation.type}</p>
              </div>
              <span className="rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400">{automation.status}</span>
            </div>
            <div className="mt-5 grid gap-2 text-xs text-zinc-600">
              <p>Dernière exécution : {formatDate(automation.lastRunAt)}</p>
              <p>Prochaine exécution : {formatDate(automation.nextRunAt)}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
