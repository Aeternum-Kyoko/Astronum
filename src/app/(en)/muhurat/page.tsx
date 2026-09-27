import type { Metadata } from "next";
import Link from "next/link";
import { DateTime } from "luxon";
import MuhuratControls from "@/components/MuhuratControls";
import { ACTIVITIES, findMuhurats, isActivity } from "@/lib/astrology/muhurat";
import { FESTIVAL_LOCATION } from "@/lib/festivalPages";

export const metadata: Metadata = {
  title: "Shubh Muhurat Finder — Marriage, Griha Pravesh, Vehicle & Property",
  description:
    "Find auspicious days (shubh muhurat) for marriage, griha pravesh, buying a vehicle or property and starting a business, from classical panchang rules.",
};

export default async function MuhuratPage({ searchParams }: PageProps<"/muhurat">) {
  const q = await searchParams;
  const zone = FESTIVAL_LOCATION.timezone;
  const activity = isActivity(typeof q.activity === "string" ? q.activity : undefined) ? (q.activity as keyof typeof ACTIVITIES) : "griha-pravesh";
  const rawMonth = typeof q.month === "string" && /^\d{4}-\d{2}$/.test(q.month) ? q.month : null;
  const month = rawMonth && DateTime.fromISO(`${rawMonth}-01`).isValid ? rawMonth : DateTime.now().setZone(zone).toFormat("yyyy-LL");
  const result = findMuhurats(activity, month, FESTIVAL_LOCATION);
  const time = (d: Date) => DateTime.fromJSDate(d, { zone }).toFormat("h:mm a");
  const monthStart = DateTime.fromISO(`${month}-01`);
  const shift = (n: number) => `/muhurat?activity=${activity}&month=${monthStart.plus({ months: n }).toFormat("yyyy-LL")}`;

  return (
    <section className="mx-auto max-w-5xl px-5 py-14 md:py-20">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-sm font-semibold text-gold-bright">Shubh muhurat</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-cream md:text-5xl">
            {ACTIVITIES[activity].label} · {monthStart.toFormat("LLLL yyyy")}
          </h1>
          <p className="mt-2 text-sm text-muted">Timings for {FESTIVAL_LOCATION.place}.</p>
        </div>
        <nav aria-label="Month" className="flex gap-2">
          <Link href={shift(-1)} scroll={false} className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-cream hover:border-gold hover:text-gold-bright">
            ← {monthStart.minus({ months: 1 }).toFormat("LLL")}
          </Link>
          <Link href={shift(1)} scroll={false} className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-cream hover:border-gold hover:text-gold-bright">
            {monthStart.plus({ months: 1 }).toFormat("LLL")} →
          </Link>
        </nav>
      </header>

      <div className="mt-8">
        <MuhuratControls activity={activity} month={month} />
      </div>

      {result.days.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="font-semibold text-cream">No suitable days this month.</p>
          {result.blockedReason && <p className="mt-2 text-sm text-muted">Traditionally avoided: {result.blockedReason}.</p>}
          <Link href={shift(1)} className="mt-4 inline-block text-sm font-semibold text-gold-bright hover:text-gold">
            Try next month
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-3 md:grid-cols-2">
          {result.days.map((d) => {
            const date = DateTime.fromISO(d.date);
            return (
              <li key={d.date} className="card-edge flex gap-4 rounded-2xl p-5">
                <div className="w-14 shrink-0 text-center">
                  <p className="font-display text-3xl leading-none text-cream">{date.day}</p>
                  <p className="text-[11px] text-muted">{date.toFormat("ccc")}</p>
                </div>
                <div className="min-w-0 text-sm">
                  <p className="font-semibold text-cream">
                    {d.nakshatra} · {d.tithi}
                  </p>
                  {d.nakshatraEndsAt && <p className="text-xs text-muted">Nakshatra until {time(d.nakshatraEndsAt)}</p>}
                  <p className="mt-2 text-gold-bright">
                    Best time: {time(d.window.start)} – {time(d.window.end)} <span className="text-xs text-muted">({d.window.label})</span>
                  </p>
                  <p className="text-xs text-rose">Avoid Rahu Kaal {time(d.rahuKaal.start)} – {time(d.rahuKaal.end)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-10 text-xs leading-relaxed text-muted">
        Days are shortlisted by classical panchang checks: the nakshatra, weekday and tithi at sunrise, no Bhadra
        (Vishti karana), no Rikta tithi or Amavasya
        {ACTIVITIES[activity].seasonal ? ", and no Kharmas or Chaturmas" : ""}
        {ACTIVITIES[activity].benefics ? ", with Jupiter and Venus clear of the Sun" : ""}. Traditions vary, and for
        major events an astrologer also checks the lagna at the chosen time and the people involved.{" "}
        <Link href="/consultation" className="text-gold-bright hover:text-gold">
          Get a personal muhurat
        </Link>
        .
      </p>
    </section>
  );
}
