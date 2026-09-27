import { SIGNS, SIGN_LORDS, type PlanetName } from "./constants";
import { getAspectedHouses } from "./aspects";
import { getDignity } from "./dignity";
import { analyzeBhavaStrength } from "./bhavaStrength";
import { SIGN_REFERENCE } from "./reference/signs";
import type { KundaliChart } from "./types";
import { DIGNITY_WORD } from "./houseReadings";

/**
 * Career from the chart the way an astrologer builds it up:
 *  - the 10th house: its sign, lord, occupants and aspects;
 *  - the Dasamsa (D10): its ascendant, and where the D1 10th lord lands in it;
 *  - the Jaimini Amatyakaraka, the "minister" planet of profession;
 *  - every planet's link to the 10th, weighted, which ranks the fields;
 *  - the 6th (service) against the 7th (trade and partners) for job or business;
 *  - the dasha periods that activate career, split into rise and change.
 */

export interface CareerInfluence {
  planet: PlanetName;
  weight: number;
  why: string[];
}

export interface CareerAnalysis {
  tenth: { sign: string; lord: PlanetName; lordHouse: number; occupants: PlanetName[]; aspectedBy: PlanetName[]; text: string[] };
  d10: { ascendant: string; text: string[] } | null;
  atmakaraka: PlanetName;
  amatyakaraka: PlanetName;
  amatyaText: string;
  influences: CareerInfluence[];
  fields: { planet: PlanetName; fields: string[]; why: string }[];
  signStyle: string;
  mode: { verdict: "Job" | "Business" | "Either"; jobScore: number; businessScore: number; reasons: string[] };
  periods: { label: string; start: Date; end: Date; kind: "Rise" | "Change" | "Steady"; why: string }[];
}

export const CAREER_FIELDS: Record<PlanetName, string[]> = {
  Sun: ["Government and civil services", "Administration and management", "Politics", "Medicine (especially cardiology)", "Leadership roles"],
  Moon: ["Hospitality and food", "Nursing and care work", "Public relations and sales", "Dairy, water and shipping", "Psychology and counselling"],
  Mars: ["Engineering", "Army, police and defence", "Surgery", "Real estate and construction", "Sports", "Manufacturing"],
  Mercury: ["Business and trade", "Accounting and finance", "Writing, media and journalism", "IT and software", "Teaching languages and maths", "Consulting"],
  Jupiter: ["Teaching and academia", "Law and judiciary", "Banking and investment", "Priesthood and counselling", "Finance advisory"],
  Venus: ["Arts, music and film", "Fashion and design", "Luxury, beauty and cosmetics", "Hotels and entertainment", "Vehicles and interiors"],
  Saturn: ["Industry and heavy machinery", "Mining, oil and labour-intensive trades", "Civil engineering and infrastructure", "Law enforcement and administration", "Social work"],
  Rahu: ["Technology and research into the new", "Foreign trade and multinational firms", "Aviation", "Media, advertising and politics", "Pharmaceuticals"],
  Ketu: ["Research and investigation", "Spiritual and healing work", "Coding and technical niches", "Astrology and occult sciences", "Alternative medicine"],
};

const ELEMENT_STYLE: Record<string, string> = {
  Fire: "You work best where you can lead, initiate and be visible.",
  Earth: "You work best with practical, measurable results — money, systems and material things.",
  Air: "You work best with ideas, people and communication.",
  Water: "You work best where care, intuition and emotional intelligence matter.",
};

const listOf = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const dist = (from: number, to: number) => ((to - from + 12) % 12) + 1;

