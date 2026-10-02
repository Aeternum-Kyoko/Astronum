import { getAspectedHouses } from "./aspects";
import {
  SIGN_LORDS,
  SIGNS,
  type PlanetName,
  type SignName,
  type VargaKey,
} from "./constants";
import { HOUSE_SIGNIFICATION, PLANET_KEYNOTE, VARGA_INFO } from "./content";
import { getDignity, type Dignity } from "./dignity";
import { signOffsetHouse } from "./math";
import { VARGA_LENS } from "./vargaLens";

/**
 * Chart-specific readings for any divisional chart. Every sentence is read in
 * the chart's own subject: a planet's meaning, the houses it sits in and rules,
 * and where house lords go are all phrased through that varga (D10 Mars is
 * technical or competitive work; D9 Mars is passion and friction in marriage),
 * using the planet's dignity *in that varga*, the aspects it receives there,
 * the classical upachaya/dusthana rules, and vargottama status against the
 * birth chart.
 */

export type Verdict = "Strong" | "Balanced" | "Weak";

interface VargaProfile {
  /** The houses this chart is judged from first. */
  focus: number[];
  /** Natural significators of the chart's subject. */
  karakas: PlanetName[];
  /** The birth-chart house whose lord is checked in this chart (e.g. the D1 10th lord in the D10). */
  d1House: number | null;
  /** What each planet stands for in this chart's subject. */
  roles: Record<PlanetName, string>;
}

/** The chart's subject in a few words, for headlines. */
export const VARGA_SUBJECT: Record<VargaKey, string> = {
  D1: "life as a whole",
  D2: "wealth",
  D3: "siblings and courage",
  D4: "home and property",
  D7: "children",
  D9: "marriage and the spouse",
  D10: "your career",
  D12: "your parents",
  D16: "comforts and vehicles",
  D20: "your spiritual life",
  D24: "education",
  D27: "your inner strengths",
  D30: "resilience against illness and misfortune",
  D40: "your maternal inheritance",
  D45: "your paternal inheritance",
  D60: "your past-life karma",
};

const lineage = (suffix: string): Record<PlanetName, string> =>
  Object.fromEntries(
    Object.entries(PLANET_KEYNOTE).map(([p, k]) => [
      p,
      `${k.split(",").slice(0, 2).join(" and")}${suffix}`,
    ]),
  ) as Record<PlanetName, string>;

