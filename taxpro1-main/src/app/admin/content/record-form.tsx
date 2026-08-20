"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { Resource } from "@/lib/admin/resources";
import { saveRecord } from "./actions";

const INPUT =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[14.5px] text-navy-950 outline-none transition-colors duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25";

export type ReferenceOption = { id: string; label: string };

/**
 * One form for every content resource, laid out from the resource's field
 * definitions. `values` holds the current row when editing and is empty when
 * creating.
 */
export function RecordForm({
  resource,
  recordId,
  values,
  referenceOptions,
}: {
  resource: Resource;
  recordId: string | null;
  values: Record<string, unknown>;
  /** Options per reference field name, loaded on the server. */
  referenceOptions: Record<string, ReferenceOption[]>;
}) {
  const action = saveRecord.bind(null, resource.slug, recordId);
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-3xl">
      {state?.error && (
        <p
          role="alert"
          className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-[14px] font-medium text-red-800"
        >
          {state.error}
        </p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          {resource.fields.map((field) => {
            const value = values[field.name];
            const wide =
              field.type === "textarea" || field.type === "url" ? "sm:col-span-2" : "";

            if (field.type === "boolean") {
              return (
                <label
                  key={field.name}
                  className="flex items-start gap-3 sm:col-span-2"
                >
                  <input
                    type="checkbox"
                    name={field.name}
                    defaultChecked={value === undefined ? true : Boolean(value)}
                    className="mt-0.5 size-4 accent-brand-600"
                  />
                  <span>
                    <span className="block text-[13.5px] font-bold text-navy-950">
                      {field.label}
                    </span>
                    {field.hint && (
                      <span className="mt-0.5 block text-[12.5px] text-slate-500">
                        {field.hint}
                      </span>
                    )}
                  </span>
                </label>
              );
            }

            return (
              <div key={field.name} className={wide}>
                <label
                  htmlFor={field.name}
                  className="mb-1.5 block text-[13px] font-bold text-navy-950"
                >
                  {field.label}
                  {field.required && (
                    <span className="ml-0.5 text-red-600" aria-hidden>
                      *
                    </span>
                  )}
                </label>

                {field.type === "textarea" ? (
                  <textarea
                    id={field.name}
                    name={field.name}
                    rows={4}
                    required={field.required}
                    defaultValue={String(value ?? "")}
                    className={`${INPUT} resize-y`}
                  />
                ) : field.type === "select" ? (
                  <select
                    id={field.name}
                    name={field.name}
                    required={field.required}
                    defaultValue={String(value ?? "")}
                    className={`${INPUT} cursor-pointer`}
                  >
                    <option value="">— none —</option>
                    {(field.options ?? []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : field.type === "reference" ? (
                  <select
                    id={field.name}
                    name={field.name}
                    required={field.required}
                    defaultValue={String(value ?? "")}
                    className={`${INPUT} cursor-pointer`}
                  >
                    <option value="">— none —</option>
                    {(referenceOptions[field.name] ?? []).map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type === "number" ? "number" : "text"}
                    required={field.required}
                    defaultValue={String(value ?? "")}
                    className={INPUT}
                  />
                )}

                {field.hint && (
                  <p className="mt-1.5 text-[12.5px] text-slate-500">{field.hint}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Submit />
        <Link
          href={`/admin/content/${resource.slug}`}
          className="rounded-full border border-slate-300 px-5 py-2.5 text-[14px] font-semibold text-navy-950 transition-colors duration-200 hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex cursor-pointer items-center gap-2 rounded-full bg-brand-600 px-6 py-2.5 text-[14px] font-bold text-white transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {pending ? "Saving…" : "Save"}
    </button>
  );
}
