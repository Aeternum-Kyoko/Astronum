import { SIGNS, SIGN_LORDS, type PlanetName } from "./constants";
import { getAspectedHouses } from "./aspects";
import { siderealLongitude } from "./ephemeris";
import { FRIENDS, ENEMIES } from "./dignity";
import { analyzeYogas } from "./yogaAnalysis";
import { saturnCycles } from "./transits";
import type { KundaliChart } from "./types";
import { createEventEngine, EVENT_DEFS, isShown, type EventTheme, type LifeEvent } from "./lifeEvents";

export type { EventTheme, LifeEvent };

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
  events: LifeEvent[];
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

export interface TimelineYear {
  age: number;
  start: Date;
  end: Date;
  dasha: string;
  rating: number;
  jupiter: { fromLagna: number; fromMoon: number };
  saturn: { fromLagna: number; fromMoon: number };
  rahuFromLagna: number;
  saturnPhase: string | null;
  text: string[];
  highlights: { kind: EventTheme; label: string; confidence: number; nature: "positive" | "caution" }[];
}

export interface KeyWindow {
  kind: EventTheme;
  label: string;
  nature: "positive" | "caution";
  confidence: number;
  ages: string;
  start: Date;
  end: Date;
  dasha: string;
  peak: { start: Date; end: Date; why: string } | null;
}

