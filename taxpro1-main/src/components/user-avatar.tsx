import { cn } from "@/lib/utils";

/**
 * A person's round avatar: their photo or chosen avatar when set, otherwise
 * their initials on the brand gradient.
 */
export function UserAvatar({
  src,
  initials,
  className,
}: {
  src: string | null | undefined;
  initials: string;
  /** Size and ring, e.g. "size-12" or "size-28 text-3xl". */
  className?: string;
}) {
  if (src) {
    return (
      // Uploaded photos live in Supabase Storage (any host), so a plain <img>.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={cn("shrink-0 rounded-full bg-slate-100 object-cover", className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-brand-gradient font-bold text-white",
        className,
      )}
    >
      {initials}
    </span>
  );
}
