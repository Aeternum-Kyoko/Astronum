import { aspectsSign } from "./aspects";
import { signOffsetHouse } from "./math";
import type { PlanetPlacement } from "./types";

/**
 * Mangal (Kuja) Dosha, read the way Indian matching software does: Mars in the
 * 1st, 2nd, 4th, 7th, 8th or 12th counted from each of the Lagna, the Moon and
 * Venus. The more reference points that flag it, the stronger it's held to be;
 * a few classical conditions are widely accepted as cancelling it.
 */

export const MANGAL_HOUSES = [1, 2, 4, 7, 8, 12];

export type MangalReference = "Lagna" | "Moon" | "Venus";

export interface MangalDoshaResult {
  /** House Mars occupies counted from each reference point. */
  houseFrom: Record<MangalReference, number>;
  /** Reference points from which Mars falls in a Mangal house. */
  sources: MangalReference[];
  /** Classical cancellations that apply to this chart (empty if none). */
  cancellations: string[];
  severity: "none" | "mild" | "moderate" | "strong";
  status: "absent" | "present" | "cancelled";
}

const OWN_OR_EXALTED_SIGNS = new Set([0, 7, 9]); // Aries, Scorpio (own), Capricorn (exalted)

export function analyzeMangalDosha(ascendantSignIndex: number, planets: PlanetPlacement[]): MangalDoshaResult {
  const find = (name: PlanetPlacement["planet"]) => planets.find((p) => p.planet === name)!;
  const mars = find("Mars");
  const moon = find("Moon");
  const venus = find("Venus");
  const jupiter = find("Jupiter");

  const houseFrom: Record<MangalReference, number> = {
    Lagna: signOffsetHouse(mars.signIndex, ascendantSignIndex),
    Moon: signOffsetHouse(mars.signIndex, moon.signIndex),
    Venus: signOffsetHouse(mars.signIndex, venus.signIndex),
  };
  const sources = (Object.keys(houseFrom) as MangalReference[]).filter((ref) => MANGAL_HOUSES.includes(houseFrom[ref]));

  const cancellations: string[] = [];
  if (sources.length > 0) {
    if (OWN_OR_EXALTED_SIGNS.has(mars.signIndex)) {
      cancellations.push(
        `Mars is in ${mars.sign}, ${mars.signIndex === 9 ? "its sign of exaltation" : "its own sign"}, which is classically held to neutralise the dosha.`
      );
    }
    if (jupiter.signIndex === mars.signIndex) {
      cancellations.push("Mars is conjunct Jupiter, whose benefic influence is classically held to cancel the dosha.");
    } else if (aspectsSign("Jupiter", signOffsetHouse(mars.signIndex, jupiter.signIndex))) {
      cancellations.push("Jupiter aspects Mars, whose benefic influence is classically held to cancel the dosha.");
    }
  }

  const severity = (["none", "mild", "moderate", "strong"] as const)[sources.length];
  const status = sources.length === 0 ? "absent" : cancellations.length > 0 ? "cancelled" : "present";
  return { houseFrom, sources, cancellations, severity, status };
}

export function describeMangalDosha(result: MangalDoshaResult): string {
  const { houseFrom, sources, cancellations, severity, status } = result;
  const positions = `Mars is in house ${houseFrom.Lagna} from the Lagna, ${houseFrom.Moon} from the Moon and ${houseFrom.Venus} from Venus.`;
  if (status === "absent") {
    return `${positions} None of these are Mangal houses (1, 2, 4, 7, 8, 12), so Mangal Dosha is not indicated.`;
  }
  const flagged = `It is flagged from the ${joinList(sources)} — a ${severity} dosha by the usual count of reference points.`;
  if (status === "cancelled") {
    return `${positions} ${flagged} However: ${cancellations.join(" ")} It is therefore generally read as cancelled.`;
  }
  return `${positions} ${flagged} This is traditionally weighed carefully in marriage matching, where two Manglik charts are held to balance each other.`;
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
