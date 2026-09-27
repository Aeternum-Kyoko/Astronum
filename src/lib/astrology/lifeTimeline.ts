import { SIGNS, SIGN_LORDS, type PlanetName } from "./constants";
import { getAspectedHouses } from "./aspects";
import { siderealLongitude } from "./ephemeris";
import { FRIENDS, ENEMIES } from "./dignity";
import { analyzeYogas } from "./yogaAnalysis";
import { saturnCycles } from "./transits";
import type { KundaliChart } from "./types";

/**
 * An age-by-age map of life. Every Antardasha from birth to 90 is read for
 * the life events it is most likely to bring, judged the way timing is
 * done classically:
 *  - which houses the Mahadasha and Antardasha lords rule, occupy and aspect;
 *  - whether the event's natural significator is running;
 *  - whether Jupiter and Saturn both touch the event's house (double transit);
 *  - and whether the event suits that age.
 * Alongside sit the fixed milestones: Jupiter, Saturn and Rahu returns,
 * Sade Sati and the classical maturity ages of the planets.
 */

export type EventTheme = "education" | "career" | "marriage" | "children" | "property" | "travel" | "wealth" | "health" | "spiritual";
export type Tone = "Supportive" | "Mixed" | "Demanding";

export interface TimelineTheme {
  kind: EventTheme;
  label: string;
  score: number;
  why: string[];
}

export interface TimelineAntar {
  lord: PlanetName;
  start: Date;
  end: Date;
  ageStart: number;
  ageEnd: number;
  tone: Tone;
  houses: number[];
  themes: TimelineTheme[];
  note: string;
}

export interface TimelineMaha {
  lord: PlanetName;
  start: Date;
  end: Date;
  ageStart: number;
  ageEnd: number;
  tone: Tone;
  summary: string;
  antars: TimelineAntar[];
}

export interface Milestone {
  age: number;
  date: Date;
  label: string;
  text: string;
}

export interface LifeTimeline {
  mahas: TimelineMaha[];
  milestones: Milestone[];
}

const THEMES: Record<EventTheme, { label: string; houses: number[]; karaka: PlanetName[]; ages: [number, number]; primary: number }> = {
  education: { label: "Education and learning", houses: [4, 5, 9], karaka: ["Mercury", "Jupiter"], ages: [4, 27], primary: 5 },
  career: { label: "Career start or rise", houses: [10, 6, 11], karaka: ["Sun", "Saturn", "Mercury"], ages: [17, 68], primary: 10 },
  marriage: { label: "Marriage or a committed relationship", houses: [7, 2, 11], karaka: ["Venus", "Jupiter"], ages: [20, 42], primary: 7 },
  children: { label: "Children", houses: [5, 9, 11], karaka: ["Jupiter"], ages: [22, 45], primary: 5 },
  property: { label: "Home, property or vehicle", houses: [4, 11, 2], karaka: ["Mars", "Venus"], ages: [24, 80], primary: 4 },
  travel: { label: "Relocation, foreign travel or settling abroad", houses: [12, 9, 3], karaka: ["Rahu"], ages: [16, 80], primary: 12 },
  wealth: { label: "Financial gains", houses: [2, 11, 5, 9], karaka: ["Jupiter", "Venus"], ages: [20, 90], primary: 11 },
  health: { label: "Health needs attention", houses: [6, 8, 12], karaka: ["Saturn", "Mars"], ages: [0, 90], primary: 6 },
  spiritual: { label: "Spiritual growth and inner change", houses: [9, 12, 8], karaka: ["Ketu", "Jupiter"], ages: [35, 90], primary: 12 },
};

const MATURITY: Partial<Record<PlanetName, number>> = { Jupiter: 16, Sun: 22, Moon: 24, Venus: 25, Mars: 28, Mercury: 32, Saturn: 36, Rahu: 42, Ketu: 48 };
const YEAR_MS = 365.25 * 86400_000;
const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const dist = (from: number, to: number) => ((to - from + 12) % 12) + 1;

