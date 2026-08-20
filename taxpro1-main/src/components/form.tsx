import { cn } from "@/lib/utils";

const controlStyles =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-navy-950 outline-none transition-colors duration-200 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25 disabled:bg-slate-50 disabled:text-slate-400";

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-[13px] font-bold text-navy-950"
      >
        {label}
        {required && (
          <span className="ml-0.5 text-red-600" aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p className="mt-1.5 text-[12.5px] text-slate-500">{hint}</p>
      )}
      {error && (
        <p role="alert" className="mt-1.5 text-[12.5px] font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlStyles, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlStyles, "resize-y", className)} {...props} />;
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlStyles, "cursor-pointer", className)} {...props} />
  );
}

export function SubmitButton({
  pending,
  children,
  className,
}: {
  pending?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "flex w-full cursor-pointer items-center justify-center rounded-full bg-brand-gradient py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0",
        className,
      )}
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}

/** Shown on auth screens until real Supabase credentials are supplied. */
export function SupabaseNotice() {
  return (
    <p className="rounded-xl bg-amber-50 px-4 py-3 text-[13.5px] leading-relaxed text-amber-900">
      Authentication is not connected yet. Add your Supabase project URL and anon key
      to <code className="font-mono font-semibold">.env.local</code> to enable sign-in.
    </p>
  );
}

export function FormAlert({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: React.ReactNode;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      aria-live="polite"
      className={cn(
        "rounded-xl px-4 py-3 text-[14px] font-medium",
        tone === "error"
          ? "bg-red-50 text-red-700"
          : "bg-brand-50 text-brand-800",
      )}
    >
      {children}
    </p>
  );
}
