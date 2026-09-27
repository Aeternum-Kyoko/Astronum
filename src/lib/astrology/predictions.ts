import { SIGN_LORDS, SIGNS, type PlanetName } from "./constants";
import { HOUSE_SIGNIFICATION, PLANET_KEYNOTE, SIGN_KEYNOTE } from "./content";
import { analyzeBhavaStrength, type StrengthVerdict } from "./bhavaStrength";
import { isCombust } from "./birthDetails";
import { FRIENDS, ENEMIES, type Dignity } from "./dignity";
import { BENEFIC_PLANETS } from "./aspects";
import { PLANET_REFERENCE } from "./reference/planets";
import { analyzeYogas } from "./yogaAnalysis";
import { SIGN_REFERENCE } from "./reference/signs";
import { NAKSHATRA_REFERENCE } from "./reference/nakshatras";
import type { DashaPeriod } from "./dasha";
import type { KundaliChart, PlanetPlacement } from "./types";

/**
 * Written readings assembled from classical rules applied to one chart:
 * each planet's sign, house, nakshatra and lordships; life areas judged from
 * their houses, lords, occupants and significators; and what each dasha
 * period is likely to emphasise. Everything here is derived from the chart —
 * the wording is templated, the judgements are not.
 */

const KENDRA = new Set([1, 4, 7, 10]);
const TRIKONA = new Set([1, 5, 9]);
const DUSTHANA = new Set([6, 8, 12]);

const DIGNITY_PHRASE: Record<Dignity, string> = {
  Exalted: "exalted — at the height of its strength",
  Moolatrikona: "in its Moolatrikona — very comfortable and effective",
  "Own Sign": "in its own sign — at home and self-assured",
  "Friend's Sign": "in a friend's sign — reasonably comfortable",
  "Neutral Sign": "in a neutral sign",
  "Enemy's Sign": "in an enemy's sign — working under some strain",
  Debilitated: "debilitated — at its weakest, needing support to deliver",
};

export const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;

