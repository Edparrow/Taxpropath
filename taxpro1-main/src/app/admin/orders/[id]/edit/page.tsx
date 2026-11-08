import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { loadCourseOptions } from "@/lib/admin/course-options";
import { ManualOrderForm, type OrderInitial } from "../../new/manual-order-form";
import { updateOrder } from "../../actions";

export const metadata = { title: "Edit Order" };

/**
 * "YYYY-MM-DDTHH:mm" for a datetime-local input, in the server's own time zone
 * — the same zone the save action reads it back in, so an unchanged date
 * round-trips exactly.
 */
function localInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin("orders", "edit");
  const { id } = await params;

  const [{ data: order }, courses] = await Promise.all([
    createAdminClient()
      .from("orders")
      .select(
        `id, status, payment_method, billing, guest_email, subtotal_cents, discount_cents, coupon_code,
         paypal_capture_id, paid_at, created_at, remarks, deleted_at,
         order_items ( course_slug, option_code )`,
      )
      .eq("id", id)
      .maybeSingle(),
    loadCourseOptions(),
  ]);
  if (!order || order.deleted_at) notFound();

  const items = order.order_items as { course_slug: string; option_code: string | null }[];
  // Course ids aren't stored on items; find it by slug.
  const slug = items[0]?.course_slug;
  let courseId = "";
  if (slug) {
    const { data: course } = await createAdminClient().from("courses").select("id").eq("slug", slug).maybeSingle();
    courseId = course?.id ?? "";
  }

  const billing = { ...((order.billing ?? {}) as Record<string, string>) };
  if (!billing.email && order.guest_email) billing.email = order.guest_email;

  const initial: OrderInitial = {
    billing,
    courseId,
    addons: items.map((i) => i.option_code ?? "").filter((c) => c && c !== "SELF_STUDY"),
    amount: ((order.subtotal_cents - (order.discount_cents ?? 0)) / 100).toFixed(2),
    orderDate: localInput(order.paid_at ?? order.created_at),
    transId: order.paypal_capture_id ?? "",
    couponCode: order.coupon_code ?? "",
    remarks: order.remarks ?? "",
  };
  const manual = order.payment_method === "manual";

  return (
    <>
      <Link
        href="/admin/orders"
        className="mb-4 inline-flex items-center gap-1 text-[13.5px] font-semibold text-ink-muted hover:text-navy-950"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back to Completed Orders
      </Link>
      <h1 className="text-2xl font-extrabold text-navy-950 dark:text-white">
        Edit Order <span className="font-mono text-[20px] text-ink-muted">#{order.id.slice(0, 8)}</span>
      </h1>
      <p className="mb-8 mt-1 text-[14px] text-ink-muted">
        {manual ? "Manual order" : "PayPal order"} · every change is recorded in Activity Logs.
      </p>
      <ManualOrderForm
        courses={courses}
        initial={initial}
        action={updateOrder.bind(null, order.id)}
        mode={manual ? "edit-manual" : "edit-paypal"}
      />
    </>
  );
}
