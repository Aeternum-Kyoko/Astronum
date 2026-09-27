import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DateTime } from "luxon";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { toBirthQuery } from "@/lib/birthParams";
import { DeleteChartButton, SignOutButton } from "@/components/AccountActions";

export const metadata: Metadata = { title: "My charts", robots: { index: false } };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const charts = await prisma.savedChart.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });

  return (
    <section className="mx-auto max-w-4xl px-5 py-14 md:py-20">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gold-bright">My account</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-cream md:text-4xl">Namaste, {user.name.split(" ")[0]}</h1>
          <p className="mt-2 text-sm text-muted">{user.email}</p>
        </div>
        <SignOutButton />
      </header>

      <div className="mt-10 flex items-end justify-between gap-4">
        <h2 className="text-xl font-bold text-cream">Saved charts</h2>
        <Link href="/kundali" className="text-sm font-semibold text-gold-bright hover:text-gold">
          + New kundli
        </Link>
      </div>

      {charts.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted">
            No saved charts yet. Generate a kundli and press <span className="text-cream">Save chart</span> to keep it
            here.
          </p>
          <Link
            href="/kundali"
            className="mt-5 inline-block rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-on-gold hover:bg-gold-bright"
          >
            Generate a kundli
          </Link>
        </div>
      ) : (
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {charts.map((c) => (
            <li key={c.id} className="card-edge flex items-center justify-between gap-4 rounded-2xl p-5">
              <div className="min-w-0">
                <p className="truncate font-semibold text-cream">{c.name}</p>
                <p className="mt-1 truncate text-xs text-muted">
                  {DateTime.fromISO(c.date).toFormat("d LLL yyyy")} · {c.time} · {c.place}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  href={`/kundali?${toBirthQuery(c)}`}
                  className="rounded-full bg-gold px-4 py-1.5 text-xs font-semibold text-on-gold hover:bg-gold-bright"
                >
                  Open
                </Link>
                <DeleteChartButton id={c.id} name={c.name} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
