import type { Metadata } from "next";
import { Images } from "lucide-react";
import { getGalleryImages } from "@/lib/data/site-content";
import { Badge, PageBanner } from "@/components/ui";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos from Taxpropath webinars and events.",
};

export default async function GalleryPage() {
  const images = await getGalleryImages();

  return (
    <>
      <PageBanner
        title="Gallery"
        crumb={[
          { href: "/", label: "Home" },
          { href: "/gallery", label: "Gallery" },
        ]}
      />

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Badge>
            <Images className="size-3.5" aria-hidden />
            Moments
          </Badge>

          {images.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center text-[15px] text-ink-muted">
              No photos yet — check back soon.
            </p>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((image) => (
                <figure
                  key={image.id}
                  className="overflow-hidden rounded-2xl border border-slate-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.image_url}
                    alt={image.title ?? ""}
                    className="aspect-[4/3] w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  {image.title && (
                    <figcaption className="px-4 py-3 text-[13.5px] font-medium text-ink-muted">
                      {image.title}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
