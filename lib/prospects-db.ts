import "server-only";

import { ProspectStatus as PrismaProspectStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { ProspectFormData, ProspectStatus } from "@/lib/prospect-types";

export type { Prospect } from "@/generated/prisma/client";
export type { ProspectFormData, ProspectStatus } from "@/lib/prospect-types";

const STATUS_VALUES = new Set<string>(Object.values(PrismaProspectStatus));

function cleanString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().slice(0, maxLength);
  return cleaned || null;
}

function cleanEmail(value: unknown): string | null {
  const email = cleanString(value, 254)?.toLowerCase();
  if (!email) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

function cleanPhone(value: unknown): string | null {
  const phone = cleanString(value, 60);
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d+().\-\s]/g, "").replace(/\s+/g, " ");
  return cleaned.length >= 3 ? cleaned : null;
}

function cleanExternalLink(value: unknown): string | null {
  const link = cleanString(value, 500);
  if (!link) return null;
  if (link.startsWith("@")) return link;

  try {
    const url = new URL(
      link.startsWith("http://") || link.startsWith("https://")
        ? link
        : `https://${link}`,
    );
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function isProspectStatus(value: unknown): value is ProspectStatus {
  return typeof value === "string" && STATUS_VALUES.has(value);
}

function sanitizeProspectData(data: ProspectFormData): ProspectFormData {
  const raw = data as Record<string, unknown>;
  const sanitized: ProspectFormData = {
    nom: cleanString(raw.nom, 160) ?? "",
  };

  if (!sanitized.nom) {
    throw new Error("Le nom du prospect est requis.");
  }

  const optionalTextFields: Array<[
    keyof Omit<ProspectFormData, "nom" | "status">,
    number,
  ]> = [
    ["entreprise", 180],
    ["prochaineAction", 500],
    ["derniereAction", 500],
    ["ville", 120],
    ["activite", 160],
    ["note", 3000],
  ];

  for (const [field, maxLength] of optionalTextFields) {
    sanitized[field] = cleanString(raw[field], maxLength);
  }

  sanitized.email = cleanEmail(raw.email);
  sanitized.telephone = cleanPhone(raw.telephone);
  sanitized.siteInternet = cleanExternalLink(raw.siteInternet);
  sanitized.instagram = cleanExternalLink(raw.instagram);
  sanitized.facebook = cleanExternalLink(raw.facebook);
  sanitized.linkedin = cleanExternalLink(raw.linkedin);

  if (isProspectStatus(raw.status)) {
    sanitized.status = raw.status;
  }

  return sanitized;
}

export async function getProspects(userId: string) {
  return prisma.prospect.findMany({
    where: { userId },
    orderBy: [{ recuLe: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
  });
}

export async function updateProspectStatus(
  id: string,
  userId: string,
  status: ProspectStatus,
) {
  return prisma.prospect.update({
    where: { id, userId },
    data: { status },
  });
}

export async function createProspect(
  userId: string,
  data: ProspectFormData,
  provenance = "App",
) {
  const sanitized = sanitizeProspectData(data);
  return prisma.prospect.create({ data: { ...sanitized, userId, provenance } });
}

export async function updateProspect(
  id: string,
  userId: string,
  data: ProspectFormData,
) {
  const sanitized = sanitizeProspectData(data);
  return prisma.prospect.update({ where: { id, userId }, data: sanitized });
}

export async function deleteProspect(id: string, userId: string) {
  return prisma.prospect.delete({ where: { id, userId } });
}

// Enregistre une interaction (session cold call) : met à jour les notes de
// suivi et incrémente le compteur d'interactions.
export async function logInteraction(
  id: string,
  userId: string,
  patch: { derniereAction?: string | null; prochaineAction?: string | null; note?: string | null },
) {
  return prisma.prospect.update({
    where: { id, userId },
    data: {
      derniereAction: patch.derniereAction?.slice(0, 2000) ?? null,
      prochaineAction: patch.prochaineAction?.slice(0, 2000) ?? null,
      note: patch.note?.slice(0, 5000) ?? null,
      interactions: { increment: 1 },
    },
    select: { interactions: true },
  });
}

export async function deleteProspectsForUser(userId: string) {
  return prisma.prospect.deleteMany({ where: { userId } });
}
