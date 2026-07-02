"use server";

import { requireAdmin } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// Organisation du client connecté
export async function getMyOrganizationAction() {
  const user = await getCurrentUser();
  if (!user) return null;

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id, role: "CLIENT" },
    include: {
      organization: {
        include: {
          billing: true,
          features: true,
          prospect: { select: { nom: true, email: true, telephone: true } },
        },
      },
    },
  });

  return membership?.organization ?? null;
}

// Documents visibles pour le client connecté
export async function getMyDocumentsAction() {
  const user = await getCurrentUser();
  if (!user) return [];

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id, role: "CLIENT" },
  });
  if (!membership) return [];

  return prisma.clientDocument.findMany({
    where: {
      organizationId: membership.organizationId,
      OR: [
        { createdBy: user.id },
        { visibleToClient: true },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}

// Tous les clients (pour Brain admin)
export async function getClientOrgsAction() {
  await requireAdmin();

  return prisma.organization.findMany({
    where: { type: "client" },
    include: {
      prospect: { select: { nom: true, email: true, status: true } },
      billing: true,
      members: { where: { role: "CLIENT" } },
    },
    orderBy: { createdAt: "desc" },
  });
}
