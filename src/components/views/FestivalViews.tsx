import Link from "next/link";
import { DateTime } from "luxon";
import { findFestival, observancesForYear, type FestivalCategory } from "@/lib/astrology/festivals";
import { observanceDescription, observanceName } from "@/lib/astrology/festivalsText";
import { FESTIVAL_LOCATION } from "@/lib/festivalPages";
import { panchangHref } from "@/lib/panchangUrl";
import JsonLd from "@/components/JsonLd";
import { getDictionary } from "@/lib/i18n/dictionary";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { monthTerm } from "@/lib/i18n/terms";

export const FESTIVAL_FILTERS: { key: "festivals" | "ekadashi" | "purnima-amavasya" | "vrat" | "all"; categories: FestivalCategory[] }[] = [
  { key: "festivals", categories: ["Festival", "Sankranti"] },
  { key: "ekadashi", categories: ["Ekadashi"] },
  { key: "purnima-amavasya", categories: ["Purnima", "Amavasya"] },
  { key: "vrat", categories: ["Sankashti Chaturthi", "Pradosh Vrat"] },
  { key: "all", categories: ["Festival", "Sankranti", "Ekadashi", "Purnima", "Amavasya", "Sankashti Chaturthi", "Pradosh Vrat"] },
];

export function FestivalYearView({ locale, year, type }: { locale: Locale; year: number; type: string | string[] | undefined }) {
  const t = getDictionary(locale).festivals;
  const base = localizeHref(locale, "/festivals");
  const filter = FESTIVAL_FILTERS.find((f) => f.key === type) ?? FESTIVAL_FILTERS[0];
  const yearHref = (y: number) => (filter.key === "festivals" ? `${base}/${y}` : `${base}/${y}?type=${filter.key}`);

  const items = observancesForYear(year, FESTIVAL_LOCATION).filter((o) => filter.categories.includes(o.category));
  const byMonth = new Map<string, typeof items>();
  for (const o of items) byMonth.set(o.date.slice(0, 7), [...(byMonth.get(o.date.slice(0, 7)) ?? []), o]);
  const today = DateTime.now().setZone(FESTIVAL_LOCATION.timezone).toISODate()!;

  return (
    <section className="mx-auto max-w-5xl px-5 py-14 md:py-20">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-sm font-semibold text-gold-bright">{t.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-cream md:text-5xl">{t.title(year)}</h1>
          <p className="mt-2 text-sm text-muted">{t.datesFor(FESTIVAL_LOCATION.place)}</p>
        </div>
        <nav aria-label="Year" className="flex gap-2">
          {year > 1900 && <PillLink href={yearHref(year - 1)}>← {year - 1}</PillLink>}
          {year < 2100 && <PillLink href={yearHref(year + 1)}>{year + 1} →</PillLink>}
        </nav>
      </header>

      <nav aria-label="Filter" className="mt-8 flex flex-wrap gap-2">
        {FESTIVAL_FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "festivals" ? `${base}/${year}` : `${base}/${year}?type=${f.key}`}
            scroll={false}
            aria-current={f.key === filter.key ? "page" : undefined}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
              f.key === filter.key ? "border-gold bg-gold text-on-gold" : "border-border text-muted hover:border-gold hover:text-gold-bright"
            }`}
          >
            {t.filters[f.key]}
          </Link>
        ))}
      </nav>

      <div className="mt-8 space-y-8">
        {[...byMonth.entries()].map(([month, list]) => (
          <section key={month}>
            <h2 className="text-lg font-bold text-gold-bright">{DateTime.fromISO(`${month}-01`).setLocale(locale).toFormat("LLLL yyyy")}</h2>
            <ul className="mt-3 divide-y divide-border/50 rounded-2xl border border-border/70 bg-surface/60">
              {list.map((o) => {
                const d = DateTime.fromISO(o.date).setLocale(locale);
                const isFestival = o.category === "Festival" || o.category === "Sankranti";
                const body = (
                  <>
                    <span className="w-14 shrink-0 text-center">
                      <span className="block font-display text-2xl leading-none text-cream">{d.day}</span>
                      <span className="text-[11px] text-muted">{d.toFormat("ccc")}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-cream">
                        {observanceName(o, locale)}
                        {o.date < today && (
                          <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-muted">
                            {locale === "hi" ? "बीत गया" : "Past"}
                          </span>
                        )}
                      </span>
                      <span className="block text-xs text-muted">
                        {isFestival ? monthTerm(locale, o.month) : `${t.categories[o.category]} · ${monthTerm(locale, o.month)}`}
                      </span>
                    </span>
                  </>
                );
                return (
                  <li key={`${o.slug}-${o.date}`}>
                    {o.description ? (
                      <Link href={`${base}/${year}/${o.slug}`} className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-surface-raised">
                        {body}
                        <span className="text-xs font-semibold text-gold-bright">{t.details}</span>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-4 px-4 py-3">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-10 text-xs leading-relaxed text-muted">{t.method}</p>
    </section>
  );
}

export function loadFestival(year: number, slug: string) {
  return findFestival(year, slug, FESTIVAL_LOCATION);
}

export function FestivalDetailView({ locale, year, slug }: { locale: Locale; year: number; slug: string }) {
  const festival = loadFestival(year, slug)!;
  const t = getDictionary(locale).festivals;
  const base = localizeHref(locale, "/festivals");
  const zone = FESTIVAL_LOCATION.timezone;
  const fmt = (d: Date) => DateTime.fromJSDate(d, { zone }).setLocale(locale).toFormat("h:mm a, d LLL");
  const date = DateTime.fromISO(festival.date).setLocale(locale);
  const name = observanceName(festival, locale).split(" · ")[0];

  return (
    <article className="mx-auto max-w-3xl px-5 py-14 md:py-20">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Event",
          name: `${name} ${year}`,
          startDate: festival.date,
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          location: { "@type": "Place", name: "India", address: "India" },
          description: observanceDescription(festival, locale),
          inLanguage: locale === "hi" ? "hi-IN" : "en-IN",
        }}
      />
      <Link href={`${base}/${year}`} className="text-xs font-semibold text-gold-bright hover:text-gold">
        {t.back(year)}
      </Link>
      <p className="mt-6 text-sm font-semibold text-gold-bright">{monthTerm(locale, festival.month)}</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-cream md:text-5xl">
        {name} {year}
      </h1>

      <div className="card-edge mt-8 flex flex-wrap items-center gap-6 rounded-3xl p-7">
        <div className="text-center">
          <p className="font-display text-6xl leading-none text-cream">{date.day}</p>
          <p className="mt-1 text-sm text-muted">{date.toFormat("LLLL yyyy")}</p>
        </div>
        <div className="flex-1">
          <p className="text-2xl font-semibold text-gold-bright">{date.toFormat("cccc")}</p>
          <p className="mt-2 text-sm text-muted">
            {festival.category === "Sankranti" ? t.sunEnters(fmt(festival.tithiStart)) : t.tithiSpan(fmt(festival.tithiStart), fmt(festival.tithiEnd))}
          </p>
          <p className="text-xs text-muted">{t.timingsFor(FESTIVAL_LOCATION.place)}</p>
        </div>
      </div>

      <p className="mt-8 text-base leading-relaxed text-muted">{observanceDescription(festival, locale)}</p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={panchangHref(festival.date, FESTIVAL_LOCATION, localizeHref(locale, "/panchang"))}
          className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-on-gold hover:bg-gold-bright"
        >
          {t.fullPanchang}
        </Link>
        {year < 2100 && (
          <Link href={`${base}/${year + 1}/${festival.slug}`} className="rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-cream hover:border-gold hover:text-gold-bright">
            {name} {year + 1} →
          </Link>
        )}
      </div>
    </article>
  );
}

function PillLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-full border border-border px-4 py-2 text-xs font-semibold text-cream hover:border-gold hover:text-gold-bright">
      {children}
    </Link>
  );
}