export const VARGA_PROFILE: Record<VargaKey, VargaProfile> = {
  D1: { focus: [1], karakas: [], d1House: null, roles: PLANET_KEYNOTE },
  D2: {
    focus: [2, 11],
    karakas: ["Jupiter"],
    d1House: 2,
    roles: {
      Sun: "wealth earned through authority, government and status",
      Moon: "cash flow and money that comes through the public",
      Mars: "money from land, engineering, risk and bold moves",
      Mercury: "earnings through trade, numbers, writing and commerce",
      Jupiter:
        "savings, growth and financial wisdom — the natural significator of wealth",
      Venus: "money through luxury, art, beauty and comforts",
      Saturn: "slow, steady wealth built by hard work and long holding",
      Rahu: "sudden, foreign or unconventional money and speculative gains",
      Ketu: "detachment from money, or gains through research and hidden channels",
    },
  },
  D3: {
    focus: [3],
    karakas: ["Mars"],
    d1House: 3,
    roles: {
      Sun: "pride and leadership in how you take initiative, and an elder-sibling figure",
      Moon: "the emotional bond with siblings, and courage driven by feeling",
      Mars: "raw nerve, initiative and younger siblings — the natural significator of courage",
      Mercury:
        "communication, writing and skill with the hands, and a clever, youthful sibling",
      Jupiter: "wise counsel from siblings and principled courage",
      Venus: "artistic talent and warm, sister-like bonds",
      Saturn:
        "persistence, endurance and duty toward siblings — sometimes distance",
      Rahu: "bold, risk-taking ventures and unusual efforts",
      Ketu: "quiet or interrupted sibling bonds, and courage without bravado",
    },
  },
  D4: {
    focus: [4],
    karakas: ["Mars", "Venus", "Moon"],
    d1House: 4,
    roles: {
      Sun: "government land, ancestral or prestigious property",
      Moon: "the mother, emotional peace at home, and homes near water",
      Mars: "land, real estate and construction — the natural significator of property",
      Mercury: "property deals, paperwork and commercial premises",
      Jupiter: "blessings in home life and spacious, auspicious dwellings",
      Venus:
        "vehicles, décor and comforts — the natural significator of conveyances",
      Saturn: "old buildings, slow acquisition and long-held land",
      Rahu: "foreign property, unusual dwellings, or disputes over assets",
      Ketu: "detachment from home, sudden moves, or a spiritual dwelling",
    },
  },
  D7: {
    focus: [5],
    karakas: ["Jupiter"],
    d1House: 5,
    roles: {
      Sun: "a son-like heir and your authority as a parent",
      Moon: "nurturing, fertility and the emotional bond with children",
      Mars: "vitality in conception — but also haste or surgery around childbirth",
      Mercury: "playful, intelligent children and learning through them",
      Jupiter: "the blessing of children — the natural significator of progeny",
      Venus: "fertility, daughters and joy in family life",
      Saturn: "delay in children, or a dutiful, late-blessed parenthood",
      Rahu: "unconventional routes to parenthood, or anxiety around children",
      Ketu: "detachment, or karmic and spiritual bonds with children",
    },
  },
  D9: {
    focus: [7, 1],
    karakas: ["Venus", "Jupiter"],
    d1House: 7,
    roles: {
      Sun: "ego and self-respect within marriage, and the father-in-law",
      Moon: "emotional harmony — how the marriage feels day to day — and the mother-in-law",
      Mars: "passion, energy and quarrels in the marriage, and the spouse's drive",
      Mercury: "conversation, friendship and playfulness in the marriage",
      Jupiter:
        "dharma, wisdom and blessings in marriage — the husband's significator",
      Venus:
        "love, romance and attraction — the wife's significator and the heart of marriage",
      Saturn: "commitment, duty and endurance; delay or an age gap",
      Rahu: "an unconventional or cross-cultural union and intense desire",
      Ketu: "a spiritual partnership, or detachment within the bond",
    },
  },
  D10: {
    focus: [10, 1],
    karakas: ["Sun", "Saturn", "Mercury", "Jupiter"],
    d1House: 10,
    roles: {
      Sun: "authority, government and leadership roles, and your relationship with bosses",
      Moon: "public dealings, popularity, and work in care, food, hospitality or the public sphere",
      Mars: "technical, engineering, police, defence, surgical or competitive work — execution",
      Mercury:
        "business, trade, writing, accounts, IT and communication at work",
      Jupiter: "advisory, teaching, finance, law and senior mentoring roles",
      Venus: "creative, design, luxury, media and client-facing work",
      Saturn:
        "hard work, scale, service, systems and staying power — the significator of profession",
      Rahu: "foreign companies, technology, and unconventional, fast-rising careers",
      Ketu: "research, specialist or behind-the-scenes expertise, and sudden career turns",
    },
  },
  D12: {
    focus: [4, 9],
    karakas: ["Sun", "Moon"],
    d1House: 9,
    roles: {
      Sun: "the father — his health, standing and influence on you",
      Moon: "the mother — her care, health and emotional influence on you",
      Mars: "the energy and health of parents, and disputes over family matters",
      Mercury: "family stories, and the education your parents gave you",
      Jupiter:
        "ancestral blessings, the family guru and the dharma you inherit",
      Venus: "comfort and affection from parents",
      Saturn: "ancestral karma, elders, and duty toward parents",
      Rahu: "breaks from family tradition, or foreign influences in the lineage",
      Ketu: "past-life ties to the lineage and renunciation in the family line",
    },
  },
  D16: {
    focus: [4],
    karakas: ["Venus"],
    d1House: 4,
    roles: {
      Sun: "status vehicles and comfort that comes through position",
      Moon: "peace of mind and emotional happiness",
      Mars: "machines and speed — and accidents or mechanical trouble",
      Mercury: "short travel, gadgets and the joy of learning",
      Jupiter: "contentment — the blessings that make life feel full",
      Venus:
        "vehicles, luxury and pleasures — the natural significator of comforts",
      Saturn: "old vehicles, delayed comforts, or simple living",
      Rahu: "unusual vehicles, foreign travel and a restless craving for comfort",
      Ketu: "detachment from luxury",
    },
  },
  D20: {
    focus: [9, 5],
    karakas: ["Jupiter", "Ketu"],
    d1House: 9,
    roles: {
      Sun: "self-discipline, spiritual authority, and devotion to Surya or Shiva",
      Moon: "bhakti and devotional feeling, and worship of the Divine Mother",
      Mars: "tapas and warrior-like discipline — Hanuman or Skanda worship",
      Mercury: "mantra, scripture study and chanting — Vishnu worship",
      Jupiter: "the guru, wisdom and dharma — the main spiritual significator",
      Venus:
        "devotion through beauty, ritual and music — Lakshmi or the Goddess",
      Saturn: "renunciation, sadhana through hardship and patient practice",
      Rahu: "unorthodox paths, tantra, or spiritual confusion",
      Ketu: "meditation and liberation — the significator of moksha",
    },
  },
  D24: {
    focus: [4, 5, 9],
    karakas: ["Mercury", "Jupiter"],
    d1House: 5,
    roles: {
      Sun: "learning that brings authority — government exams and confidence in study",
      Moon: "memory and emotional engagement with study",
      Mars: "technical, engineering and logical subjects, and competitive exams",
      Mercury:
        "intellect, analysis, languages and mathematics — the significator of learning",
      Jupiter: "higher education, wisdom and teachers",
      Venus: "arts, music, design and creative subjects",
      Saturn: "persistence — slow but deep learning, and late degrees",
      Rahu: "foreign education, technology and unconventional subjects",
      Ketu: "deep research, specialised or occult knowledge, and interrupted study",
    },
  },
  D27: {
    focus: [1],
    karakas: ["Moon", "Mars"],
    d1House: 1,
    roles: {
      Sun: "vitality and self-confidence",
      Moon: "emotional resilience",
      Mars: "physical strength and courage",
      Mercury: "mental agility and adaptability",
      Jupiter: "wisdom and protective grace",
      Venus: "charm and sensual vitality",
      Saturn: "endurance and stamina",
      Rahu: "drive and obsessive focus",
      Ketu: "intuition and detachment",
    },
  },
  D30: {
    focus: [6, 8, 12],
    karakas: ["Saturn", "Mars"],
    d1House: 6,
    roles: {
      Sun: "trouble through authority or ego, and the heart and eyes",
      Moon: "emotional or mental distress",
      Mars: "accidents, cuts, fevers, inflammation and conflict",
      Mercury: "nervous strain, skin trouble, and deception in dealings",
      Jupiter: "over-indulgence, liver or weight issues, and misplaced trust",
      Venus: "trouble through relationships or pleasures, kidneys or sugar",
      Saturn: "chronic illness, joints, delays and grief",
      Rahu: "mysterious ailments, scandal, fraud or poisons",
      Ketu: "sudden losses and injuries, and hard-to-diagnose ailments",
    },
  },
  D40: {
    focus: [4],
    karakas: ["Moon"],
    d1House: 4,
    roles: lineage(", as inherited from your mother's line"),
  },
  D45: {
    focus: [9],
    karakas: ["Sun"],
    d1House: 9,
    roles: lineage(", as inherited from your father's line"),
  },
  D60: {
    focus: [1],
    karakas: [],
    d1House: 1,
    roles: lineage(", as carried in from past-life karma"),
  },
};

