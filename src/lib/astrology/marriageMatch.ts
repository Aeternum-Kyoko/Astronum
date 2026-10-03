import { SIGN_LORDS, type PlanetName } from "./constants";
import { ENEMIES, FRIENDS } from "./dignity";
import { planetDiagnosis } from "./planetDiagnosis";
import { readHouses, readPlanets, summarise, type VargaContext } from "./vargaReading";
import type { KundaliChart } from "./types";

/**
 * Marriage matching beyond the Moon-based Guna Milan. Ashtakoota compares
 * only the two Moons; a traditional astrologer then reads both full charts:
 *  1. Each person's own promise of marriage — the 7th house and its lord in
 *     the Rasi, the spouse significator (Venus in a man's chart, Jupiter in a
 *     woman's) and the Navamsa (D9) as a whole.
 *  2. How the two charts touch — Lagna lords' friendship, whether each fits
 *     the other's 7th house, the two Navamsa Lagnas, Venus–Mars attraction,
 *     and the partner's Jupiter, Saturn and nodes on one's Moon, Lagna or Venus.
 *  3. Timing — the next years of both Vimshottari dashas side by side: when
 *     both run difficult periods together, when both change Mahadasha close
 *     together (dasha sandhi), and the windows that favour the wedding.
 */

export type Tone = "good" | "neutral" | "caution";

export interface Finding {
  title: string;
  tone: Tone;
  text: string;
  points: number;
}

export interface Promise {
  name: string;
  verdict: "Strong" | "Balanced" | "Weak";
  score: number;
  findings: Finding[];
}

export interface DashaWindow {
  start: string;
  end: string;
  text: string;
  tone: Tone;
}

export interface DeepMatch {
  boy: Promise;
  girl: Promise;
  links: Finding[];
  timing: { caution: DashaWindow[]; favourable: DashaWindow[]; sandhi: DashaWindow[] };
  score: number;
  verdict: "Very supportive" | "Supportive" | "Mixed" | "Needs care";
  summary: string;
}

const DIGNITY_PHRASE: Record<string, string> = {
  Exalted: "exalted",
  Moolatrikona: "in its moolatrikona sign",
  "Own Sign": "in its own sign",
  "Friend's Sign": "in a friend's sign",
  "Neutral Sign": "in a neutral sign",
  "Enemy's Sign": "in an enemy's sign",
  Debilitated: "debilitated",
};
const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const houseFrom = (sign: number, from: number) => ((sign - from + 12) % 12) + 1;
const iso = (d: Date | string) => new Date(d).toISOString().slice(0, 10);
const fmt = (d: Date | string) => new Date(d).toLocaleDateString("en-GB", { month: "short", year: "numeric" });

function d1(chart: KundaliChart): VargaContext {
  return { varga: "D1", ascendantSignIndex: chart.ascendant.signIndex, planets: chart.planets };
}
function d9(chart: KundaliChart): VargaContext {
  const v = chart.divisionalCharts.D9;
  return {
    varga: "D9",
    ascendantSignIndex: v.ascendant.signIndex,
    planets: v.planets,
    natalSigns: Object.fromEntries(chart.planets.map((p) => [p.planet, p.signIndex])),
    natalLords: chart.houseLords,
  };
}

