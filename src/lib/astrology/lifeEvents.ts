import { SIGN_LORDS, type PlanetName } from "./constants";
import { getAspectedHouses } from "./aspects";
import { siderealLongitude } from "./ephemeris";
import { getDignity } from "./dignity";
import { analyzeYogas } from "./yogaAnalysis";
import { analyzeBhavaStrength } from "./bhavaStrength";
import { kpAnalysis } from "./kp";
import { yoginiDasha } from "./yoginiDasha";
import { charaDasha, charaKarakas, rashiDrishti, type KarakaName } from "./charaDasha";
import { childPeriods, type DashaLord } from "./dashaTree";
import type { KundaliChart } from "./types";

/**
 * The event engine behind the life timeline. A life event is judged likely
 * when independent techniques agree on it, so each candidate event in each
 * Antardasha is scored on seven layers, each reported as evidence:
 *  1. Dasha — do the Mahadasha and Antardasha lords signify the event's
 *     houses (through their star lord, their own placement and lordship, and
 *     their aspects), and not the houses that deny it?
 *  2. Divisional chart — does the event's varga (D9, D10, D7, D4, D24, D30)
 *     link the running lords to its key house?
 *  3. Transit — month by month, do Jupiter and Saturn both touch the event
 *     house or its lord, counted from the Lagna and from the Moon?
 *  4. Ashtakavarga — are those transits through signs rich in bindus?
 *  5. Yogini dasha — does the running Yogini's planet signify the event?
 *  6. Chara dasha — does the running sign fall on the event house or hold
 *     the event's Jaimini karaka?
 *  7. KP — does the event's cusp sub lord promise it at all?
 * The age suits the event, the house's natal strength and any Raj or Dhan
 * yoga activated by the running lords adjust the result. Within the period,
 * the Pratyantardasha and transit months that agree best give the peak.
 */

export type EventTheme =
  | "education"
  | "career"
  | "jobChange"
  | "recognition"
  | "marriage"
  | "romance"
  | "children"
  | "property"
  | "relocation"
  | "travel"
  | "wealth"
  | "loss"
  | "health"
  | "spiritual";

export type EvidenceLayer = "Dasha" | "Chart" | "Transit" | "Ashtakavarga" | "Yogini" | "Chara" | "KP" | "Yoga" | "Age";

export interface Evidence {
  layer: EvidenceLayer;
  text: string;
  points: number;
}

export interface LifeEvent {
  kind: EventTheme;
  label: string;
  nature: "positive" | "caution";
  confidence: number;
  level: "Strong" | "Likely" | "Possible";
  evidence: Evidence[];
  peak: { start: Date; end: Date; why: string } | null;
  advice: string;
}

interface EventDef {
  label: string;
  nature: "positive" | "caution";
  houses: number[];
  negating: number[];
  karakas: PlanetName[];
  varga?: { key: string; house: number; label: string };
  ages: [number, number];
  peakAges: [number, number];
  chara?: KarakaName;
  kp?: string;
  yoga?: "raja" | "dhana";
  advice: string;
}

