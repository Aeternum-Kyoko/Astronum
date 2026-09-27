import { DateTime } from "luxon";
import { calculateKundali } from "./kundali";
import { periodsAt } from "./dashaTree";
import { siderealLongitude } from "./ephemeris";
import { SIGNS, SIGN_LORDS, type PlanetName } from "./constants";
import type { BirthInput, KundaliChart } from "./types";
import { EVENT_KINDS, type Candidate, type CandidateRun, type EventMatch, type LifeEvent, type RectificationResult } from "./rectificationEvents";

/**
 * Birth time rectification by events. Every minute in the window is tried as
 * the birth time. For each life event the person gives, the candidate chart
 * earns points when:
 *  1. the Mahadasha, Antardasha and Pratyantardasha lords running on the event
 *     date signify the event's houses (by occupying, owning or aspecting them,
 *     or through their nakshatra lord) — moving the birth time moves the Moon,
 *     which shifts every dasha date, so the right time lines events up with
 *     the right lords;
 *  2. the event's divisional chart (D9 for marriage, D10 for career…) links
 *     those lords to its key house — vargas change every few minutes, which is
 *     what separates neighbouring times;
 *  3. Jupiter and Saturn both touch the event house from the Lagna on the
 *     date (the "double transit").
 * The best-scoring runs of minutes are returned with the reason for every point.
 */

export { EVENT_KINDS, EVENT_KEYS } from "./rectificationEvents";
export type { EventKind, LifeEvent, EventMatch, Candidate, CandidateRun, RectificationResult } from "./rectificationEvents";

const SPECIAL_ASPECTS: Partial<Record<PlanetName, number[]>> = { Mars: [4, 8], Jupiter: [5, 9], Saturn: [3, 10], Rahu: [5, 9], Ketu: [5, 9] };
const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const houseOf = (sign: number, asc: number) => ((sign - asc + 12) % 12) + 1;

/** Houses (from the Lagna) a planet aspects from `house`: the 7th always, plus its special aspects. */
function aspected(planet: PlanetName, house: number): number[] {
  return [7, ...(SPECIAL_ASPECTS[planet] ?? [])].map((n) => ((house + n - 2) % 12) + 1);
}

/** How a planet connects to each house in the chart, as readable links. */
function significations(chart: KundaliChart, planet: PlanetName): Map<number, string> {
  const out = new Map<number, string>();
  const p = chart.planets.find((x) => x.planet === planet)!;
  const add = (h: number, why: string) => out.has(h) || out.set(h, why);
  add(p.house, `sits in the ${ordinal(p.house)}`);
  for (const h of chart.houseLords.filter((l) => l.lord === planet).map((l) => l.house)) add(h, `rules the ${ordinal(h)}`);
  for (const h of aspected(planet, p.house)) add(h, `aspects the ${ordinal(h)}`);
  // Nodes give the results of the lord of the sign they occupy.
  if (planet === "Rahu" || planet === "Ketu") {
    const disp = SIGN_LORDS[p.signIndex] as PlanetName;
    const d = chart.planets.find((x) => x.planet === disp)!;
    add(d.house, `acts for its sign lord ${disp}, in the ${ordinal(d.house)}`);
  }
  return out;
}

