"use server";

import { revalidatePath } from "next/cache";

import {
  createAccountingEntry,
  deleteAccountingEntry,
  bulkCreateAccountingEntries,
} from "@/lib/accounting-db";
import type { AccountingEntryInput } from "@/lib/accounting-types";
import { requireAdmin } from "@/lib/auth/roles";
import { enforceRateLimit } from "@/lib/rate-limit";

function revalidate() {
  revalidatePath("/dashboard/entreprise/comptabilite", "layout");
}

export async function createAccountingEntryAction(
  input: AccountingEntryInput,
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireAdmin();
  try {
    enforceRateLimit(`accounting-create:${user.id}`, { limit: 120, windowMs: 60 * 1000 });
    await createAccountingEntry(user.id, input);
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function deleteAccountingEntryAction(id: string): Promise<void> {
  const user = await requireAdmin();
  enforceRateLimit(`accounting-delete:${user.id}`, { limit: 120, windowMs: 60 * 1000 });
  await deleteAccountingEntry(user.id, id);
  revalidate();
}

/** Migration unique des anciennes écritures localStorage vers la DB. */
export async function migrateAccountingEntriesAction(
  inputs: AccountingEntryInput[],
): Promise<{ count: number; error?: string }> {
  const user = await requireAdmin();
  try {
    enforceRateLimit(`accounting-migrate:${user.id}`, { limit: 3, windowMs: 60 * 60 * 1000 });
    if (!Array.isArray(inputs) || inputs.length === 0) return { count: 0 };
    const count = await bulkCreateAccountingEntries(user.id, inputs);
    revalidate();
    return { count };
  } catch (e) {
    return { count: 0, error: e instanceof Error ? e.message : "Erreur" };
  }
}