function listPhrase(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function housesRuledBy(chart: KundaliChart, planet: PlanetName): number[] {
  return chart.houseLords.filter((h) => h.lord === planet).map((h) => h.house);
}

function placementQuality(house: number): "angular" | "trine" | "difficult" | "neutral" {
  if (TRIKONA.has(house)) return "trine";
  if (KENDRA.has(house)) return "angular";
  if (DUSTHANA.has(house)) return "difficult";
  return "neutral";
}

// ——— Planet readings ———————————————————————————————————————————————

export interface PlanetReading {
  planet: PlanetName;
  headline: string;
  house: string;
  sign: string;
  nakshatra: string;
  lordship: string | null;
  strength: string | null;
  flags: string[];
}

export function planetReadings(chart: KundaliChart): PlanetReading[] {
  const sun = chart.planets.find((p) => p.planet === "Sun")!;
  return chart.planets.map((p) => {
    const ref = PLANET_REFERENCE.find((r) => r.name === p.planet)!;
    const signRef = SIGN_REFERENCE[p.signIndex];
    const nak = NAKSHATRA_REFERENCE[p.nakshatraIndex];
    const ruled = housesRuledBy(chart, p.planet);
    const bala = chart.shadbala.find((s) => s.planet === p.planet);
    const flags: string[] = [];
    if (p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu") flags.push("Retrograde — its results turn inward, arrive in revisited or unconventional ways");
    if (isCombust(p, sun)) flags.push("Combust — overshadowed by the Sun, so its significations need conscious effort");

    return {
      planet: p.planet,
      headline: `${p.planet} in ${p.sign}, ${ordinal(p.house)} house`,
      house: ref.inHouses[p.house - 1],
      sign: `In ${p.sign} — ${/^[AEIOU]/.test(signRef.element) ? "an" : "a"} ${signRef.element.toLowerCase()}, ${signRef.quality.toLowerCase()} sign ruled by ${SIGN_LORDS[p.signIndex]} — ${p.planet}'s themes of ${PLANET_KEYNOTE[p.planet]} take on a ${SIGN_KEYNOTE[p.sign]} quality${p.dignity ? `. It is ${DIGNITY_PHRASE[p.dignity]}` : ""}.`,
      nakshatra: `It sits in ${p.nakshatra} nakshatra, pada ${p.pada} (lord ${nak.rulingPlanet}; deity: ${nak.deity}). ${nak.keynote}${nak.keynote.endsWith(".") ? "" : "."}`,
      lordship:
        ruled.length > 0
          ? `As lord of your ${listPhrase(ruled.map(ordinal))} house${ruled.length > 1 ? "s" : ""} (${ruled.map((h) => HOUSE_SIGNIFICATION[h].split(",")[0]).join("; ")}), ${p.planet} carries those matters into the ${ordinal(p.house)} house of ${HOUSE_SIGNIFICATION[p.house]}.`
          : null,
      strength: bala
        ? `Shadbala: ${bala.rupas.toFixed(2)} of ${bala.requiredRupas} rupas required — ${bala.isStrong ? "strong enough to deliver its results fully" : "below strength, so its results come with more effort or delay"}.`
        : null,
      flags,
    };
  });
}

// ——— Life areas ————————————————————————————————————————————————————

export interface ActivatingPeriod {
  label: string;
  start: Date;
  end: Date;
  why: string;
}

export interface LifeAreaReading {
  key: string;
  title: string;
  rating: number; // 1–5
  verdict: StrengthVerdict;
  summary: string;
  points: string[];
  periods: ActivatingPeriod[];
}

interface AreaDef {
  key: string;
  title: string;
  houses: number[];
  karakas: PlanetName[];
  extra?: (chart: KundaliChart) => string[];
}

const AREAS: AreaDef[] = [
  {
    key: "self",
    title: "Personality & Vitality",
    houses: [1],
    karakas: ["Sun"],
    extra: (chart) => {
      const lagnaLord = SIGN_LORDS[chart.ascendant.signIndex];
      const lord = chart.planets.find((p) => p.planet === lagnaLord)!;
      return [
        `Your Lagna is ${chart.ascendant.sign}: ${SIGN_REFERENCE[chart.ascendant.signIndex].description}`,
        `The Lagna lord ${lagnaLord} — the planet that stands for your body and vitality — is in your ${ordinal(lord.house)} house${lord.dignity ? `, ${DIGNITY_PHRASE[lord.dignity]}` : ""}.`,
      ];
    },
  },
  {
    key: "career",
    title: "Career & Status",
    houses: [10],
    karakas: ["Sun", "Saturn", "Mercury"],
    extra: (chart) => {
      const d10 = chart.divisionalCharts.D10;
      return d10 ? [`In the Dasamsa (D10), the chart of career, the ascendant is ${d10.ascendant.sign} — ${SIGN_KEYNOTE[d10.ascendant.sign]}, which colours how you work and are seen professionally.`] : [];
    },
  },
  {
    key: "wealth",
    title: "Money, Family & Speech",
    houses: [2],
    karakas: ["Jupiter", "Venus"],
    extra: (chart) => {
      const named = chart.yogas.filter((y) => y.present && /Lakshmi|Gaj Kesari|Mahapurusha/i.test(y.name)).map((y) => y.name);
      const dhana = analyzeYogas(chart).findings.filter((f) => f.category === "dhana" && f.strength !== "Weak").map((f) => `${f.name} (${f.strength.toLowerCase()})`);
      const all = [...dhana, ...named];
      return all.length ? [`Wealth combinations in your chart: ${listPhrase(all)} — see Yogas & Doshas for how each is formed.`] : ["No strong Dhan Yoga is formed, so wealth builds through steady effort and the periods below."];
    },
  },
  {
    key: "marriage",
    title: "Marriage & Relationships",
    houses: [7],
    karakas: ["Venus", "Jupiter"],
    extra: (chart) => {
      const out: string[] = [];
      const d9 = chart.divisionalCharts.D9;
      if (d9) {
        const lord7 = SIGN_LORDS[(d9.ascendant.signIndex + 6) % 12];
        out.push(`In the Navamsa (D9), the chart of marriage, the 7th house falls in ${SIGNS[(d9.ascendant.signIndex + 6) % 12]}, ruled by ${lord7}.`);
      }
      const m = chart.mangalDosha;
      out.push(
        m.status === "present"
          ? `Mangal Dosha is present (${m.severity}) — traditionally weighed in matching.`
          : m.status === "cancelled"
            ? "Mangal Dosha is indicated but cancelled by a classical exception."
            : "There is no Mangal Dosha."
      );
      return out;
    },
  },
  { key: "education", title: "Education & Intellect", houses: [4, 5], karakas: ["Mercury", "Jupiter"] },
  { key: "children", title: "Children & Creativity", houses: [5], karakas: ["Jupiter"] },
  { key: "home", title: "Home, Mother & Property", houses: [4], karakas: ["Moon", "Mars"] },
  { key: "siblings", title: "Siblings, Courage & Communication", houses: [3], karakas: ["Mars", "Mercury"] },
  { key: "health", title: "Health, Debts & Rivals", houses: [6], karakas: ["Mars", "Saturn"] },
  { key: "longevity", title: "Longevity, Sudden Events & Research", houses: [8], karakas: ["Saturn"] },
  { key: "fortune", title: "Father, Fortune & Dharma", houses: [9], karakas: ["Sun", "Jupiter"] },
  { key: "gains", title: "Gains, Friends & Ambitions", houses: [11], karakas: ["Jupiter"] },
  { key: "foreign", title: "Foreign Lands, Expenses & Spirituality", houses: [12], karakas: ["Saturn", "Ketu"] },
];

function ratingFor(score: number): number {
  return score >= 70 ? 5 : score >= 58 ? 4 : score >= 45 ? 3 : score >= 32 ? 2 : 1;
}

const allAntardashas = (chart: KundaliChart) => chart.dashas.flatMap((m) => (m.subPeriods ?? []).map((a) => ({ maha: m, antar: a })));

export function lifeAreaReadings(chart: KundaliChart, now = new Date()): LifeAreaReading[] {
  const strength = analyzeBhavaStrength(chart.ascendant.signIndex, chart.planets, chart.shadbala);
  const horizon = new Date(now.getTime() + 25 * 365.25 * 86400_000);

  return AREAS.map((area) => {
    const entries = area.houses.map((h) => strength[h - 1]);
    const score = entries.reduce((s, e) => s + e.score, 0) / entries.length;
    const points: string[] = [];
    const lords = new Set<PlanetName>();
    const occupantsAll = new Set<PlanetName>();

    for (const house of area.houses) {
      const hl = chart.houseLords.find((h) => h.house === house)!;
      lords.add(hl.lord);
      const quality = placementQuality(hl.lordHouse);
      const qualityText =
        quality === "trine"
          ? "a fortunate trine — a very supportive placement"
          : quality === "angular"
            ? "an angular house — steady, visible support"
            : quality === "difficult"
              ? "a difficult house, so results come through effort, service or after some delay"
              : `linking this area with ${HOUSE_SIGNIFICATION[hl.lordHouse].split(",")[0]}`;
      points.push(`Your ${ordinal(house)} house (${HOUSE_SIGNIFICATION[house]}) is in ${hl.sign}. Its lord ${hl.lord} sits in the ${ordinal(hl.lordHouse)} house — ${qualityText}.`);

      const occupants = chart.planets.filter((p) => p.house === house);
      occupants.forEach((o) => occupantsAll.add(o.planet));
      if (occupants.length) {
        const benefic = occupants.filter((o) => BENEFIC_PLANETS.has(o.planet)).map((o) => o.planet);
        const malefic = occupants.filter((o) => !BENEFIC_PLANETS.has(o.planet)).map((o) => o.planet);
        const parts = [
          benefic.length ? `${listPhrase(benefic)} add${benefic.length === 1 ? "s" : ""} natural support` : "",
          malefic.length ? `${listPhrase(malefic)} add${malefic.length === 1 ? "s" : ""} drive but also friction` : "",
        ].filter(Boolean);
        points.push(`Planets in the ${ordinal(house)} house: ${parts.join("; ")}.`);
      }
    }

    for (const k of area.karakas) {
      const bala = chart.shadbala.find((s) => s.planet === k);
      if (bala) points.push(`${k}, a natural significator here, is ${bala.isStrong ? "strong" : "below strength"} by Shadbala.`);
    }
    points.push(...(area.extra?.(chart) ?? []));

    const verdict: StrengthVerdict = score >= 58 ? "Strong" : score >= 40 ? "Balanced" : "Weak";
    const summary =
      verdict === "Strong"
        ? `${area.title} is one of the better-supported areas of your chart.`
        : verdict === "Balanced"
          ? `${area.title} is reasonably supported, with results that depend on timing and effort.`
          : `${area.title} asks for more conscious attention; the periods below are when it comes into focus.`;

    // Upcoming sub-periods whose lord rules this area, sits in it, or signifies it.
    const relevant = new Set<PlanetName>([...lords, ...occupantsAll, ...area.karakas]);
    const periods: ActivatingPeriod[] = [];
    for (const { maha, antar } of allAntardashas(chart)) {
      if (antar.end < now || antar.start > horizon) continue;
      if (!relevant.has(antar.lord)) continue;
      periods.push({
        label: `${maha.lord}–${antar.lord}`,
        start: antar.start,
        end: antar.end,
        why: whyRelevant(antar.lord, lords, occupantsAll, area.karakas),
      });
      if (periods.length >= 5) break;
    }

    return { key: area.key, title: area.title, rating: ratingFor(score), verdict, summary, points, periods };
  });
}

function whyRelevant(planet: PlanetName, lords: Set<PlanetName>, occupants: Set<PlanetName>, karakas: PlanetName[]): string {
  if (lords.has(planet)) return `${planet} rules this area`;
  if (occupants.has(planet)) return `${planet} sits in this area`;
  if (karakas.includes(planet)) return `${planet} is its natural significator`;
  return "";
}

// ——— Dasha predictions —————————————————————————————————————————————————

export interface DashaReading {
  lord: PlanetName;
  start: Date;
  end: Date;
  tone: "Supportive" | "Mixed" | "Demanding";
  text: string[];
  antardashas: { lord: PlanetName; start: Date; end: Date; text: string }[];
}

function dashaTone(chart: KundaliChart, lord: PlanetName, p: PlanetPlacement): { tone: DashaReading["tone"]; reasons: string[] } {
  const ruled = housesRuledBy(chart, lord);
  const bala = chart.shadbala.find((s) => s.planet === lord);
  const good: string[] = [];
  const hard: string[] = [];
  if (ruled.some((h) => TRIKONA.has(h))) good.push("it rules a trine house");
  if (ruled.some((h) => KENDRA.has(h) && h !== 1)) good.push("it rules an angular house");
  if (ruled.length && ruled.every((h) => DUSTHANA.has(h))) hard.push("it rules only difficult houses");
  if (TRIKONA.has(p.house) || KENDRA.has(p.house)) good.push(`it sits in the ${ordinal(p.house)} house, a strong position`);
  if (DUSTHANA.has(p.house)) hard.push(`it sits in the difficult ${ordinal(p.house)} house`);
  if (p.dignity === "Exalted" || p.dignity === "Moolatrikona" || p.dignity === "Own Sign") good.push("it is in a sign of dignity");
  if (p.dignity === "Debilitated") hard.push("it is debilitated");
  if (bala) (bala.isStrong ? good : hard).push(bala.isStrong ? "it is strong by Shadbala" : "it is below strength by Shadbala");
  const score = good.length - hard.length + (ruled.some((h) => TRIKONA.has(h)) ? 1 : 0) - (ruled.length && ruled.every((h) => DUSTHANA.has(h)) ? 1 : 0);
  const tone = score >= 2 ? "Supportive" : score <= -1 ? "Demanding" : "Mixed";
  return { tone, reasons: tone === "Supportive" ? good : tone === "Demanding" ? hard : [...good, ...hard] };
}

function relation(a: PlanetName, b: PlanetName): "friends" | "enemies" | "neutral" {
  if (a === b || FRIENDS[a]?.includes(b)) return "friends";
  if (ENEMIES[a]?.includes(b)) return "enemies";
  return "neutral";
}

export function dashaReadings(chart: KundaliChart): DashaReading[] {
  const place = (planet: PlanetName) => chart.planets.find((p) => p.planet === planet)!;

  return chart.dashas.map((maha: DashaPeriod) => {
    const lord = maha.lord as PlanetName;
    const p = place(lord);
    const ruled = housesRuledBy(chart, lord);
    const years = (maha.end.getTime() - maha.start.getTime()) / (365.25 * 86400_000);
    const text = [
      `${lord} periods bring ${PLANET_KEYNOTE[lord]} to the foreground for about ${Math.round(years)} years.`,
      `${lord} sits in your ${ordinal(p.house)} house, so ${HOUSE_SIGNIFICATION[p.house]} become central themes${p.dignity ? `; it is ${DIGNITY_PHRASE[p.dignity]}` : ""}.`,
    ];
    if (ruled.length) {
      text.push(`As lord of your ${listPhrase(ruled.map(ordinal))} house${ruled.length > 1 ? "s" : ""}, it also activates ${listPhrase(ruled.map((h) => HOUSE_SIGNIFICATION[h].split(",")[0]))}.`);
    } else {
      const dispositor = SIGN_LORDS[p.signIndex];
      text.push(`As a shadow planet it acts through its dispositor ${dispositor} (lord of ${p.sign}), so ${dispositor}'s condition shapes how this period plays out.`);
    }
    const { tone, reasons } = dashaTone(chart, lord, p);
    const because = reasons.length ? ` — ${listPhrase(reasons)}` : "";
    text.push(
      tone === "Supportive"
        ? `Overall a supportive period${because}.`
        : tone === "Demanding"
          ? `Overall a demanding period${because}; it rewards patience, discipline and remedial practice.`
          : `Overall a mixed period${because}.`
    );

    const antardashas = (maha.subPeriods ?? []).map((a) => {
      const sub = a.lord as PlanetName;
      const sp = place(sub);
      const rel = relation(lord, sub);
      return {
        lord: sub,
        start: a.start,
        end: a.end,
        text: `${sub}'s focus on ${PLANET_KEYNOTE[sub].split(",").slice(0, 2).join(" and")} through your ${ordinal(sp.house)} house (${HOUSE_SIGNIFICATION[sp.house].split(",")[0]}). ${
          rel === "friends" ? `${lord} and ${sub} are friends, so this sub-period tends to run smoothly.` : rel === "enemies" ? `${lord} and ${sub} are natural enemies, so expect some friction between their agendas.` : `${lord} and ${sub} are neutral to each other.`
        }`,
      };
    });

    return { lord, start: maha.start, end: maha.end, tone, text, antardashas };
  });
}
