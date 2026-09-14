import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Blog",
  description: "Vedic astrology insights, forecasts, and remedies.",
};

// Reads live published posts — never prerender this at build time.
export const dynamic = "force-dynamic";

export default async function BlogIndexPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <section className="mx-auto max-w-5xl px-5 py-16 md:py-20">
      <div className="text-center">
        <p className="text-sm font-medium tracking-[0.2em] text-gold-bright uppercase">Writings</p>
        <h1 className="mt-3 font-display text-3xl text-cream md:text-4xl">The Blog</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Forecasts, remedies, festival notes, and reflections on Vedic astrology.
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="mt-16 text-center text-muted">No posts yet — check back soon.</p>
      ) : (
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="card-edge group rounded-2xl p-6 transition-transform hover:-translate-y-1"
            >
              <p className="text-xs font-medium tracking-wide text-gold-bright uppercase">{post.category}</p>
              <h2 className="mt-3 font-display text-xl text-cream group-hover:text-gold-bright">
                {post.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted line-clamp-3">{post.excerpt}</p>
              <p className="mt-4 text-xs text-muted">
                {post.publishedAt?.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
