import { computeAspects } from "./aspects";
import { ASHTAKAVARGA_PLANETS, SIGN_LORDS, type AshtakavargaPlanet, type PlanetName } from "./constants";
import { vargaDignityPoints } from "./panchadhaMaitri";
import type { ShadbalaResult } from "./types";

export type StrengthVerdict = "Strong" | "Balanced" | "Weak";

export interface BhavaStrengthEntry {
  house: number;
  score: number; // 0-100, a heuristic — not the classical Bhava Bala system
  verdict: StrengthVerdict;
  rationale: string;
}

/** Classical exaltation/own-sign dignity isn't assessed for the lunar nodes; an occupying Rahu/Ketu gets a flat mid-scale contribution instead. */
const NODE_DIGNITY_POINTS = 15; // out of 45 — a Panchadha Maitri "Friend" tier

function isAshtakavargaPlanet(planet: PlanetName): planet is AshtakavargaPlanet {
  return (ASHTAKAVARGA_PLANETS as readonly string[]).includes(planet);
}

/**
 * House-by-house strength for one chart — a *documented approximation*
 * composed from data this app already computes (BPHS's full Bhava Bala
 * system is out of scope): the house lord's condition (real Shadbala rupas
 * when available, i.e. for the D1 chart; otherwise the lord's dignity in
 * this chart via the shared `vargaDignityPoints`), the average dignity of
 * any occupants, and net graha-drishti received by the house (via its
 * occupants, or its lord when the house is empty).
 */
export function analyzeBhavaStrength(
  ascendantSignIndex: number,
  planets: { planet: PlanetName; signIndex: number }[],
  shadbala?: ShadbalaResult[]
): BhavaStrengthEntry[] {
  const signIndices = Object.fromEntries(
    planets.filter((p) => isAshtakavargaPlanet(p.planet)).map((p) => [p.planet, p.signIndex])
  ) as Record<AshtakavargaPlanet, number>;
  const shadbalaByPlanet = new Map((shadbala ?? []).map((s) => [s.planet, s]));
  const aspects = computeAspects(planets);

  return Array.from({ length: 12 }, (_, i) => {
    const house = i + 1;
    const signIndex = (ascendantSignIndex + i) % 12;
    const lord = SIGN_LORDS[signIndex] as AshtakavargaPlanet;

    const lordShadbala = shadbalaByPlanet.get(lord);
    let lordScore: number;
    let lordNote: string;
    if (lordShadbala) {
      const ratio = lordShadbala.rupas / lordShadbala.requiredRupas;
      lordScore = Math.max(0, Math.min(50, ratio * 35));
      lordNote = `its lord ${lord} is ${lordShadbala.isStrong ? "strong" : "under strength"} by Shadbala (${lordShadbala.rupas.toFixed(1)} of ${lordShadbala.requiredRupas} rupas required)`;
    } else {
      const points = vargaDignityPoints(lord, signIndices[lord], signIndices);
      lordScore = (points / 45) * 50;
      lordNote = `its lord ${lord} is ${points >= 30 ? "well-placed" : points >= 15 ? "adequately placed" : "weakly placed"} by dignity in this chart`;
    }

    const occupants = planets.filter((p) => p.signIndex === signIndex);
    let occupantScore: number;
    let occupantNote: string;
    if (occupants.length === 0) {
      occupantScore = 15;
      occupantNote = "no planet occupies it directly, so its story is carried mainly by its lord";
    } else {
      const totalPoints = occupants.reduce(
        (sum, o) => sum + (isAshtakavargaPlanet(o.planet) ? vargaDignityPoints(o.planet, o.signIndex, signIndices) : NODE_DIGNITY_POINTS),
        0
      );
      occupantScore = (totalPoints / occupants.length / 45) * 30;
      occupantNote = `it is occupied by ${occupants.map((o) => o.planet).join(", ")}`;
    }

    const relevantPlanets: PlanetName[] = occupants.length > 0 ? occupants.map((o) => o.planet) : [lord];
    const received = aspects.filter((a) => relevantPlanets.includes(a.to) && !relevantPlanets.includes(a.from));
    const aspectScore = Math.max(
      -20,
      Math.min(20, received.reduce((sum, a) => sum + (a.benefic ? 5 : -5), 0))
    );
    const aspectNote =
      received.length > 0
        ? `, and receives aspect${received.length > 1 ? "s" : ""} from ${received
            .map((a) => `${a.from} (${a.benefic ? "benefic" : "malefic"})`)
            .join(", ")}`
        : "";

    // A flat +10 baseline keeps an average, unremarkable house from bottoming out near 0.
    const score = Math.max(0, Math.min(100, Math.round(lordScore + occupantScore + aspectScore + 10)));
    const verdict: StrengthVerdict = score >= 65 ? "Strong" : score >= 40 ? "Balanced" : "Weak";

    const rationale = `${lordNote}; ${occupantNote}${aspectNote}.`;

    return { house, score, verdict, rationale };
  });
}
