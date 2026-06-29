import "server-only";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

// ─── Helpers role ─────────────────────────────────────────────────────────────

export async function getClientMembership(userId: string) {
  return prisma.organizationMember.findFirst({
    where: {
      userId,
      role: "CLIENT",
      organization: { status: "active" },
    },
    include: {
      organization: {
        include: { billing: true, features: true },
      },
    },
  });
}

export async function isOrgAdmin(userId: string, orgId: string): Promise<boolean> {
  const m = await prisma.organizationMember.findFirst({
    where: { userId, organizationId: orgId, role: { in: ["OWNER", "ADMIN"] } },
  });
  return !!m;
}

export async function isInternalAdmin(userId: string): Promise<boolean> {
  return isOrgAdmin(userId, "org_internal_f5l");
}

// ─── Guards (redirect sur non-auth) ──────────────────────────────────────────

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// Vérifie que l'utilisateur est admin de l'org interne (Brain admin = Mathis).
// En V1 Brain est mono-utilisateur — on garde la compatibilité avec le dashboard layout.
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// Vérifie que l'utilisateur est un client actif d'une organisation.
export async function requireClient() {
  const user = await getCurrentUser();
  if (!user) redirect("/client/login");

  const membership = await getClientMembership(user.id);
  if (!membership) redirect("/client/login");

  return { user, membership, organization: membership.organization };
}
