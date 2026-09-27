import { SIGNS, type PlanetName } from "./constants";
import { isRetrograde, siderealLongitude, type TransitBody } from "./ephemeris";
import { signOffsetHouse } from "./math";

/**
 * Transits (gochara): where the planets are now, when they change sign, and
 * the long Saturn cycles (Sade Sati, Dhaiya) measured from the natal Moon.
 */

const DAY = 86400_000;

// Sampling interval per body — comfortably shorter than the quickest it can re-cross a sign boundary.
const STEP_DAYS: Record<TransitBody, number> = {
  Moon: 0.25,
  Sun: 1,
  Mercury: 1,
  Venus: 1,
  Mars: 2,
  Jupiter: 4,
  Saturn: 4,
  Rahu: 8,
  Ketu: 8,
};

const signAt = (body: TransitBody, t: number) => Math.floor(siderealLongitude(body, new Date(t)) / 30);

export interface SignPeriod {
  signIndex: number;
  start: Date;
  end: Date;
}

/** Every stretch a body spends in one sign between `from` and `to`, with ingress moments to within ~an hour. */
export function signPeriods(body: TransitBody, from: Date, to: Date): SignPeriod[] {
  const step = STEP_DAYS[body] * DAY;
  const periods: SignPeriod[] = [];
  let current = signAt(body, from.getTime());
  let start = from.getTime();
  for (let t = from.getTime() + step; t < to.getTime() + step; t += step) {
    const sign = signAt(body, Math.min(t, to.getTime()));
    if (sign === current) continue;
    let lo = t - step;
    let hi = Math.min(t, to.getTime());
    while (hi - lo > 3600_000) {
      const mid = (lo + hi) / 2;
      if (signAt(body, mid) === current) lo = mid;
      else hi = mid;
    }
    periods.push({ signIndex: current, start: new Date(start), end: new Date(hi) });
    current = sign;
    start = hi;
  }
  periods.push({ signIndex: current, start: new Date(start), end: to });
  return periods;
}

// Classical gochara: houses from the natal Moon where each transiting planet gives good results.
export const GOCHARA_GOOD: Record<PlanetName, number[]> = {
  Sun: [3, 6, 10, 11],
  Moon: [1, 3, 6, 7, 10, 11],
  Mars: [3, 6, 11],
  Mercury: [2, 4, 6, 8, 10, 11],
  Jupiter: [2, 5, 7, 9, 11],
  Venus: [1, 2, 3, 4, 5, 8, 9, 11, 12],
  Saturn: [3, 6, 11],
  Rahu: [3, 6, 11],
  Ketu: [3, 6, 11],
};

export function isGocharaFavourable(planet: PlanetName, houseFromMoon: number): boolean {
  return GOCHARA_GOOD[planet].includes(houseFromMoon);
}

export interface CurrentTransit {
  planet: PlanetName;
  signIndex: number;
  sign: string;
  degree: number;
  retrograde: boolean;
  houseFromMoon: number;
  houseFromLagna: number;
  favourable: boolean;
  next: { date: Date; sign: string } | null;
}

const TRANSIT_ORDER: PlanetName[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];

/** Every planet's transit right now, read from the natal Moon and Lagna, with its next sign change. */
export function currentTransits(natalMoonSign: number, natalLagnaSign: number, now = new Date()): CurrentTransit[] {
  return TRANSIT_ORDER.map((planet) => {
    const lon = siderealLongitude(planet, now);
    const signIndex = Math.floor(lon / 30);
    const houseFromMoon = signOffsetHouse(signIndex, natalMoonSign);
    // Look far enough ahead to catch the next ingress even for Saturn (~2.5 years a sign) and the nodes (~18 months).
    const horizon = planet === "Saturn" ? 1200 : planet === "Rahu" || planet === "Ketu" ? 700 : planet === "Jupiter" ? 500 : 120;
    const [, nextPeriod] = signPeriods(planet, now, new Date(now.getTime() + horizon * DAY));
    const retrograde =
      planet === "Rahu" || planet === "Ketu" ? true : planet === "Sun" || planet === "Moon" ? false : isRetrograde(planet, now);
    return {
      planet,
      signIndex,
      sign: SIGNS[signIndex],
      degree: lon - signIndex * 30,
      retrograde,
      houseFromMoon,
      houseFromLagna: signOffsetHouse(signIndex, natalLagnaSign),
      favourable: isGocharaFavourable(planet, houseFromMoon),
      next: nextPeriod ? { date: nextPeriod.start, sign: SIGNS[nextPeriod.signIndex] } : null,
    };
  });
}

export type SaturnPhase = "Rising" | "Peak" | "Setting";

export interface SaturnCycle {
  kind: "Sade Sati" | "Kantaka Shani" | "Ashtama Shani";
  start: Date;
  end: Date;
  phases: { phase: SaturnPhase | null; signIndex: number; start: Date; end: Date }[];
}

/**
 * Sade Sati (Saturn in the 12th, 1st and 2nd from the Moon) and the two
 * Dhaiya periods — Kantaka (4th) and Ashtama (8th) — over a span of years.
 * Retrograde back-and-forth across a boundary is merged into one cycle.
 */
export function saturnCycles(natalMoonSign: number, from: Date, to: Date): SaturnCycle[] {
  const periods = signPeriods("Saturn", from, to);
  const kindOf = (house: number): SaturnCycle["kind"] | null =>
    house === 12 || house === 1 || house === 2 ? "Sade Sati" : house === 4 ? "Kantaka Shani" : house === 8 ? "Ashtama Shani" : null;
  const phaseOf = (house: number): SaturnPhase | null => (house === 12 ? "Rising" : house === 1 ? "Peak" : house === 2 ? "Setting" : null);

  const cycles: SaturnCycle[] = [];
  for (const p of periods) {
    const house = signOffsetHouse(p.signIndex, natalMoonSign);
    const kind = kindOf(house);
    if (!kind) continue;
    const last = cycles[cycles.length - 1];
    // Merge with the previous cycle of the same kind if Saturn only briefly stepped out (a retrograde loop).
    if (last && last.kind === kind && p.start.getTime() - last.end.getTime() < 400 * DAY) {
      last.end = p.end;
      last.phases.push({ phase: phaseOf(house), signIndex: p.signIndex, start: p.start, end: p.end });
    } else {
      cycles.push({ kind, start: p.start, end: p.end, phases: [{ phase: phaseOf(house), signIndex: p.signIndex, start: p.start, end: p.end }] });
    }
  }
  // Retrograde loops split a phase into several stretches; report each phase once, from its first entry to its last exit.
  for (const c of cycles) {
    const merged = new Map<string, SaturnCycle["phases"][number]>();
    for (const p of c.phases) {
      const key = `${p.phase}-${p.signIndex}`;
      const existing = merged.get(key);
      if (existing) existing.end = p.end;
      else merged.set(key, { ...p });
    }
    c.phases = [...merged.values()];
  }
  return cycles;
}
