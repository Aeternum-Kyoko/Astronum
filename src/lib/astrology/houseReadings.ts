import type { PlanetName } from "./constants";
import { HOUSE_SIGNIFICATION } from "./content";
import { getAspectedHouses } from "./aspects";
import { analyzeBhavaStrength, type StrengthVerdict } from "./bhavaStrength";
import { HOUSE_REFERENCE } from "./reference/houses";
import { PLANET_REFERENCE } from "./reference/planets";
import { isCombust } from "./birthDetails";
import type { KundaliChart } from "./types";

/**
 * A full reading of each of the twelve bhavas: its sign, its lord and where
 * that lord went, the planets inside it, the planets aspecting it, its
 * Sarvashtakavarga bindus, its natural significators, a strength verdict with
 * the reasons, the body areas it governs, and the dasha periods that bring it
 * alive. Everything is derived from the chart; only the wording is templated.
 */

export interface HouseReading {
  house: number;
  sanskrit: string;
  classification: string[];
  themes: string;
  sign: string;
  lord: PlanetName;
  lordHouse: number;
  lordSign: string;
  lordText: string;
  occupants: { planet: PlanetName; text: string; note?: string }[];
  aspects: { planet: PlanetName; benefic: boolean }[];
  aspectText: string;
  karakas: { planet: PlanetName; text: string }[];
  sav: number;
  savText: string;
  strength: { score: number; verdict: StrengthVerdict; rationale: string };
  body: string;
  summary: string;
  periods: { label: string; start: Date; end: Date; why: string }[];
}

const KENDRA = [1, 4, 7, 10];
const TRIKONA = [1, 5, 9];
const DUSTHANA = [6, 8, 12];
const BENEFICS = new Set<PlanetName>(["Jupiter", "Venus", "Mercury", "Moon"]);

const BODY: Record<number, string> = {
  1: "head, brain and overall constitution",
  2: "face, eyes, mouth, teeth and throat",
  3: "shoulders, arms, hands, ears and lungs",
  4: "chest, heart and breasts",
  5: "upper abdomen, stomach, liver and spine",
  6: "intestines, digestion and immunity",
  7: "lower abdomen, kidneys and bladder",
  8: "reproductive and excretory organs, chronic conditions",
  9: "hips and thighs",
  10: "knees, joints and bones",
  11: "calves, ankles and circulation",
  12: "feet, sleep and the left eye",
};

/** What any house lord does when it lands in a given house. */
const LANDS_IN: Record<number, string> = {
  1: "brings this house's matters to you personally — you embody and drive these matters, and they shape your identity",
  2: "ties this house's matters to money, family and speech — they become a source of income or a family matter",
  3: "makes this house's matters depend on your own effort, courage, communication and siblings",
  4: "roots this house's matters in home, mother, property and inner peace",
  5: "links this house's matters with intelligence, children, creativity and past merit — an auspicious flow",
  6: "puts this house's matters through competition, service, debt or health issues — gains come by overcoming obstacles",
  7: "channels this house's matters through partners, marriage, clients and public dealings",
  8: "makes this house's matters uncertain and transformative — sudden changes, hidden matters, research or inheritance",
  9: "blesses this house's matters with luck, teachers, dharma and long journeys — one of the best placements",
  10: "turns this house's matters into career and public standing — they become visible and action-oriented",
  11: "makes this house's matters a source of gains, networks and fulfilled wishes",
  12: "sends this house's matters towards expense, distance, foreign lands, rest or spiritual release",
};

export const DIGNITY_WORD: Record<string, string> = {
  Exalted: "exalted",
  Moolatrikona: "in its Moolatrikona sign",
  "Own Sign": "in its own sign",
  "Friend's Sign": "in a friend's sign",
  "Neutral Sign": "in a neutral sign",
  "Enemy's Sign": "in an enemy's sign",
  Debilitated: "debilitated",
};

const listJoin = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const first = (h: number) => HOUSE_SIGNIFICATION[h].split(",").slice(0, 2).join(" and").replace(" and and", " and");

