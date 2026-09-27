import { SIGNS, SIGN_LORDS, type PlanetName } from "./constants";
import { analyzeBhavaStrength } from "./bhavaStrength";
import { analyzeYogas } from "./yogaAnalysis";
import { charaKarakas } from "./charaDasha";
import { DIGNITY_WORD } from "./houseReadings";
import { SIGN_REFERENCE } from "./reference/signs";
import type { CareerAnalysis } from "./careerAnalysis";
import type { EventTheme, LifeTimeline, Tone } from "./lifeTimeline";
import type { KundaliChart } from "./types";

/**
 * Each sector of life read from the kundli as a whole: what the chart
 * promises (houses, their lords, the natural significator, the relevant
 * divisional chart and yogas), the specific traits of this person in that
 * area, and how the area develops through the stages of life — built from
 * the dasha periods that activate it and the events the timeline finds.
 */

export interface SectorStage {
  label: string;
  ages: [number, number];
  dashas: string;
  tone: Tone | null;
  text: string;
  windows: { label: string; ages: string; why: string }[];
}

export interface LifeSector {
  key: string;
  title: string;
  score: number;
  verdict: "Strong" | "Promising" | "Mixed" | "Needs effort";
  promise: string;
  reasons: string[];
  traits: string[];
  stages: SectorStage[];
  peak: string | null;
  caution: string | null;
  advice: string[];
}

interface SectorDef {
  key: string;
  title: string;
  houses: number[];
  karakas: PlanetName[];
  varga?: { key: string; house: number; label: string };
  theme?: EventTheme;
  yogaCategory?: "raja" | "dhana";
  /** Below this age the area isn't yet meaningful (no "marriage" windows at 5). */
  minAge: number;
  advice: string[];
}

const SECTORS: SectorDef[] = [
  { key: "career", minAge: 16, title: "Career & Profession", houses: [10, 6, 11], karakas: ["Sun", "Saturn", "Mercury"], varga: { key: "D10", house: 10, label: "Dasamsa" }, theme: "career", yogaCategory: "raja", advice: ["Build skills during demanding periods; they pay off in supportive ones.", "Use the peak windows below for job changes, launches and promotions."] },
  { key: "education", minAge: 3, title: "Education & Learning", houses: [4, 5, 9], karakas: ["Mercury", "Jupiter"], varga: { key: "D24", house: 4, label: "Chaturvimshamsa" }, theme: "education", advice: ["Choose subjects that match the strongest planet in your 5th and 9th.", "Take exams and admissions in periods marked for education."] },
  { key: "finance", minAge: 16, title: "Money & Wealth", houses: [2, 11], karakas: ["Jupiter", "Venus"], theme: "wealth", yogaCategory: "dhana", advice: ["Save aggressively in gain periods to carry you through demanding ones.", "Avoid speculation when Rahu or the 8th lord runs."] },
  { key: "love", minAge: 16, title: "Love, Marriage & Partnership", houses: [7, 5, 2], karakas: ["Venus", "Jupiter"], varga: { key: "D9", house: 7, label: "Navamsa" }, theme: "marriage", advice: ["Use supportive Venus and 7th-lord periods for commitment.", "In demanding periods, communicate more and decide less."] },
  { key: "health", minAge: 0, title: "Health & Vitality", houses: [1, 6, 8], karakas: ["Sun", "Moon"], theme: "health", advice: ["Build routine and check-ups into the caution windows.", "Strengthen the Lagna lord — its periods set your vitality."] },
  { key: "family", minAge: 0, title: "Home, Mother & Family", houses: [4, 2], karakas: ["Moon"], varga: { key: "D4", house: 4, label: "Chaturthamsa" }, theme: "property", advice: ["Buy property or renovate in periods marked for property.", "Spend time with your mother when the Moon or 4th lord runs."] },
  { key: "children", minAge: 20, title: "Children & Creativity", houses: [5, 9], karakas: ["Jupiter"], varga: { key: "D7", house: 5, label: "Saptamsa" }, theme: "children", advice: ["Plan for children in Jupiter and 5th-lord periods.", "Creative work flourishes when the 5th house is active."] },
  { key: "travel", minAge: 5, title: "Travel & Foreign Lands", houses: [12, 9, 3], karakas: ["Rahu"], theme: "travel", advice: ["Plan study or work abroad in 12th and 9th-lord periods.", "Rahu periods favour foreign links; verify every offer."] },
  { key: "spiritual", minAge: 0, title: "Spirituality & Inner Life", houses: [9, 12, 5], karakas: ["Jupiter", "Ketu"], theme: "spiritual", advice: ["Take up practice in Ketu, Jupiter and 12th-lord periods.", "Pilgrimage and retreat suit the windows below."] },
];

