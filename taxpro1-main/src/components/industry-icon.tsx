import {
  Banknote,
  BookOpen,
  Briefcase,
  Building2,
  Calculator,
  GraduationCap,
  Hammer,
  Landmark,
  LineChart,
  Scale,
  ShieldCheck,
  Users,
} from "lucide-react";

/**
 * Icons an admin can pick for an industry, by name.
 *
 * An allowlist rather than a dynamic lookup across lucide-react: importing the
 * whole icon set to satisfy an arbitrary string would pull thousands of unused
 * components into the bundle. Unknown or empty names fall back to Building2, so a
 * typo in the admin degrades to a generic tile instead of a crash.
 */
const ICONS = {
  Banknote,
  BookOpen,
  Briefcase,
  Building2,
  Calculator,
  GraduationCap,
  Hammer,
  Landmark,
  LineChart,
  Scale,
  ShieldCheck,
  Users,
} as const;

export const INDUSTRY_ICON_NAMES = Object.keys(ICONS);

export function IndustryIcon({
  name,
  className,
}: {
  name: string | null;
  className?: string;
}) {
  const Icon = (name && ICONS[name as keyof typeof ICONS]) || Building2;
  return <Icon className={className} aria-hidden />;
}
