import { NAKSHATRAS, SIGNS, SIGN_LORDS, type PlanetName } from "./constants";
import { computeAvakahada } from "./birthDetails";
import { grahaMaitriScore, VASHYA_ORDER, VASHYA_TABLE, YONI_ORDER, YONI_TABLE, type MoonInput } from "./matching";

/**
 * Dasa Porutham — the ten-point South Indian marriage match. Each porutham
 * passes or fails (a few can be "average"). Rajju and Vedha are decisive:
 * a failure in either is traditionally a reason to reject the match however
 * many others agree. Counts run from the girl's star/sign to the boy's.
 */

export type PoruthamResult = "Good" | "Average" | "Bad";

export interface Porutham {
  name: string;
  tamil: string;
  checks: string;
  result: PoruthamResult;
  detail: string;
  critical?: boolean;
}

export interface PoruthamMatch {
  poruthams: Porutham[];
  good: number;
  verdict: "Excellent match" | "Acceptable match" | "Not recommended";
  summary: string;
}

const N = Object.fromEntries(NAKSHATRAS.map((n, i) => [n, i])) as Record<string, number>;
const RAJJU: [string, string[]][] = [
  ["Siro (head)", ["Mrigashira", "Chitra", "Dhanishta"]],
  ["Kanta (neck)", ["Rohini", "Ardra", "Hasta", "Swati", "Shravana", "Shatabhisha"]],
  ["Nabhi (navel)", ["Krittika", "Punarvasu", "Uttara Phalguni", "Vishakha", "Uttara Ashadha", "Purva Bhadrapada"]],
  ["Kati (waist)", ["Bharani", "Pushya", "Purva Phalguni", "Anuradha", "Purva Ashadha", "Uttara Bhadrapada"]],
  ["Pada (feet)", ["Ashwini", "Ashlesha", "Magha", "Jyeshtha", "Mula", "Revati"]],
];
const RAJJU_EFFECT: Record<string, string> = {
  "Siro (head)": "danger to the husband's life",
  "Kanta (neck)": "danger to the wife's life",
  "Nabhi (navel)": "trouble with children",
  "Kati (waist)": "poverty",
  "Pada (feet)": "constant travel and separation",
};
const VEDHA_PAIRS: [string, string][] = [
  ["Ashwini", "Jyeshtha"], ["Bharani", "Anuradha"], ["Krittika", "Vishakha"], ["Rohini", "Swati"], ["Ardra", "Shravana"],
  ["Punarvasu", "Uttara Ashadha"], ["Pushya", "Purva Ashadha"], ["Ashlesha", "Mula"], ["Magha", "Revati"], ["Purva Phalguni", "Uttara Bhadrapada"],
  ["Uttara Phalguni", "Purva Bhadrapada"], ["Hasta", "Shatabhisha"], ["Mrigashira", "Dhanishta"], ["Mrigashira", "Chitra"], ["Chitra", "Dhanishta"],
];

const count = (from: number, to: number, cycle: number) => ((to - from + cycle) % cycle) + 1;
const rajjuOf = (n: number) => RAJJU.find(([, list]) => list.some((x) => N[x] === n))![0];

