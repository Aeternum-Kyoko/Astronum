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

/** The written, detailed part of a kundli — computed server-side alongside the chart. */
export interface KundaliReport {
  planets: PlanetReading[];
  lifeAreas: LifeAreaReading[];
  dashas: DashaReading[];
  transits: CurrentTransit[];
  saturnCycles: SaturnCycle[];
  houses: HouseReading[];
  career: CareerAnalysis;
  timeline: LifeTimeline;
  dashaDetail: MahaInterpretation[];
  yogini: YoginiPeriod[];
  chara: { karakas: Karaka[]; periods: (CharaPeriod & { reading: string[] })[] };
  kp: KpAnalysis;
  sectors: LifeSector[];
  generatedAt: Date;
}

export function buildReport(chart: KundaliChart, now = new Date()): KundaliReport {
  const moon = chart.planets.find((p) => p.planet === "Moon")!;
  const birth = new Date(chart.utcDate);
  const lifespanEnd = new Date(birth.getTime() + 100 * 365.25 * 86400_000);
  const career = careerAnalysis(chart, now);
  const timeline = lifeTimeline(chart);
  const karakas = charaKarakas(chart);
  return {
    planets: planetReadings(chart),
    lifeAreas: lifeAreaReadings(chart, now),
    dashas: dashaReadings(chart),
    transits: currentTransits(moon.signIndex, chart.ascendant.signIndex, now),
    saturnCycles: saturnCycles(moon.signIndex, birth, lifespanEnd),
    houses: houseReadings(chart, now),
    career,
    timeline,
    dashaDetail: interpretDashas(chart, timeline, now),
    yogini: yoginiDasha(moon.siderealLongitude, birth, 100),
    chara: { karakas, periods: charaDasha(chart, 100).map((p) => ({ ...p, reading: charaReading(chart, p, karakas) })) },
    kp: kpAnalysis(chart, now),
    sectors: lifeSectors(chart, timeline, career),
    generatedAt: now,
  };
}
