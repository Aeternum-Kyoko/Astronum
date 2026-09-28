import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, SITE_NAME } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post || !post.published) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt?.toISOString(),
      ...(post.coverImage ? { images: [post.coverImage] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({ where: { slug } });

  if (!post || !post.published) notFound();

  return (
    <article className="mx-auto max-w-3xl px-5 py-16 md:py-20">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.excerpt,
          datePublished: post.publishedAt?.toISOString(),
          dateModified: post.updatedAt.toISOString(),
          mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
          publisher: { "@type": "Organization", name: SITE_NAME },
          ...(post.coverImage ? { image: post.coverImage } : {}),
        }}
      />
      <p className="text-center text-xs font-medium text-gold-bright">
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