/** One person's own promise of marriage. */
export function marriagePromise(chart: KundaliChart, role: "boy" | "girl"): Promise {
  const findings: Finding[] = [];
  const toneOf = (v: string): Tone => (v === "Strong" ? "good" : v === "Weak" ? "caution" : "neutral");
  const pts = (v: string) => (v === "Strong" ? 2 : v === "Weak" ? -2 : 0);

  const seventh = readHouses(d1(chart))[6];
  findings.push({ title: `7th house (${seventh.sign})`, tone: toneOf(seventh.verdict), points: pts(seventh.verdict), text: `${seventh.verdict} — lord ${seventh.lord} in the ${ordinal(seventh.lordHouse)}${seventh.occupants.length ? `, with ${seventh.occupants.join(", ")} in it` : ""}.` });

  const d1Planets = new Map(readPlanets(d1(chart)).map((p) => [p.planet, p]));
  const d9Planets = new Map(readPlanets(d9(chart)).map((p) => [p.planet, p]));
  const lord = seventh.lord;
  const l9 = d9Planets.get(lord)!;
  findings.push({
    title: `7th lord ${lord} in the Navamsa`,
    tone: toneOf(l9.verdict),
    points: pts(l9.verdict),
    text: `${lord} is ${l9.dignity ? DIGNITY_PHRASE[l9.dignity] : "placed"} in the D9's ${ordinal(l9.house)} house — ${l9.verdict === "Strong" ? "the marriage promise holds up in the Navamsa" : l9.verdict === "Weak" ? "the promise needs support; the Navamsa shows strain" : "a workable promise"}.`,
  });

  const karaka: PlanetName = role === "boy" ? "Venus" : "Jupiter";
  const k1 = d1Planets.get(karaka)!;
  const k9 = d9Planets.get(karaka)!;
  const kVerdict = k1.score + k9.score >= 120 ? "Strong" : k1.score + k9.score < 85 ? "Weak" : "Balanced";
  findings.push({
    title: `${karaka}, significator of the ${role === "boy" ? "wife" : "husband"}`,
    tone: toneOf(kVerdict),
    points: pts(kVerdict) * 1.5,
    text: `${karaka} is ${k1.verdict.toLowerCase()} in the Rasi (${ordinal(k1.house)} house${k1.dignity ? `, ${DIGNITY_PHRASE[k1.dignity]}` : ""}) and ${k9.verdict.toLowerCase()} in the Navamsa${k9.vargottama ? " — and vargottama" : ""}.`,
  });
  if (role === "girl") {
    const v9 = d9Planets.get("Venus")!;
    findings.push({ title: "Venus, love and harmony", tone: toneOf(v9.verdict), points: pts(v9.verdict) * 0.5, text: `Venus is ${v9.verdict.toLowerCase()} in the Navamsa (${ordinal(v9.house)} house).` });
  }

  const nav = summarise(d9(chart));
  findings.push({ title: "The Navamsa as a whole", tone: toneOf(nav.verdict), points: pts(nav.verdict) * 1.5, text: nav.headline });

  const raw = findings.reduce((a, f) => a + f.points, 0);
  const score = Math.max(0, Math.min(100, Math.round(50 + raw * 6)));
  return { name: chart.input.name, verdict: score >= 68 ? "Strong" : score >= 42 ? "Balanced" : "Weak", score, findings };
}

const relation = (a: PlanetName, b: PlanetName) => (a === b ? "same" : FRIENDS[a]?.includes(b) ? "friend" : ENEMIES[a]?.includes(b) ? "enemy" : "neutral");

