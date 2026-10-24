import type { PlanetName } from "./astrology/constants";

export interface SkyPosition { planet: PlanetName; longitude: number }

/** Labels may move for legibility; longitude markers must never move with them. */
export function skyLabelAngles(positions: SkyPosition[]): Map<PlanetName, number> {
  if (!positions.length) return new Map();
  const sorted = [...positions].sort((a, b) => a.longitude - b.longitude);
  let start = 0;
  let largestGap = -1;
  sorted.forEach((p, i) => {
    const gap = (sorted[(i + 1) % sorted.length].longitude - p.longitude + 360) % 360;
    if (gap > largestGap) { largestGap = gap; start = (i + 1) % sorted.length; }
  });
  const order = [...sorted.slice(start), ...sorted.slice(0, start)];
  const minimumGap = Math.min(24, 360 / order.length);
  const angles = order.map(p => p.longitude < order[0].longitude ? p.longitude + 360 : p.longitude);
  for (let i = 1; i < angles.length; i++) angles[i] = Math.max(angles[i], angles[i - 1] + minimumGap);
  // Keep the first and last labels separated across the 0° boundary too.
  angles[angles.length - 1] = Math.min(angles.at(-1)!, angles[0] + 360 - minimumGap);
  for (let i = angles.length - 2; i >= 0; i--) angles[i] = Math.min(angles[i], angles[i + 1] - minimumGap);
  return new Map(order.map((p, i) => [p.planet, ((angles[i] % 360) + 360) % 360]));
}

/** Floor instead of rounding into the next sign, nakshatra, or pada. */
export function skyDegreeText(longitude: number): string {
  const minutes = Math.floor((((longitude % 30) + 30) % 30) * 60);
  return `${Math.floor(minutes / 60)}° ${String(minutes % 60).padStart(2, "0")}′`;
}
