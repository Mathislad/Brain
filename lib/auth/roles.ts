import "server-only";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const INTERNAL_ORG_ID = "org_internal_f5l";

// ─── Helpers bas niveau ───────────────────────────────────────────────────────

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
  return isOrgAdmin(userId, INTERNAL_ORG_ID);
}

// Retourne le rôle de l'utilisateur courant dans l'org interne.
// null = pas de session ou pas membre.
export async function getCurrentUserRole(): Promise<"OWNER" | "ADMIN" | "CLIENT" | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const m = await prisma.organizationMember.findFirst({
    where: { userId: user.id, organizationId: INTERNAL_ORG_ID },
  });
  return (m?.role as "OWNER" | "ADMIN" | "CLIENT") ?? null;
}

// Retourne l'org cliente active de l'utilisateur courant, ou null.
export async function getCurrentOrganization() {
  const user = await getCurrentUser();
  if (!user) return null;
  const membership = await getClientMembership(user.id);
  return membership?.organization ?? null;
}

// Vérifie si l'utilisateur courant est admin Brain (OWNER ou ADMIN de l'org interne).
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return isInternalAdmin(user.id);
}

// ─── Guards (redirect) ────────────────────────────────────────────────────────

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// Guard Brain admin.
// V1 mono-utilisateur : vérifie l'authentification + appartenance org interne.
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const adminMember = await prisma.organizationMember.findFirst({
    where: {
      userId: user.id,
      organizationId: INTERNAL_ORG_ID,
      role: { in: ["OWNER", "ADMIN"] },
    },
  });
  if (!adminMember) redirect("/login");

  return user;
}

// Guard portail client.
// Vérifie auth + membership CLIENT actif.
export async function requireClient() {
  const user = await getCurrentUser();
  if (!user) redirect("/client/login");

  const membership = await getClientMembership(user.id);
  if (!membership) redirect("/client/login");

  return { user, membership, organization: membership.organization };
}
