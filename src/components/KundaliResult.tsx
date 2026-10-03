"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import type { KundaliChart } from "@/lib/astrology/types";
import type { DashaPeriod } from "@/lib/astrology/dasha";
import { NAKSHATRAS, SIGNS, SIGN_SANSKRIT, ASHTAKAVARGA_PLANETS, VARGA_KEYS, type VargaKey, type AshtakavargaPlanet } from "@/lib/astrology/constants";
import { SIGN_KEYNOTE, PLANET_KEYNOTE } from "@/lib/astrology/content";
import { analyzeBhavaStrength } from "@/lib/astrology/bhavaStrength";
import { dignityColorClass } from "@/lib/astrology/dignity";
import { signOffsetHouse } from "@/lib/astrology/math";
import type { DivisionalChart } from "@/lib/astrology/types";
import KundliChart, { type ChartPoint } from "@/components/KundliChart";
import { MARKER_MEANING, WEAK_MARKERS, natalMarkers, planetMarkers, type Marker } from "@/lib/astrology/chartMarkers";
import AshtakavargaGrid from "@/components/AshtakavargaGrid";
import ShadbalaTable from "@/components/ShadbalaTable";
import ChartDetail from "@/components/ChartDetail";
import SegmentedControl from "@/components/SegmentedControl";
import PrintReport from "@/components/PrintReport";
import BasicDetails from "@/components/BasicDetails";
import AstroDashboard from "@/components/AstroDashboard";
import MonthlyForecastPanel from "@/components/MonthlyForecastPanel";
import RudrakshaPanel from "@/components/RudrakshaPanel";
import RemediesPanel from "@/components/RemediesPanel";
import DashaExplorer from "@/components/DashaExplorer";
import { LifeReportPanel, PlanetReadingsPanel, TransitsPanel } from "@/components/ReportPanels";
import type { HeavySection, KundaliReport } from "@/lib/astrology/report";
import YogaAnalysisPanel from "@/components/YogaAnalysisPanel";
import { CareerPanel, HousesPanel, TimelinePanel } from "@/components/DeepReportPanels";
import { CharaPanel, KpPanel, LifeSectorsPanel, VimshottariDetail, YoginiPanel } from "@/components/DashaSystemsPanels";
import KundliSummary from "@/components/KundliSummary";
import { haptic } from "@/lib/haptics";
import { LalKitabPanel, SpecialTablesPanel } from "@/components/AdvancedPanels";
import { nakshatraLord } from "@/lib/astrology/dasha";
import { useLocale, useT } from "@/lib/i18n/LocaleContext";
import { pick } from "@/lib/i18n/ui";
import { term } from "@/lib/i18n/terms";
import { houseSignification, planetKeynote, signKeynote, vargaInfo } from "@/lib/astrology/content";
import { markerText } from "@/lib/chartGeometry";

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
/** The kundli's sections, grouped so the page opens on a summary and each area is one tap away. */
const GROUPS = [
  { name: "Start", tabs: ["Summary", "Dashboard", "Overview"] },
  { name: "Predictions", tabs: ["Monthly Forecast", "Life Report", "Life Sectors", "Life Timeline", "Career", "Houses", "Planet Readings", "Transits"] },
  { name: "Charts", tabs: ["D1 · Rasi Chart", "D9 · Navamsa", "More Vargas", "Ashtakavarga", "Shadbala", "House Lords"] },
  { name: "Dashas", tabs: ["Dashas", "Yogini Dasha", "Chara Dasha"] },
  { name: "Advanced", tabs: ["Yogas & Doshas", "KP System", "Lal Kitab", "Special Tables"] },
  { name: "Guidance", tabs: ["Remedies", "Rudraksha"] },
] as const;
type Tab = (typeof GROUPS)[number]["tabs"][number];
const groupOf = (t: Tab) => GROUPS.find((g) => (g.tabs as readonly string[]).includes(t))!;

/** The heavy report sections each tab needs. */
const TAB_SECTIONS: Partial<Record<Tab, HeavySection[]>> = {
  Summary: ["timeline", "dashaDetail", "houses", "sectors", "career"],
  Houses: ["houses"],
  Career: ["career"],
  "Life Timeline": ["timeline"],
  "Life Sectors": ["sectors"],
  Dashas: ["dashaDetail"],
  "Yogini Dasha": ["yogini"],
  "Chara Dasha": ["chara"],
  "KP System": ["kp"],
  "Monthly Forecast": ["monthly"],
};

/** URL-friendly names for deep links such as /kundali?tab=dashas. */
export const TAB_SLUGS: Record<string, Tab> = {
  summary: "Summary",
  dashboard: "Dashboard",
  overview: "Overview",
  report: "Life Report",
  monthly: "Monthly Forecast",
  planets: "Planet Readings",
  houses: "Houses",
  career: "Career",
  timeline: "Life Timeline",
  sectors: "Life Sectors",
  yogini: "Yogini Dasha",
  chara: "Chara Dasha",
  kp: "KP System",
  transits: "Transits",
  rasi: "D1 · Rasi Chart",
  navamsa: "D9 · Navamsa",
  vargas: "More Vargas",
  ashtakavarga: "Ashtakavarga",
  shadbala: "Shadbala",
  dashas: "Dashas",
  yogas: "Yogas & Doshas",
  remedies: "Remedies",
  rudraksha: "Rudraksha",
  lords: "House Lords",
  lalkitab: "Lal Kitab",
  tables: "Special Tables",
};

const MORE_VARGA_KEYS = VARGA_KEYS.filter((k) => k !== "D1" && k !== "D9");

