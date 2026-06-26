import "server-only";

import { prisma } from "@/lib/prisma";
import {
  getTemplate,
  isDocumentKind,
  isDocumentStatus,
  type DocumentFormData,
  type DocumentStatus,
} from "@/lib/document-templates";

export type { Document } from "@/generated/prisma/client";

function clean(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

async function assertOwner(userId: string, prospectId: string) {
  const owner = await prisma.prospect.findFirst({
    where: { id: prospectId, userId },
    select: { id: true },
  });
  if (!owner) throw new Error("Client introuvable.");
}

function refPrefix(type: string): string {
  return type === "DEVIS" ? "DEV" : type === "FACTURE" ? "FAC" : "CON";
}

/**
 * Référence auto : DEV-2026-001 / FAC-2026-014 / CON-2026-002.
 * Basée sur le PLUS GRAND numéro existant (pas sur count()) pour ne jamais
 * réutiliser un numéro après suppression — important pour la numérotation
 * comptable. La collision concurrente est rattrapée par la contrainte
 * @@unique([userId, type, reference]) + le retry dans createDocument.
 */
async function nextReference(userId: string, type: string): Promise<string> {
  const prefix = refPrefix(type);
  const year = new Date().getFullYear();
  const yearPrefix = `${prefix}-${year}-`;

  const existing = await prisma.document.findMany({
    where: { userId, type, reference: { startsWith: yearPrefix } },
    select: { reference: true },
  });

  let max = 0;
  for (const { reference } of existing) {
    const n = Number.parseInt(reference.slice(yearPrefix.length), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }

  return `${yearPrefix}${String(max + 1).padStart(3, "0")}`;
}

export async function getDocuments(userId: string) {
  return prisma.document.findMany({
    where: { userId },
    orderBy: [{ issuedAt: "desc" }, { createdAt: "desc" }],
    include: {
      prospect: { select: { id: true, nom: true, entreprise: true } },
    },
  });
}

export async function getDocumentsForProspect(userId: string, prospectId: string) {
  return prisma.document.findMany({
    where: { userId, prospectId },
    orderBy: [{ issuedAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function createDocument(userId: string, input: DocumentFormData) {
  if (!isDocumentKind(input.type)) throw new Error("Type de document invalide.");
  const template = getTemplate(input.templateId);
  if (!template || template.kind !== input.type) {
    throw new Error("Template invalide.");
  }
  await assertOwner(userId, input.prospectId);

  const title = clean(input.title, 200) || template.name;

  // Nettoie les champs de data en fonction du template
  const data: Record<string, string> = {};
  for (const field of template.fields) {
    const raw = input.data?.[field.key];
    if (typeof raw === "string" && raw.trim()) {
      data[field.key] = raw.trim().slice(0, 5000);
    }
  }

  const amount =
    typeof input.amount === "number" && Number.isFinite(input.amount)
      ? Math.max(0, Math.round(input.amount))
      : null;

  const issuedAt = input.issuedAt ? new Date(input.issuedAt) : new Date();
  if (Number.isNaN(issuedAt.getTime())) throw new Error("Date invalide.");

  // Retry en cas de collision de référence (création concurrente) — la
  // contrainte @@unique([userId, type, reference]) garantit l'unicité.
  for (let attempt = 0; attempt < 5; attempt++) {
    const reference = await nextReference(userId, input.type);
    try {
      return await prisma.document.create({
        data: {
          userId,
          prospectId: input.prospectId,
          type: input.type,
          templateId: input.templateId,
          reference,
          title,
          amount,
          data,
          issuedAt,
        },
      });
    } catch (e) {
      const code = (e as { code?: string })?.code;
      if (code === "P2002" && attempt < 4) continue; // collision → renuméroter
      throw e;
    }
  }
  throw new Error("Impossible de générer une référence unique. Réessaie.");
}

export async function updateDocumentStatus(
  userId: string,
  id: string,
  status: DocumentStatus,
) {
  if (!isDocumentStatus(status)) throw new Error("Statut invalide.");
  return prisma.document.updateMany({
    where: { id, userId },
    data: { status },
  });
}

export async function deleteDocument(userId: string, id: string) {
  return prisma.document.deleteMany({ where: { id, userId } });
}
