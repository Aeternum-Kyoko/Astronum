import { readingContext } from "./readingContext";
import type { KundaliChart } from "./types";
import type { CurrentTransit } from "./transits";
import type { VargaKey } from "./constants";
import type { Locale } from "../i18n/locale";
import { term } from "../i18n/terms";
import { pick } from "../i18n/ui";

export type EvidenceTone = "support" | "pressure" | "context";
export interface ReadingEvidence {
  id: string; house: number; tone: EvidenceTone; statement: string;
  observation: string; rule: string; limitation: string; sourceTab: string;
  method: "D1" | "Shadbala" | "Combustion" | "Ashtakavarga" | "Varga" | "Dasha" | "Transit";
}

/** Each displayed assertion carries the measurement and exact rule that produced it.
 * No counts from dependent checks are presented as independent probabilities.
 */
export function readingEvidence(chart: KundaliChart, houses: readonly number[], vargas: readonly VargaKey[], at: Date, transits: readonly CurrentTransit[] | null, locale: Locale = "en") {
  const L = pick(locale), n = (v: string) => term(locale, v);
  return readingContext(chart, houses, vargas, at).map(c => {
    const items: ReadingEvidence[] = [];
    const subject = L(`House ${c.house} lord ${c.lord.lord}`, `भाव ${c.house} के स्वामी ${n(c.lord.lord)}`);
    const add = (key: string, method: ReadingEvidence["method"], tone: EvidenceTone, statement: string, observation: string, rule: string, limitation: string, sourceTab: string) => items.push({ id: `${c.house}:${key}`, house: c.house, method, tone, statement, observation, rule, limitation, sourceTab });
    const caveat = L("A single factor cannot establish an outcome; compare the other evidence and timing.", "एक संकेत से फल तय नहीं; अन्य संकेत और समय साथ देखें।");
    const placement = `${n(c.planet.sign)} · ${c.planet.degreeInSign.toFixed(4)}° · ${L("house", "भाव")} ${c.planet.house}`;
    add("placement", "D1", "context", L(`${subject} is placed in house ${c.planet.house}.`, `${subject} भाव ${c.planet.house} में हैं।`), placement,
      L("The house's whole-sign D1 sign supplies its lord; that planet's D1 house supplies the placement.", "D1 की भाव राशि से भावेश; ग्रह के D1 भाव से उसकी स्थिति।"), caveat, "rasi");
    if (c.planet.dignity) {
      const tone = ["Exalted", "Own Sign", "Moolatrikona"].includes(c.planet.dignity) ? "support" : c.planet.dignity === "Debilitated" ? "pressure" : "context";
      add("dignity", "D1", tone, L(`${subject} has ${c.planet.dignity.toLowerCase()} dignity in D1.`, `${subject} D1 में ${n(c.planet.dignity)} हैं।`), `${placement} · ${n(c.planet.dignity)}`,
        L("Dignity uses the planet's sign and, where applicable, degree within that sign.", "ग्रह की राशि और जहाँ लागू हो, राशि के भीतर अंश से स्थिति बनती है।"), L("Debilitation can have cancellation or support elsewhere; exaltation does not guarantee results.", "नीचता के साथ भंग या अन्य सहारा हो सकता है; उच्चता फल की गारंटी नहीं।"), "planets");
    }
    if (c.strength) add("strength", "Shadbala", c.strength.isStrong ? "support" : "pressure",
      L(`${subject} ${c.strength.isStrong ? "meets" : "is below"} its Shadbala reference.`, `${subject} षड्बल मानक ${c.strength.isStrong ? "पूरा करते हैं" : "से कम हैं"}।`), `${c.strength.rupas.toFixed(2)} / ${c.strength.requiredRupas} ${L("rupas", "रूपा")}`,
      L("Compare total Shadbala with this planet's required reference, rather than comparing different planets' totals.", "कुल षड्बल को इसी ग्रह के आवश्यक मानक से तुलना करें, दूसरे ग्रह से नहीं।"), L("Strength describes capacity, not whether every expression is favourable.", "बल क्षमता बताता है; हर फल की अनुकूलता नहीं।"), "shadbala");
    if (c.combust) add("combust", "Combustion", "pressure", L(`${subject} is combust.`, `${subject} अस्त हैं।`), L(`Sun ${chart.planets.find(p => p.planet === "Sun")!.siderealLongitude.toFixed(4)}°; ${c.lord.lord} ${c.planet.siderealLongitude.toFixed(4)}°.`, `सूर्य ${chart.planets.find(p => p.planet === "Sun")!.siderealLongitude.toFixed(4)}°; ${n(c.lord.lord)} ${c.planet.siderealLongitude.toFixed(4)}°।`),
      L("Angular separation from the Sun is checked against the engine's planet-specific combustion limit, including its retrograde convention.", "सूर्य से कोणीय दूरी को ग्रह के अस्त मानक और वक्री नियम से जाँचा जाता है।"), caveat, "planets");
    add("sav", "Ashtakavarga", c.bindus >= 30 ? "support" : c.bindus <= 24 ? "pressure" : "context",
      L(`House ${c.house}'s sign has ${c.bindus} raw SAV bindus.`, `भाव ${c.house} की राशि में ${c.bindus} मूल SAV बिंदु हैं।`), `${n(c.lord.sign)} · ${c.bindus}`,
      L("Raw natal SAV is indexed by zodiac sign. This app marks ≥30 supporting, ≤24 demanding, and 25–29 mixed.", "मूल जन्म SAV राशि से लिया जाता है। ऐप में ≥30 सहायक, ≤24 कठिन, 25–29 मिश्रित हैं।"), L("This is a transit-support convention, not a percentage or a reduced shodhana count.", "यह गोचर-सहारे का मानक है; प्रतिशत या शोधित बिंदु नहीं।"), "ashtakavarga");
    for (const v of c.vargas) {
      const tone = ["Exalted", "Own Sign", "Moolatrikona"].includes(v.dignity ?? "") ? "support" : v.dignity === "Debilitated" ? "pressure" : "context";
      add(`varga-${v.key}`, "Varga", tone, L(`${c.lord.lord} in ${v.key}: ${v.dignity?.toLowerCase() ?? "placement context"}.`, `${n(c.lord.lord)} ${v.key} में: ${v.dignity ? n(v.dignity) : "स्थिति संदर्भ"}।`), `${n(v.placement.sign)} · ${L("house", "भाव")} ${v.placement.house}${v.vargottama ? L(" · same sign as D1", " · D1 जैसी राशि") : ""}`,
        L("Inspect the D1 lord in this divisional chart using that chart's sign and ascendant.", "D1 भावेश को इस वर्ग की राशि और लग्न से देखें।"), L("Divisional houses are sensitive to birth-time precision; a varga signal does not replace D1.", "वर्ग भाव जन्म-समय पर निर्भर; वर्ग संकेत D1 का विकल्प नहीं।"), "vargas");
    }
    add("dasha", "Dasha", "context", c.activeLords.length ? L(`Running lords connect to house ${c.house}.`, `वर्तमान दशा स्वामी भाव ${c.house} से जुड़े हैं।`) : L(`No direct running-lord link to house ${c.house} in these checks.`, `इन जाँचों में वर्तमान दशा स्वामी का भाव ${c.house} से सीधा संबंध नहीं।`), `${at.toISOString()} · ${c.activeLords.map(n).join(" / ") || "—"}`,
      L("Match the running three natal Vimshottari lords to this house's lord, occupants or full aspects.", "जन्म विंशोत्तरी के वर्तमान तीन स्वामियों को भावेश, ग्रह या पूर्ण दृष्टि से जोड़ें।"), L("A link describes activation, not favourable outcome. Other dasha systems have separate rules.", "संबंध सक्रियता बताता है; अनुकूल फल नहीं। अन्य दशाओं के अलग नियम हैं।"), "dashas");
    if (transits !== null) {
      const passing = transits.filter(t => t.houseFromLagna === c.house);
      add("transit", "Transit", "context", L(`Transit occupancy of natal house ${c.house}.`, `जन्म भाव ${c.house} में गोचर।`), `${at.toISOString()} · ${passing.map(t => `${n(t.planet)} (${n(t.sign)})`).join(" / ") || L("No occupants", "कोई ग्रह नहीं")}`,
        L("This checks transit placement in the natal whole-sign house; aspects and modifiers are inspected in Transits.", "यह जन्म पूर्ण-राशि भाव में गोचर स्थिति देखता है; दृष्टि और संशोधक गोचर भाग में देखें।"), L("This is the report snapshot, not a continuous forecast.", "यह रिपोर्ट का समय-संदर्भ है; लगातार पूर्वानुमान नहीं।"), "transits");
    }
    const support = items.filter(e => e.tone === "support"), pressure = items.filter(e => e.tone === "pressure");
    return { house: c.house, lord: c.lord.lord, items, mixed: support.length > 0 && pressure.length > 0, missing: [
      ...(!c.strength ? [L("Shadbala is unavailable for this lord.", "इस भावेश का षड्बल उपलब्ध नहीं।")] : []),
      ...(transits === null ? [L("Current transit data has not loaded; timing uses the supplied reference date.", "वर्तमान गोचर नहीं आया; दिए संदर्भ समय से दशा है।")] : []),
    ] };
  });
}
