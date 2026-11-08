import Link from "next/link";
import { Award, ExternalLink, LifeBuoy } from "lucide-react";
import { PageBanner } from "@/components/ui";
import { PORTAL_URL } from "@/lib/portal";
import { displayName, getCustomer, getMyProfile } from "@/lib/account";
import { AccountNav } from "./account-nav";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCustomer();
  // Each page sends signed-out visitors to the login page with its own path
  // as ?next=, so they come back to the page they asked for.
  if (!user) return children;
  const profile = await getMyProfile(user.id);
  const name = displayName(user, profile);
  const initials =
    [profile?.first_name, profile?.last_name]
      .filter(Boolean)
      .map((s) => s!.trim()[0])
      .join("")
      .toUpperCase() || (user.email?.[0] ?? "?").toUpperCase();

  return (
    <>
      <PageBanner
        title="Account Dashboard"
        crumb={[
          { href: "/", label: "Home" },
          { href: "/account", label: "My Account" },
        ]}
      />

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8 lg:py-16">
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-slate-200 p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-[16px] font-extrabold text-white">
                  {initials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold text-navy-950">{name}</p>
                  <p className="truncate text-[13px] text-ink-muted">{user.email}</p>
                </div>
              </div>
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-[12px] font-bold text-brand-700">
                <span className="size-1.5 rounded-full bg-brand-600" aria-hidden />
                Active Member
              </span>
              <div className="mt-5 border-t border-slate-200 pt-4">
                <AccountNav />
              </div>
            </div>

            <div className="rounded-3xl bg-cream p-5">
              <Award className="size-6 text-brand-600" aria-hidden />
              <p className="mt-3 text-[15px] font-bold text-navy-950">Certificates</p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink-muted">
                Your courses and certificates are in your learning portal.
              </p>
              <a
                href={PORTAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-navy-950 px-4 py-2 text-[13px] font-bold text-white transition-colors duration-200 hover:bg-brand-600"
              >
                Open My Portal
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </div>

            <p className="flex items-center gap-2 px-1 text-[13.5px] text-ink-muted">
              <LifeBuoy className="size-4 shrink-0 text-brand-600" aria-hidden />
              <span>
                Need help with an order?{" "}
                <Link href="/contact" className="font-bold text-brand-700 hover:underline">
                  Contact our team
                </Link>
              </span>
            </p>
          </aside>

          <div className="min-w-0">{children}</div>
        </div>
      </section>
    </>
  );
}