/** Charts whose houses and planets describe misfortune, so strength means the risk is contained. */
const RISK_CHART = new Set<VargaKey>(["D30"]);

const BENEFICS = new Set<PlanetName>(["Jupiter", "Venus", "Mercury", "Moon"]);
const KENDRA = [1, 4, 7, 10];
const TRIKONA = [5, 9];
const DUSTHANA = [6, 8, 12];
const UPACHAYA = [3, 6, 10, 11];

const ordinal = (n: number) =>
  `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const listJoin = (xs: string[]) =>
  xs.length <= 1
    ? xs.join("")
    : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export interface VargaPlanet {
  planet: PlanetName;
  signIndex: number;
  /** Supply the D1 dignity (which knows Moolatrikona degrees); vargas use the sign alone. */
  dignity?: Dignity | null;
}

export interface VargaContext {
  varga: VargaKey;
  ascendantSignIndex: number;
  planets: VargaPlanet[];
  /** Birth-chart signs, to spot vargottama planets. */
  natalSigns?: Partial<Record<PlanetName, number>>;
  /** Birth-chart house lords, to place the relevant D1 lord in this chart. */
  natalLords?: { house: number; lord: PlanetName }[];
}

export function houseMeaning(varga: VargaKey, house: number): string {
  return varga === "D1"
    ? HOUSE_SIGNIFICATION[house]
    : VARGA_LENS[varga].houses[house];
}

const dignityOf = (p: VargaPlanet) =>
  p.dignity !== undefined ? p.dignity : getDignity(p.planet, p.signIndex);

const DIGNITY_SCORE: Record<Dignity, number> = {
  Exalted: 30,
  Moolatrikona: 26,
  "Own Sign": 24,
  "Friend's Sign": 14,
  "Neutral Sign": 8,
  "Enemy's Sign": 2,
  Debilitated: -14,
};
const dignityScore = (d: Dignity | null) => (d ? DIGNITY_SCORE[d] : 8);

const DIGNITY_TEXT: Record<Dignity, string> = {
  Exalted: "exalted — at its very best",
  Moolatrikona: "in its Moolatrikona sign — strong and purposeful",
  "Own Sign": "in its own sign — at home and dependable",
  "Friend's Sign": "in a friend's sign — comfortable",
  "Neutral Sign": "in a neutral sign",
  "Enemy's Sign": "in an enemy's sign — under strain",
  Debilitated: "debilitated — at its weakest",
};

const verdictOf = (score: number): Verdict =>
  score >= 62 ? "Strong" : score >= 42 ? "Balanced" : "Weak";

/** Planets whose graha drishti falls on a sign, each counted once. */
function aspectsOn(signIndex: number, planets: VargaPlanet[]): PlanetName[] {
  return planets
    .filter(
      (p) =>
        p.signIndex !== signIndex &&
        getAspectedHouses(p.planet).includes(
          ((signIndex - p.signIndex + 12) % 12) + 1,
        ),
    )
    .map((p) => p.planet);
}

function aspectScore(aspecting: PlanetName[]): number {
  return Math.max(
    -12,
    Math.min(
      12,
      aspecting.reduce((s, p) => s + (BENEFICS.has(p) ? 5 : -4), 0),
    ),
  );
}

/** How a planet fares in a house: the classical kendra/trikona/dusthana weights, with the upachaya rule for malefics. */
function placementScore(planet: PlanetName, house: number): number {
  const benefic = BENEFICS.has(planet);
  if (house === 1) return 14;
  if (TRIKONA.includes(house)) return 14;
  if (KENDRA.includes(house)) return benefic ? 12 : house === 10 ? 12 : 8;
  if (house === 11) return 10;
  if (house === 2) return 6;
  if (house === 3) return benefic ? 2 : 10;
  if (house === 6) return benefic ? -10 : 8;
  if (house === 8) return -12;
  return -10; // 12th
}

export interface PlanetReading {
  planet: PlanetName;
  house: number;
  sign: SignName;
  dignity: Dignity | null;
  vargottama: boolean;
  rules: number[];
  aspectedBy: PlanetName[];
  score: number;
  verdict: Verdict;
  /** The chart-specific interpretation. */
  reading: string;
  /** The factors behind the verdict, briefly. */
  basis: string;
}

export function readPlanets(ctx: VargaContext): PlanetReading[] {
  const { varga, ascendantSignIndex: asc, planets } = ctx;
  const profile = VARGA_PROFILE[varga];
  const title =
    varga === "D1" ? "birth chart" : `${VARGA_INFO[varga].title} (${varga})`;

  return planets.map((p) => {
    const house = signOffsetHouse(p.signIndex, asc);
    const dignity = dignityOf(p);
    const vargottama =
      varga !== "D1" && ctx.natalSigns?.[p.planet] === p.signIndex;
    const rules = Array.from({ length: 12 }, (_, i) => i + 1).filter(
      (h) => SIGN_LORDS[(asc + h - 1) % 12] === p.planet,
    );
    const aspectedBy = aspectsOn(p.signIndex, planets);
    const score = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          40 +
            dignityScore(dignity) +
            placementScore(p.planet, house) +
            aspectScore(aspectedBy) +
            (vargottama ? 8 : 0),
        ),
      ),
    );
    const verdict = verdictOf(score);
    const benefic = BENEFICS.has(p.planet);
    const area = houseMeaning(varga, house);

    const s: string[] = [];
    s.push(
      `In your ${title}, ${p.planet} ${RISK_CHART.has(varga) ? "shows the risk of" : "stands for"} ${profile.roles[p.planet]}.`,
    );
    s.push(
      `It sits in the ${ordinal(house)} house — ${area}${dignity ? `, ${DIGNITY_TEXT[dignity]}` : ""}.`,
    );
    if (profile.karakas.includes(p.planet))
      s.push(
        `As a natural significator of this chart's subject, its condition here counts double.`,
      );
    if (profile.focus.includes(house))
      s.push(
        `It occupies a key house of this chart, so it speaks directly to the main question the chart answers.`,
      );

    if (!benefic && UPACHAYA.includes(house) && house !== 10)
      s.push(
        `A natural malefic in an upachaya house grows stronger with time and effort — classically a good placement that builds results year by year.`,
      );
    else if (benefic && DUSTHANA.includes(house))
      s.push(
        `A natural benefic in a dusthana loses some of its sweetness: its gifts here arrive through effort, service or after a setback.`,
      );

    if (rules.length) {
      const others = rules.filter((r) => r !== house);
      if (others.length)
        s.push(
          `As lord of the ${listJoin(others.map(ordinal))}, it carries ${listJoin(others.map((r) => houseMeaning(varga, r)))} into this house.`,
        );
      else
        s.push(
          `It rules the very house it sits in, which protects and sustains these matters.`,
        );
    }
    if (vargottama)
      s.push(
        `It is vargottama — in the same sign as in your birth chart — so its promise is steady and reliable.`,
      );

    const good = aspectedBy.filter((a) => BENEFICS.has(a));
    const bad = aspectedBy.filter((a) => !BENEFICS.has(a));
    if (good.length)
      s.push(
        `${listJoin(good)} ${good.length > 1 ? "aspect" : "aspects"} it and lend${good.length > 1 ? "" : "s"} support.`,
      );
    if (bad.length)
      s.push(
        `${listJoin(bad)} ${bad.length > 1 ? "aspect" : "aspects"} it, adding pressure or delay.`,
      );

    const role = short(profile.roles[p.planet]);
    if (RISK_CHART.has(varga))
      s.push(
        verdict === "Strong"
          ? `Well placed, so this risk stays contained and is unlikely to become a serious theme.`
          : verdict === "Balanced"
            ? `Moderately placed: it can surface now and then, mostly during ${p.planet}'s periods — ordinary care is enough.`
            : `The most exposed point: watch for ${role}, especially during ${p.planet}'s periods — prevention and remedies help.`,
      );
    else
      s.push(
        verdict === "Strong"
          ? `Overall a real asset: expect good results in ${role}, especially during ${p.planet}'s dasha and antardasha.`
          : verdict === "Balanced"
            ? `Overall mixed: results in ${role} come with steady effort, most clearly during ${p.planet}'s periods.`
            : `Overall a weak point: be patient and deliberate with ${role}, especially during ${p.planet}'s periods.`,
      );

    const basis = [
      dignity
        ? cap(DIGNITY_TEXT[dignity].split(" —")[0])
        : "Dignity not assessed (node)",
      `${ordinal(house)} house (${house === 1 ? "lagna" : TRIKONA.includes(house) ? "trikona" : KENDRA.includes(house) ? "kendra" : DUSTHANA.includes(house) ? "dusthana" : UPACHAYA.includes(house) ? "upachaya" : "neutral"})`,
      ...(vargottama ? ["vargottama"] : []),
      ...(aspectedBy.length ? [`aspected by ${listJoin(aspectedBy)}`] : []),
    ].join(" · ");

    return {
      planet: p.planet,
      house,
      sign: SIGNS[p.signIndex] as SignName,
      dignity,
      vargottama,
      rules,
      aspectedBy,
      score,
      verdict,
      reading: s.join(" "),
      basis,
    };
  });
}

