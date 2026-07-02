import type { Metadata } from "next";
import Link from "next/link";

import { requireClient } from "@/lib/auth/roles";
import { formatDate, getWebsiteOverview, statusLabels } from "@/lib/f5l-portal";

export const metadata: Metadata = { title: "Site internet" };

export default async function ClientWebsitePage() {
  const { organization } = await requireClient();
  const { project, tasks } = await getWebsiteOverview(organization.id);

  if (!project) {
    return (
      <div className="grid gap-8">
        <Header
          eyebrow="Site internet"
          title="Suivi du projet site"
          text="Statut, étapes, URLs et actions attendues pour votre site F5L."
        />
        <div className="rounded-lg border border-dashed border-zinc-800 px-6 py-16 text-center">
          <p className="text-sm text-zinc-500">
            Votre projet site n&apos;est pas encore démarré. Il apparaîtra ici dès son lancement.
          </p>
          <Link
            href="/client/support"
            className="mt-5 inline-flex h-10 items-center rounded-lg border border-zinc-700 px-4 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Poser une question
          </Link>
        </div>
      </div>
    );
  }

  const steps = [
    ["Contenus", project.contentStatus],
    ["Design", project.designStatus],
    ["Développement", project.developmentStatus],
    ["Déploiement", project.deploymentStatus],
  ];

  return (
    <div className="grid gap-8">
      <Header eyebrow="Site internet" title="Suivi du projet site" text="Statut, étapes, URLs et actions attendues pour votre site F5L." />

      <section className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm text-zinc-500">Étape actuelle</p>
            <h2 className="mt-1 text-2xl font-medium text-white">{project.currentStep ?? "À définir"}</h2>
            <p className="mt-2 text-sm text-zinc-500">Mis à jour le {formatDate(project.updatedAt)}</p>
          </div>
          <span className="rounded-lg border border-cyan-900/50 px-3 py-1 text-xs text-cyan-300">
            {statusLabels[project.status] ?? project.status}
          </span>
        </div>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-zinc-900">
          <div className="h-full rounded-full bg-cyan-400/80" style={{ width: `${project.progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-zinc-600">{project.progress}% complété</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {steps.map(([label, status]) => (
          <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-5">
            <p className="text-sm font-medium text-white">{label}</p>
            <p className="mt-1 text-sm text-zinc-500">{statusLabels[status] ?? status}</p>
          </div>
        ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-6">
          <h2 className="text-base font-medium text-white">Checklist</h2>
          <div className="mt-5 grid gap-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 px-4 py-3">
                <div>
                  <p className="text-sm text-white">{task.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-600">{task.assignedTo ?? "F5L"}</p>
                </div>
                <span className="text-xs text-zinc-500">{statusLabels[task.status] ?? task.status}</span>
              </div>
            ))}
          </div>
        </div>
        <aside className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-6">
          <h2 className="text-base font-medium text-white">Liens</h2>
          <div className="mt-5 grid gap-3">
            <UrlRow label="Preview" href={project.previewUrl} />
            <UrlRow label="Production" href={project.productionUrl} />
            <UrlRow label="Domaine" href={project.domain ? `https://${project.domain}` : null} />
          </div>
          <Link href="/client/support" className="mt-6 inline-flex h-10 items-center rounded-lg bg-white px-4 text-sm font-medium text-zinc-950">
            Demander une modification
          </Link>
        </aside>
      </section>
    </div>
  );
}

function UrlRow({ label, href }: { label: string; href?: string | null }) {
  return (
    <div className="rounded-lg border border-zinc-800 px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-zinc-600">{label}</p>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="mt-1 block truncate text-sm text-zinc-300 hover:text-white">
          {href}
        </a>
      ) : (
        <p className="mt-1 text-sm text-zinc-600">À venir</p>
      )}
    </div>
  );
}

function Header({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-zinc-600">{eyebrow}</p>
      <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{text}</p>
    </div>
  );
}
