"use server";

import { revalidatePath } from "next/cache";

import { rollbackCsvImportAction } from "@/app/actions/prospects";
import { requireAdmin } from "@/lib/auth/roles";
import { isProspectStatus } from "@/lib/prospects-db";
import { prisma } from "@/lib/prisma";
import type { ProspectStatus } from "@/lib/prospect-types";

type AgentAction =
  | {
      type: "UPDATE_PROSPECT";
      prospectId: string;
      changes: Partial<{
        activite: string | null;
        ville: string | null;
        prochaineAction: string | null;
        derniereAction: string | null;
        note: string | null;
        status: ProspectStatus;
        instagram: string | null;
        facebook: string | null;
        linkedin: string | null;
        siteInternet: string | null;
      }>;
    }
  | {
      type: "ROLLBACK_CSV_IMPORT";
      importId: string;
    }
  | {
      type: "NONE";
    };

type ProspectUpdateChanges = Extract<
  AgentAction,
  { type: "UPDATE_PROSPECT" }
>["changes"];

export type CrmAgentProposal = {
  id: string;
  title: string;
  rationale: string;
  risk: "low" | "medium" | "high";
  action: AgentAction;
};

export type CrmAgentMessage = {
  role: "user" | "assistant";
  content: string;
};

export type CrmAgentResponse = {
  message: string;
  proposals: CrmAgentProposal[];
  error?: string;
};

const ALLOWED_UPDATE_FIELDS = new Set([
  "activite",
  "ville",
  "prochaineAction",
  "derniereAction",
  "note",
  "status",
  "instagram",
  "facebook",
  "linkedin",
  "siteInternet",
]);

function cleanString(value: unknown, maxLength: number): string | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const cleaned = value.trim().slice(0, maxLength);
  return cleaned || null;
}

function cleanExternalLink(value: unknown): string | null | undefined {
  const cleaned = cleanString(value, 500);
  if (!cleaned) return cleaned;
  if (cleaned.startsWith("@")) return cleaned;

  try {
    const url = new URL(
      cleaned.startsWith("http://") || cleaned.startsWith("https://")
        ? cleaned
        : `https://${cleaned}`,
    );
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function sanitizeChanges(changes: ProspectUpdateChanges) {
  const sanitized: Record<string, string | null> = {};
  const raw = changes as Record<string, unknown>;

  for (const [field, value] of Object.entries(raw)) {
    if (!ALLOWED_UPDATE_FIELDS.has(field)) continue;

    if (field === "status") {
      if (isProspectStatus(value)) sanitized.status = value;
      continue;
    }

    if (["instagram", "facebook", "linkedin", "siteInternet"].includes(field)) {
      const link = cleanExternalLink(value);
      if (link !== undefined) sanitized[field] = link;
      continue;
    }

    const maxLength =
      field === "note"
        ? 3000
        : field === "prochaineAction" || field === "derniereAction"
          ? 500
          : 180;
    const cleaned = cleanString(value, maxLength);
    if (cleaned !== undefined) sanitized[field] = cleaned;
  }

  return sanitized;
}

function extractJsonObject(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Réponse IA illisible.");
    return JSON.parse(match[0]);
  }
}

function normalizeProposal(raw: unknown, index: number): CrmAgentProposal | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const action = item.action && typeof item.action === "object"
    ? (item.action as Record<string, unknown>)
    : { type: "NONE" };
  const type = typeof action.type === "string" ? action.type : "NONE";

  let normalizedAction: AgentAction = { type: "NONE" };
  if (type === "UPDATE_PROSPECT" && typeof action.prospectId === "string") {
    normalizedAction = {
      type: "UPDATE_PROSPECT",
      prospectId: action.prospectId,
      changes:
        action.changes && typeof action.changes === "object"
          ? (action.changes as ProspectUpdateChanges)
          : {},
    };
  } else if (type === "ROLLBACK_CSV_IMPORT" && typeof action.importId === "string") {
    normalizedAction = { type: "ROLLBACK_CSV_IMPORT", importId: action.importId };
  }

  const risk = item.risk === "medium" || item.risk === "high" ? item.risk : "low";
  return {
    id: typeof item.id === "string" ? item.id : `proposal-${index + 1}`,
    title: typeof item.title === "string" ? item.title.slice(0, 140) : "Proposition CRM",
    rationale:
      typeof item.rationale === "string"
        ? item.rationale.slice(0, 800)
        : "Proposition générée par l'agent CRM.",
    risk,
    action: normalizedAction,
  };
}

function normalizeAgentResponse(raw: unknown): CrmAgentResponse {
  if (!raw || typeof raw !== "object") {
    throw new Error("Réponse IA invalide.");
  }

  const parsed = raw as Record<string, unknown>;
  const proposals = Array.isArray(parsed.proposals)
    ? parsed.proposals
        .map((proposal, index) => normalizeProposal(proposal, index))
        .filter((proposal): proposal is CrmAgentProposal => Boolean(proposal))
        .slice(0, 8)
    : [];

  return {
    message:
      typeof parsed.message === "string"
        ? parsed.message.slice(0, 2000)
        : "J'ai analysé le CRM et préparé des propositions.",
    proposals,
  };
}

