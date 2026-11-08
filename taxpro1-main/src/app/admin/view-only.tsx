import { Eye } from "lucide-react";

/** SkillSync's "You have view-only access to this section." strip. */
export function ViewOnlyNotice() {
  return (
    <p className="mb-6 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13.5px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
      <Eye className="size-4 text-brand-600" aria-hidden />
      You have view-only access to this section.
    </p>
  );
}
