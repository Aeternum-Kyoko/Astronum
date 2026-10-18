import { natalMarkers, MARKER_MEANING, type Marker } from "./chartMarkers";
import type { ReadingEvidence } from "./readingEvidence";
import type { KundaliChart } from "./types";
import type { PlanetName } from "./constants";
import type { Locale } from "../i18n/locale";
import { pick } from "../i18n/ui";
import { term } from "../i18n/terms";

export interface TopicAssessment {
  lead: string;
  plainLead: string;
  balance: "support" | "mixed" | "pressure" | "limited";
  supporting: ReadingEvidence | null;
  demanding: ReadingEvidence | null;
  activation: string;
  markers: { planet: PlanetName; symbol: Marker; meaning: string }[];
  limitation: string;
}

const HOUSE_CONTEXT = [
  ["identity and personal direction", "पहचान और अपनी दिशा"],
  ["income, family and speech", "आय, परिवार और वाणी"],
  ["initiative and communication", "पहल और संवाद"],
  ["home and emotional foundations", "घर और भावनात्मक आधार"],
  ["learning and creativity", "अध्ययन और रचनात्मकता"],
  ["service, work and challenges", "सेवा, काम और चुनौतियाँ"],
  ["partnerships", "साझेदारी"],
  ["change and shared resources", "परिवर्तन और साझा संसाधन"],
  ["beliefs, mentors and long journeys", "विश्वास, मार्गदर्शक और लंबी यात्राएँ"],
  ["career and public responsibility", "करियर और सार्वजनिक जिम्मेदारी"],
  ["networks and gains", "संबंध-जाल और लाभ"],
  ["distant places, withdrawal and expenses", "दूर स्थान, एकांत और खर्च"],
] as const;
const MARKER_HI: Record<Marker, string> = { "↑": "उच्च", "↓": "नीच", R: "वक्री", C: "अस्त", V: "वर्गोत्तम" };

/** A restrained synthesis of already-calculated evidence, never an event probability. */
export function assessTopic(
  chart: KundaliChart,
  title: string,
  houses: readonly number[],
  karakas: readonly PlanetName[],
  evidence: readonly { house: number; items: ReadingEvidence[] }[],
  activeLords: readonly PlanetName[],
  locale: Locale = "en",
): TopicAssessment {
  const L = pick(locale);
  const n = (word: string) => term(locale, word);
  const mainHouse = houses[0];
  const lord = chart.houseLords.find(item => item.house === mainHouse)?.lord;
  const placement = chart.planets.find(planet => planet.planet === lord);
  const subject = HOUSE_CONTEXT[(placement?.house ?? 1) - 1];
  const mainItems = evidence.find(item => item.house === mainHouse)?.items ?? [];
  const allItems = evidence.flatMap(item => item.items);
  const priority = (item: ReadingEvidence) => item.method === "D1" ? 0 : item.method === "Shadbala" ? 1 : item.method === "Varga" ? 2 : item.method === "Ashtakavarga" ? 3 : 4;
  const relevant = (tone: ReadingEvidence["tone"]) => [...mainItems.filter(item => item.tone === tone).sort((a, b) => priority(a) - priority(b)), ...allItems.filter(item => item.tone === tone && item.house !== mainHouse).sort((a, b) => priority(a) - priority(b))];
  const supporting = relevant("support")[0] ?? null;
  const demanding = relevant("pressure")[0] ?? null;
  const balance = supporting && demanding ? "mixed" : supporting ? "support" : demanding ? "pressure" : "limited";
  const lead = placement && lord
    ? placement.house === mainHouse
      ? L(`The main house lord ${lord} remains in house ${mainHouse}, concentrating this topic around ${subject[0]}.`, `मुख्य भाव के स्वामी ${n(lord)} भाव ${mainHouse} में ही हैं; यह विषय ${subject[1]} पर केंद्रित है।`)
      : L(`${title} connects with ${subject[0]}: its main house lord ${lord} is placed in house ${placement.house}.`, `${title} का संबंध ${subject[1]} से है: मुख्य भाव के स्वामी ${n(lord)} भाव ${placement.house} में हैं।`)
    : L(`${title} needs a closer reading of its main house.`, `${title} के मुख्य भाव का और अध्ययन चाहिए।`);
  const plainLead = placement
    ? placement.house === mainHouse
      ? L(`${title} is a prominent theme in this chart: its ruling planet stays in the area it governs.`, `${title} इस कुंडली का प्रमुख विषय है: इसका स्वामी अपने ही भाव में है।`)
      : L(`${title} may unfold through ${subject[0]}; the ruling planet sits in that part of the chart.`, `${title} का संबंध ${subject[1]} से बनता है; इसका स्वामी उस भाव में है।`)
    : lead;
  const active = [...new Set(activeLords)];
  const activation = active.length
    ? L(`${active.map(n).join(" / ")} is a running dasha lord linked to this topic. This marks activation, not a promised event.`, `${active.map(n).join(" / ")} की वर्तमान दशा इस विषय से जुड़ती है। यह सक्रियता है, निश्चित घटना नहीं।`)
    : L("The running three dasha levels do not directly connect in these checks; avoid treating the current date as a specific event window.", "इन जाँचों में वर्तमान तीन दशा स्तरों का सीधा संबंध नहीं मिला; इस तिथि को निश्चित घटना की अवधि न मानें।");
  const marks = natalMarkers(chart);
  const relevantPlanets = [...new Set([lord, ...karakas].filter((planet): planet is PlanetName => Boolean(planet)))];
  const markers = relevantPlanets.flatMap(planet => [...(marks[planet] ?? "")].filter((symbol): symbol is Marker => symbol in MARKER_MEANING).map(symbol => ({ planet, symbol, meaning: locale === "hi" ? MARKER_HI[symbol] : MARKER_MEANING[symbol] })));
  return {
    lead, plainLead, balance, supporting, demanding, activation, markers,
    limitation: L("These are traditional chart indicators. Birth-time uncertainty can change divisional placements and fine timing; contrary indicators remain part of the reading.", "ये पारंपरिक कुंडली संकेत हैं। जन्म-समय की अनिश्चितता वर्ग स्थितियाँ और सूक्ष्म समय बदल सकती है; विरोधी संकेत भी व्याख्या का भाग हैं।"),
  };
}