export function houseReadings(chart: KundaliChart, now = new Date()): HouseReading[] {
  const strength = analyzeBhavaStrength(chart.ascendant.signIndex, chart.planets, chart.shadbala);
  const sun = chart.planets.find((p) => p.planet === "Sun")!;
  const horizon = new Date(now.getTime() + 30 * 365.25 * 86400_000);
  const P = new Map(chart.planets.map((p) => [p.planet, p]));

  return Array.from({ length: 12 }, (_, i) => {
    const house = i + 1;
    const ref = HOUSE_REFERENCE[i];
    const hl = chart.houseLords.find((h) => h.house === house)!;
    const signIndex = (chart.ascendant.signIndex + i) % 12;
    const lord = hl.lord;
    const lp = P.get(lord)!;
    const fromItself = ((hl.lordHouse - house + 12) % 12) + 1;

    // Lord placement
    const lordParts = [`The ${ordinal(house)} house falls in ${hl.sign}, so ${lord} is its lord. ${lord} sits in your ${ordinal(hl.lordHouse)} house, which ${LANDS_IN[hl.lordHouse]}.`];
    if (hl.lordHouse === house) lordParts.push("A lord in its own house protects and sustains everything this house stands for.");
    else if ([6, 8, 12].includes(fromItself)) lordParts.push(`It is ${ordinal(fromItself)} from the house it rules, a classically weak link — this house's matters meet ${fromItself === 6 ? "obstacles and disputes" : fromItself === 8 ? "disruptions and sudden turns" : "losses or distance"} before they settle.`);
    else if ([1, 4, 7, 10, 5, 9].includes(fromItself)) lordParts.push(`It is ${ordinal(fromItself)} from the house it rules, a supportive angle for this house.`);
    if (lp.dignity) lordParts.push(`${lord} is ${DIGNITY_WORD[lp.dignity]}${lp.dignity === "Exalted" || lp.dignity === "Own Sign" || lp.dignity === "Moolatrikona" ? ", so it delivers strongly" : lp.dignity === "Debilitated" ? ", so it struggles to deliver without support" : lp.dignity === "Enemy's Sign" ? ", which strains its results" : ""}.`);
    if (lord !== "Sun" && isCombust(lp, sun)) lordParts.push(`${lord} is combust, so the house's results need extra conscious effort.`);
    if (lp.retrograde && lord !== "Rahu" && lord !== "Ketu") lordParts.push(`${lord} is retrograde: results come after revisiting, delay or an unconventional route.`);

    // Occupants
    const occupants = chart.planets
      .filter((p) => p.house === house)
      .map((p) => {
        const ruled = chart.houseLords.filter((h) => h.lord === p.planet).map((h) => h.house);
        return {
          planet: p.planet,
          text: PLANET_REFERENCE.find((r) => r.name === p.planet)!.inHouses[i],
          note: ruled.length ? `As lord of your ${ruled.map(ordinal).join(" and ")}, it brings ${ruled.map(first).join(" and ")} into this house.` : undefined,
        };
      });

    // Aspects (graha drishti) on this house's sign
    const aspects = chart.planets
      .filter((p) => p.house !== house && getAspectedHouses(p.planet).includes(((signIndex - p.signIndex + 12) % 12) + 1))
      .map((p) => ({ planet: p.planet, benefic: BENEFICS.has(p.planet) }));
    const good = aspects.filter((a) => a.benefic).map((a) => a.planet);
    const join = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
    const bad = aspects.filter((a) => !a.benefic).map((a) => a.planet);
    const aspectText = aspects.length
      ? [good.length ? `${join(good)} ${good.length > 1 ? "aspect this house and protect it" : "aspects this house and protects it"}` : "", bad.length ? `${join(bad)} ${bad.length > 1 ? "aspect" : "aspects"} it, adding pressure, drive or delay` : ""]
          .filter(Boolean)
          .join("; ") + "."
      : "No planet aspects this house, so its lord and occupants decide its results on their own.";

    // Natural significators
    const karakas = ref.karaka.map((k) => {
      const kp = P.get(k)!;
      const bala = chart.shadbala.find((s) => s.planet === k);
      return {
        planet: k,
        text: `${k}, the natural significator, sits in your ${ordinal(kp.house)}${kp.dignity ? ` (${kp.dignity.toLowerCase()})` : ""}${bala ? ` and is ${bala.isStrong ? "strong" : "below strength"} by Shadbala` : ""}.`,
      };
    });
    if (ref.karaka.some((k) => P.get(k)!.house === house) && ref.karaka.length) {
      karakas.push({ planet: ref.karaka[0], text: "A significator sitting in its own house can, classically, overdo its results here (karako bhava nashaya) — balance is needed." });
    }

    const sav = chart.ashtakavarga.sarva[signIndex];
    const savText = `${sav} Sarvashtakavarga bindus (28 is average). ${sav >= 30 ? "Transits through this sign bring good results, and the house is well supported." : sav <= 24 ? "A low score — transits here tend to strain these matters; handle them with care." : "An average score."}`;

    const st = strength[i];
    const verdictWord = st.verdict === "Strong" ? "well supported" : st.verdict === "Balanced" ? "moderately supported" : "in need of care";
    const summary = `Your ${ordinal(house)} house of ${first(house)} is ${verdictWord}. ${
      KENDRA.includes(hl.lordHouse) || TRIKONA.includes(hl.lordHouse) ? `Its lord in a ${TRIKONA.includes(hl.lordHouse) ? "trikona" : "kendra"} is a strength.` : DUSTHANA.includes(hl.lordHouse) ? "Its lord in a dusthana means results come through effort and time." : ""
    } ${occupants.length ? `${listJoin(occupants.map((o) => o.planet))} ${occupants.length > 1 ? "live" : "lives"} here and colour${occupants.length > 1 ? "" : "s"} it.` : "It is empty, so read it through its lord."}`.replace(/\s+/g, " ");

    // Periods: Antardashas of the lord and occupants, upcoming within ~30 years
    const relevant = new Set<PlanetName>([lord, ...occupants.map((o) => o.planet)]);
    const periods: HouseReading["periods"] = [];
    for (const md of chart.dashas) {
      for (const ad of md.subPeriods ?? []) {
        const s = new Date(ad.start);
        const e = new Date(ad.end);
        if (e < now || s > horizon) continue;
        const hit = [md.lord, ad.lord].filter((l) => relevant.has(l as PlanetName));
        if (!hit.length || !relevant.has(ad.lord as PlanetName)) continue;
        periods.push({ label: `${md.lord}–${ad.lord}`, start: s, end: e, why: ad.lord === lord ? `${lord} rules this house` : `${ad.lord} sits in this house` });
        if (periods.length >= 4) break;
      }
      if (periods.length >= 4) break;
    }

    return {
      house,
      sanskrit: ref.sanskritName,
      classification: ref.classification,
      themes: HOUSE_SIGNIFICATION[house],
      sign: hl.sign,
      lord,
      lordHouse: hl.lordHouse,
      lordSign: hl.lordSign,
      lordText: lordParts.join(" "),
      occupants,
      aspects,
      aspectText,
      karakas,
      sav,
      savText,
      strength: { score: Math.round(st.score), verdict: st.verdict, rationale: st.rationale },
      body: BODY[house],
      summary,
      periods,
    };
  });
}

