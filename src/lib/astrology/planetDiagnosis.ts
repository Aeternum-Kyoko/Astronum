import { SIGN_LORDS, type PlanetName } from "./constants";
import type { Dignity } from "./dignity";
import { grahaTable, type GrahaRow } from "./dashboard";
import type { KundaliChart } from "./types";

/**
 * One verdict per planet that weighs every strength measure the app computes,
 * the way an astrologer sizes up a graha before predicting from it: Shadbala
 * (six-fold strength), Vimshopaka (strength across the sixteen vargas), dignity
 * in the Rasi and the Navamsa, vargottama, house placement, combustion and
 * Baladi avastha. Rahu and Ketu, which have no Shadbala or dignity here, are
 * judged by house and by the planet whose sign they occupy.
 */

export type Grade = "Excellent" | "Good" | "Average" | "Weak" | "Very weak";

export interface Factor {
  label: string;
  points: number;
}

export interface PlanetDiagnosis {
  planet: PlanetName;
  /** 0–100; 50 is an ordinary, unremarkable planet. */
  score: number;
  grade: Grade;
  factors: Factor[];
  summary: string;
}

const D1: Record<Dignity, number> = { Exalted: 15, Moolatrikona: 12, "Own Sign": 10, "Friend's Sign": 5, "Neutral Sign": 0, "Enemy's Sign": -6, Debilitated: -15 };
const BENEFIC = new Set<PlanetName>(["Jupiter", "Venus", "Mercury", "Moon"]);

export const gradeOf = (score: number): Grade => (score >= 70 ? "Excellent" : score >= 57 ? "Good" : score >= 43 ? "Average" : score >= 30 ? "Weak" : "Very weak");

const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;

function houseFactor(planet: PlanetName, house: number): Factor | null {
  if ([1, 4, 7, 10].includes(house)) return { label: `In the ${ordinal(house)}, a kendra`, points: 6 };
  if ([5, 9].includes(house)) return { label: `In the ${ordinal(house)}, a trikona`, points: 6 };
  if ([3, 6, 11].includes(house) && !BENEFIC.has(planet)) return { label: `Malefic in the ${ordinal(house)}, an upachaya`, points: 5 };
  if (house === 11) return { label: "In the 11th, the house of gains", points: 4 };
  if ([6, 8, 12].includes(house)) return { label: `In the ${ordinal(house)}, a dusthana`, points: BENEFIC.has(planet) ? -8 : -4 };
  return null;
}

function diagnose(r: GrahaRow, nodeDispositor?: PlanetDiagnosis): PlanetDiagnosis {
  const planet = r.planet as PlanetName;
  const f: Factor[] = [];
  if (r.shadbala) {
    const pts = Math.round(Math.max(-20, Math.min(20, (r.shadbala.ratio - 1) * 40)));
    f.push({ label: `Shadbala ${r.shadbala.rupas.toFixed(2)} of ${r.shadbala.required} rupas (${Math.round(r.shadbala.ratio * 100)}%)`, points: pts });
  }
  if (r.vimshopaka != null) f.push({ label: `Vimshopaka ${r.vimshopaka.toFixed(1)} of 20 across the vargas`, points: Math.round(Math.max(-15, Math.min(15, (r.vimshopaka - 10) * 2))) });
  if (r.dignity) f.push({ label: `${r.dignity} in the Rasi`, points: D1[r.dignity] });
  if (r.d9Dignity) f.push({ label: `${r.d9Dignity} in the Navamsa`, points: Math.round(D1[r.d9Dignity] / 2) });
  if (r.vargottama) f.push({ label: "Vargottama (same sign in D1 and D9)", points: 6 });
  const hf = houseFactor(planet, r.house);
  if (hf) f.push(hf);
  if (r.combust) f.push({ label: "Combust — too close to the Sun", points: -8 });
  if (r.avastha === "Yuva") f.push({ label: "Yuva avastha (youthful, full power)", points: 4 });
  else if (r.avastha === "Kumara") f.push({ label: "Kumara avastha (growing)", points: 2 });
  else if (r.avastha === "Vriddha") f.push({ label: "Vriddha avastha (ageing)", points: -2 });
  else if (r.avastha === "Mrita") f.push({ label: "Mrita avastha (spent)", points: -5 });
  if (nodeDispositor) {
    f.push({ label: `Acts through its sign lord ${nodeDispositor.planet} (${nodeDispositor.grade.toLowerCase()})`, points: Math.round((nodeDispositor.score - 50) / 3) });
  }

  const score = Math.max(0, Math.min(100, Math.round(50 + f.reduce((a, x) => a + x.points, 0))));
  const grade = gradeOf(score);
  const best = [...f].sort((a, b) => b.points - a.points)[0];
  const worst = [...f].sort((a, b) => a.points - b.points)[0];
  const summary =
    grade === "Excellent" || grade === "Good"
      ? `${planet} is ${grade.toLowerCase()} — it can deliver its significations well${best && best.points > 0 ? `, helped most by: ${best.label.toLowerCase()}` : ""}.`
      : grade === "Average"
        ? `${planet} is average — its results depend on its periods and support from other planets.`
        : `${planet} is ${grade.toLowerCase()} — its periods need patience and remedies${worst && worst.points < 0 ? `; the main drag: ${worst.label.toLowerCase()}` : ""}.`;
  return { planet, score, grade, factors: f, summary };
}

export function planetDiagnosis(chart: KundaliChart): PlanetDiagnosis[] {
  const rows = grahaTable(chart).filter((r) => r.planet !== "Lagna");
  const seven = rows.filter((r) => r.planet !== "Rahu" && r.planet !== "Ketu").map((r) => diagnose(r));
  const of = new Map(seven.map((d) => [d.planet, d]));
  const nodes = rows
    .filter((r) => r.planet === "Rahu" || r.planet === "Ketu")
    .map((r) => {
      const p = chart.planets.find((x) => x.planet === r.planet)!;
      return diagnose(r, of.get(SIGN_LORDS[p.signIndex] as PlanetName));
    });
  return [...seven, ...nodes];
}
