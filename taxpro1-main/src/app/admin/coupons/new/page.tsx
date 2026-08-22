import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin-auth";
import { CouponForm, type CouponFormValues } from "../coupon-form";

export const metadata = { title: "New coupon" };

const BLANK: CouponFormValues = {
  id: null,
  code: "",
  description: "",
  discountType: "fixed",
  discountValue: "",
  minOrder: "",
  maxRedemptions: "",
  startsAt: "",
  expiresAt: "",
  isActive: true,
};

export default async function NewCouponPage() {
  await requireAdmin();

  return (
    <>
      <Link
        href="/admin/coupons"
        className="mb-4 inline-flex items-center gap-1 text-[13.5px] font-semibold text-ink-muted transition-colors duration-200 hover:text-navy-950"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back to coupons
      </Link>
      <h1 className="mb-8 text-2xl font-extrabold text-navy-950">New coupon</h1>
      <CouponForm initial={BLANK} />
    </>
  );
}
