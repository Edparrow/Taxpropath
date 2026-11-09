import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { can } from "@/lib/admin/permissions";
import { ViewOnlyNotice } from "../view-only";
import { PriceManager, type PriceCourse } from "./price-manager";

export const metadata = { title: "Change Price" };

type Row = {
  id: string;
  title: string;
  is_published: boolean;
  presenters: { name: string } | null;
  pricing_options: { code: string | null; price_cents: number }[];
};

export default async function ChangePricePage() {
  const admin = await requireAdmin("courses");
  const canEdit = can(admin, "courses", "edit");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("courses")
    .select("id, title, is_published, presenters(name), pricing_options(code, price_cents)")
    .order("title");

  const courses: PriceCourse[] = ((data ?? []) as unknown as Row[]).map((c) => {
    const cents = (code: string) => c.pricing_options.find((o) => o.code === code)?.price_cents ?? null;
    return {
      id: c.id,
      title: c.title,
      speaker: c.presenters?.name ?? null,
      published: c.is_published,
      prices: {
        SELF_STUDY: cents("SELF_STUDY"),
        ETRANSCRIPT: cents("ETRANSCRIPT"),
        SLIDES: cents("SLIDES"),
      },
    };
  });

  return (
    <>
      {!canEdit && <ViewOnlyNotice />}
      <h1 className="text-2xl font-extrabold text-navy-950 dark:text-white">Change Price</h1>
      <p className="mt-1 text-[14px] text-ink-muted dark:text-slate-400">
        Change the Self-Study, e-Transcript and Slides prices for every course at once, for the
        courses you tick, or for one course at a time.
      </p>

      {error ? (
        <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-800">
          Could not load courses: {error.message}
        </p>
      ) : (
        <PriceManager courses={courses} canEdit={canEdit} />
      )}
    </>
  );
}
