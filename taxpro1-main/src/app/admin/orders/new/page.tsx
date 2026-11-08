import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { loadCourseOptions } from "@/lib/admin/course-options";
import { ManualOrderForm } from "./manual-order-form";

export const metadata = { title: "Manual Order" };

export default async function ManualOrderPage() {
  await requireAdmin("orders", "edit");
  const courses = await loadCourseOptions();

  return (
    <>
      <Link
        href="/admin/orders"
        className="mb-4 inline-flex items-center gap-1 text-[13.5px] font-semibold text-ink-muted hover:text-navy-950"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back to Completed Orders
      </Link>
      <h1 className="text-2xl font-extrabold text-navy-950 dark:text-white">Manual Order</h1>
      <p className="mb-8 mt-1 text-[14px] text-ink-muted">
        Record a course sold outside the website (phone, invoice, bank transfer). It is saved as paid and
        reaches the customer&rsquo;s portal like any other order.
      </p>
      <ManualOrderForm courses={courses} />
    </>
  );
}