async function getCrmSnapshot(userId: string) {
  const [prospects, imports] = await Promise.all([
    prisma.prospect.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 160,
      select: {
        id: true,
        nom: true,
        entreprise: true,
        email: true,
        telephone: true,
        ville: true,
        activite: true,
        status: true,
        provenance: true,
        prochaineAction: true,
        derniereAction: true,
        note: true,
        instagram: true,
        facebook: true,
        linkedin: true,
        siteInternet: true,
        createdAt: true,
        updatedAt: true,
        csvImportId: true,
      },
    }),
    prisma.csvImportBatch.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { _count: { select: { prospects: true } } },
    }),
  ]);

  const statusCounts = prospects.reduce<Record<string, number>>((acc, prospect) => {
    acc[prospect.status] = (acc[prospect.status] ?? 0) + 1;
    return acc;
  }, {});

  const nicheCounts = prospects.reduce<Record<string, number>>((acc, prospect) => {
    const niche = prospect.activite?.trim() || "Sans niche";
    acc[niche] = (acc[niche] ?? 0) + 1;
    return acc;
  }, {});

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      prospects: prospects.length,
      statusCounts,
      topNiches: Object.entries(nicheCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([label, count]) => ({ label, count })),
    },
    imports: imports.map((item) => ({
      id: item.id,
      fileName: item.fileName,
      status: item.status,
      importedCount: item.importedCount,
      remainingProspects: item._count.prospects,
      createdAt: item.createdAt.toISOString(),
      revertedAt: item.revertedAt?.toISOString() ?? null,
    })),
    prospects: prospects.map((prospect) => ({
      ...prospect,
      createdAt: prospect.createdAt.toISOString(),
      updatedAt: prospect.updatedAt.toISOString(),
    })),
  };
}

export async function askCrmAgentAction(input: {
  message: string;
  history?: CrmAgentMessage[];
}): Promise<CrmAgentResponse> {
  const user = await requireAdmin();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";
  const version = process.env.ANTHROPIC_VERSION || "2023-06-01";

  if (!apiKey) {
    return {
      message:
        "La clé Anthropic n'est pas encore configurée. Ajoute ANTHROPIC_API_KEY dans les variables d'environnement, puis redéploie.",
      proposals: [],
      error: "ANTHROPIC_API_KEY manquant.",
    };
  }

  const snapshot = await getCrmSnapshot(user.id);
  const prompt = input.message.trim() || "Analyse le CRM et propose les corrections utiles.";
  const history = (input.history ?? []).slice(-6);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": version,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1800,
      temperature: 0.2,
      system:
        "Tu es l'agent CRM de Brain. Tu analyses des prospects et tu proposes des corrections, mais tu ne modifies jamais directement. " +
        "Tu dois répondre uniquement en JSON valide, sans markdown. " +
        "Format: {\"message\":\"résumé court\",\"proposals\":[{\"id\":\"...\",\"title\":\"...\",\"rationale\":\"...\",\"risk\":\"low|medium|high\",\"action\":{\"type\":\"UPDATE_PROSPECT\",\"prospectId\":\"...\",\"changes\":{\"activite\":\"...\",\"prochaineAction\":\"...\",\"derniereAction\":\"...\",\"status\":\"TODO|IN_PROGRESS|DONE|CLIENT_ACTIF\",\"ville\":\"...\",\"note\":\"...\"}}}]} } " +
        "Tu peux aussi proposer {\"type\":\"ROLLBACK_CSV_IMPORT\",\"importId\":\"...\"} si un import actif semble raté, ou {\"type\":\"NONE\"} pour une recommandation sans action. " +
        "Ne propose que des changements très probables. Ne fabrique jamais d'id. Utilise uniquement les ids fournis.",
      messages: [
        ...history.map((item) => ({ role: item.role, content: item.content })),
        {
          role: "user",
          content:
            `${prompt}\n\nSnapshot CRM JSON:\n${JSON.stringify(snapshot).slice(0, 55000)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return {
      message: "L'agent IA n'a pas pu analyser le CRM pour le moment.",
      proposals: [],
      error: `Anthropic ${response.status}: ${text.slice(0, 300)}`,
    };
  }

  const data = await response.json();
  const text = Array.isArray(data.content)
    ? data.content
        .filter((part: { type?: string }) => part.type === "text")
        .map((part: { text?: string }) => part.text ?? "")
        .join("\n")
    : "";

  return normalizeAgentResponse(extractJsonObject(text));
}

export async function applyCrmAgentProposalAction(
  proposal: CrmAgentProposal,
): Promise<{ ok: boolean; message: string }> {
  const user = await requireAdmin();

  if (proposal.action.type === "NONE") {
    return { ok: false, message: "Cette proposition est informative." };
  }

  if (proposal.action.type === "ROLLBACK_CSV_IMPORT") {
    const result = await rollbackCsvImportAction(proposal.action.importId);
    if (result.error) return { ok: false, message: result.error };
    return {
      ok: true,
      message: `${result.deleted} prospect${result.deleted !== 1 ? "s" : ""} supprimé${result.deleted !== 1 ? "s" : ""}.`,
    };
  }

  const prospect = await prisma.prospect.findFirst({
    where: { id: proposal.action.prospectId, userId: user.id },
    select: { id: true },
  });

  if (!prospect) {
    return { ok: false, message: "Prospect introuvable ou non autorisé." };
  }

  const changes = sanitizeChanges(proposal.action.changes);
  if (!Object.keys(changes).length) {
    return { ok: false, message: "Aucune modification valide à appliquer." };
  }

  await prisma.prospect.update({
    where: { id: prospect.id, userId: user.id },
    data: changes,
  });

  revalidatePath("/dashboard/prospection", "layout");
  return { ok: true, message: "Modification appliquée après validation." };
}
