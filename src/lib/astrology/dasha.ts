import { DASHA_SEQUENCE, DASHA_YEARS, NAKSHATRAS } from "./constants";

const NAKSHATRA_SPAN = 360 / 27;
const YEAR_MS = 365.25 * 86400000;

export interface DashaPeriod {
  lord: (typeof DASHA_SEQUENCE)[number];
  start: Date;
  end: Date;
  /** One level deeper in the Vimshottari tree — Antardashas under a Mahadasha, Pratyantardashas under an Antardasha. */
  subPeriods?: DashaPeriod[];
}

/**
 * Splits one dasha cycle (9 sub-periods in the fixed Vimshottari order,
 * starting at `startLordIndex`) into periods beginning at `cycleStart`.
 * `scale` converts each lord's standard 120-year-cycle share into the
 * actual span of this cycle (1 for a Mahadasha; mahadashaYears/120 for its
 * Antardashas; antardashaYears/120 for its Pratyantardashas, and so on).
 * `elapsedYears` lets the first sub-period be a partial balance instead of a
 * full one — used whenever this cycle itself starts mid-period rather than
 * at its own beginning (the birth Mahadasha, and any level nested inside it
 * that is itself still mid-period at birth).
 */
function splitCycle(
  startLordIndex: number,
  scale: number,
  elapsedYears: number,
  cycleStart: Date,
  count = 9
): DashaPeriod[] {
  const periods: DashaPeriod[] = [];
  let remaining = elapsedYears;
  let cursor = cycleStart;

  for (let i = 0; i < count; i++) {
    const lord = DASHA_SEQUENCE[(startLordIndex + i) % 9];
    const fullYears = DASHA_YEARS[lord] * scale;

    if (remaining >= fullYears) {
      remaining -= fullYears;
      continue;
    }

    const years = fullYears - remaining;
    remaining = 0;
    const end = new Date(cursor.getTime() + years * YEAR_MS);
    periods.push({ lord, start: cursor, end });
    cursor = end;
  }

  return periods;
}

/** Generic entry point for one level of Vimshottari sub-division, given the parent period's own lord/start and its TRUE (untruncated) real-year duration. */
function computeSubPeriods(
  parentLord: (typeof DASHA_SEQUENCE)[number],
  parentStart: Date,
  parentFullYears: number,
  elapsedYearsAtStart = 0
): DashaPeriod[] {
  const scale = parentFullYears / 120;
  const startLordIndex = DASHA_SEQUENCE.indexOf(parentLord);
  return splitCycle(startLordIndex, scale, elapsedYearsAtStart, parentStart, 9);
}

/**
 * How many real years of `period` (whose own untruncated length is
 * `fullYears`) remain unconsumed after it — i.e. how far into it birth fell,
 * in the same absolute-real-year units `elapsedYears` uses everywhere else.
 * Only meaningful for the first (birth-truncated) period of a cycle.
 */
export function periodElapsedYears(period: DashaPeriod, fullYears: number): number {
  const actualYears = (period.end.getTime() - period.start.getTime()) / YEAR_MS;
  return Math.max(0, fullYears - actualYears);
}

/** The birth Mahadasha's starting lord and how many years of it had already elapsed at birth. */
export function moonDashaBalance(moonSiderealLongitude: number): {
  startLordIndex: number;
  elapsedYears: number;
} {
  const nakshatraIndex = Math.floor(moonSiderealLongitude / NAKSHATRA_SPAN);
  const positionInNakshatra = moonSiderealLongitude - nakshatraIndex * NAKSHATRA_SPAN;
  const fractionElapsed = positionInNakshatra / NAKSHATRA_SPAN;
  const startLordIndex = nakshatraIndex % 9;
  return { startLordIndex, elapsedYears: DASHA_YEARS[DASHA_SEQUENCE[startLordIndex]] * fractionElapsed };
}

/**
 * Vimshottari Mahadasha sequence starting from birth, computed from the
 * Moon's sidereal longitude. Returns the balance of the birth dasha plus
 * enough full cycles to cover a normal lifespan.
 */
export function computeVimshottariDasha(moonSiderealLongitude: number, birthDate: Date): DashaPeriod[] {
  const { startLordIndex, elapsedYears } = moonDashaBalance(moonSiderealLongitude);
  return splitCycle(startLordIndex, 1, elapsedYears, birthDate, 12);
}

/**
 * Antardasha (sub-period) breakdown for one Mahadasha. `elapsedYearsAtStart`
 * is nonzero only for the birth Mahadasha, whose Antardasha sequence also
 * starts mid-period rather than fresh.
 */
export function computeAntardashas(
  mahadashaLord: (typeof DASHA_SEQUENCE)[number],
  mahadashaStart: Date,
  elapsedYearsAtStart = 0
): DashaPeriod[] {
  return computeSubPeriods(mahadashaLord, mahadashaStart, DASHA_YEARS[mahadashaLord], elapsedYearsAtStart);
}

/**
 * Pratyantardasha (3rd-level sub-period) breakdown for one Antardasha.
 * `elapsedYearsAtStart` is nonzero only for the specific Antardasha that was
 * itself still running at birth (found via `periodElapsedYears`).
 */
export function computePratyantardashas(
  mahadashaLord: (typeof DASHA_SEQUENCE)[number],
  antardasha: DashaPeriod,
  elapsedYearsAtStart = 0
): DashaPeriod[] {
  const antardashaFullYears = DASHA_YEARS[antardasha.lord] * (DASHA_YEARS[mahadashaLord] / 120);
  return computeSubPeriods(antardasha.lord, antardasha.start, antardashaFullYears, elapsedYearsAtStart);
}

export function nakshatraLord(nakshatraIndex: number): (typeof DASHA_SEQUENCE)[number] {
  return DASHA_SEQUENCE[nakshatraIndex % 9];
}

export function nakshatraName(nakshatraIndex: number): string {
  return NAKSHATRAS[nakshatraIndex];
}
