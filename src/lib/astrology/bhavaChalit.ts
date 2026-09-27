import { normalizeDegrees } from "./math";

/**
 * Sripati bhava (house) division — the "Bhava Chalit" chart of North Indian
 * software. The Ascendant, IC, Descendant and MC are the madhyas (mid-points)
 * of houses 1, 4, 7 and 10; each quadrant between them is trisected for the
 * remaining madhyas; and each house starts at the sandhi (junction) halfway
 * between its madhya and the previous one. All longitudes are sidereal degrees.
 */

export interface Bhava {
  house: number;
  start: number; // sandhi
  madhya: number;
}

export function sripatiBhavas(ascendant: number, midheaven: number): Bhava[] {
  const asc = normalizeDegrees(ascendant);
  const mc = normalizeDegrees(midheaven);
  const ic = normalizeDegrees(mc + 180);
  const desc = normalizeDegrees(asc + 180);

  const madhya = new Array<number>(13);
  const trisect = (from: number, to: number, firstHouse: number) => {
    const arc = normalizeDegrees(to - from);
    madhya[firstHouse] = from;
    madhya[firstHouse + 1] = normalizeDegrees(from + arc / 3);
    madhya[firstHouse + 2] = normalizeDegrees(from + (2 * arc) / 3);
  };
  trisect(asc, ic, 1);
  trisect(ic, desc, 4);
  trisect(desc, mc, 7);
  trisect(mc, asc, 10);

  return Array.from({ length: 12 }, (_, i) => {
    const house = i + 1;
    const prev = madhya[house === 1 ? 12 : house - 1];
    const start = normalizeDegrees(prev + normalizeDegrees(madhya[house] - prev) / 2);
    return { house, start, madhya: madhya[house] };
  });
}

/** The bhava (1–12) a longitude falls in. */
export function bhavaOf(longitude: number, bhavas: Bhava[]): number {
  const lon = normalizeDegrees(longitude);
  for (let i = 0; i < 12; i++) {
    const start = bhavas[i].start;
    const end = bhavas[(i + 1) % 12].start;
    if (normalizeDegrees(lon - start) < normalizeDegrees(end - start)) return bhavas[i].house;
  }
  return 1; // unreachable: the 12 spans tile the circle
}
