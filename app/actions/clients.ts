"use server";

import { revalidatePath } from "next/cache";

import {
  addClientLink,
  deleteClientLink,
  updateClientBilling,
  addPayment,
  deletePayment,
} from "@/lib/clients-db";
import type {
  ClientLinkInput,
  BillingInput,
  PaymentInput,
} from "@/lib/client-types";
import { requireAdmin } from "@/lib/auth/roles";
import { DEFAULT_FEATURES } from "@/lib/auth/features";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";

const WRITE_LIMIT = { limit: 120, windowMs: 60 * 1000 };

function revalidateClient() {
  revalidatePath("/dashboard/entreprise/client", "layout");
}

function revalidateClientAndAccounting() {
  revalidatePath("/dashboard/entreprise/client", "layout");
  revalidatePath("/dashboard/entreprise/comptabilite", "layout");
}

export async function addClientLinkAction(data: ClientLinkInput): Promise<void> {
  const user = await requireAdmin();
  enforceRateLimit(`client-link:${user.id}`, WRITE_LIMIT);
  await addClientLink(user.id, data);
  revalidateClient();
}

export async function deleteClientLinkAction(linkId: string): Promise<void> {
  const user = await requireAdmin();
  enforceRateLimit(`client-link:${user.id}`, WRITE_LIMIT);
  await deleteClientLink(user.id, linkId);
  revalidateClient();
}

// ─── Facturation ──────────────────────────────────────────────────────────────

export async function updateClientBillingAction(data: BillingInput): Promise<void> {
  const user = await requireAdmin();
  enforceRateLimit(`client-billing:${user.id}`, WRITE_LIMIT);
  await updateClientBilling(user.id, data);
  revalidateClient();
}

export async function addPaymentAction(data: PaymentInput): Promise<void> {
  const user = await requireAdmin();
  enforceRateLimit(`client-payment:${user.id}`, WRITE_LIMIT);
  await addPayment(user.id, data);
  // Payment partagé avec la Comptabilité → revalider les deux pages
  revalidateClientAndAccounting();
}

export async function deletePaymentAction(paymentId: string): Promise<void> {
  const user = await requireAdmin();
  enforceRateLimit(`client-payment:${user.id}`, WRITE_LIMIT);
  await deletePayment(user.id, paymentId);
  revalidateClientAndAccounting();
}

// ─── Conversion prospect → fiche client ───────────────────────────────────────
// Passe le prospect en « Client » et crée (si absente) l'Organisation portail
// liée. Anti-doublon : réutilise l'Organisation existante. Les services sont
// seedés plus tard depuis l'offre choisie à l'invitation (flux inchangé).
export async function createClientFromProspectAction(
  prospectId: string,
): Promise<{ organizationId: string }> {
  const user = await requireAdmin();
  enforceRateLimit(`client-create:${user.id}`, WRITE_LIMIT);

  const prospect = await prisma.prospect.findFirst({
    where: { id: prospectId, userId: user.id },
  });
  if (!prospect) throw new Error("Prospect introuvable.");

  // Promotion commerciale : un prospect non encore client passe à « Client ».
  if (prospect.status === "TODO" || prospect.status === "IN_PROGRESS") {
    await prisma.prospect.update({
      where: { id: prospect.id },
      data: { status: "DONE" },
    });
  }

  // Anti-doublon : une seule Organisation par prospect (contrainte @unique).
  let org = await prisma.organization.findFirst({
    where: { prospectId: prospect.id },
  });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: prospect.entreprise?.trim() || prospect.nom,
        type: "client",
        status: "pending",
        prospectId: prospect.id,
      },
    });

    await prisma.organizationFeature.createMany({
      data: Object.entries(DEFAULT_FEATURES).map(([key, enabled]) => ({
        organizationId: org!.id,
        featureKey: key,
        enabled,
      })),
      skipDuplicates: true,
    });

    await prisma.organizationBilling.upsert({
      where: { organizationId: org.id },
      create: { organizationId: org.id, subscriptionStatus: "inactive", isSimulated: true },
      update: {},
    });
  }

  revalidatePath("/dashboard/prospection", "layout");
  revalidatePath("/dashboard/entreprise/client", "layout");
  revalidatePath("/dashboard/suivi-client", "layout");

  return { organizationId: org.id };
}

// ─── Retour arrière : client → prospect ───────────────────────────────────────
// Remet le prospect dans le CRM (statut Rendez-vous) et SUPPRIME l'Organisation
// portail liée (cascade : accès client, services, campagnes, documents...).
// Le Prospect et ses données CRM (liens, paiements, documents devis/factures)
// sont conservés. Destructif côté portail : à confirmer côté UI.
export async function revertClientToProspectAction(
  prospectId: string,
): Promise<{ hadPortalAccess: boolean }> {
  const user = await requireAdmin();
  enforceRateLimit(`client-revert:${user.id}`, WRITE_LIMIT);

  const prospect = await prisma.prospect.findFirst({
    where: { id: prospectId, userId: user.id },
    include: { organization: { include: { members: true } } },
  });
  if (!prospect) throw new Error("Prospect introuvable.");

  const hadPortalAccess = (prospect.organization?.members.length ?? 0) > 0;

  // Supprime l'Organisation portail liée (cascade sur toutes ses données).
  if (prospect.organization) {
    await prisma.organization.delete({ where: { id: prospect.organization.id } });
  }

  // Repasse le prospect en « Rendez-vous » (sort des fiches client).
  await prisma.prospect.update({
    where: { id: prospect.id },
    data: { status: "IN_PROGRESS" },
  });

  revalidatePath("/dashboard/prospection", "layout");
  revalidatePath("/dashboard/entreprise/client", "layout");
  revalidatePath("/dashboard/suivi-client", "layout");

  return { hadPortalAccess };
}