function formatDate(d: Date | string, locale?: string): string {
  return new Date(d).toLocaleDateString(locale === "hi" ? "hi-IN" : undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatDateShort(d: Date | string, locale?: string): string {
  return new Date(d).toLocaleDateString(locale === "hi" ? "hi-IN" : undefined, { year: "numeric", month: "short" });
}

export default function KundaliResult({
  chart,
  report,
  initialTab,
  loadSections,
}: {
  chart: KundaliChart;
  report: KundaliReport | null;
  initialTab?: string | null;
  /** Fetches heavy report sections on demand; sections a tab needs load when it opens. */
  loadSections?: (sections: HeavySection[]) => void;
}) {
  const tr = useT();
  const locale = useLocale();
  const [tab, setTabState] = useState<Tab>((initialTab && TAB_SLUGS[initialTab]) || "Summary");
  const setTab = (t: Tab) => {
    setTabState(t);
    // Keep the section in the URL so it can be shared or bookmarked.
    const slug = Object.keys(TAB_SLUGS).find((k) => TAB_SLUGS[k] === t);
    if (slug) {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", slug);
      window.history.replaceState(null, "", url);
    }
  };
  // Swipe left or right on a phone to move between sections, like pages in an app.
  const ORDER = GROUPS.flatMap((g) => g.tabs) as Tab[];
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    const target = e.target as Element;
    // Leave gestures alone inside horizontally scrolling tables, charts' own controls and form fields.
    if (target.closest(".overflow-x-auto, input, select, textarea, [data-no-swipe]")) {
      touch.current = null;
      return;
    }
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
  }
  function onTouchEnd(e: React.TouchEvent) {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) < 70 || Math.abs(dy) > 45 || Date.now() - start.t > 600) return;
    const i = ORDER.indexOf(tab);
    const next = ORDER[i + (dx < 0 ? 1 : -1)];
    if (!next) return;
    haptic("selection");
    setTab(next);
  }

  // Load each tab's heavy sections when it's opened (the summary also prefetches what its cards show).
  useEffect(() => {
    const need = TAB_SECTIONS[tab];
    if (need?.length && report) loadSections?.(need);
  }, [tab, report, loadSections]);

  const go = (slug: string) => {
    if (TAB_SLUGS[slug]) setTab(TAB_SLUGS[slug]);
    document.getElementById("kundli-sections")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const [style, setStyle] = useState<"north" | "south">("north");
  const tabStripRef = useRef<HTMLUListElement>(null);

  // On phones the tabs are a horizontal strip; keep the active one visible (e.g. after a ?tab= deep link).
  useEffect(() => {
    const strip = tabStripRef.current;
    const active = strip?.querySelector<HTMLElement>("[aria-current=page]");
    if (!strip || !active || strip.scrollWidth <= strip.clientWidth) return;
    strip.scrollTo({ left: active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2, behavior: "smooth" });
  }, [tab]);

  return (
    <div>
      <div className="print:hidden">
        <div id="kundli-sections" className="scroll-mt-24 lg:grid lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-8">
          <nav aria-label={tr("Chart sections")} className="lg:sticky lg:top-24 lg:self-start">
            {/* Phones: a row of groups, then the sections in the chosen group. */}
            <div className="lg:hidden">
              <ul className="scrollbar-none -mx-5 flex gap-1.5 overflow-x-auto px-5 pb-2">
                {GROUPS.map((g) => (
                  <li key={g.name} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setTab(g.tabs[0])}
                      aria-pressed={groupOf(tab).name === g.name}
                      className={`rounded-full border px-4 py-1.5 text-xs font-semibold ${groupOf(tab).name === g.name ? "border-gold bg-gold text-on-gold" : "border-border text-muted"}`}
                    >
                      {tr(g.name)}
                    </button>
                  </li>
                ))}
              </ul>
              <ul ref={tabStripRef} className="scrollbar-none -mx-5 mt-1 flex gap-1.5 overflow-x-auto px-5 pb-2">
                {groupOf(tab).tabs.map((t) => (
                  <li key={t} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setTab(t)}
                      aria-current={tab === t ? "page" : undefined}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap ${tab === t ? "bg-surface-raised text-cream ring-1 ring-gold/60" : "text-muted"}`}
                    >
                      {tr(t)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            {/* Desktop: grouped sidebar. */}
            <div className="hidden lg:block lg:rounded-2xl lg:border lg:border-border lg:bg-ink-deep/60 lg:p-2">
              {GROUPS.map((g) => (
                <div key={g.name} className="mb-2 last:mb-0">
                  <p className="px-3 pt-2 pb-1 text-[11px] font-semibold text-muted">{tr(g.name)}</p>
                  <ul className="flex flex-col gap-0.5">
                    {g.tabs.map((t) => (
                      <li key={t}>
                        <button
                          type="button"
                          onClick={() => setTab(t)}
                          aria-current={tab === t ? "page" : undefined}
                          className="relative w-full rounded-xl px-3 py-2 text-left text-sm font-semibold"
                        >
                          {tab === t && <motion.span layoutId="active-tab-pill" className="absolute inset-0 rounded-xl bg-gold" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
                          <span className={`relative z-10 transition-colors ${tab === t ? "text-on-gold" : "text-muted hover:text-cream"}`}>{tr(t)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

        <div className="mt-6 min-w-0 lg:mt-0" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
            >
              {tab === "Summary" && <KundliSummary chart={chart} report={report} go={go} style={style} setStyle={setStyle} />}
              {tab === "Dashboard" && <AstroDashboard chart={chart} />}
              {tab === "Overview" && <OverviewTab chart={chart} />}
              {tab === "Lal Kitab" && <LalKitabPanel chart={chart} />}
              {tab === "Special Tables" && <SpecialTablesPanel chart={chart} />}
              {tab === "Monthly Forecast" && <MonthlyForecastPanel report={report} />}
              {tab === "Life Report" && <LifeReportPanel report={report} />}
              {tab === "Planet Readings" && <PlanetReadingsPanel report={report} />}
              {tab === "Houses" && <HousesPanel report={report} />}
              {tab === "Career" && <CareerPanel report={report} />}
              {tab === "Life Timeline" && <TimelinePanel report={report} />}
              {tab === "Life Sectors" && <LifeSectorsPanel report={report} />}
              {tab === "Yogini Dasha" && <YoginiPanel report={report} />}
              {tab === "Chara Dasha" && <CharaPanel report={report} />}
              {tab === "KP System" && <KpPanel report={report} />}
              {tab === "Transits" && <TransitsPanel report={report} chart={chart} />}
              {tab === "D1 · Rasi Chart" && <RasiTab chart={chart} style={style} setStyle={setStyle} />}
              {tab === "D9 · Navamsa" && (
                <VargaTab
                  chart={chart}
                  title="D9"
                  blurb={vargaInfo("D9", locale).blurb}
                  divisionalChart={chart.divisionalCharts.D9}
                  style={style}
                  setStyle={setStyle}
                />
              )}
              {tab === "More Vargas" && <MoreVargasTab chart={chart} style={style} setStyle={setStyle} />}
              {tab === "Ashtakavarga" && <AshtakavargaTab chart={chart} style={style} setStyle={setStyle} />}
              {tab === "Shadbala" && (
                <div>
                  <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
                    {tr("Shadbala weighs each planet's overall classical strength across six components — a planet with low Shadbala is read as needing support from the rest of the chart to deliver its significations fully.")}
                  </p>
                  <div className="mt-8">
                    <ShadbalaTable shadbala={chart.shadbala} />
                  </div>
                </div>
              )}
              {tab === "Dashas" && <DashasTab chart={chart} report={report} />}
              {tab === "Yogas & Doshas" && <YogasDoshasTab chart={chart} />}
              {tab === "Remedies" && <RemediesPanel chart={chart} />}
              {tab === "Rudraksha" && <RudrakshaPanel chart={chart} locale={locale} />}
              {tab === "House Lords" && <HouseLordsTab chart={chart} />}
            </motion.div>
          </AnimatePresence>
        </div>
        </div>

        {locale === "hi" ? (
          <p className="mt-16 text-center text-xs text-muted">
            राशियाँ निरयण (सायन नहीं) राशिचक्र से दिखाई गई हैं। यह फल शास्त्रीय नियमों से बना है और एक आरंभ-बिंदु है, अंतिम निर्णय नहीं। आपके लिए
            विशेष व्याख्या हेतु{" "}
            <a href="/consultation" className="text-gold-bright hover:text-gold">
              व्यक्तिगत परामर्श बुक करें
            </a>
            ।
          </p>
        ) : (
          <p className="mt-16 text-center text-xs text-muted">
            Signs shown use the sidereal (Nirayana) zodiac —{" "}
            {SIGN_SANSKRIT[chart.ascendant.signIndex]} is the Sanskrit name for {chart.ascendant.sign}. This
            reading is generated from classical rules and is meant as a starting point, not a final word.{" "}
            <a href="/consultation" className="text-gold-bright hover:text-gold">
              Book a personal reading
            </a>{" "}
            for interpretation specific to you.
          </p>
        )}
      </div>

      <div className="hidden print:block">
        <PrintReport chart={chart} />
      </div>
    </div>
  );
}

function StyleToggle({ style, setStyle }: { style: "north" | "south"; setStyle: (s: "north" | "south") => void }) {
  const tr = useT();
  return (
    <div className="flex justify-center">
      <SegmentedControl
        layoutId="chart-style-toggle"
        value={style}
        onChange={setStyle}
        options={[
          { value: "north", label: tr("North Indian") },
          { value: "south", label: tr("South Indian") },
        ]}
      />
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`card-edge rounded-2xl p-7 ${className}`}>
      {children}
    </div>
  );
}

const LIFE_AREA_LABEL_HI: Partial<Record<number, string>> = {
  1: "आपका आत्मबोध और जीवन-शक्ति",
  4: "घर और भावनात्मक आधार",
  5: "संतान और रचनात्मकता",
  7: "संबंध और साझेदारी",
  9: "भाग्य और उच्च शिक्षा",
  10: "करियर और प्रतिष्ठा",
};

const LIFE_AREA_LABEL: Partial<Record<number, string>> = {
  1: "your sense of self and vitality",
  4: "home and emotional foundation",
  5: "children and creativity",
  7: "relationships and partnership",
  9: "fortune and higher learning",
  10: "career and public standing",
};

/**
 * Each life-area label already contains its own "and" (e.g. "home and
 * emotional foundation"), so gluing two together with a bare "and"/","
 * reads as one run-on list instead of two distinct areas — "along with"
 * keeps the two-item case (the only case this is actually called with)
 * unambiguous; longer lists fall back to semicolons for the same reason.
 */
function joinWithAnd(items: string[], hi = false): string {
  if (items.length <= 1) return items.join("");
  if (hi) return items.join(" और साथ ही ");
  if (items.length === 2) return `${items[0]}, along with ${items[1]}`;
  return `${items.slice(0, -1).join("; ")}; and ${items[items.length - 1]}`;
}

function OverviewTab({ chart }: { chart: KundaliChart }) {
  const tr = useT();
  const locale = useLocale();
  const hi = locale === "hi";
  const P = pick(locale);
  const name = (x: string) => term(locale, x);
  const areas = hi ? LIFE_AREA_LABEL_HI : LIFE_AREA_LABEL;
  const moon = chart.planets.find((p) => p.planet === "Moon")!;
  const sun = chart.planets.find((p) => p.planet === "Sun")!;
  const presentYogas = chart.yogas.filter((y) => y.present);
  const presentDoshas = chart.doshas.filter((d) => d.present);

  const pillarStrength = analyzeBhavaStrength(chart.ascendant.signIndex, chart.planets, chart.shadbala)
    .filter((b) => LIFE_AREA_LABEL[b.house])
    .sort((a, b) => b.score - a.score);
  const strongestAreas = joinWithAnd(pillarStrength.slice(0, 2).map((b) => areas[b.house]!), hi);
  const weakestAreas = joinWithAnd(
    [...pillarStrength]
      .sort((a, b) => a.score - b.score)
      .slice(0, 2)
      .map((b) => areas[b.house]!),
    hi
  );

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-3">
        <BasicDetails chart={chart} />
      </div>
      <SummaryCard title={tr("Ascendant (Lagna)")} sign={name(chart.ascendant.sign)}>
        {P(`Your outward personality and life direction lean ${SIGN_KEYNOTE[chart.ascendant.sign]}.`, `आपका बाहरी व्यक्तित्व और जीवन की दिशा ${signKeynote(chart.ascendant.sign, "hi")} की ओर झुकी है।`)}
      </SummaryCard>
      <SummaryCard title={tr("Moon Sign (Rashi)")} sign={name(moon.sign)}>
        {P(`Your inner emotional world tends to be ${SIGN_KEYNOTE[moon.sign]}.`, `आपका भीतरी भावनात्मक संसार ${signKeynote(moon.sign, "hi")} रहता है।`)}
      </SummaryCard>
      <SummaryCard title={tr("Sun Sign")} sign={name(sun.sign)}>
        {P(`Your core sense of identity is ${SIGN_KEYNOTE[sun.sign]}.`, `आपकी मूल पहचान ${signKeynote(sun.sign, "hi")} है।`)}
      </SummaryCard>

      <Card className="md:col-span-3">
        <h3 className="text-xl font-bold tracking-tight text-cream">{tr("Where You Are Now")}</h3>
        {chart.currentDasha && hi ? (
          <p className="mt-4 text-base leading-relaxed text-muted">
            आप <span className="text-cream">{name(chart.currentDasha.lord)} महादशा</span>
            {chart.currentAntardasha && <> → <span className="text-cream">{name(chart.currentAntardasha.lord)} अंतर्दशा</span></>}
            {chart.currentPratyantardasha && <> → <span className="text-cream">{name(chart.currentPratyantardasha.lord)} प्रत्यंतर दशा</span></>} में
            हैं, जो {formatDate(chart.currentPratyantardasha?.end ?? chart.currentAntardasha?.end ?? chart.currentDasha.end, "hi")} तक सक्रिय है।{" "}
            {name(chart.currentDasha.lord)} की दशा सामान्यतः {planetKeynote(chart.currentDasha.lord, "hi")} के विषय सामने लाती है
            {chart.currentAntardasha && chart.currentAntardasha.lord !== chart.currentDasha.lord && (
              <>, जिन्हें {name(chart.currentAntardasha.lord)} {planetKeynote(chart.currentAntardasha.lord, "hi")} के माध्यम से ढालते हैं</>
            )}
            ।
          </p>
        ) : chart.currentDasha ? (
          <p className="mt-4 text-base leading-relaxed text-muted">
            You are running <span className="text-cream">{chart.currentDasha.lord} Mahadasha</span>
            {chart.currentAntardasha && (
              <>
                {" "}
                → <span className="text-cream">{chart.currentAntardasha.lord} Antardasha</span>
              </>
            )}
            {chart.currentPratyantardasha && (
              <>
                {" "}
                → <span className="text-cream">{chart.currentPratyantardasha.lord} Pratyantardasha</span>
              </>
            )}
            , active until{" "}
            {formatDate(chart.currentPratyantardasha?.end ?? chart.currentAntardasha?.end ?? chart.currentDasha.end)}.{" "}
            {chart.currentDasha.lord} periods generally bring themes of {PLANET_KEYNOTE[chart.currentDasha.lord]} to
            the foreground
            {chart.currentAntardasha && chart.currentAntardasha.lord !== chart.currentDasha.lord && (
              <>, filtered through {chart.currentAntardasha.lord}&rsquo;s focus on {PLANET_KEYNOTE[chart.currentAntardasha.lord]}</>
            )}
            .
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted">{tr("No active dasha period found for the current date.")}</p>
        )}
        {chart.sadeSati.active && (
          <p className="mt-4 rounded-xl border border-gold/30 bg-gold/5 px-5 py-4 text-sm text-cream">
            {hi ? (
              <>
                आप अभी साढ़े साती के <span className="font-semibold text-gold-bright">{({ rising: "आरंभिक", peak: "मध्य (चरम)", setting: "अंतिम" } as Record<string, string>)[chart.sadeSati.phase ?? "peak"]}</span>{" "}
                चरण में हैं — जन्म चंद्र के आसपास की राशियों से शनि का गोचर।
              </>
            ) : (
              <>
                You are currently in the <span className="font-semibold text-gold-bright">{chart.sadeSati.phase}</span> phase of Sade Sati — Saturn&rsquo;s transit through the signs around your natal Moon.
              </>
            )}
          </p>
        )}
      </Card>

      <Card className="md:col-span-3">
        <h3 className="text-xl font-bold tracking-tight text-cream">{tr("Planet Strength")}</h3>
        <p className="mt-2 text-sm text-muted">{tr("Each planet's Shadbala rupas against what it classically needs to act at full strength.")}</p>
        <div className="mt-5 space-y-3">
          {chart.shadbala.map((s) => {
            const pct = Math.max(0, Math.min(100, (s.rupas / s.requiredRupas) * 100));
            return (
              <div key={s.planet}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-cream">{name(s.planet)}</span>
                  <span className={s.isStrong ? "text-gold-bright" : "text-rose"}>
                    {s.rupas.toFixed(2)} / {s.requiredRupas} {tr("rupas")}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full border border-border/50 bg-ink-deep/80">
                  <div className={`h-full rounded-full ${s.isStrong ? "bg-gold" : "bg-rose/70"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-5 text-sm leading-relaxed text-muted">
          {hi ? (
            <>
              सभी नौ ग्रहों को देखते हुए <span className="text-cream">{strongestAreas}</span> आपके सबसे मज़बूत समर्थित क्षेत्र हैं, जबकि{" "}
              <span className="text-cream">{weakestAreas}</span> पर सबसे सचेत ध्यान की ज़रूरत है।
            </>
          ) : (
            <>
              Reading across all nine planets, <span className="text-cream">{strongestAreas}</span> come through as your most solidly supported areas, while{" "}
              <span className="text-cream">{weakestAreas}</span> could use the most conscious attention.
            </>
          )}
        </p>
      </Card>

      <Card>
        <h3 className="text-xl font-bold tracking-tight text-cream">{tr("Yogas Present")}</h3>
        {presentYogas.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{tr("None of the classical combinations checked are present in this chart.")}</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm text-cream">
            {presentYogas.map((y) => (
              <li key={y.name}>• {y.name}</li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="md:col-span-2">
        <h3 className="text-xl font-bold tracking-tight text-cream">{tr("Doshas Flagged")}</h3>
        {presentDoshas.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{tr("None of the doshas checked are indicated in this chart.")}</p>
        ) : (
          <ul className="mt-4 space-y-1.5 text-sm text-cream">
            {presentDoshas.map((d) => (
              <li key={d.name}>• {d.name}</li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-muted">{tr("See the “Yogas & Doshas” tab for the reasoning behind each.")}</p>
      </Card>
    </div>
  );
}

function SummaryCard({ title, sign, children }: { title: string; sign: string; children: React.ReactNode }) {
  return (
    <Card>
      <h3 className="text-xs font-semibold text-muted">{title}</h3>
      <p className="mt-3 text-3xl font-bold tracking-tight text-gold-bright">{sign}</p>
      <p className="mt-3 text-sm leading-relaxed text-muted">{children}</p>
    </Card>
  );
}

function RasiTab({
  chart,
  style,
  setStyle,
}: {
  chart: KundaliChart;
  style: "north" | "south";
  setStyle: (s: "north" | "south") => void;
}) {
  const tr = useT();
  const locale = useLocale();
  const hi = locale === "hi";
  const name = (x: string) => term(locale, x);
  const [mode, setMode] = useState<"lagna" | "moon" | "chalit" | "lalkitab">("lagna");
  const moon = chart.planets.find((p) => p.planet === "Moon")!;
  const chalit = new Map(chart.chalitHouses.map((c) => [c.planet, c.house]));
  // Lal Kitab keeps every planet in its natal house but fixes Aries as the 1st house.
  const referenceSign = mode === "moon" ? moon.signIndex : mode === "lalkitab" ? 0 : chart.ascendant.signIndex;
  const markers = natalMarkers(chart);
  // North Indian draws by house, South Indian by sign. For Chalit and Lal Kitab, where a house isn't its sign,
  // each planet is drawn in the sign that its house represents.
  const shown: ChartPoint[] = chart.planets.map((p) => {
    const house = mode === "moon" ? signOffsetHouse(p.signIndex, moon.signIndex) : mode === "chalit" ? chalit.get(p.planet)! : p.house;
    const signIndex = mode === "chalit" || mode === "lalkitab" ? (referenceSign + house - 1) % 12 : p.signIndex;
    return { ...p, house, signIndex, markers: markers[p.planet] };
  });
  const shifted = chart.planets.filter((p) => chalit.get(p.planet) !== p.house);

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-3">
        <SegmentedControl
          layoutId="rasi-mode-toggle"
          value={mode}
          onChange={setMode}
          options={[
            { value: "lagna", label: tr("Lagna") },
            { value: "moon", label: tr("Chandra (Moon)") },
            { value: "chalit", label: tr("Bhava Chalit") },
            { value: "lalkitab", label: tr("Lal Kitab") },
          ]}
        />
        <StyleToggle style={style} setStyle={setStyle} />
      </div>
      <p className="mx-auto mt-4 max-w-2xl text-center text-xs leading-relaxed text-muted">
        {mode === "lagna" && tr("Houses counted from your Ascendant — the main birth chart.")}
        {mode === "moon" &&
          (hi
            ? `चंद्र कुंडली में भाव आपकी चंद्र राशि (${name(moon.sign)}) से गिने जाते हैं; इसे लग्न कुंडली के साथ पढ़ा जाता है, ख़ासकर मन और गोचर के लिए।`
            : `The Chandra Kundli counts houses from your Moon sign (${moon.sign}) and is read alongside the Lagna chart, especially for the mind and for transits.`)}
        {mode === "lalkitab" &&
          tr("The Lal Kitab chart keeps each planet in its birth house but numbers the houses as fixed signs — the 1st house is always Aries, the 2nd Taurus, and so on. Lal Kitab readings and remedies are made from this chart.")}
        {mode === "chalit" &&
          (shifted.length === 0
            ? tr("Bhava Chalit places each planet by Sripati house cusps rather than by sign. In this chart every planet stays in the same house.")
            : hi
              ? `भाव चलित में हर ग्रह राशि के बजाय श्रीपति भाव-संधियों से रखा जाता है। ${shifted.map((p) => `${name(p.planet)} भाव ${p.house} से ${chalit.get(p.planet)} में जाते हैं`).join("; ")}।`
              : `Bhava Chalit places each planet by Sripati house cusps rather than by sign. ${shifted
                  .map((p) => `${p.planet} moves from house ${p.house} to ${chalit.get(p.planet)}`)
                  .join("; ")}.`)}
      </p>
      <div className="mt-8 grid gap-8">
        <KundliChart ascendantSignIndex={referenceSign} planets={shown} style={style} onStyleChange={setStyle} />

        {mode === "chalit" && <BhavaTable chart={chart} />}
        <PlanetTable chart={chart} />
      </div>

      <ChartDetail vargaKey="D1" ascendantSignIndex={chart.ascendant.signIndex} planets={chart.planets} natal={chart} />
    </div>
  );
}

function PlanetTable({ chart }: { chart: KundaliChart }) {
  const tr = useT();
  const locale = useLocale();
  const nm = (x: string) => term(locale, x);
  const markers = natalMarkers(chart);
  const ascNakshatraIndex = Math.floor(chart.ascendant.siderealLongitude / (360 / 27));

  return (
    <div className="card-edge self-start overflow-x-auto rounded-2xl">
      <table className="w-full text-sm font-tabular">
        <thead>
          <tr className="border-b border-border text-left text-xs whitespace-nowrap text-muted">
            <th className="px-3 py-3">{tr("Planet")}</th>
            <th className="px-3 py-3">{tr("Sign")}</th>
            <th className="px-3 py-3">{tr("Degree")}</th>
            <th className="px-3 py-3">{tr("Nakshatra")}</th>
            <th className="px-3 py-3">{tr("Nak. lord")}</th>
            <th className="px-3 py-3">{tr("House")}</th>
            <th className="px-3 py-3">{tr("Dignity")}</th>
          </tr>
        </thead>
        <tbody className="whitespace-nowrap">
          <tr className="border-b border-border/50 bg-gold/5">
            <td className="px-3 py-2.5 font-medium text-gold-bright">{tr("Ascendant")}</td>
            <td className="px-3 py-2.5 text-muted">{nm(chart.ascendant.sign)}</td>
            <td className="px-3 py-2.5 text-muted">{formatDms(chart.ascendant.degreeInSign)}</td>
            <td className="px-3 py-2.5 text-muted">
              {nm(NAKSHATRAS[ascNakshatraIndex])}
            </td>
            <td className="px-3 py-2.5 text-muted">{nm(nakshatraLord(ascNakshatraIndex))}</td>
            <td className="px-3 py-2.5 text-muted">1</td>
            <td className="px-3 py-2.5 text-muted">—</td>
          </tr>
          {chart.planets.map((p) => {
            const marks = markers[p.planet];
            return (
              <tr key={p.planet} className="border-b border-border/50 last:border-0">
                <td className="px-3 py-2.5 font-medium text-cream">
                  <Link href={`/learn/planets#${p.planet}`} className="hover:text-gold-bright">
                    {nm(p.planet)}
                  </Link>
                  {[...marks].map((m, i) => (
                    <abbr
                      key={i}
                      title={tr(MARKER_MEANING[m as Marker])}
                      className={`ml-1 text-xs font-semibold no-underline ${WEAK_MARKERS.has(m as Marker) || m === "R" ? "text-rose" : "text-gold-bright"}`}
                    >
                      {markerText(m, locale)}
                    </abbr>
                  ))}
                </td>
                <td className="px-3 py-2.5 text-muted">{nm(p.sign)}</td>
                <td className="px-3 py-2.5 text-muted">{formatDms(p.degreeInSign)}</td>
                <td className="px-3 py-2.5 text-muted">
                  {nm(p.nakshatra)} <span className="text-xs">({p.pada})</span>
                </td>
                <td className="px-3 py-2.5 text-muted">{nm(nakshatraLord(p.nakshatraIndex))}</td>
                <td className="px-3 py-2.5 text-muted">{p.house}</td>
                <td className="px-3 py-2.5">
                  {p.dignity ? (
                    <span className={dignityColorClass(p.dignity)}>{nm(p.dignity)}</span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-border/50 px-3 py-2.5 text-xs text-muted">
        <span className="text-gold-bright">↑</span> {tr("exalted")}, <span className="text-rose">↓</span> {tr("debilitated")},{" "}
        <span className="text-rose">{markerText("R", locale)}</span> {tr("retrograde")}, <span className="text-rose">{markerText("C", locale)}</span> {tr("combust")},{" "}
        <span className="text-gold-bright">{markerText("V", locale)}</span> {tr("vargottama")}. {tr("Nakshatra pada in brackets.")}
      </p>
    </div>
  );
}

/** Sripati bhava cusps: where each house begins (Arambha), peaks (Madhya) and ends (Viram). */
function BhavaTable({ chart }: { chart: KundaliChart }) {
  const tr = useT();
  const locale = useLocale();
  const nm = (x: string) => term(locale, x);
  const at = (lon: number) => {
    const signIndex = Math.floor(lon / 30) % 12;
    return `${nm(SIGNS[signIndex])} ${formatDms(lon - signIndex * 30)}`;
  };
  return (
    <div className="card-edge overflow-x-auto rounded-2xl">
      <table className="w-full text-sm font-tabular">
        <caption className="px-4 pt-4 text-left">
          <span className="block font-semibold text-cream">{tr("Bhava Chalit cusps")}</span>
          <span className="text-xs text-muted">{tr("Each bhava runs from its Arambha (start, the sandhi or junction) through its Madhya (mid-point, the cusp) to its Viram (end) — the next house's Arambha.")}</span>
        </caption>
        <thead>
          <tr className="border-b border-border text-left text-xs whitespace-nowrap text-muted">
            <th className="px-4 py-3">{tr("Bhava")}</th>
            <th className="px-4 py-3">{tr("Arambha (start)")}</th>
            <th className="px-4 py-3">{tr("Madhya (mid)")}</th>
            <th className="px-4 py-3">{tr("Viram (end)")}</th>
            <th className="px-4 py-3">{tr("Planets")}</th>
          </tr>
        </thead>
        <tbody className="whitespace-nowrap">
          {chart.bhavas.map((b, i) => {
            const next = chart.bhavas[(i + 1) % 12];
            const inside = chart.chalitHouses.filter((c) => c.house === b.house).map((c) => c.planet);
            return (
              <tr key={b.house} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-2.5 font-medium text-cream">{b.house}</td>
                <td className="px-4 py-2.5 text-muted">{at(b.start)}</td>
                <td className="px-4 py-2.5 text-cream">{at(b.madhya)}</td>
                <td className="px-4 py-2.5 text-muted">{at(next.start)}</td>
                <td className="px-4 py-2.5 text-muted">{inside.map(nm).join(", ") || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** 12.5083 → 12°30′30″ */
function formatDms(deg: number): string {
  const totalSeconds = Math.round(deg * 3600);
  const d = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const sec = totalSeconds % 60;
  return `${d}°${String(m).padStart(2, "0")}′${String(sec).padStart(2, "0")}″`;
}

function VargaTab({
  chart,
  title,
  blurb,
  divisionalChart,
  style,
  setStyle,
}: {
  chart: KundaliChart;
  title: VargaKey;
  blurb: string;
  divisionalChart: DivisionalChart;
  style: "north" | "south";
  setStyle: (s: "north" | "south") => void;
}) {
  const tr = useT();
  const locale = useLocale();
  const nm = (x: string) => term(locale, x);
  const inVarga = new Map(divisionalChart.planets.map((p) => [p.planet, p]));
  const markers = planetMarkers(chart, (pl) => inVarga.get(pl)!.signIndex, (pl) => inVarga.get(pl)!.retrograde, { vargottama: title === "D9" });
  const points: ChartPoint[] = divisionalChart.planets.map((p) => ({ ...p, markers: markers[p.planet] }));
  return (
    <div>
      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">{blurb}</p>
      <div className="mt-6">
        <StyleToggle style={style} setStyle={setStyle} />
      </div>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <KundliChart ascendantSignIndex={divisionalChart.ascendant.signIndex} planets={points} style={style} onStyleChange={setStyle} />

        <div className="card-edge overflow-x-auto rounded-2xl">
          <table className="w-full text-sm font-tabular">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted">
                <th className="px-4 py-3">{tr("Planet")}</th>
                <th className="px-4 py-3">{title} {tr("Sign")}</th>
                <th className="px-4 py-3">{title} {tr("House")}</th>
              </tr>
            </thead>
            <tbody>
              {divisionalChart.planets.map((p) => (
                <tr key={p.planet} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 font-medium text-cream">
                    <Link href={`/learn/planets#${p.planet}`} className="hover:text-gold-bright">
                      {nm(p.planet)}
                    </Link>
                    {markers[p.planet] && <span className="ml-1.5 text-xs font-semibold text-gold-bright">{[...markers[p.planet]].map((m) => markerText(m, locale)).join("")}</span>}
                  </td>
                  <td className="px-4 py-3 text-muted">{nm(p.sign)}</td>
                  <td className="px-4 py-3 text-muted">{p.house}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ChartDetail vargaKey={title} ascendantSignIndex={divisionalChart.ascendant.signIndex} planets={divisionalChart.planets} natal={chart} />
    </div>
  );
}

function MoreVargasTab({
  chart,
  style,
  setStyle,
}: {
  chart: KundaliChart;
  style: "north" | "south";
  setStyle: (s: "north" | "south") => void;
}) {
  const locale = useLocale();
  const [selected, setSelected] = useState<VargaKey>("D10");
  const info = vargaInfo(selected, locale);

  return (
    <div>
      <div className="flex justify-center">
        <SegmentedControl
          layoutId="more-vargas-picker"
          value={selected}
          onChange={setSelected}
          options={MORE_VARGA_KEYS.map((key) => ({ value: key, label: key }))}
        />
      </div>
      <h3 className="mt-6 text-center text-lg font-semibold text-cream">
        <Link href={`/learn/divisional-charts#${selected}`} className="hover:text-gold">
          {selected} · {info.title}
        </Link>
      </h3>
      <div className="mt-4">
        <VargaTab
          chart={chart}
          title={selected}
          blurb={info.blurb}
          divisionalChart={chart.divisionalCharts[selected]}
          style={style}
          setStyle={setStyle}
        />
      </div>
    </div>
  );
}

function AshtakavargaTab({ chart, style, setStyle }: { chart: KundaliChart; style: "north" | "south"; setStyle: (s: "north" | "south") => void }) {
  const tr = useT();
  const locale = useLocale();
  const nm = (x: string) => term(locale, x);
  const [selected, setSelected] = useState<AshtakavargaPlanet | "Sarva">("Sarva");
  const bindus = selected === "Sarva" ? chart.ashtakavarga.sarva : chart.ashtakavarga.bhinna[selected];

  return (
    <div>
      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
        {tr("Ashtakavarga scores each sign's benefic points (bindus) contributed by the seven classical planets and the Ascendant — a classical technique for weighing which signs, and later in transit which years, carry more support.")}
      </p>
      <div className="mt-6 flex justify-center">
        <SegmentedControl
          layoutId="ashtakavarga-picker"
          value={selected}
          onChange={setSelected}
          options={(["Sarva", ...ASHTAKAVARGA_PLANETS] as const).map((key) => ({ value: key, label: key === "Sarva" ? tr("Sarva") : nm(key) }))}
        />
      </div>
      <div className="mt-6">
        <StyleToggle style={style} setStyle={setStyle} />
      </div>
      <div className="mt-6">
        <AshtakavargaGrid
          bindus={bindus}
          ascendantSignIndex={chart.ascendant.signIndex}
          label={selected === "Sarva" ? tr("Sarvashtakavarga") : `${nm(selected)} ${tr("Bhinna")}`}
          style={style}
        />
      </div>
      <AshtakavargaHouseTable chart={chart} bindus={bindus} selected={selected} />
    </div>
  );
}

function AshtakavargaHouseTable({ chart, bindus, selected }: { chart: KundaliChart; bindus: number[]; selected: AshtakavargaPlanet | "Sarva" }) {
  const tr = useT();
  const locale = useLocale();
  const nm = (x: string) => term(locale, x);
  const sarva = selected === "Sarva";
  const verdict = (n: number) => (sarva ? (n >= 30 ? "Strong" : n <= 24 ? "Weak" : "Average") : n >= 5 ? "Strong" : n <= 2 ? "Weak" : "Average");
  const hi = locale === "hi";
  return (
    <div className="card-edge mx-auto mt-8 max-w-3xl overflow-x-auto rounded-2xl p-5">
      <p className="text-sm text-muted">
        {sarva
          ? tr("Houses with 28 or more bindus give good results, and transits through them go well; below 25, the house and its transits need care.")
          : hi
            ? `${nm(selected)} उस राशि में गोचर करते समय अच्छा फल देते हैं जिसमें उनके अपने 4 या अधिक बिंदु हों, और 3 या कम बिंदु वाली राशियों में संघर्ष करते हैं।`
            : `${selected} gives good results when it transits a sign with 4 or more of its own bindus, and struggles in signs with 3 or fewer.`}
      </p>
      <table className="mt-3 w-full min-w-[28rem] text-left text-sm">
        <thead className="text-xs text-muted">
          <tr className="border-b border-border">
            <th scope="col" className="py-2 pr-3 font-semibold">{tr("House")}</th>
            <th scope="col" className="py-2 pr-3 font-semibold">{tr("Sign")}</th>
            <th scope="col" className="py-2 pr-3 font-semibold">{tr("Bindus")}</th>
            <th scope="col" className="py-2 pr-3 font-semibold">{tr("Verdict")}</th>
            <th scope="col" className="py-2 font-semibold">{tr("Signifies")}</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 12 }, (_, i) => {
            const sign = (chart.ascendant.signIndex + i) % 12;
            const n = bindus[sign];
            const v = verdict(n);
            return (
              <tr key={i} className="border-b border-border/50 last:border-0">
                <td className="py-2 pr-3 font-semibold text-cream">{i + 1}</td>
                <td className="py-2 pr-3 text-muted">{nm(SIGNS[sign])}</td>
                <td className="font-tabular py-2 pr-3 text-cream">{n}</td>
                <td className={`py-2 pr-3 font-semibold ${v === "Strong" ? "text-gold-bright" : v === "Weak" ? "text-rose" : "text-muted"}`}>{nm(v)}</td>
                <td className="py-2 text-xs text-muted">{houseSignification(i + 1, locale)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DashaRow({ period, isCurrent }: { period: DashaPeriod; isCurrent: boolean }) {
  const locale = useLocale();
  const nm = (x: string) => term(locale, x);
  return (
    <li className={`flex justify-between border-b border-border/40 px-1 py-2.5 last:border-0 ${isCurrent ? "text-gold-bright" : "text-muted"}`}>
      <span className={isCurrent ? "font-semibold" : ""}>{nm(period.lord)}</span>
      <span>
        {formatDateShort(period.start, locale)} – {formatDateShort(period.end, locale)}
      </span>
    </li>
  );
}

function ExpandableAntardashaRow({ period, isCurrent }: { period: DashaPeriod; isCurrent: boolean }) {
  const locale = useLocale();
  const nm = (x: string) => term(locale, x);
  const [open, setOpen] = useState(false);
  const children = period.subPeriods ?? [];

  return (
    <li className="border-b border-border/40 px-1 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between py-2.5 text-left ${isCurrent ? "text-gold-bright" : "text-muted"}`}
      >
        <span className={`flex items-center gap-1.5 ${isCurrent ? "font-semibold" : ""}`}>
          <span className="inline-block text-[10px] transition-transform" style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>
            ▸
          </span>
          {nm(period.lord)}
        </span>
        <span>
          {formatDateShort(period.start, locale)} – {formatDateShort(period.end, locale)}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
            className="overflow-hidden pl-5"
          >
            {children.map((sub, i) => (
              <li key={i} className="flex justify-between border-t border-border/20 py-2 text-xs text-muted first:border-t-0">
                <span>{nm(sub.lord)}</span>
                <span>
                  {formatDateShort(sub.start, locale)} – {formatDateShort(sub.end, locale)}
                </span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}

function DashasTab({ chart, report }: { chart: KundaliChart; report: KundaliReport | null }) {
  const tr = useT();
  const locale = useLocale();
  const nm = (x: string) => term(locale, x);
  // The chart arrives as JSON, so match periods by start time rather than object identity.
  const same = (a: DashaPeriod, b: DashaPeriod | null) => !!b && String(a.start) === String(b.start) && a.lord === b.lord;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <DashaExplorer chart={chart} />
      <VimshottariDetail report={report} />
      <Card>
        <h3 className="text-xl font-bold tracking-tight text-cream">{tr("Vimshottari Mahadasha Timeline")}</h3>
        <p className="mt-2 text-xs text-muted">{tr("The 120-year Vimshottari cycle, starting from your Moon's nakshatra at birth.")}</p>
        <ul className="mt-5 text-sm">
          {chart.dashas.map((d, i) => (
            <DashaRow key={i} period={d} isCurrent={same(d, chart.currentDasha)} />
          ))}
        </ul>
      </Card>

      <div className="space-y-6">
        <Card>
          <h3 className="text-xl font-bold tracking-tight text-cream">
            {locale === "hi" ? `${chart.currentDasha ? nm(chart.currentDasha.lord) : "—"} महादशा की अंतर्दशाएँ` : `Antardashas within ${chart.currentDasha?.lord ?? "—"} Mahadasha`}
          </h3>
          <p className="mt-2 text-xs text-muted">{tr("Sub-periods of the Mahadasha you are currently running — click one to reveal its Pratyantardashas.")}</p>
          <ul className="mt-5 text-sm">
            {chart.antardashas.map((d, i) => (
              <ExpandableAntardashaRow key={i} period={d} isCurrent={same(d, chart.currentAntardasha)} />
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="text-xl font-bold tracking-tight text-cream">{tr("Sade Sati")}</h3>
          <p className="mt-4 text-sm leading-relaxed text-muted">{chart.sadeSati.description}</p>
        </Card>
      </div>

    </div>
  );
}

function YogasDoshasTab({ chart }: { chart: KundaliChart }) {
  const tr = useT();
  const sortedYogas = [...chart.yogas].sort((a, b) => Number(b.present) - Number(a.present));
  const sortedDoshas = [...chart.doshas].sort((a, b) => Number(b.present) - Number(a.present));

  return (
    <div className="space-y-6">
      <YogaAnalysisPanel chart={chart} />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="text-xl font-bold tracking-tight text-cream">{tr("Other classical yogas")}</h3>
          <ul className="mt-5 space-y-5">
            {sortedYogas.map((y) => (
              <li key={y.name}>
                <p className="text-sm font-semibold text-cream">
                  {y.name} — <span className={y.present ? "text-gold-bright" : "text-muted"}>{y.present ? tr("Present") : tr("Not present")}</span>
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{y.description}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="text-xl font-bold tracking-tight text-cream">{tr("Doshas")}</h3>
          <ul className="mt-5 space-y-5">
            {sortedDoshas.map((d) => (
              <li key={d.name}>
                <p className="text-sm font-semibold text-cream">
                  {d.name} —{" "}
                  <span className={d.present ? "text-rose" : d.cancelled ? "text-gold-bright" : "text-muted"}>
                    {d.present ? tr("Present") : d.cancelled ? tr("Present but cancelled") : tr("Not present")}
                  </span>
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{d.description}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <VargaYogasCard chart={chart} />
    </div>
  );
}

/** The same yoga rules read in the Navamsa and Dasamsa — a Rasi yoga that holds there is firmer; one that appears only there is a lesser, subject-specific echo. */
function VargaYogasCard({ chart }: { chart: KundaliChart }) {
  const tr = useT();
  const rasi = new Set(chart.yogas.filter((y) => y.present).map((y) => y.key ?? y.name));
  const sections = ([["D9", "Navamsa (D9) — marriage, dharma, a planet's true strength"], ["D10", "Dasamsa (D10) — career and public life"]] as const)
    .map(([k, title]) => ({ k, title, yogas: chart.vargaYogas?.[k] ?? [] }))
    .filter((x) => x.yogas.length > 0);
  if (!sections.length) return null;
  return (
    <Card>
      <h3 className="text-xl font-bold tracking-tight text-cream">{tr("Yogas in the divisional charts")}</h3>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        {tr("The Rasi chart decides whether a yoga exists. Here the same rules are read in the Navamsa and Dasamsa: a yoga that also forms there is firmer; one that forms only there is a lesser echo for that chart's subject.")}
      </p>
      <div className="mt-5 grid gap-6 md:grid-cols-2">
        {sections.map(({ k, title, yogas }) => (
          <div key={k}>
            <p className="text-sm font-semibold text-cream">{tr(title)}</p>
            <ul className="mt-3 space-y-2">
              {yogas.map((y) => (
                <li key={y.key ?? y.name} className="text-xs leading-relaxed text-muted">
                  <span className="font-semibold text-cream">{y.name}</span>{" — "}
                  <span className={rasi.has(y.key ?? y.name) ? "text-gold-bright" : ""}>{rasi.has(y.key ?? y.name) ? tr("also in the Rasi chart") : tr("only in this chart")}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}

function HouseLordsTab({ chart }: { chart: KundaliChart }) {
  const tr = useT();
  const locale = useLocale();
  const nm = (x: string) => term(locale, x);
  return (
    <div>
      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
        {tr("Each house is ruled by the lord of the sign that falls in it. Where that lord actually sits in your chart connects the two houses — a core technique for reading a Vedic chart in depth.")}
      </p>
      <div className="mt-8 card-edge overflow-x-auto rounded-2xl">
        <table className="w-full text-sm font-tabular">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-4 py-3">{tr("House")}</th>
              <th className="px-4 py-3">{tr("Signifies")}</th>
              <th className="px-4 py-3">{tr("Sign")}</th>
              <th className="px-4 py-3">{tr("Lord")}</th>
              <th className="px-4 py-3">{tr("Lord Placed In")}</th>
            </tr>
          </thead>
          <tbody>
            {chart.houseLords.map((hl) => (
              <tr key={hl.house} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-3 font-medium text-cream">
                  <Link href={`/learn/houses#house-${hl.house}`} className="hover:text-gold-bright">
                    {hl.house}
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs text-muted">{houseSignification(hl.house, locale)}</td>
                <td className="px-4 py-3 text-muted">{nm(hl.sign)}</td>
                <td className="px-4 py-3 text-cream">
                  <Link href={`/learn/planets#${hl.lord}`} className="hover:text-gold-bright">
                    {nm(hl.lord)}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">
                  {tr("House")} {hl.lordHouse} ({nm(hl.lordSign)})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
