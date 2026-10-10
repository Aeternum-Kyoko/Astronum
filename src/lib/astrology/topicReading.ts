import { readingContext } from "./readingContext";
import { analyzeYogas } from "./yogaAnalysis";
import { isCombust } from "./birthDetails";
import { getDignity } from "./dignity";
import { periodsAt } from "./dashaTree";
import type { PlanetName, VargaKey } from "./constants";
import type { KundaliChart } from "./types";
import type { Locale } from "../i18n/locale";
import { term } from "../i18n/terms";
import { pick } from "../i18n/ui";

export const TOPICS = {
  relationships: { title: ["Relationships & marriage", "संबंध और विवाह"], houses: [7, 2, 5, 11], karakas: ["Venus", "Jupiter"], vargas: ["D9"], theme: ["partnership, commitment and communication", "साझेदारी, प्रतिबद्धता और संवाद"] },
  wealth: { title: ["Wealth & resources", "धन और संसाधन"], houses: [2, 11, 5, 9], karakas: ["Jupiter", "Venus", "Mercury"], vargas: ["D2"], theme: ["earning, saving and managing resources", "आय, बचत और संसाधन प्रबंधन"] },
  education: { title: ["Education & learning", "शिक्षा और अध्ययन"], houses: [4, 5, 9], karakas: ["Mercury", "Jupiter"], vargas: ["D24"], theme: ["learning habits, qualifications and guidance", "अध्ययन की आदतें, योग्यताएँ और मार्गदर्शन"] },
  property: { title: ["Home & property", "घर और संपत्ति"], houses: [4, 2, 11, 12], karakas: ["Moon", "Mars", "Venus"], vargas: ["D4", "D16"], theme: ["home, stability, property and comfort", "घर, स्थिरता, संपत्ति और सुख"] },
} as const;
export type TopicKey = keyof typeof TOPICS;

export function topicReading(chart: KundaliChart, key: TopicKey, now: Date, locale: Locale = "en") {
  const spec = TOPICS[key];
  const L = pick(locale);
  const n = (p: string) => term(locale, p);
  const context = readingContext(chart, spec.houses, spec.vargas as readonly VargaKey[], now);
  const support: string[] = [];
  const pressure: string[] = [];
  for (const c of context) {
    const subject = L(`House ${c.house} lord ${c.lord.lord}`, `भाव ${c.house} के स्वामी ${n(c.lord.lord)}`);
    if (["Exalted", "Own Sign", "Moolatrikona"].includes(c.planet.dignity ?? "")) support.push(L(`${subject} has ${c.planet.dignity?.toLowerCase()} dignity in D1.`, `${subject} D1 में ${n(c.planet.dignity!)} हैं।`));
    if (c.strength?.isStrong) support.push(L(`${subject} meets its Shadbala reference (${c.strength.rupas.toFixed(2)} / ${c.strength.requiredRupas} rupas).`, `${subject} षड्बल मानक पूरा करते हैं (${c.strength.rupas.toFixed(2)} / ${c.strength.requiredRupas} रूपा)।`));
    if (c.strength && !c.strength.isStrong) pressure.push(L(`${subject} is below its Shadbala reference (${c.strength.rupas.toFixed(2)} / ${c.strength.requiredRupas} rupas).`, `${subject} षड्बल मानक से कम हैं (${c.strength.rupas.toFixed(2)} / ${c.strength.requiredRupas} रूपा)।`));
    if (c.combust || c.planet.dignity === "Debilitated") pressure.push(L(`${subject} is ${c.combust ? "combust" : "debilitated"}; check support and cancellation before drawing conclusions.`, `${subject} ${c.combust ? "अस्त" : "नीच"} हैं; निष्कर्ष से पहले सहारा और भंग देखें।`));
    if (c.bindus >= 30) support.push(L(`House ${c.house} has ${c.bindus} SAV bindus, above the 28-point reference.`, `भाव ${c.house} में ${c.bindus} सर्वाष्टकवर्ग बिंदु हैं, 28 के मानक से अधिक।`));
    if (c.bindus <= 24) pressure.push(L(`House ${c.house} has ${c.bindus} SAV bindus; its sign has less transit support by this measure.`, `भाव ${c.house} में ${c.bindus} सर्वाष्टकवर्ग बिंदु हैं; इस माप से गोचर-सहारा कम है।`));
    for (const v of c.vargas) {
      if (["Exalted", "Own Sign"].includes(v.dignity ?? "")) support.push(L(`${c.lord.lord} is ${v.dignity?.toLowerCase()} in ${v.key}, supporting its expression through that chart.`, `${n(c.lord.lord)} ${v.key} में ${n(v.dignity!)} हैं, जिससे उस वर्ग का सहारा मिलता है।`));
      if (v.dignity === "Debilitated") pressure.push(L(`${c.lord.lord} is debilitated in ${v.key}; the divisional evidence differs from D1.`, `${n(c.lord.lord)} ${v.key} में नीच हैं; वर्ग के संकेत D1 से अलग हैं।`));
    }
  }
  const relevant = new Set<PlanetName>([...context.map((c) => c.lord.lord), ...context.flatMap((c) => c.occupants.map((p) => p.planet)), ...spec.karakas as readonly PlanetName[]]);
  const sun = chart.planets.find((p) => p.planet === "Sun")!;
  const karakas = (spec.karakas as readonly PlanetName[]).map((planet) => {
    const p = chart.planets.find((p) => p.planet === planet)!;
    const strength = chart.shadbala.find((s) => s.planet === planet);
    return { planet, placement: p, strength, combust: planet !== "Sun" && isCombust(p, sun), vargas: (spec.vargas as readonly VargaKey[]).map((key) => {
      const vp = chart.divisionalCharts[key].planets.find((p) => p.planet === planet)!;
      return { key, placement: vp, dignity: getDignity(planet, vp.signIndex) };
    }) };
  });
  const active = periodsAt(chart.dashas, now, 3).filter((p) => relevant.has(p.lord));
  const horizon = now.getTime() + 10 * 365.25 * 86400000;
  const periods = chart.dashas.flatMap((m) => (m.subPeriods ?? []).map((a) => ({ ...a, maha: m.lord })))
    .filter((a) => new Date(a.end).getTime() > now.getTime() && new Date(a.start).getTime() <= horizon && relevant.has(a.lord)).slice(0, 6);
  const yogas = analyzeYogas(chart, now, locale).findings.filter((y) => y.houses.some((h) => (spec.houses as readonly number[]).includes(h)) && y.planets.some((p) => relevant.has(p)));
  const summary = L(`Read ${spec.theme[0]} through the ${spec.houses.join(", ")} houses and ${spec.vargas.join(" / ")}. ${support.length && pressure.length ? "Supporting and demanding signals coexist; the timing and strength of the active planets matter." : pressure.length ? "Some factors need care; this describes areas to examine, not a fixed outcome." : "The available supporting factors should be read alongside timing and your circumstances."}`,
    `${spec.theme[1]} को भाव ${spec.houses.join(", ")} और ${spec.vargas.join(" / ")} से पढ़ें। ${support.length && pressure.length ? "सहायक और कठिन संकेत साथ हैं; सक्रिय ग्रहों का समय और बल देखें।" : pressure.length ? "कुछ संकेतों पर ध्यान चाहिए; यह निश्चित फल नहीं है।" : "सहायक संकेतों के साथ समय और वास्तविक परिस्थितियाँ भी देखें।"}`);
  return { title: L(spec.title[0], spec.title[1]), summary, support: [...new Set(support)], pressure: [...new Set(pressure)], context, karakas, active, periods, yogas };
}