export const EVENT_DEFS: Record<EventTheme, EventDef> = {
  education: { label: "Studies, exams or a degree", nature: "positive", houses: [4, 5, 9, 11], negating: [3, 8, 12], karakas: ["Mercury", "Jupiter"], varga: { key: "D24", house: 4, label: "D24" }, ages: [4, 28], peakAges: [14, 24], chara: "Matrikaraka", kp: "Higher education", advice: "Good time for admissions, exams and courses." },
  career: { label: "Career start, new job or promotion", nature: "positive", houses: [10, 6, 2, 11], negating: [5, 8, 12], karakas: ["Sun", "Saturn", "Mercury"], varga: { key: "D10", house: 10, label: "D10" }, ages: [17, 68], peakAges: [21, 55], chara: "Amatyakaraka", kp: "Career and job", advice: "Apply, negotiate and take on responsibility — effort converts to position." },
  jobChange: { label: "Job change or new direction at work", nature: "positive", houses: [3, 5, 9, 12], negating: [6, 10, 11], karakas: ["Rahu", "Mercury"], varga: { key: "D10", house: 10, label: "D10" }, ages: [20, 65], peakAges: [24, 50], advice: "A move is likely; plan it rather than react to it." },
  recognition: { label: "Recognition, authority or a rise in status", nature: "positive", houses: [10, 11, 1, 9], negating: [8, 12], karakas: ["Sun", "Jupiter"], varga: { key: "D10", house: 10, label: "D10" }, ages: [22, 80], peakAges: [30, 65], chara: "Atmakaraka", yoga: "raja", advice: "Step forward — leadership roles and public visibility come easily." },
  marriage: { label: "Marriage or a committed relationship", nature: "positive", houses: [7, 2, 11], negating: [1, 6, 10], karakas: ["Venus", "Jupiter"], varga: { key: "D9", house: 7, label: "D9" }, ages: [20, 42], peakAges: [23, 33], chara: "Darakaraka", kp: "Marriage", advice: "Strong window for commitment, engagement or marriage." },
  romance: { label: "Romance and new relationships", nature: "positive", houses: [5, 11, 7], negating: [1, 6, 12], karakas: ["Venus", "Moon"], varga: { key: "D9", house: 5, label: "D9" }, ages: [16, 40], peakAges: [18, 30], chara: "Darakaraka", advice: "Social life and romance flourish; meet new people." },
  children: { label: "Children — birth or growth of the family", nature: "positive", houses: [5, 2, 11], negating: [1, 4, 10], karakas: ["Jupiter"], varga: { key: "D7", house: 5, label: "D7" }, ages: [22, 45], peakAges: [25, 38], chara: "Putrakaraka", kp: "Children", advice: "A favourable window for starting or growing a family." },
  property: { label: "Buying a home, land or vehicle", nature: "positive", houses: [4, 11, 12], negating: [3, 5, 10], karakas: ["Mars", "Venus", "Saturn"], varga: { key: "D4", house: 4, label: "D4" }, ages: [24, 80], peakAges: [28, 60], chara: "Matrikaraka", kp: "Owning property", advice: "Good for property purchase, construction or a vehicle." },
  relocation: { label: "Change of residence", nature: "positive", houses: [3, 12, 9], negating: [4, 11], karakas: ["Moon", "Rahu"], varga: { key: "D4", house: 4, label: "D4" }, ages: [16, 80], peakAges: [20, 55], advice: "A move of home or city is indicated." },
  travel: { label: "Foreign travel or settling abroad", nature: "positive", houses: [12, 9, 3, 7], negating: [2, 4, 11], karakas: ["Rahu", "Moon"], ages: [16, 80], peakAges: [20, 55], kp: "Foreign travel or settling abroad", advice: "Travel, study or work abroad is favoured." },
  wealth: { label: "Financial gains and savings", nature: "positive", houses: [2, 11, 5, 9], negating: [8, 12], karakas: ["Jupiter", "Venus"], ages: [20, 90], peakAges: [28, 65], kp: "Wealth", yoga: "dhana", advice: "Income rises — save and invest part of it." },
  loss: { label: "Financial strain or losses", nature: "caution", houses: [12, 8, 6], negating: [2, 11], karakas: ["Saturn", "Rahu"], ages: [20, 90], peakAges: [20, 90], advice: "Avoid speculation, lending and large new debts." },
  health: { label: "Health needs attention", nature: "caution", houses: [6, 8, 12, 1], negating: [5, 11], karakas: ["Saturn", "Mars", "Rahu"], varga: { key: "D30", house: 6, label: "D30" }, ages: [0, 90], peakAges: [0, 90], chara: "Gnatikaraka", advice: "Keep check-ups, rest and routine; don't ignore early symptoms." },
  spiritual: { label: "Spiritual growth and inner change", nature: "positive", houses: [9, 12, 5, 8], negating: [2, 11], karakas: ["Ketu", "Jupiter", "Saturn"], ages: [30, 90], peakAges: [40, 90], chara: "Atmakaraka", advice: "Pilgrimage, practice and study of the self are rewarding." },
};

