import Link from "next/link";
import { prisma } from "@/lib/db";
import LogoutButton from "@/components/LogoutButton";
import { findPlan, formatInr } from "@/lib/consultationPlans";

// Session-gated (see src/proxy.ts) and reads live data — never prerender this at build time.
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [posts, consultations] = await Promise.all([
    prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.consultationRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  return (
    <section className="mx-auto max-w-4xl px-5 py-16">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-cream md:text-3xl">Dashboard</h1>
        <LogoutButton />
      </div>

      <div className="mt-8 flex justify-end">
        <Link
          href="/admin/posts/new"
          className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-on-gold hover:bg-gold-bright"
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
              <tr className="border-b border-border text-left text-xs text-muted">
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

      <h2 className="mt-14 font-display text-xl text-cream md:text-2xl">Consultation requests</h2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-surface">
        {consultations.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">No consultation requests yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Birth details</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Received</th>
              </tr>
            </thead>
            <tbody>
              {consultations.map((c) => (
                <tr key={c.id} className="border-b border-border/50 align-top last:border-0">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-cream">{c.name}</p>
                    <p className="text-xs text-muted">{c.email}</p>
                    {c.phone && <p className="text-xs text-muted">{c.phone}</p>}
                    {c.message && <p className="mt-1 max-w-xs text-xs text-muted">&ldquo;{c.message}&rdquo;</p>}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted">
                    {c.birthDate.toISOString().slice(0, 10)} {c.birthTime}
                    <br />
                    {c.birthPlace}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted">{findPlan(c.planId)?.name ?? "—"}</td>
                  <td className="px-5 py-3.5 text-xs">
                    {c.paymentStatus === "paid" ? (
                      <span className="text-gold-bright">Paid {c.amountPaise ? formatInr(c.amountPaise) : ""}</span>
                    ) : c.paymentStatus === "unpaid" ? (
                      <span className="text-rose">Unpaid</span>
                    ) : (
                      <span className="text-muted">Free request</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted">
                    {c.createdAt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
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
