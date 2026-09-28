import { SIGNS, SIGN_LORDS, type PlanetName } from "./constants";
import { getDignity } from "./dignity";
import type { KundaliChart } from "./types";

/**
 * Jaimini astrology: Chara karakas, sign aspects (rashi drishti) and the
 * Chara dasha, following K. N. Rao's widely taught method.
 *  - Karakas: the seven planets ranked by degree within their sign — the
 *    highest is the Atmakaraka (self), then Amatya (career), Bhratri
 *    (siblings), Matri (mother), Putra (children), Gnati (rivals, illness)
 *    and Dara (spouse).
 *  - Rashi drishti: movable signs aspect the fixed signs except the one next
 *    to them, fixed aspect movable except the one next to them, and dual
 *    signs aspect the other duals.
 *  - Chara dasha: one period per sign, starting from the Lagna. The order
 *    runs forward when the 9th sign from the Lagna is a "direct" sign and
 *    backward otherwise. A sign's years are the count from it to its lord —
 *    forward for direct signs, backward for indirect — less one (12 if the
 *    lord is at home), plus one if the lord is exalted and minus one if it is
 *    debilitated. Each period divides into twelve equal sub-periods.
 */

export const KARAKA_NAMES = ["Atmakaraka", "Amatyakaraka", "Bhratrikaraka", "Matrikaraka", "Putrakaraka", "Gnatikaraka", "Darakaraka"] as const;
export type KarakaName = (typeof KARAKA_NAMES)[number];
export const KARAKA_MEANING: Record<KarakaName, string> = {
  Atmakaraka: "the self, soul's purpose and overall life direction",
  Amatyakaraka: "career, advisers and the means of success",
  Bhratrikaraka: "siblings, courage and gurus",
  Matrikaraka: "mother, home, education and comforts",
  Putrakaraka: "children, creativity and intelligence",
  Gnatikaraka: "rivals, disputes, debts and illness",
  Darakaraka: "the spouse and business partners",
};

/** Signs counted forward for Chara dasha years (Aries, Taurus, Gemini, Libra, Scorpio, Sagittarius). */
const DIRECT = new Set([0, 1, 2, 6, 7, 8]);

export interface Karaka {
  karaka: KarakaName;
  planet: PlanetName;
  degree: number;
  signIndex: number;
  house: number;
}

export function charaKarakas(chart: KundaliChart): Karaka[] {
  return chart.planets
    .filter((p) => p.planet !== "Rahu" && p.planet !== "Ketu")
    .sort((a, b) => b.degreeInSign - a.degreeInSign)
    .map((p, i) => ({ karaka: KARAKA_NAMES[i], planet: p.planet, degree: p.degreeInSign, signIndex: p.signIndex, house: p.house }));
}

/** Signs aspected by `sign` under Jaimini rashi drishti. */
export function rashiDrishti(sign: number): number[] {
  const mode = sign % 3; // 0 movable, 1 fixed, 2 dual
  const all = Array.from({ length: 12 }, (_, i) => i);
  if (mode === 0) return all.filter((s) => s % 3 === 1 && s !== (sign + 1) % 12);
  if (mode === 1) return all.filter((s) => s % 3 === 0 && s !== (sign + 11) % 12);
  return all.filter((s) => s % 3 === 2 && s !== sign);
}

/** Scorpio and Aquarius have two lords; the stronger one (with more planets, else the more advanced) decides. */
export function lordOfSign(chart: KundaliChart, sign: number): PlanetName {
  const P = new Map(chart.planets.map((p) => [p.planet, p]));
  const pair: [PlanetName, PlanetName] | null = sign === 7 ? ["Mars", "Ketu"] : sign === 10 ? ["Saturn", "Rahu"] : null;
  if (!pair) return SIGN_LORDS[sign] as PlanetName;
  const [a, b] = pair.map((pl) => P.get(pl)!);
  if (a.signIndex === sign && b.signIndex !== sign) return b.planet;
  if (b.signIndex === sign && a.signIndex !== sign) return a.planet;
  const count = (s: number) => chart.planets.filter((p) => p.signIndex === s).length;
  if (count(a.signIndex) !== count(b.signIndex)) return count(a.signIndex) > count(b.signIndex) ? a.planet : b.planet;
  return a.degreeInSign >= b.degreeInSign ? a.planet : b.planet;
}

export function charaYears(chart: KundaliChart, sign: number): number {
  const lord = lordOfSign(chart, sign);
  const lp = chart.planets.find((p) => p.planet === lord)!;
  const steps = DIRECT.has(sign) ? (lp.signIndex - sign + 12) % 12 : (sign - lp.signIndex + 12) % 12;
  let years = steps === 0 ? 12 : steps;
  const d = getDignity(lord, lp.signIndex);
  if (d === "Exalted") years += 1;
  if (d === "Debilitated") years -= 1;
  return Math.max(1, Math.min(12, years));
}

