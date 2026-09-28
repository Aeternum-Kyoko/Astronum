import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DateTime } from "luxon";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { toBirthQuery } from "@/lib/birthParams";
import { AlertSettings, DeleteChartButton, ProfileControls, SignOutButton } from "@/components/AccountActions";

export const metadata: Metadata = { title: "My charts", robots: { index: false } };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/account");

  const charts = await prisma.savedChart.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] });
  const prefs = await prisma.user.findUnique({ where: { id: user.id }, select: { notifyDaily: true, notifyDasha: true, notifyTransits: true, notifyFestivals: true } });

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
        <div>
          <h2 className="text-xl font-bold text-cream">Family profiles</h2>
          <p className="mt-1 text-sm text-muted">Your default profile fills in every tool and drives your daily page and emails.</p>
        </div>
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
            <li key={c.id} className={`card-edge flex flex-col gap-3 rounded-2xl p-5 ${c.isDefault ? "ring-1 ring-gold/60" : ""}`}>
              <div className="min-w-0">
                <p className="truncate font-semibold text-cream">{c.name}</p>
                <p className="mt-1 truncate text-xs text-muted">
                  {DateTime.fromISO(c.date).toFormat("d LLL yyyy")} · {c.time} · {c.place}
                </p>
              </div>
              <ProfileControls id={c.id} relation={c.relation} isDefault={c.isDefault} />
              <div className="flex flex-wrap gap-2">
                <Link href={`/horoscope/personal?${toBirthQuery(c)}`} className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-cream hover:border-gold">
                  Today
                </Link>
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

      <section className="card-edge mt-10 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-cream">Email alerts</h2>
        <p className="mt-1 text-sm text-muted">Sent to {user.email}. Every email has a one-click unsubscribe link.</p>
        <div className="mt-4">
          <AlertSettings initial={prefs ?? { notifyDaily: false, notifyDasha: false, notifyTransits: false, notifyFestivals: false }} />
        </div>
      </section>

      <p className="mt-8 text-center text-sm">
        <Link href="/today" className="font-semibold text-gold-bright hover:underline">
          Go to Today for you
        </Link>
      </p>
    </section>
  );
}
