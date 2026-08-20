"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { saveWebinar } from "./actions";
import { VideoUpload } from "./video-upload";

export type WebinarFormValues = {
  id: string | null;
  slug: string;
  title: string;
  kind: string;
  presenter: string;
  eventAt: string;
  durationMins: number;
  productCode: string;
  description: string;
  learningObjectives: string;
  topicsCovered: string;
  whoShouldAttend: string;
  cpeCredit: string;
  fieldOfStudy: string;
  prerequisites: string;
  learningLevel: string;
  deliveryMethod: string;
  industry: string;
  isFeatured: boolean;
  isPublished: boolean;
  videoPath: string | null;
  videoUrl: string;
  options: { label: string; description: string; price: string }[];
};

const DEFAULT_OPTION = { label: "", description: "", price: "" };

export function WebinarForm({ initial }: { initial: WebinarFormValues }) {
  const action = saveWebinar.bind(null, initial.id);
  const [state, formAction] = useActionState(action, undefined);
  const [options, setOptions] = useState(
    initial.options.length ? initial.options : [DEFAULT_OPTION],
  );

  return (
    <form action={formAction} className="max-w-4xl">
      {state?.error && (
        <p
          role="alert"
          className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-[14px] font-medium text-red-800"
        >
          {state.error}
        </p>
      )}

      <Card title="Basics">
        <Grid>
          <Field label="Title" required className="sm:col-span-2">
            <input name="title" defaultValue={initial.title} required className={INPUT} />
          </Field>
          <Field
            label="URL slug"
            hint="Leave blank to generate from the title."
            className="sm:col-span-2"
          >
            <input name="slug" defaultValue={initial.slug} className={INPUT} />
          </Field>
          <Field label="Presenter">
            <input name="presenter" defaultValue={initial.presenter} className={INPUT} />
          </Field>
          <Field label="Type">
            <select name="kind" defaultValue={initial.kind} className={INPUT}>
              <option value="upcoming">Upcoming</option>
              <option value="pre_recorded">Pre-recorded</option>
            </select>
          </Field>
          <Field label="Event date &amp; time" required>
            <input
              type="datetime-local"
              name="event_at"
              defaultValue={initial.eventAt}
              required
              className={INPUT}
            />
          </Field>
          <Field label="Duration (minutes)">
            <input
              type="number"
              name="duration_mins"
              min={1}
              defaultValue={initial.durationMins}
              className={INPUT}
            />
          </Field>
          <Field label="Product code">
            <input
              name="product_code"
              defaultValue={initial.productCode}
              className={INPUT}
            />
          </Field>
          <Field label="Industry">
            <input name="industry" defaultValue={initial.industry} className={INPUT} />
          </Field>
        </Grid>

        <div className="mt-6 flex flex-wrap gap-6">
          <Checkbox name="is_published" defaultChecked={initial.isPublished}>
            Published{" "}
            <span className="font-normal text-ink-muted">(visible on the site)</span>
          </Checkbox>
          <Checkbox name="is_featured" defaultChecked={initial.isFeatured}>
            Featured{" "}
            <span className="font-normal text-ink-muted">(shown on the homepage)</span>
          </Checkbox>
        </div>
      </Card>

      <Card title="Recording">
        <VideoUpload
          webinarId={initial.id}
          initialPath={initial.videoPath}
          initialUrl={initial.videoUrl}
        />
      </Card>

      <Card title="Content">
        <Field label="Description" hint="Separate paragraphs with a blank line.">
          <textarea
            name="description"
            defaultValue={initial.description}
            rows={8}
            className={INPUT}
          />
        </Field>
        <div className="mt-5 space-y-5">
          <Field label="Learning objectives" hint="One per line.">
            <textarea
              name="learning_objectives"
              defaultValue={initial.learningObjectives}
              rows={5}
              className={INPUT}
            />
          </Field>
          <Field label="Topics covered" hint="One per line.">
            <textarea
              name="topics_covered"
              defaultValue={initial.topicsCovered}
              rows={5}
              className={INPUT}
            />
          </Field>
          <Field label="Who should attend" hint="One per line.">
            <textarea
              name="who_should_attend"
              defaultValue={initial.whoShouldAttend}
              rows={5}
              className={INPUT}
            />
          </Field>
        </div>
      </Card>

      <Card title="Credits">
        <Grid>
          <Field label="CPE credit">
            <input
              type="number"
              step="0.5"
              name="cpe_credit"
              defaultValue={initial.cpeCredit}
              className={INPUT}
            />
          </Field>
          <Field label="Field of study">
            <input
              name="field_of_study"
              defaultValue={initial.fieldOfStudy}
              className={INPUT}
            />
          </Field>
          <Field label="Prerequisites">
            <input
              name="prerequisites"
              defaultValue={initial.prerequisites}
              className={INPUT}
            />
          </Field>
          <Field label="Learning level">
            <input
              name="learning_level"
              defaultValue={initial.learningLevel}
              className={INPUT}
            />
          </Field>
          <Field label="Delivery method" className="sm:col-span-2">
            <input
              name="delivery_method"
              defaultValue={initial.deliveryMethod}
              className={INPUT}
            />
          </Field>
        </Grid>
      </Card>

      <Card title="Pricing options">
        <p className="mb-4 text-[13.5px] text-ink-muted">
          Each row becomes a purchasable format. Prices are in dollars.
        </p>
        <div className="space-y-3">
          {options.map((option, i) => (
            <div
              key={i}
              className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-[1fr_1.5fr_120px_auto]"
            >
              <input
                name="option_label"
                defaultValue={option.label}
                placeholder="LIVE"
                aria-label={`Option ${i + 1} label`}
                className={INPUT}
              />
              <input
                name="option_description"
                defaultValue={option.description}
                placeholder="What the buyer gets"
                aria-label={`Option ${i + 1} description`}
                className={INPUT}
              />
              <input
                name="option_price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={option.price}
                placeholder="199.00"
                aria-label={`Option ${i + 1} price`}
                className={INPUT}
              />
              <button
                type="button"
                onClick={() => setOptions(options.filter((_, idx) => idx !== i))}
                aria-label={`Remove option ${i + 1}`}
                className="flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 px-3 text-red-700 transition-colors duration-200 hover:border-red-300 hover:bg-red-50"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOptions([...options, DEFAULT_OPTION])}
          className="mt-4 flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-[14px] font-semibold text-navy-950 transition-colors duration-200 hover:bg-slate-50"
        >
          <Plus className="size-4" aria-hidden />
          Add option
        </button>
      </Card>

      <div className="sticky bottom-0 mt-8 flex items-center gap-3 border-t border-slate-200 bg-slate-50/95 py-4 backdrop-blur">
        <SubmitButton isNew={!initial.id} />
        <Link
          href="/admin/webinars"
          className="rounded-full px-5 py-3 text-[14px] font-semibold text-ink-muted transition-colors duration-200 hover:text-navy-950"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function SubmitButton({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex cursor-pointer items-center gap-2 rounded-full bg-brand-600 px-7 py-3 text-[14px] font-bold text-white transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {pending ? "Saving…" : isNew ? "Create webinar" : "Save changes"}
    </button>
  );
}

const INPUT =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[14px] text-navy-950 transition-colors duration-200 outline-none focus:border-brand-500";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 first:mt-0">
      <h2 className="mb-5 text-[15px] font-extrabold text-navy-950">{title}</h2>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2">{children}</div>;
}

function Field({
  label,
  hint,
  required,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[13px] font-bold text-navy-950">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[12.5px] text-ink-muted">{hint}</span>}
    </label>
  );
}

function Checkbox({
  name,
  defaultChecked,
  children,
}: {
  name: string;
  defaultChecked: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-[14px] font-semibold text-navy-950">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="size-4 cursor-pointer accent-brand-600"
      />
      {children}
    </label>
  );
}
