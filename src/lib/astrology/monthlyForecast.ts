import * as Astronomy from "astronomy-engine";
import { DateTime } from "luxon";
import { NAKSHATRAS, SIGN_LORDS, SIGNS, type AshtakavargaPlanet, type PlanetName, type VargaKey } from "./constants";
import { getAspectedHouses } from "./aspects";
import { periodsAt, childPeriods, type TreePeriod } from "./dashaTree";
import { isRetrograde, siderealLongitude, type TransitBody } from "./ephemeris";
import { GOCHARA_GOOD } from "./transits";
import { prastarashtakavarga } from "./kundliTables";
import { planetDiagnosis, type PlanetDiagnosis } from "./planetDiagnosis";
import { readPlanets, readHora } from "./vargaReading";
import { PLANET_REMEDIES } from "./remedies";
import { bhagyank, moolank, reduceToDigit, FRIENDLY, NUMBER_MEANINGS } from "../numerology";
import type { KundaliChart } from "./types";

/**
 * A month-by-month forecast for one person, reading every technique together
 * the way an astrologer would before answering "how will this month go?":
 *
 *  - Vimshottari dasha: the Mahadasha, Antardasha and each Pratyantardasha
 *    running that month — which houses each lord signifies (by placement,
 *    lordship, aspect and its star lord), how strong it is natally (the full
 *    planet diagnosis), and how it stands in the varga that governs each area
 *    (D10 for career, D9 for marriage, D4 for home, D24 for learning, D2 for
 *    wealth, D30 for health risks).
 *  - Gochara: every planet's transit from the natal Moon (classical good
 *    houses, Vedha obstruction, its own Bhinnashtakavarga bindus, and the
 *    3°45′ kakshya for Jupiter and Saturn) and from the Lagna (which houses the
 *    slow planets occupy or aspect, the Jupiter–Saturn double transit, and the
 *    Sarvashtakavarga strength of those signs). Sade Sati and Ashtama Shani.
 *  - Exact events: sign changes, retrograde stations, Pratyantardasha changes,
 *    slow planets crossing natal planets, eclipses near natal points, and the
 *    Chandrashtama days of the month.
 *  - Numerology: the personal year and month, checked against the Moolank
 *    and Bhagyank.
 *  - Sun-sign and Moon-sign views of the month.
 * Every score is the sum of listed reasons, so each verdict can be traced.
 */

