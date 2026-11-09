import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  ExternalLink,
  Mail,
  MapPin,
  Pencil,
  Receipt,
  UserRound,
  Wallet,
} from "lucide-react";
import { PORTAL_URL } from "@/lib/portal";
import { formatPrice } from "@/lib/utils";
import {
  displayName,
  getMyOrders,
  getMyProfile,
  longDate,
  myOrderTotalCents,
  profileInitials,
  requireCustomer,
  shortDate,
} from "@/lib/account";
import { AvatarPicker } from "./avatar-picker";
import { Signature } from "./signature";

export const metadata: Metadata = { title: "My Profile", robots: { index: false } };

/** Fields that make a profile "complete" (PTIN is needed for IRS credits). */
const COMPLETE_FIELDS = [
  "first_name",
  "last_name",
  "phone",
  "ptin",
  "address1",
  "city",
  "region",
  "country",
  "zip",
] as const;

export default async function MyProfilePage() {
  const user = await requireCustomer("/account");
  const [profile, orders] = await Promise.all([getMyProfile(user.id), getMyOrders(user)]);

  const paid = orders.filter((o) => o.status === "paid");
  const spent = paid.reduce((sum, o) => sum + myOrderTotalCents(o), 0);
  const memberSince = profile?.created_at ?? user.created_at;
  const lastOrder = orders[0] ? (orders[0].paid_at ?? orders[0].created_at) : null;
  const filled = COMPLETE_FIELDS.filter((f) => profile?.[f]?.trim()).length;
  const percent = Math.round((filled / COMPLETE_FIELDS.length) * 100);

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------ profile header */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {/* Dark cover with the customer's name as a white signature. */}
        <div className="relative isolate h-40 overflow-hidden bg-navy-950 sm:h-44">
          <div aria-hidden className="absolute -left-16 -top-28 -z-10 size-80 rounded-full bg-brand-600/35 blur-3xl" />
          <div aria-hidden className="absolute -bottom-32 right-10 -z-10 size-80 rounded-full bg-navy-500/40 blur-3xl" />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 opacity-[0.08] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:32px_32px]"
          />
          <div className="absolute left-4 top-4 sm:left-6">
            <AvatarPicker
              variant="button"
              current={profile?.avatar_url ?? null}
              initials={profileInitials(user, profile)}
            />
          </div>
          {/* Signature spans the right half: from the middle to the right edge. */}
          <div className="absolute bottom-3 left-[38%] right-5 sm:left-1/2 sm:right-8">
            <Signature name={displayName(user, profile)} />
          </div>
        </div>

        <div className="px-6 pb-6 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="-mt-12">
              <AvatarPicker
                current={profile?.avatar_url ?? null}
                initials={profileInitials(user, profile)}
              />
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link
                href="/account/edit"
                className="inline-flex items-center gap-2 rounded-full bg-navy-950 px-5 py-2.5 text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-brand-700"
              >
                <Pencil className="size-4" aria-hidden />
                Edit Profile
              </Link>
              <a
                href={PORTAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-5 py-2.5 text-[14px] font-semibold text-navy-950 transition-colors duration-200 hover:border-navy-950"
              >
                Open Portal
                <ExternalLink className="size-4" aria-hidden />
              </a>
            </div>
          </div>

          <div className="mt-4 min-w-0">
            <h3 className="text-xl font-semibold text-navy-950">{displayName(user, profile)}</h3>
            <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[14px] text-ink-muted">
              <Mail className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{user.email}</span>
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-[12.5px] font-semibold text-brand-700">
              <BadgeCheck className="size-3.5" aria-hidden />
              Active Member
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[12.5px] font-medium text-slate-600">
              <CalendarDays className="size-3.5" aria-hidden />
              Member since {longDate(memberSince)}
            </span>
            {profile?.ptin && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[12.5px] font-medium text-slate-600">
                PTIN {profile.ptin}
              </span>
            )}
          </div>

          {/* Profile completeness */}
          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4 text-[13.5px]">
              <p className="font-semibold text-navy-950">Profile {percent}% complete</p>
              {percent < 100 && (
                <Link href="/account/edit" className="font-semibold text-brand-700 hover:underline">
                  Complete it
                </Link>
              )}
            </div>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${percent}%` }} />
            </div>
            {percent < 100 && (
              <p className="mt-2 text-[12.5px] text-ink-muted">
                Your PTIN and full address are needed on your IRS CE certificates.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Tile icon={Receipt} label="Courses bought" value={String(paid.length)} />
        <Tile icon={Wallet} label="Total spent" value={formatPrice(spent)} />
        <Tile
          icon={CalendarDays}
          label="Last order"
          value={lastOrder ? shortDate(lastOrder) : "None yet"}
        />
      </div>

      {/* ----------------------------------------------------- details */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card icon={UserRound} title="Personal information">
          <Row label="Full name" value={[profile?.first_name, profile?.last_name].filter(Boolean).join(" ")} />
          <Row label="Email" value={user.email} />
          <Row label="Phone" value={profile?.phone} />
          <Row label="PTIN" value={profile?.ptin} />
        </Card>
        <Card icon={MapPin} title="Mailing address">
          <Row label="Street" value={[profile?.address1, profile?.address2].filter(Boolean).join(", ")} />
          <Row label="City" value={profile?.city} />
          <Row label="State / Region" value={profile?.region} />
          <Row label="Country" value={profile?.country} />
          <Row label="ZIP" value={profile?.zip} />
        </Card>
        <Card icon={Building2} title="Company">
          <Row label="Company" value={profile?.company} />
        </Card>
      </div>
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[12.5px] font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-xl font-bold tabular-nums text-navy-950">{value}</p>
      </div>
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
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2.5 text-[15px] font-semibold text-navy-950">
          <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Icon className="size-4" aria-hidden />
          </span>
          {title}
        </h3>
        <Link
          href="/account/edit"
          aria-label={`Edit ${title.toLowerCase()}`}
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[12.5px] font-semibold text-brand-700 transition-colors duration-200 hover:bg-brand-50"
        >
          <Pencil className="size-3" aria-hidden />
          Edit
        </Link>
      </div>
      <dl className="mt-5 divide-y divide-slate-100">{children}</dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 py-2.5 text-[14px] first:pt-0 last:pb-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`[overflow-wrap:anywhere] ${value ? "font-medium text-navy-950" : "text-slate-400"}`}>
        {value || "Not added"}
      </dd>
    </div>
  );
}
