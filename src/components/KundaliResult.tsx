"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import type { KundaliChart } from "@/lib/astrology/types";
import type { DashaPeriod } from "@/lib/astrology/dasha";
import { SIGN_SANSKRIT, ASHTAKAVARGA_PLANETS, VARGA_KEYS, type VargaKey, type AshtakavargaPlanet } from "@/lib/astrology/constants";
import { SIGN_KEYNOTE, PLANET_KEYNOTE, HOUSE_SIGNIFICATION, VARGA_INFO } from "@/lib/astrology/content";
import { analyzeBhavaStrength } from "@/lib/astrology/bhavaStrength";
import type { DivisionalChart } from "@/lib/astrology/types";
import ChartGrid from "@/components/ChartGrid";
import NorthIndianChart from "@/components/NorthIndianChart";
import AshtakavargaGrid from "@/components/AshtakavargaGrid";
import ShadbalaTable from "@/components/ShadbalaTable";
import ChartDetail from "@/components/ChartDetail";
import SegmentedControl from "@/components/SegmentedControl";
import PrintReport from "@/components/PrintReport";

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
const TABS = [
  "Overview",
  "D1 · Rasi Chart",
  "D9 · Navamsa",
  "More Vargas",
  "Ashtakavarga",
  "Shadbala",
  "Dashas",
  "Yogas & Doshas",
  "House Lords",
] as const;
type Tab = (typeof TABS)[number];

const MORE_VARGA_KEYS = VARGA_KEYS.filter((k) => k !== "D1" && k !== "D9");

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatDateShort(d: Date | string): string {
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short" });
}

