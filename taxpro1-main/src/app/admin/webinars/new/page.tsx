import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { WebinarForm, type WebinarFormValues } from "../webinar-form";

export const metadata = { title: "New webinar" };

const BLANK: WebinarFormValues = {
  id: null,
  slug: "",
  title: "",
  kind: "upcoming",
  presenter: "",
  eventAt: "",
  durationMins: 60,
  productCode: "",
  description: "",
  learningObjectives: "",
  topicsCovered: "",
  whoShouldAttend: "",
  cpeCredit: "",
  fieldOfStudy: "",
  prerequisites: "None",
  learningLevel: "",
  deliveryMethod: "Group Internet Based",
  industry: "",
  isFeatured: false,
  isPublished: true,
  videoPath: null,
  videoUrl: "",
  options: [],
  seoTitle: "",
  seoDescription: "",
  faq: [],
};

export default async function NewWebinarPage() {
  await requireAdmin();

  return (
    <>
      <Link
        href="/admin/webinars"
        className="mb-4 inline-flex items-center gap-1 text-[13.5px] font-semibold text-ink-muted transition-colors duration-200 hover:text-navy-950"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back to webinars
      </Link>
      <h1 className="mb-8 text-2xl font-extrabold text-navy-950">New webinar</h1>
      <WebinarForm initial={BLANK} />
    </>
  );
}
