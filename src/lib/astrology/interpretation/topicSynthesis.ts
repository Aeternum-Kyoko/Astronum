import type { KundaliChart } from "../types";
import type { ReadingEvidence } from "../readingEvidence";
import type { TopicKey } from "../topicReading";
import type { TreePeriod } from "../dashaTree";
import type { Locale } from "../../i18n/locale";
import { term } from "../../i18n/terms";
import { readingContext } from "../readingContext";

export interface SynthesizedFactor {
  evidenceId: string;
  house: number;
  role: "primary" | "related";
  dependencyGroup: string;
  text: string;
}

export interface TopicSynthesis {
  version: 1;
  topic: TopicKey;
  conclusion: string;
  balance: "mixed" | "support" | "pressure" | "limited";
  support: SynthesizedFactor | null;
  counterpoint: SynthesizedFactor | null;
  timing: { text: string; start: string | null; end: string | null; evidenceId: string | null; relation: string | null };
  limits: string[];
  evidenceIds: string[];
}

const AREA: Record<TopicKey, [string, string]> = {
  career: ["work", "काम"], relationships: ["relationships", "संबंध"],
  wealth: ["money and resources", "धन और संसाधन"], education: ["learning", "शिक्षा"],
  property: ["home and property", "घर और संपत्ति"],
};
const HOUSE: Record<number, [string, string]> = {
  1: ["personal direction", "व्यक्तिगत दिशा"], 2: ["resources and family", "संसाधन और परिवार"],
  3: ["initiative and communication", "पहल और संवाद"], 4: ["home and foundations", "घर और आधार"],
  5: ["learning and creativity", "शिक्षा और रचनात्मकता"], 6: ["daily work and duties", "दैनिक काम और कर्तव्य"],
  7: ["partnership", "साझेदारी"], 8: ["shared resources and change", "साझा संसाधन और परिवर्तन"],
  9: ["study, beliefs and mentors", "अध्ययन, विश्वास और मार्गदर्शक"], 10: ["public work and responsibility", "सार्वजनिक काम और जिम्मेदारी"],
  11: ["networks and gains", "समूह और लाभ"], 12: ["expenses and withdrawal", "खर्च और एकांत"],
};

/** Stable, conservative selection: D1 and capacity checks lead; sensitive varga details remain in evidence. */
function select(items: ReadingEvidence[], tone: "support" | "pressure", mainHouse: number) {
  const rank: Record<ReadingEvidence["method"], number> = { D1: 0, Shadbala: 1, Combustion: 2, Ashtakavarga: 3, Varga: 4, Dasha: 5, Transit: 6 };
  return items.filter(item => item.tone === tone && item.method !== "Varga" && item.method !== "Ashtakavarga")
    .sort((a, b) => Number(a.house !== mainHouse) - Number(b.house !== mainHouse) || rank[a.method] - rank[b.method] || a.id.localeCompare(b.id))[0] ?? null;
}

function factor(item: ReadingEvidence | null, chart: KundaliChart, mainHouse: number, locale: Locale): SynthesizedFactor | null {
  if (!item) return null;
  const lord = chart.houseLords.find(entry => entry.house === item.house)?.lord;
  if (!lord) return null;
  const planet = locale === "hi" ? term(locale, lord) : lord;
  const primary = item.house === mainHouse;
  let text: string;
  if (locale === "hi") {
    text = `${primary ? "मुख्य भाव" : `संबंधित भाव ${item.house}`} में ${item.statement}`;
  } else {
    const prefix = primary ? "" : `A related factor (house ${item.house}): `;
    if (item.method === "D1") text = `${prefix}${planet} has ${item.tone === "support" ? "supportive" : "demanding"} dignity in the birth chart.`;
    else if (item.method === "Shadbala") text = `${prefix}${planet} ${item.tone === "support" ? "meets" : "falls below"} its strength reference. This describes capacity, not an outcome.`;
    else if (item.method === "Combustion") text = `${prefix}${planet} is close enough to the Sun to be marked combust in this calculation.`;
    else text = item.statement;
  }
  return { evidenceId: item.id, house: item.house, role: primary ? "primary" : "related", dependencyGroup: `D1:house-${item.house}:lord-${lord}`, text };
}