export default function KundaliResult({ chart }: { chart: KundaliChart }) {
  const [tab, setTab] = useState<Tab>("Overview");
  const [style, setStyle] = useState<"north" | "south">("north");

  return (
    <div className="mt-20">
      <div className="gold-divider print:hidden" />
      <div className="print:hidden">
        <h2 className="mt-14 text-center text-4xl leading-[1.05] font-bold tracking-tight text-cream md:text-6xl">
          {chart.input.name ? `${chart.input.name}'s` : "Your"} Birth Chart
        </h2>
        <p className="mt-4 text-center text-base text-muted">
          Ascendant: <span className="text-gold-bright">{chart.ascendant.sign}</span> ·{" "}
          {chart.ascendant.degreeInSign.toFixed(2)}° · Ayanamsa {chart.ayanamsa.toFixed(2)}°
        </p>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full border border-gold/50 px-5 py-2 text-xs font-semibold text-gold-bright transition-colors hover:bg-gold/10"
          >
            Download PDF Report
          </button>
        </div>

        <div className="mt-10 flex justify-center">
          <div className="flex flex-wrap justify-center gap-1 rounded-full border border-border bg-ink-deep/90 p-1.5 shadow-lg">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className="relative rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap"
              >
                {tab === t && (
                  <motion.span
                    layoutId="active-tab-pill"
                    className="absolute inset-0 rounded-full bg-gold"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                <span className={`relative z-10 transition-colors ${tab === t ? "text-ink-deep" : "text-muted hover:text-cream"}`}>
                  {t}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
            >
              {tab === "Overview" && <OverviewTab chart={chart} />}
              {tab === "D1 · Rasi Chart" && <RasiTab chart={chart} style={style} setStyle={setStyle} />}
              {tab === "D9 · Navamsa" && (
                <VargaTab
                  title="D9"
                  blurb={VARGA_INFO.D9.blurb}
                  divisionalChart={chart.divisionalCharts.D9}
                  style={style}
                  setStyle={setStyle}
                />
              )}
              {tab === "More Vargas" && <MoreVargasTab chart={chart} style={style} setStyle={setStyle} />}
              {tab === "Ashtakavarga" && <AshtakavargaTab chart={chart} />}
              {tab === "Shadbala" && (
                <div>
                  <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
                    Shadbala weighs each planet&rsquo;s overall classical strength across six components — a
                    planet with low Shadbala is read as needing support from the rest of the chart to deliver
                    its significations fully.
                  </p>
                  <div className="mt-8">
                    <ShadbalaTable shadbala={chart.shadbala} />
                  </div>
                </div>
              )}
              {tab === "Dashas" && <DashasTab chart={chart} />}
              {tab === "Yogas & Doshas" && <YogasDoshasTab chart={chart} />}
              {tab === "House Lords" && <HouseLordsTab chart={chart} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="mt-16 text-center text-xs text-muted">
          Signs shown use the sidereal (Nirayana) zodiac —{" "}
          {SIGN_SANSKRIT[chart.ascendant.signIndex]} is the Sanskrit name for {chart.ascendant.sign}. This
          reading is generated from classical rules and is meant as a starting point, not a final word.{" "}
          <a href="/consultation" className="text-gold-bright hover:text-gold">
            Book a personal reading
          </a>{" "}
          for interpretation specific to you.
        </p>
      </div>

      <div className="hidden print:block">
        <PrintReport chart={chart} />
      </div>
    </div>
  );
}

function StyleToggle({ style, setStyle }: { style: "north" | "south"; setStyle: (s: "north" | "south") => void }) {
  return (
    <div className="flex justify-center">
      <SegmentedControl
        layoutId="chart-style-toggle"
        value={style}
        onChange={setStyle}
        options={[
          { value: "north", label: "North Indian" },
          { value: "south", label: "South Indian" },
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

const LIFE_AREA_LABEL: Partial<Record<number, string>> = {
  1: "your sense of self and vitality",
  4: "home and emotional foundation",
  5: "children and creativity",
  7: "relationships and partnership",
  9: "fortune and higher learning",
  10: "career and public standing",
};

function joinWithAnd(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function OverviewTab({ chart }: { chart: KundaliChart }) {
  const moon = chart.planets.find((p) => p.planet === "Moon")!;
  const sun = chart.planets.find((p) => p.planet === "Sun")!;
  const presentYogas = chart.yogas.filter((y) => y.present);
  const presentDoshas = chart.doshas.filter((d) => d.present);

  const pillarStrength = analyzeBhavaStrength(chart.ascendant.signIndex, chart.planets, chart.shadbala)
    .filter((b) => LIFE_AREA_LABEL[b.house])
    .sort((a, b) => b.score - a.score);
  const strongestAreas = joinWithAnd(pillarStrength.slice(0, 2).map((b) => LIFE_AREA_LABEL[b.house]!));
  const weakestAreas = joinWithAnd(
    [...pillarStrength]
      .sort((a, b) => a.score - b.score)
      .slice(0, 2)
      .map((b) => LIFE_AREA_LABEL[b.house]!)
  );

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <SummaryCard title="Ascendant (Lagna)" sign={chart.ascendant.sign}>
        Your outward personality and life direction lean {SIGN_KEYNOTE[chart.ascendant.sign]}.
      </SummaryCard>
      <SummaryCard title="Moon Sign (Rashi)" sign={moon.sign}>
        Your inner emotional world tends to be {SIGN_KEYNOTE[moon.sign]}.
      </SummaryCard>
      <SummaryCard title="Sun Sign" sign={sun.sign}>
        Your core sense of identity is {SIGN_KEYNOTE[sun.sign]}.
      </SummaryCard>

      <Card className="md:col-span-3">
        <h3 className="text-xl font-bold tracking-tight text-gold-bright">Where You Are Now</h3>
        {chart.currentDasha ? (
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
          <p className="mt-4 text-sm text-muted">No active dasha period found for the current date.</p>
        )}
        {chart.sadeSati.active && (
          <p className="mt-4 rounded-xl border border-gold/30 bg-gold/5 px-5 py-4 text-sm text-cream">
            You are currently in the <span className="font-semibold text-gold-bright">{chart.sadeSati.phase}</span> phase
            of Sade Sati — Saturn&rsquo;s transit through the signs around your natal Moon.
          </p>
        )}
      </Card>

      <Card className="md:col-span-3">
        <h3 className="text-xl font-bold tracking-tight text-gold-bright">Planet Strength</h3>
        <p className="mt-2 text-sm text-muted">
          Each planet&rsquo;s Shadbala rupas against what it classically needs to act at full strength.
        </p>
        <div className="mt-5 space-y-3">
          {chart.shadbala.map((s) => {
            const pct = Math.max(0, Math.min(100, (s.rupas / s.requiredRupas) * 100));
            return (
              <div key={s.planet}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-cream">{s.planet}</span>
                  <span className={s.isStrong ? "text-gold-bright" : "text-rose"}>
                    {s.rupas.toFixed(2)} / {s.requiredRupas} rupas
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
          Reading across all nine planets, <span className="text-cream">{strongestAreas}</span> come through as your
          most solidly supported areas, while <span className="text-cream">{weakestAreas}</span> could use the most
          conscious attention.
        </p>
      </Card>

      <Card>
        <h3 className="text-xl font-bold tracking-tight text-gold-bright">Yogas Present</h3>
        {presentYogas.length === 0 ? (
          <p className="mt-4 text-sm text-muted">None of the classical combinations checked are present in this chart.</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm text-cream">
            {presentYogas.map((y) => (
              <li key={y.name}>• {y.name}</li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="md:col-span-2">
        <h3 className="text-xl font-bold tracking-tight text-gold-bright">Doshas Flagged</h3>
        {presentDoshas.length === 0 ? (
          <p className="mt-4 text-sm text-muted">None of the doshas checked are indicated in this chart.</p>
        ) : (
          <ul className="mt-4 space-y-1.5 text-sm text-cream">
            {presentDoshas.map((d) => (
              <li key={d.name}>• {d.name}</li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-muted">See the &ldquo;Yogas & Doshas&rdquo; tab for the reasoning behind each.</p>
      </Card>
    </div>
  );
}

function SummaryCard({ title, sign, children }: { title: string; sign: string; children: React.ReactNode }) {
  return (
    <Card>
      <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">{title}</h3>
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
  return (
    <div>
      <StyleToggle style={style} setStyle={setStyle} />
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        {style === "north" ? (
          <NorthIndianChart ascendantSignIndex={chart.ascendant.signIndex} planets={chart.planets} />
        ) : (
          <ChartGrid ascendantSignIndex={chart.ascendant.signIndex} planets={chart.planets} />
        )}

        <div className="card-edge overflow-x-auto rounded-2xl">
          <table className="w-full text-sm font-tabular">
            <thead>
              <tr className="border-b border-border text-left text-xs tracking-wide text-muted uppercase">
                <th className="px-4 py-3">Planet</th>
                <th className="px-4 py-3">Sign</th>
                <th className="px-4 py-3">Degree</th>
                <th className="px-4 py-3">House</th>
                <th className="px-4 py-3">Nakshatra</th>
                <th className="px-4 py-3">Dignity</th>
              </tr>
            </thead>
            <tbody>
              {chart.planets.map((p) => (
                <tr key={p.planet} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 font-medium text-cream">
                    <Link href={`/learn/planets#${p.planet}`} className="hover:text-gold-bright">
                      {p.planet}
                    </Link>
                    {p.retrograde && <span className="ml-1 text-xs text-rose">(R)</span>}
                  </td>
                  <td className="px-4 py-3 text-muted">{p.sign}</td>
                  <td className="px-4 py-3 text-muted">{p.degreeInSign.toFixed(2)}°</td>
                  <td className="px-4 py-3 text-muted">{p.house}</td>
                  <td className="px-4 py-3 text-muted">
                    {p.nakshatra} <span className="text-xs">(pada {p.pada})</span>
                  </td>
                  <td className="px-4 py-3">
                    {p.dignity ? (
                      <span
                        className={
                          p.dignity === "Exalted" || p.dignity === "Moolatrikona"
                            ? "text-gold-bright"
                            : p.dignity === "Debilitated"
                              ? "text-rose"
                              : p.dignity === "Own Sign"
                                ? "text-gold"
                                : "text-muted"
                        }
                      >
                        {p.dignity}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ChartDetail vargaKey="D1" ascendantSignIndex={chart.ascendant.signIndex} planets={chart.planets} shadbala={chart.shadbala} />
    </div>
  );
}

function VargaTab({
  title,
  blurb,
  divisionalChart,
  style,
  setStyle,
}: {
  title: VargaKey;
  blurb: string;
  divisionalChart: DivisionalChart;
  style: "north" | "south";
  setStyle: (s: "north" | "south") => void;
}) {
  return (
    <div>
      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">{blurb}</p>
      <div className="mt-6">
        <StyleToggle style={style} setStyle={setStyle} />
      </div>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        {style === "north" ? (
          <NorthIndianChart ascendantSignIndex={divisionalChart.ascendant.signIndex} planets={divisionalChart.planets} />
        ) : (
          <ChartGrid ascendantSignIndex={divisionalChart.ascendant.signIndex} planets={divisionalChart.planets} />
        )}

        <div className="card-edge overflow-x-auto rounded-2xl">
          <table className="w-full text-sm font-tabular">
            <thead>
              <tr className="border-b border-border text-left text-xs tracking-wide text-muted uppercase">
                <th className="px-4 py-3">Planet</th>
                <th className="px-4 py-3">{title} Sign</th>
                <th className="px-4 py-3">{title} House</th>
              </tr>
            </thead>
            <tbody>
              {divisionalChart.planets.map((p) => (
                <tr key={p.planet} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 font-medium text-cream">
                    <Link href={`/learn/planets#${p.planet}`} className="hover:text-gold-bright">
                      {p.planet}
                    </Link>
                    {p.retrograde && <span className="ml-1 text-xs text-rose">(R)</span>}
                  </td>
                  <td className="px-4 py-3 text-muted">{p.sign}</td>
                  <td className="px-4 py-3 text-muted">{p.house}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ChartDetail vargaKey={title} ascendantSignIndex={divisionalChart.ascendant.signIndex} planets={divisionalChart.planets} />
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
  const [selected, setSelected] = useState<VargaKey>("D10");
  const info = VARGA_INFO[selected];

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
      <h3 className="mt-6 text-center text-lg font-semibold text-gold-bright">
        <Link href={`/learn/divisional-charts#${selected}`} className="hover:text-gold">
          {selected} · {info.title}
        </Link>
      </h3>
      <div className="mt-4">
        <VargaTab
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

function AshtakavargaTab({ chart }: { chart: KundaliChart }) {
  const [selected, setSelected] = useState<AshtakavargaPlanet | "Sarva">("Sarva");
  const bindus = selected === "Sarva" ? chart.ashtakavarga.sarva : chart.ashtakavarga.bhinna[selected];

  return (
    <div>
      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
        Ashtakavarga scores each sign&rsquo;s benefic points (bindus) contributed by the seven classical planets
        and the Ascendant — a classical technique for weighing which signs, and later in transit which years,
        carry more support.
      </p>
      <div className="mt-6 flex justify-center">
        <SegmentedControl
          layoutId="ashtakavarga-picker"
          value={selected}
          onChange={setSelected}
          options={(["Sarva", ...ASHTAKAVARGA_PLANETS] as const).map((key) => ({ value: key, label: key }))}
        />
      </div>
      <div className="mt-8">
        <AshtakavargaGrid
          bindus={bindus}
          ascendantSignIndex={chart.ascendant.signIndex}
          label={selected === "Sarva" ? "Sarvashtakavarga" : `${selected} Bhinna`}
        />
      </div>
    </div>
  );
}

function DashaRow({ period, isCurrent }: { period: DashaPeriod; isCurrent: boolean }) {
  return (
    <li className={`flex justify-between border-b border-border/40 px-1 py-2.5 last:border-0 ${isCurrent ? "text-gold-bright" : "text-muted"}`}>
      <span className={isCurrent ? "font-semibold" : ""}>{period.lord}</span>
      <span>
        {formatDateShort(period.start)} – {formatDateShort(period.end)}
      </span>
    </li>
  );
}

function ExpandableAntardashaRow({ period, isCurrent }: { period: DashaPeriod; isCurrent: boolean }) {
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
          {period.lord}
        </span>
        <span>
          {formatDateShort(period.start)} – {formatDateShort(period.end)}
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
                <span>{sub.lord}</span>
                <span>
                  {formatDateShort(sub.start)} – {formatDateShort(sub.end)}
                </span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}

function DashasTab({ chart }: { chart: KundaliChart }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <h3 className="text-xl font-bold tracking-tight text-gold-bright">Vimshottari Mahadasha Timeline</h3>
        <p className="mt-2 text-xs text-muted">
          The 120-year Vimshottari cycle, starting from your Moon&rsquo;s nakshatra at birth.
        </p>
        <ul className="mt-5 text-sm">
          {chart.dashas.map((d, i) => (
            <DashaRow key={i} period={d} isCurrent={d === chart.currentDasha} />
          ))}
        </ul>
      </Card>

      <div className="space-y-6">
        <Card>
          <h3 className="text-xl font-bold tracking-tight text-gold-bright">
            Antardashas within {chart.currentDasha?.lord ?? "—"} Mahadasha
          </h3>
          <p className="mt-2 text-xs text-muted">
            Sub-periods of the Mahadasha you are currently running — click one to reveal its Pratyantardashas.
          </p>
          <ul className="mt-5 text-sm">
            {chart.antardashas.map((d, i) => (
              <ExpandableAntardashaRow key={i} period={d} isCurrent={d === chart.currentAntardasha} />
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="text-xl font-bold tracking-tight text-gold-bright">Sade Sati</h3>
          <p className="mt-4 text-sm leading-relaxed text-muted">{chart.sadeSati.description}</p>
        </Card>
      </div>
    </div>
  );
}

function YogasDoshasTab({ chart }: { chart: KundaliChart }) {
  const sortedYogas = [...chart.yogas].sort((a, b) => Number(b.present) - Number(a.present));
  const sortedDoshas = [...chart.doshas].sort((a, b) => Number(b.present) - Number(a.present));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <h3 className="text-xl font-bold tracking-tight text-gold-bright">Yogas</h3>
        <ul className="mt-5 space-y-5">
          {sortedYogas.map((y) => (
            <li key={y.name}>
              <p className="text-sm font-semibold text-cream">
                {y.name} — <span className={y.present ? "text-gold-bright" : "text-muted"}>{y.present ? "Present" : "Not present"}</span>
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{y.description}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h3 className="text-xl font-bold tracking-tight text-gold-bright">Doshas</h3>
        <ul className="mt-5 space-y-5">
          {sortedDoshas.map((d) => (
            <li key={d.name}>
              <p className="text-sm font-semibold text-cream">
                {d.name} — <span className={d.present ? "text-rose" : "text-muted"}>{d.present ? "Present" : "Not present"}</span>
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{d.description}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function HouseLordsTab({ chart }: { chart: KundaliChart }) {
  return (
    <div>
      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted">
        Each house is ruled by the lord of the sign that falls in it. Where that lord actually sits in your
        chart connects the two houses — a core technique for reading a Vedic chart in depth.
      </p>
      <div className="mt-8 card-edge overflow-x-auto rounded-2xl">
        <table className="w-full text-sm font-tabular">
          <thead>
            <tr className="border-b border-border text-left text-xs tracking-wide text-muted uppercase">
              <th className="px-4 py-3">House</th>
              <th className="px-4 py-3">Signifies</th>
              <th className="px-4 py-3">Sign</th>
              <th className="px-4 py-3">Lord</th>
              <th className="px-4 py-3">Lord Placed In</th>
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
                <td className="px-4 py-3 text-xs text-muted">{HOUSE_SIGNIFICATION[hl.house]}</td>
                <td className="px-4 py-3 text-muted">{hl.sign}</td>
                <td className="px-4 py-3 text-cream">
                  <Link href={`/learn/planets#${hl.lord}`} className="hover:text-gold-bright">
                    {hl.lord}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">
                  House {hl.lordHouse} ({hl.lordSign})
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