/** How the two charts touch each other. */
export function chartLinks(a: KundaliChart, b: KundaliChart): Finding[] {
  const out: Finding[] = [];
  const P = (c: KundaliChart, p: PlanetName) => c.planets.find((x) => x.planet === p)!;
  const nameA = a.input.name || "First person";
  const nameB = b.input.name || "Second person";

  // Lagna lords
  const la = SIGN_LORDS[a.ascendant.signIndex] as PlanetName;
  const lb = SIGN_LORDS[b.ascendant.signIndex] as PlanetName;
  const ra = relation(la, lb);
  const rb = relation(lb, la);
  const mutual = ra === "same" || (ra === "friend" && rb === "friend") ? "good" : ra === "enemy" && rb === "enemy" ? "caution" : "neutral";
  out.push({
    title: "Lagna lords",
    tone: mutual,
    points: mutual === "good" ? 3 : mutual === "caution" ? -3 : 0,
    text: `${nameA}'s Lagna lord ${la} and ${nameB}'s ${lb} are ${ra === "same" ? "the same planet — similar temperaments" : mutual === "good" ? "mutual friends — natural ease with each other's nature" : mutual === "caution" ? "mutual enemies — different natures that need conscious adjustment" : "neutral or one-sided friends — workable with understanding"}.`,
  });

  // Each fits the other's 7th
  const fits = (x: KundaliChart, y: KundaliChart) => {
    const seventhFromLagna = (x.ascendant.signIndex + 6) % 12;
    const seventhFromMoon = (P(x, "Moon").signIndex + 6) % 12;
    const ys = [y.ascendant.signIndex, P(y, "Moon").signIndex];
    return ys.some((s) => s === seventhFromLagna || s === seventhFromMoon);
  };
  const ab = fits(a, b);
  const ba = fits(b, a);
  if (ab || ba)
    out.push({
      title: "Fits the 7th house",
      tone: "good",
      points: ab && ba ? 4 : 2,
      text: `${ab && ba ? "Each partner's" : ab ? `${nameB}'s` : `${nameA}'s`} Lagna or Moon falls in the other's 7th sign — a classic sign of a partner who matches what the chart seeks in marriage.`,
    });

  // Navamsa Lagnas
  const n = houseFrom(b.divisionalCharts.D9.ascendant.signIndex, a.divisionalCharts.D9.ascendant.signIndex);
  const navTone: Tone = [1, 5, 9, 7].includes(n) ? "good" : [6, 8].includes(n) ? "caution" : "neutral";
  out.push({
    title: "Navamsa Lagnas",
    tone: navTone,
    points: navTone === "good" ? 3 : navTone === "caution" ? -3 : 0,
    text: `The Navamsa Lagnas (${a.divisionalCharts.D9.ascendant.sign} and ${b.divisionalCharts.D9.ascendant.sign}) are ${ordinal(n)}/${ordinal(((12 - n + 1) % 12) + 1)} from each other — ${
      navTone === "good" ? (n === 7 ? "facing each other, a strong partnership axis" : n === 1 ? "the same sign, shared inner values" : "in trine, harmonious inner natures") : navTone === "caution" ? "the 6/8 relationship, which brings friction in the married life" : "neither especially harmonious nor difficult"
    }.`,
  });

  // Venus–Mars attraction
  const attract = (x: KundaliChart, y: KundaliChart) => {
    const d = houseFrom(P(y, "Mars").signIndex, P(x, "Venus").signIndex);
    return d === 1 || d === 7;
  };
  if (attract(a, b) || attract(b, a))
    out.push({ title: "Venus–Mars", tone: "good", points: 2, text: `${attract(a, b) ? `${nameA}'s Venus meets ${nameB}'s Mars` : `${nameB}'s Venus meets ${nameA}'s Mars`} (same sign or opposite) — strong physical and romantic attraction.` });

  // Overlays: one partner's planet on the other's Moon, Lagna or Venus sign.
  const overlay = (x: KundaliChart, y: KundaliChart, nx: string, ny: string) => {
    const points: [string, number][] = [
      ["Moon", P(x, "Moon").signIndex],
      ["Lagna", x.ascendant.signIndex],
      ["Venus", P(x, "Venus").signIndex],
    ];
    const jup = P(y, "Jupiter").signIndex;
    const hitJ = points.filter(([, s]) => s === jup || [5, 9].includes(houseFrom(s, jup)));
    if (hitJ.length) out.push({ title: `${ny}'s Jupiter`, tone: "good", points: 2, text: `${ny}'s Jupiter falls on or trines ${nx}'s ${hitJ.map(([k]) => k).join(" and ")} — a protective, blessing influence.` });
    const sat = P(y, "Saturn").signIndex;
    const hitS = points.filter(([, s]) => s === sat);
    if (hitS.length) out.push({ title: `${ny}'s Saturn`, tone: "caution", points: -2, text: `${ny}'s Saturn sits on ${nx}'s ${hitS.map(([k]) => k).join(" and ")} — seriousness and commitment, but also heaviness and delays to handle with patience.` });
    const nodes = (["Rahu", "Ketu"] as PlanetName[]).flatMap((node) => points.filter(([, s]) => s === P(y, node).signIndex).map(([k]) => `${node} on ${k}`));
    if (nodes.length) out.push({ title: `${ny}'s Rahu/Ketu`, tone: "caution", points: -1.5, text: `${ny}'s ${nodes.join(", ")} of ${nx} — an intense, karmic pull that can bring confusion; keep communication clear.` });
  };
  overlay(a, b, nameA, nameB);
  overlay(b, a, nameB, nameA);
  return out;
}

interface Period {
  lord: PlanetName;
  md: PlanetName;
  start: Date;
  end: Date;
  tone: Tone;
  why: string;
}

/** Each Antardasha from now on, judged for married life. */
function periods(chart: KundaliChart, from: Date, to: Date): Period[] {
  const asc = chart.ascendant.signIndex;
  const ruled = (p: PlanetName) => Array.from({ length: 12 }, (_, i) => i + 1).filter((h) => SIGN_LORDS[(asc + h - 1) % 12] === p);
  const diag = new Map(planetDiagnosis(chart).map((d) => [d.planet, d]));
  const seventhLord = SIGN_LORDS[(asc + 6) % 12] as PlanetName;
  const out: Period[] = [];
  for (const md of chart.dashas)
    for (const ad of md.subPeriods ?? []) {
      const start = new Date(ad.start);
      const end = new Date(ad.end);
      if (end <= from || start >= to) continue;
      const lord = ad.lord as PlanetName;
      const houses = ruled(lord);
      const grade = diag.get(lord)!.grade;
      const marriageLord = lord === seventhLord || lord === "Venus" || lord === "Jupiter" || houses.includes(7) || houses.includes(2) || houses.includes(11);
      const dusthana = houses.length > 0 && houses.every((h) => [6, 8, 12].includes(h));
      const weak = grade === "Weak" || grade === "Very weak";
      const tone: Tone = (dusthana || (["Rahu", "Ketu", "Saturn"].includes(lord) && weak)) && !marriageLord ? "caution" : marriageLord && !weak ? "good" : "neutral";
      const why = tone === "good" ? `${lord} ${lord === seventhLord ? "rules the 7th house" : houses.includes(2) || houses.includes(11) ? `rules the ${houses.filter((h) => [2, 7, 11].includes(h)).map(ordinal).join(" and ")}` : "signifies marriage"}` : tone === "caution" ? `${lord} ${dusthana ? `rules only the ${houses.map(ordinal).join(" and ")} (difficult houses)` : `is ${grade.toLowerCase()} in the chart`}` : `${lord} period`;
      out.push({ lord, md: md.lord as PlanetName, start, end, tone, why });
    }
  return out;
}

