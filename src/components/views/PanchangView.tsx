import Link from "next/link";
import { DateTime } from "luxon";
import PanchangControls from "@/components/PanchangControls";
import { computeDailyPanchang, type ChoghadiyaSlot, type DailyPanchang, type HoraSlot, type PanchangLimb, type TimeSpan } from "@/lib/astrology/panchang";
import { NAKSHATRAS, SIGNS } from "@/lib/astrology/constants";
import { TARAS, CHANDRABALA_GOOD } from "@/lib/astrology/personalDaily";
import { panchangHref, parsePanchangParams } from "@/lib/panchangUrl";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";
import { term } from "@/lib/i18n/terms";

type RawParams = Record<string, string | string[] | undefined>;

export default function PanchangView({ locale, params }: { locale: Locale; params: RawParams }) {
  const t = getDictionary(locale).panchang;
  const basePath = locale === "hi" ? "/hi/panchang" : "/panchang";
  const { date, location } = parsePanchangParams(params);
  const day = DateTime.fromISO(date, { zone: location.timezone }).setLocale(locale);
  const today = DateTime.now().setZone(location.timezone).toISODate()!;

  let panchang: DailyPanchang | null = null;
  let error: string | null = null;
  try {
    panchang = computeDailyPanchang(date, location.latitude, location.longitude, location.timezone);
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not calculate the Panchang for this place and date.";
  }

  const fmt = (d: Date | null) => formatTime(d, location.timezone, date, locale);
  const dayLink = (offset: number) => panchangHref(day.plus({ days: offset }).toISODate()!, location, basePath);

  return (
    <section className="relative">
      <div className="relative mx-auto max-w-6xl px-5 py-14 md:py-20">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-gold-bright">{date === today ? t.today : t.panchang}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-cream md:text-5xl">{day.toFormat("cccc, d LLLL yyyy")}</h1>
            <p className="mt-2 text-sm text-muted">
              {location.place} · {location.timezone}
            </p>
          </div>
          <nav aria-label="Change day" className="flex gap-2">
            <DayLink href={dayLink(-1)}>{t.previous}</DayLink>
            {date !== today && <DayLink href={panchangHref(today, location, basePath)}>{t.todayButton}</DayLink>}
            <DayLink href={dayLink(1)}>{t.next}</DayLink>
          </nav>
        </header>

        <div className="mt-8">
          <PanchangControls date={date} location={location} basePath={basePath} labels={{ date: t.date, city: t.city }} />
        </div>

        {error || !panchang ? (
          <p role="alert" className="mt-8 rounded-xl border border-rose/30 bg-rose/5 px-5 py-4 text-sm text-rose">
            {error}
          </p>
        ) : (
          <PanchangBody p={panchang} fmt={fmt} isToday={date === today} t={t} locale={locale} />
        )}
      </div>
    </section>
  );
}

