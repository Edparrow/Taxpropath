"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { saveCourse } from "./actions";

export type CourseFormValues = {
  id: string | null;
  slug: string;
  title: string;
  presenter: string;

  imageUrl: string;
  categoryId: string;
  subcategoryId: string;

  description: string; // Learning Objectives
  topicsCovered: string;
  whoShouldAttend: string;

  cpeCredit: string;
  fieldOfStudy: string;

  /** Dollar amounts as typed; an empty add-on price means "not offered". */
  prices: { SELF_STUDY: string; ETRANSCRIPT: string; SLIDES: string };

  engineDeliveryId: string;
  engineProgramId: string;

  isPublished: boolean;
  isFeatured: boolean;

  metaTitle: string;
  metaKeyword: string;
  metaDescription: string;
};

type Category = { id: string; name: string };
type Subcategory = { id: string; category_id: string; name: string };

export function CourseForm({
  initial,
  categories = [],
  subcategories = [],
}: {
  initial: CourseFormValues;
  categories?: Category[];
  subcategories?: Subcategory[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState(initial.categoryId || "");

  const filteredSubcats = subcategories.filter((s) => s.category_id === selectedCat);

  return (
    <form
      action={async (formData) => {
        setError(null);
        const result = await saveCourse(initial.id, null, formData);
        if (result?.error) setError(result.error);
      }}
      className="pb-24"
    >
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-[14px] font-medium text-red-800">
          {error}
        </div>
      )}

      {/* Row 1 */}
      <div className="mb-6 grid gap-5 md:grid-cols-12">
        <div className="md:col-span-4">
          <Field label="Image">
            <input
              name="image_url"
              defaultValue={initial.imageUrl}
              placeholder="Image URL (e.g. https://...)"
              className={INPUT}
            />
          </Field>
        </div>
        <div className="md:col-span-4">
          <Field label="Category">
            <select
              name="category_id"
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className={INPUT}
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="md:col-span-4">
          <Field label="SubCategory">
            <select name="subcategory_id" defaultValue={initial.subcategoryId} className={INPUT}>
              <option value="">Select SubCategory</option>
              {filteredSubcats.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* Row 2 */}
      <div className="mb-6 grid gap-5 md:grid-cols-12">
        <div className="md:col-span-8">
          <Field label="Course Title" required>
            <input
              name="title"
              defaultValue={initial.title}
              placeholder="Enter course title"
              className={INPUT}
              required
            />
          </Field>
        </div>
        <div className="md:col-span-4">
          <Field label="Speaker">
            <input
              name="presenter"
              defaultValue={initial.presenter}
              placeholder="Enter speaker name"
              className={INPUT}
            />
          </Field>
        </div>
      </div>

      {/* Row 3: credits */}
      <div className="mb-6 grid gap-5 md:grid-cols-12">
        <div className="md:col-span-3">
          <Field label="IRS CE / CPE Credit">
            <input
              name="cpe_credit"
              type="number"
              step="0.5"
              min="0"
              defaultValue={initial.cpeCredit}
              placeholder="e.g. 2"
              className={INPUT}
            />
          </Field>
        </div>
        <div className="md:col-span-5">
          <Field label="Field of Study">
            <input
              name="field_of_study"
              defaultValue={initial.fieldOfStudy}
              placeholder="e.g. Federal Tax"
              className={INPUT}
            />
          </Field>
        </div>
        <div className="flex items-center gap-6 pt-6 md:col-span-4">
          <Check name="is_published" label="Published" defaultChecked={initial.isPublished} />
          <Check name="is_featured" label="Trending (homepage)" defaultChecked={initial.isFeatured} />
        </div>
      </div>

      {/* Row 4: detailed content */}
      <div className="mb-6 space-y-6">
        <Field label="Learning Objectives">
          <textarea name="description" defaultValue={initial.description} className={INPUT} rows={5} />
        </Field>
        <Field label="Topics Covered" hint="One per line.">
          <textarea
            name="topics_covered"
            defaultValue={initial.topicsCovered}
            className={INPUT}
            rows={5}
          />
        </Field>
        <Field label="Who This Course Is For" hint="One per line.">
          <textarea
            name="who_should_attend"
            defaultValue={initial.whoShouldAttend}
            className={INPUT}
            rows={5}
          />
        </Field>
      </div>

      {/* Row 5: pricing — one base price + two optional add-ons */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-[15px] font-extrabold text-navy-950">Prices (USD)</h2>
        <p className="mt-1 text-[13px] text-ink-muted">
          Leave an add-on empty to not offer it for this course.
        </p>
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <Field label="Self-Study Course" required>
            <input
              name="price_SELF_STUDY"
              type="number"
              step="0.01"
              min="0"
              defaultValue={initial.prices.SELF_STUDY}
              placeholder="e.g. 179"
              className={INPUT}
              required
            />
          </Field>
          <Field label="e-Transcript add-on">
            <input
              name="price_ETRANSCRIPT"
              type="number"
              step="0.01"
              min="0"
              defaultValue={initial.prices.ETRANSCRIPT}
              placeholder="Optional"
              className={INPUT}
            />
          </Field>
          <Field label="Slides & Material add-on">
            <input
              name="price_SLIDES"
              type="number"
              step="0.01"
              min="0"
              defaultValue={initial.prices.SLIDES}
              placeholder="Optional"
              className={INPUT}
            />
          </Field>
        </div>
      </div>

      {/* Row 6: course engine link */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-[15px] font-extrabold text-navy-950">Course Engine (join.us-cpe.com)</h2>
        <p className="mt-1 text-[13px] text-ink-muted">
          Typed once per course so orders reach the right recording in the portal.
        </p>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="Engine Delivery ID">
            <input
              name="engine_delivery_id"
              defaultValue={initial.engineDeliveryId}
              placeholder="From the engine"
              className={INPUT}
            />
          </Field>
          <Field label="Engine Program ID">
            <input
              name="engine_program_id"
              defaultValue={initial.engineProgramId}
              placeholder="IRS program number"
              className={INPUT}
            />
          </Field>
        </div>
      </div>

      {/* Row 7: SEO */}
      <div className="mb-6 grid gap-5 md:grid-cols-3">
        <Field label="Meta Title">
          <textarea
            name="meta_title"
            defaultValue={initial.metaTitle}
            placeholder="Enter Meta Title"
            className={INPUT}
            rows={3}
          />
        </Field>
        <Field label="Meta Keyword">
          <textarea
            name="meta_keyword"
            defaultValue={initial.metaKeyword}
            placeholder="Meta Keyword"
            className={INPUT}
            rows={3}
          />
        </Field>
        <Field label="Meta Description">
          <textarea
            name="meta_description"
            defaultValue={initial.metaDescription}
            placeholder="Enter Meta Description"
            className={INPUT}
            rows={3}
          />
        </Field>
      </div>

      <div className="sticky bottom-0 mt-8 flex items-center gap-3 border-t border-slate-200 bg-cream/95 py-4 backdrop-blur">
        <SubmitButton isNew={!initial.id} />
        <Link
          href="/admin/courses"
          className="rounded-full px-5 py-3 text-[14px] font-semibold text-ink-muted transition-colors duration-200 hover:text-navy-950"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

const INPUT =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[14px] text-navy-950 transition-colors duration-200 outline-none focus:border-brand-500";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-navy-950">
        {label}
        {required && <span className="text-red-600"> *</span>}
        {hint && <span className="ml-1.5 font-medium text-slate-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Check({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[14px] font-semibold text-navy-950">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="size-4 cursor-pointer accent-brand-600"
      />
      {label}
    </label>
  );
}

function SubmitButton({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex cursor-pointer items-center gap-2 rounded-full bg-brand-gradient shadow-md shadow-brand-600/20 px-7 py-3 text-[14px] font-bold text-white transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? "Saving..." : isNew ? "Create Course" : "Save changes"}
    </button>
  );
}