export function computePorutham(boy: MoonInput, girl: MoonInput): PoruthamMatch {
  const b = computeAvakahada(boy);
  const g = computeAvakahada(girl);
  const c = count(girl.nakshatraIndex, boy.nakshatraIndex, 27);
  const r = count(girl.signIndex, boy.signIndex, 12);
  const bn = NAKSHATRAS[boy.nakshatraIndex];
  const gn = NAKSHATRAS[girl.nakshatraIndex];
  const out: Porutham[] = [];

  const dinaGood = [2, 4, 6, 8, 0].includes(c % 9);
  out.push({ name: "Dina", tamil: "Dina Porutham", checks: "health and day-to-day harmony", result: dinaGood ? "Good" : "Bad", detail: `The boy's star is the ${c}${suffix(c)} from the girl's; counted in nines it leaves ${c % 9 || 9}, which is ${dinaGood ? "favourable" : "unfavourable"}.` });

  const ganaGood = b.gana === g.gana || (g.gana === "Deva" && b.gana === "Manushya");
  const ganaAvg = g.gana === "Manushya" && b.gana === "Deva";
  out.push({ name: "Gana", tamil: "Gana Porutham", checks: "temperament", result: ganaGood ? "Good" : ganaAvg ? "Average" : "Bad", detail: `Girl ${g.gana}, boy ${b.gana}${ganaGood ? " — matching temperaments" : ganaAvg ? " — workable" : " — clashing temperaments (Rakshasa with another gana)"}.` });

  const mahendraGood = [4, 7, 10, 13, 16, 19, 22, 25].includes(c);
  out.push({ name: "Mahendra", tamil: "Mahendra Porutham", checks: "children and family growth", result: mahendraGood ? "Good" : "Bad", detail: `Count ${c} from the girl's star ${mahendraGood ? "is" : "is not"} one of 4, 7, 10, 13, 16, 19, 22 or 25.` });

  const sd: PoruthamResult = c > 13 ? "Good" : c > 7 ? "Average" : "Bad";
  out.push({ name: "Stree Deergha", tamil: "Stree Deergha Porutham", checks: "the wife's well-being and prosperity", result: sd, detail: `The boy's star is ${c} from the girl's; more than 13 is ideal.` });

  const ys = YONI_TABLE[YONI_ORDER.indexOf(b.yoni)][YONI_ORDER.indexOf(g.yoni)];
  out.push({ name: "Yoni", tamil: "Yoni Porutham", checks: "physical and intimate compatibility", result: ys >= 3 ? "Good" : ys === 2 ? "Average" : "Bad", detail: `Boy ${b.yoni}, girl ${g.yoni}${ys === 0 ? " — sworn enemies" : ys >= 3 ? " — compatible" : ""}.` });

  const rasiGood = (r === 1 && boy.nakshatraIndex !== girl.nakshatraIndex) || [7, 9, 10, 11].includes(r);
  out.push({ name: "Rasi", tamil: "Rasi Porutham", checks: "family continuity and harmony", result: rasiGood ? "Good" : "Bad", detail: `The boy's Moon sign ${SIGNS[boy.signIndex]} is ${r}${suffix(r)} from the girl's ${SIGNS[girl.signIndex]}${[6, 8].includes(r) || r === 2 || r === 12 ? " — a 2/12 or 6/8 relation, traditionally avoided" : ""}.` });

  const lb = SIGN_LORDS[boy.signIndex] as PlanetName;
  const lg = SIGN_LORDS[girl.signIndex] as PlanetName;
  const ms = grahaMaitriScore(lb, lg);
  out.push({ name: "Rasi Adhipathi", tamil: "Rasiyathipathi Porutham", checks: "understanding between the families", result: ms >= 3 ? "Good" : ms >= 1 ? "Average" : "Bad", detail: `Sign lords ${lb} and ${lg} are ${ms >= 4 ? "friends" : ms >= 3 ? "neutral" : "unfriendly"} to each other.` });

  const vs = VASHYA_TABLE[VASHYA_ORDER.indexOf(b.vashya)][VASHYA_ORDER.indexOf(g.vashya)];
  out.push({ name: "Vasya", tamil: "Vasya Porutham", checks: "mutual attraction", result: vs >= 1 ? "Good" : "Bad", detail: `Boy ${b.vashya}, girl ${g.vashya}.` });

  const rb = rajjuOf(boy.nakshatraIndex);
  const rg = rajjuOf(girl.nakshatraIndex);
  out.push({ name: "Rajju", tamil: "Rajju Porutham", checks: "the longevity of the marriage — the most important", result: rb !== rg ? "Good" : "Bad", critical: true, detail: rb !== rg ? `Different rajjus (boy ${rb}, girl ${rg}).` : `Both in ${rb} rajju — traditionally said to bring ${RAJJU_EFFECT[rb]}.` });

  const vedha = VEDHA_PAIRS.some(([x, y]) => (x === bn && y === gn) || (x === gn && y === bn));
  out.push({ name: "Vedha", tamil: "Vedha Porutham", checks: "freedom from affliction", result: vedha ? "Bad" : "Good", critical: true, detail: vedha ? `${bn} and ${gn} obstruct each other (Vedha).` : `${bn} and ${gn} do not obstruct each other.` });

  const good = out.filter((p) => p.result === "Good").length + out.filter((p) => p.result === "Average").length * 0.5;
  const criticalFail = out.some((p) => p.critical && p.result === "Bad");
  const verdict: PoruthamMatch["verdict"] = criticalFail ? "Not recommended" : good >= 7 ? "Excellent match" : good >= 5 ? "Acceptable match" : "Not recommended";
  const summary = criticalFail
    ? `${out.filter((p) => p.critical && p.result === "Bad").map((p) => p.name).join(" and ")} ${out.filter((p) => p.critical && p.result === "Bad").length > 1 ? "fail" : "fails"} — traditionally decisive regardless of the other poruthams.`
    : `${good} of 10 poruthams agree, and both Rajju and Vedha pass.`;
  return { poruthams: out, good, verdict, summary };
}

function suffix(n: number) {
  return n % 10 === 1 && n % 100 !== 11 ? "st" : n % 10 === 2 && n % 100 !== 12 ? "nd" : n % 10 === 3 && n % 100 !== 13 ? "rd" : "th";
}