const STAGES: { label: string; ages: [number, number] }[] = [
  { label: "Childhood", ages: [0, 12] },
  { label: "Teens and youth", ages: [13, 24] },
  { label: "Early adulthood", ages: [25, 36] },
  { label: "Midlife", ages: [37, 48] },
  { label: "Maturity", ages: [49, 60] },
  { label: "Elder years", ages: [61, 75] },
  { label: "Later life", ages: [76, 90] },
];

const ord = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const dist = (a: number, b: number) => ((b - a + 12) % 12) + 1;

export function lifeSectors(chart: KundaliChart, timeline: LifeTimeline, career: CareerAnalysis): LifeSector[] {
  const P = new Map(chart.planets.map((p) => [p.planet, p]));
  const lagna = chart.ascendant.signIndex;
  const lordOf = (h: number) => SIGN_LORDS[(lagna + h - 1) % 12] as PlanetName;
  const bhava = analyzeBhavaStrength(lagna, chart.planets, chart.shadbala);
  const yogas = analyzeYogas(chart);
  const karakas = charaKarakas(chart);

  return SECTORS.map((sec) => {
    const reasons: string[] = [];
    let score = 0;
    let weight = 0;
    for (const h of sec.houses) {
      const w = h === sec.houses[0] ? 2 : 1;
      score += bhava[h - 1].score * w;
      weight += w;
      const l = lordOf(h);
      const lp = P.get(l)!;
      reasons.push(`${ord(h)} house (${SIGNS[(lagna + h - 1) % 12]}): lord ${l} in the ${ord(lp.house)}${lp.dignity ? `, ${DIGNITY_WORD[lp.dignity]}` : ""}; strength ${Math.round(bhava[h - 1].score)}/100.`);
    }
    score /= weight;
    for (const k of sec.karakas) {
      const kp = P.get(k)!;
      const bala = chart.shadbala.find((b) => b.planet === k);
      if (bala) {
        score += bala.isStrong ? 4 : -4;
        reasons.push(`${k}, its natural significator, is ${bala.isStrong ? "strong" : "below strength"} by Shadbala and sits in the ${ord(kp.house)}.`);
      } else reasons.push(`${k}, a significator, sits in the ${ord(kp.house)}.`);
    }
    if (sec.varga) {
      const V = chart.divisionalCharts[sec.varga.key as keyof typeof chart.divisionalCharts];
      if (V) {
        const keySign = (V.ascendant.signIndex + sec.varga.house - 1) % 12;
        const keyLord = SIGN_LORDS[keySign] as PlanetName;
        const kl = V.planets.find((x) => x.planet === keyLord);
        const h = kl ? dist(V.ascendant.signIndex, kl.signIndex) : null;
        const good = h !== null && [1, 2, 4, 5, 7, 9, 10, 11].includes(h);
        score += good ? 4 : -3;
        reasons.push(`In the ${sec.varga.label} (${sec.varga.key}), the ${ord(sec.varga.house)} lord ${keyLord} is in its ${h ? ord(h) : "—"} house — ${good ? "confirming the promise" : "so results take more effort"}.`);
      }
    }
    if (sec.yogaCategory) {
      const ys = yogas.findings.filter((f) => f.category === sec.yogaCategory && f.strength !== "Weak");
      if (ys.length) {
        score += Math.min(8, ys.length * 3);
        reasons.push(`${ys.length} ${sec.yogaCategory === "raja" ? "Raj" : "Dhan"} Yoga${ys.length > 1 ? "s" : ""} support${ys.length > 1 ? "" : "s"} this area: ${ys.map((y) => y.name).join(", ")}.`);
      }
    }
    if (sec.key === "health") {
      const ar = yogas.findings.filter((f) => f.category === "arishta" && f.strength !== "Mitigated");
      if (ar.length) {
        score -= ar.length * 3;
        reasons.push(`Unmitigated Arisht Yogas: ${ar.map((a) => a.name).join(", ")}.`);
      }
    }
    score = Math.max(0, Math.min(100, Math.round(score)));
    const verdict: LifeSector["verdict"] = score >= 66 ? "Strong" : score >= 55 ? "Promising" : score >= 44 ? "Mixed" : "Needs effort";

    const traits = sectorTraits(sec.key, chart, career, karakas);

    // Stages
    const relevant = new Set<PlanetName>([...sec.houses.map(lordOf), ...sec.karakas, ...chart.planets.filter((p) => sec.houses.includes(p.house)).map((p) => p.planet)]);
    const allWindows: { label: string; ageMid: number; ages: string; why: string; tone: Tone; hit: boolean; strength: number }[] = [];
    const stages: SectorStage[] = STAGES.map((st) => {
      const mahas = timeline.mahas.filter((m) => m.ageStart < st.ages[1] + 1 && m.ageEnd > st.ages[0]);
      if (st.ages[1] < sec.minAge) return { label: st.label, ages: st.ages, dashas: mahas.map((m) => `${m.lord} Mahadasha`).join(", then "), tone: null, text: "Too early for this area of life to take shape.", windows: [] };
      const windows: SectorStage["windows"] = [];
      let tones = 0;
      let n = 0;
      for (const m of mahas) {
        for (const a of m.antars) {
          const mid = (a.ageStart + a.ageEnd) / 2;
          if (mid < st.ages[0] || mid >= st.ages[1] + 1 || mid < sec.minAge) continue;
          const th = sec.theme ? a.themes.find((t) => t.kind === sec.theme) : undefined;
          const lordHit = relevant.has(a.lord);
          if (!th && !lordHit) continue;
          tones += a.tone === "Supportive" ? 1 : a.tone === "Demanding" ? -1 : 0;
          n++;
          const agesTxt = `${Math.floor(a.ageStart)}–${Math.ceil(a.ageEnd)}`;
          const why = th ? th.why.join("; ") : `${a.lord} ${sec.houses.map(lordOf).includes(a.lord) ? `rules your ${ord(sec.houses.find((h) => lordOf(h) === a.lord)!)}` : sec.karakas.includes(a.lord) ? "is a natural significator of this area" : `sits in your ${ord(P.get(a.lord)!.house)}`}`;
          allWindows.push({ label: `${m.lord}–${a.lord}`, ageMid: mid, ages: agesTxt, why, tone: a.tone, hit: !!th, strength: th?.score ?? 0 });
          if (th || windows.length < 3) windows.push({ label: `${m.lord}–${a.lord}${th ? ` · ${th.label}` : ""}`, ages: agesTxt, why });
        }
      }
      const tone: Tone | null = n === 0 ? null : tones > 0 ? "Supportive" : tones < 0 ? "Demanding" : "Mixed";
      const dashas = mahas.map((m) => `${m.lord} Mahadasha`).join(", then ");
      const text =
        n === 0
          ? `A quieter stage for this area. ${dashas ? `The ${dashas} ${mahas.length > 1 ? "do" : "does"} not directly involve it, so it develops in the background.` : ""}`
          : `${dashas} ${mahas.length > 1 ? "cover" : "covers"} these years. ${windows.filter((w) => w.label.includes("·")).length ? `The key windows are marked below.` : "This area is touched by the sub-periods below."} ${tone === "Supportive" ? "Overall a growing, supportive stage." : tone === "Demanding" ? "Overall a stage of effort and lessons." : "Overall a mixed stage — results depend on timing."}`;
      return { label: st.label, ages: st.ages, dashas, tone, text: text.trim(), windows: windows.slice(0, 5) };
    });

    const hits = allWindows.filter((w) => w.hit);
    // Best window: the strongest event window, preferring supportive over mixed tone; demanding ones only if nothing else exists.
    const toneRank = (t: Tone) => (t === "Supportive" ? 2 : t === "Mixed" ? 1 : 0);
    const pool = hits.length ? hits : allWindows;
    const peakW = [...pool].sort((a, b) => toneRank(b.tone) - toneRank(a.tone) || b.strength - a.strength)[0];
    // Caution: a demanding period that touches the area without bringing its event.
    const cautionW = allWindows.filter((w) => w.tone === "Demanding" && !w.hit && w.ageMid > sec.minAge && w !== peakW)[0];

    return {
      key: sec.key,
      title: sec.title,
      score,
      verdict,
      promise: promiseText(sec.title, verdict),
      reasons,
      traits,
      stages,
      peak: peakW ? `${peakW.label} (age ${peakW.ages}) — ${peakW.why}` : null,
      caution: cautionW ? `${cautionW.label} (age ${cautionW.ages}) — a demanding sub-period for this area; go carefully.` : null,
      advice: sec.advice,
    };
  });
}