function PanchangBody({
  p,
  fmt,
  isToday,
  t,
  locale,
}: {
  p: DailyPanchang;
  fmt: (d: Date | null) => string;
  isToday: boolean;
  t: Dictionary["panchang"];
  locale: Locale;
}) {
  const now = new Date();
  const span = (s: TimeSpan) => `${fmt(s.start)} – ${fmt(s.end)}`;
  const limb = (l: PanchangLimb, detail?: string) => ({
    name: term(locale, l.name),
    note: [detail, l.endsAt ? t.upto(fmt(l.endsAt), term(locale, l.next)) : t.allDay].filter(Boolean).join(" · "),
  });
  const nakLord = p.nakshatra.detail?.replace("Lord ", "") ?? "";

  return (
    <div className="mt-8 space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={t.sunrise} value={fmt(p.sunrise)} />
        <Stat label={t.sunset} value={fmt(p.sunset)} />
        <Stat label={t.moonrise} value={fmt(p.moonrise)} />
        <Stat label={t.moonset} value={fmt(p.moonset)} />
      </div>

      <section className="card-edge rounded-2xl p-6">
        <h2 className="text-lg font-bold text-cream">{t.atSunrise}</h2>
        <p className="mt-1 text-xs text-muted">{t.atSunriseNote}</p>
        <dl className="mt-4 grid gap-x-8 md:grid-cols-2">
          <Row label={t.vara} value={locale === "hi" ? term(locale, p.vara.name) : `${p.vara.sanskrit} · ${p.vara.name}`} />
          <Row label={t.tithi} {...limb(p.tithi)} />
          <Row label={t.nakshatra} {...limb(p.nakshatra, t.lord(term(locale, nakLord)))} />
          <Row label={t.yoga} {...limb(p.yoga)} />
          <Row label={t.karana} {...limb(p.karana)} />
          <Row label={t.moonSign} {...limb(p.moonSign)} />
          <Row label={t.sunSign} value={term(locale, p.sunSign)} />
          <Row label={t.paksha} value={t.pakshaValue(p.tithi.paksha)} />
        </dl>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card-edge rounded-2xl p-6">
          <h2 className="text-lg font-bold text-gold-bright">{t.auspicious}</h2>
          <dl className="mt-3 text-sm">
            <TimingRow label={t.abhijit} value={span(p.abhijit)} />
          </dl>
          {p.vara.name === "Wednesday" && <p className="mt-3 text-xs text-muted">{t.noAbhijitWednesday}</p>}
        </section>
        <section className="card-edge rounded-2xl p-6">
          <h2 className="text-lg font-bold text-rose">{t.inauspicious}</h2>
          <dl className="mt-3 divide-y divide-border/50 text-sm">
            <TimingRow label={t.rahuKaal} value={span(p.rahuKaal)} />
            <TimingRow label={t.yamaganda} value={span(p.yamaganda)} />
            <TimingRow label={t.gulika} value={span(p.gulikaKaal)} />
          </dl>
        </section>
      </div>

      <section className="card-edge rounded-2xl p-6">
        <h2 className="text-lg font-bold text-cream">{t.choghadiya}</h2>
        <p className="mt-1 text-xs text-muted">{t.choghadiyaNote}</p>
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <ChoghadiyaList title={t.day} slots={p.choghadiya.day} zone={p.timezone} now={isToday ? now : null} locale={locale} nowLabel={t.now} />
          <ChoghadiyaList
            title={t.night(DateTime.fromJSDate(p.nextSunrise, { zone: p.timezone }).setLocale(locale).toFormat("d LLL"))}
            slots={p.choghadiya.night}
            zone={p.timezone}
            now={isToday ? now : null}
            locale={locale}
            nowLabel={t.now}
          />
        </div>
      </section>

      <section className="card-edge rounded-2xl p-6">
        <h2 className="text-lg font-bold text-cream">{t.hora}</h2>
        <p className="mt-1 text-xs text-muted">{t.horaNote}</p>
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <HoraList title={t.day} slots={p.hora.day} zone={p.timezone} now={isToday ? now : null} locale={locale} nowLabel={t.now} uses={t.horaUse} />
          <HoraList
            title={t.night(DateTime.fromJSDate(p.nextSunrise, { zone: p.timezone }).setLocale(locale).toFormat("d LLL"))}
            slots={p.hora.night}
            zone={p.timezone}
            now={isToday ? now : null}
            locale={locale}
            nowLabel={t.now}
            uses={t.horaUse}
          />
        </div>
      </section>

      <StrengthToday p={p} t={t} locale={locale} />

      <p className="text-center text-xs text-muted">
        {t.footer}{" "}
        <Link href="/kundali" className="text-gold-bright hover:text-gold">
          {t.generate}
        </Link>
        .
      </p>
    </div>
  );
}

function formatTime(d: Date | null, zone: string, pageDate: string, locale: Locale): string {
  if (!d) return "—";
  const t = DateTime.fromJSDate(d, { zone }).setLocale(locale);
  // Times that spill past midnight get their date, so "upto 2:10 AM" isn't ambiguous.
  return t.toISODate() === pageDate ? t.toFormat("h:mm a") : t.toFormat("h:mm a, d LLL");
}

function DayLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-cream transition-colors hover:border-gold hover:text-gold-bright"
    >
      {children}
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-edge rounded-2xl p-4">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-1.5 font-tabular text-lg font-semibold text-cream">{value}</p>
    </div>
  );
}

function Row({ label, name, note, value }: { label: string; name?: string; note?: string; value?: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/50 py-3">
      <dt className="shrink-0 text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm">
        <span className="font-semibold text-cream">{name ?? value}</span>
        {note && <span className="block text-xs text-muted">{note}</span>}
      </dd>
    </div>
  );
}

function TimingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-tabular font-medium text-cream">{value}</dd>
    </div>
  );
}

const QUALITY_CLASS: Record<ChoghadiyaSlot["quality"], string> = {
  Good: "text-gold-bright",
  Neutral: "text-cream",
  Inauspicious: "text-rose",
};

