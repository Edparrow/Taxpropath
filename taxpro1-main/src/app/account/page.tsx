import type { Metadata } from "next";
import Link from "next/link";
import { Building2, ExternalLink, MapPin, Pencil, UserRound } from "lucide-react";
import { PORTAL_URL } from "@/lib/portal";
import { formatPrice } from "@/lib/utils";
import {
  displayName,
  getMyOrders,
  getMyProfile,
  longDate,
  myOrderTotalCents,
  requireCustomer,
  shortDate,
} from "@/lib/account";

export const metadata: Metadata = { title: "My Profile", robots: { index: false } };

export default async function MyProfilePage() {
  const user = await requireCustomer("/account");
  const [profile, orders] = await Promise.all([getMyProfile(user.id), getMyOrders(user)]);

  const paid = orders.filter((o) => o.status === "paid");
  const spent = paid.reduce((sum, o) => sum + myOrderTotalCents(o), 0);
  const memberSince = profile?.created_at ?? user.created_at;
  const lastOrder = orders[0] ? (orders[0].paid_at ?? orders[0].created_at) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 rounded-3xl bg-brand-gradient p-6 text-white shadow-lg shadow-brand-600/20 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wider text-white/80">Welcome back</p>
          <h2 className="mt-1 text-2xl font-extrabold">{displayName(user, profile)}</h2>
          <p className="mt-1.5 text-[14px] text-white/85">
            Member since {longDate(memberSince)}
            {lastOrder && <> · Last order {shortDate(lastOrder)}</>}
          </p>
        </div>
        <a
          href={PORTAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-[14px] font-bold text-navy-950 transition-transform duration-200 hover:-translate-y-0.5"
        >
          Open Your Portal
          <ExternalLink className="size-4" aria-hidden />
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Tile label="Total Orders" value={String(paid.length)} />
        <Tile label="Total Spent" value={formatPrice(spent)} />
        <Tile label="Member Since" value={shortDate(memberSince)} />
      </div>

      <div className="flex items-center justify-between gap-4 pt-2">
        <h2 className="text-xl font-extrabold text-navy-950">Your details</h2>
        <Link
          href="/account/edit"
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-300 px-4 py-2 text-[13.5px] font-bold text-navy-950 transition-colors duration-200 hover:border-brand-600 hover:text-brand-700"
        >
          <Pencil className="size-3.5" aria-hidden />
          Edit profile
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card icon={UserRound} title="Personal Information">
          <Row label="Full Name" value={[profile?.first_name, profile?.last_name].filter(Boolean).join(" ")} />
          <Row label="Email" value={user.email} />
          <Row label="Phone" value={profile?.phone} />
          <Row label="PTIN" value={profile?.ptin} />
        </Card>
        <Card icon={MapPin} title="Mailing Address">
          <Row label="Street" value={[profile?.address1, profile?.address2].filter(Boolean).join(", ")} />
          <Row label="City" value={profile?.city} />
          <Row label="State / Region" value={profile?.region} />
          <Row label="Country" value={profile?.country} />
          <Row label="ZIP" value={profile?.zip} />
        </Card>
        <Card icon={Building2} title="Company Details">
          <Row label="Company" value={profile?.company} />
        </Card>
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 px-5 py-4">
      <p className="text-[12.5px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums text-navy-950">{value}</p>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 p-6">
      <h3 className="flex items-center gap-2 text-[15px] font-extrabold text-navy-950">
        <Icon className="size-4.5 text-brand-600" aria-hidden />
        {title}
      </h3>
      <dl className="mt-4 space-y-3">{children}</dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 text-[14px]">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="break-words font-semibold text-navy-950">{value || "—"}</dd>
    </div>
  );
}