const DAY = 86400_000;
const PLANETS9: PlanetName[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
const SLOW: PlanetName[] = ["Jupiter", "Saturn", "Rahu", "Ketu"];
const BENEFIC = new Set<PlanetName>(["Jupiter", "Venus", "Mercury", "Moon"]);
const UPACHAYA = [3, 6, 10, 11];

const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const houseFrom = (sign: number, from: number) => ((sign - from + 12) % 12) + 1;
const listJoin = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const angle = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

/** Phaladeepika's Vedha: a good transit house is blocked when another planet sits in its paired house (counted from the Moon). */
const VEDHA: Partial<Record<PlanetName, Record<number, number>>> = {
  Sun: { 3: 9, 6: 12, 10: 4, 11: 5 },
  Mars: { 3: 12, 6: 9, 11: 5 },
  Mercury: { 2: 5, 4: 3, 6: 9, 8: 1, 10: 8, 11: 12 },
  Jupiter: { 2: 12, 5: 4, 7: 3, 9: 10, 11: 8 },
  Venus: { 1: 8, 2: 7, 3: 1, 4: 10, 5: 9, 8: 5, 9: 11, 11: 3, 12: 6 },
  Saturn: { 3: 12, 6: 9, 11: 5 },
  Rahu: { 3: 12, 6: 9, 11: 5 },
  Ketu: { 3: 12, 6: 9, 11: 5 },
};
/** Pairs exempt from Vedha on each other. */
const NO_VEDHA: [PlanetName, PlanetName][] = [
  ["Sun", "Saturn"],
  ["Moon", "Mercury"],
  ["Rahu", "Ketu"],
];

/** Kakshya lords of the eight 3°45′ divisions of every sign. */
const KAKSHYA = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon", "Ascendant"] as const;

const GOCHARA_WEIGHT: Partial<Record<PlanetName, number>> = { Jupiter: 5, Saturn: 5, Rahu: 2, Ketu: 1, Sun: 2, Mars: 2, Venus: 1.5, Mercury: 1.5 };

export type AreaKey = "career" | "money" | "love" | "health" | "home" | "growth";

interface AreaDef {
  key: AreaKey;
  label: string;
  houses: number[];
  primary: number;
  varga: VargaKey;
  /** Houses whose activation counts against this area (health only). */
  risk?: number[];
  short: string;
}

export const AREAS: AreaDef[] = [
  { key: "career", label: "Career & work", houses: [10, 6, 11, 2], primary: 10, varga: "D10", short: "career" },
  { key: "money", label: "Money & gains", houses: [11, 2, 5, 9], primary: 11, varga: "D2", short: "money" },
  { key: "love", label: "Love & marriage", houses: [7, 5, 11, 2], primary: 7, varga: "D9", short: "relationships" },
  { key: "health", label: "Health & energy", houses: [1], primary: 1, varga: "D30", risk: [6, 8, 12], short: "health" },
  { key: "home", label: "Home & family", houses: [4, 2, 9], primary: 4, varga: "D4", short: "home life" },
  { key: "growth", label: "Learning & spirit", houses: [9, 5, 4, 12], primary: 9, varga: "D24", short: "learning and inner growth" },
];

export interface Reason {
  text: string;
  points: number;
  source: "Dasha" | "Transit" | "Gochara" | "Ashtakavarga" | "Numerology" | "Chart";
}

export interface AreaForecast {
  key: AreaKey;
  label: string;
  score: number;
  verdict: Verdict;
  text: string;
  reasons: Reason[];
}

export type Verdict = "Excellent" | "Favourable" | "Mixed" | "Challenging" | "Difficult";
const verdictOf = (s: number): Verdict => (s >= 68 ? "Excellent" : s >= 57 ? "Favourable" : s >= 45 ? "Mixed" : s >= 35 ? "Challenging" : "Difficult");

export interface TransitInfo {
  planet: PlanetName;
  sign: string;
  degree: number;
  retrograde: boolean;
  houseFromLagna: number;
  houseFromMoon: number;
  houseFromSun: number;
  favourable: boolean;
  vedhaBy: PlanetName | null;
  bindus: number | null;
  sav: number;
  kakshya: { lord: string; good: boolean } | null;
  note: string;
}

export interface KeyDate {
  date: string; // YYYY-MM-DD
  text: string;
  tone: "good" | "hard" | "neutral";
}

export interface MonthForecast {
  month: string; // YYYY-MM
  label: string;
  dasha: { maha: string; antar: string; pratyantars: { lord: string; start: string; end: string }[]; text: string };
  score: number;
  verdict: Verdict;
  headline: string;
  areas: AreaForecast[];
  transits: TransitInfo[];
  gochara: Reason[];
  keyDates: KeyDate[];
  chandrashtama: { start: string; end: string }[];
  numerology: { personalYear: number; personalMonth: number; supportive: boolean; text: string };
  moonSign: string;
  sunSign: string;
  focus: string[];
  remedy: { planet: PlanetName; text: string } | null;
}

export interface ForecastSummary {
  bestMonth: string;
  hardestMonth: string;
  bestFor: Record<AreaKey, string>;
  trend: { month: string; label: string; score: number }[];
  text: string;
}

export interface MonthlyForecast {
  diagnosis: PlanetDiagnosis[];
  months: MonthForecast[];
  summary: ForecastSummary;
}

// ——— Natal significations ———————————————————————————————————————————

/** Which houses a planet signifies natally, with weights: placement and lordship fully, aspects and its star lord's houses in part. */
function significations(chart: KundaliChart, planet: PlanetName): Map<number, number> {
  const asc = chart.ascendant.signIndex;
  const out = new Map<number, number>();
  const add = (h: number, w: number) => out.set(h, Math.min(1.5, (out.get(h) ?? 0) + w));
  const p = chart.planets.find((x) => x.planet === planet)!;
  add(p.house, 1);
  for (let h = 1; h <= 12; h++) if (SIGN_LORDS[(asc + h - 1) % 12] === planet) add(h, 1);
  for (const d of getAspectedHouses(planet)) add(((p.house + d - 2) % 12) + 1, 0.4);
  const starLord = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"][p.nakshatraIndex % 9] as PlanetName;
  if (starLord !== planet) {
    const s = chart.planets.find((x) => x.planet === starLord)!;
    add(s.house, 0.5);
    for (let h = 1; h <= 12; h++) if (SIGN_LORDS[(asc + h - 1) % 12] === starLord) add(h, 0.4);
  }
  return out;
}

// ——— Numerology ——————————————————————————————————————————————————————

const PERSONAL_THEME: Record<number, string> = {
  1: "new beginnings, initiative and standing on your own",
  2: "patience, partnership and quiet diplomacy",
  3: "expression, social life and creative growth",
  4: "hard work, structure and putting things in order",
  5: "change, travel and new opportunities",
  6: "family, home, love and responsibility",
  7: "reflection, study and inner work",
  8: "money, power, ambition and karmic results",
  9: "completion, letting go and generosity",
};

export function personalYear(birthDate: string, year: number): number {
  return reduceToDigit(Number(birthDate.slice(8, 10)) + Number(birthDate.slice(5, 7)) + reduceToDigit(year));
}

// ——— Ephemeris helpers ——————————————————————————————————————————————

function positionsAt(at: Date) {
  return PLANETS9.map((planet) => {
    const lon = siderealLongitude(planet as TransitBody, at);
    const retro = planet === "Rahu" || planet === "Ketu" ? true : planet === "Sun" || planet === "Moon" ? false : isRetrograde(planet as never, at);
    return { planet, lon, signIndex: Math.floor(lon / 30), retrograde: retro };
  });
}

const isoUtc = (d: Date) => d.toISOString().slice(0, 10);
const fmtDay = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/** The moment between a and b (to the minute) where `f` changes value, assuming it changes once. */
function bisect<T>(a: Date, b: Date, f: (d: Date) => T): Date {
  let lo = a.getTime();
  let hi = b.getTime();
  const start = f(a);
  while (hi - lo > 60_000) {
    const mid = (lo + hi) / 2;
    if (f(new Date(mid)) === start) lo = mid;
    else hi = mid;
  }
  return new Date(hi);
}

interface Eclipse {
  date: Date;
  kind: "Solar" | "Lunar";
  lon: number;
}

function eclipsesBetween(from: Date, to: Date): Eclipse[] {
  const out: Eclipse[] = [];
  let lunar = Astronomy.SearchLunarEclipse(from);
  while (lunar.peak.date < to) {
    if (lunar.kind !== Astronomy.EclipseKind.Penumbral) out.push({ date: lunar.peak.date, kind: "Lunar", lon: siderealLongitude("Moon", lunar.peak.date) });
    lunar = Astronomy.NextLunarEclipse(lunar.peak);
  }
  let solar = Astronomy.SearchGlobalSolarEclipse(from);
  while (solar.peak.date < to) {
    out.push({ date: solar.peak.date, kind: "Solar", lon: siderealLongitude("Sun", solar.peak.date) });
    solar = Astronomy.NextGlobalSolarEclipse(solar.peak);
  }
  return out;
}

// ——— The forecast ————————————————————————————————————————————————————

export function monthlyForecast(chart: KundaliChart, now = new Date(), months = 12): MonthlyForecast {
  const asc = chart.ascendant.signIndex;
  const moon = chart.planets.find((p) => p.planet === "Moon")!;
  const sun = chart.planets.find((p) => p.planet === "Sun")!;
  // Dates are given as calendar days at the birth place, the best proxy for where the person lives.
  const iso = (d: Date) => DateTime.fromJSDate(d, { zone: chart.input.timezone }).toISODate() ?? isoUtc(d);
  const diagnosis = planetDiagnosis(chart);
  const diag = new Map(diagnosis.map((d) => [d.planet, d]));
  const sigs = new Map(PLANETS9.map((p) => [p, significations(chart, p)]));
  const natalSigns = Object.fromEntries(chart.planets.map((p) => [p.planet, p.signIndex]));

  // Each dasha lord's standing in the varga that governs each area.
  const vargaScore = new Map<string, number>();
  for (const area of AREAS) {
    if (area.varga === "D2") {
      const hora = readHora({ varga: "D2", ascendantSignIndex: chart.divisionalCharts.D2.ascendant.signIndex, planets: chart.divisionalCharts.D2.planets });
      for (const p of PLANETS9) {
        const inSun = hora.sun.includes(p);
        vargaScore.set(`${area.key}:${p}`, (inSun ? !BENEFIC.has(p) : BENEFIC.has(p)) ? 0.5 : -0.3);
      }
      continue;
    }
    const v = chart.divisionalCharts[area.varga];
    for (const r of readPlanets({ varga: area.varga, ascendantSignIndex: v.ascendant.signIndex, planets: v.planets, natalSigns })) {
      vargaScore.set(`${area.key}:${r.planet}`, (r.score - 50) / 50);
    }
  }

  const bav = (p: PlanetName) => (chart.ashtakavarga.bhinna as Record<string, number[]>)[p];
  const prastara = new Map<string, ReturnType<typeof prastarashtakavarga>>();
  for (const p of ["Jupiter", "Saturn"] as AshtakavargaPlanet[]) prastara.set(p, prastarashtakavarga(chart, p));

  const mool = moolank(chart.input.date);
  const bhag = bhagyank(chart.input.date);
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + months, 1));
  const eclipses = eclipsesBetween(start, end);
  const natalPoints = [...chart.planets.map((p) => ({ name: p.planet as string, lon: p.siderealLongitude })), { name: "Lagna", lon: chart.ascendant.siderealLongitude }];

  const out: MonthForecast[] = [];
  for (let m = 0; m < months; m++) {
    const mStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + m, 1));
    const mEnd = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + m + 1, 1));
    const mid = new Date((mStart.getTime() + mEnd.getTime()) / 2);
    const days = Math.round((mEnd.getTime() - mStart.getTime()) / DAY);
    const label = mStart.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
    const monthKey = isoUtc(mStart).slice(0, 7);

    // ——— Dasha ———
    const chain = periodsAt(chart.dashas, mid, 2);
    const [md, ad] = chain;
    const pds: TreePeriod[] = ad ? childPeriods(ad).filter((p) => p.end > mStart && p.start < mEnd) : [];
    // One entry per lord: when a planet runs more than one level (e.g. Mercury–Mercury), its weights add up.
    const lords: { lord: PlanetName; weight: number; level: string }[] = [];
    const addLord = (lord: PlanetName, weight: number, level: string) => {
      const have = lords.find((l) => l.lord === lord);
      if (have) {
        have.weight += weight;
        if (!have.level.includes(level)) have.level += ` and ${level}`;
      } else lords.push({ lord, weight, level });
    };
    if (md) addLord(md.lord as PlanetName, 0.3, "Mahadasha");
    if (ad) addLord(ad.lord as PlanetName, 0.45, "Antardasha");
    for (const pd of pds) {
      const overlap = (Math.min(pd.end.getTime(), mEnd.getTime()) - Math.max(pd.start.getTime(), mStart.getTime())) / (mEnd.getTime() - mStart.getTime());
      addLord(pd.lord as PlanetName, 0.25 * overlap, "Pratyantardasha");
    }

    // ——— Positions ———
    const pos = positionsAt(mid);
    const P = new Map(pos.map((p) => [p.planet, p]));
    const sunSignNatal = sun.signIndex;

    // ——— Gochara from the Moon ———
    const gochara: Reason[] = [];
    const transits: TransitInfo[] = pos.map((p) => {
      const fromMoon = houseFrom(p.signIndex, moon.signIndex);
      const fromLagna = houseFrom(p.signIndex, asc);
      const favourable = GOCHARA_GOOD[p.planet].includes(fromMoon);
      let vedhaBy: PlanetName | null = null;
      const vedhaHouse = favourable ? VEDHA[p.planet]?.[fromMoon] : undefined;
      if (vedhaHouse) {
        const blocker = pos.find(
          (o) => o.planet !== p.planet && o.planet !== "Moon" && houseFrom(o.signIndex, moon.signIndex) === vedhaHouse && !NO_VEDHA.some(([a, b]) => (a === p.planet && b === o.planet) || (b === p.planet && a === o.planet))
        );
        vedhaBy = blocker?.planet ?? null;
      }
      const table = bav(p.planet);
      const bindus = table ? table[p.signIndex] : null;
      const sav = chart.ashtakavarga.sarva[p.signIndex];
      let kakshya: TransitInfo["kakshya"] = null;
      const pr = prastara.get(p.planet);
      if (pr) {
        const lord = KAKSHYA[Math.floor((p.lon % 30) / 3.75)];
        const good = pr.find((c) => c.contributor === lord)!.bindus[p.signIndex];
        kakshya = { lord, good };
      }
      const note =
        `${p.planet} in ${SIGNS[p.signIndex]}${p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu" ? " (retrograde)" : ""}: ${ordinal(fromMoon)} from your Moon` +
        (favourable ? (vedhaBy ? `, a good house but blocked (vedha) by ${vedhaBy}` : ", a good gochara house") : ", not one of its good houses") +
        `; ${ordinal(fromLagna)} from the Lagna` +
        (bindus !== null ? `; ${bindus}/8 bindus` : "") +
        (kakshya ? `; in the ${kakshya.lord} kakshya, ${kakshya.good ? "which gives a bindu — results come now" : "which gives none — results wait for a better kakshya"}` : "") +
        ".";
      if (p.planet !== "Moon") {
        const w = GOCHARA_WEIGHT[p.planet] ?? 1;
        const strength = bindus === null ? (sav >= 28 ? 1 : 0.7) : bindus >= 5 ? 1.25 : bindus === 4 ? 1 : 0.65;
        const pts = favourable && !vedhaBy ? w * strength * (kakshya && !kakshya.good ? 0.7 : 1) : favourable ? w * 0.2 : -w * 0.6 * (bindus !== null && bindus >= 5 ? 0.5 : 1);
        gochara.push({ text: note, points: Math.round(pts * 10) / 10, source: "Gochara" });
      }
      return {
        planet: p.planet,
        sign: SIGNS[p.signIndex],
        degree: p.lon % 30,
        retrograde: p.retrograde,
        houseFromLagna: fromLagna,
        houseFromMoon: fromMoon,
        houseFromSun: houseFrom(p.signIndex, sunSignNatal),
        favourable,
        vedhaBy,
        bindus,
        sav,
        kakshya,
        note,
      };
    });
    const gocharaTotal = gochara.reduce((a, r) => a + r.points, 0);

    // Saturn from the Moon: Sade Sati, Ashtama and Kantaka Shani.
    const satFromMoon = houseFrom(P.get("Saturn")!.signIndex, moon.signIndex);
    const saturnPhase = [12, 1, 2].includes(satFromMoon)
      ? `Sade Sati (${satFromMoon === 12 ? "rising" : satFromMoon === 1 ? "peak" : "setting"} phase)`
      : satFromMoon === 8
        ? "Ashtama Shani (Saturn 8th from the Moon)"
        : satFromMoon === 4
          ? "Kantaka Shani (Saturn 4th from the Moon)"
          : null;

    // ——— Numerology ———
    const py = personalYear(chart.input.date, mStart.getUTCFullYear());
    const pm = reduceToDigit(py + mStart.getUTCMonth() + 1);
    const supportive = FRIENDLY[mool].includes(pm) && FRIENDLY[bhag].includes(pm);
    const numText = `Personal year ${py} (${PERSONAL_THEME[py]}); personal month ${pm} — ${PERSONAL_THEME[pm]}. ${
      supportive ? `Number ${pm} (${NUMBER_MEANINGS[pm].planet}) is friendly to your Moolank ${mool} and Bhagyank ${bhag}, a supportive month.` : `Number ${pm} (${NUMBER_MEANINGS[pm].planet}) is not friendly to both your Moolank ${mool} and Bhagyank ${bhag}, so go steady.`
    }`;

    // ——— Areas ———
    const jup = P.get("Jupiter")!;
    const sat = P.get("Saturn")!;
    const touches = (planet: PlanetName, signIndex: number, house: number) => {
      const h = houseFrom(signIndex, asc);
      if (h === house) return "occupies";
      if (getAspectedHouses(planet).some((d) => ((h + d - 2) % 12) + 1 === house)) return "aspects";
      return null;
    };

    const areas: AreaForecast[] = AREAS.map((area) => {
      const reasons: Reason[] = [];
      // Dasha
      for (const { lord, weight, level } of lords) {
        if (weight < 0.02) continue;
        const sig = sigs.get(lord)!;
        const q = ((diag.get(lord)!.score - 50) / 50) * 0.6 + (vargaScore.get(`${area.key}:${lord}`) ?? 0) * 0.4;
        let relevance = 0;
        const linked: number[] = [];
        for (const h of area.houses) {
          const s = sig.get(h) ?? 0;
          if (s > 0) linked.push(h);
          relevance += s * (h === area.primary ? 1.5 : 1);
        }
        relevance = Math.min(3, relevance);
        let pts = relevance > 0 ? weight * relevance * (6 + 14 * q) : 0;
        let riskText = "";
        if (area.risk) {
          const risk = Math.min(2.5, area.risk.reduce((a, h) => a + (sig.get(h) ?? 0), 0));
          if (risk > 0) {
            pts -= weight * risk * (9 - 5 * q);
            riskText = ` It also signifies the ${listJoin(area.risk.filter((h) => sig.get(h)).map(ordinal))} (illness, strain or expense)`;
          }
        }
        if (Math.abs(pts) < 0.5) continue;
        const vq = vargaScore.get(`${area.key}:${lord}`) ?? 0;
        const vText = area.varga === "D2" ? (vq > 0 ? "sits in the hora that suits it" : "sits in the hora against its nature") : `is ${vq > 0.2 ? "strong" : vq < -0.2 ? "weak" : "moderate"} in your ${area.varga}`;
        reasons.push({
          source: "Dasha",
          points: Math.round(pts * 10) / 10,
          text: `${level} lord ${lord} (${diag.get(lord)!.grade.toLowerCase()} natally) ${linked.length ? `signifies your ${listJoin(linked.map(ordinal))} house${linked.length > 1 ? "s" : ""}` : "touches this area"} and ${vText}.${riskText ? riskText + "." : ""}`,
        });
      }
      // Slow transits from the Lagna
      const savPrimary = chart.ashtakavarga.sarva[(asc + area.primary - 1) % 12];
      const savMul = savPrimary >= 30 ? 1.25 : savPrimary <= 24 ? 0.75 : 1;
      const jt = touches("Jupiter", jup.signIndex, area.primary);
      const st = touches("Saturn", sat.signIndex, area.primary);
      if (jt) {
        const pts = (area.key === "health" ? 5 : 7) * savMul * (jt === "occupies" ? 1 : 0.8);
        reasons.push({ source: "Transit", points: Math.round(pts * 10) / 10, text: `Jupiter ${jt} your ${ordinal(area.primary)} house (${savPrimary} bindus) — growth and protection for ${area.short}.` });
      } else {
        const other = area.houses.slice(1).find((h) => touches("Jupiter", jup.signIndex, h));
        if (other) reasons.push({ source: "Transit", points: 2.5, text: `Jupiter supports your ${ordinal(other)} house, a secondary house of ${area.short}.` });
      }
      if (st) {
        const good = UPACHAYA.includes(area.primary);
        const pts = good ? 3 : area.key === "health" ? -7 : -5;
        reasons.push({ source: "Transit", points: Math.round(pts * savMul * 10) / 10, text: good ? `Saturn ${st} your ${ordinal(area.primary)} — slow, solid progress through discipline.` : `Saturn ${st} your ${ordinal(area.primary)} — pressure, delay and hard lessons in ${area.short}.` });
      }
      if (jt && st) reasons.push({ source: "Transit", points: 6, text: `Double transit: Jupiter and Saturn both activate your ${ordinal(area.primary)} — a classic sign that events in ${area.short} can happen now.` });
      for (const node of ["Rahu", "Ketu"] as PlanetName[]) {
        if (houseFrom(P.get(node)!.signIndex, asc) === area.primary) {
          const good = UPACHAYA.includes(area.primary);
          reasons.push({ source: "Transit", points: good ? 2 : -3, text: `${node} transits your ${ordinal(area.primary)} — ${good ? "ambition and unusual openings" : node === "Rahu" ? "restlessness and confusion; verify before acting" : "detachment or sudden breaks"}.` });
        }
      }
      if (area.key === "health") {
        for (const mal of ["Mars", "Saturn", "Rahu", "Ketu"] as PlanetName[]) {
          if (houseFrom(P.get(mal)!.signIndex, asc) === 8) reasons.push({ source: "Transit", points: -3, text: `${mal} transits your 8th — guard against accidents, strain and sudden health issues.` });
        }
      }
      // Fast planets (Sun, Mars, Mercury, Venus) change sign every few weeks, so they set each area's month-to-month tone.
      for (const f of ["Sun", "Mars", "Mercury", "Venus"] as PlanetName[]) {
        const fp = P.get(f)!;
        const h = houseFrom(fp.signIndex, asc);
        const aspected = f === "Mars" ? [4, 7, 8].map((d) => ((h + d - 2) % 12) + 1) : [((h + 5) % 12) + 1];
        const hits = [...area.houses, ...(area.risk ?? [])].filter((x) => x === h || aspected.includes(x));
        if (!hits.length) continue;
        const target = hits.includes(area.primary) ? area.primary : hits[0];
        const occupies = target === h;
        const weight = (target === area.primary ? 1 : 0.5) * (occupies ? 1 : 0.6);
        const malefic = f === "Sun" || f === "Mars";
        const risky = area.risk?.includes(target);
        const good = risky ? false : malefic ? UPACHAYA.includes(target) : true;
        const gocharaOk = GOCHARA_GOOD[f].includes(houseFrom(fp.signIndex, moon.signIndex));
        const pts = (good ? 3 : -3) * weight * (good === gocharaOk ? 1.2 : 0.7);
        reasons.push({
          source: "Transit",
          points: Math.round(pts * 10) / 10,
          text: `${f} ${occupies ? "transits" : "aspects"} your ${ordinal(target)} this month — ${
            good ? `${malefic ? "drive and results" : "ease and support"} for ${area.short}` : risky ? "watch strain, accidents or extra expense" : `${malefic ? "friction, haste or ego clashes" : "mixed signals"} in ${area.short}`
          }.`,
        });
      }
      // Ashtakavarga strength of the area's sign
      if (savPrimary >= 32 || savPrimary <= 22)
        reasons.push({ source: "Ashtakavarga", points: savPrimary >= 32 ? 2 : -2, text: `Your ${ordinal(area.primary)} house sign holds ${savPrimary} Sarvashtakavarga bindus — ${savPrimary >= 32 ? "transits deliver strongly here" : "transits deliver weakly here"}.` });
      // Saturn cycle
      if (saturnPhase && (area.key === "health" || area.key === "home" || area.key === "career"))
        reasons.push({ source: "Gochara", points: area.key === "health" ? -4 : -2.5, text: `${saturnPhase} — a heavier, testing background; steady routines help most.` });
      // General gochara and numerology
      reasons.push({ source: "Gochara", points: Math.round(gocharaTotal * 0.3 * 10) / 10, text: `Overall gochara from your Moon ${gocharaTotal >= 4 ? "is supportive" : gocharaTotal <= -4 ? "is against you" : "is mixed"} this month (${gocharaTotal >= 0 ? "+" : ""}${gocharaTotal.toFixed(1)}).` });
      reasons.push({ source: "Numerology", points: supportive ? 1.5 : -1.5, text: `Personal month ${pm} is ${supportive ? "friendly" : "not friendly"} to your numbers.` });

      const score = Math.max(8, Math.min(95, Math.round(50 + reasons.reduce((a, r) => a + r.points, 0))));
      const verdict = verdictOf(score);
      const top = [...reasons].filter((r) => r.source !== "Numerology").sort((a, b) => Math.abs(b.points) - Math.abs(a.points)).slice(0, 3);
      return { key: area.key, label: area.label, score, verdict, text: `${AREA_LINE[area.key][verdict]} ${top.map((r) => r.text).join(" ")}`, reasons: reasons.sort((a, b) => Math.abs(b.points) - Math.abs(a.points)) };
    });

    const score = Math.round(areas.reduce((a, x) => a + x.score * (x.key === "health" ? 1.2 : 1), 0) / (areas.length + 0.2));
    const verdict = verdictOf(score);
    const best = [...areas].sort((a, b) => b.score - a.score)[0];
    const worst = [...areas].sort((a, b) => a.score - b.score)[0];

    // ——— Key dates ———
    const keyDates: KeyDate[] = [];
    for (const pd of pds) if (pd.start >= mStart) keyDates.push({ date: iso(pd.start), text: `${md?.lord}–${ad?.lord}–${pd.lord} Pratyantardasha begins (${diag.get(pd.lord as PlanetName)!.grade.toLowerCase()} planet).`, tone: diag.get(pd.lord as PlanetName)!.score >= 57 ? "good" : diag.get(pd.lord as PlanetName)!.score < 43 ? "hard" : "neutral" });
    if (ad && ad.start >= mStart && ad.start < mEnd) keyDates.push({ date: iso(ad.start), text: `${md?.lord}–${ad.lord} Antardasha begins — a new chapter for the next months.`, tone: "neutral" });
    const daily = Array.from({ length: days + 1 }, (_, d) => new Date(mStart.getTime() + d * DAY));
    const signs = (body: PlanetName) => daily.map((d) => Math.floor(siderealLongitude(body as TransitBody, d) / 30));
    for (const body of ["Sun", "Mars", "Mercury", "Venus", "Jupiter", "Saturn", "Rahu"] as PlanetName[]) {
      const s = signs(body);
      for (let d = 1; d < s.length; d++)
        if (s[d] !== s[d - 1]) {
          const h = houseFrom(s[d], asc);
          const good = GOCHARA_GOOD[body].includes(houseFrom(s[d], moon.signIndex));
          const at = bisect(daily[d - 1], daily[d], (t) => Math.floor(siderealLongitude(body as TransitBody, t) / 30));
          keyDates.push({ date: iso(at), text: `${body} enters ${SIGNS[s[d]]} — your ${ordinal(h)} house from the Lagna, ${ordinal(houseFrom(s[d], moon.signIndex))} from the Moon${good ? " (favourable)" : ""}.`, tone: SLOW.includes(body) ? (good ? "good" : "hard") : good ? "good" : "neutral" });
        }
    }
    for (const body of ["Mercury", "Venus", "Mars", "Jupiter", "Saturn"] as const) {
      let prev = isRetrograde(body, daily[0]);
      for (let d = 1; d < daily.length; d++) {
        const r = isRetrograde(body, daily[d]);
        if (r !== prev) keyDates.push({ date: iso(bisect(daily[d - 1], daily[d], (t) => isRetrograde(body, t))), text: `${body} turns ${r ? "retrograde" : "direct"} in ${SIGNS[Math.floor(siderealLongitude(body, daily[d]) / 30)]} — ${r ? "review and revisit its matters rather than start them" : "its matters move forward again"}.`, tone: r ? "hard" : "good" });
        prev = r;
      }
    }
    for (const body of ["Jupiter", "Saturn", "Rahu", "Ketu", "Mars"] as PlanetName[]) {
      for (const pt of natalPoints) {
        if (pt.name === body) continue;
        const hit = daily.findIndex((d) => angle(siderealLongitude(body as TransitBody, d), pt.lon) <= 1);
        if (hit > 0 || (hit === 0 && angle(siderealLongitude(body as TransitBody, daily[0]), pt.lon) <= 1 && m === 0)) {
          const good = body === "Jupiter";
          keyDates.push({ date: iso(daily[Math.max(0, hit)]), text: `Transit ${body} crosses your natal ${pt.name} — ${good ? `a lift for everything ${pt.name} signifies` : `${pt.name}'s matters are tested and stirred`}.`, tone: good ? "good" : "hard" });
        }
      }
    }
    for (const e of eclipses.filter((e) => e.date >= mStart && e.date < mEnd)) {
      const near = natalPoints.filter((pt) => angle(pt.lon, e.lon) <= 6).map((pt) => pt.name);
      keyDates.push({
        date: iso(e.date),
        text: `${e.kind} eclipse in ${SIGNS[Math.floor(e.lon / 30)]}, your ${ordinal(houseFrom(Math.floor(e.lon / 30), asc))} house${near.length ? ` — close to your natal ${listJoin(near)}, so its themes are stirred; avoid major starts around this date` : ""}.`,
        tone: near.length ? "hard" : "neutral",
      });
    }
    keyDates.sort((a, b) => a.date.localeCompare(b.date));

    // Chandrashtama: the Moon in the 8th sign from the natal Moon.
    const ashtama = (moon.signIndex + 7) % 12;
    const chandrashtama: MonthForecast["chandrashtama"] = [];
    let open: Date | null = null;
    for (let t = mStart.getTime(); t <= mEnd.getTime(); t += 3 * 3600_000) {
      const inIt = Math.floor(siderealLongitude("Moon", new Date(t)) / 30) === ashtama;
      if (inIt && !open) open = new Date(t);
      if (!inIt && open) {
        chandrashtama.push({ start: iso(open), end: iso(new Date(t)) });
        open = null;
      }
    }
    if (open) chandrashtama.push({ start: iso(open), end: iso(new Date(mEnd.getTime() - 1)) });

    // ——— Sun- and Moon-sign views ———
    const jupFromMoon = houseFrom(jup.signIndex, moon.signIndex);
    const moonSign = `For ${moon.sign} Moon sign (${NAKSHATRAS[moon.nakshatraIndex]}): Jupiter is ${ordinal(jupFromMoon)} from your Moon (${GOCHARA_GOOD.Jupiter.includes(jupFromMoon) ? "favourable — growth and good fortune" : "not favourable — growth needs more effort"}), Saturn is ${ordinal(satFromMoon)} (${saturnPhase ?? (GOCHARA_GOOD.Saturn.includes(satFromMoon) ? "favourable — rewards for steady work" : "neutral to testing")}).`;
    const sunNow = P.get("Sun")!;
    const sunFromSun = houseFrom(sunNow.signIndex, sun.signIndex);
    const sunSign = `For ${sun.sign} Sun sign: the Sun moves through ${SIGNS[sunNow.signIndex]}, your ${ordinal(sunFromSun)} from the natal Sun — ${SUN_MONTH[sunFromSun]}. Jupiter is ${ordinal(houseFrom(jup.signIndex, sun.signIndex))} and Saturn ${ordinal(houseFrom(sat.signIndex, sun.signIndex))} from your Sun sign.`;

    // ——— Dasha text, focus and remedy ———
    const dashaText = md && ad
      ? `${md.lord}–${ad.lord} runs all month${pds.length > 1 ? `, with the Pratyantardasha passing from ${listJoin(pds.map((p) => p.lord))}` : pds[0] ? `, with ${pds[0].lord} Pratyantardasha` : ""}. ${diag.get(ad.lord as PlanetName)!.summary}`
      : "";
    const focus = [
      `Lean into ${best.label.toLowerCase()} — the strongest area this month.`,
      worst.score < 45 ? `Go carefully with ${worst.label.toLowerCase()}.` : `No area is under serious pressure.`,
      ...(chandrashtama.length ? [`Keep ${chandrashtama.map((c) => `${fmtDay(new Date(c.start))}–${fmtDay(new Date(c.end))}`).join(" and ")} light — Chandrashtama days.`] : []),
    ];
    const weakLord = lords.map((l) => diag.get(l.lord)!).filter((d) => d.score < 45).sort((a, b) => a.score - b.score)[0];
    const remedy = weakLord
      ? { planet: weakLord.planet, text: `${weakLord.planet} runs a dasha period and is ${weakLord.grade.toLowerCase()} in your chart: chant "${PLANET_REMEDIES[weakLord.planet].mantra}" on ${PLANET_REMEDIES[weakLord.planet].day}s, and ${PLANET_REMEDIES[weakLord.planet].charity.charAt(0).toLowerCase()}${PLANET_REMEDIES[weakLord.planet].charity.slice(1)}` }
      : null;

    out.push({
      month: monthKey,
      label,
      dasha: { maha: md?.lord ?? "", antar: ad?.lord ?? "", pratyantars: pds.map((p) => ({ lord: p.lord, start: iso(p.start), end: iso(p.end) })), text: dashaText },
      score,
      verdict,
      headline: `${verdict === "Excellent" || verdict === "Favourable" ? "A good month" : verdict === "Mixed" ? "A mixed month" : "A testing month"}: ${best.label.toLowerCase()} leads${worst.score < 45 ? `, while ${worst.label.toLowerCase()} needs care` : ""}.`,
      areas,
      transits: transits.filter((t) => t.planet !== "Moon"),
      gochara: gochara.sort((a, b) => b.points - a.points),
      keyDates,
      chandrashtama,
      numerology: { personalYear: py, personalMonth: pm, supportive, text: numText },
      moonSign,
      sunSign,
      focus,
      remedy,
    });
  }

  const bestOf = (k: AreaKey) => [...out].sort((a, b) => b.areas.find((x) => x.key === k)!.score - a.areas.find((x) => x.key === k)!.score)[0].label;
  const ranked = [...out].sort((a, b) => b.score - a.score);
  const bestFor = Object.fromEntries(AREAS.map((a) => [a.key, bestOf(a.key)])) as Record<AreaKey, string>;
  const summary: ForecastSummary = {
    bestMonth: ranked[0].label,
    hardestMonth: ranked.at(-1)!.label,
    bestFor,
    trend: out.map((m) => ({ month: m.month, label: m.label, score: m.score })),
    text: `Over the next ${months} months your best stretch is around ${ranked[0].label} and the most testing is ${ranked.at(-1)!.label}. For career look to ${bestFor.career}; for money, ${bestFor.money}; for relationships, ${bestFor.love}.`,
  };

  return { diagnosis, months: out, summary };
}

