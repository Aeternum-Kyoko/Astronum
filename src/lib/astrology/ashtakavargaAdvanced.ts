import { ASHTAKAVARGA_PLANETS, type AshtakavargaPlanet } from "./constants";
import type { KundaliChart } from "./types";
import { prastarashtakavarga } from "./kundliTables";
import type { Contributor } from "./ashtakavarga";

export const KAKSHYA_LORDS: readonly Contributor[] = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon", "Ascendant"];
const PAIRS = [[0, 7], [1, 6], [2, 5], [8, 11], [9, 10]] as const;
const RASI_MULTIPLIERS = [7, 10, 8, 4, 10, 6, 7, 8, 9, 5, 11, 12];
const GRAHA_MULTIPLIERS = { Sun: 5, Moon: 5, Mars: 8, Mercury: 5, Jupiter: 10, Venus: 7, Saturn: 5 };

function check(values: readonly number[]) {
  if (values.length !== 12 || values.some(v => !Number.isInteger(v) || v < 0 || v > 8)) throw new Error("Expected twelve BAV counts from 0 to 8.");
}

/** §12.7, Vedic Astrology: An Integrated Approach. Zero in a trine leaves it unchanged. */
export function trikonaShodhana(raw: readonly number[]) {
  check(raw);
  const reduced = [...raw];
  const steps = Array.from({ length: 4 }, (_, i) => {
    const signs = [i, i + 4, i + 8];
    const before = signs.map(s => raw[s]);
    const subtract = Math.min(...before);
    signs.forEach(s => { reduced[s] -= subtract; });
    return { signs, before, after: signs.map(s => reduced[s]), rule: subtract === 0 ? "zero: unchanged" : `subtract minimum ${subtract}` };
  });
  return { values: reduced, steps };
}

/** Co-owned sign reduction. Occupancy uses the seven classical planets, excluding nodes and Lagna.
 * For the occupied/empty equal-value case this implementation clears the empty sign.
 */
export function ekadhipatyaShodhana(trikona: readonly number[], occupied: ReadonlySet<number>) {
  check(trikona);
  const values = [...trikona];
  const steps = PAIRS.map(([a, b]) => {
    const before = [values[a], values[b]];
    let rule = "zero: unchanged";
    if (values[a] && values[b]) {
      if (occupied.has(a) && occupied.has(b)) rule = "both occupied: unchanged";
      else if (occupied.has(a) || occupied.has(b)) {
        const empty = occupied.has(a) ? b : a;
        const full = empty === a ? b : a;
        values[empty] = values[empty] <= values[full] ? 0 : values[full];
        rule = "one occupied: clear empty if lower/equal, otherwise cap to occupied";
      } else if (values[a] === values[b]) {
        values[a] = values[b] = 0;
        rule = "both empty and equal: clear both";
      } else {
        values[a] = values[b] = Math.min(values[a], values[b]);
        rule = "both empty: reduce higher to lower";
      }
    }
    return { signs: [a, b], before, after: [values[a], values[b]], rule };
  });
  return { values, steps };
}

export function ashtakavargaAdvanced(chart: KundaliChart, target: AshtakavargaPlanet) {
  const raw = [...chart.ashtakavarga.bhinna[target]];
  const contributors = prastarashtakavarga(chart, target);
  const classical = chart.planets.filter(p => (ASHTAKAVARGA_PLANETS as readonly string[]).includes(p.planet));
  const occupied = new Set(classical.map(p => p.signIndex));
  const trikona = trikonaShodhana(raw);
  const ekadhipatya = ekadhipatyaShodhana(trikona.values, occupied);
  const rasiPinda = ekadhipatya.values.reduce((sum, v, i) => sum + v * RASI_MULTIPLIERS[i], 0);
  const grahaPinda = classical.reduce((sum, p) => sum + ekadhipatya.values[p.signIndex] * GRAHA_MULTIPLIERS[p.planet as AshtakavargaPlanet], 0);
  return { raw, contributors, occupied: [...occupied], trikona, ekadhipatya, rasiPinda, grahaPinda, sodhyaPinda: rasiPinda + grahaPinda };
}

/** A Kakshya is a 3°45′ segment; its own contributor's raw PAV point is used. */
export function kakshyaAt(chart: KundaliChart, target: string, longitude: number) {
  if (!(ASHTAKAVARGA_PLANETS as readonly string[]).includes(target)) return null;
  if (!Number.isFinite(longitude)) throw new Error("Invalid Kakshya longitude.");
  const lon = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(lon / 30);
  const index = Math.min(7, Math.floor((lon % 30) / 3.75));
  const lord = KAKSHYA_LORDS[index];
  const good = prastarashtakavarga(chart, target as AshtakavargaPlanet).find(r => r.contributor === lord)!.bindus[signIndex];
  return { index, lord, good, signIndex, startDegree: index * 3.75, endDegree: (index + 1) * 3.75 };
}
