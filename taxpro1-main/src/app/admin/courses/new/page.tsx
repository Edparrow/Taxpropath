import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { CourseForm, type CourseFormValues } from "../course-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "New Course" };

const BLANK: CourseFormValues = {
  id: null,
  slug: "",
  title: "",
  presenter: "",

  imageUrl: "",
  categoryId: "",
  subcategoryId: "",

  description: "",
  topicsCovered: "",
  whoShouldAttend: "",

  cpeCredit: "",
  fieldOfStudy: "",

  prices: { SELF_STUDY: "", ETRANSCRIPT: "", SLIDES: "" },

  engineDeliveryId: "",
  engineProgramId: "",

  isPublished: true,
  isFeatured: false,

  metaTitle: "",
  metaKeyword: "",
  metaDescription: "",
};

export default async function NewCoursePage() {
  await requireAdmin("courses", "edit");
  const supabase = await createClient();

  const [{ data: categories }, { data: subcategories }] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("subcategories").select("id, category_id, name").order("sort_order"),
  ]);

  return (
    <>
      <Link
        href="/admin/courses"
        className="mb-4 inline-flex items-center gap-1 text-[13.5px] font-semibold text-ink-muted transition-colors duration-200 hover:text-navy-950"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back to Courses
      </Link>
      <h1 className="mb-8 text-2xl font-extrabold text-navy-950">Create Course</h1>
      <CourseForm
        initial={BLANK}
        categories={categories || []}
        subcategories={subcategories || []}
      />
    </>
  );
}
