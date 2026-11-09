import Link from "next/link";
import { Award, ExternalLink, LifeBuoy } from "lucide-react";
import { PORTAL_URL } from "@/lib/portal";
import { PageBanner } from "@/components/ui";
import { displayName, getCustomer, getMyProfile, profileInitials } from "@/lib/account";
import { UserAvatar } from "@/components/user-avatar";
import { AccountNav } from "./account-nav";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCustomer();
  // Each page sends signed-out visitors to the login page with its own path
  // as ?next=, so they come back to the page they asked for.
  if (!user) return children;
  const profile = await getMyProfile(user.id);
  const name = displayName(user, profile);
  const initials = profileInitials(user, profile);

  return (
    <>
      <PageBanner
        title="My"
        accent="Account"
        crumb={[
          { href: "/", label: "Home" },
          { href: "/account", label: "My Account" },
        ]}
      />

      <section className="min-h-[70vh] bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[272px_1fr] lg:px-8">
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={profile?.avatar_url}
                  initials={initials}
                  className="size-12 text-[16px]"
                />
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-navy-950">{name}</p>
                  <p className="truncate text-[13px] text-ink-muted">{user.email}</p>
                </div>
              </div>
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-[12px] font-semibold text-brand-700">
                <span className="size-1.5 rounded-full bg-brand-600" aria-hidden />
                Active Member
              </span>
              <div className="mt-5 border-t border-slate-200 pt-4">
                <AccountNav />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
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

            <p className="flex items-center gap-2 px-1 text-left text-[13.5px] text-ink-muted">
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