/** The first clause of a role, for reuse mid-sentence ("authority, government and leadership roles"). */
function short(role: string): string {
  const head = role.split(" — ")[0].split(", and ")[0];
  return head.replace(/^the /, "").trim();
}

export interface HouseReading {
  house: number;
  sign: SignName;
  meaning: string;
  lord: PlanetName;
  lordHouse: number;
  occupants: PlanetName[];
  aspectedBy: PlanetName[];
  key: boolean;
  score: number;
  verdict: Verdict;
  reading: string;
}

export function readHouses(ctx: VargaContext): HouseReading[] {
  const { varga, ascendantSignIndex: asc, planets } = ctx;
  const profile = VARGA_PROFILE[varga];
  const byPlanet = new Map(planets.map((p) => [p.planet, p]));

  return Array.from({ length: 12 }, (_, i) => {
    const house = i + 1;
    const signIndex = (asc + i) % 12;
    const meaning = houseMeaning(varga, house);
    const lord = SIGN_LORDS[signIndex] as PlanetName;
    const lp = byPlanet.get(lord)!;
    const lordHouse = signOffsetHouse(lp.signIndex, asc);
    const lordDignity = dignityOf(lp);
    const fromItself = ((lordHouse - house + 12) % 12) + 1;
    const occupants = planets.filter((p) => p.signIndex === signIndex);
    const aspectedBy = aspectsOn(signIndex, planets);

    let score = 45 + dignityScore(lordDignity) * 0.8;
    score +=
      KENDRA.includes(lordHouse) || TRIKONA.includes(lordHouse)
        ? 8
        : lordHouse === 11
          ? 5
          : DUSTHANA.includes(lordHouse)
            ? -10
            : 0;
    if (lordHouse !== house && DUSTHANA.includes(fromItself)) score -= 6;
    if (lordHouse === house) score += 6;
    for (const o of occupants) {
      const d = dignityScore(dignityOf(o)) * 0.5;
      score += BENEFICS.has(o.planet)
        ? d + 6
        : d + (UPACHAYA.includes(house) ? 4 : -6);
    }
    score += aspectScore(aspectedBy);
    score = Math.max(0, Math.min(100, Math.round(score)));
    const verdict = verdictOf(score);

    const s: string[] = [];
    s.push(
      `The ${ordinal(house)} house (${SIGNS[signIndex]}) shows ${meaning}.`,
    );
    if (lordHouse === house)
      s.push(
        `Its lord ${lord} sits in it${lordDignity ? `, ${DIGNITY_TEXT[lordDignity]}` : ""} — a lord at home guards these matters well.`,
      );
    else {
      s.push(
        `Its lord ${lord} has gone to the ${ordinal(lordHouse)}${lordDignity ? `, ${DIGNITY_TEXT[lordDignity]}` : ""} — so this house works through ${houseMeaning(varga, lordHouse)}.`,
      );
      if (DUSTHANA.includes(fromItself))
        s.push(
          `That is ${ordinal(fromItself)} from the house it rules, a classically weak link: expect obstacles or delay before these matters settle.`,
        );
      else if ([5, 9].includes(fromItself))
        s.push(
          `That is ${ordinal(fromItself)} from the house it rules, a harmonious trine that helps these matters flow.`,
        );
    }
    for (const o of occupants) {
      const d = dignityOf(o);
      const tone = BENEFICS.has(o.planet)
        ? d === "Debilitated" || d === "Enemy's Sign"
          ? "helps, though weakly"
          : "protects and enriches it"
        : UPACHAYA.includes(house)
          ? "pushes it forward through effort and grit"
          : "adds friction or intensity";
      if (RISK_CHART.has(varga)) {
        const weak = d === "Debilitated" || d === "Enemy's Sign";
        s.push(
          `${o.planet}${d ? ` (${d.toLowerCase()})` : ""} here names the likely form of difficulty — ${short(profile.roles[o.planet])}${weak ? ", and being weak it can bite" : ", though it stays mild if well handled"}.`,
        );
      } else
        s.push(
          `${o.planet}${d ? ` (${d.toLowerCase()})` : ""} sits here and brings ${short(profile.roles[o.planet])} — it ${tone}.`,
        );
    }
    if (!occupants.length)
      s.push(`No planet sits here, so the lord's condition tells the story.`);
    const good = aspectedBy.filter((a) => BENEFICS.has(a));
    const bad = aspectedBy.filter((a) => !BENEFICS.has(a));
    if (good.length)
      s.push(
        `${listJoin(good)} ${good.length > 1 ? "aspect" : "aspects"} it, which protects it.`,
      );
    if (bad.length)
      s.push(
        `${listJoin(bad)} ${bad.length > 1 ? "aspect" : "aspects"} it, adding pressure.`,
      );
    const topic = firstPhrase(meaning);
    if (RISK_CHART.has(varga))
      s.push(
        verdict === "Strong"
          ? `Well protected: ${topic} is unlikely to become serious.`
          : verdict === "Balanced"
            ? `Some exposure to ${topic}; ordinary care is enough.`
            : `Most exposed: ${topic} needs attention and precautions.`,
      );
    else
      s.push(
        verdict === "Strong"
          ? `A well-supported house: ${topic} should be a source of strength.`
          : verdict === "Balanced"
            ? `Moderately supported: expect results in ${topic} with steady effort.`
            : `Needs care: ${topic} is where delay or difficulty is most likely.`,
      );

    return {
      house,
      sign: SIGNS[signIndex] as SignName,
      meaning,
      lord,
      lordHouse,
      occupants: occupants.map((o) => o.planet),
      aspectedBy,
      key: profile.focus.includes(house),
      score,
      verdict,
      reading: s.join(" "),
    };
  });
}

