import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Newspaper } from "lucide-react";
import { getBlogPosts } from "@/lib/data/site-content";
import { Badge, PageBanner } from "@/components/ui";

export const metadata: Metadata = {
  title: "Blog",
  description: "News, guidance, and updates from the Taxpropath team.",
};

export default async function BlogIndexPage() {
  const posts = await getBlogPosts();

  return (
    <>
      <PageBanner
        title="Blog"
        crumb={[
          { href: "/", label: "Home" },
          { href: "/blog", label: "Blog" },
        ]}
      />

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Badge>
            <Newspaper className="size-3.5" aria-hidden />
            From the team
          </Badge>

          {posts.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center text-[15px] text-ink-muted">
              No articles published yet — check back soon.
            </p>
          ) : (
            <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-navy-950/5"
                >
                  {post.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.cover_image_url}
                      alt=""
                      className="h-48 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-cream">
                      <Newspaper className="size-10 text-brand-300" aria-hidden />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-6">
                    <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-muted">
                      <CalendarDays className="size-3.5" aria-hidden />
                      {new Date(post.published_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {post.author_name ? ` · ${post.author_name}` : ""}
                    </p>
                    <h2 className="mt-2 text-lg font-extrabold leading-snug text-navy-950 transition-colors duration-200 group-hover:text-brand-700">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="mt-2 flex-1 text-[14.5px] leading-relaxed text-ink-muted">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
