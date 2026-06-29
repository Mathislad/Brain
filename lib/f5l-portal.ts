import "server-only";

import { prisma } from "@/lib/prisma";

export type ServiceType =
  | "website"
  | "meta_ads"
  | "google_ads"
  | "crm"
  | "ai_agent"
  | "automation"
  | "support";

export type PortalService = {
  id: string;
  type: ServiceType;
  name: string;
  status: string;
  progress: number;
  description: string;
  updatedAt: Date;
  source: "db" | "mock";
};

export type PortalRequest = {
  id: string;
  organizationId: string;
  organizationName?: string;
  category: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
  source: "db" | "mock";
};

const now = () => new Date();

export const serviceLabels: Record<ServiceType, string> = {
  website: "Site internet",
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  crm: "CRM / leads",
  ai_agent: "Agents IA",
  automation: "Automatisations",
  support: "Support",
};

export const statusLabels: Record<string, string> = {
  planned: "Préparé",
  active: "Actif",
  paused: "En pause",
  done: "Terminé",
  attention: "À surveiller",
  draft: "Brouillon",
  open: "Ouverte",
  in_progress: "En cours",
  waiting_client: "Action client",
};

export function formatMoneyCents(value?: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value / 100);
}

export function formatDate(value?: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

export async function getPortalServices(organizationId: string): Promise<PortalService[]> {
  const rows = await prisma.f5lService.findMany({
    where: { organizationId },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  if (rows.length > 0) {
    return rows.map((row) => ({
      id: row.id,
      type: row.type as ServiceType,
      name: row.name,
      status: row.status,
      progress: row.progress,
      description: row.description ?? "Service F5L configuré pour cette organisation.",
      updatedAt: row.updatedAt,
      source: "db",
    }));
  }

  return mockServices();
}

export async function getPortalOverview(organizationId: string, userId: string) {
  const [services, requests, notifications] = await Promise.all([
    getPortalServices(organizationId),
    getClientRequests(organizationId),
    prisma.clientNotification.findMany({
      where: { organizationId, OR: [{ userId }, { userId: null }] },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const activeCount = services.filter((service) => service.status === "active").length;
  const openRequests = requests.filter((request) => request.status !== "done").length;

  return {
    services,
    activeCount,
    openRequests,
    notifications: notifications.length > 0
      ? notifications.map((item) => ({
          id: item.id,
          title: item.title,
          message: item.message,
          readAt: item.readAt,
          createdAt: item.createdAt,
          source: "db" as const,
        }))
      : [
          {
            id: "mock-notification-1",
            title: "Base F5L Brain activée",
            message: "Les modules sont prêts à recevoir les données réelles.",
            readAt: null,
            createdAt: now(),
            source: "mock" as const,
          },
        ],
  };
}

export async function getWebsiteOverview(organizationId: string) {
  const project = await prisma.websiteProject.findFirst({
    where: { organizationId },
    include: { tasks: { orderBy: { createdAt: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });

  if (project) {
    return {
      source: "db" as const,
      project,
      tasks: project.tasks,
    };
  }

  return {
    source: "mock" as const,
    project: {
      id: "mock-website-project",
      domain: null,
      previewUrl: null,
      productionUrl: null,
      status: "active",
      currentStep: "Cadrage et contenus",
      progress: 42,
      contentStatus: "waiting",
      designStatus: "in_progress",
      developmentStatus: "planned",
      deploymentStatus: "planned",
      updatedAt: now(),
    },
    tasks: [
      { id: "mock-task-1", title: "Valider les sections principales", status: "done", assignedTo: "F5L", dueDate: null },
      { id: "mock-task-2", title: "Envoyer les photos et contenus", status: "todo", assignedTo: "Client", dueDate: null },
      { id: "mock-task-3", title: "Préparer la première maquette", status: "in_progress", assignedTo: "F5L", dueDate: null },
    ],
  };
}

export async function getAdsOverview(organizationId: string, platform: "meta" | "google") {
  const campaigns = await prisma.adCampaign.findMany({
    where: { organizationId, platform },
    orderBy: { updatedAt: "desc" },
  });

  if (campaigns.length > 0) {
    return {
      source: "db" as const,
      campaigns,
      totals: adsTotals(campaigns),
    };
  }

  const mockCampaigns = platform === "meta" ? mockMetaCampaigns() : mockGoogleCampaigns();
  return {
    source: "mock" as const,
    campaigns: mockCampaigns,
    totals: adsTotals(mockCampaigns),
  };
}

export async function getCrmOverview(organizationId: string) {
  const [stages, leads] = await Promise.all([
    prisma.crmPipelineStage.findMany({
      where: { organizationId },
      orderBy: { position: "asc" },
    }),
    prisma.crmLead.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return {
    stages: stages.length > 0 ? stages : mockPipelineStages(),
    leads: leads.length > 0 ? leads : mockLeads(),
    source: leads.length > 0 || stages.length > 0 ? "db" as const : "mock" as const,
  };
}

export async function getAutomationOverview(organizationId: string) {
  const automations = await prisma.clientAutomation.findMany({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
  });
  return automations.length > 0 ? { source: "db" as const, automations } : { source: "mock" as const, automations: mockAutomations() };
}

export async function getAiAgentsOverview(organizationId: string) {
  const [agents, logs] = await Promise.all([
    prisma.aiAgent.findMany({
      where: { organizationId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.aiAgentLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return {
    source: agents.length > 0 || logs.length > 0 ? "db" as const : "mock" as const,
    agents: agents.length > 0 ? agents : mockAgents(),
    logs: logs.length > 0 ? logs : mockAgentLogs(),
  };
}

export async function getClientRequests(organizationId: string): Promise<PortalRequest[]> {
  const rows = await prisma.clientRequest.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });

  if (rows.length > 0) {
    return rows.map((row) => ({
      id: row.id,
      organizationId: row.organizationId,
      category: row.category,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      source: "db",
    }));
  }

  return [
    {
      id: "mock-request-1",
      organizationId,
      category: "site",
      title: "Exemple : modification d'une section",
      description: "Les futures demandes client apparaîtront ici avec leur statut.",
      status: "open",
      priority: "normal",
      createdAt: now(),
      updatedAt: now(),
      source: "mock",
    },
  ];
}

export async function getAdminClientRequests(): Promise<PortalRequest[]> {
  const rows = await prisma.clientRequest.findMany({
    include: { organization: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return rows.map((row) => ({
    id: row.id,
    organizationId: row.organizationId,
    organizationName: row.organization.name,
    category: row.category,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    source: "db",
  }));
}

function adsTotals(campaigns: Array<{ budget?: number | null; spend?: number | null; leads?: number; clicks?: number; conversions?: number; impressions?: number }>) {
  return campaigns.reduce<{ budget: number; spend: number; leads: number; clicks: number; conversions: number; impressions: number }>(
    (acc, campaign) => ({
      budget: acc.budget + (campaign.budget ?? 0),
      spend: acc.spend + (campaign.spend ?? 0),
      leads: acc.leads + (campaign.leads ?? 0),
      clicks: acc.clicks + (campaign.clicks ?? 0),
      conversions: acc.conversions + (campaign.conversions ?? 0),
      impressions: acc.impressions + (campaign.impressions ?? 0),
    }),
    { budget: 0, spend: 0, leads: 0, clicks: 0, conversions: 0, impressions: 0 },
  );
}

function mockServices(): PortalService[] {
  const updatedAt = now();
  return [
    { id: "mock-service-website", type: "website", name: "Site internet", status: "active", progress: 42, description: "Projet site prêt à être piloté depuis F5L Brain.", updatedAt, source: "mock" },
    { id: "mock-service-meta", type: "meta_ads", name: "Meta Ads", status: "planned", progress: 15, description: "Structure prête pour connecter les campagnes Meta.", updatedAt, source: "mock" },
    { id: "mock-service-google", type: "google_ads", name: "Google Ads", status: "planned", progress: 15, description: "Base prête pour les campagnes Search et locales.", updatedAt, source: "mock" },
    { id: "mock-service-crm", type: "crm", name: "CRM / leads", status: "active", progress: 55, description: "Pipeline commercial centralisé avec relances à brancher.", updatedAt, source: "mock" },
    { id: "mock-service-automation", type: "automation", name: "Automatisations", status: "planned", progress: 25, description: "Workflows de suivi et notifications client.", updatedAt, source: "mock" },
    { id: "mock-service-ai", type: "ai_agent", name: "Agents IA", status: "planned", progress: 20, description: "Agents métier préparés pour qualification et support.", updatedAt, source: "mock" },
  ];
}

function mockMetaCampaigns() {
  return [
    { id: "mock-meta-1", name: "Acquisition locale", status: "active", objective: "Messages qualifiés", budget: 90000, spend: 31200, leads: 18, cpl: 1733, impressions: 24800, clicks: 612, conversions: 18, updatedAt: now() },
    { id: "mock-meta-2", name: "Retargeting visiteurs", status: "planned", objective: "Relance audiences chaudes", budget: 30000, spend: 0, leads: 0, cpl: null, impressions: 0, clicks: 0, conversions: 0, updatedAt: now() },
  ];
}

function mockGoogleCampaigns() {
  return [
    { id: "mock-google-1", name: "Search intention forte", status: "active", objective: "Demandes entrantes", budget: 120000, spend: 48600, leads: 0, cpl: null, impressions: 7400, clicks: 318, conversions: 12, updatedAt: now() },
    { id: "mock-google-2", name: "Campagne locale", status: "planned", objective: "Visibilité zone de chalandise", budget: 60000, spend: 0, leads: 0, cpl: null, impressions: 0, clicks: 0, conversions: 0, updatedAt: now() },
  ];
}

function mockPipelineStages() {
  return [
    { id: "mock-stage-1", name: "Nouveau", position: 1 },
    { id: "mock-stage-2", name: "Contacté", position: 2 },
    { id: "mock-stage-3", name: "Rendez-vous", position: 3 },
    { id: "mock-stage-4", name: "Client", position: 4 },
  ];
}

function mockLeads() {
  return [
    { id: "mock-lead-1", fullName: "Lead exemple", email: "contact@exemple.fr", phone: null, source: "Site", status: "new", value: null, lastContactAt: null, nextActionAt: now(), createdAt: now() },
    { id: "mock-lead-2", fullName: "Demande campagne", email: null, phone: "06 00 00 00 00", source: "Meta Ads", status: "contacted", value: null, lastContactAt: now(), nextActionAt: null, createdAt: now() },
  ];
}

function mockAutomations() {
  return [
    { id: "mock-auto-1", name: "Notification nouveau lead", type: "lead_alert", status: "planned", description: "Prévenir F5L et le client à l'arrivée d'un lead.", lastRunAt: null, nextRunAt: null, updatedAt: now() },
    { id: "mock-auto-2", name: "Relance prospect", type: "follow_up", status: "planned", description: "Préparer une séquence de relance automatique.", lastRunAt: null, nextRunAt: null, updatedAt: now() },
  ];
}

function mockAgents() {
  return [
    { id: "mock-agent-1", name: "Agent qualification", role: "Qualification client", status: "planned", description: "Prépare les questions et résume les demandes entrantes.", lastActivityAt: null, updatedAt: now() },
    { id: "mock-agent-2", name: "Agent support", role: "Support et suivi", status: "planned", description: "Aide à classer les demandes client.", lastActivityAt: null, updatedAt: now() },
  ];
}

function mockAgentLogs() {
  return [
    { id: "mock-log-1", type: "info", content: "Journal prêt pour les futures actions IA.", status: "done", createdAt: now() },
  ];
}
