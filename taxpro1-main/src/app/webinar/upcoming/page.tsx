import type { Metadata } from "next";
import { getWebinars } from "@/lib/data/catalog";
import { WebinarCard } from "@/components/webinar-card";
import { PageBanner } from "@/components/ui";

export const metadata: Metadata = {
  title: "Upcoming Webinar",
  description:
    "Browse upcoming live CPE and CE webinars for accounting, tax, finance, and HR professionals.",
};

export default async function UpcomingWebinarsPage() {
  const webinars = await getWebinars("upcoming");

  return (
    <>
      <PageBanner
        title="Upcoming Webinar"
        crumb={[
          { href: "/", label: "Home" },
          { href: "/webinar/upcoming", label: "Upcoming Webinar" },
        ]}
      />

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="mb-10 text-[15px] text-ink-muted">
            Showing <strong className="text-navy-950">{webinars.length}</strong> live
            sessions
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {webinars.map((webinar, i) => (
              <WebinarCard key={webinar.slug} webinar={webinar} position={i} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
