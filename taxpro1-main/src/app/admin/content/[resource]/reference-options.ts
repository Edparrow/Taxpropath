import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Resource } from "@/lib/admin/resources";
import type { ReferenceOption } from "../record-form";

/**
 * Loads dropdown options for a resource's reference fields (e.g. a
 * subcategory's parent category), keyed by field name.
 */
export async function loadReferenceOptions(
  resource: Resource,
): Promise<Record<string, ReferenceOption[]>> {
  const referenceFields = resource.fields.filter((f) => f.type === "reference");
  if (!referenceFields.length) return {};

  const supabase = await createClient();
  const entries = await Promise.all(
    referenceFields.map(async (field) => {
      if (!field.refTable) return [field.name, []] as const;

      const labelColumn = field.refLabelColumn ?? "name";
      const { data, error } = await supabase
        .from(field.refTable)
        .select(`id, ${labelColumn}`)
        .order(labelColumn, { ascending: true });

      if (error) {
        console.error(`[admin] ${field.refTable} options failed`, error);
        return [field.name, []] as const;
      }

      const options = (data ?? []).map((row) => {
        const record = row as unknown as Record<string, unknown>;
        return {
          id: String(record.id),
          label: String(record[labelColumn] ?? record.id),
        };
      });
      return [field.name, options] as const;
    }),
  );

  return Object.fromEntries(entries);
}
