"use server";

import { revalidatePath } from "next/cache";

import {
  updateProspectStatus,
  createProspect,
  updateProspect,
  deleteProspect,
  isProspectStatus,
} from "@/lib/prospects-db";
import type { ProspectFormData, ProspectStatus } from "@/lib/prospect-types";
import { requireAdmin } from "@/lib/auth/roles";
import { checkRateLimit } from "@/lib/rate-limit";

const MAX_CSV_IMPORT_ROWS = 500;

function ensureAllowed(allowed: boolean, retryAfterSeconds: number) {
  if (!allowed) {
    throw new Error(`Trop de requêtes. Réessayez dans ${retryAfterSeconds} secondes.`);
  }
}

// ─── Status ───────────────────────────────────────────────────────────────────

export async function updateProspectStatusAction(
  id: string,
  status: ProspectStatus,
): Promise<void> {
  const user = await requireAdmin();
  const rateLimit = checkRateLimit(`prospect-status:${user.id}`, {
    limit: 120,
    windowMs: 60 * 1000,
  });
  ensureAllowed(rateLimit.ok, rateLimit.retryAfterSeconds);
  if (!isProspectStatus(status)) {
    throw new Error("Statut invalide.");
  }
  await updateProspectStatus(id, user.id, status);
  revalidatePath("/dashboard/prospection", "layout");
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createProspectAction(data: ProspectFormData): Promise<void> {
  const user = await requireAdmin();
  const rateLimit = checkRateLimit(`prospect-create:${user.id}`, {
    limit: 60,
    windowMs: 60 * 1000,
  });
  ensureAllowed(rateLimit.ok, rateLimit.retryAfterSeconds);
  await createProspect(user.id, data);
  revalidatePath("/dashboard/prospection", "layout");
}

export async function updateProspectAction(
  id: string,
  data: ProspectFormData,
): Promise<void> {
  const user = await requireAdmin();
  const rateLimit = checkRateLimit(`prospect-update:${user.id}`, {
    limit: 120,
    windowMs: 60 * 1000,
  });
  ensureAllowed(rateLimit.ok, rateLimit.retryAfterSeconds);
  await updateProspect(id, user.id, data);
  revalidatePath("/dashboard/prospection", "layout");
}

export async function deleteProspectAction(id: string): Promise<void> {
  const user = await requireAdmin();
  const rateLimit = checkRateLimit(`prospect-delete:${user.id}`, {
    limit: 60,
    windowMs: 60 * 1000,
  });
  ensureAllowed(rateLimit.ok, rateLimit.retryAfterSeconds);
  await deleteProspect(id, user.id);
  revalidatePath("/dashboard/prospection", "layout");
}

// ─── CSV Import ───────────────────────────────────────────────────────────────

export async function importFromCsvAction(
  rows: ProspectFormData[],
): Promise<{ count: number; error?: string }> {
  const user = await requireAdmin();

  try {
    const rateLimit = checkRateLimit(`prospect-import:${user.id}`, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.ok) {
      return {
        count: 0,
        error: `Trop d'imports. Réessayez dans ${rateLimit.retryAfterSeconds} secondes.`,
      };
    }

    if (!Array.isArray(rows)) {
      return { count: 0, error: "Format d'import invalide." };
    }

    // Garde de taille AVANT tout parcours (protège mémoire/CPU).
    if (rows.length > 5000) {
      return {
        count: 0,
        error: "Fichier trop volumineux (5000 lignes maximum).",
      };
    }

    const validRows = rows
      .filter((row) => row.nom?.trim())
      .slice(0, MAX_CSV_IMPORT_ROWS);

    for (const row of validRows) {
      await createProspect(user.id, row, "CSV");
    }
    revalidatePath("/dashboard/prospection", "layout");
    return { count: validRows.length };
  } catch (e) {
    return { count: 0, error: e instanceof Error ? e.message : "Erreur import CSV" };
  }
}
