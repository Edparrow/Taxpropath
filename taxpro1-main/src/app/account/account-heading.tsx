/** Page heading used on every account page: title, one-line description, actions. */
export function AccountHeading({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  /** Buttons shown on the right. */
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-navy-950">{title}</h2>
        {description && <p className="mt-1 text-[14.5px] text-slate-500">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2.5">{children}</div>}
    </div>
  );
}
