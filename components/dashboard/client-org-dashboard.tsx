"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  createAdCampaignAction,
  createClientNotificationAction,
  createServiceAction,
  createWebsiteTaskAction,
  deleteAdCampaignAction,
  deleteServiceAction,
  deleteWebsiteTaskAction,
  setOrganizationFeatureAction,
  updateServiceAction,
  updateWebsiteTaskAction,
  upsertWebsiteProjectAction,
} from "@/app/actions/f5l-admin";
import type { FeatureKey } from "@/lib/auth/features";
import {
  formatDate,
  formatMoneyCents,
  serviceLabels,
  statusLabels,
} from "@/lib/f5l-portal-format";
import type { PortalRequest, PortalService, ServiceType } from "@/lib/f5l-portal-format";
import { offerLabel } from "@/lib/offers";
import type {
  getAdsOverview,
  getAiAgentsOverview,
  getAutomationOverview,
  getCrmOverview,
  getOrganizationDetail,
  getWebsiteOverview,
} from "@/lib/f5l-portal";

type Organization = NonNullable<Awaited<ReturnType<typeof getOrganizationDetail>>>;
type WebsiteOverview = Awaited<ReturnType<typeof getWebsiteOverview>>;
type AdsOverview = Awaited<ReturnType<typeof getAdsOverview>>;
type CrmOverview = Awaited<ReturnType<typeof getCrmOverview>>;
type AutomationOverview = Awaited<ReturnType<typeof getAutomationOverview>>;
type AiAgentsOverview = Awaited<ReturnType<typeof getAiAgentsOverview>>;

interface Props {
  organization: Organization;
  services: PortalService[];
  requests: PortalRequest[];
  website: WebsiteOverview;
  metaAds: AdsOverview;
  googleAds: AdsOverview;
  crm: CrmOverview;
  automations: AutomationOverview;
  aiAgents: AiAgentsOverview;
}

const TABS = [
  { key: "overview", label: "Vue d'ensemble" },
  { key: "site", label: "Site internet" },
  { key: "ads", label: "Publicité" },
  { key: "crm", label: "CRM" },
  { key: "auto", label: "Automatisations & IA" },
  { key: "requests", label: "Demandes" },
  { key: "settings", label: "Réglages" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const SERVICE_TYPES: ServiceType[] = [
  "website",
  "meta_ads",
  "google_ads",
  "crm",
  "ai_agent",
  "automation",
  "support",
];

const SERVICE_STATUSES = ["planned", "active", "paused", "done", "attention"];

const FEATURE_LABELS: Record<FeatureKey, string> = {
  documents: "Documents",
  billing: "Facturation",
  crm: "CRM",
  loyalty_card: "Carte de fidélité",
  ai_followup: "Relance IA",
  acquisition: "Acquisition (pub)",
  reservation: "Réservation",
};

// ─── Primitives UI ────────────────────────────────────────────────────────────

const inputClass =
  "h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-zinc-600";
const btnPrimary =
  "inline-flex h-9 items-center rounded-lg bg-white px-3 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200 disabled:opacity-50";
const btnGhost =
  "inline-flex h-9 items-center rounded-lg border border-zinc-700 px-3 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white disabled:opacity-50";

function useAdminAction() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  function run(fn: () => Promise<unknown>, onDone?: () => void) {
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
        onDone?.();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Action échouée");
      }
    });
  }
  return { run, isPending };
}