function scoreEvent(chart: KundaliChart, ev: LifeEvent): EventMatch {
  const spec = EVENT_KINDS[ev.kind];
  const at = DateTime.fromISO(ev.date, { zone: chart.input.timezone }).set({ hour: 12 }).toJSDate();
  const chain = periodsAt(chart.dashas, at, 3).map((p) => p.lord as PlanetName);
  const reasons: string[] = [];
  let points = 0;
  const levels = ["Mahadasha", "Antardasha", "Pratyantardasha"];
  const weight = [2, 3, 3]; // sub-periods decide the timing most

  chain.forEach((lord, i) => {
    const sig = significations(chart, lord);
    const hits = spec.houses.filter((h) => sig.has(h));
    if (hits.length) {
      const pts = Math.min(hits.length, 2) * weight[i];
      points += pts;
      reasons.push(`${levels[i]} lord ${lord} ${hits.map((h) => sig.get(h)).join(" and ")} (+${pts}).`);
    }
    if ((spec.karaka as readonly string[]).includes(lord)) {
      points += 1;
      reasons.push(`${lord} is the natural significator of this event (+1).`);
    }
  });

  // Divisional chart
  const varga = chart.divisionalCharts[spec.varga as keyof typeof chart.divisionalCharts];
  if (varga) {
    const asc = varga.ascendant.signIndex;
    const keySign = (asc + spec.vargaHouse - 1) % 12;
    const keyLord = SIGN_LORDS[keySign] as PlanetName;
    for (const lord of chain.slice(1)) {
      const vp = varga.planets.find((x) => x.planet === lord);
      if (!vp) continue;
      const h = houseOf(vp.signIndex, asc);
      if (h === spec.vargaHouse || h === 1) {
        points += 2;
        reasons.push(`In the ${spec.varga}, ${lord} sits in the ${ordinal(h)} house (+2).`);
      } else if (lord === keyLord) {
        points += 2;
        reasons.push(`In the ${spec.varga}, ${lord} rules the ${ordinal(spec.vargaHouse)} house (+2).`);
      }
    }
  }

  // Double transit of Jupiter and Saturn on the event house
  const eventHouse = spec.houses[0];
  const touches = (planet: "Jupiter" | "Saturn") => {
    const h = houseOf(Math.floor(siderealLongitude(planet, at) / 30), chart.ascendant.signIndex);
    return h === eventHouse || aspected(planet, h).includes(eventHouse);
  };
  const jup = touches("Jupiter");
  const sat = touches("Saturn");
  if (jup && sat) {
    points += 3;
    reasons.push(`Jupiter and Saturn were both transiting or aspecting your ${ordinal(eventHouse)} house — the classic double transit (+3).`);
  } else if (jup || sat) {
    points += 1;
    reasons.push(`${jup ? "Jupiter" : "Saturn"} was transiting or aspecting your ${ordinal(eventHouse)} house (+1).`);
  }

  return { kind: ev.kind, date: ev.date, chain, points, reasons };
}

export function rectify(base: BirthInput, windowMinutes: number, events: LifeEvent[], step = 1): RectificationResult {
  const center = DateTime.fromISO(`${base.date}T${base.time}`, { zone: base.timezone });
  const candidates: Candidate[] = [];
  for (let m = -windowMinutes; m <= windowMinutes; m += step) {
    const t = center.plus({ minutes: m });
    const chart = calculateKundali({ ...base, date: t.toISODate()!, time: t.toFormat("HH:mm") });
    const matches = events.map((ev) => scoreEvent(chart, ev));
    candidates.push({
      time: t.toFormat("HH:mm"),
      score: matches.reduce((a, e) => a + e.points, 0),
      lagna: chart.ascendant.sign,
      navamsaLagna: SIGNS[chart.divisionalCharts.D9.ascendant.signIndex],
      moonNakshatra: chart.planets.find((p) => p.planet === "Moon")!.nakshatra,
      events: matches,
    });
  }

  const boundaries: { time: string; what: string }[] = [];
  const runs: CandidateRun[] = [];
  candidates.forEach((c, i) => {
    const prev = candidates[i - 1];
    if (prev && prev.lagna !== c.lagna) boundaries.push({ time: c.time, what: `Lagna changes from ${prev.lagna} to ${c.lagna}` });
    if (prev && prev.navamsaLagna !== c.navamsaLagna) boundaries.push({ time: c.time, what: `Navamsa lagna changes from ${prev.navamsaLagna} to ${c.navamsaLagna}` });
    const run = runs[runs.length - 1];
    if (run && prev && prev.score === c.score && prev.lagna === c.lagna && prev.navamsaLagna === c.navamsaLagna) run.to = c.time;
    else runs.push({ from: c.time, to: c.time, best: c });
  });
  const offset = (c: Candidate) => Math.abs(candidates.indexOf(c) - Math.floor(candidates.length / 2));
  runs.sort((a, b) => b.best.score - a.best.score || offset(a.best) - offset(b.best));

  return { candidates, runs, boundaries, maxScore: Math.max(...candidates.map((c) => c.score)) };
}