/** Compose existing calculated evidence without adding an event prediction or a probability. */
export function synthesizeTopic(
  chart: KundaliChart,
  topic: TopicKey,
  houses: readonly number[],
  evidence: readonly { house: number; items: ReadingEvidence[] }[],
  running: readonly TreePeriod[],
  at: Date,
  locale: Locale = "en",
): TopicSynthesis {
  const mainHouse = houses[0];
  const mainLord = chart.houseLords.find(entry => entry.house === mainHouse)?.lord;
  const placement = chart.planets.find(planet => planet.planet === mainLord);
  const topicName = AREA[topic][locale === "hi" ? 1 : 0];
  const all = evidence.flatMap(entry => entry.items);
  const support = factor(select(all, "support", mainHouse), chart, mainHouse, locale);
  const counterpoint = factor(select(all, "pressure", mainHouse), chart, mainHouse, locale);
  const balance = support && counterpoint ? "mixed" : support ? "support" : counterpoint ? "pressure" : "limited";
  const lordName = mainLord ? term(locale, mainLord) : null;
  const placementName = placement ? HOUSE[placement.house]?.[locale === "hi" ? 1 : 0] : null;
  let conclusion = locale === "hi" ? `इन जाँचों से ${topicName} पर स्पष्ट निष्कर्ष नहीं बनता।` : `These checks do not establish a clear direction for ${topicName}.`;
  if (lordName && placementName) {
    const connection = locale === "hi"
      ? `${topicName} के भावेश ${lordName} का संबंध ${placementName} से बनता है।`
      : `The planet governing ${topicName}, ${lordName}, sits in the part of the chart associated with ${placementName}.`;
    const reading = locale === "hi"
      ? balance === "mixed" ? "इसके समर्थन और विरोध, दोनों संकेत हैं।" : balance === "support" ? "इस विषय में सहायक संकेत है।" : balance === "pressure" ? "इस विषय में कठिन संकेत है।" : "इससे अकेले फल तय नहीं होता।"
      : balance === "mixed" ? "The main indicators pull in different directions." : balance === "support" ? "A supporting indicator strengthens this reading." : balance === "pressure" ? "A demanding indicator tempers this reading." : "That placement alone does not settle the outcome.";
    conclusion = `${connection} ${reading}`;
  }
  // The same typed context supplies both the evidence and its exact relationship.
  const contexts = readingContext(chart, houses, [], at);
  const houseLink = contexts.flatMap(context => running.flatMap(period => {
    const relation = period.lord === context.lord.lord ? "lord" : context.occupants.some(p => p.planet === period.lord) ? "occupant" : context.aspects.some(p => p.planet === period.lord) ? "aspect" : null;
    return relation ? [{ period, house: context.house, relation, evidenceId: `${context.house}:dasha` }] : [];
  })).sort((a, b) => Number(a.house !== mainHouse) - Number(b.house !== mainHouse) || a.period.chain.length - b.period.chain.length)[0];
  const timing = houseLink ? {
    text: locale === "hi"
      ? `${term(locale, houseLink.period.lord)} की वर्तमान दशा भाव ${houseLink.house} से ${houseLink.relation === "lord" ? "स्वामी" : houseLink.relation === "occupant" ? "स्थित ग्रह" : "दृष्टि"} के रूप में जुड़ती है। यह विषय की सक्रियता है, घटना का वादा नहीं।`
      : `${houseLink.period.lord} is running and links to ${topicName} as ${houseLink.relation === "lord" ? "lord" : houseLink.relation === "occupant" ? "occupant" : "an aspecting planet"} of ${houseLink.house === mainHouse ? "its main house" : `a related house (${houseLink.house})`}. This activates the topic without establishing an event.`,
    start: houseLink.period.start.toISOString(), end: houseLink.period.end.toISOString(), evidenceId: houseLink.evidenceId,
    relation: `${houseLink.relation}:house-${houseLink.house}`,
  } : {
    text: locale === "hi" ? "वर्तमान दशा का इस विषय के मुख्य भाव या संबंधित भाव के स्वामी/स्थित ग्रह से सीधा संबंध इन जाँचों में नहीं मिला।" : `No direct running-period link to the ${topicName} houses' lords or occupants was established by these checks.`,
    start: null, end: null, evidenceId: null, relation: null,
  };
  const limits = [locale === "hi" ? "विरोधी संकेत और अन्य पद्धतियाँ इस संक्षिप्त व्याख्या में पूरी तरह नहीं सिमटतीं।" : "Other chart factors and methods can qualify this short reading."];
  if (all.some(item => item.method === "Varga")) limits.push(locale === "hi" ? "वर्ग कुंडली के विवरण जन्म-समय पर निर्भर हैं; उनकी विश्वसनीयता अलग से जाँचें।" : "Divisional-chart details depend on birth-time reliability; check them separately.");
  return { version: 1, topic, conclusion, balance, support, counterpoint, timing, limits,
    evidenceIds: [...new Set([support?.evidenceId, counterpoint?.evidenceId, timing.evidenceId].filter((id): id is string => Boolean(id)))],
  };
}