function firstPhrase(meaning: string): string {
  return meaning
    .split(" — ")[0]
    .split(", or ")[0]
    .replace(/,? (most directly|the self beneath the surface)$/, "");
}

export interface Conjunction {
  planets: PlanetName[];
  house: number;
  sign: SignName;
  reading: string;
}

export function readConjunctions(ctx: VargaContext): Conjunction[] {
  const { varga, ascendantSignIndex: asc, planets } = ctx;
  const profile = VARGA_PROFILE[varga];
  const bySign = new Map<number, VargaPlanet[]>();
  for (const p of planets)
    bySign.set(p.signIndex, [...(bySign.get(p.signIndex) ?? []), p]);
  const out: Conjunction[] = [];
  for (const [signIndex, group] of bySign) {
    if (group.length < 2) continue;
    const house = signOffsetHouse(signIndex, asc);
    const names = group.map((g) => g.planet);
    const benefics = names.filter((n) => BENEFICS.has(n));
    const malefics = names.filter((n) => !BENEFICS.has(n));
    const mix = !malefics.length
      ? "All benefics — a gentle, supportive combination."
      : !benefics.length
        ? UPACHAYA.includes(house)
          ? "All malefics, but in an upachaya house — hard-driving and effective over time."
          : "All malefics — intense, and prone to strain unless channelled well."
        : `${listJoin(benefics)} soften${benefics.length > 1 ? "" : "s"} the edge of ${listJoin(malefics)}.`;
    out.push({
      planets: names,
      house,
      sign: SIGNS[signIndex] as SignName,
      reading: `In the ${ordinal(house)} house (${houseMeaning(varga, house)}), ${listJoin(names.map((n) => `${n} (${short(profile.roles[n])})`))} work as one. ${mix}`,
    });
  }
  return out.sort((a, b) => a.house - b.house);
}