export function ClientOrgDashboard(props: Props) {
  const { organization } = props;
  const [tab, setTab] = useState<TabKey>("overview");
  const openRequests = props.requests.filter((r) => r.status !== "done").length;

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-zinc-600">Suivi client</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">
          {organization.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {organization.prospect?.email ?? "Email non renseigné"}
          {organization.prospect?.telephone ? ` · ${organization.prospect.telephone}` : ""}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Offre"
          value={organization.billing?.offerKey ? offerLabel(organization.billing.offerKey) : "À définir"}
        />
        <Stat
          label="Abonnement"
          value={organization.billing?.subscriptionStatus === "active" ? "Actif" : "Inactif"}
        />
        <Stat label="Services actifs" value={`${props.services.filter((s) => s.status === "active").length}/${props.services.length}`} />
        <Stat label="Demandes ouvertes" value={String(openRequests)} />
      </div>

      <div className="mb-6 flex h-10 w-fit flex-wrap gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab orgId={organization.id} services={props.services} />}
      {tab === "site" && <SiteTab orgId={organization.id} website={props.website} />}
      {tab === "ads" && <AdsTab orgId={organization.id} meta={props.metaAds} google={props.googleAds} />}
      {tab === "crm" && <CrmTab crm={props.crm} />}
      {tab === "auto" && <AutomationsTab automations={props.automations} aiAgents={props.aiAgents} />}
      {tab === "requests" && <RequestsTab requests={props.requests} />}
      {tab === "settings" && (
        <SettingsTab orgId={organization.id} features={organization.features} />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
      <p className="text-xs uppercase tracking-wider text-zinc-600">{label}</p>
      <p className="mt-1 text-lg font-medium text-white">{value}</p>
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-6 text-center text-sm text-zinc-600">
      {children}
    </p>
  );
}

// ─── Vue d'ensemble : services + ajout/suppression ────────────────────────────

function OverviewTab({ orgId, services }: { orgId: string; services: PortalService[] }) {
  const { run, isPending } = useAdminAction();
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState<ServiceType>("website");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("planned");

  function submit() {
    run(
      () =>
        createServiceAction({
          organizationId: orgId,
          type,
          name: name.trim() || serviceLabels[type],
          status,
        }),
      () => {
        setName("");
        setAdding(false);
      },
    );
  }

  return (
    <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-6 py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-zinc-200">Services F5L</p>
        <button type="button" onClick={() => setAdding((v) => !v)} className={btnGhost}>
          {adding ? "Annuler" : "Ajouter un service"}
        </button>
      </div>

      {adding && (
        <div className="mb-4 grid gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 sm:grid-cols-[1fr_1fr_auto_auto]">
          <select value={type} onChange={(e) => setType(e.target.value as ServiceType)} className={inputClass}>
            {SERVICE_TYPES.map((t) => (
              <option key={t} value={t}>{serviceLabels[t]}</option>
            ))}
          </select>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={serviceLabels[type]} className={inputClass} />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            {SERVICE_STATUSES.map((s) => (
              <option key={s} value={s}>{statusLabels[s] ?? s}</option>
            ))}
          </select>
          <button type="button" onClick={submit} disabled={isPending} className={btnPrimary}>
            Ajouter
          </button>
        </div>
      )}

      {services.length === 0 ? (
        <EmptyNote>Aucun service configuré pour ce client pour l&apos;instant.</EmptyNote>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div key={service.id} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-white">
                  {service.name || serviceLabels[service.type]}
                </p>
                <select
                  value={service.status}
                  disabled={isPending}
                  onChange={(e) =>
                    run(() => updateServiceAction({ id: service.id, organizationId: orgId, status: e.target.value }))
                  }
                  className="h-7 rounded-lg border border-zinc-800 bg-zinc-950 px-2 text-[11px] text-zinc-300 outline-none"
                >
                  {SERVICE_STATUSES.map((s) => (
                    <option key={s} value={s}>{statusLabels[s] ?? s}</option>
                  ))}
                </select>
              </div>
              {service.description && (
                <p className="mt-2 text-xs leading-5 text-zinc-500">{service.description}</p>
              )}
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  if (confirm("Supprimer ce service ?"))
                    run(() => deleteServiceAction({ id: service.id, organizationId: orgId }));
                }}
                className="mt-3 text-xs text-zinc-600 transition-colors hover:text-red-400"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Site internet : projet + tâches ──────────────────────────────────────────

function SiteTab({ orgId, website }: { orgId: string; website: WebsiteOverview }) {
  const { run, isPending } = useAdminAction();
  const { project, tasks } = website;
  const [editing, setEditing] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");

  if (!project) {
    return (
      <div className="grid gap-4">
        <EmptyNote>Aucun projet site internet pour ce client pour l&apos;instant.</EmptyNote>
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => upsertWebsiteProjectAction({ organizationId: orgId, status: "planned" }))}
          className={`${btnPrimary} w-fit`}
        >
          Créer le projet site
        </button>
      </div>
    );
  }

  const steps: Array<[string, string]> = [
    ["Contenus", project.contentStatus],
    ["Design", project.designStatus],
    ["Développement", project.developmentStatus],
    ["Déploiement", project.deploymentStatus],
  ];

  return (
    <div className="grid gap-4">
      <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-zinc-500">Étape actuelle</p>
            <h2 className="mt-1 text-xl font-medium text-white">{project.currentStep ?? "À définir"}</h2>
            <p className="mt-2 text-xs text-zinc-600">Mis à jour le {formatDate(project.updatedAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-fit rounded-lg border border-cyan-900/50 px-3 py-1 text-xs text-cyan-300">
              {statusLabels[project.status] ?? project.status}
            </span>
            <button type="button" onClick={() => setEditing((v) => !v)} className={btnGhost}>
              {editing ? "Fermer" : "Éditer"}
            </button>
          </div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-900">
          <div className="h-full rounded-full bg-cyan-400/80" style={{ width: `${project.progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-zinc-600">{project.progress}% complété</p>

        {editing && (
          <WebsiteProjectForm
            orgId={orgId}
            project={project}
            isPending={isPending}
            onSubmit={(data) => run(() => upsertWebsiteProjectAction(data), () => setEditing(false))}
          />
        )}
      </section>

      <div className="grid gap-3 md:grid-cols-4">
        {steps.map(([label, status]) => (
          <div key={label} className="rounded-lg border border-zinc-800 bg-zinc-900/20 p-4">
            <p className="text-sm font-medium text-white">{label}</p>
            <p className="mt-1 text-sm text-zinc-500">{statusLabels[status] ?? status}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-6 py-5">
          <p className="mb-4 text-sm font-medium text-zinc-200">Checklist</p>
          <div className="mb-3 flex gap-2">
            <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Nouvelle tâche…" className={inputClass} />
            <button
              type="button"
              disabled={isPending || !taskTitle.trim()}
              onClick={() =>
                run(
                  () => createWebsiteTaskAction({ organizationId: orgId, websiteProjectId: project.id, title: taskTitle.trim() }),
                  () => setTaskTitle(""),
                )
              }
              className={btnPrimary}
            >
              Ajouter
            </button>
          </div>
          <div className="grid gap-2">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 px-4 py-3">
                <div>
                  <p className="text-sm text-white">{task.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-600">{task.assignedTo ?? "F5L"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={task.status}
                    disabled={isPending}
                    onChange={(e) => run(() => updateWebsiteTaskAction({ id: task.id, organizationId: orgId, status: e.target.value }))}
                    className="h-7 rounded-lg border border-zinc-800 bg-zinc-950 px-2 text-[11px] text-zinc-300 outline-none"
                  >
                    {["todo", "in_progress", "done"].map((s) => (
                      <option key={s} value={s}>{statusLabels[s] ?? s}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => run(() => deleteWebsiteTaskAction({ id: task.id, organizationId: orgId }))}
                    className="text-xs text-zinc-600 transition-colors hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-6 py-5">
          <p className="mb-4 text-sm font-medium text-zinc-200">Liens</p>
          <div className="grid gap-2">
            <UrlRow label="Preview" href={project.previewUrl} />
            <UrlRow label="Production" href={project.productionUrl} />
            <UrlRow label="Domaine" href={project.domain ? `https://${project.domain}` : null} />
          </div>
        </div>
      </div>
    </div>
  );
}

function WebsiteProjectForm({
  orgId,
  project,
  isPending,
  onSubmit,
}: {
  orgId: string;
  project: NonNullable<WebsiteOverview["project"]>;
  isPending: boolean;
  onSubmit: (data: {
    organizationId: string;
    id: string;
    status: string;
    currentStep: string;
    progress: number;
    domain: string;
    previewUrl: string;
    productionUrl: string;
    contentStatus: string;
    designStatus: string;
    developmentStatus: string;
    deploymentStatus: string;
  }) => void;
}) {
  const [f, setF] = useState({
    status: project.status,
    currentStep: project.currentStep ?? "",
    progress: project.progress,
    domain: project.domain ?? "",
    previewUrl: project.previewUrl ?? "",
    productionUrl: project.productionUrl ?? "",
    contentStatus: project.contentStatus,
    designStatus: project.designStatus,
    developmentStatus: project.developmentStatus,
    deploymentStatus: project.deploymentStatus,
  });
  const stepStatuses = ["waiting", "planned", "in_progress", "done"];

  return (
    <div className="mt-5 grid gap-2 border-t border-zinc-800/60 pt-5 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-xs text-zinc-500">
        Étape actuelle
        <input value={f.currentStep} onChange={(e) => setF({ ...f, currentStep: e.target.value })} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-500">
        Avancement (%)
        <input type="number" min={0} max={100} value={f.progress} onChange={(e) => setF({ ...f, progress: Number(e.target.value) })} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-500">
        Statut global
        <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className={inputClass}>
          {SERVICE_STATUSES.map((s) => <option key={s} value={s}>{statusLabels[s] ?? s}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-500">
        Domaine
        <input value={f.domain} onChange={(e) => setF({ ...f, domain: e.target.value })} placeholder="exemple.fr" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-500">
        URL preview
        <input value={f.previewUrl} onChange={(e) => setF({ ...f, previewUrl: e.target.value })} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-zinc-500">
        URL production
        <input value={f.productionUrl} onChange={(e) => setF({ ...f, productionUrl: e.target.value })} className={inputClass} />
      </label>
      {([
        ["contentStatus", "Contenus"],
        ["designStatus", "Design"],
        ["developmentStatus", "Développement"],
        ["deploymentStatus", "Déploiement"],
      ] as const).map(([key, label]) => (
        <label key={key} className="flex flex-col gap-1 text-xs text-zinc-500">
          {label}
          <select value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })} className={inputClass}>
            {stepStatuses.map((s) => <option key={s} value={s}>{statusLabels[s] ?? s}</option>)}
          </select>
        </label>
      ))}
      <div className="sm:col-span-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => onSubmit({ organizationId: orgId, id: project.id, ...f })}
          className={btnPrimary}
        >
          Enregistrer
        </button>
      </div>
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

// ─── Publicité : campagnes manuelles ──────────────────────────────────────────

function AdsTab({ orgId, meta, google }: { orgId: string; meta: AdsOverview; google: AdsOverview }) {
  return (
    <div className="grid gap-6">
      <AdsPlatform orgId={orgId} title="Meta Ads" platform="meta" data={meta} />
      <AdsPlatform orgId={orgId} title="Google Ads" platform="google" data={google} />
    </div>
  );
}

function AdsPlatform({
  orgId,
  title,
  platform,
  data,
}: {
  orgId: string;
  title: string;
  platform: "meta" | "google";
  data: AdsOverview;
}) {
  const { run, isPending } = useAdminAction();
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ name: "", objective: "", status: "active", budget: "", spend: "", leads: "", clicks: "", conversions: "", impressions: "" });

  function toCents(v: string) {
    const n = parseFloat(v.replace(",", "."));
    return Number.isFinite(n) ? Math.round(n * 100) : undefined;
  }
  function toInt(v: string) {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : undefined;
  }

  function submit() {
    run(
      () =>
        createAdCampaignAction({
          organizationId: orgId,
          platform,
          name: f.name.trim(),
          objective: f.objective.trim() || undefined,
          status: f.status,
          budget: toCents(f.budget),
          spend: toCents(f.spend),
          leads: toInt(f.leads),
          clicks: toInt(f.clicks),
          conversions: toInt(f.conversions),
          impressions: toInt(f.impressions),
        }),
      () => {
        setF({ name: "", objective: "", status: "active", budget: "", spend: "", leads: "", clicks: "", conversions: "", impressions: "" });
        setAdding(false);
      },
    );
  }

  return (
    <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-6 py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-zinc-200">{title}</p>
        <button type="button" onClick={() => setAdding((v) => !v)} className={btnGhost}>
          {adding ? "Annuler" : "Ajouter une campagne"}
        </button>
      </div>

      {adding && (
        <div className="mb-4 grid gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 p-4 sm:grid-cols-3">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Nom de la campagne" className={inputClass} />
          <input value={f.objective} onChange={(e) => setF({ ...f, objective: e.target.value })} placeholder="Objectif" className={inputClass} />
          <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className={inputClass}>
            {["draft", "active", "paused", "done"].map((s) => <option key={s} value={s}>{statusLabels[s] ?? s}</option>)}
          </select>
          <input value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} placeholder="Budget €" className={inputClass} />
          <input value={f.spend} onChange={(e) => setF({ ...f, spend: e.target.value })} placeholder="Dépensé €" className={inputClass} />
          <input value={f.leads} onChange={(e) => setF({ ...f, leads: e.target.value })} placeholder="Leads" className={inputClass} />
          <input value={f.clicks} onChange={(e) => setF({ ...f, clicks: e.target.value })} placeholder="Clics" className={inputClass} />
          <input value={f.conversions} onChange={(e) => setF({ ...f, conversions: e.target.value })} placeholder="Conversions" className={inputClass} />
          <input value={f.impressions} onChange={(e) => setF({ ...f, impressions: e.target.value })} placeholder="Impressions" className={inputClass} />
          <div className="sm:col-span-3">
            <button type="button" onClick={submit} disabled={isPending || !f.name.trim()} className={btnPrimary}>Ajouter</button>
          </div>
        </div>
      )}

      {data.campaigns.length === 0 ? (
        <EmptyNote>Aucune campagne {title} pour ce client pour l&apos;instant.</EmptyNote>
      ) : (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-4">
            <Stat label="Budget" value={formatMoneyCents(data.totals.budget)} />
            <Stat label="Dépenses" value={formatMoneyCents(data.totals.spend)} />
            <Stat label="Leads" value={String(data.totals.leads)} />
            <Stat label="Clics" value={String(data.totals.clicks)} />
          </div>
          <div className="grid gap-2">
            {data.campaigns.map((campaign) => (
              <div key={campaign.id} className="rounded-lg border border-zinc-800 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">{campaign.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">{campaign.objective ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">{statusLabels[campaign.status] ?? campaign.status}</span>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        if (confirm("Supprimer cette campagne ?"))
                          run(() => deleteAdCampaignAction({ id: campaign.id, organizationId: orgId }));
                      }}
                      className="text-xs text-zinc-600 transition-colors hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-zinc-500 sm:grid-cols-4">
                  <span>{formatMoneyCents(campaign.spend)} dépensés</span>
                  <span>{campaign.leads} leads</span>
                  <span>{campaign.conversions} conversions</span>
                  <span>{campaign.impressions} impressions</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function CrmTab({ crm }: { crm: CrmOverview }) {
  if (crm.stages.length === 0 && crm.leads.length === 0) {
    return <EmptyNote>Aucune donnée CRM pour ce client pour l&apos;instant.</EmptyNote>;
  }
  return (
    <div className="grid gap-4">
      <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-6 py-5">
        <p className="mb-4 text-sm font-medium text-zinc-200">Pipeline</p>
        <div className="grid gap-3 md:grid-cols-4">
          {crm.stages.map((stage) => (
            <div key={stage.id} className="rounded-lg border border-zinc-800 p-4">
              <p className="text-sm text-white">{stage.name}</p>
              <p className="mt-1 text-xs text-zinc-600">Position {stage.position}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-6 py-5">
        <p className="mb-4 text-sm font-medium text-zinc-200">Leads récents</p>
        <div className="grid gap-2">
          {crm.leads.map((lead) => (
            <div key={lead.id} className="rounded-lg border border-zinc-800 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">{lead.fullName}</p>
                  <p className="mt-1 text-xs text-zinc-500">{lead.email ?? lead.phone ?? "Coordonnées à compléter"}</p>
                </div>
                <span className="text-xs text-zinc-500">{lead.status}</span>
              </div>
              <p className="mt-2 text-xs text-zinc-600">Prochaine action : {formatDate(lead.nextActionAt)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function AutomationsTab({
  automations,
  aiAgents,
}: {
  automations: AutomationOverview;
  aiAgents: AiAgentsOverview;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-6 py-5">
        <p className="mb-4 text-sm font-medium text-zinc-200">Automatisations</p>
        {automations.automations.length === 0 && <EmptyNote>Aucune automatisation pour l&apos;instant.</EmptyNote>}
        <div className="grid gap-2">
          {automations.automations.map((a) => (
            <div key={a.id} className="rounded-lg border border-zinc-800 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-white">{a.name}</p>
                <span className="text-xs text-zinc-500">{statusLabels[a.status] ?? a.status}</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">{a.description}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-6 py-5">
        <p className="mb-4 text-sm font-medium text-zinc-200">Agents IA</p>
        {aiAgents.agents.length === 0 && <EmptyNote>Aucun agent IA pour l&apos;instant.</EmptyNote>}
        <div className="grid gap-2">
          {aiAgents.agents.map((agent) => (
            <div key={agent.id} className="rounded-lg border border-zinc-800 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-white">{agent.name}</p>
                <span className="text-xs text-zinc-500">{statusLabels[agent.status] ?? agent.status}</span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">{agent.role}</p>
            </div>
          ))}
        </div>
        {aiAgents.logs.length > 0 && (
          <div className="mt-4 border-t border-zinc-800/60 pt-4">
            <p className="mb-2 text-xs font-medium text-zinc-500">Journal</p>
            <div className="grid gap-1.5">
              {aiAgents.logs.map((log) => (
                <p key={log.id} className="text-xs text-zinc-600">
                  {formatDate(log.createdAt)} — {log.content}
                </p>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function RequestsTab({ requests }: { requests: PortalRequest[] }) {
  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800/80 px-6 py-16 text-center">
        <p className="text-sm text-zinc-500">Aucune demande de ce client pour l&apos;instant.</p>
      </div>
    );
  }
  return (
    <div className="grid gap-3">
      {requests.map((request) => (
        <div key={request.id} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-white">{request.title}</h3>
            <span className="text-xs text-zinc-500">{statusLabels[request.status] ?? request.status}</span>
          </div>
          <p className="mt-2 text-sm text-zinc-500">{request.description}</p>
          <p className="mt-2 text-xs text-zinc-600">
            {request.category} · {request.priority} · {formatDate(request.createdAt)}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Réglages : feature flags + push de notification ──────────────────────────

function SettingsTab({
  orgId,
  features,
}: {
  orgId: string;
  features: Organization["features"];
}) {
  const { run, isPending } = useAdminAction();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const enabledSet = new Set(features.filter((f) => f.enabled).map((f) => f.featureKey));
  const allKeys = Object.keys(FEATURE_LABELS) as FeatureKey[];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-6 py-5">
        <p className="mb-4 text-sm font-medium text-zinc-200">Modules activés</p>
        <div className="grid gap-2">
          {allKeys.map((key) => {
            const enabled = enabledSet.has(key);
            return (
              <div key={key} className="flex items-center justify-between rounded-lg border border-zinc-800 px-4 py-2.5">
                <span className="text-sm text-zinc-300">{FEATURE_LABELS[key]}</span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => run(() => setOrganizationFeatureAction({ organizationId: orgId, featureKey: key, enabled: !enabled }))}
                  className={`relative h-6 w-11 rounded-full transition-colors ${enabled ? "bg-emerald-600" : "bg-zinc-700"}`}
                  aria-label={`Activer ${FEATURE_LABELS[key]}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${enabled ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-6 py-5">
        <p className="mb-4 text-sm font-medium text-zinc-200">Envoyer une notification au client</p>
        <div className="grid gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre" className={inputClass} />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message…"
            rows={3}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-zinc-600"
          />
          <button
            type="button"
            disabled={isPending || !title.trim() || !message.trim()}
            onClick={() =>
              run(
                () => createClientNotificationAction({ organizationId: orgId, title: title.trim(), message: message.trim() }),
                () => { setTitle(""); setMessage(""); },
              )
            }
            className={`${btnPrimary} w-fit`}
          >
            Envoyer
          </button>
        </div>
      </section>
    </div>
  );
}
