"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Loader2, Search, TriangleAlert } from "lucide-react";
import { bulkChangePrices, updateCoursePrices, type PriceInput } from "./actions";

type Code = "SELF_STUDY" | "ETRANSCRIPT" | "SLIDES";

export type PriceCourse = {
  id: string;
  title: string;
  speaker: string | null;
  published: boolean;
  /** Cents; null = not offered. */
  prices: Record<Code, number | null>;
};

const CODES: { code: Code; label: string; short: string }[] = [
  { code: "SELF_STUDY", label: "Self-Study", short: "Self-Study" },
  { code: "ETRANSCRIPT", label: "e-Transcript add-on", short: "e-Transcript" },
  { code: "SLIDES", label: "Slides & Material add-on", short: "Slides" },
];

const INPUT =
  "w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-7 pr-3 text-[14px] tabular-nums text-navy-950 outline-none transition-colors duration-200 focus:border-brand-500 disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:disabled:bg-slate-900";
const CARD = "rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900";

const dollars = (cents: number | null) => (cents === null ? "" : String(cents / 100));

export function PriceManager({ courses, canEdit }: { courses: PriceCourse[]; canEdit: boolean }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Kept here: a saved row remounts with its new prices, losing its own state.
  const [savedId, setSavedId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) => c.title.toLowerCase().includes(q) || (c.speaker ?? "").toLowerCase().includes(q),
    );
  }, [courses, query]);

  const allVisibleTicked = visible.length > 0 && visible.every((c) => selected.has(c.id));
  const toggleVisible = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const c of visible) {
        if (allVisibleTicked) next.delete(c.id);
        else next.add(c.id);
      }
      return next;
    });
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      {canEdit && (
        <BulkCard
          total={courses.length}
          selectedIds={[...selected]}
          onDone={() => setSelected(new Set())}
        />
      )}

      <div className={`mt-6 ${CARD}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by course or speaker"
              aria-label="Search courses"
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-[14px] text-navy-950 outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>
          <p className="text-[13px] text-ink-muted dark:text-slate-400">
            Showing {visible.length} of {courses.length}
            {canEdit && selected.size > 0 && (
              <>
                {" · "}
                <span className="font-bold text-brand-700 dark:text-brand-400">{selected.size} ticked</span>
                {" · "}
                <button type="button" onClick={() => setSelected(new Set())} className="cursor-pointer font-semibold underline">
                  clear
                </button>
              </>
            )}
          </p>
        </div>

        {courses.length === 0 ? (
          <p className="px-5 py-14 text-center text-[14px] text-ink-muted">No courses yet.</p>
        ) : visible.length === 0 ? (
          <p className="px-5 py-14 text-center text-[14px] text-ink-muted">No course matches “{query}”.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                <tr className="text-[12px] font-bold uppercase tracking-wider text-slate-500">
                  {canEdit && (
                    <th className="w-10 px-5 py-3">
                      <input
                        type="checkbox"
                        checked={allVisibleTicked}
                        onChange={toggleVisible}
                        aria-label="Tick all courses shown"
                        className="size-4 cursor-pointer accent-brand-600"
                      />
                    </th>
                  )}
                  <th className="px-5 py-3">Course</th>
                  {CODES.map((c) => (
                    <th key={c.code} className="w-36 px-3 py-3">{c.short}</th>
                  ))}
                  {canEdit && <th className="w-28 px-5 py-3 text-right">Save</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visible.map((c) => (
                  <CourseRow
                    // A fresh row (and fresh inputs) whenever the saved prices change.
                    key={`${c.id}:${c.prices.SELF_STUDY}:${c.prices.ETRANSCRIPT}:${c.prices.SLIDES}`}
                    course={c}
                    canEdit={canEdit}
                    ticked={selected.has(c.id)}
                    onTick={() => toggle(c.id)}
                    justSaved={savedId === c.id}
                    onSaved={() => setSavedId(c.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function BulkCard({
  total,
  selectedIds,
  onDone,
}: {
  total: number;
  selectedIds: string[];
  onDone: () => void;
}) {
  const [scope, setScope] = useState<"all" | "selected">("all");
  const [prices, setPrices] = useState<PriceInput>({});
  const [remove, setRemove] = useState<Set<Code>>(new Set());
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const count = scope === "all" ? total : selectedIds.length;

  function apply() {
    setMessage(null);
    const parts = [
      ...CODES.filter((c) => !remove.has(c.code) && (prices[c.code] ?? "").trim()).map(
        (c) => `${c.short}: $${prices[c.code]!.trim()}`,
      ),
      ...CODES.filter((c) => remove.has(c.code)).map((c) => `stop offering ${c.short}`),
    ];
    if (parts.length === 0) {
      setMessage({ ok: false, text: "Enter at least one price to change." });
      return;
    }
    if (count === 0) {
      setMessage({ ok: false, text: "Tick at least one course in the list below first." });
      return;
    }
    const target = scope === "all" ? `ALL ${total} courses` : `${count} ticked course${count === 1 ? "" : "s"}`;
    if (!window.confirm(`Change prices for ${target}?\n\n${parts.join("\n")}`)) return;

    start(async () => {
      const result = await bulkChangePrices({ scope, courseIds: selectedIds, prices, remove: [...remove] });
      setMessage({ ok: result.ok, text: result.message });
      if (result.ok) {
        setPrices({});
        setRemove(new Set());
        onDone();
      }
    });
  }

  return (
    <div className={`mt-8 p-6 ${CARD}`}>
      <h2 className="text-[15px] font-extrabold text-navy-950 dark:text-white">Change prices for many courses</h2>
      <p className="mt-1 text-[13px] text-ink-muted dark:text-slate-400">
        Fill only the prices you want to change; empty boxes stay as they are.
      </p>

      <div className="mt-5 flex flex-wrap gap-2" role="radiogroup" aria-label="Apply to">
        {(
          [
            ["all", `All courses (${total})`],
            ["selected", `Ticked courses (${selectedIds.length})`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={scope === value}
            onClick={() => setScope(value)}
            className={`cursor-pointer rounded-full border px-4 py-2 text-[13px] font-bold transition-colors duration-200 ${
              scope === value
                ? "border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                : "border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {scope === "selected" && selectedIds.length === 0 && (
        <p className="mt-2 text-[13px] text-ink-muted dark:text-slate-400">
          Tick courses in the list below (search helps), then apply.
        </p>
      )}

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {CODES.map(({ code, label }) => {
          const removing = remove.has(code);
          return (
            <div key={code}>
              <label htmlFor={`bulk_${code}`} className="mb-1.5 block text-[13px] font-bold text-navy-950 dark:text-slate-200">
                {label}
              </label>
              <Dollar>
                <input
                  id={`bulk_${code}`}
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder={removing ? "Will be removed" : "No change"}
                  disabled={removing}
                  value={removing ? "" : (prices[code] ?? "")}
                  onChange={(e) => setPrices((p) => ({ ...p, [code]: e.target.value }))}
                  className={INPUT}
                />
              </Dollar>
              {code !== "SELF_STUDY" && (
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-[12.5px] text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={removing}
                    onChange={() =>
                      setRemove((prev) => {
                        const next = new Set(prev);
                        if (next.has(code)) next.delete(code);
                        else next.add(code);
                        return next;
                      })
                    }
                    className="size-3.5 accent-red-600"
                  />
                  Stop offering this add-on
                </label>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={apply}
          disabled={pending}
          className="flex cursor-pointer items-center gap-2 rounded-full bg-brand-gradient px-6 py-2.5 text-[14px] font-bold text-white shadow-md shadow-brand-600/20 transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Apply to {scope === "all" ? `all ${total}` : `${selectedIds.length} ticked`} course{count === 1 ? "" : "s"}
        </button>
        {message && <Message {...message} />}
      </div>
    </div>
  );
}

function CourseRow({
  course,
  canEdit,
  ticked,
  onTick,
  justSaved,
  onSaved,
}: {
  course: PriceCourse;
  canEdit: boolean;
  ticked: boolean;
  onTick: () => void;
  justSaved: boolean;
  onSaved: () => void;
}) {
  const initial = {
    SELF_STUDY: dollars(course.prices.SELF_STUDY),
    ETRANSCRIPT: dollars(course.prices.ETRANSCRIPT),
    SLIDES: dollars(course.prices.SLIDES),
  };
  const [values, setValues] = useState<Record<Code, string>>(initial);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const dirty = CODES.some(({ code }) => values[code].trim() !== initial[code]);

  function save() {
    setMessage(null);
    start(async () => {
      const result = await updateCoursePrices(course.id, values);
      if (result.ok) onSaved();
      setMessage({ ok: result.ok, text: result.message });
    });
  }

  return (
    <tr className={`align-top text-[14px] ${ticked ? "bg-brand-50/50 dark:bg-brand-950/30" : ""}`}>
      {canEdit && (
        <td className="px-5 py-4">
          <input
            type="checkbox"
            checked={ticked}
            onChange={onTick}
            aria-label={`Tick ${course.title}`}
            className="mt-1 size-4 cursor-pointer accent-brand-600"
          />
        </td>
      )}
      <td className="px-5 py-4">
        <p className="font-semibold leading-snug text-navy-950 dark:text-white">{course.title}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[12.5px] text-ink-muted dark:text-slate-400">
          {course.speaker ?? "No speaker"}
          {!course.published && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-slate-800">Draft</span>
          )}
        </p>
        {(message ?? (justSaved && !dirty ? { ok: true, text: "Saved." } : null)) && (
          <div className="mt-2">
            <Message {...(message ?? { ok: true, text: "Saved." })} />
          </div>
        )}
      </td>
      {CODES.map(({ code, short }) => (
        <td key={code} className="px-3 py-4">
          <Dollar>
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              aria-label={`${short} price for ${course.title}`}
              placeholder={code === "SELF_STUDY" ? "Required" : "None"}
              title={code === "SELF_STUDY" ? undefined : "Leave empty to not offer this add-on"}
              value={values[code]}
              disabled={!canEdit || pending}
              onChange={(e) => setValues((v) => ({ ...v, [code]: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && dirty) save();
              }}
              className={`${INPUT} py-2`}
            />
          </Dollar>
        </td>
      ))}
      {canEdit && (
        <td className="px-5 py-4 text-right">
          <button
            type="button"
            onClick={save}
            disabled={!dirty || pending}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-[13px] font-semibold text-navy-950 transition-colors duration-200 hover:bg-slate-50 disabled:cursor-default disabled:opacity-40 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
          >
            {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
            Save
          </button>
        </td>
      )}
    </tr>
  );
}

function Dollar({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-slate-400">$</span>
      {children}
    </div>
  );
}

function Message({ ok, text }: { ok: boolean; text: string }) {
  const Icon = ok ? CheckCircle2 : TriangleAlert;
  return (
    <p
      role="status"
      className={`flex items-center gap-1.5 text-[13px] font-semibold ${ok ? "text-brand-700 dark:text-brand-400" : "text-red-700 dark:text-red-400"}`}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {text}
    </p>
  );
}
