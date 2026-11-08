/**
 * Shown the instant an admin link is clicked, while the page's data loads —
 * so navigation never looks frozen.
 */
export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-56 rounded-xl bg-cream-dark dark:bg-slate-800" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-3xl bg-white dark:bg-slate-900" />
        ))}
      </div>
      <div className="h-80 rounded-3xl bg-white dark:bg-slate-900" />
    </div>
  );
}
