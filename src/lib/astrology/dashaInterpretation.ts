import { SIGN_LORDS, type PlanetName } from "./constants";
import { getAspectedHouses } from "./aspects";
import { isCombust } from "./birthDetails";
import { FRIENDS, ENEMIES, getDignity } from "./dignity";
import { nakshatraLord } from "./dasha";
import { analyzeYogas } from "./yogaAnalysis";
import { saturnCycles } from "./transits";
import { PLANET_REMEDIES } from "./remedies";
import { DIGNITY_WORD } from "./houseReadings";
import type { LifeTimeline } from "./lifeTimeline";
import type { KundaliChart } from "./types";

/**
 * A full reading of every Vimshottari Mahadasha and Antardasha: the dasha
 * lord's condition in the birth chart (sign, house, dignity, nakshatra and
 * its lord, navamsa, combustion, Shadbala), the houses it rules and its
 * functional nature for the Lagna, the yogas it carries, what it does to
 * each area of life and why, overlapping Sade Sati, and practical advice.
 * Each Antardasha is read from its lord's own condition, its placement
 * counted from the Mahadasha lord, and the two planets' relationship.
 */

export interface AreaEffect {
  area: string;
  effect: string;
  positive: boolean | null;
}

export interface AntarInterpretation {
  lord: PlanetName;
  start: Date;
  end: Date;
  tone: "Supportive" | "Mixed" | "Demanding";
  headline: string;
  reasons: string[];
  effects: string[];
  events: string[];
}

export interface MahaInterpretation {
  lord: PlanetName;
  start: Date;
  end: Date;
  years: number;
  ageStart: number;
  ageEnd: number;
  tone: "Supportive" | "Mixed" | "Demanding";
  overview: string;
  condition: string[];
  lordship: string[];
  yogas: string[];
  areas: AreaEffect[];
  sadeSati: string | null;
  advice: { focus: string[]; avoid: string[]; remedies: string[] };
  antars: AntarInterpretation[];
}

const KENDRA = [1, 4, 7, 10];
const TRIKONA = [1, 5, 9];
const DUSTHANA = [6, 8, 12];
const YEAR_MS = 365.25 * 86400000;
const ord = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

const NATURE: Record<PlanetName, string> = {
  Sun: "authority, the father, government, confidence and health of the heart and eyes",
  Moon: "the mind, mother, emotions, public dealings, travel and fluids",
  Mars: "energy, courage, property, siblings, competition, surgery and technical work",
  Mercury: "intellect, speech, trade, writing, learning and friends",
  Jupiter: "wisdom, children, teachers, wealth, dharma and good fortune",
  Venus: "love, marriage, comforts, vehicles, arts, beauty and luxury",
  Saturn: "discipline, hard work, delays, service, longevity and the masses",
  Rahu: "ambition, foreign things, technology, sudden rise, obsession and confusion",
  Ketu: "detachment, spirituality, research, sudden breaks and past-life skills",
};

const FOCUS: Record<PlanetName, [string[], string[]]> = {
  Sun: [["Take on leadership and responsibility", "Build your health and daily routine", "Work with government or senior people"], ["Ego clashes with bosses or father", "Neglecting the heart and eyes"]],
  Moon: [["Care for your mind — rest, water, meditation", "Public-facing work and travel", "Time with your mother and family"], ["Emotional decisions", "Irregular sleep and diet"]],
  Mars: [["Sport and physical discipline", "Property, engineering and bold projects", "Competitive exams and contests"], ["Anger, rash driving and quarrels", "Impulsive risk-taking"]],
  Mercury: [["Study, certifications and writing", "Trade, sales and communication", "Networking with peers"], ["Scattered effort and over-thinking", "Signing documents without reading"]],
  Jupiter: [["Higher learning, teaching and mentors", "Long-term investment and savings", "Family growth and dharma"], ["Over-confidence and over-expansion", "Weight gain and liver strain"]],
  Venus: [["Relationships and marriage", "Arts, design and comforts", "Improving home and vehicles"], ["Overspending and indulgence", "Choosing pleasure over duty"]],
  Saturn: [["Patient, steady hard work", "Serving others and keeping discipline", "Long-term structures — career, property, savings"], ["Shortcuts, laziness and debt", "Isolation and pessimism"]],
  Rahu: [["Technology, foreign links and new fields", "Bold, unconventional goals", "Research and media"], ["Deception, speculation and addictions", "Confused decisions — verify everything"]],
  Ketu: [["Spiritual practice and research", "Finishing old matters", "Specialised, technical skills"], ["Sudden breaks without thought", "Neglecting health and relationships"]],
};