const YEAR_MS = 365.25 * 86400000;
const MONTH_MS = YEAR_MS / 12;
const ord = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const dist = (a: number, b: number) => ((b - a + 12) % 12) + 1;
const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", year: "numeric" });

export interface EventEngine {
  eventsFor(md: PlanetName, ad: PlanetName, start: Date, end: Date, ageMid: number): LifeEvent[];
  transitAt(t: number): { jupiter: number; saturn: number; rahu: number };
}

export function createEventEngine(chart: KundaliChart, maxAge = 90): EventEngine {
  const P = new Map(chart.planets.map((p) => [p.planet, p]));
  const lagna = chart.ascendant.signIndex;
  const moonSign = P.get("Moon")!.signIndex;
  const birth = new Date(chart.utcDate).getTime();
  const lordOf = (h: number) => SIGN_LORDS[(lagna + h - 1) % 12] as PlanetName;
  const bhava = analyzeBhavaStrength(lagna, chart.planets, chart.shadbala);
  const yogas = analyzeYogas(chart, new Date(birth));
  const kp = kpAnalysis(chart, new Date(birth));
  const yogini = yoginiDasha(P.get("Moon")!.siderealLongitude, new Date(birth), maxAge + 5);
  const chara = charaDasha(chart, maxAge + 5);
  const karakas = charaKarakas(chart);

  // Monthly transit table for Jupiter, Saturn and Rahu over the whole life.
  const months = Math.ceil((maxAge + 2) * 12);
  const table = Array.from({ length: months }, (_, m) => {
    const d = new Date(birth + m * MONTH_MS);
    return { jupiter: Math.floor(siderealLongitude("Jupiter", d) / 30), saturn: Math.floor(siderealLongitude("Saturn", d) / 30), rahu: Math.floor(siderealLongitude("Rahu", d) / 30) };
  });
  const transitAt = (t: number) => table[Math.max(0, Math.min(months - 1, Math.round((t - birth) / MONTH_MS)))];

  /** How strongly a planet signifies each house: through its KP star lord (1.0), itself (0.8), or by aspect (0.4). */
  const sigCache = new Map<PlanetName, Map<number, { w: number; how: string }>>();
  function significance(pl: PlanetName) {
    if (sigCache.has(pl)) return sigCache.get(pl)!;
    const m = new Map<number, { w: number; how: string }>();
    const set = (h: number, w: number, how: string) => {
      if ((m.get(h)?.w ?? 0) < w) m.set(h, { w, how });
    };
    const kpp = kp.planets.find((x) => x.planet === pl)!;
    for (const h of kpp.levels.star) set(h, 1, `through its star lord ${kpp.starLord}, signifies your ${ord(h)}`);
    for (const h of kpp.levels.own) set(h, 0.8, `signifies your ${ord(h)} by placement or lordship`);
    const p = P.get(pl)!;
    set(p.house, 0.8, `sits in your ${ord(p.house)}`);
    for (const x of chart.houseLords.filter((l) => l.lord === pl)) set(x.house, 0.8, `rules your ${ord(x.house)}`);
    for (const d of getAspectedHouses(pl)) set(((p.house + d - 2) % 12) + 1, 0.4, `aspects your ${ord(((p.house + d - 2) % 12) + 1)}`);
    sigCache.set(pl, m);
    return m;
  }

  function lordScore(pl: PlanetName, def: EventDef): { score: number; texts: string[] } {
    const sig = significance(pl);
    let s = 0;
    const texts: string[] = [];
    def.houses.forEach((h, i) => {
      const x = sig.get(h);
      if (!x) return;
      s += x.w * (i === 0 ? 1.5 : 1);
      if (texts.length < 2) texts.push(x.how);
    });
    const neg = def.negating.filter((h) => (sig.get(h)?.w ?? 0) >= 0.8);
    s -= neg.length * 0.35;
    return { score: Math.max(0, Math.min(1, s / 3)), texts: neg.length ? [...texts, `but also signifies your ${neg.map(ord).join(" and ")}, which work against it`] : texts };
  }

  const kpVerdict = new Map(kp.promises.map((p) => [p.event, p]));
  const activeYogas = yogas.findings.filter((f) => f.strength !== "Weak" && (f.category === "raja" || f.category === "dhana" || f.category === "yogakaraka"));

  function eventsFor(md: PlanetName, ad: PlanetName, start: Date, end: Date, ageMid: number): LifeEvent[] {
    const out: LifeEvent[] = [];
    const s = start.getTime();
    const e = end.getTime();
    const mid = (s + e) / 2;
    for (const [kind, def] of Object.entries(EVENT_DEFS) as [EventTheme, EventDef][]) {
      if (ageMid < def.ages[0] || ageMid > def.ages[1]) continue;
      const evidence: Evidence[] = [];

      // 1. Dasha
      const a = lordScore(ad, def);
      const m = md === ad ? a : lordScore(md, def);
      const dasha = 40 * (md === ad ? a.score : 0.35 * m.score + 0.65 * a.score);
      if (a.score > 0) evidence.push({ layer: "Dasha", text: `Antardasha lord ${ad} ${a.texts.join("; ")}`, points: Math.round(40 * 0.65 * a.score) });
      if (md !== ad && m.score > 0) evidence.push({ layer: "Dasha", text: `Mahadasha lord ${md} ${m.texts.join("; ")}`, points: Math.round(40 * 0.35 * m.score) });
      if (dasha < 12) continue; // without the dasha, other layers can't make an event
      let score = dasha;
      if (def.karakas.includes(ad)) {
        score += 4;
        evidence.push({ layer: "Dasha", text: `${ad} is a natural significator of this event`, points: 4 });
      }

      // 2. Divisional chart
      if (def.varga) {
        const V = chart.divisionalCharts[def.varga.key as keyof typeof chart.divisionalCharts];
        if (V) {
          const keySign = (V.ascendant.signIndex + def.varga.house - 1) % 12;
          const keyLord = SIGN_LORDS[keySign] as PlanetName;
          for (const pl of md === ad ? [ad] : [ad, md]) {
            const vp = V.planets.find((x) => x.planet === pl);
            if (!vp) continue;
            const h = dist(V.ascendant.signIndex, vp.signIndex);
            const dig = getDignity(pl, vp.signIndex);
            if (h === def.varga.house || h === 1 || pl === keyLord) {
              const pts = pl === ad ? 10 : 6;
              score += pts;
              evidence.push({ layer: "Chart", text: `In the ${def.varga.label}, ${pl} ${pl === keyLord ? `rules the ${ord(def.varga.house)} house` : `sits in the ${ord(h)} house`}${dig === "Exalted" || dig === "Own Sign" ? `, ${dig === "Exalted" ? "exalted" : "in its own sign"}` : ""}`, points: pts });
              break;
            }
            if (dig === "Debilitated") {
              score -= 3;
              evidence.push({ layer: "Chart", text: `${pl} is debilitated in the ${def.varga.label}`, points: -3 });
            }
          }
        }
      }

      // 3 & 4. Transits month by month, with Ashtakavarga
      const target = (lagna + def.houses[0] - 1) % 12;
      const targetMoon = (moonSign + def.houses[0] - 1) % 12;
      const lordSign = P.get(lordOf(def.houses[0]))!.signIndex;
      const touches = (sign: number, planet: "Jupiter" | "Saturn", t: number) => sign === t || getAspectedHouses(planet).includes(dist(sign, t));
      let run = 0;
      let best = { len: 0, from: 0, to: 0 };
      let startIdx = 0;
      let doubleMonths = 0;
      let jupMonths = 0;
      let samples = 0;
      let bindus = 0;
      for (let t = s, i = 0; t < e; t += MONTH_MS, i++) {
        const tr = transitAt(t);
        samples++;
        // A true double transit needs both planets on the same point: the event house, or the sign holding its lord.
        const both =
          def.nature === "caution"
            ? tr.saturn === target || tr.rahu === target || (tr.saturn === moonSign && def.houses[0] !== 12)
            : (touches(tr.jupiter, "Jupiter", target) && touches(tr.saturn, "Saturn", target)) || (touches(tr.jupiter, "Jupiter", lordSign) && touches(tr.saturn, "Saturn", lordSign));
        if (touches(tr.jupiter, "Jupiter", target) || touches(tr.jupiter, "Jupiter", targetMoon)) jupMonths++;
        if (both) {
          doubleMonths++;
          bindus += chart.ashtakavarga.sarva[tr.jupiter];
          if (run === 0) startIdx = i;
          run++;
          if (run > best.len) best = { len: run, from: startIdx, to: i };
        } else run = 0;
      }
      if (doubleMonths > 0) {
        // Full marks only when the double transit covers most of the period.
        const pts = Math.round(6 + 14 * Math.min(1, doubleMonths / Math.max(4, samples * 0.6)));
        score += pts;
        evidence.push({
          layer: "Transit",
          text:
            def.nature === "caution"
              ? `Saturn or Rahu press on your ${ord(def.houses[0])} house or natal Moon for ${doubleMonths} month${doubleMonths > 1 ? "s" : ""}`
              : `Jupiter and Saturn both touch your ${ord(def.houses[0])} house or its lord for ${doubleMonths} month${doubleMonths > 1 ? "s" : ""} (double transit)`,
          points: pts,
        });
        const avg = bindus / doubleMonths;
        if (def.nature === "positive" && avg >= 28) {
          const bp = avg >= 31 ? 5 : 3;
          score += bp;
          evidence.push({ layer: "Ashtakavarga", text: `Jupiter transits a sign with ${Math.round(avg)} bindus, so it delivers well`, points: bp });
        } else if (def.nature === "positive" && avg < 25) {
          score -= 3;
          evidence.push({ layer: "Ashtakavarga", text: `Jupiter transits a weak sign (${Math.round(avg)} bindus), dampening results`, points: -3 });
        }
      } else if (def.nature === "positive" && jupMonths > samples / 2) {
        score += 4;
        evidence.push({ layer: "Transit", text: `Jupiter supports your ${ord(def.houses[0])} house through most of the period`, points: 4 });
      }

      // 5. Yogini dasha agreement
      const yp = yogini.find((y) => y.start.getTime() <= mid && mid < y.end.getTime());
      const ys = yp?.subPeriods.find((x) => x.start.getTime() <= mid && mid < x.end.getTime());
      const yl = [ys?.yogini.lord, yp?.yogini.lord].filter(Boolean) as PlanetName[];
      const yHit = yl.find((pl) => lordScore(pl, def).score >= 0.35);
      if (yHit) {
        score += 6;
        evidence.push({ layer: "Yogini", text: `Yogini dasha agrees: ${ys && ys.yogini.lord === yHit ? ys.yogini.name : yp!.yogini.name} (${yHit}) also signifies this event`, points: 6 });
      }

      // 6. Chara dasha agreement
      const cp = chara.find((c) => c.start.getTime() <= mid && mid < c.end.getTime());
      if (cp) {
        const cs = cp.subPeriods.find((x) => x.start.getTime() <= mid && mid < x.end.getTime());
        const signs = [cp.signIndex, cs?.signIndex].filter((x): x is number => x !== undefined);
        const k = def.chara ? karakas.find((x) => x.karaka === def.chara) : undefined;
        const onHouse = signs.find((sg) => dist(lagna, sg) === def.houses[0]);
        const withKaraka = k ? signs.find((sg) => sg === k.signIndex || rashiDrishti(k.signIndex).includes(sg)) : undefined;
        if (onHouse !== undefined || withKaraka !== undefined) {
          score += 6;
          evidence.push({ layer: "Chara", text: onHouse !== undefined ? `Chara dasha runs your ${ord(def.houses[0])} house sign` : `Chara dasha sign holds or aspects your ${k!.karaka} (${k!.planet})`, points: 6 });
        }
      }

      // Yogas activated by the running lords
      if (def.yoga) {
        const y = activeYogas.find((f) => (f.category === def.yoga || f.category === "yogakaraka") && f.planets.includes(ad) && (f.planets.includes(md) || f.planets.length === 1));
        if (y) {
          score += 8;
          evidence.push({ layer: "Yoga", text: `${y.name} is activated by the running lords`, points: 8 });
        }
      }

      // 7. KP promise, natal strength and age
      let mult = 1;
      if (def.kp) {
        const pr = kpVerdict.get(def.kp);
        if (pr) {
          const f = pr.verdict === "Promised" ? 1.05 : pr.verdict === "Promised with delays" ? 0.92 : 0.75;
          mult *= f;
          evidence.push({ layer: "KP", text: `KP: ${def.kp.toLowerCase()} is ${pr.verdict.toLowerCase()} (${ord(pr.cusp)} cusp sub lord ${pr.subLord})`, points: Math.round((f - 1) * 100) });
        }
      }
      const natal = bhava[def.houses[0] - 1].score;
      mult *= def.nature === "caution" ? 1.15 - 0.3 * (natal / 100) : 0.85 + 0.3 * (natal / 100);
      if (ageMid < def.peakAges[0] || ageMid > def.peakAges[1]) {
        mult *= 0.8;
        evidence.push({ layer: "Age", text: `Age ${Math.floor(ageMid)} is outside the usual window (${def.peakAges[0]}–${def.peakAges[1]}) for this event`, points: -20 });
      }
      const confidence = Math.max(0, Math.min(97, Math.round(score * mult)));

      // Peak: the Pratyantardasha that signifies the event most, overlapping the best transit run.
      const bestFrom = best.len ? s + best.from * MONTH_MS : s;
      const bestTo = best.len ? s + (best.to + 1) * MONTH_MS : e;
      const pds = childPeriods({ lord: ad as DashaLord, start: new Date(s), end: new Date(e), chain: [md as DashaLord, ad as DashaLord] });
      const scored = pds
        .map((pd) => ({ pd, sc: lordScore(pd.lord as PlanetName, def).score + (pd.start.getTime() < bestTo && pd.end.getTime() > bestFrom ? 0.5 : 0) }))
        .sort((x, y) => y.sc - x.sc);
      const top = scored[0];
      const peak =
        top && top.sc > 0.3
          ? {
              start: top.pd.start,
              end: top.pd.end,
              why: `${top.pd.lord} Pratyantardasha${top.pd.start.getTime() < bestTo && top.pd.end.getTime() > bestFrom && best.len ? ", during the best transit months" : ""}`,
            }
          : best.len
            ? { start: new Date(bestFrom), end: new Date(bestTo), why: "the months with the strongest transits" }
            : null;

      out.push({
        kind,
        label: def.label,
        nature: def.nature,
        confidence,
        level: confidence >= 75 ? "Strong" : confidence >= 62 ? "Likely" : "Possible",
        evidence: evidence.sort((x, y) => y.points - x.points),
        peak,
        advice: def.advice,
      });
    }
    return out.sort((x, y) => y.confidence - x.confidence);
  }

  return { eventsFor, transitAt };
}

/** Events clear enough to show in a period: 50+ for opportunities, 58+ for cautions. */
export const isShown = (ev: LifeEvent) => ev.confidence >= (ev.nature === "caution" ? 58 : 50);

export const formatWindow = (s: Date, e: Date) => `${fmt(s)} – ${fmt(e)}`;