function ChoghadiyaList({
  title,
  slots,
  zone,
  now,
  locale,
  nowLabel,
}: {
  title: string;
  slots: ChoghadiyaSlot[];
  zone: string;
  now: Date | null;
  locale: Locale;
  nowLabel: string;
}) {
  // Slots run back to back, so plain clock times read clearly; the heading carries the date.
  const t = (d: Date) => DateTime.fromJSDate(d, { zone }).setLocale(locale).toFormat("h:mm a");
  return (
    <div>
      <h3 className="text-xs font-semibold text-muted">{title}</h3>
      <ol className="mt-2 divide-y divide-border/50">
        {slots.map((s) => {
          const current = now !== null && now >= s.start && now < s.end;
          return (
            <li
              key={s.start.toISOString()}
              aria-current={current ? "time" : undefined}
              className={`flex items-center justify-between gap-3 px-2 py-2 text-sm ${current ? "rounded-lg bg-gold/10" : ""}`}
            >
              <span className={`font-semibold ${QUALITY_CLASS[s.quality]}`}>
                {term(locale, s.name)}
                {current && <span className="ml-2 text-[10px] font-semibold text-muted">{nowLabel}</span>}
              </span>
              <span className="font-tabular text-muted">
                {t(s.start)} – {t(s.end)}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function HoraList({
  title,
  slots,
  zone,
  now,
  locale,
  nowLabel,
  uses,
}: {
  title: string;
  slots: HoraSlot[];
  zone: string;
  now: Date | null;
  locale: Locale;
  nowLabel: string;
  uses: Record<string, string>;
}) {
  const t = (d: Date) => DateTime.fromJSDate(d, { zone }).setLocale(locale).toFormat("h:mm a");
  return (
    <div>
      <h3 className="text-xs font-semibold text-muted">{title}</h3>
      <ol className="mt-2 divide-y divide-border/50">
        {slots.map((s) => {
          const current = now !== null && now >= s.start && now < s.end;
          return (
            <li key={s.start.toISOString()} aria-current={current ? "time" : undefined} className={`px-2 py-2 text-sm ${current ? "rounded-lg bg-gold/10" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <span className={`font-semibold ${s.lord === "Jupiter" || s.lord === "Venus" ? "text-gold-bright" : s.lord === "Saturn" || s.lord === "Mars" ? "text-rose" : "text-cream"}`}>
                  {term(locale, s.lord)}
                  {current && <span className="ml-2 text-[10px] font-semibold text-muted">{nowLabel}</span>}
                </span>
                <span className="font-tabular text-muted">
                  {t(s.start)} – {t(s.end)}
                </span>
              </div>
              <p className="text-xs text-muted">{uses[s.lord]}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Which birth stars and Moon signs the day's Moon favours — the classical Tarabalam and Chandrabalam tables printed in almanacs. */
function StrengthToday({ p, t, locale }: { p: DailyPanchang; t: Dictionary["panchang"]; locale: Locale }) {
  const today = NAKSHATRAS.indexOf(p.nakshatra.name as (typeof NAKSHATRAS)[number]);
  const moonSign = SIGNS.indexOf(p.moonSign.name as (typeof SIGNS)[number]);
  if (today < 0 || moonSign < 0) return null;
  const goodStars = NAKSHATRAS.filter((_, b) => TARAS[(((today - b + 27) % 27) + 1 - 1) % 9].good);
  const goodSigns = SIGNS.filter((_, m) => CHANDRABALA_GOOD.includes(((moonSign - m + 12) % 12) + 1));
  return (
    <section className="card-edge rounded-2xl p-6">
      <h2 className="text-lg font-bold text-cream">{t.strengthTitle}</h2>
      <p className="mt-3 text-sm text-muted">{t.tarabalamNote(term(locale, p.nakshatra.name))}</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {goodStars.map((n) => (
          <li key={n} className="rounded-full border border-gold/30 bg-gold/5 px-2.5 py-1 text-xs text-cream">
            {term(locale, n)}
          </li>
        ))}
      </ul>
      <p className="mt-5 text-sm text-muted">{t.chandrabalamNote(term(locale, p.moonSign.name))}</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {goodSigns.map((sg) => (
          <li key={sg} className="rounded-full border border-gold/30 bg-gold/5 px-2.5 py-1 text-xs text-cream">
            {term(locale, sg)}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">
        <Link href="/horoscope/personal" className="font-semibold text-gold-bright hover:underline">
          {t.personalLink}
        </Link>
      </p>
    </section>
  );
}