/** Life areas and the houses/karakas that carry them. */
const AREAS: { area: string; houses: number[]; karaka: PlanetName[] }[] = [
  { area: "Career", houses: [10, 6, 11], karaka: ["Sun", "Saturn", "Mercury"] },
  { area: "Money", houses: [2, 11], karaka: ["Jupiter", "Venus"] },
  { area: "Relationships and marriage", houses: [7, 5], karaka: ["Venus", "Jupiter"] },
  { area: "Health", houses: [1, 6, 8], karaka: ["Sun"] },
  { area: "Home and family", houses: [4, 2], karaka: ["Moon"] },
  { area: "Education", houses: [4, 5, 9], karaka: ["Mercury", "Jupiter"] },
  { area: "Spiritual life and travel", houses: [9, 12], karaka: ["Ketu", "Jupiter"] },
];

export function interpretDashas(chart: KundaliChart, timeline: LifeTimeline, now = new Date()): MahaInterpretation[] {
  const P = new Map(chart.planets.map((p) => [p.planet, p]));
  const sun = P.get("Sun")!;
  const moon = P.get("Moon")!;
  const birth = new Date(chart.utcDate).getTime();
  const ruledBy = (pl: PlanetName) => chart.houseLords.filter((h) => h.lord === pl).map((h) => h.house);
  const yogas = analyzeYogas(chart, now);
  const d9 = chart.divisionalCharts.D9;
  const sade = saturnCycles(moon.signIndex, new Date(birth), new Date(birth + 100 * YEAR_MS)).filter((c) => c.kind === "Sade Sati");
  const age = (d: Date) => (d.getTime() - birth) / YEAR_MS;

  /** Houses a planet links to by sitting, ruling or aspecting (nodes also act for their sign lord). */
  function links(pl: PlanetName): Map<number, string> {
    const p = P.get(pl)!;
    const m = new Map<number, string>();
    m.set(p.house, "sits in");
    for (const h of ruledBy(pl)) if (!m.has(h)) m.set(h, "rules");
    for (const d of getAspectedHouses(pl)) {
      const h = ((p.house + d - 2) % 12) + 1;
      if (!m.has(h)) m.set(h, "aspects");
    }
    if (pl === "Rahu" || pl === "Ketu") for (const h of ruledBy(SIGN_LORDS[p.signIndex] as PlanetName)) if (!m.has(h)) m.set(h, `acts for ${SIGN_LORDS[p.signIndex]}, which rules`);
    return m;
  }

  function score(pl: PlanetName): { tone: MahaInterpretation["tone"]; good: string[]; hard: string[] } {
    const p = P.get(pl)!;
    const good: string[] = [];
    const hard: string[] = [];
    if (yogas.functional.benefics.includes(pl)) good.push(`${pl} is a functional benefic for your ${chart.ascendant.sign} Lagna`);
    if (yogas.functional.malefics.includes(pl)) hard.push(`${pl} is a functional malefic for your ${chart.ascendant.sign} Lagna`);
    if (yogas.yogakaraka === pl) good.push(`${pl} is your Yogakaraka`);
    if (KENDRA.includes(p.house) || TRIKONA.includes(p.house)) good.push(`it sits in the ${ord(p.house)}, a ${TRIKONA.includes(p.house) ? "trikona" : "kendra"}`);
    if (DUSTHANA.includes(p.house)) hard.push(`it sits in the ${ord(p.house)}, a dusthana`);
    const dig = p.dignity;
    if (dig === "Exalted" || dig === "Own Sign" || dig === "Moolatrikona") good.push(`it is ${DIGNITY_WORD[dig]}`);
    if (dig === "Debilitated") hard.push("it is debilitated");
    if (pl !== "Sun" && isCombust(p, sun)) hard.push("it is combust");
    const bala = chart.shadbala.find((s) => s.planet === pl);
    if (bala) (bala.isStrong ? good : hard).push(bala.isStrong ? "it is strong by Shadbala" : "it is below strength by Shadbala");
    const n = good.length - hard.length;
    return { tone: n >= 2 ? "Supportive" : n <= -1 ? "Demanding" : "Mixed", good, hard };
  }

  function areaEffects(pl: PlanetName, toneOverride?: MahaInterpretation["tone"]): AreaEffect[] {
    const l = links(pl);
    const tone = toneOverride ?? score(pl).tone;
    const out: AreaEffect[] = [];
    for (const a of AREAS) {
      const hits = a.houses.filter((h) => l.has(h));
      const karaka = a.karaka.includes(pl);
      if (!hits.length && !karaka) continue;
      // A link through the 6th, 8th or 12th turns money and health results difficult even in a good period.
      const viaDusthana = hits.some((h) => DUSTHANA.includes(h) && l.get(h) !== "aspects");
      let positive: boolean | null = tone === "Supportive" ? true : tone === "Demanding" ? false : null;
      if (viaDusthana && (a.area === "Money" || a.area === "Health") && positive !== false) positive = positive === true ? null : false;
      const how = hits.map((h) => `${l.get(h)} your ${ord(h)}`).join(" and ");
      const result = AREA_RESULT[a.area][positive === true ? 0 : positive === false ? 2 : 1];
      out.push({ area: a.area, effect: `${pl} ${how || "is its natural significator"}${hits.length && karaka ? " and is its natural significator" : ""}, so ${result}.`, positive });
    }
    return out;
  }

  return chart.dashas
    .filter((md) => age(new Date(md.start)) < 100)
    .map((md) => {
      const lord = md.lord as PlanetName;
      const p = P.get(lord)!;
      const start = new Date(md.start);
      const end = new Date(md.end);
      const s = score(lord);
      const ruled = ruledBy(lord);
      const starLord = nakshatraLord(p.nakshatraIndex) as PlanetName;
      const sp = P.get(starLord)!;
      const d9p = d9?.planets.find((x) => x.planet === lord);
      const d9dig = d9p ? getDignity(lord, d9p.signIndex) : null;
      const bala = chart.shadbala.find((b) => b.planet === lord);

      const condition = [
        `${lord} is placed in ${p.sign} in your ${ord(p.house)} house${p.dignity ? `, ${DIGNITY_WORD[p.dignity]}` : ""}. That makes ${HOUSE_WORD[p.house]} the stage on which this whole period plays out.`,
        `It sits in ${p.nakshatra} nakshatra (pada ${p.pada}), ruled by ${starLord}. A planet gives the results of its star lord, and ${starLord} is in your ${ord(sp.house)} house — so ${HOUSE_WORD[sp.house]} also shape what ${lord} delivers.`,
        d9p ? `In the Navamsa (D9), which shows a planet's inner strength, ${lord} is in ${d9p.sign}${d9dig && d9dig !== "Neutral Sign" ? ` (${d9dig.toLowerCase()})` : ""}${d9p.signIndex === p.signIndex ? " — vargottama, the same sign as the birth chart, which adds real strength" : ""}.` : "",
        p.retrograde && lord !== "Rahu" && lord !== "Ketu" ? `${lord} is retrograde: its results come in a revisited, delayed or unconventional way, and matters from the past return.` : "",
        lord !== "Sun" && isCombust(p, sun) ? `${lord} is combust — close to the Sun — so its significations are overshadowed and need conscious effort.` : "",
        bala ? `By Shadbala it has ${bala.rupas.toFixed(2)} of the ${bala.requiredRupas} rupas it needs — ${bala.isStrong ? "strong enough to deliver fully" : "below strength, so results come with effort"}.` : "",
      ].filter(Boolean);

      const lordship = ruled.length
        ? [
            `${lord} rules your ${list(ruled.map(ord))} house${ruled.length > 1 ? "s" : ""} (${ruled.map((h) => HOUSE_WORD[h]).join("; ")}). These are the matters this period switches on.`,
            ...ruled.map((h) =>
              TRIKONA.includes(h) && h !== 1
                ? `As the ${ord(h)} lord (a trikona) it brings fortune and merit.`
                : KENDRA.includes(h) && h !== 1
                  ? `As the ${ord(h)} lord (a kendra) it brings action, visibility and effort.`
                  : h === 1
                    ? "As your Lagna lord it is always important for health and self-confidence."
                    : DUSTHANA.includes(h)
                      ? `As the ${ord(h)} lord (a dusthana) it can bring ${h === 6 ? "competition, debts or illness — and the power to defeat rivals" : h === 8 ? "sudden changes, obstacles or hidden gains" : "expenses, distance and withdrawal — or foreign links"}.`
                      : h === 2 || h === 7
                        ? `As the ${ord(h)} lord (a maraka house) it brings ${h === 2 ? "money and family matters" : "partnerships"}, and classically calls for care with health late in life.`
                        : `As the ${ord(h)} lord it brings ${HOUSE_WORD[h]}.`
            ),
          ]
        : [`${lord} rules no sign, so it acts for its sign lord ${SIGN_LORDS[p.signIndex]} and the planets it joins; ${SIGN_LORDS[p.signIndex]} rules your ${list(ruledBy(SIGN_LORDS[p.signIndex] as PlanetName).map(ord))}.`];

      const carried = yogas.findings.filter((f) => f.planets.includes(lord) && f.strength !== "Weak").map((f) => `${f.name} (${f.strength.toLowerCase()}): ${f.effect}`);

      const overlap = sade.filter((c) => new Date(c.start) < end && new Date(c.end) > start);
      const sadeSati = overlap.length
        ? `Sade Sati overlaps this period (${overlap.map((c) => `${new Date(c.start).getFullYear()}–${new Date(c.end).getFullYear()}`).join(", ")}), adding Saturn's pressure — extra responsibility, fatigue and slower results, which reward patience.`
        : null;

      const rem = PLANET_REMEDIES[lord];
      const overview = `${lord} Mahadasha lasts ${Math.round((end.getTime() - start.getTime()) / YEAR_MS)} years, from age ${Math.max(0, Math.floor(age(start)))} to ${Math.floor(age(end))}. ${lord} governs ${NATURE[lord]}. In your chart it ${s.tone === "Supportive" ? "is well placed, so this is a period of growth" : s.tone === "Demanding" ? "is under strain, so this period builds you through challenges" : "is mixed, so results rise and fall with each sub-period"} — ${list([...s.good, ...s.hard])}.`;

      const tl = timeline.mahas.find((m) => new Date(m.start).getTime() === start.getTime());

      const antars: AntarInterpretation[] = (md.subPeriods ?? []).map((ad) => {
        const al = ad.lord as PlanetName;
        const ap = P.get(al)!;
        const fromMd = ((ap.signIndex - p.signIndex + 12) % 12) + 1;
        const as = score(al);
        const rel = al === lord ? "same" : FRIENDS[lord]?.includes(al) ? "friend" : ENEMIES[lord]?.includes(al) ? "enemy" : "neutral";
        const reasons = [
          `${al} is in your ${ord(ap.house)} house${ap.dignity ? `, ${DIGNITY_WORD[ap.dignity]}` : ""}${ruledBy(al).length ? `, and rules your ${list(ruledBy(al).map(ord))}` : ""}.`,
          al === lord
            ? `This is ${lord}'s own sub-period, when its themes are purest and strongest.`
            : `${al} is ${ord(fromMd)} from ${lord}: ${[1, 5, 9].includes(fromMd) ? "a trine, so the two cooperate well" : [4, 7, 10].includes(fromMd) ? "an angle, so the period is active and visible" : [2, 11].includes(fromMd) ? "a position of gains" : fromMd === 3 ? "a position of effort and initiative" : "a 6/8/12 position, so expect friction, obstacles or losses"}.`,
          rel === "same" ? "" : rel === "friend" ? `${lord} treats ${al} as a friend — the sub-period runs smoothly.` : rel === "enemy" ? `${lord} treats ${al} as an enemy — their agendas pull against each other.` : `${lord} is neutral towards ${al}.`,
        ].filter(Boolean);
        const points = (as.tone === "Supportive" ? 1 : as.tone === "Demanding" ? -1 : 0) + ([6, 8, 12].includes(fromMd) ? -1 : [1, 5, 9, 11, 2].includes(fromMd) ? 1 : 0) + (rel === "friend" ? 0.5 : rel === "enemy" ? -0.5 : 0);
        const tone: AntarInterpretation["tone"] = points >= 1 ? "Supportive" : points <= -1 ? "Demanding" : "Mixed";
        const effects = areaEffects(al, tone).map((e) => `${e.area}: ${e.effect}`);
        const tlAntar = tl?.antars.find((x) => new Date(x.start).getTime() === new Date(ad.start).getTime());
        return {
          lord: al,
          start: new Date(ad.start),
          end: new Date(ad.end),
          tone,
          headline: `${lord}–${al}: ${NATURE[al].split(",").slice(0, 3).join(",")} through your ${ord(ap.house)} house`,
          reasons,
          effects,
          events: (tlAntar?.themes ?? []).map((t) => `${t.label} — ${t.why.join("; ")}`),
        };
      });

      return {
        lord,
        start,
        end,
        years: (end.getTime() - start.getTime()) / YEAR_MS,
        ageStart: Math.max(0, age(start)),
        ageEnd: age(end),
        tone: s.tone,
        overview,
        condition,
        lordship,
        yogas: carried,
        areas: areaEffects(lord),
        sadeSati,
        advice: {
          focus: FOCUS[lord][0],
          avoid: FOCUS[lord][1],
          remedies: [`Chant ${rem.mantra} (108 times, especially on ${rem.day}s)`, `${rem.charity}`, rem.practice, `Worship: ${rem.deity}`],
        },
        antars,
      };
    });
}

