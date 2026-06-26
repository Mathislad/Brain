import "server-only";

import { prisma } from "@/lib/prisma";
import {
  isClientLinkCategory,
  type ClientLinkInput,
  type BillingInput,
  type PaymentInput,
  type SyncedClientPayment,
} from "@/lib/client-types";

export type { ClientLink, Payment } from "@/generated/prisma/client";

/** Tous les paiements clients de l'utilisateur, aplatis pour la compta. */
export async function getClientPaymentsForAccounting(
  userId: string,
): Promise<SyncedClientPayment[]> {
  const payments = await prisma.payment.findMany({
    where: { userId },
    orderBy: { paidAt: "desc" },
    include: { prospect: { select: { nom: true, entreprise: true } } },
  });

  return payments.map((p) => ({
    id: p.id,
    amount: p.amount / 100,
    date: new Date(p.paidAt).toISOString().slice(0, 10),
    label: p.label ?? "Paiement client",
    clientName: p.prospect.entreprise || p.prospect.nom,
  }));
}

function clean(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

/** Tous les clients (prospects au statut DONE) avec leurs liens et paiements. */
export async function getClientsWithLinks(userId: string) {
  return prisma.prospect.findMany({
    where: { userId, status: "DONE" },
    orderBy: [{ entreprise: "asc" }, { nom: "asc" }],
    include: {
      links: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { paidAt: "desc" } },
    },
  });
}

export async function addClientLink(userId: string, data: ClientLinkInput) {
  if (!isClientLinkCategory(data.category)) {
    throw new Error("Catégorie de lien invalide.");
  }
  const label = clean(data.label, 160);
  const value = clean(data.value, 1000);
  if (!label || !value) {
    throw new Error("Le libellé et la valeur sont requis.");
  }

  // Vérifie que le client appartient bien à l'utilisateur
  const owner = await prisma.prospect.findFirst({
    where: { id: data.prospectId, userId },
    select: { id: true },
  });
  if (!owner) throw new Error("Client introuvable.");

  return prisma.clientLink.create({
    data: {
      userId,
      prospectId: data.prospectId,
      category: data.category,
      label,
      value,
    },
  });
}

export async function deleteClientLink(userId: string, linkId: string) {
  return prisma.clientLink.deleteMany({ where: { id: linkId, userId } });
}

// ─── Facturation ──────────────────────────────────────────────────────────────

async function assertOwner(userId: string, prospectId: string) {
  const owner = await prisma.prospect.findFirst({
    where: { id: prospectId, userId },
    select: { id: true },
  });
  if (!owner) throw new Error("Client introuvable.");
}

export async function updateClientBilling(userId: string, data: BillingInput) {
  await assertOwner(userId, data.prospectId);

  const formule = data.formule?.trim().slice(0, 160) || null;
  const montantTotal =
    typeof data.montantTotal === "number" && Number.isFinite(data.montantTotal)
      ? Math.max(0, Math.round(data.montantTotal))
      : null;

  return prisma.prospect.update({
    where: { id: data.prospectId, userId },
    data: {
      formule,
      montantTotal,
      devisSigne: Boolean(data.devisSigne),
    },
  });
}

export async function addPayment(userId: string, data: PaymentInput) {
  await assertOwner(userId, data.prospectId);

  if (!Number.isFinite(data.amount) || data.amount <= 0) {
    throw new Error("Le montant doit être positif.");
  }

  const paidAt = data.paidAt ? new Date(data.paidAt) : new Date();
  if (Number.isNaN(paidAt.getTime())) {
    throw new Error("Date invalide.");
  }

  return prisma.payment.create({
    data: {
      userId,
      prospectId: data.prospectId,
      amount: Math.round(data.amount),
      label: data.label?.trim().slice(0, 160) || null,
      paidAt,
    },
  });
}

export async function deletePayment(userId: string, paymentId: string) {
  return prisma.payment.deleteMany({ where: { id: paymentId, userId } });
}
