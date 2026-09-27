import Link from "next/link";
import { DateTime } from "luxon";
import { SIGNS, SIGN_GLYPHS } from "@/lib/astrology/constants";
import { computeDailyTransits, horoscopeForSign, resolveHoroscopeDay, SIGN_SLUGS } from "@/lib/astrology/horoscope";
import { BySignToggle, DayTabs, horoscopeHref, Stars, ToneBadge, type DayKey, type HoroscopeBy } from "@/components/HoroscopeParts";
import KundliChart from "@/components/KundliChart";
import { GOCHARA_GOOD } from "@/lib/astrology/transits";
import { getDignity } from "@/lib/astrology/dignity";
import { transitMarkers } from "@/lib/astrology/chartMarkers";
import type { DailyTransits, SignHoroscope } from "@/lib/astrology/horoscope";
import { getDictionary, ordinalFor } from "@/lib/i18n/dictionary";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { term } from "@/lib/i18n/terms";
import { PeriodTabs } from "@/components/views/PeriodHoroscopeView";

const TIMEZONE = "Asia/Kolkata";

function resolveDay(day: string | string[] | undefined) {
  const { date, label } = resolveHoroscopeDay(typeof day === "string" ? day : undefined, TIMEZONE);
  return { date, dayKey: (label?.toLowerCase() ?? null) as DayKey | null };
}

export const parseBy = (by: string | string[] | undefined): HoroscopeBy => (by === "sun" ? "sun" : "moon");