const SUN_MONTH: Record<number, string> = {
  1: "a solar return month: vitality and self-focus, a good time to set the year's intentions",
  2: "attention on money, family and what you say",
  3: "confidence and initiative rise (a good Sun position)",
  4: "home and inner peace need attention",
  5: "creativity, children and romance come forward",
  6: "you overcome rivals and clear health and work backlogs (a good Sun position)",
  7: "partnerships and dealings with others take centre stage",
  8: "a lower-energy month; rest and avoid risks",
  9: "mentors, travel and higher learning call",
  10: "career and recognition get a push (a good Sun position)",
  11: "gains, networks and fulfilled wishes (a good Sun position)",
  12: "an inward month — rest, expenses and preparation",
};

const AREA_LINE: Record<AreaKey, Record<Verdict, string>> = {
  career: {
    Excellent: "An outstanding month for work — push for the promotion, launch or new role.",
    Favourable: "A good month for work: effort is seen and rewarded.",
    Mixed: "Work moves, but unevenly — finish what you started rather than take big risks.",
    Challenging: "Work brings pressure or slowdowns; keep your head down and document everything.",
    Difficult: "A hard month at work — avoid confrontations and big career moves.",
  },
  money: {
    Excellent: "Money flows well — a strong month for gains, deals and investments.",
    Favourable: "Finances are supported; good for planned purchases and saving.",
    Mixed: "Income is steady but so are expenses — budget rather than speculate.",
    Challenging: "Watch spending and avoid lending or speculation this month.",
    Difficult: "Financial strain is likely — postpone big purchases and risky bets.",
  },
  love: {
    Excellent: "Relationships glow — a lovely month for romance, proposals or commitment.",
    Favourable: "Warm, supportive month for your partner and close bonds.",
    Mixed: "Relationships need give and take; talk things through calmly.",
    Challenging: "Misunderstandings come easily — choose patience over pride.",
    Difficult: "A strained month for relationships — avoid ultimatums and big decisions.",
  },
  health: {
    Excellent: "Energy is high and recovery is quick.",
    Favourable: "Good health and steady energy; keep up your routines.",
    Mixed: "Energy comes and goes — sleep, food and rest matter more than usual.",
    Challenging: "Health needs attention: don't ignore small symptoms and avoid overwork.",
    Difficult: "A vulnerable month for health — rest, check-ups and caution with risks.",
  },
  home: {
    Excellent: "Home and family are a source of joy — good for property or vehicle decisions.",
    Favourable: "Peaceful home life and support from family.",
    Mixed: "Home life has small ups and downs; give family time.",
    Challenging: "Family matters or the house need attention and patience.",
    Difficult: "Tension at home is likely — postpone property deals and keep calm.",
  },
  growth: {
    Excellent: "Excellent for study, exams, teachers and spiritual practice.",
    Favourable: "Learning comes easily; good for courses, reading and prayer.",
    Mixed: "Study needs discipline this month; keep a steady practice.",
    Challenging: "Focus is hard to hold — break study into small goals.",
    Difficult: "Distractions and doubts are strong — lean on routine and a mentor.",
  },
};