export function lifeTimeline(chart: KundaliChart, maxAge = 90): LifeTimeline {
  const P = new Map(chart.planets.map((p) => [p.planet, p]));
  const lagna = chart.ascendant.signIndex;
  const birth = new Date(chart.utcDate).getTime();
  const age = (d: Date) => (d.getTime() - birth) / YEAR_MS;
  const { functional } = analyzeYogas(chart, new Date(birth));

  /** Houses a planet links to, with how. Nodes also act for their sign lord. */
  const linkCache = new Map<PlanetName, Map<number, string>>();
  function linksOf(pl: PlanetName): Map<number, string> {
    if (linkCache.has(pl)) return linkCache.get(pl)!;
    const p = P.get(pl)!;
    const m = new Map<number, string>();
    m.set(p.house, `sits in your ${ordinal(p.house)}`);
    for (const h of chart.houseLords.filter((x) => x.lord === pl).map((x) => x.house)) if (!m.has(h)) m.set(h, `rules your ${ordinal(h)}`);
    for (const d of getAspectedHouses(pl)) {
      const h = ((p.house + d - 2) % 12) + 1;
      if (!m.has(h)) m.set(h, `aspects your ${ordinal(h)}`);
    }
    if (pl === "Rahu" || pl === "Ketu") {
      const disp = SIGN_LORDS[p.signIndex] as PlanetName;
      for (const h of chart.houseLords.filter((x) => x.lord === disp).map((x) => x.house)) if (!m.has(h)) m.set(h, `acts for ${disp}, lord of your ${ordinal(h)}`);
    }
    linkCache.set(pl, m);
    return m;
  }

  const toneOf = (a: PlanetName, b?: PlanetName): Tone => {
    const score = (pl: PlanetName) => (functional.benefics.includes(pl) ? 1 : functional.malefics.includes(pl) ? -1 : P.get(pl)!.dignity === "Debilitated" ? -1 : 0);
    let s = score(a) + (b ? score(b) : 0);
    if (b && b !== a) s += FRIENDS[a]?.includes(b) ? 0.5 : ENEMIES[a]?.includes(b) ? -0.5 : 0;
    return s >= 1 ? "Supportive" : s <= -1 ? "Demanding" : "Mixed";
  };

  function themesFor(md: PlanetName, ad: PlanetName, mid: Date, ageMid: number): TimelineTheme[] {
    const jup = Math.floor(siderealLongitude("Jupiter", mid) / 30);
    const sat = Math.floor(siderealLongitude("Saturn", mid) / 30);
    const touches = (planetSign: number, planet: PlanetName, house: number) => {
      const target = (lagna + house - 1) % 12;
      return planetSign === target || getAspectedHouses(planet).includes(dist(planetSign, target));
    };
    const out: TimelineTheme[] = [];
    for (const [kind, t] of Object.entries(THEMES) as [EventTheme, (typeof THEMES)[EventTheme]][]) {
      if (ageMid < t.ages[0] || ageMid > t.ages[1]) continue;
      let score = 0;
      const why: string[] = [];
      const runners: [PlanetName, number][] = md === ad ? [[ad, 2.5]] : [[md, 1], [ad, 2]];
      for (const [pl, w] of runners) {
        const links = linksOf(pl);
        const hits = t.houses.filter((h) => links.has(h));
        if (hits.length) {
          const ruleOrSit = hits.filter((h) => !links.get(h)!.startsWith("aspects"));
          score += w * (ruleOrSit.length + (hits.length - ruleOrSit.length) * 0.5);
          why.push(`${pl} ${hits.slice(0, 2).map((h) => links.get(h)).join(" and ")}`);
        }
        if (t.karaka.includes(pl) && pl === ad) {
          score += 1;
          why.push(`${pl} is the natural significator`);
        }
      }
      const j = touches(jup, "Jupiter", t.primary);
      const s = touches(sat, "Saturn", t.primary);
      if (j && s) {
        score += 2;
        why.push(`Jupiter and Saturn both touch your ${ordinal(t.primary)} house (double transit)`);
      } else if (kind !== "health" && j) {
        score += 0.5;
        why.push(`Jupiter touches your ${ordinal(t.primary)} house`);
      }
      // Health is flagged only when the lords of 6/8 run together with a difficult tone.
      if (kind === "health" && score < 5) continue;
      if (score >= 4) out.push({ kind, label: t.label, score: Math.round(score * 10) / 10, why });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, 3);
  }

  const mahas: TimelineMaha[] = [];
  for (const md of chart.dashas) {
    const mdStart = new Date(md.start);
    const mdEnd = new Date(md.end);
    if (age(mdStart) > maxAge) break;
    const lord = md.lord as PlanetName;
    const p = P.get(lord)!;
    const ruled = chart.houseLords.filter((h) => h.lord === lord).map((h) => h.house);
    const antars: TimelineAntar[] = [];
    for (const ad of md.subPeriods ?? []) {
      const s = new Date(ad.start);
      const e = new Date(ad.end);
      if (age(s) > maxAge) break;
      const adLord = ad.lord as PlanetName;
      const mid = new Date((s.getTime() + e.getTime()) / 2);
      const houses = [...new Set([...linksOf(lord).entries(), ...linksOf(adLord).entries()].filter(([, how]) => !how.startsWith("aspects")).map(([h]) => h))].sort((a, b) => a - b);
      const ap = P.get(adLord)!;
      antars.push({
        lord: adLord,
        start: s,
        end: e,
        ageStart: Math.max(0, age(s)),
        ageEnd: age(e),
        tone: toneOf(lord, adLord),
        houses,
        themes: themesFor(lord, adLord, mid, age(mid)),
        note: `${adLord} works through your ${ordinal(ap.house)} house${chart.houseLords.some((h) => h.lord === adLord) ? ` and rules your ${chart.houseLords.filter((h) => h.lord === adLord).map((h) => ordinal(h.house)).join(" and ")}` : ""}.`,
      });
    }
    mahas.push({
      lord,
      start: mdStart,
      end: mdEnd,
      ageStart: Math.max(0, age(mdStart)),
      ageEnd: age(mdEnd),
      tone: toneOf(lord),
      summary: `${lord} sits in your ${ordinal(p.house)} house${ruled.length ? ` and rules your ${ruled.map(ordinal).join(" and ")}` : ` and acts for ${SIGN_LORDS[p.signIndex]}`}, so this period centres on ${[...new Set([p.house, ...ruled])].map((h) => HOUSE_WORD[h]).join(", ")}. ${
        functional.benefics.includes(lord) ? `For your Lagna ${lord} is a functional benefic, a helpful ruler for these years.` : functional.malefics.includes(lord) ? `For your Lagna ${lord} is a functional malefic, so these years ask for effort and patience.` : ""
      }`,
      antars,
    });
  }

  // Milestones
  const milestones: Milestone[] = [];
  const end = birth + maxAge * YEAR_MS;
  for (const planet of ["Jupiter", "Saturn", "Rahu"] as const) {
    const natal = P.get(planet)!.signIndex;
    let prev = Math.floor(siderealLongitude(planet, new Date(birth)) / 30);
    let n = 0;
    for (let t = birth + 30 * 86400_000; t < end; t += 15 * 86400_000) {
      const sign = Math.floor(siderealLongitude(planet, new Date(t)) / 30);
      if (sign === natal && prev !== natal && (t - birth) / YEAR_MS > 5) {
        const a = (t - birth) / YEAR_MS;
        const last = milestones.filter((m) => m.label.startsWith(planet)).pop();
        if (!last || a - last.age > 3) {
          n++;
          milestones.push({ age: a, date: new Date(t), label: `${planet} return ${n}`, text: RETURN_TEXT[planet](n) });
        }
      }
      prev = sign;
    }
  }
  const moon = P.get("Moon")!;
  for (const c of saturnCycles(moon.signIndex, new Date(birth), new Date(end))) {
    if (c.kind !== "Sade Sati") continue;
    milestones.push({ age: age(new Date(c.start)), date: new Date(c.start), label: "Sade Sati begins", text: `Saturn's 7½-year passage over your Moon in ${SIGNS[moon.signIndex]} runs until age ${Math.round(age(new Date(c.end)))} — a period of hard work, responsibility and maturing.` });
  }
  for (const [pl, a] of Object.entries(MATURITY) as [PlanetName, number][]) {
    milestones.push({ age: a, date: new Date(birth + a * YEAR_MS), label: `${pl} matures`, text: `Classically ${pl} gives its full results from age ${a}; in your chart it sits in the ${ordinal(P.get(pl)!.house)} house, so ${HOUSE_WORD[P.get(pl)!.house]} come into their own.` });
  }
  milestones.sort((a, b) => a.age - b.age);

  return { mahas, milestones };
}

const HOUSE_WORD: Record<number, string> = {
  1: "self and health",
  2: "money and family",
  3: "effort and siblings",
  4: "home and mother",
  5: "children and learning",
  6: "work, health and rivals",
  7: "marriage and partners",
  8: "sudden change and research",
  9: "luck, father and teachers",
  10: "career",
  11: "gains and friends",
  12: "expenses, foreign lands and spirituality",
};

const RETURN_TEXT: Record<"Jupiter" | "Saturn" | "Rahu", (n: number) => string> = {
  Jupiter: (n) => `Jupiter returns to its birth sign (about every 12 years): a fresh cycle of growth, learning and opportunity${n === 1 ? " — often schooling milestones" : ""}.`,
  Saturn: (n) => (n === 1 ? "The first Saturn return (around 29–30): the real start of adult responsibility — career, marriage and life structure are tested and set." : n === 2 ? "The second Saturn return (around 58–60): taking stock, handing over and choosing what the later years are for." : "A further Saturn return: reviewing and simplifying life."),
  Rahu: () => "The nodes return to their birth positions (about every 18½ years): a turning point that often brings new ambitions or a change of direction.",
};
