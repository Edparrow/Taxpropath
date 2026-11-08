"use server";

import { randomUUID } from "node:crypto";
import { createAdminClient, hasServiceRoleKey } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { isAdminSection } from "@/lib/admin/permissions";
import { logActivity } from "@/lib/admin/activity";
import { findResource } from "@/lib/admin/resources";
import {
  IMAGE_MAX_BYTES,
  IMAGE_MAX_LABEL,
  IMAGE_MIME_TYPES,
  sniffImage,
} from "@/lib/admin/image-upload";

/** Public bucket for images shown on the website (banners, …). */
const BUCKET = "site-images";

export type UploadResult = { url: string } | { error: string };

let bucketReady = false;

/** Creates the bucket on first use, so no manual Storage setup is needed. */
async function ensureBucket(db: ReturnType<typeof createAdminClient>) {
  if (bucketReady) return;
  const options = {
    public: true,
    fileSizeLimit: IMAGE_MAX_BYTES,
    allowedMimeTypes: [...IMAGE_MIME_TYPES],
  };
  const { error } = await db.storage.getBucket(BUCKET);
  if (error) {
    const { error: createError } = await db.storage.createBucket(BUCKET, options);
    // Another request may have created it in between; that's fine.
    if (createError && !/already exists/i.test(createError.message)) throw createError;
  }
  bucketReady = true;
}

/**
 * Uploads one WebP/PNG for a content field that allows uploads and returns its
 * public URL. The URL is only stored once the admin saves the record.
 */
export async function uploadContentImage(
  resourceSlug: string,
  formData: FormData,
): Promise<UploadResult> {
  const resource = findResource(resourceSlug);
  if (!resource || !isAdminSection(resource.slug) || !resource.fields.some((f) => f.upload)) {
    return { error: "Uploads aren't available here." };
  }
  // The service role writes the file, so this check is the lock.
  const admin = await requireAdmin(resource.slug, "edit");

  if (!hasServiceRoleKey()) {
    return { error: "Image uploads need SUPABASE_SERVICE_ROLE_KEY on the server." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image first." };
  if (file.size > IMAGE_MAX_BYTES) return { error: `The image must be ${IMAGE_MAX_LABEL} or smaller.` };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = sniffImage(bytes);
  if (!kind) return { error: "Only WebP and PNG images are allowed." };

  try {
    const db = createAdminClient();
    await ensureBucket(db);

    const path = `${resource.slug}/${randomUUID()}.${kind.ext}`;
    const { error } = await db.storage.from(BUCKET).upload(path, bytes, {
      contentType: kind.mime,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) return { error: `Upload failed: ${error.message}` };

    const { data } = db.storage.from(BUCKET).getPublicUrl(path);
    await logActivity(admin, "UPLOAD", `Uploaded ${resource.label.toLowerCase()} image ${path}`);
    return { url: data.publicUrl };
  } catch (err) {
    console.error("[upload] failed", err);
    return { error: "Upload failed. Please try again." };
  }
}
