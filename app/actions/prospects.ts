"use server";

import { revalidatePath } from "next/cache";

import {
  updateProspectStatus,
  createProspect,
  updateProspect,
  deleteProspect,
  logInteraction,
  incrementProspectCallCounter,
  isProspectStatus,
  sanitizeProspectData,
} from "@/lib/prospects-db";
import type { ProspectCallCounter } from "@/lib/prospects-db";
import type { ProspectFormData, ProspectStatus } from "@/lib/prospect-types";
import { requireAdmin } from "@/lib/auth/roles";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

const MAX_CSV_IMPORT_ROWS = 500;

export type CsvImportHistoryItem = {
  id: string;
  fileName: string | null;
  sourceRowCount: number;
  importedCount: number;
  revertedCount: number;
  status: string;
  createdAt: Date;
  revertedAt: Date | null;
  remainingProspects: number;
};

type CsvImportMetadata = {
  fileName?: string;
  sourceRowCount?: number;
  mapping?: unknown;
};

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

export async function logInteractionAction(
  id: string,
  patch: { derniereAction?: string | null; prochaineAction?: string | null; note?: string | null },
): Promise<{ interactions: number }> {
  const user = await requireAdmin();
  const rateLimit = checkRateLimit(`prospect-interaction:${user.id}`, {
    limit: 240,
    windowMs: 60 * 1000,
  });
  ensureAllowed(rateLimit.ok, rateLimit.retryAfterSeconds);
  const result = await logInteraction(id, user.id, patch);
  revalidatePath("/dashboard/prospection", "layout");
  return result;
}

export async function incrementProspectCallCounterAction(
  id: string,
  counter: ProspectCallCounter,
): Promise<{ appelsAvecReponse: number; appelsSansReponse: number }> {
  const user = await requireAdmin();
  const rateLimit = checkRateLimit(`prospect-call-counter:${user.id}`, {
    limit: 240,
    windowMs: 60 * 1000,
  });
  ensureAllowed(rateLimit.ok, rateLimit.retryAfterSeconds);
  if (counter !== "answered" && counter !== "unanswered") {
    throw new Error("Type d'appel invalide.");
  }
  const result = await incrementProspectCallCounter(id, user.id, counter);
  revalidatePath("/dashboard/prospection", "layout");
  return result;
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
  metadata: CsvImportMetadata = {},
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

    if (!validRows.length) {
      return { count: 0, error: "Aucune ligne importable. Vérifie le mapping du nom ou de l'entreprise." };
    }

    const sanitizedRows = validRows.map((row) => sanitizeProspectData(row));

    await prisma.$transaction(async (tx) => {
      const batch = await tx.csvImportBatch.create({
        data: {
          userId: user.id,
          fileName: metadata.fileName?.trim().slice(0, 240) || null,
          sourceRowCount:
            typeof metadata.sourceRowCount === "number" && metadata.sourceRowCount > 0
              ? Math.min(Math.floor(metadata.sourceRowCount), 5000)
              : rows.length,
          importedCount: validRows.length,
          mapping: metadata.mapping == null ? undefined : metadata.mapping,
        },
        select: { id: true },
      });

      await tx.prospect.createMany({
        data: sanitizedRows.map((row) => ({
          ...row,
            userId: user.id,
            provenance: "CSV",
            csvImportId: batch.id,
        })),
      });
    });

    revalidatePath("/dashboard/prospection", "layout");
    return { count: validRows.length };
  } catch (e) {
    return { count: 0, error: e instanceof Error ? e.message : "Erreur import CSV" };
  }
}

export async function getCsvImportHistoryAction(): Promise<CsvImportHistoryItem[]> {
  const user = await requireAdmin();

  const batches = await prisma.csvImportBatch.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      _count: {
        select: { prospects: true },
      },
    },
  });

  return batches.map((batch) => ({
    id: batch.id,
    fileName: batch.fileName,
    sourceRowCount: batch.sourceRowCount,
    importedCount: batch.importedCount,
    revertedCount: batch.revertedCount,
    status: batch.status,
    createdAt: batch.createdAt,
    revertedAt: batch.revertedAt,
    remainingProspects: batch._count.prospects,
  }));
}

export async function rollbackCsvImportAction(
  importId: string,
): Promise<{ deleted: number; error?: string }> {
  const user = await requireAdmin();

  try {
    const rateLimit = checkRateLimit(`prospect-import-rollback:${user.id}`, {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.ok) {
      return {
        deleted: 0,
        error: `Trop de rollbacks. Réessayez dans ${rateLimit.retryAfterSeconds} secondes.`,
      };
    }

    const batch = await prisma.csvImportBatch.findFirst({
      where: { id: importId, userId: user.id },
      select: { id: true, status: true },
    });

    if (!batch) {
      return { deleted: 0, error: "Import introuvable." };
    }

    if (batch.status === "REVERTED") {
      return { deleted: 0, error: "Cet import a déjà été annulé." };
    }

    const result = await prisma.$transaction(async (tx) => {
      const deleted = await tx.prospect.deleteMany({
        where: { userId: user.id, csvImportId: importId },
      });

      await tx.csvImportBatch.update({
        where: { id: importId },
        data: {
          status: "REVERTED",
          revertedAt: new Date(),
          revertedCount: deleted.count,
        },
      });

      return deleted;
    });

    revalidatePath("/dashboard/prospection", "layout");
    revalidatePath("/dashboard/working/todolist");
    return { deleted: result.count };
  } catch (e) {
    return {
      deleted: 0,
      error: e instanceof Error ? e.message : "Impossible d'annuler cet import.",
    };
  }
}
