import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post) return {};
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });

  if (!post || !post.published) notFound();

  return (
    <article className="mx-auto max-w-3xl px-5 py-16 md:py-20">
      <p className="text-center text-xs font-medium tracking-wide text-gold-bright uppercase">
        {post.category}
      </p>
      <h1 className="mt-3 text-center font-display text-3xl text-cream md:text-4xl">{post.title}</h1>
      <p className="mt-3 text-center text-sm text-muted">
        {post.publishedAt?.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
      </p>

      {post.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverImage} alt="" className="mt-10 w-full rounded-2xl border border-border" />
      )}

      <div
        className="prose prose-invert mt-10 max-w-none prose-headings:font-display prose-a:text-gold-bright prose-strong:text-cream"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  );
}