export interface CharaPeriod {
  signIndex: number;
  sign: string;
  years: number;
  start: Date;
  end: Date;
  house: number;
  subPeriods: { signIndex: number; sign: string; start: Date; end: Date }[];
}

const YEAR_MS = 365.25 * 86400000;

export function charaDasha(chart: KundaliChart, spanYears = 100): CharaPeriod[] {
  const lagna = chart.ascendant.signIndex;
  const forward = DIRECT.has((lagna + 8) % 12);
  const birth = new Date(chart.utcDate).getTime();
  const end = birth + spanYears * YEAR_MS;
  const out: CharaPeriod[] = [];
  let cursor = birth;
  for (let cycle = 0; cursor < end && cycle < 3; cycle++) {
    for (let k = 0; k < 12 && cursor < end; k++) {
      const sign = forward ? (lagna + k) % 12 : (lagna - k + 12) % 12;
      const first = charaYears(chart, sign);
      // The second cycle gives each sign what it didn't get in the first.
      const years = cycle === 0 ? first : cycle === 1 ? 12 - first || 12 : first;
      const s = cursor;
      const e = s + years * YEAR_MS;
      const subForward = DIRECT.has(sign);
      const subs: CharaPeriod["subPeriods"] = [];
      for (let j = 1; j <= 12; j++) {
        const ss = subForward ? (sign + j) % 12 : (sign - j + 12) % 12;
        subs.push({ signIndex: ss, sign: SIGNS[ss], start: new Date(s + ((j - 1) * (e - s)) / 12), end: new Date(s + (j * (e - s)) / 12) });
      }
      out.push({ signIndex: sign, sign: SIGNS[sign], years, start: new Date(s), end: new Date(e), house: ((sign - lagna + 12) % 12) + 1, subPeriods: subs });
      cursor = e;
    }
  }
  return out;
}

/** What a Chara dasha sign brings: its house, the karakas in it or aspecting it, and the planets there. */
export function charaReading(chart: KundaliChart, period: CharaPeriod, karakas: Karaka[]): string[] {
  const inSign = karakas.filter((k) => k.signIndex === period.signIndex);
  const aspecting = karakas.filter((k) => rashiDrishti(k.signIndex).includes(period.signIndex));
  const planets = chart.planets.filter((p) => p.signIndex === period.signIndex).map((p) => p.planet);
  const lines = [
    `${period.sign} is your ${ord(period.house)} house, so ${HOUSE_THEME[period.house]} lead${HOUSE_THEME[period.house].includes(" and ") ? "" : "s"} this period.`,
    planets.length ? `${planets.join(", ")} ${planets.length > 1 ? "sit" : "sits"} in ${period.sign} and colour${planets.length > 1 ? "" : "s"} it directly.` : `${period.sign} is empty, so its lord ${lordOfSign(chart, period.signIndex)} and the signs aspecting it decide the results.`,
  ];
  if (inSign.length) lines.push(`It holds your ${inSign.map((k) => `${k.karaka} (${k.planet}, ${KARAKA_MEANING[k.karaka]})`).join("; ")} — these matters are strongly activated.`);
  if (aspecting.length) lines.push(`By Jaimini aspect it is seen by your ${aspecting.map((k) => `${k.karaka} ${k.planet}`).join(", ")}, bringing ${[...new Set(aspecting.map((k) => KARAKA_MEANING[k.karaka].split(",")[0]))].join(", ")} into play.`);
  const ak = karakas[0];
  const fromAk = ((period.signIndex - ak.signIndex + 12) % 12) + 1;
  if ([1, 5, 9, 4, 7, 10].includes(fromAk)) lines.push(`It is ${ord(fromAk)} from your Atmakaraka — a supportive period for your personal goals.`);
  else if ([6, 8, 12].includes(fromAk)) lines.push(`It is ${ord(fromAk)} from your Atmakaraka — a period of tests, effort or withdrawal.`);
  return lines;
}

const ord = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const HOUSE_THEME: Record<number, string> = {
  1: "self, health and new beginnings",
  2: "money, family and speech",
  3: "effort, courage and siblings",
  4: "home, mother, property and studies",
  5: "children, intelligence and romance",
  6: "work, competition, debts and health",
  7: "marriage, partnerships and travel",
  8: "sudden change, research and inheritance",
  9: "luck, father, teachers and long journeys",
  10: "career and status",
  11: "gains, friends and fulfilled wishes",
  12: "expenses, foreign lands and spiritual growth",
};
