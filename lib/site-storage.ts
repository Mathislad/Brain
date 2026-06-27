import "server-only";

import { randomUUID } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "site-images";
const MAX_BYTES = 5 * 1024 * 1024; // 5 Mo

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

type Admin = ReturnType<typeof createAdminClient>;

// Crée le bucket public au premier upload — idempotent (aucune étape manuelle).
async function ensureBucket(admin: Admin): Promise<void> {
  const { data } = await admin.storage.getBucket(BUCKET);
  if (data) return;

  const { error } = await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
  });
  // Course possible : un autre upload a pu créer le bucket entre-temps.
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(`Création du bucket impossible : ${error.message}`);
  }
}

export async function uploadSiteImage(
  userId: string,
  siteId: string,
  file: File,
): Promise<string> {
  const ext = MIME_TO_EXT[file.type];
  if (!ext) {
    throw new Error("Format d'image non supporté (png, jpg, webp, gif, svg, avif).");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image trop lourde (5 Mo maximum).");
  }

  const admin = createAdminClient();
  await ensureBucket(admin);

  const path = `${userId}/${siteId}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    throw new Error(`Upload échoué : ${error.message}`);
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