export function dashaTiming(a: KundaliChart, b: KundaliChart, now = new Date(), years = 12): DeepMatch["timing"] {
  const to = new Date(now.getTime() + years * 365.25 * 86400_000);
  const pa = periods(a, now, to);
  const pb = periods(b, now, to);
  const nameA = a.input.name || "First person";
  const nameB = b.input.name || "Second person";
  const caution: DashaWindow[] = [];
  const favourable: DashaWindow[] = [];
  for (const x of pa)
    for (const y of pb) {
      const start = new Date(Math.max(x.start.getTime(), y.start.getTime(), now.getTime()));
      const end = new Date(Math.min(x.end.getTime(), y.end.getTime()));
      if (end.getTime() - start.getTime() < 60 * 86400_000) continue;
      if (x.tone === "caution" && y.tone === "caution")
        caution.push({ start: iso(start), end: iso(end), tone: "caution", text: `${fmt(start)} – ${fmt(end)}: ${nameA} runs ${x.md}–${x.lord} (${x.why}) while ${nameB} runs ${y.md}–${y.lord} (${y.why}) — both under strain at once; avoid big joint decisions and be patient with each other.` });
      else if ((x.tone === "good" && y.tone !== "caution") || (y.tone === "good" && x.tone !== "caution"))
        if (x.tone === "good" && y.tone === "good")
          favourable.push({ start: iso(start), end: iso(end), tone: "good", text: `${fmt(start)} – ${fmt(end)}: ${nameA}'s ${x.md}–${x.lord} (${x.why}) and ${nameB}'s ${y.md}–${y.lord} (${y.why}) — both charts support marriage.` });
    }
  // Dasha sandhi: both change Mahadasha within a year of each other.
  const sandhi: DashaWindow[] = [];
  const mdChanges = (c: KundaliChart) => c.dashas.map((m) => new Date(m.start)).filter((d) => d > now && d < to);
  for (const ca of mdChanges(a))
    for (const cb of mdChanges(b))
      if (Math.abs(ca.getTime() - cb.getTime()) < 365.25 * 86400_000)
        sandhi.push({ start: iso(ca < cb ? ca : cb), end: iso(ca < cb ? cb : ca), tone: "caution", text: `Both change Mahadasha within a year (${fmt(ca)} and ${fmt(cb)}) — a dasha sandhi, when life shifts for both at once; keep the relationship steady through it.` });
  return { caution: caution.slice(0, 6), favourable: favourable.slice(0, 6), sandhi };
}

export function deepMatch(boy: KundaliChart, girl: KundaliChart, now = new Date()): DeepMatch {
  const pb = marriagePromise(boy, "boy");
  const pg = marriagePromise(girl, "girl");
  const links = chartLinks(boy, girl);
  const timing = dashaTiming(boy, girl, now);
  const linkPts = links.reduce((a, f) => a + f.points, 0);
  const score = Math.max(0, Math.min(100, Math.round(pb.score * 0.35 + pg.score * 0.35 + 15 + linkPts * 3 - timing.caution.length * 3)));
  const verdict = score >= 75 ? "Very supportive" : score >= 60 ? "Supportive" : score >= 45 ? "Mixed" : "Needs care";
  const good = links.filter((l) => l.tone === "good").map((l) => l.title);
  const hard = links.filter((l) => l.tone === "caution").map((l) => l.title);
  const summary = `${verdict}. ${pb.name || "The first person"}'s marriage promise is ${pb.verdict.toLowerCase()} and ${pg.name || "the second person"}'s is ${pg.verdict.toLowerCase()}. ${good.length ? `The charts connect well through ${good.join(", ")}.` : ""} ${hard.length ? `Points to handle with care: ${hard.join(", ")}.` : ""} ${
    timing.favourable[0] ? `A good window for the wedding: ${timing.favourable[0].text.split(":")[0]}.` : ""
  }`.replace(/\s+/g, " ").trim();
  return { boy: pb, girl: pg, links, timing, score, verdict, summary };
}