export function careerAnalysis(chart: KundaliChart, now = new Date()): CareerAnalysis {
  const P = new Map(chart.planets.map((p) => [p.planet, p]));
  const lagna = chart.ascendant.signIndex;
  const tenthSign = (lagna + 9) % 12;
  const lordOf = (h: number) => SIGN_LORDS[(lagna + h - 1) % 12] as PlanetName;
  const l10 = lordOf(10);
  const pl10 = P.get(l10)!;
  const occupants = chart.planets.filter((p) => p.house === 10).map((p) => p.planet);
  const aspectedBy = chart.planets.filter((p) => p.house !== 10 && getAspectedHouses(p.planet).includes(dist(p.signIndex, tenthSign))).map((p) => p.planet);

  const tenthText = [
    `Your 10th house falls in ${SIGNS[tenthSign]}, ruled by ${l10}. ${ELEMENT_STYLE[SIGN_REFERENCE[tenthSign].element] ?? ""}`,
    `The 10th lord ${l10} sits in your ${ordinal(pl10.house)} house${pl10.dignity ? `, ${DIGNITY_WORD[pl10.dignity]}` : ""}. ${TENTH_LORD_IN[pl10.house]}`,
    occupants.length ? `${listOf(occupants)} ${occupants.length > 1 ? "occupy" : "occupies"} the 10th — ${occupants.map((o) => CAREER_FIELDS[o][0].toLowerCase()).join(", ")} and similar fields come naturally.` : "The 10th is empty, so its lord and the planets aspecting it decide the direction.",
    aspectedBy.length ? `${listOf(aspectedBy)} ${aspectedBy.length > 1 ? "aspect the 10th house and add their" : "aspects the 10th house and adds its"} flavour.` : "",
  ].filter(Boolean);

  // D10
  const D10 = chart.divisionalCharts.D10;
  let d10: CareerAnalysis["d10"] = null;
  if (D10) {
    const asc = D10.ascendant.signIndex;
    const d10Lord = SIGN_LORDS[asc] as PlanetName;
    const inD10 = (pl: PlanetName) => {
      const x = D10.planets.find((p) => p.planet === pl);
      return x ? dist(asc, x.signIndex) : null;
    };
    const l10InD10 = inD10(l10);
    const lordInD10 = inD10(d10Lord);
    const good = (h: number | null) => h !== null && [1, 4, 5, 7, 9, 10, 11].includes(h);
    const d10Dig = (() => {
      const x = D10.planets.find((p) => p.planet === l10);
      return x ? getDignity(l10, x.signIndex) : null;
    })();
    d10 = {
      ascendant: D10.ascendant.sign,
      text: [
        `The Dasamsa (D10), the chart of career, rises in ${D10.ascendant.sign}, ruled by ${d10Lord}, which sits in its ${lordInD10 ? ordinal(lordInD10) : "—"} house — ${good(lordInD10) ? "a supportive placement for professional growth" : "a placement that makes career growth take more effort"}.`,
        l10InD10 !== null
          ? `Your D1 10th lord ${l10} falls in the ${ordinal(l10InD10)} house of the D10${d10Dig ? ` (${d10Dig.toLowerCase()})` : ""} — ${good(l10InD10) ? "confirming the career promise of the birth chart" : "so the birth chart's promise is delivered with more struggle"}.`
          : "",
      ].filter(Boolean),
    };
  }

  // Jaimini karakas: seven planets by degree within their sign, highest first.
  const byDegree = chart.planets.filter((p) => p.planet !== "Rahu" && p.planet !== "Ketu").sort((a, b) => b.degreeInSign - a.degreeInSign);
  const atmakaraka = byDegree[0].planet;
  const amatyakaraka = byDegree[1].planet;
  const amk = P.get(amatyakaraka)!;
  const amatyaText = `${amatyakaraka} has the second-highest degree (${amk.degreeInSign.toFixed(1)}° in ${amk.sign}), making it your Amatyakaraka — the planet Jaimini astrology reads for profession. It sits in your ${ordinal(amk.house)} house, pointing to ${CAREER_FIELDS[amatyakaraka].slice(0, 2).join(" or ").toLowerCase()}.`;

  // Weighted influences on career
  const infl = new Map<PlanetName, CareerInfluence>();
  const add = (pl: PlanetName, w: number, why: string) => {
    const e = infl.get(pl) ?? { planet: pl, weight: 0, why: [] };
    e.weight += w;
    e.why.push(why);
    infl.set(pl, e);
  };
  add(l10, 4, "rules the 10th house");
  occupants.forEach((o) => add(o, 4, "sits in the 10th house"));
  aspectedBy.forEach((a) => add(a, 2, "aspects the 10th house"));
  add(amatyakaraka, 3, "is the Amatyakaraka");
  if (D10) {
    add(SIGN_LORDS[D10.ascendant.signIndex] as PlanetName, 2, "rules the D10 ascendant");
    D10.planets.filter((p) => dist(D10.ascendant.signIndex, p.signIndex) === 10 || dist(D10.ascendant.signIndex, p.signIndex) === 1).forEach((p) => add(p.planet, 2, `sits in the ${dist(D10.ascendant.signIndex, p.signIndex) === 1 ? "1st" : "10th"} house of the D10`));
  }
  // The planet in the sign of the 10th lord (the dispositor chain) colours too
  const disp = SIGN_LORDS[pl10.signIndex] as PlanetName;
  if (disp !== l10) add(disp, 1, "is the dispositor of the 10th lord");
  for (const e of infl.values()) {
    const bala = chart.shadbala.find((s) => s.planet === e.planet);
    if (bala?.isStrong) {
      e.weight += 1;
      e.why.push("is strong by Shadbala");
    }
  }
  const influences = [...infl.values()].sort((a, b) => b.weight - a.weight);
  const fields = influences.slice(0, 3).map((e) => ({ planet: e.planet, fields: CAREER_FIELDS[e.planet], why: `${e.planet} ${e.why.join(", ")}.` }));

  // Job or business
  const bhava = analyzeBhavaStrength(lagna, chart.planets, chart.shadbala);
  const reasons: string[] = [];
  let job = bhava[5].score / 10;
  let biz = bhava[6].score / 10;
  reasons.push(`6th house (service) strength ${Math.round(bhava[5].score)}/100; 7th house (trade, partners, clients) ${Math.round(bhava[6].score)}/100.`);
  if (pl10.house === 6 || pl10.house === 10) {
    job += 3;
    reasons.push(`10th lord in the ${ordinal(pl10.house)} favours employment and service.`);
  }
  if (pl10.house === 7 || pl10.house === 3 || pl10.house === 11) {
    biz += 3;
    reasons.push(`10th lord in the ${ordinal(pl10.house)} favours independent work, trade or business.`);
  }
  const mercury = chart.shadbala.find((s) => s.planet === "Mercury");
  if (mercury?.isStrong) {
    biz += 2;
    reasons.push("A strong Mercury, the planet of commerce, supports business.");
  }
  const saturn = chart.shadbala.find((s) => s.planet === "Saturn");
  if (saturn?.isStrong) {
    job += 2;
    reasons.push("A strong Saturn, the planet of service and structure, supports steady employment.");
  }
  const l7 = P.get(lordOf(7))!;
  if ([1, 10, 11].includes(l7.house)) {
    biz += 2;
    reasons.push(`The 7th lord in the ${ordinal(l7.house)} brings business partners and clients.`);
  }
  if (P.get("Rahu")!.house === 10 || P.get("Rahu")!.house === 7) {
    biz += 1;
    reasons.push("Rahu in the 10th or 7th adds appetite for risk and enterprise.");
  }
  const verdict = Math.abs(job - biz) < 1.5 ? "Either" : job > biz ? "Job" : "Business";

  // Career periods
  const careerPlanets = new Set<PlanetName>([l10, ...occupants, amatyakaraka]);
  const changePlanets = new Set<PlanetName>(["Rahu", "Ketu", lordOf(8), lordOf(12)]);
  const periods: CareerAnalysis["periods"] = [];
  const birth = new Date(chart.utcDate).getTime();
  for (const md of chart.dashas) {
    for (const ad of md.subPeriods ?? []) {
      const s = new Date(ad.start);
      const e = new Date(ad.end);
      const age = (s.getTime() - birth) / (365.25 * 86400_000);
      if (e < now || age > 70) continue;
      const lordsHere = [md.lord, ad.lord] as PlanetName[];
      const careerHit = lordsHere.filter((l) => careerPlanets.has(l));
      if (!careerPlanets.has(ad.lord as PlanetName) && !(careerHit.length && changePlanets.has(ad.lord as PlanetName))) continue;
      const change = changePlanets.has(ad.lord as PlanetName) && !careerPlanets.has(ad.lord as PlanetName);
      const riseFactor = [lordOf(11), lordOf(9), lordOf(5)].includes(ad.lord as PlanetName) || careerHit.length === 2;
      periods.push({
        label: `${md.lord}–${ad.lord}`,
        start: s,
        end: e,
        kind: change ? "Change" : riseFactor ? "Rise" : "Steady",
        why: change
          ? `${ad.lord} brings shifts, job changes or new directions while ${careerHit.join(" and ")} keep career in focus`
          : `${ad.lord} ${ad.lord === l10 ? "rules the 10th" : occupants.includes(ad.lord as PlanetName) ? "sits in the 10th" : "is the Amatyakaraka"}${careerHit.length === 2 ? `, and ${md.lord} is also a career planet` : ""}`,
      });
      if (periods.length >= 8) break;
    }
    if (periods.length >= 8) break;
  }

  return {
    tenth: { sign: SIGNS[tenthSign], lord: l10, lordHouse: pl10.house, occupants, aspectedBy, text: tenthText },
    d10,
    atmakaraka,
    amatyakaraka,
    amatyaText,
    influences,
    fields,
    signStyle: ELEMENT_STYLE[SIGN_REFERENCE[tenthSign].element] ?? "",
    mode: { verdict, jobScore: Math.round(job * 10) / 10, businessScore: Math.round(biz * 10) / 10, reasons },
    periods,
  };
}

const TENTH_LORD_IN: Record<number, string> = {
  1: "Career is self-made and tied to your personality — you are your own brand.",
  2: "Career grows out of family, finance, speech or food; earnings from work accumulate well.",
  3: "Communication, media, sales, travel and your own initiative drive the career.",
  4: "Work connects to property, vehicles, education or home; possibly working from home or in a family concern.",
  5: "Intelligence and creativity lead — teaching, advisory, speculation or creative fields; an auspicious placement.",
  6: "Service, competition, health, law or finance-related employment; success by beating rivals.",
  7: "Partnerships, clients, trade and foreign dealings; business is favoured.",
  8: "Career has sudden turns; research, insurance, occult, mining or hidden work suits, and there may be breaks.",
  9: "Fortune supports career — teaching, law, religion, long-distance work; mentors help.",
  10: "The lord in its own house — a strong, stable career and public reputation.",
  11: "Career brings gains and networks; large organisations and fulfilled ambitions.",
  12: "Work abroad, in hospitals, ashrams, prisons or behind the scenes; expenses tied to work.",
};