export interface VargaSummary {
  verdict: Verdict;
  headline: string;
  points: string[];
}

/** A short, chart-specific verdict on the chart's subject, from its key houses, significators, lagna lord and the D1 anchor lord. */
export function summarise(ctx: VargaContext): VargaSummary {
  const { varga, ascendantSignIndex: asc } = ctx;
  if (varga === "D2") return summariseHora(ctx);
  const profile = VARGA_PROFILE[varga];
  const planets = readPlanets(ctx);
  const houses = readHouses(ctx);
  const P = new Map(planets.map((p) => [p.planet, p]));
  const subject = VARGA_SUBJECT[varga];
  const points: string[] = [];

  const lagnaLord = SIGN_LORDS[asc] as PlanetName;
  const ll = P.get(lagnaLord)!;
  points.push(
    `Lagna ${SIGNS[asc]}: its lord ${lagnaLord} is in the ${ordinal(ll.house)}${ll.dignity ? `, ${ll.dignity.toLowerCase()}` : ""}, so ${subject} ${RISK_CHART.has(varga) ? "is most tested through" : "centres on"} ${firstPhrase(houseMeaning(varga, ll.house))}.`,
  );
  for (const h of profile.focus) {
    const r = houses[h - 1];
    points.push(
      `Key ${ordinal(h)} house (${r.sign}) is ${r.verdict.toLowerCase()}: lord ${r.lord} in the ${ordinal(r.lordHouse)}${r.occupants.length ? `, with ${listJoin(r.occupants)} inside` : ""}.`,
    );
  }
  for (const k of profile.karakas) {
    const r = P.get(k)!;
    points.push(
      `Significator ${k}: ${r.verdict.toLowerCase()} — ${r.dignity ? r.dignity.toLowerCase() : "node"} in the ${ordinal(r.house)}.`,
    );
  }
  if (profile.d1House && ctx.natalLords) {
    const lord = ctx.natalLords.find((l) => l.house === profile.d1House)?.lord;
    const r = lord && P.get(lord);
    if (r)
      points.push(
        `Your birth chart's ${ordinal(profile.d1House)} lord, ${lord}, lands in this chart's ${ordinal(r.house)}${r.dignity ? `, ${r.dignity.toLowerCase()}` : ""} — the D1 promise for ${firstPhrase(HOUSE_SIGNIFICATION[profile.d1House])} is ${
          RISK_CHART.has(varga)
            ? r.verdict === "Strong"
              ? "well defended — you tend to overcome these"
              : r.verdict === "Balanced"
                ? "manageable with care"
                : "exposed here, so give it extra attention"
            : r.verdict === "Strong"
              ? "confirmed and strengthened here"
              : r.verdict === "Balanced"
                ? "carried forward, with effort"
                : "weakened here and needs support"
        }.`,
      );
  }
  const vargottama = planets.filter((p) => p.vargottama).map((p) => p.planet);
  if (vargottama.length)
    points.push(
      `Vargottama: ${listJoin(vargottama)} — steady, reliable results in this area.`,
    );

  // Weighted verdict: key houses and significators count most, then the lagna lord and the D1 anchor.
  const weights: number[] = [
    ...profile.focus.map((h) => houses[h - 1].score * 2),
    ...profile.karakas.map((k) => P.get(k)!.score * 1.5),
    ll.score,
  ];
  const anchorLord =
    profile.d1House &&
    ctx.natalLords?.find((l) => l.house === profile.d1House)?.lord;
  if (anchorLord) weights.push(P.get(anchorLord)!.score * 1.5);
  const total =
    profile.focus.length * 2 +
    profile.karakas.length * 1.5 +
    1 +
    (anchorLord ? 1.5 : 0);
  const verdict = verdictOf(weights.reduce((a, b) => a + b, 0) / total);

  const ranked = [...planets]
    .filter((p) => p.dignity !== null)
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const worst = ranked.at(-1)!;
  const headline =
    varga === "D1"
      ? `Strongest planet: ${best.planet}; the one needing most care: ${worst.planet}.`
      : RISK_CHART.has(varga)
        ? `${verdict === "Strong" ? "Good resilience: difficulties are likely to stay manageable" : verdict === "Balanced" ? "Average resilience: some difficulties, none overwhelming" : "Lower resilience: difficulties need prevention and remedies"}. Best contained: ${best.planet} (${short(VARGA_PROFILE[varga].roles[best.planet])}); the one to watch: ${worst.planet} (${short(VARGA_PROFILE[varga].roles[worst.planet])}).`
        : `${verdict === "Strong" ? "A strong promise" : verdict === "Balanced" ? "A mixed but workable promise" : "A promise that needs effort and remedies"} for ${subject}. ${best.planet} is your best ally here (${short(VARGA_PROFILE[varga].roles[best.planet])}); ${worst.planet} needs the most care (${short(VARGA_PROFILE[varga].roles[worst.planet])}).`;

  return { verdict, headline, points };
}

