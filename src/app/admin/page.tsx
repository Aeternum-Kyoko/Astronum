import Link from "next/link";
import { prisma } from "@/lib/db";
import LogoutButton from "@/components/LogoutButton";

export default async function AdminDashboardPage() {
  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <section className="mx-auto max-w-4xl px-5 py-16">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-cream md:text-3xl">Blog Dashboard</h1>
        <LogoutButton />
      </div>

      <div className="mt-8 flex justify-end">
        <Link
          href="/admin/posts/new"
          className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink-deep hover:bg-gold-bright"
        >
          + New Post
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
        {posts.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">No posts yet. Create your first one.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs tracking-wide text-muted uppercase">
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-border/50 last:border-0">
                  <td className="px-5 py-3.5 font-medium text-cream">{post.title}</td>
                  <td className="px-5 py-3.5">
                    <span className={post.published ? "text-gold-bright" : "text-muted"}>
                      {post.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-muted">
                    {post.createdAt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/admin/posts/${post.id}`} className="text-gold-bright hover:text-gold">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
