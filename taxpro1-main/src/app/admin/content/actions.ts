"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { findResource, slugify, type Resource } from "@/lib/admin/resources";

/**
 * Writes go through the caller's own session rather than the service role, so
 * the "<table>_admin_write" RLS policies are the real lock — requireAdmin is
 * defence in depth. Only tables named in RESOURCES are reachable, so the
 * resource slug from the URL can never address an arbitrary table.
 */

type Result = { error: string } | void;

function optionalText(value: FormDataEntryValue | null): string | null {
  const raw = String(value ?? "").trim();
  return raw || null;
}

function optionalNumber(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Maps submitted form values onto typed column values for one resource. */
function readFields(resource: Resource, form: FormData) {
  const row: Record<string, string | number | boolean | null> = {};

  for (const field of resource.fields) {
    const raw = form.get(field.name);

    switch (field.type) {
      case "boolean":
        // An unchecked checkbox submits nothing at all.
        row[field.name] = raw !== null;
        break;
      case "number":
        row[field.name] = optionalNumber(raw);
        break;
      default:
        row[field.name] = optionalText(raw);
    }
  }

  // sort_order is NOT NULL in the schema; an empty box means "first".
  if (row.sort_order === null) row.sort_order = 0;

  // Slugs are derived when left blank, so editors never have to think about them.
  // Most resources name their title field "name"; blog posts call it "title".
  if (resource.fields.some((f) => f.name === "slug") && !row.slug) {
    const sourceField = resource.fields.find((f) => f.name === "name" || f.name === "title");
    const source = sourceField ? String(row[sourceField.name] ?? "") : "";
    row.slug = slugify(source) || null;
  }

  return row;
}

function validate(resource: Resource, row: Record<string, unknown>): string | null {
  for (const field of resource.fields) {
    if (field.required && !row[field.name]) {
      return `${field.label} is required.`;
    }
  }
  return null;
}

export async function saveRecord(
  resourceSlug: string,
  recordId: string | null,
  _prev: unknown,
  form: FormData,
): Promise<Result> {
  await requireAdmin();

  const resource = findResource(resourceSlug);
  if (!resource) return { error: "Unknown content type." };

  const row = readFields(resource, form);
  const invalid = validate(resource, row);
  if (invalid) return { error: invalid };

  const supabase = await createClient();

  if (recordId) {
    const { error } = await supabase
      .from(resource.table)
      .update(row)
      .eq("id", recordId);
    if (error) {
      console.error(`[admin] ${resource.table} update failed`, error);
      return { error: error.message };
    }
  } else {
    const { error } = await supabase.from(resource.table).insert(row);
    if (error) {
      console.error(`[admin] ${resource.table} insert failed`, error);
      return { error: error.message };
    }
  }

  revalidatePath(`/admin/content/${resource.slug}`);
  revalidatePath("/");
  redirect(`/admin/content/${resource.slug}`);
}

export async function deleteRecord(
  resourceSlug: string,
  recordId: string,
): Promise<Result> {
  await requireAdmin();

  const resource = findResource(resourceSlug);
  if (!resource) return { error: "Unknown content type." };

  const supabase = await createClient();
  const { error } = await supabase.from(resource.table).delete().eq("id", recordId);
  if (error) {
    console.error(`[admin] ${resource.table} delete failed`, error);
    return { error: error.message };
  }

  revalidatePath(`/admin/content/${resource.slug}`);
  revalidatePath("/");
}

/** Publish toggle from the list view, mirroring the reference panel's tick. */
export async function togglePublished(
  resourceSlug: string,
  recordId: string,
  next: boolean,
): Promise<Result> {
  await requireAdmin();

  const resource = findResource(resourceSlug);
  if (!resource) return { error: "Unknown content type." };

  const supabase = await createClient();
  const { error } = await supabase
    .from(resource.table)
    .update({ is_published: next })
    .eq("id", recordId);
  if (error) {
    console.error(`[admin] ${resource.table} publish toggle failed`, error);
    return { error: error.message };
  }

  revalidatePath(`/admin/content/${resource.slug}`);
  revalidatePath("/");
}
