import "server-only";

import { prisma } from "@/lib/prisma";

export * from "@/lib/f5l-portal-format";
import type { PortalService, PortalRequest, ServiceType } from "@/lib/f5l-portal-format";

export async function getPortalServices(organizationId: string): Promise<PortalService[]> {
  const rows = await prisma.f5lService.findMany({
    where: { organizationId },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

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
    notifications: notifications.map((item) => ({
      id: item.id,
      title: item.title,
      message: item.message,
      readAt: item.readAt,
      createdAt: item.createdAt,
      source: "db" as const,
    })),
  };
}

export async function getWebsiteOverview(organizationId: string) {
  const project = await prisma.websiteProject.findFirst({
    where: { organizationId },
    include: { tasks: { orderBy: { createdAt: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });

  return {
    source: "db" as const,
    project,
    tasks: project?.tasks ?? [],
  };
}

export async function getAdsOverview(organizationId: string, platform: "meta" | "google") {
  const campaigns = await prisma.adCampaign.findMany({
    where: { organizationId, platform },
    orderBy: { updatedAt: "desc" },
  });

  return {
    source: "db" as const,
    campaigns,
    totals: adsTotals(campaigns),
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

  return { stages, leads, source: "db" as const };
}

export async function getAutomationOverview(organizationId: string) {
  const automations = await prisma.clientAutomation.findMany({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
  });
  return { source: "db" as const, automations };
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

  return { source: "db" as const, agents, logs };
}

export async function getClientRequests(organizationId: string): Promise<PortalRequest[]> {
  const rows = await prisma.clientRequest.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
  });

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

export async function getOrganizationDetail(organizationId: string) {
  return prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      prospect: { select: { nom: true, email: true, telephone: true, ville: true } },
      billing: true,
      features: true,
      members: { where: { role: "CLIENT" } },
    },
  });
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
