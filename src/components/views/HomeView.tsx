import Link from "next/link";
import { DateTime } from "luxon";
import { prisma } from "@/lib/db";
import SkyDial, { skyNow } from "@/components/SkyDial";
import QuickKundaliForm from "@/components/QuickKundaliForm";
import ToolIcon from "@/components/icons/ToolIcon";
import { NAKSHATRAS, SIGNS, SIGN_SANSKRIT } from "@/lib/astrology/constants";
import { tithiIndex, tithiName } from "@/lib/astrology/birthDetails";
import { observancesForYear } from "@/lib/astrology/festivals";
import { observanceName } from "@/lib/astrology/festivalsText";
import { FESTIVAL_LOCATION } from "@/lib/festivalPages";
import { getDictionary } from "@/lib/i18n/dictionary";
import { localizeHref, type Locale } from "@/lib/i18n/locale";
import { term } from "@/lib/i18n/terms";

const TOOLS = [
  { key: "kundli", href: "/kundali" },
  { key: "matching", href: "/matching" },
  { key: "horoscope", href: "/horoscope" },
  { key: "personal", href: "/horoscope/personal" },
  { key: "panchang", href: "/panchang" },
  { key: "festivals", href: "/festivals" },
  { key: "muhurat", href: "/muhurat" },
  { key: "sadeSati", href: "/sade-sati" },
  { key: "numerology", href: "/numerology" },
  { key: "palmistry", href: "/palmistry" },
  { key: "rectification", href: "/rectification" },
  { key: "vastu", href: "/vastu" },
] as const;

