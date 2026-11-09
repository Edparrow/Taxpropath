import { BookOpenCheck, Building2, Cpu, Landmark, Users, type LucideIcon } from "lucide-react";

/**
 * Course cards have no photo: their cover is drawn from the course itself.
 * The topic (picked from the title and field of study) sets the cover's
 * label, icon and colours, all within the brand's green / blue / navy.
 */
export type CourseTopic = {
  label: string;
  icon: LucideIcon;
  /** Tailwind background classes for the cover. */
  cover: string;
};

const TOPICS: { test: RegExp; topic: CourseTopic }[] = [
  {
    test: /\bHUD\b|housing|multifamily|live-in aide|\bESA\b|tenant|landlord|property manag/i,
    topic: {
      label: "Housing Compliance",
      icon: Building2,
      cover: "bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500",
    },
  },
  {
    test: /\bAI\b|claude|chatgpt|artificial intelligence|information technology|technology|cyber|excel|software|automation|data analytics/i,
    topic: {
      label: "Technology",
      icon: Cpu,
      cover: "bg-gradient-to-br from-navy-900 via-navy-700 to-navy-500",
    },
  },
  {
    test: /OSHA|\bHR\b|HRCI|SHRM|harass|bullying|investigation|workplace|employee|employment|payroll|human resource/i,
    topic: {
      label: "HR & Workplace",
      icon: Users,
      cover: "bg-gradient-to-br from-teal-900 via-teal-700 to-brand-500",
    },
  },
  {
    test: /tax|\bIRS\b|1099|1040|1041|1065|1120|706|709|FBAR|FATCA|estate|trust|S[- ]corp|K-1|deduction|depreciation|IRA\b|RMD|audit/i,
    topic: {
      label: "Tax",
      icon: Landmark,
      cover: "bg-gradient-to-br from-navy-950 via-navy-700 to-navy-500",
    },
  },
];

const DEFAULT_TOPIC: CourseTopic = {
  label: "Accounting & Finance",
  icon: BookOpenCheck,
  cover: "bg-brand-gradient",
};

export function topicFor(course: { title: string; fieldOfStudy: string | null }): CourseTopic {
  const text = `${course.title} ${course.fieldOfStudy ?? ""}`;
  return TOPICS.find((t) => t.test.test(text))?.topic ?? DEFAULT_TOPIC;
}

/** "Charles K Montecino" → "CM". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
