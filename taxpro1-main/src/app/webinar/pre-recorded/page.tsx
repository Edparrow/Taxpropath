import type { Metadata } from "next";
import { getWebinars } from "@/lib/data/catalog";
import { WebinarCard } from "@/components/webinar-card";
import { PageBanner } from "@/components/ui";

export const metadata: Metadata = {
  title: "Pre Recorded Webinar",
  description:
    "Watch pre-recorded CPE and CE webinars on demand, at your own pace, anytime.",
};

export default async function PreRecordedWebinarsPage() {
  const webinars = await getWebinars("pre_recorded");

  return (
    <>
      <PageBanner
        title="Pre Recorded Webinar"
        crumb={[
          { href: "/", label: "Home" },
          { href: "/webinar/pre-recorded", label: "Pre Recorded Webinar" },
        ]}
      />

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="mb-10 text-[15px] text-ink-muted">
            Showing <strong className="text-navy-950">{webinars.length}</strong>{" "}
            on-demand sessions
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
