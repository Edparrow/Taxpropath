import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteEnquiry } from "./actions";

export const metadata = { title: "Enquiries" };

type Row = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  created_at: string;
};

/**
 * Read-only inbox for the /contact form (contact_messages table). Mirrors the
 * reference panel's Enquiry module — view and delete, no reply-from-here.
 */
export default async function AdminEnquiriesPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contact_messages")
    .select("id, name, email, subject, message, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as Row[];

  return (
    <>
      <div>
        <h1 className="text-2xl font-extrabold text-navy-950">Enquiries</h1>
        <p className="mt-1 text-[14px] text-ink-muted">
          Submissions from the contact form.
        </p>
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-800">
          Could not load enquiries: {error.message}
        </p>
      )}

      {!error && rows.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center">
          <p className="text-[15px] font-semibold text-navy-950">No enquiries yet</p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-8 space-y-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-navy-950">
                    {row.name}{" "}
                    <span className="font-normal text-ink-muted">— {row.email}</span>
                  </p>
                  {row.subject && (
                    <p className="mt-0.5 text-[13px] font-semibold text-brand-700">
                      {row.subject}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <p className="whitespace-nowrap text-[12.5px] text-ink-muted">
                    {new Date(row.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <form action={deleteEnquiry}>
                    <input type="hidden" name="id" value={row.id} />
                    <button
                      type="submit"
                      aria-label="Delete enquiry"
                      className="flex items-center justify-center rounded-lg border border-slate-300 p-1.5 text-red-700 transition-colors duration-200 hover:border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </form>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-navy-950">
                {row.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
