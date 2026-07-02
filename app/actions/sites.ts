"use server";

import { revalidatePath } from "next/cache";

import {
  createSite,
  updateSite,
  deleteSite,
  createSiteItem,
  updateSiteItem,
  deleteSiteItem,
  reorderSiteItems,
} from "@/lib/sites-db";
import { uploadSiteImage } from "@/lib/site-storage";
import type { SiteFormData, SiteItemFormData } from "@/lib/site-types";
import { requireAdmin } from "@/lib/auth/roles";
import { enforceRateLimit } from "@/lib/rate-limit";

const WRITE_LIMIT = { limit: 120, windowMs: 60 * 1000 };
const UPLOAD_LIMIT = { limit: 30, windowMs: 60 * 1000 };

type Result = { ok: boolean; error?: string };

function revalidate() {
  revalidatePath("/dashboard/working/site-internet", "layout");
}

// ─── Site ───────────────────────────────────────────────────────────────────

export async function createSiteAction(
  data: SiteFormData,
): Promise<Result & { id?: string }> {
  const user = await requireAdmin();
  try {
    enforceRateLimit(`site-create:${user.id}`, WRITE_LIMIT);
    const id = await createSite(user.id, data);
    revalidate();
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function updateSiteAction(
  id: string,
  data: SiteFormData,
): Promise<Result> {
  const user = await requireAdmin();
  try {
    enforceRateLimit(`site-update:${user.id}`, WRITE_LIMIT);
    await updateSite(user.id, id, data);
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function deleteSiteAction(id: string): Promise<Result> {
  const user = await requireAdmin();
  try {
    enforceRateLimit(`site-delete:${user.id}`, WRITE_LIMIT);
    await deleteSite(user.id, id);
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

// ─── SiteItem ───────────────────────────────────────────────────────────────

export async function createSiteItemAction(
  siteId: string,
  data: SiteItemFormData,
): Promise<Result> {
  const user = await requireAdmin();
  try {
    enforceRateLimit(`siteitem-create:${user.id}`, WRITE_LIMIT);
    await createSiteItem(user.id, siteId, data);
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function updateSiteItemAction(
  id: string,
  data: SiteItemFormData,
): Promise<Result> {
  const user = await requireAdmin();
  try {
    enforceRateLimit(`siteitem-update:${user.id}`, WRITE_LIMIT);
    await updateSiteItem(user.id, id, data);
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function deleteSiteItemAction(id: string): Promise<Result> {
  const user = await requireAdmin();
  try {
    enforceRateLimit(`siteitem-delete:${user.id}`, WRITE_LIMIT);
    await deleteSiteItem(user.id, id);
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

export async function reorderSiteItemsAction(
  siteId: string,
  orderedIds: string[],
): Promise<Result> {
  const user = await requireAdmin();
  try {
    enforceRateLimit(`siteitem-reorder:${user.id}`, WRITE_LIMIT);
    await reorderSiteItems(user.id, siteId, orderedIds);
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erreur" };
  }
}

// ─── Upload image ───────────────────────────────────────────────────────────

export async function uploadSiteImageAction(
  formData: FormData,
): Promise<Result & { url?: string }> {
  const user = await requireAdmin();
  try {
    enforceRateLimit(`site-upload:${user.id}`, UPLOAD_LIMIT);

    const siteId = formData.get("siteId");
    const file = formData.get("file");

    if (typeof siteId !== "string" || !siteId) {
      return { ok: false, error: "Site manquant." };
    }
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, error: "Aucun fichier reçu." };
    }

    const url = await uploadSiteImage(user.id, siteId, file);
    return { ok: true, url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload échoué" };
  }
}
