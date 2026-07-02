"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/roles";
import type { FeatureKey } from "@/lib/auth/features";
import { prisma } from "@/lib/prisma";

// Toutes les actions de ce fichier pilotent les données F5L Brain d'un client
// depuis la fiche Suivi client (admin). Garde requireAdmin() systématique.

function revalidateOrg(organizationId: string) {
  revalidatePath(`/dashboard/suivi-client/${organizationId}`);
  revalidatePath("/dashboard/suivi-client");
}

// ─── F5lService ───────────────────────────────────────────────────────────────

export async function createServiceAction(input: {
  organizationId: string;
  type: string;
  name: string;
  status: string;
  description?: string;
}) {
  await requireAdmin();
  await prisma.f5lService.create({
    data: {
      organizationId: input.organizationId,
      type: input.type,
      name: input.name,
      status: input.status,
      description: input.description || null,
    },
  });
  revalidateOrg(input.organizationId);
}

export async function updateServiceAction(input: {
  id: string;
  organizationId: string;
  name?: string;
  status?: string;
  progress?: number;
  description?: string;
}) {
  await requireAdmin();
  await prisma.f5lService.update({
    where: { id: input.id },
    data: {
      name: input.name,
      status: input.status,
      progress: input.progress,
      description: input.description,
    },
  });
  revalidateOrg(input.organizationId);
}

export async function deleteServiceAction(input: { id: string; organizationId: string }) {
  await requireAdmin();
  await prisma.f5lService.delete({ where: { id: input.id } });
  revalidateOrg(input.organizationId);
}

// ─── WebsiteProject + WebsiteTask ─────────────────────────────────────────────

export async function upsertWebsiteProjectAction(input: {
  organizationId: string;
  id?: string;
  status?: string;
  currentStep?: string;
  progress?: number;
  domain?: string;
  previewUrl?: string;
  productionUrl?: string;
  contentStatus?: string;
  designStatus?: string;
  developmentStatus?: string;
  deploymentStatus?: string;
}) {
  await requireAdmin();
  const data = {
    status: input.status ?? "planned",
    currentStep: input.currentStep || null,
    progress: input.progress ?? 0,
    domain: input.domain || null,
    previewUrl: input.previewUrl || null,
    productionUrl: input.productionUrl || null,
    contentStatus: input.contentStatus ?? "waiting",
    designStatus: input.designStatus ?? "planned",
    developmentStatus: input.developmentStatus ?? "planned",
    deploymentStatus: input.deploymentStatus ?? "planned",
  };

  if (input.id) {
    await prisma.websiteProject.update({ where: { id: input.id }, data });
  } else {
    await prisma.websiteProject.create({
      data: { organizationId: input.organizationId, ...data },
    });
  }
  revalidateOrg(input.organizationId);
}

export async function createWebsiteTaskAction(input: {
  organizationId: string;
  websiteProjectId: string;
  title: string;
  assignedTo?: string;
}) {
  await requireAdmin();
  await prisma.websiteTask.create({
    data: {
      websiteProjectId: input.websiteProjectId,
      title: input.title,
      assignedTo: input.assignedTo || null,
      status: "todo",
    },
  });
  revalidateOrg(input.organizationId);
}

export async function updateWebsiteTaskAction(input: {
  id: string;
  organizationId: string;
  title?: string;
  status?: string;
  assignedTo?: string;
}) {
  await requireAdmin();
  await prisma.websiteTask.update({
    where: { id: input.id },
    data: { title: input.title, status: input.status, assignedTo: input.assignedTo },
  });
  revalidateOrg(input.organizationId);
}

export async function deleteWebsiteTaskAction(input: { id: string; organizationId: string }) {
  await requireAdmin();
  await prisma.websiteTask.delete({ where: { id: input.id } });
  revalidateOrg(input.organizationId);
}

// ─── AdCampaign (saisie manuelle, montants en centimes) ───────────────────────

export async function createAdCampaignAction(input: {
  organizationId: string;
  platform: string; // meta | google
  name: string;
  status?: string;
  objective?: string;
  budget?: number;
  spend?: number;
  leads?: number;
  clicks?: number;
  conversions?: number;
  impressions?: number;
}) {
  await requireAdmin();
  await prisma.adCampaign.create({
    data: {
      organizationId: input.organizationId,
      platform: input.platform,
      name: input.name,
      status: input.status ?? "draft",
      objective: input.objective || null,
      budget: input.budget ?? null,
      spend: input.spend ?? null,
      leads: input.leads ?? 0,
      clicks: input.clicks ?? 0,
      conversions: input.conversions ?? 0,
      impressions: input.impressions ?? 0,
    },
  });
  revalidateOrg(input.organizationId);
}

export async function updateAdCampaignAction(input: {
  id: string;
  organizationId: string;
  name?: string;
  status?: string;
  objective?: string;
  budget?: number;
  spend?: number;
  leads?: number;
  clicks?: number;
  conversions?: number;
  impressions?: number;
}) {
  await requireAdmin();
  await prisma.adCampaign.update({
    where: { id: input.id },
    data: {
      name: input.name,
      status: input.status,
      objective: input.objective,
      budget: input.budget,
      spend: input.spend,
      leads: input.leads,
      clicks: input.clicks,
      conversions: input.conversions,
      impressions: input.impressions,
    },
  });
  revalidateOrg(input.organizationId);
}

export async function deleteAdCampaignAction(input: { id: string; organizationId: string }) {
  await requireAdmin();
  await prisma.adCampaign.delete({ where: { id: input.id } });
  revalidateOrg(input.organizationId);
}

// ─── ClientNotification (push admin → portail) ────────────────────────────────

export async function createClientNotificationAction(input: {
  organizationId: string;
  title: string;
  message: string;
}) {
  await requireAdmin();
  await prisma.clientNotification.create({
    data: {
      organizationId: input.organizationId,
      title: input.title,
      message: input.message,
      userId: null, // visible par toute l'organisation
    },
  });
  revalidateOrg(input.organizationId);
  revalidatePath("/client");
}

// ─── Feature flags ────────────────────────────────────────────────────────────

export async function setOrganizationFeatureAction(input: {
  organizationId: string;
  featureKey: FeatureKey;
  enabled: boolean;
}) {
  await requireAdmin();
  await prisma.organizationFeature.upsert({
    where: {
      organizationId_featureKey: {
        organizationId: input.organizationId,
        featureKey: input.featureKey,
      },
    },
    create: {
      organizationId: input.organizationId,
      featureKey: input.featureKey,
      enabled: input.enabled,
    },
    update: { enabled: input.enabled },
  });
  revalidateOrg(input.organizationId);
  revalidatePath("/client");
}
