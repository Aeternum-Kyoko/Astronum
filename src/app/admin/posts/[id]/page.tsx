import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import BlogEditor from "@/components/BlogEditor";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <section className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="font-display text-2xl text-cream md:text-3xl">Edit Post</h1>
      <div className="mt-8">
        <BlogEditor initial={post} />
      </div>
    </section>
  );
}
