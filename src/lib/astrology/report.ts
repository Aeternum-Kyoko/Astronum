import type { KundaliChart } from "./types";
import { dashaReadings, lifeAreaReadings, planetReadings, type DashaReading, type LifeAreaReading, type PlanetReading } from "./predictions";
import { currentTransits, saturnCycles, type CurrentTransit, type SaturnCycle } from "./transits";
import { houseReadings, type HouseReading } from "./houseReadings";
import { careerAnalysis, type CareerAnalysis } from "./careerAnalysis";
import { lifeTimeline, type LifeTimeline } from "./lifeTimeline";
import { interpretDashas, type MahaInterpretation } from "./dashaInterpretation";
import { yoginiDasha, type YoginiPeriod } from "./yoginiDasha";
import { charaDasha, charaKarakas, charaReading, type CharaPeriod, type Karaka } from "./charaDasha";
import { kpAnalysis, type KpAnalysis } from "./kp";
import { lifeSectors, type LifeSector } from "./lifeSectors";
import { monthlyForecast, type MonthlyForecast } from "./monthlyForecast";
import type { Locale } from "../i18n/locale";

/** The quick, always-sent part of a kundli's written report. */
export interface CoreReport {
  planets: PlanetReading[];
  lifeAreas: LifeAreaReading[];
  dashas: DashaReading[];
  transits: CurrentTransit[];
  saturnCycles: SaturnCycle[];
  generatedAt: Date;
}

/** The heavier sections, computed only when a tab asks for them. */
export interface HeavyReport {
  houses: HouseReading[];
  career: CareerAnalysis;
  timeline: LifeTimeline;
  dashaDetail: MahaInterpretation[];
  yogini: YoginiPeriod[];
  chara: { karakas: Karaka[]; periods: (CharaPeriod & { reading: string[] })[] };
  kp: KpAnalysis;
  sectors: LifeSector[];
  monthly: MonthlyForecast;
}

export const HEAVY_SECTIONS = ["houses", "career", "timeline", "dashaDetail", "yogini", "chara", "kp", "sectors", "monthly"] as const satisfies readonly (keyof HeavyReport)[];
export type HeavySection = (typeof HEAVY_SECTIONS)[number];

/** What the browser holds: the core report plus whichever heavy sections have loaded. */
export type KundaliReport = CoreReport & Partial<HeavyReport>;
/** Everything at once — for the PDF and anywhere else that needs the whole report. */
export type FullReport = CoreReport & HeavyReport;

export function buildCoreReport(chart: KundaliChart, now = new Date(), locale: Locale = "en"): CoreReport {
  const moon = chart.planets.find((p) => p.planet === "Moon")!;
  const birth = new Date(chart.utcDate);
  const lifespanEnd = new Date(birth.getTime() + 100 * 365.25 * 86400_000);
  return {
    planets: planetReadings(chart, locale),
    lifeAreas: lifeAreaReadings(chart, now, locale),
    dashas: dashaReadings(chart, locale),
    transits: currentTransits(moon.signIndex, chart.ascendant.signIndex, now),
    saturnCycles: saturnCycles(moon.signIndex, birth, lifespanEnd),
    generatedAt: now,
  };
}

/** The requested heavy sections, computing shared inputs (timeline, career) only once. */
export function buildSections(chart: KundaliChart, sections: readonly HeavySection[], now = new Date(), locale: Locale = "en"): Partial<HeavyReport> {
  const want = new Set(sections);
  const out: Partial<HeavyReport> = {};
  const moon = chart.planets.find((p) => p.planet === "Moon")!;
  const birth = new Date(chart.utcDate);
  let timeline: LifeTimeline | undefined;
  let career: CareerAnalysis | undefined;
  const getTimeline = () => (timeline ??= lifeTimeline(chart, 90, locale));
  const getCareer = () => (career ??= careerAnalysis(chart, now, locale));
  if (want.has("houses")) out.houses = houseReadings(chart, now, locale);
  if (want.has("career")) out.career = getCareer();
  if (want.has("timeline")) out.timeline = getTimeline();
  if (want.has("dashaDetail")) out.dashaDetail = interpretDashas(chart, getTimeline(), now);
  if (want.has("yogini")) out.yogini = yoginiDasha(moon.siderealLongitude, birth, 100);
  if (want.has("chara")) {
    const karakas = charaKarakas(chart);
    out.chara = { karakas, periods: charaDasha(chart, 100).map((p) => ({ ...p, reading: charaReading(chart, p, karakas) })) };
  }
  if (want.has("kp")) out.kp = kpAnalysis(chart, now);
  if (want.has("sectors")) out.sectors = lifeSectors(chart, getTimeline(), getCareer());
  if (want.has("monthly")) out.monthly = monthlyForecast(chart, now);
  return out;
}

export function buildReport(chart: KundaliChart, now = new Date(), locale: Locale = "en"): FullReport {
  return { ...buildCoreReport(chart, now, locale), ...(buildSections(chart, HEAVY_SECTIONS, now, locale) as HeavyReport) };
}
