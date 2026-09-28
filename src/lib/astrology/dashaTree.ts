import { DASHA_SEQUENCE, DASHA_YEARS } from "./constants";

/**
 * The Vimshottari tree to any depth — Mahadasha, Antardasha,
 * Pratyantardasha, Sookshma and Prana. Each period divides into nine in the
 * fixed Vimshottari order starting from its own lord, each child's share
 * being its lord's years out of 120. Prana periods last hours, so the tree
 * resolves timing down to the minute.
 */

export type DashaLord = (typeof DASHA_SEQUENCE)[number];

export const LEVEL_NAMES = ["Mahadasha", "Antardasha", "Pratyantardasha", "Sookshma dasha", "Prana dasha"] as const;
export const MAX_DEPTH = LEVEL_NAMES.length;

const YEAR_MS = 365.25 * 86400000; // the same year length dasha.ts uses, so every level lines up exactly

export interface TreePeriod {
  lord: DashaLord;
  start: Date;
  end: Date;
  /** Lords from the Mahadasha down to this period, e.g. ["Venus", "Sun", "Moon"]. */
  chain: DashaLord[];
}

/** The untruncated length of a period in years: the Mahadasha's years scaled by each sub-lord's share of 120. */
export function fullYears(chain: DashaLord[]): number {
  return chain.reduce((acc, lord, i) => (i === 0 ? DASHA_YEARS[lord] : (acc * DASHA_YEARS[lord]) / 120), 0);
}

/**
 * The nine (or, for a period already under way at birth, fewer) sub-periods
 * of `period`. A period cut short by birth is rebuilt from its theoretical
 * full start, and only the part after birth is kept — which is exactly how
 * the birth balance works at every level.
 */
export function childPeriods(period: TreePeriod): TreePeriod[] {
  const full = fullYears(period.chain) * YEAR_MS;
  const end = new Date(period.end).getTime();
  const actualStart = new Date(period.start).getTime();
  let cursor = end - full;
  const first = DASHA_SEQUENCE.indexOf(period.lord);
  const out: TreePeriod[] = [];
  for (let i = 0; i < 9; i++) {
    const lord = DASHA_SEQUENCE[(first + i) % 9];
    const s = cursor;
    const e = s + (full * DASHA_YEARS[lord]) / 120;
    cursor = e;
    if (e <= actualStart + 1000) continue; // ended before birth (allow for rounding)
    out.push({ lord, start: new Date(Math.max(s, actualStart)), end: new Date(e), chain: [...period.chain, lord] });
  }
  return out;
}

/** The chain of periods running at `at`, from the Mahadasha down to `depth` levels. */
export function periodsAt(mahadashas: { lord: DashaLord; start: Date | string; end: Date | string }[], at: Date, depth: number = MAX_DEPTH): TreePeriod[] {
  const t = at.getTime();
  const maha = mahadashas.find((m) => new Date(m.start).getTime() <= t && t < new Date(m.end).getTime());
  if (!maha) return [];
  const path: TreePeriod[] = [{ lord: maha.lord, start: new Date(maha.start), end: new Date(maha.end), chain: [maha.lord] }];
  while (path.length < depth) {
    const next = childPeriods(path[path.length - 1]).find((c) => c.start.getTime() <= t && t < c.end.getTime());
    if (!next) break;
    path.push(next);
  }
  return path;
}

/** "16y 2m", "3m 12d", "5d 4h", "3h 20m" — the two largest units of a span. */
export function formatSpan(ms: number): string {
  const minutes = Math.round(ms / 60000);
  const units: [string, number][] = [
    ["y", 525960],
    ["m", 43830],
    ["d", 1440],
    ["h", 60],
    ["min", 1],
  ];
  const parts: string[] = [];
  let rest = minutes;
  for (const [label, size] of units) {
    if (parts.length === 2) break;
    const n = Math.floor(rest / size);
    if (n > 0 || (parts.length === 1 && label !== "min")) {
      if (n > 0) parts.push(`${n}${label}`);
      rest -= n * size;
    }
  }
  return parts.join(" ") || "under a minute";
}