function promiseText(title: string, v: LifeSector["verdict"]): string {
  return v === "Strong"
    ? `${title} is one of the strongest promises in your chart — it grows readily when its periods arrive.`
    : v === "Promising"
      ? `${title} is well promised; it delivers steadily, with clear peak windows.`
      : v === "Mixed"
        ? `${title} is mixed — good periods alternate with slower ones, so timing matters.`
        : `${title} asks for conscious effort; results come later and through persistence.`;
}

function sectorTraits(key: string, chart: KundaliChart, career: CareerAnalysis, karakas: ReturnType<typeof charaKarakas>): string[] {
  const P = new Map(chart.planets.map((p) => [p.planet, p]));
  const lagna = chart.ascendant.signIndex;
  const lordOf = (h: number) => SIGN_LORDS[(lagna + h - 1) % 12] as PlanetName;
  const inHouse = (h: number) => chart.planets.filter((p) => p.house === h).map((p) => p.planet);
  const sign = (h: number) => SIGNS[(lagna + h - 1) % 12];
  const out: string[] = [];
  switch (key) {
    case "career":
      out.push(`Best-suited fields: ${career.fields.map((f) => f.fields.slice(0, 2).join(", ")).join("; ")}.`);
      out.push(`Work style: ${career.signStyle} ${career.mode.verdict === "Either" ? "Both employment and business can work." : `${career.mode.verdict === "Job" ? "Employment" : "Business"} suits you better.`}`);
      out.push(career.amatyaText);
      break;
    case "education": {
      const five = inHouse(5);
      out.push(`Your 5th house of intellect is in ${sign(5)}${five.length ? ` with ${five.join(", ")}` : ""}; its lord ${lordOf(5)} sits in the ${ord(P.get(lordOf(5))!.house)}.`);
      const merc = P.get("Mercury")!;
      const jup = P.get("Jupiter")!;
      out.push(`Mercury (analysis, languages, maths) is in ${merc.sign}${merc.dignity ? `, ${DIGNITY_WORD[merc.dignity]}` : ""}; Jupiter (depth, wisdom, higher studies) is in ${jup.sign}${jup.dignity ? `, ${DIGNITY_WORD[jup.dignity]}` : ""}.`);
      out.push(`Your 9th lord ${lordOf(9)} in the ${ord(P.get(lordOf(9))!.house)} shows the path of higher learning: ${HIGHER[P.get(lordOf(9))!.house]}.`);
      break;
    }
    case "finance":
      out.push(`Earnings come through ${HOUSE_SOURCE[P.get(lordOf(11))!.house]} (your 11th lord ${lordOf(11)} is in the ${ord(P.get(lordOf(11))!.house)}).`);
      out.push(`Savings and family wealth: your 2nd lord ${lordOf(2)} is in the ${ord(P.get(lordOf(2))!.house)}, tying savings to ${HOUSE_SOURCE[P.get(lordOf(2))!.house]}.`);
      out.push(`Spending: your 12th lord ${lordOf(12)} is in the ${ord(P.get(lordOf(12))!.house)} — money tends to go on ${HOUSE_SOURCE[P.get(lordOf(12))!.house]}.`);
      break;
    case "love": {
      const venus = P.get("Venus")!;
      const dk = karakas[karakas.length - 1];
      out.push(`Romance (5th house, ${sign(5)}): ${inHouse(5).length ? `${inHouse(5).join(", ")} there shape how you love` : `its lord ${lordOf(5)} in the ${ord(P.get(lordOf(5))!.house)} shapes how you love`}.`);
      out.push(`Marriage (7th house, ${sign(7)}): lord ${lordOf(7)} in the ${ord(P.get(lordOf(7))!.house)}${inHouse(7).length ? `, with ${inHouse(7).join(", ")} in the 7th` : ""}. The partner tends to be ${SIGN_REFERENCE[(lagna + 6) % 12].description.split(".")[0].toLowerCase()}.`);
      out.push(`Venus, the planet of love, is in ${venus.sign} in your ${ord(venus.house)}${venus.dignity ? `, ${DIGNITY_WORD[venus.dignity]}` : ""}. Your Darakaraka (Jaimini spouse significator) is ${dk.planet}, in the ${ord(dk.house)}.`);
      const m = chart.mangalDosha;
      out.push(m.status === "present" ? `Mangal Dosha is present (${m.severity}) — weigh it in matching.` : m.status === "cancelled" ? "Mangal Dosha is indicated but cancelled." : "No Mangal Dosha.");
      break;
    }
    case "health": {
      const el = SIGN_REFERENCE[lagna].element;
      out.push(`Constitution: a ${el.toLowerCase()} Lagna (${chart.ascendant.sign}) — ${CONSTITUTION[el]}.`);
      const l1 = P.get(lordOf(1))!;
      out.push(`Vitality: your Lagna lord ${l1.planet} is in the ${ord(l1.house)}${l1.dignity ? `, ${DIGNITY_WORD[l1.dignity]}` : ""}.`);
      const sensitive = [6, 8, 12].flatMap((h) => inHouse(h).filter((p) => ["Mars", "Saturn", "Rahu", "Ketu", "Sun"].includes(p)).map((p) => `${p} in the ${ord(h)} (${BODY[h]})`));
      out.push(sensitive.length ? `Areas to watch: ${sensitive.join("; ")}.` : "No malefic sits in the 6th, 8th or 12th, a protective sign for health.");
      break;
    }
    case "family":
      out.push(`Home and mother (4th house, ${sign(4)}): lord ${lordOf(4)} in the ${ord(P.get(lordOf(4))!.house)}${inHouse(4).length ? `, with ${inHouse(4).join(", ")} in the 4th` : ""}.`);
      out.push(`The Moon (mother, emotional home) is in ${P.get("Moon")!.sign} in your ${ord(P.get("Moon")!.house)}.`);
      out.push(`Family (2nd house, ${sign(2)}): lord ${lordOf(2)} in the ${ord(P.get(lordOf(2))!.house)}.`);
      break;
    case "children":
      out.push(`5th house (${sign(5)}): lord ${lordOf(5)} in the ${ord(P.get(lordOf(5))!.house)}${inHouse(5).length ? `, with ${inHouse(5).join(", ")}` : ""}.`);
      out.push(`Jupiter, the significator of children, is in ${P.get("Jupiter")!.sign} in your ${ord(P.get("Jupiter")!.house)}. Your Putrakaraka is ${karakas[4].planet}.`);
      break;
    case "travel":
      out.push(`Foreign lands (12th house, ${sign(12)}): lord ${lordOf(12)} in the ${ord(P.get(lordOf(12))!.house)}${inHouse(12).length ? `, with ${inHouse(12).join(", ")}` : ""}.`);
      out.push(`Rahu, the planet of foreign things, is in your ${ord(P.get("Rahu")!.house)}. ${[9, 12, 7, 10].includes(P.get("Rahu")!.house) ? "That favours foreign connections." : ""}`);
      break;
    case "spiritual":
      out.push(`9th house of dharma (${sign(9)}) and 12th of release (${sign(12)}); Ketu is in your ${ord(P.get("Ketu")!.house)} and Jupiter in your ${ord(P.get("Jupiter")!.house)}.`);
      out.push(`Your Atmakaraka is ${karakas[0].planet} — the soul's lesson this life relates to ${SOUL[karakas[0].planet]}.`);
      break;
  }
  return out;
}

