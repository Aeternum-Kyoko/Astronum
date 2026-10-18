import type { CurrentTransit } from "./transits";
import { readingEvidence } from "./readingEvidence";
import { readingContext } from "./readingContext";
import { analyzeYogas } from "./yogaAnalysis";
import { isCombust } from "./birthDetails";
import { getDignity } from "./dignity";
import { periodsAt } from "./dashaTree";
import type { PlanetName, VargaKey } from "./constants";
import type { KundaliChart } from "./types";
import type { Locale } from "../i18n/locale";
import { pick } from "../i18n/ui";
import { assessTopic } from "./topicAssessment";
import { synthesizeTopic } from "./interpretation/topicSynthesis";

export const TOPICS = {
  career: { title: ["Career & direction", "करियर और दिशा"], houses: [10, 6, 2, 11], karakas: ["Sun", "Saturn", "Mercury"], vargas: ["D10"], theme: ["work, responsibility and professional growth", "कार्य, जिम्मेदारी और व्यावसायिक प्रगति"] },
  relationships: { title: ["Relationships & marriage", "संबंध और विवाह"], houses: [7, 2, 5, 11], karakas: ["Venus", "Jupiter"], vargas: ["D9"], theme: ["partnership, commitment and communication", "साझेदारी, प्रतिबद्धता और संवाद"] },
  wealth: { title: ["Wealth & resources", "धन और संसाधन"], houses: [2, 11, 5, 9], karakas: ["Jupiter", "Venus", "Mercury"], vargas: ["D2"], theme: ["earning, saving and managing resources", "आय, बचत और संसाधन प्रबंधन"] },
  education: { title: ["Education & learning", "शिक्षा और अध्ययन"], houses: [4, 5, 9], karakas: ["Mercury", "Jupiter"], vargas: ["D24"], theme: ["learning habits, qualifications and guidance", "अध्ययन की आदतें, योग्यताएँ और मार्गदर्शन"] },
  property: { title: ["Home & property", "घर और संपत्ति"], houses: [4, 2, 11, 12], karakas: ["Moon", "Mars", "Venus"], vargas: ["D4", "D16"], theme: ["home, stability, property and comfort", "घर, स्थिरता, संपत्ति और सुख"] },
} as const;
export type TopicKey = keyof typeof TOPICS;

export function topicReading(chart: KundaliChart, key: TopicKey, now: Date, locale: Locale = "en", transits: readonly CurrentTransit[] | null = null) {
  const spec = TOPICS[key];
  const L = pick(locale);
  const context = readingContext(chart, spec.houses, spec.vargas as readonly VargaKey[], now);
  const evidence = readingEvidence(chart, spec.houses, spec.vargas as readonly VargaKey[], now, transits, locale);
  const supportEvidence = evidence.flatMap(h => h.items.filter(e => e.tone === "support"));
  const pressureEvidence = evidence.flatMap(h => h.items.filter(e => e.tone === "pressure"));
  const support = supportEvidence.map(e => e.statement);
  const pressure = pressureEvidence.map(e => e.statement);
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
  const title = L(spec.title[0], spec.title[1]);
  const assessment = assessTopic(chart, title, spec.houses, spec.karakas as readonly PlanetName[], evidence, active.map(period => period.lord), locale);
  const synthesis = synthesizeTopic(chart, key, spec.houses, evidence, periodsAt(chart.dashas, now, 3), now, locale);
  const summary = synthesis.conclusion;
  return { title, summary, assessment, synthesis, evidence, support: [...new Set(support)], pressure: [...new Set(pressure)], context, karakas, active, periods, yogas, supportEvidence, pressureEvidence };
}