export function HoroscopeIndexView({ locale, day, by = "moon" }: { locale: Locale; day: string | string[] | undefined; by?: HoroscopeBy }) {
  const t = getDictionary(locale).horoscope;
  const { date, dayKey } = resolveDay(day);
  const transits = computeDailyTransits(date, TIMEZONE);
  const readings = SIGNS.map((_, i) => horoscopeForSign(i, transits, locale));
  const dayLabel = dayKey ? t[dayKey] : null;
  const lx = (path: string) => localizeHref(locale, path);

  return (
    <section className="relative">
      <div className="relative mx-auto max-w-6xl px-5 py-14 md:py-20">
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold text-gold-bright">{t.eyebrow}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-cream md:text-5xl">
              {dayLabel ? `${dayLabel} · ` : ""}
              {DateTime.fromISO(date).setLocale(locale).toFormat("d LLLL yyyy")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              {t.moonIs(term(locale, SIGNS[transits.moonSignIndex]), term(locale, transits.moonNakshatra))}
              {transits.moonChange &&
                t.movingInto(
                  term(locale, SIGNS[transits.moonChange.signIndex]),
                  DateTime.fromJSDate(transits.moonChange.at, { zone: TIMEZONE }).setLocale(locale).toFormat("h:mm a")
                )}
              .
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t.byNote(by)}</p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <BySignToggle path={lx("/horoscope")} day={dayKey} active={by} labels={{ moon: t.byMoon, sun: t.bySun }} />
            <DayTabs basePath={lx("/horoscope")} active={dayKey} by={by} labels={{ yesterday: t.yesterday, today: t.today, tomorrow: t.tomorrow }} />
          </div>
        </header>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {readings.map((h, i) => (
            <li key={h.slug}>
              <Link
                href={horoscopeHref(lx(`/horoscope/${h.slug}`), dayKey, by)}
                className="card-edge group flex h-full flex-col rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-2xl text-gold-bright" aria-hidden="true">
                    {SIGN_GLYPHS[i]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-cream group-hover:text-gold-bright">{term(locale, h.sign)}</p>
                    <p className="flex items-center gap-2 text-xs text-muted">
                      {locale === "hi" ? h.sign : h.sanskrit}
                      <Stars rating={h.rating} size="text-xs" label={t.stars(h.rating)} />
                    </p>
                  </div>
                  <ToneBadge tone={h.tone} label={term(locale, h.tone)} />
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted">{h.headline}</p>
                <span className="mt-auto pt-4 text-xs font-semibold text-gold-bright">{t.readFull}</span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-center text-sm text-muted">
          {t.dontKnow}{" "}
          <Link href="/kundali" className="font-semibold text-gold-bright hover:text-gold">
            {t.generate}
          </Link>{" "}
          {t.listedAs}
        </p>
      </div>
    </section>
  );
}

export function HoroscopeSignView({ locale, signIndex, day, by = "moon" }: { locale: Locale; signIndex: number; day: string | string[] | undefined; by?: HoroscopeBy }) {
  const t = getDictionary(locale).horoscope;
  const { date, dayKey } = resolveDay(day);
  const transits = computeDailyTransits(date, TIMEZONE);
  const h = horoscopeForSign(signIndex, transits, locale);
  const time = (d: Date) => DateTime.fromJSDate(d, { zone: TIMEZONE }).setLocale(locale).toFormat("h:mm a");
  const lx = (path: string) => localizeHref(locale, path);
  const signName = term(locale, h.sign);
  const saturnClass = h.saturn.kind === "favourable" ? "text-gold-bright" : h.saturn.kind === "neutral" ? "text-cream" : "text-rose";

  return (
    <section className="relative">
      <div className="relative mx-auto max-w-4xl px-5 py-14 md:py-20">
        <Link href={lx("/horoscope")} className="text-xs font-semibold text-gold-bright hover:text-gold">
          {t.allSigns}
        </Link>

        <header className="mt-6 flex flex-wrap items-center gap-5">
          <span className="flex h-20 w-20 items-center justify-center rounded-2xl border border-gold/40 bg-gold/10 text-5xl text-gold-bright" aria-hidden="true">
            {SIGN_GLYPHS[signIndex]}
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gold-bright">
              {dayKey ? `${t[dayKey]} · ` : ""}
              {DateTime.fromISO(date).setLocale(locale).toFormat("cccc, d LLLL yyyy")}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-cream md:text-5xl">
              {signName} <span className="text-muted">({locale === "hi" ? h.sign : h.sanskrit})</span>
            </h1>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <BySignToggle path={lx(`/horoscope/${h.slug}`)} day={dayKey} active={by} labels={{ moon: t.byMoon, sun: t.bySun }} />
            <DayTabs basePath={lx(`/horoscope/${h.slug}`)} active={dayKey} by={by} labels={{ yesterday: t.yesterday, today: t.today, tomorrow: t.tomorrow }} />
          </div>
        </header>
        <p className="mt-4 text-sm text-muted">{t.byNote(by)}</p>
        {/* Weekly, monthly and yearly readings are English-only for now. */}
        {locale === "en" && <PeriodTabs slug={h.slug} active="daily" />}

        <article className="card-edge mt-8 rounded-3xl p-7 md:p-9">
          <div className="flex flex-wrap items-center gap-3">
            <Stars rating={h.rating} size="text-xl" label={t.stars(h.rating)} />
            <ToneBadge tone={h.tone} label={term(locale, h.tone)} />
            <span className="text-xs text-muted">{t.moonInHouse(ordinalFor(locale, h.moonHouse))}</span>
          </div>
          <h2 className="mt-5 text-xl leading-snug font-bold text-cream md:text-2xl">{h.headline}</h2>
          <p className="mt-4 text-base leading-relaxed text-muted">{h.reading}</p>
          {h.laterInDay && (
            <p className="mt-5 rounded-xl border border-gold/30 bg-gold/5 px-5 py-4 text-sm text-cream">
              <span className="font-semibold text-gold-bright">{t.fromTime(time(h.laterInDay.at))}</span>{" "}
              {t.moonMoves(ordinalFor(locale, h.laterInDay.house))} {h.laterInDay.headline}
            </p>
          )}
          <p className="mt-6 text-sm">
            <span className="font-semibold text-cream">{t.focus}</span> <span className="text-muted">{h.focus}</span>
          </p>
        </article>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <section className="card-edge rounded-2xl p-6">
            <p className="text-xs font-semibold text-muted">{t.thisYear}</p>
            <p className={`mt-2 text-sm font-semibold ${h.jupiter.favourable ? "text-gold-bright" : "text-cream"}`}>
              {t.house(ordinalFor(locale, h.jupiter.house, "direct"))} · {h.jupiter.favourable ? t.supportive : t.asksCare}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{h.jupiter.text}</p>
          </section>
          <section className="card-edge rounded-2xl p-6">
            <p className="text-xs font-semibold text-muted">{t.thisPeriod}</p>
            <p className={`mt-2 text-sm font-semibold ${saturnClass}`}>
              {t.house(ordinalFor(locale, h.saturn.house, "direct"))} · {h.saturn.status}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{h.saturn.text}</p>
          </section>
        </div>

        <WhyThisReading locale={locale} signIndex={signIndex} transits={transits} h={h} />

        <section className="mt-6 rounded-2xl border border-gold/30 bg-gold/5 p-6 text-center">
          <p className="text-sm leading-relaxed text-muted">{t.sharedNote(signName)}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link href="/horoscope/personal" className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-on-gold hover:bg-gold-bright">
              {t.personalCta}
            </Link>
            <Link href="/kundali" className="rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-cream hover:border-gold hover:text-gold-bright">
              {t.generateKundli}
            </Link>
            <Link href="/consultation" className="rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-cream hover:border-gold hover:text-gold-bright">
              {t.bookReading}
            </Link>
          </div>
        </section>

        <nav aria-label={t.otherSigns} className="mt-10">
          <p className="text-xs font-semibold text-muted">{t.otherSigns}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {SIGNS.map((s, j) =>
              j === signIndex ? null : (
                <li key={s}>
                  <Link
                    href={horoscopeHref(lx(`/horoscope/${SIGN_SLUGS[j]}`), dayKey, by)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted hover:border-gold hover:text-gold-bright"
                  >
                    <span aria-hidden="true">{SIGN_GLYPHS[j]}</span> {term(locale, s)}
                  </Link>
                </li>
              )
            )}
          </ul>
        </nav>
      </div>
    </section>
  );
}

const houseFrom = (signIndex: number, from: number) => ((signIndex - from + 12) % 12) + 1;

/** Today's rashi chart drawn from the reader's sign, the house-by-house gochara table behind the reading, and the star-rating arithmetic. */
function WhyThisReading({ locale, signIndex, transits, h }: { locale: Locale; signIndex: number; transits: DailyTransits; h: SignHoroscope }) {
  const t = getDictionary(locale).horoscope;
  const signName = term(locale, h.sign);
  const rows = transits.positions.map((p) => {
    const house = houseFrom(p.signIndex, signIndex);
    return { ...p, house, good: GOCHARA_GOOD[p.planet].includes(house), dignity: getDignity(p.planet, p.signIndex) };
  });
  const marks = transitMarkers(transits.positions);
  const points = rows.map((r) => ({
    planet: r.planet,
    house: r.house,
    signIndex: r.signIndex,
    retrograde: r.retrograde,
    markers: marks[r.planet],
    dignity: r.dignity,
  }));
  const rp = h.ratingParts;
  const ord = (n: number) => ordinalFor(locale, n);

  return (
    <div className="mt-6 space-y-4">
      <section className="card-edge rounded-2xl p-6">
        <h2 className="text-lg font-bold text-gold-bright">{t.chartTitle}</h2>
        <p className="mt-1 mb-5 text-sm text-muted">{t.chartNote(signName)}</p>
        <div className="mx-auto max-w-md">
          <KundliChart ascendantSignIndex={signIndex} planets={points} toggleId="daily-rashi-style" />
        </div>
      </section>

      <section className="card-edge rounded-2xl p-6">
        <h2 className="text-lg font-bold text-gold-bright">{t.whyTitle}</h2>
        <p className="mt-1 text-sm text-muted">{t.whyIntro(signName)}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[30rem] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr className="border-b border-border">
                <th scope="col" className="py-2 pr-3 font-semibold">{t.thPlanet}</th>
                <th scope="col" className="py-2 pr-3 font-semibold">{t.thSign}</th>
                <th scope="col" className="py-2 pr-3 font-semibold">{t.thHouse}</th>
                <th scope="col" className="py-2 pr-3 font-semibold">{t.thRule}</th>
                <th scope="col" className="py-2 font-semibold">{t.thEffect}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.planet} className="border-b border-border/60 last:border-0">
                  <th scope="row" className="py-2 pr-3 font-semibold text-cream">
                    {term(locale, r.planet)}
                    {r.retrograde && r.planet !== "Rahu" && r.planet !== "Ketu" && <span className="ml-1 text-xs text-rose">R</span>}
                  </th>
                  <td className="font-tabular py-2 pr-3 text-muted">
                    {term(locale, SIGNS[r.signIndex])} {Math.floor(r.longitude % 30)}°
                  </td>
                  <td className="py-2 pr-3 text-cream">{ord(r.house)}</td>
                  <td className="font-tabular py-2 pr-3 text-muted">{GOCHARA_GOOD[r.planet].join(", ")}</td>
                  <td className={`py-2 font-semibold ${r.good ? "text-gold-bright" : "text-rose"}`}>{r.good ? t.favourable : t.testing}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mt-6 text-sm font-bold text-cream">{t.ratingTitle}</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>{t.ratingStart}</li>
          <li>{t.ratingMoon(ord(h.moonHouse), rp.moonPoints)}</li>
          <li>{t.ratingJupiter(ord(h.jupiter.house), rp.jupiterPoint)}</li>
          <li>{t.ratingSaturn(ord(h.saturn.house), rp.saturnPoint)}</li>
          {rp.cappedByChandrashtama && <li className="text-rose">{t.ratingCap}</li>}
        </ol>
        <p className="mt-2 text-sm font-semibold text-cream">{t.ratingTotal(h.rating)}</p>
      </section>
    </div>
  );
}
