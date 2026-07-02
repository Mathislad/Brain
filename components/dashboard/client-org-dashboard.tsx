"use client";

import { useState } from "react";

import {
  formatDate,
  formatMoneyCents,
  serviceLabels,
  statusLabels,
} from "@/lib/f5l-portal";
import { offerLabel } from "@/lib/offers";
import type {
  PortalRequest,
  PortalService,
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
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function ClientOrgDashboard(props: Props) {
  const { organization } = props;
  const [tab, setTab] = useState<TabKey>("overview");
  const openRequests = props.requests.filter((r) => r.status !== "done").length;

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-zinc-600">
          Suivi client
        </p>
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
              tab === t.key
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab services={props.services} />}
      {tab === "site" && <SiteTab website={props.website} />}
      {tab === "ads" && <AdsTab meta={props.metaAds} google={props.googleAds} />}
      {tab === "crm" && <CrmTab crm={props.crm} />}
      {tab === "auto" && (
        <AutomationsTab automations={props.automations} aiAgents={props.aiAgents} />
      )}
      {tab === "requests" && <RequestsTab requests={props.requests} />}
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

function SourceNote({ source }: { source: "db" | "mock" }) {
  if (source !== "mock") return null;
  return (
    <p className="mb-4 text-xs text-cyan-400/80">
      Données de démonstration — en attente de connexion réelle pour ce client.
    </p>
  );
}

function OverviewTab({ services }: { services: PortalService[] }) {
  return (
    <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-6 py-5">
      <p className="mb-4 text-sm font-medium text-zinc-200">Services F5L</p>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <div key={service.id} className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-white">
                {service.name || serviceLabels[service.type]}
              </p>
              <span className="rounded-lg border border-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">
                {statusLabels[service.status] ?? service.status}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-zinc-500">{service.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SiteTab({ website }: { website: WebsiteOverview }) {
  const { project, tasks, source } = website;
  const steps: Array<[string, string]> = [
    ["Contenus", project.contentStatus],
    ["Design", project.designStatus],
    ["Développement", project.developmentStatus],
    ["Déploiement", project.deploymentStatus],
  ];

  return (
    <div className="grid gap-4">
      <SourceNote source={source} />
      <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-zinc-500">Étape actuelle</p>
            <h2 className="mt-1 text-xl font-medium text-white">{project.currentStep ?? "À définir"}</h2>
            <p className="mt-2 text-xs text-zinc-600">Mis à jour le {formatDate(project.updatedAt)}</p>
          </div>
          <span className="w-fit rounded-lg border border-cyan-900/50 px-3 py-1 text-xs text-cyan-300">
            {statusLabels[project.status] ?? project.status}
          </span>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-900">
          <div className="h-full rounded-full bg-cyan-400/80" style={{ width: `${project.progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-zinc-600">{project.progress}% complété</p>
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
          <div className="grid gap-2">
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

function AdsTab({ meta, google }: { meta: AdsOverview; google: AdsOverview }) {
  return (
    <div className="grid gap-6">
      <AdsPlatform title="Meta Ads" data={meta} />
      <AdsPlatform title="Google Ads" data={google} />
    </div>
  );
}

function AdsPlatform({ title, data }: { title: string; data: AdsOverview }) {
  return (
    <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 px-6 py-5">
      <p className="mb-1 text-sm font-medium text-zinc-200">{title}</p>
      <SourceNote source={data.source} />
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
              <span className="text-xs text-zinc-500">{statusLabels[campaign.status] ?? campaign.status}</span>
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
    </section>
  );
}

function CrmTab({ crm }: { crm: CrmOverview }) {
  return (
    <div className="grid gap-4">
      <SourceNote source={crm.source} />
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
        <p className="mb-1 text-sm font-medium text-zinc-200">Automatisations</p>
        <SourceNote source={automations.source} />
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
        <p className="mb-1 text-sm font-medium text-zinc-200">Agents IA</p>
        <SourceNote source={aiAgents.source} />
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