const AREA_RESULT: Record<string, [string, string, string]> = {
  Career: ["expect promotions, recognition and new responsibilities", "work stays steady, with some ups and downs", "expect pressure at work, a change of role or friction with superiors"],
  Money: ["income rises and savings grow", "income holds but needs careful management", "expenses and financial strain need a tight budget"],
  "Relationships and marriage": ["romance, commitment or harmony with your partner are favoured", "relationships need attention and honest talk", "misunderstandings or distance can arise — go gently"],
  Health: ["vitality is good", "health is moderate — keep your routines", "health needs care: routine, rest and check-ups"],
  "Home and family": ["home life is comfortable — property or a vehicle may come", "home life changes gently", "domestic unrest or a change of residence is possible"],
  Education: ["studies and exams go well", "learning takes steady effort", "studies may be interrupted — keep going"],
  "Spiritual life and travel": ["spiritual growth, pilgrimage or rewarding travel are likely", "there is an inward pull and some travel", "restlessness, isolation or costly travel are possible"],
};

const HOUSE_WORD: Record<number, string> = {
  1: "self, health and personality",
  2: "money, family and speech",
  3: "effort, courage, siblings and communication",
  4: "home, mother, property and peace of mind",
  5: "children, intelligence, romance and creativity",
  6: "work, competition, debts and health",
  7: "marriage, partnerships and clients",
  8: "sudden change, longevity, research and inheritance",
  9: "luck, father, teachers and long journeys",
  10: "career, status and public life",
  11: "gains, friends and fulfilled wishes",
  12: "expenses, foreign lands, sleep and spirituality",
};

