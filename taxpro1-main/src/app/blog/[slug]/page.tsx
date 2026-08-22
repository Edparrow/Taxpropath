import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { getBlogPost } from "@/lib/data/site-content";
import { PageBanner } from "@/components/ui";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Blog" };

  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt || undefined,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  return (
    <>
      <PageBanner
        title={post.title}
        crumb={[
          { href: "/", label: "Home" },
          { href: "/blog", label: "Blog" },
          { href: `/blog/${post.slug}`, label: post.title },
        ]}
      />

      <section className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-muted">
            <CalendarDays className="size-3.5" aria-hidden />
            {new Date(post.published_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            {post.author_name ? ` · ${post.author_name}` : ""}
          </p>

          {post.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.cover_image_url}
              alt=""
              className="mt-6 w-full rounded-2xl object-cover"
            />
          )}

          {post.body && (
            <div className="mt-8 space-y-5">
              {post.body
                .split(/\n{2,}/)
                .filter(Boolean)
                .map((paragraph, i) => (
                  <p key={i} className="text-[16.5px] leading-[1.75] text-ink-muted">
                    {paragraph}
                  </p>
                ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
