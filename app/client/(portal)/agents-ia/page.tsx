import type { Metadata } from "next";
import Link from "next/link";

import { requireClient } from "@/lib/auth/roles";
import { formatDate, getAiAgentsOverview } from "@/lib/f5l-portal";

export const metadata: Metadata = { title: "Agents IA" };

export default async function ClientAiAgentsPage() {
  const { organization } = await requireClient();
  const data = await getAiAgentsOverview(organization.id);

  return (
    <div className="grid gap-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-600">Agents IA</p>
          <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">Agents métier</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Qualification, support, analyse et actions réalisées par les agents F5L.
          </p>
        </div>
        <Link href="/client/support" className="inline-flex h-10 items-center rounded-lg border border-zinc-700 px-4 text-sm text-zinc-300">
          Demander un ajustement
        </Link>
      </div>
      {data.agents.length === 0 && (
        <p className="rounded-lg border border-dashed border-zinc-800 px-6 py-12 text-center text-sm text-zinc-600">
          Aucun agent IA actif pour l&apos;instant.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {data.agents.map((agent) => (
          <article key={agent.id} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-medium text-white">{agent.name}</h2>
                <p className="mt-1 text-sm text-zinc-500">{agent.role}</p>
              </div>
              <span className="rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400">{agent.status}</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-500">{agent.description ?? "Agent en préparation."}</p>
            <p className="mt-3 text-xs text-zinc-600">Dernière activité : {formatDate(agent.lastActivityAt)}</p>
          </article>
        ))}
      </div>
      <section className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-6">
        <h2 className="text-base font-medium text-white">Logs récents</h2>
        {data.logs.length === 0 && (
          <p className="mt-4 text-sm text-zinc-600">Aucune activité enregistrée pour l&apos;instant.</p>
        )}
        <div className="mt-5 grid gap-3">
          {data.logs.map((log) => (
            <div key={log.id} className="rounded-lg border border-zinc-800 px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-white">{log.content}</p>
                <span className="text-xs text-zinc-600">{log.status}</span>
              </div>
              <p className="mt-1 text-xs text-zinc-600">{log.type} · {formatDate(log.createdAt)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