const HIGHER: Record<number, string> = {
  1: "self-driven study", 2: "finance, languages or family tradition", 3: "communication, media and short courses", 4: "formal degrees close to home", 5: "creative, advisory or academic subjects", 6: "medicine, law or competitive exams", 7: "study with partners or abroad", 8: "research, occult or deep technical fields", 9: "philosophy, law, religion — and study far from home", 10: "professional and management studies", 11: "large institutions and networks", 12: "study abroad or in retreat",
};
const HOUSE_SOURCE: Record<number, string> = {
  1: "your own efforts and personality", 2: "family business, savings and speech", 3: "communication, sales and your own initiative", 4: "property, vehicles and home", 5: "intelligence, investments and creativity", 6: "service, jobs and lending", 7: "partners, clients and trade", 8: "inheritance, insurance and sudden gains", 9: "luck, teaching and long-distance work", 10: "career and status", 11: "networks and large organisations", 12: "foreign sources, travel and charity",
};
const CONSTITUTION: Record<string, string> = {
  Fire: "strong energy and digestion, but prone to heat, inflammation and burnout (Pitta)",
  Earth: "steady and enduring, but prone to sluggish digestion and stiffness (Vata-Kapha)",
  Air: "quick and lively, but prone to nervous strain, dryness and irregular sleep (Vata)",
  Water: "sensitive and nurturing, but prone to fluid retention, colds and emotional stress (Kapha)",
};
const BODY: Record<number, string> = { 6: "digestion and immunity", 8: "chronic and reproductive health", 12: "sleep and feet" };
const SOUL: Record<PlanetName, string> = {
  Sun: "ego and authority — learning humble leadership", Moon: "emotions — learning care and contentment", Mars: "anger and courage — learning disciplined action", Mercury: "speech and intellect — learning honest communication", Jupiter: "wisdom — learning to teach and give", Venus: "desire — learning pure love", Saturn: "hardship — learning patience and service", Rahu: "ambition", Ketu: "detachment",
};