function summariseHora(ctx: VargaContext): VargaSummary {
  const { sun, moon, reading } = readHora(ctx);
  const suited =
    sun.filter((p) => !BENEFICS.has(p)).length +
    moon.filter((p) => BENEFICS.has(p)).length;
  const jupiterHora = sun.includes("Jupiter") ? "Sun's" : "Moon's";
  const points = [
    ...reading,
    `Jupiter, the significator of wealth, is in the ${jupiterHora} hora — ${jupiterHora === "Moon's" ? "well suited: savings grow steadily" : "money comes through enterprise more than through saving"}.`,
  ];
  const second = ctx.natalLords?.find((l) => l.house === 2)?.lord;
  if (second) {
    const inSun = sun.includes(second);
    const fits = inSun ? !BENEFICS.has(second) : BENEFICS.has(second);
    points.push(
      `Your birth chart's 2nd lord, ${second}, is in the ${inSun ? "Sun's" : "Moon's"} hora — ${fits ? "a good fit, confirming the D1 promise of wealth" : "against its nature, so the D1 promise of wealth needs deliberate planning"}.`,
    );
  }
  const verdict: Verdict =
    suited + (jupiterHora === "Moon's" ? 1 : 0) >= 6
      ? "Strong"
      : suited >= 4
        ? "Balanced"
        : "Weak";
  return {
    verdict,
    headline: `${verdict === "Strong" ? "A strong promise" : verdict === "Balanced" ? "A mixed but workable promise" : "A promise that needs effort and planning"} for wealth: ${suited} of 9 planets sit in the hora that suits them.`,
    points,
  };
}