export default async function HomeView({ locale }: { locale: Locale }) {
  const d = getDictionary(locale);
  const t = d.home;
  const href = (path: string) => localizeHref(locale, path);

  // The live reading for the hero and the tool list, all from one moment.
  const sky = skyNow();
  const sun = sky.positions.find((p) => p.planet === "Sun")!.longitude;
  const moon = sky.positions.find((p) => p.planet === "Moon")!.longitude;
  const { tithi, paksha } = tithiName(tithiIndex(sun, moon));
  const moonSign = term(locale, SIGNS[Math.floor(moon / 30)]);
  const nakshatra = term(locale, NAKSHATRAS[Math.floor(moon / (360 / 27))]);
  const tithiLabel = term(locale, `${paksha} ${tithi}`);
  const now = DateTime.fromJSDate(sky.at, { zone: "Asia/Kolkata" }).setLocale(locale);
  const nextFestival = observancesForYear(now.year, FESTIVAL_LOCATION)
    .concat(observancesForYear(now.year + 1, FESTIVAL_LOCATION))
    .find((o) => (o.category === "Festival" || o.category === "Sankranti") && o.date >= now.toISODate()!);

  const live: Partial<Record<(typeof TOOLS)[number]["key"], string>> = {
    horoscope: t.todayMoon(moonSign),
    panchang: t.todayTithi(tithiLabel),
    festivals: nextFestival
      ? t.nextFestival(observanceName(nextFestival, locale).split(" · ")[0], DateTime.fromISO(nextFestival.date).setLocale(locale).toFormat("d LLL"))
      : undefined,
  };

  const posts = await prisma.blogPost
    .findMany({ where: { published: true }, orderBy: { publishedAt: "desc" }, take: 3 })
    .catch(() => []);

  return (
    <>
      {/* Hero: always the night sky, whatever the page theme. */}
      <section className="theme-night relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-12 text-center md:py-16 lg:grid-cols-[1fr_1fr] lg:gap-12 lg:text-left">
          <div>
            <h1 className="mx-auto max-w-4xl text-5xl leading-[1.03] font-semibold text-cream sm:text-6xl lg:text-[4.5rem]">{t.heroTitle}</h1>
            <p className="mx-auto mt-5 max-w-xs text-lg leading-snug text-muted sm:hidden">{t.heroShort}</p>
            <p className="mx-auto mt-6 hidden max-w-2xl text-lg leading-relaxed text-muted sm:block">{t.heroBody}</p>
            <div className="mt-8 border-l-2 border-gold pl-4 text-left">
              <p className="max-w-xl text-base leading-relaxed text-cream">{t.heroNow(moonSign, nakshatra, tithiLabel)}</p>
              <p className="mt-2 text-xs text-muted">{t.updated(now.toFormat("h:mm a"))}</p>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 lg:justify-start">
              <a href="#kundli-form" className="rounded-full bg-gold px-7 py-3.5 text-base font-semibold text-on-gold transition-colors hover:bg-gold-bright">{t.makeKundli}</a>
              <Link href={href("/panchang")} className="text-base font-medium text-gold-bright underline-offset-4 hover:underline">{t.seePanchang}</Link>
            </div>
          </div>
          <SkyDial sky={sky} locale={locale} className="mx-auto w-full max-w-[500px] text-center" />
        </div>
      </section>

      {/* Make a kundli */}
      <section id="kundli-form" className="scroll-mt-20 border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1fr_minmax(0,440px)] md:items-center md:py-24">
          <div>
            <h2 className="text-4xl leading-none font-semibold text-cream md:text-6xl">{t.formTitle}</h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">{t.formBody}</p>
            <ul className="mt-8 max-w-md divide-y divide-border border-y border-border">
              {t.includes.map((item) => (
                <li key={item} className="flex items-center gap-3 py-3 text-cream">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <QuickKundaliForm copy={t.form} />
        </div>
      </section>

      {/* Tools grouped by the question people bring to the site. */}
      <section className="home-tools mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div className="max-w-2xl">
          <h2 className="text-4xl leading-none font-semibold text-cream md:text-5xl">{t.toolsTitle}</h2>
          <p className="mt-4 text-lg text-muted">{t.toolsBody}</p>
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-3 lg:gap-6">
          {[
            { title: locale === "hi" ? "मेरी कुंडली" : "My chart", keys: ["kundli", "matching", "personal", "rectification"] },
            { title: locale === "hi" ? "आज और आने वाले दिन" : "Today and ahead", keys: ["horoscope", "panchang", "festivals", "muhurat"] },
            { title: locale === "hi" ? "और जानें" : "Explore more", keys: ["sadeSati", "numerology", "palmistry", "vastu"] },
          ].map((group) => (
            <div key={group.title} className="home-tool-group">
              <h3 className="mb-2 border-b border-border pb-4 text-xl font-semibold text-cream">{group.title}</h3>
              <ul>
                {group.keys.map((key) => {
                  const tool = TOOLS.find((entry) => entry.key === key)!;
                  const [title, body] = d.tools[tool.key];
                  return (
                    <li key={key}>
                      <Link href={href(tool.href)} className="home-tool-link group flex items-start gap-4 border-b border-border/50 py-4">
                        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-raised text-gold-bright" aria-hidden="true">
                          <ToolIcon name={tool.key} className="h-5 w-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-lg font-semibold leading-tight text-cream group-hover:text-gold-bright">{title}</span>
                          <span className="mt-1 block text-sm leading-snug text-muted">{body}</span>
                          {live[tool.key] && <span className="mt-2 block text-xs font-medium text-gold-bright">{live[tool.key]}</span>}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Horoscope by sign, set as type */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-14 md:py-24">
          <h2 className="text-3xl leading-none font-semibold text-cream md:text-5xl">{t.zodiacTitle}</h2>
          <ul className="mt-10 grid grid-cols-2 gap-x-8 gap-y-1 sm:grid-cols-3 lg:grid-cols-4">
            {SIGNS.map((sign) => (
              <li key={sign}>
                <Link
                  href={href(`/horoscope/${sign.toLowerCase()}`)}
                  className="flex items-baseline justify-between gap-3 border-b border-border py-3 text-xl text-cream transition-colors hover:text-gold-bright md:text-2xl"
                  style={{ fontVariationSettings: '"wdth" 84' }}
                >
                  {term(locale, sign)}
                  <span className="text-sm text-muted">{locale === "hi" ? sign : SIGN_SANSKRIT[SIGNS.indexOf(sign)]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Why it can be trusted */}
      <section className="mx-auto max-w-6xl px-5 py-14 md:py-28">
        <h2 className="max-w-3xl text-4xl leading-none font-semibold text-cream md:text-6xl">{t.builtTitle}</h2>
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {t.facts.map((f) => (
            <div key={f.title} className="border-t border-gold pt-6">
              <h3 className="text-xl font-semibold text-cream">{f.title}</h3>
              <p className="mt-3 leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The astrologer */}
      <section className="theme-night">
        <div className="mx-auto max-w-4xl px-5 py-14 text-center md:py-28">
          <h2 className="text-4xl leading-none font-semibold text-cream md:text-6xl">{t.guidanceTitle}</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">{t.guidanceBody}</p>
          <Link href="/about" className="mt-8 inline-block font-medium text-gold-bright underline-offset-4 hover:underline">
            {t.readStory}
          </Link>
        </div>
      </section>

      {posts.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-14 md:py-28">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-3xl leading-none font-semibold text-cream md:text-5xl">{t.blogTitle}</h2>
            <Link href="/blog" className="font-medium text-gold-bright underline-offset-4 hover:underline">
              {t.viewAll}
            </Link>
          </div>
          <ul className={`mt-10 grid gap-10 ${posts.length === 1 ? "max-w-2xl" : "md:grid-cols-3"}`}>
            {posts.map((post) => (
              <li key={post.id} className="border-t border-border pt-6">
                <Link href={`/blog/${post.slug}`} className="group block">
                  <p className="text-sm text-gold-bright">{post.category}</p>
                  <h3 className="mt-2 text-2xl leading-tight font-semibold text-cream group-hover:text-cream">{post.title}</h3>
                  <p className="mt-3 line-clamp-3 leading-relaxed text-muted">{post.excerpt}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="border-t border-border">
        <div className="mx-auto max-w-4xl px-5 py-14 text-center md:py-28">
          <h2 className="text-4xl leading-none font-semibold text-cream md:text-6xl">{t.ctaTitle}</h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted">{t.ctaBody}</p>
          <Link
            href="/consultation"
            className="mt-10 inline-block rounded-full bg-gold px-8 py-4 text-base font-semibold text-on-gold transition-colors hover:bg-gold-bright"
          >
            {t.ctaButton}
          </Link>
        </div>
      </section>
    </>
  );
}
