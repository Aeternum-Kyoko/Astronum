import { validateRectification } from "./rectificationValidation";
import { DateTime } from "luxon";
import { calculateKundali } from "./kundali";
import { getAspectedHouses } from "./aspects";
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

export { EVENT_KINDS, EVENT_KEYS, EVENT_PRECISIONS, EVENT_CONFIDENCES } from "./rectificationEvents";
export type { EventKind, EventPrecision, EventConfidence, LifeEvent, EventMatch, Candidate, CandidateRun, RectificationResult } from "./rectificationEvents";

const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const houseOf = (sign: number, asc: number) => ((sign - asc + 12) % 12) + 1;

/** Houses (from the Lagna) a planet aspects from `house`: the 7th always, plus its special aspects. */
function aspected(planet: PlanetName, house: number): number[] {
  return getAspectedHouses(planet).map((n) => ((house + n - 2) % 12) + 1);
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

/** Sample the stated interval rather than treating an approximate date as exact. */
export function eventMoments(event: LifeEvent, timezone: string): Date[] {
  const precision = event.precision ?? "day";
  const pattern = precision === "year" ? /^\d{4}$/ : precision === "month" ? /^\d{4}-\d{2}$/ : /^\d{4}-\d{2}-\d{2}$/;
  const value = precision === "year" ? `${event.date}-01-01` : precision === "month" ? `${event.date}-01` : event.date;
  const start = DateTime.fromISO(value, { zone: timezone }).startOf("day");
  if (!pattern.test(event.date) || !start.isValid) throw new Error(`Invalid ${precision}-precision event date.`);
  if (precision === "day") return [start.set({ hour: 12 }).toJSDate()];
  const end = start.plus(precision === "year" ? { years: 1 } : { months: 1 });
  const count = precision === "year" ? 12 : 5;
  const span = end.toMillis() - start.toMillis();
  return Array.from({ length: count }, (_, i) => new Date(start.toMillis() + span * (i + 0.5) / count));
}

function evidenceWeight(event: LifeEvent): number {
  const precision = event.precision === "year" ? 0.45 : event.precision === "month" ? 0.7 : 1;
  const confidence = event.confidence === "low" ? 0.6 : event.confidence === "medium" ? 0.8 : 1;
  const importance = Math.min(5, Math.max(1, event.importance ?? 3)) / 3;
  return precision * confidence * importance;
}

function scoreEventAt(chart: KundaliChart, ev: LifeEvent, at: Date): EventMatch {
  const spec = EVENT_KINDS[ev.kind];
  const eventHouses: readonly number[] = spec.houses;
  const depth = ev.precision === "year" ? 2 : 3;
  const chain = periodsAt(chart.dashas, at, depth).map((p) => p.lord as PlanetName);
  const reasons: string[] = [];
  let points = 0;
  const levels = ["Mahadasha", "Antardasha", "Pratyantardasha"];
  const weight = [2, 3, 3]; // sub-periods decide the timing most
  let subPeriodConnection = false;

  chain.forEach((lord, i) => {
    const sig = significations(chart, lord);
    const hits = eventHouses.filter((h) => sig.has(h));
    if (hits.length) {
      const pts = Math.min(hits.length, 2) * weight[i];
      points += pts;
      reasons.push(`${levels[i]} lord ${lord} ${hits.map((h) => sig.get(h)).join(" and ")} (+${pts}).`);
      if (i > 0) subPeriodConnection = true;
    }
    if ((spec.karaka as readonly string[]).includes(lord)) {
      points += 1;
      reasons.push(`${lord} is the natural significator of this event (+1).`);
    }
  });

  // A timing technique is stronger when the candidate chart also carries a basic natal promise.
  const natalLinks = chart.planets.filter((p) => eventHouses.includes(p.house) || chart.houseLords.some((l) => l.house !== p.house && l.lord === p.planet && eventHouses.includes(l.house))).length;
  if (natalLinks >= 2) {
    points += 2;
    reasons.push(`The natal chart has ${natalLinks} direct planet or lord links to the event houses (+2).`);
  } else {
    reasons.push("The natal promise for this event is limited; timing evidence is treated cautiously.");
  }

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

  if (!subPeriodConnection) {
    points = Math.max(0, points - 2);
    reasons.push("Neither Antardasha nor Pratyantardasha connects to the event houses (−2, floor at zero).");
  }

  const rawPoints = points;
  const quality = evidenceWeight(ev);
  points = Math.round(points * quality);
  if (quality !== 1) reasons.push(`Evidence weight ${Math.round(quality * 100)}% based on date precision, confidence, and importance: ${rawPoints} becomes ${points}.`);
  return { useFor: ev.useFor ?? "fit", kind: ev.kind, date: ev.date, chain, points, rawPoints, evidenceWeight: quality, reasons };
}

function scoreEvent(chart: KundaliChart, ev: LifeEvent, moments: Date[]): EventMatch {
  const samples = moments.map((at) => scoreEventAt(chart, ev, at));
  const rawPoints = samples.reduce((sum, sample) => sum + sample.rawPoints, 0) / samples.length;
  const quality = evidenceWeight(ev);
  const representative = samples[Math.floor(samples.length / 2)];
  if (samples.length === 1) return representative;
  return {
    ...representative, rawPoints, points: Math.round(rawPoints * quality),
    reasons: [
      `Averaged ${samples.length} dates across the stated ${ev.precision}; raw scores range from ${Math.min(...samples.map((s) => s.rawPoints))} to ${Math.max(...samples.map((s) => s.rawPoints))}.`,
      ...(ev.precision === "year" ? ["Year-only evidence uses Mahadasha and Antardasha; finer periods would imply unsupported date precision."] : []),
      "The dasha chain and explanations below describe the middle sample, not every date in the interval.",
      ...representative.reasons.filter((reason) => !reason.startsWith("Evidence weight")),
      `Average ${rawPoints.toFixed(2)} × evidence weight ${Math.round(quality * 100)}% = ${Math.round(rawPoints * quality)} points.`,
    ],
  };
}

export function rectify(base: BirthInput, windowMinutes: number, events: LifeEvent[], step = 1): RectificationResult {
  const center = DateTime.fromISO(`${base.date}T${base.time}`, { zone: base.timezone });
  if (!center.isValid || !Number.isInteger(windowMinutes) || windowMinutes < 0 || windowMinutes > 120 || !Number.isInteger(step) || step < 1) throw new Error("Invalid birth time, search window, or minute step.");
  if (!events.length) throw new Error("Add at least one life event.");
  if (events.some((event, i) => events.slice(0, i).some(other => other.kind === event.kind && other.date === event.date && (other.precision ?? "day") === (event.precision ?? "day") && (other.useFor ?? "fit") !== (event.useFor ?? "fit")))) {
    throw new Error("The same event cannot be both fitting and reserved validation evidence.");
  }
  const unique = events.filter((event, i) => events.findIndex((other) => other.kind === event.kind && other.date === event.date && (other.precision ?? "day") === (event.precision ?? "day")) === i);
  const fitEvents = unique.filter(event => event.useFor !== "validation");
  if (!fitEvents.length) throw new Error("At least one event must be used for fitting.");
  if (unique.some(event => event.useFor === "validation") && fitEvents.length < 2) throw new Error("Reserve validation events only when at least two other events are available for fitting.");
  const moments = unique.map((event) => eventMoments(event, base.timezone));
  const candidates: Candidate[] = [];
  for (let m = -windowMinutes; m <= windowMinutes; m += step) {
    const t = center.plus({ minutes: m });
    const chart = calculateKundali({ ...base, date: t.toISODate()!, time: t.toFormat(base.time.length > 5 ? "HH:mm:ss" : "HH:mm") });
    const matches = unique.map((ev, i) => scoreEvent(chart, ev, moments[i]));
    candidates.push({
      date: t.toISODate()!,
      time: t.toFormat(base.time.length > 5 ? "HH:mm:ss" : "HH:mm"),
      score: matches.reduce((a, e, i) => a + (unique[i].useFor === "validation" ? 0 : e.points), 0),
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

  const maxScore = Math.max(...candidates.map((c) => c.score));
  const leading = candidates.filter((c) => c.score === maxScore);
  const bestWidth = leading.length * step;
  const runnerUp = Math.max(0, ...candidates.filter((c) => c.score < maxScore).map((c) => c.score));
  const margin = maxScore - runnerUp;
  const edge = leading.includes(candidates[0]) || leading.includes(candidates[candidates.length - 1]);
  const exactHighEvents = fitEvents.filter((event) => (event.precision ?? "day") === "day" && (event.confidence ?? "high") === "high").length;
  const diversity = new Set(fitEvents.map((event) => event.kind)).size;
  const distinctDates = new Set(fitEvents.map((event) => event.date)).size;
  const resolved = maxScore > 0 && leading.length < candidates.length && !edge;
  let confidence: RectificationResult["confidence"] = resolved && runs.filter((run) => run.best.score === maxScore).length === 1 && fitEvents.length >= 5 && exactHighEvents >= 3 && diversity >= 3 && distinctDates >= 5 && margin >= 3 && bestWidth <= 6
    ? "strong" : resolved && fitEvents.length >= 3 && exactHighEvents >= 2 && diversity >= 2 && distinctDates >= 3 && bestWidth <= 15 ? "moderate" : "low";
  const warnings: string[] = [];
  if (unique.length < events.length) warnings.push("Repeated events with the same kind, date and precision count only once.");
  if (edge) warnings.push("A leading candidate touches the search boundary; try a wider window before choosing a time.");
  if (leading.length === candidates.length) warnings.push("All tested times tie; these events do not distinguish the birth time.");
  if (leading.length > 1) warnings.push(`${leading.length} sampled times share the leading score across the full search, including intervals outside the displayed shortlist.`);
  const validation = validateRectification(candidates, unique, step);
  if (validation.stableAcrossOmissions === false) {
    warnings.push("Removing a fitting event changes or broadens the leading set; the result is sensitive to event selection.");
    if (confidence === "strong") confidence = "moderate";
  }
  if (validation.heldOut && !validation.heldOut.allCandidatesTie && !validation.heldOut.selectedContainsValidationLeader) {
    warnings.push("Reserved events favour other sampled times over the fitted leading set. Inspect this disagreement before adopting a time.");
    confidence = "low";
  }
  const confidenceReason = confidence === "strong"
    ? "Distinct, well-dated events support a narrow interval with a score margin. This is heuristic evidence, not a validated probability or proof of birth time."
    : confidence === "moderate"
      ? "Several well-dated events distinguish a limited interval, but competing times remain. This is a rectification hypothesis."
      : "The evidence does not resolve a reliable narrow interval. Add independent, well-dated events or widen a boundary-limited search.";
  return { candidates, runs, boundaries, maxScore, confidence, confidenceReason, warnings, leadingCandidateCount: leading.length, scoreMargin: margin, validation };
}