/**
 * D2 (Parashari Hora) only ever uses Cancer and Leo, so a twelve-house reading
 * says nothing. It is read instead by which planets fall in the Sun's hora (Leo:
 * wealth won by effort and authority — malefics do well) or the Moon's hora
 * (Cancer: wealth that flows in and is kept — benefics do well).
 */
export function readHora(ctx: VargaContext): {
  sun: PlanetName[];
  moon: PlanetName[];
  reading: string[];
} {
  const sun = ctx.planets.filter((p) => p.signIndex === 4).map((p) => p.planet);
  const moon = ctx.planets
    .filter((p) => p.signIndex === 3)
    .map((p) => p.planet);
  const goodSun = sun.filter((p) => !BENEFICS.has(p));
  const goodMoon = moon.filter((p) => BENEFICS.has(p));
  const r: string[] = [];
  r.push(
    `Your Hora lagna is in the ${ctx.ascendantSignIndex === 4 ? "Sun's hora (Leo): you build wealth actively — by effort, status and taking charge" : "Moon's hora (Cancer): wealth comes to you through people, steady inflow and careful keeping"}.`,
  );
  if (sun.length)
    r.push(
      `In the Sun's hora: ${listJoin(sun.map((p) => `${p} (${short(VARGA_PROFILE.D2.roles[p])})`))}. ${goodSun.length ? `${listJoin(goodSun)} ${goodSun.length > 1 ? "are" : "is"} classically well placed here and earn${goodSun.length > 1 ? "" : "s"} through drive and authority.` : "Benefics here earn, but spend as readily."}`,
    );
  if (moon.length)
    r.push(
      `In the Moon's hora: ${listJoin(moon.map((p) => `${p} (${short(VARGA_PROFILE.D2.roles[p])})`))}. ${goodMoon.length ? `${listJoin(goodMoon)} ${goodMoon.length > 1 ? "are" : "is"} classically well placed here and help wealth accumulate.` : "Malefics here bring money, but with worry about keeping it."}`,
    );
  const score = goodSun.length + goodMoon.length;
  r.push(
    score >= 6
      ? "Most planets sit in the hora that suits them — a strong, natural capacity for wealth."
      : score >= 4
        ? "About half the planets suit their hora — wealth comes, with some planets working against the grain."
        : "Few planets suit their hora — money matters need conscious planning rather than luck.",
  );
  return { sun, moon, reading: r };
}
