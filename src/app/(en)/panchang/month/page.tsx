import type { Metadata } from "next";
import Link from "next/link";
import { DateTime } from "luxon";
import { computeDailyPanchang } from "@/lib/astrology/panchang";
import { computePanchangExtras } from "@/lib/astrology/panchangExtras";
import { observancesForYear } from "@/lib/astrology/festivals";
import { panchangHref, parsePanchangParams } from "@/lib/panchangUrl";

export const metadata: Metadata = {
  title: "Monthly Panchang Calendar — Tithi, Nakshatra, Festivals and Special Yogas",
  description: "A month of the Hindu calendar at a glance: the tithi and nakshatra of every day, festivals and vrats, Ekadashi, Purnima and Amavasya, and days with Sarvartha Siddhi, Amrita Siddhi, Pushya and Pushkar yogas.",
  alternates: { canonical: "/panchang/month" },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function PanchangMonthPage({ searchParams }: PageProps<"/panchang/month">) {
  const params = await searchParams;
  const { date, location } = parsePanchangParams(params);
  const first = DateTime.fromISO(date, { zone: location.timezone }).startOf("month");
  const days = first.daysInMonth!;
  const today = DateTime.now().setZone(location.timezone).toISODate();
  const festivals = observancesForYear(first.year, location).filter((o) => o.date.startsWith(first.toFormat("yyyy-LL")));
  const monthHref = (d: DateTime) => {
    const q = new URLSearchParams({ date: d.toISODate()!, place: location.place, lat: location.latitude.toFixed(4), lon: location.longitude.toFixed(4), tz: location.timezone });
    return `/panchang/month?${q}`;
  };

  const cells = Array.from({ length: days }, (_, i) => {
    const d = first.plus({ days: i });
    const iso = d.toISODate()!;
    const p = computeDailyPanchang(iso, location.latitude, location.longitude, location.timezone);
    const x = computePanchangExtras(p, location.latitude, location.longitude);
    return {
      d,
      iso,
      tithi: p.tithi.name,
      nakshatra: p.nakshatra.name,
      yogas: [...new Set(x.specialYogas.map((y) => y.name.replace(" Yoga", "")))],
      cautions: [x.panchaka ? "Panchaka" : null, x.gandaMoola ? "Ganda Moola" : null, x.bhadra.some((b) => b.harmful) ? "Bhadra" : null].filter(Boolean) as string[],
      events: festivals.filter((f) => f.date === iso),
    };
  });
  const lead = first.weekday % 7;

  return (
    <section className="relative">
      <div className="relative mx-auto max-w-6xl px-5 py-14 md:py-20">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-gold-bright">Monthly Panchang</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-cream md:text-5xl">{first.toFormat("LLLL yyyy")}</h1>
            <p className="mt-2 text-sm text-muted">
              {location.place} · tithi and nakshatra at sunrise
            </p>
          </div>
          <nav aria-label="Change month" className="flex gap-2">
            <Link href={monthHref(first.minus({ months: 1 }))} className="rounded-full border border-border px-4 py-2 text-sm text-cream hover:border-gold">
              Previous
            </Link>
            <Link href={monthHref(first.plus({ months: 1 }))} className="rounded-full border border-border px-4 py-2 text-sm text-cream hover:border-gold">
              Next
            </Link>
          </nav>
        </header>

        <div className="mt-8 overflow-x-auto">
          <div className="grid min-w-[52rem] grid-cols-7 gap-1.5" role="grid" aria-label={`Panchang for ${first.toFormat("LLLL yyyy")}`}>
            {WEEKDAYS.map((w) => (
              <div key={w} role="columnheader" className="pb-1 text-center text-xs font-semibold text-muted">
                {w}
              </div>
            ))}
            {Array.from({ length: lead }, (_, i) => (
              <div key={`e${i}`} aria-hidden="true" />
            ))}
            {cells.map((c) => (
              <Link
                key={c.iso}
                role="gridcell"
                href={panchangHref(c.iso, location)}
                className={`card-edge flex min-h-32 flex-col gap-1 rounded-xl p-2.5 text-xs transition-colors hover:border-gold ${c.iso === today ? "ring-1 ring-gold" : ""}`}
              >
                <span className="flex items-baseline justify-between">
                  <span className="text-lg font-bold text-cream">{c.d.day}</span>
                  {c.iso === today && <span className="rounded-full bg-gold px-1.5 text-[10px] font-bold text-on-gold">Today</span>}
                </span>
                <span className="text-cream">{c.tithi}</span>
                <span className="text-muted">{c.nakshatra}</span>
                {c.events.map((e) => (
                  <span key={e.slug} className="font-semibold text-gold-bright">
                    {e.name}
                  </span>
                ))}
                {c.yogas.map((y) => (
                  <span key={y} className="text-gold-bright">
                    ✦ {y}
                  </span>
                ))}
                {c.cautions.map((y) => (
                  <span key={y} className="text-rose">
                    {y}
                  </span>
                ))}
              </Link>
            ))}
          </div>
        </div>
        <p className="mt-4 text-sm text-muted">
          <span className="text-gold-bright">✦</span> auspicious yoga · <span className="text-rose">rose</span> caution. Open any day for its full Panchang, muhurtas and timings.
        </p>
      </div>
    </section>
  );
}