export interface LifeTimeline {
  mahas: TimelineMaha[];
  milestones: Milestone[];
  years: TimelineYear[];
  keyWindows: KeyWindow[];
}

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

  const engine = createEventEngine(chart, maxAge);
  const allCandidates: { md: PlanetName; ad: PlanetName; start: Date; end: Date; ageStart: number; ageEnd: number; ev: LifeEvent }[] = [];

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
      const candidates = engine.eventsFor(lord, adLord, s, e, age(mid));
      for (const ev of candidates) allCandidates.push({ md: lord, ad: adLord, start: s, end: e, ageStart: Math.max(0, age(s)), ageEnd: age(e), ev });
      const events = candidates.filter(isShown).slice(0, 4);
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
        themes: events.map((ev) => ({ kind: ev.kind, label: ev.label, score: ev.confidence, why: ev.evidence.slice(0, 4).map((x) => x.text) })),
        events,
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

  // Children usually follow marriage: soften child windows that come before the first likely marriage window.
  const firstMarriage = allCandidates.filter((c) => c.ev.kind === "marriage" && c.ev.confidence >= 55).sort((x, y) => x.start.getTime() - y.start.getTime())[0];
  if (firstMarriage) {
    for (const c of allCandidates) {
      if (c.ev.kind !== "children" || c.start.getTime() >= firstMarriage.start.getTime()) continue;
      c.ev.confidence = Math.round(c.ev.confidence * 0.8);
      c.ev.level = c.ev.confidence >= 75 ? "Strong" : c.ev.confidence >= 62 ? "Likely" : "Possible";
      c.ev.evidence.push({ layer: "Age", text: "Comes before your most likely marriage window, so it is weighted down", points: -20 });
    }
    for (const m of mahas)
      for (const a of m.antars) {
        a.events = allCandidates
          .filter((c) => c.start.getTime() === a.start.getTime() && isShown(c.ev))
          .map((c) => c.ev)
          .sort((x, y) => y.confidence - x.confidence)
          .slice(0, 4);
        a.themes = a.events.map((ev) => ({ kind: ev.kind, label: ev.label, score: ev.confidence, why: ev.evidence.slice(0, 4).map((x) => x.text) }));
      }
  }

  // Once-in-a-while events don't repeat every period: after a strong window, the same event within five years is weighted down.
  const RARE = new Set<EventTheme>(["property", "marriage", "romance", "relocation", "travel", "recognition", "children"]);
  const byKind = new Map<EventTheme, typeof allCandidates>();
  for (const c of allCandidates) if (RARE.has(c.ev.kind)) byKind.set(c.ev.kind, [...(byKind.get(c.ev.kind) ?? []), c]);
  for (const list of byKind.values()) {
    const ranked = [...list].sort((x, y) => y.ev.confidence - x.ev.confidence);
    const kept: typeof allCandidates = [];
    for (const c of ranked) {
      const near = kept.find((k) => Math.abs(k.start.getTime() - c.start.getTime()) < 5 * YEAR_MS);
      if (near && isShown(c.ev)) {
        c.ev.confidence = Math.round(c.ev.confidence * 0.7);
        c.ev.level = c.ev.confidence >= 75 ? "Strong" : c.ev.confidence >= 62 ? "Likely" : "Possible";
        c.ev.evidence.push({ layer: "Age", text: `A stronger window for this event comes within five years (age ${Math.floor(near.ageStart)}–${Math.ceil(near.ageEnd)})`, points: -18 });
      }
      if (isShown(c.ev)) kept.push(c);
    }
  }
  for (const m of mahas)
    for (const a of m.antars) {
      a.events = allCandidates
        .filter((c) => c.start.getTime() === a.start.getTime() && isShown(c.ev))
        .map((c) => c.ev)
        .sort((x, y) => y.confidence - x.confidence)
        .slice(0, 4);
      a.themes = a.events.map((ev) => ({ kind: ev.kind, label: ev.label, score: ev.confidence, why: ev.evidence.slice(0, 4).map((x) => x.text) }));
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

  // Year by year, birthday to birthday
  const years: TimelineYear[] = [];
  const antarsFlat = mahas.flatMap((m) => m.antars.map((a) => ({ m, a })));
  for (let y = 0; y < maxAge; y++) {
    const ys = birth + y * YEAR_MS;
    const ye = ys + YEAR_MS;
    const mid = ys + YEAR_MS / 2;
    const run = antarsFlat.find(({ a }) => a.start.getTime() <= mid && mid < a.end.getTime());
    const tr = engine.transitAt(mid);
    const jL = dist(lagna, tr.jupiter);
    const jM = dist(moon.signIndex, tr.jupiter);
    const sL = dist(lagna, tr.saturn);
    const sM = dist(moon.signIndex, tr.saturn);
    // Read the phase from Saturn's sign that year, so it always agrees with the transit text.
    const phase = sM === 12 ? "Sade Sati (rising phase)" : sM === 1 ? "Sade Sati (peak phase)" : sM === 2 ? "Sade Sati (setting phase)" : sM === 4 ? "Kantaka Shani" : sM === 8 ? "Ashtama Shani" : null;
    let r = 3;
    if (run) r += run.a.tone === "Supportive" ? 1 : run.a.tone === "Demanding" ? -1 : 0;
    r += [2, 5, 7, 9, 11].includes(jM) ? 0.5 : [6, 8, 12].includes(jM) ? -0.5 : 0;
    r += [3, 6, 11].includes(sM) ? 0.5 : [12, 1, 2, 8].includes(sM) ? -0.75 : sM === 4 ? -0.5 : 0;
    const highlights = antarsFlat
      .filter(({ a }) => a.start.getTime() < ye && a.end.getTime() > ys)
      .flatMap(({ a }) => a.events.filter((ev) => (ev.peak ? ev.peak.start.getTime() < ye && ev.peak.end.getTime() > ys : ev.level !== "Possible")))
      .sort((a, b) => b.confidence - a.confidence)
      .filter((ev, i, arr) => arr.findIndex((x) => x.kind === ev.kind) === i)
      .slice(0, 3)
      .map((ev) => ({ kind: ev.kind, label: ev.label, confidence: ev.confidence, nature: ev.nature }));
    r += highlights.filter((h) => h.nature === "positive").length * 0.25 - highlights.filter((h) => h.nature === "caution").length * 0.5;
    const text = [
      run ? `${run.m.lord} Mahadasha, ${run.a.lord} Antardasha (${run.a.tone.toLowerCase()}).` : "",
      `Jupiter moves through your ${ordinal(jL)} house from the Lagna and ${ordinal(jM)} from the Moon: ${JUP_FROM_MOON[jM]}.`,
      `Saturn is ${ordinal(sL)} from the Lagna and ${ordinal(sM)} from the Moon: ${SAT_FROM_MOON[sM]}.`,
      `Rahu in your ${ordinal(dist(lagna, tr.rahu))} stirs ${HOUSE_WORD[dist(lagna, tr.rahu)]}.`,
    ].filter(Boolean);
    years.push({
      age: y,
      start: new Date(ys),
      end: new Date(ye),
      dasha: run ? `${run.m.lord}–${run.a.lord}` : "",
      rating: Math.max(1, Math.min(5, Math.round(r))),
      jupiter: { fromLagna: jL, fromMoon: jM },
      saturn: { fromLagna: sL, fromMoon: sM },
      rahuFromLagna: dist(lagna, tr.rahu),
      saturnPhase: phase,
      text,
      highlights,
    });
  }

  // The single most likely window for each kind of event — always given, even when no window is strong.
  const keyWindows: KeyWindow[] = [];
  for (const kind of Object.keys(EVENT_DEFS) as EventTheme[]) {
    const def = EVENT_DEFS[kind];
    const pool = allCandidates.filter((c) => c.ev.kind === kind && (c.ev.nature === "positive" || isShown(c.ev)));
    const inAge = pool.filter((c) => (c.ageStart + c.ageEnd) / 2 >= def.peakAges[0] && (c.ageStart + c.ageEnd) / 2 <= def.peakAges[1]);
    const best = (inAge.length ? inAge : pool).sort((x, y) => y.ev.confidence - x.ev.confidence)[0];
    if (best)
      keyWindows.push({
        kind,
        label: best.ev.label,
        nature: best.ev.nature,
        confidence: best.ev.confidence,
        ages: `${Math.floor(best.ageStart)}–${Math.ceil(best.ageEnd)}`,
        start: best.start,
        end: best.end,
        dasha: `${best.md}–${best.ad}`,
        peak: best.ev.peak,
      });
  }
  keyWindows.sort((a, b) => a.start.getTime() - b.start.getTime());

  return { mahas, milestones, years, keyWindows };
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

const JUP_FROM_MOON: Record<number, string> = {
  1: "a fresh start, though the mind is restless",
  2: "money and family grow",
  3: "effort without much reward",
  4: "domestic worries and changes at home",
  5: "children, studies and romance flourish",
  6: "health and rivals need care",
  7: "partnerships and marriage are favoured",
  8: "obstacles and delays — be patient",
  9: "luck, blessings and long journeys",
  10: "career pressure and change",
  11: "gains and fulfilled wishes",
  12: "expenses, travel and spiritual pull",
};
const SAT_FROM_MOON: Record<number, string> = {
  1: "Sade Sati at its peak — pressure on health and mind",
  2: "Sade Sati's last phase — family and money feel the strain",
  3: "courage and success through effort",
  4: "Kantaka Shani — home and peace of mind disturbed",
  5: "worries about children or studies",
  6: "victory over rivals; good for work",
  7: "strain in partnerships",
  8: "Ashtama Shani — obstacles; look after health",
  9: "slow luck and hard lessons",
  10: "heavy responsibility at work",
  11: "steady gains",
  12: "Sade Sati begins — expenses, sleep and isolation",
};

const RETURN_TEXT: Record<"Jupiter" | "Saturn" | "Rahu", (n: number) => string> = {
  Jupiter: (n) => `Jupiter returns to its birth sign (about every 12 years): a fresh cycle of growth, learning and opportunity${n === 1 ? " — often schooling milestones" : ""}.`,
  Saturn: (n) => (n === 1 ? "The first Saturn return (around 29–30): the real start of adult responsibility — career, marriage and life structure are tested and set." : n === 2 ? "The second Saturn return (around 58–60): taking stock, handing over and choosing what the later years are for." : "A further Saturn return: reviewing and simplifying life."),
  Rahu: () => "The nodes return to their birth positions (about every 18½ years): a turning point that often brings new ambitions or a change of direction.",
};
