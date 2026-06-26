"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createDocument,
  updateDocumentStatus,
  deleteDocument,
} from "@/lib/documents-db";
import type { DocumentFormData, DocumentStatus } from "@/lib/document-templates";
import { getCurrentUser } from "@/lib/session";
import { enforceRateLimit } from "@/lib/rate-limit";

const WRITE_LIMIT = { limit: 120, windowMs: 60 * 1000 };

function revalidate() {
  revalidatePath("/dashboard/entreprise/devis-facture", "layout");
  revalidatePath("/dashboard/entreprise/client", "layout");
}

export async function createDocumentAction(
  input: DocumentFormData,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  try {
    enforceRateLimit(`document-create:${user.id}`, { limit: 60, windowMs: 60 * 1000 });
    await createDocument(user.id, input);
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function updateDocumentStatusAction(
  id: string,
  status: DocumentStatus,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  enforceRateLimit(`document-status:${user.id}`, WRITE_LIMIT);
  await updateDocumentStatus(user.id, id, status);
  revalidate();
}

export async function deleteDocumentAction(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  enforceRateLimit(`document-delete:${user.id}`, WRITE_LIMIT);
  await deleteDocument(user.id, id);
  revalidate();
}
