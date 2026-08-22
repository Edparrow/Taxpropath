import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { CouponForm, type CouponFormValues } from "../coupon-form";

export const metadata = { title: "Edit coupon" };

type Row = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "fixed" | "percent";
  discount_value: number;
  min_order_cents: number;
  max_redemptions: number | null;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
};

/** `datetime-local` needs `YYYY-MM-DDTHH:mm` with no timezone suffix. */
function toLocalInput(iso: string | null) {
  return iso ? new Date(iso).toISOString().slice(0, 16) : "";
}

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("coupons")
    .select(
      "id, code, description, discount_type, discount_value, min_order_cents, max_redemptions, starts_at, expires_at, is_active",
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const row = data as Row;

  const initial: CouponFormValues = {
    id: row.id,
    code: row.code,
    description: row.description ?? "",
    discountType: row.discount_type,
    discountValue:
      row.discount_type === "percent"
        ? String(row.discount_value)
        : (row.discount_value / 100).toFixed(2),
    minOrder: (row.min_order_cents / 100).toFixed(2),
    maxRedemptions: row.max_redemptions === null ? "" : String(row.max_redemptions),
    startsAt: toLocalInput(row.starts_at),
    expiresAt: toLocalInput(row.expires_at),
    isActive: row.is_active,
  };

  return (
    <>
      <Link
        href="/admin/coupons"
        className="mb-4 inline-flex items-center gap-1 text-[13.5px] font-semibold text-ink-muted transition-colors duration-200 hover:text-navy-950"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back to coupons
      </Link>
      <h1 className="mb-8 text-2xl font-extrabold text-navy-950">{row.code}</h1>
      <CouponForm initial={initial} />
    </>
  );
}
