import { aspectsSign } from "./aspects";
import { signOffsetHouse } from "./math";
import type { PlanetPlacement } from "./types";
import type { Locale } from "../i18n/locale";
import { term } from "../i18n/terms";
import { ordHi } from "../i18n/hiGrammar";

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

const REF_HI: Record<MangalReference, string> = { Lagna: "लग्न", Moon: "चंद्र", Venus: "शुक्र" };
const SEVERITY_HI: Record<MangalDoshaResult["severity"], string> = { none: "शून्य", mild: "हल्का", moderate: "मध्यम", strong: "प्रबल" };

/** A cancellation from analyzeMangalDosha, in Hindi. */
export function mangalCancellationHi(c: string): string {
  const own = c.match(/^Mars is in (\w+), (its sign of exaltation|its own sign)/);
  if (own) return `मंगल ${term("hi", own[1])} में ${own[2] === "its own sign" ? "अपनी राशि" : "अपनी उच्च राशि"} में हैं, जो शास्त्रों के अनुसार दोष को निष्प्रभावी करता है।`;
  if (c.startsWith("Mars is conjunct Jupiter")) return "मंगल की गुरु से युति है, जिसका शुभ प्रभाव शास्त्रों के अनुसार दोष को भंग करता है।";
  if (c.startsWith("Jupiter aspects Mars")) return "गुरु की मंगल पर दृष्टि है, जिसका शुभ प्रभाव शास्त्रों के अनुसार दोष को भंग करता है।";
  return c;
}

export function describeMangalDosha(result: MangalDoshaResult, locale: Locale = "en"): string {
  const { houseFrom, sources, cancellations, severity, status } = result;
  if (locale === "hi") {
    const positions = `मंगल लग्न से ${ordHi(houseFrom.Lagna)}, चंद्र से ${ordHi(houseFrom.Moon)} और शुक्र से ${ordHi(houseFrom.Venus)} भाव में हैं।`;
    if (status === "absent") return `${positions} इनमें से कोई भी मांगलिक भाव (1, 2, 4, 7, 8, 12) नहीं है, इसलिए मांगलिक दोष नहीं बनता।`;
    const list = sources.map((x) => REF_HI[x]);
    const joined = list.length <= 1 ? list.join("") : `${list.slice(0, -1).join(", ")} और ${list[list.length - 1]}`;
    const flagged = `यह ${joined} से बनता है — संदर्भ-बिंदुओं की सामान्य गणना से ${SEVERITY_HI[severity]} दोष।`;
    if (status === "cancelled") return `${positions} ${flagged} परंतु: ${cancellations.map(mangalCancellationHi).join(" ")} इसलिए इसे सामान्यतः भंग माना जाता है।`;
    return `${positions} ${flagged} कुंडली मिलान में इसे ध्यान से तौला जाता है, जहाँ दो मांगलिक कुंडलियाँ एक-दूसरे को संतुलित करती मानी जाती हैं।`;
  }
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
