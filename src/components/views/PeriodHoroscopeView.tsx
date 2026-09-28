import Link from "next/link";
import { DateTime } from "luxon";
import { SIGNS, SIGN_GLYPHS, SIGN_SANSKRIT } from "@/lib/astrology/constants";
import { SIGN_SLUGS } from "@/lib/astrology/horoscope";
import { monthlyHoroscope, TIMEZONE, weeklyHoroscope, yearlyHoroscope, type Movement } from "@/lib/astrology/periodHoroscope";
import { ordinal } from "@/lib/astrology/predictions";

export type HoroscopePeriod = "weekly" | "monthly" | "yearly";
export const PERIODS: HoroscopePeriod[] = ["weekly", "monthly", "yearly"];

const PERIOD_LABEL: Record<HoroscopePeriod | "daily", string> = { daily: "Daily", weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" };

/** Daily / Weekly / Monthly / Yearly switcher for one sign. */
export function PeriodTabs({ slug, active }: { slug: string; active: HoroscopePeriod | "daily" }) {
  return (
    <nav aria-label="Horoscope period" className="mt-6 flex flex-wrap gap-2">
      {(["daily", ...PERIODS] as const).map((p) => (
        <Link
          key={p}
          href={p === "daily" ? `/horoscope/${slug}` : `/horoscope/${slug}/${p}`}
          aria-current={active === p ? "page" : undefined}
          className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
            active === p ? "border-gold bg-gold text-on-gold" : "border-border text-muted hover:border-gold hover:text-gold-bright"
          }`}
        >
          {PERIOD_LABEL[p]}
        </Link>
      ))}
    </nav>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-xl tracking-wider" role="img" aria-label={`${rating} out of 5`}>
      <span className="text-gold-bright">{"★".repeat(rating)}</span>
      <span className="text-border">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

const fmtDay = (iso: string) => DateTime.fromISO(iso).toFormat("ccc d LLL");
const fmtDate = (d: Date) => DateTime.fromJSDate(d, { zone: TIMEZONE }).toFormat("d LLL");

function Movements({ items, emptyText }: { items: Movement[]; emptyText: string }) {
  return items.length === 0 ? (
    <p className="text-sm text-muted">{emptyText}</p>
  ) : (
    <ul className="space-y-2 text-sm">
      {items.map((m) => (
        <li key={`${m.planet}-${m.date.toISOString()}`} className="grid gap-1 sm:grid-cols-[110px_1fr]">
          <span className="font-tabular text-gold-bright">{fmtDate(m.date)}</span>
          <span className="text-muted">
            <span className="font-semibold text-cream">
              {m.planet} enters {m.sign}.
            </span>{" "}
            {m.sentence}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Parses ?at= for the period (a date, YYYY-MM or YYYY), defaulting to now in India. */
export function resolvePeriodAnchor(period: HoroscopePeriod, at: string | undefined): DateTime {
  const now = DateTime.now().setZone(TIMEZONE);
  if (!at) return now;
  const parsed =
    period === "yearly" && /^\d{4}$/.test(at)
      ? DateTime.fromObject({ year: Number(at) }, { zone: TIMEZONE })
      : period === "monthly" && /^\d{4}-\d{2}$/.test(at)
        ? DateTime.fromISO(`${at}-01`, { zone: TIMEZONE })
        : period === "weekly" && /^\d{4}-\d{2}-\d{2}$/.test(at)
          ? DateTime.fromISO(at, { zone: TIMEZONE })
          : null;
  return parsed?.isValid && parsed.year >= 1950 && parsed.year <= 2100 ? parsed : now;
}

export default function PeriodHoroscopeView({ signIndex, period, anchor }: { signIndex: number; period: HoroscopePeriod; anchor: DateTime }) {
  const slug = SIGN_SLUGS[signIndex];
  const base = `/horoscope/${slug}/${period}`;
  const step = period === "weekly" ? { weeks: 1 } : period === "monthly" ? { months: 1 } : { years: 1 };
  const atFor = (d: DateTime) => (period === "weekly" ? d.toISODate() : period === "monthly" ? d.toFormat("yyyy-LL") : String(d.year));

  let title = "";
  let body: React.ReactNode = null;

  if (period === "weekly") {
    const w = weeklyHoroscope(signIndex, anchor.toISODate()!);
    title = `${fmtDay(w.weekStart)} – ${fmtDay(w.weekEnd)}`;
    body = (
      <>
        <Summary rating={w.rating} summary={w.summary} />
        <Card title="Day by day">
          <ul className="divide-y divide-border/50">
            {w.days.map((d) => (
              <li key={d.date} className="grid gap-1 py-2.5 text-sm sm:grid-cols-[120px_120px_1fr]">
                <span className="font-semibold text-cream">{fmtDay(d.date)}</span>
                <span className={d.tone === "Favourable" ? "text-gold-bright" : d.tone === "Challenging" ? "text-rose" : "text-muted"}>
                  {d.tone} · Moon {ordinal(d.moonHouse)}
                </span>
                <span className="text-muted">{d.note}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="The week's backdrop">
          <ul className="space-y-1.5 text-sm text-muted">
            {w.themes.map((t) => (
              <li key={t}>• {t}</li>
            ))}
          </ul>
        </Card>
        <Card title="Planets changing sign this week">
          <Movements items={w.movements} emptyText="No planet changes sign this week (apart from the Moon)." />
        </Card>
      </>
    );
  } else if (period === "monthly") {
    const m = monthlyHoroscope(signIndex, anchor.toFormat("yyyy-LL"));
    title = anchor.toFormat("LLLL yyyy");
    body = (
      <>
        <Summary rating={m.rating} summary={m.summary} />
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Good dates">
            <p className="text-sm leading-relaxed text-muted">{m.bestDates.map((d) => DateTime.fromISO(d).toFormat("d")).join(", ")}</p>
            <p className="mt-2 text-xs text-muted">Days when the Moon passes your 3rd, 6th, 10th or 11th house.</p>
          </Card>
          <Card title="Chandrashtama — go gently">
            <p className="text-sm leading-relaxed text-rose">
              {m.chandrashtama.map((c) => (c.from === c.to ? fmtDay(c.from) : `${fmtDay(c.from)} – ${fmtDay(c.to)}`)).join("; ") || "None this month"}
            </p>
            <p className="mt-2 text-xs text-muted">The Moon in your 8th house — avoid big decisions and new starts.</p>
          </Card>
        </div>
        <Card title="Where the planets are for you this month">
          <ul className="space-y-1.5 text-sm text-muted">
            {m.themes.map((t) => (
              <li key={t}>• {t}</li>
            ))}
          </ul>
        </Card>
        <Card title="Sign changes this month">
          <Movements items={m.movements} emptyText="No planet changes sign this month (apart from the Moon)." />
        </Card>
      </>
    );
  } else {
    const y = yearlyHoroscope(signIndex, anchor.year);
    title = String(anchor.year);
    body = (
      <>
        <Summary rating={y.rating} summary={y.summary} />
        <Card title="Jupiter, Saturn, Rahu and Ketu this year">
          <ul className="space-y-4">
            {y.slowPlanets.map((s) => (
              <li key={`${s.planet}-${s.from.toISOString()}`} className="text-sm">
                <p className="font-semibold text-cream">
                  {s.planet} in {s.sign} <span className="font-normal text-muted">(your {ordinal(s.house)} house)</span>{" "}
                  <span className={s.favourable ? "text-gold-bright" : "text-rose"}>· {s.favourable ? "favourable" : "testing"}</span>
                </p>
                <p className="text-xs text-muted">
                  {fmtDate(s.from)} – {fmtDate(s.to)}
                </p>
                <p className="mt-1 leading-relaxed text-muted">{s.text}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Month by month">
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {y.months.map((m) => (
              <li key={m.month} className={`rounded-xl border p-3 text-sm ${m.favourable ? "border-gold/40 bg-gold/5" : "border-border/70"}`}>
                <p className="font-semibold text-cream">{DateTime.fromISO(`${m.month}-01`).toFormat("LLLL")}</p>
                <p className="text-xs text-muted">
                  Sun in your {ordinal(m.sunHouse)} · {m.focus}
                </p>
                {m.favourable && <p className="mt-1 text-xs font-semibold text-gold-bright">A strong month</p>}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Retrograde periods">
          <ul className="space-y-1 text-sm text-muted">
            {y.retrogrades.map((r) => (
              <li key={`${r.planet}-${r.from.toISOString()}`}>
                <span className="font-semibold text-cream">{r.planet}</span> · {fmtDate(r.from)} – {fmtDate(r.to)}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">Retrograde periods favour review, repair and reconnection over fresh starts in that planet&rsquo;s areas.</p>
        </Card>
      </>
    );
  }

  return (
    <section className="relative">
      <div className="relative mx-auto max-w-4xl px-5 py-14 md:py-20">
        <Link href="/horoscope" className="text-xs font-semibold text-gold-bright hover:text-gold">
          ← All signs
        </Link>
        <header className="mt-6 flex flex-wrap items-center gap-5">
          <span className="flex h-20 w-20 items-center justify-center rounded-2xl border border-gold/40 bg-gold/10 text-5xl text-gold-bright" aria-hidden="true">
            {SIGN_GLYPHS[signIndex]}
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gold-bright">
              {PERIOD_LABEL[period]} horoscope · {title}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-cream md:text-5xl">
              {SIGNS[signIndex]} <span className="text-muted">({SIGN_SANSKRIT[signIndex]})</span>
            </h1>
          </div>
          <nav aria-label="Change period" className="flex gap-2">
            <Link href={`${base}?at=${atFor(anchor.minus(step))}`} className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-cream hover:border-gold hover:text-gold-bright">
              ← Previous
            </Link>
            <Link href={`${base}?at=${atFor(anchor.plus(step))}`} className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-cream hover:border-gold hover:text-gold-bright">
              Next →
            </Link>
          </nav>
        </header>
        <PeriodTabs slug={slug} active={period} />
        <div className="mt-8 space-y-6">{body}</div>
        <p className="mt-10 text-center text-xs text-muted">
          Read by Moon sign from the actual planetary transits, in India time. Your own chart decides how these transits
          land for you —{" "}
          <Link href="/kundali?tab=transits" className="text-gold-bright hover:text-gold">
            see your personal transits
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

function Summary({ rating, summary }: { rating: number; summary: string }) {
  return (
    <article className="card-edge rounded-3xl p-7">
      <Stars rating={rating} />
      <p className="mt-4 text-lg leading-relaxed text-cream">{summary}</p>
    </article>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card-edge rounded-2xl p-6">
      <h2 className="text-lg font-bold text-cream">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
