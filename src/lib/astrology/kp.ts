import { DateTime } from "luxon";
import { DASHA_SEQUENCE, DASHA_YEARS, SIGNS, SIGN_LORDS, type PlanetName } from "./constants";
import { computeAscendantAndMidheaven, meridianAndObliquity, siderealLongitude } from "./ephemeris";
import { lahiriAyanamsa } from "./ayanamsa";
import { normalizeDegrees } from "./math";
import type { KundaliChart } from "./types";

/**
 * Krishnamurti Paddhati (KP). Houses are Placidus cusps; every point is
 * described by its sign lord, star (nakshatra) lord, sub lord and sub-sub
 * lord — the zodiac's 27 stars each cut into nine unequal subs in Vimshottari
 * proportion. A planet signifies houses first through its star lord (where
 * that lord sits and what it rules), then by itself. A cusp's sub lord
 * decides whether that house's matter is promised at all.
 */

const NAK = 360 / 27;
/** KP (Krishnamurti) ayanamsa runs about 6 arc-minutes behind Lahiri. */
export const kpAyanamsa = (date: Date) => lahiriAyanamsa(date) - 0.1;

type Lord = (typeof DASHA_SEQUENCE)[number];

export interface KpLords {
  longitude: number;
  sign: string;
  signLord: PlanetName;
  starLord: Lord;
  subLord: Lord;
  subSubLord: Lord;
}

/** Sign, star, sub and sub-sub lords of a sidereal longitude. */
export function kpLords(longitude: number): KpLords {
  const lon = normalizeDegrees(longitude);
  const nak = Math.floor(lon / NAK);
  const star = DASHA_SEQUENCE[nak % 9];
  const divide = (start: number, span: number, firstLord: Lord, at: number): { lord: Lord; start: number; span: number } => {
    let cursor = start;
    const first = DASHA_SEQUENCE.indexOf(firstLord);
    for (let i = 0; i < 9; i++) {
      const lord = DASHA_SEQUENCE[(first + i) % 9];
      const w = (span * DASHA_YEARS[lord]) / 120;
      if (at < cursor + w || i === 8) return { lord, start: cursor, span: w };
      cursor += w;
    }
    throw new Error("unreachable");
  };
  const sub = divide(nak * NAK, NAK, star, lon);
  const subSub = divide(sub.start, sub.span, sub.lord, lon);
  const signIndex = Math.floor(lon / 30);
  return { longitude: lon, sign: SIGNS[signIndex], signLord: SIGN_LORDS[signIndex] as PlanetName, starLord: star, subLord: sub.lord, subSubLord: subSub.lord };
}

/** Placidus house cusps (tropical degrees), cusp 1 to 12. */
export function placidusCusps(ramc: number, obliquity: number, latitude: number, asc: number, mc: number): number[] {
  const rad = Math.PI / 180;
  const eps = obliquity * rad;
  const phi = latitude * rad;
  const lonFromRa = (ra: number) => normalizeDegrees(Math.atan2(Math.sin(ra * rad), Math.cos(ra * rad) * Math.cos(eps)) / rad);
  const cusp = (fraction: number, nocturnal: boolean) => {
    let lon = lonFromRa(ramc + (nocturnal ? 180 - fraction * 90 : fraction * 90));
    for (let i = 0; i < 50; i++) {
      const dec = Math.asin(Math.sin(eps) * Math.sin(lon * rad));
      const x = Math.max(-1, Math.min(1, Math.tan(phi) * Math.tan(dec)));
      const ad = Math.asin(x) / rad;
      const ra = nocturnal ? ramc + 180 - fraction * (90 - ad) : ramc + fraction * (90 + ad);
      const next = lonFromRa(ra);
      if (Math.abs(next - lon) < 1e-7) break;
      lon = next;
    }
    return lon;
  };
  const c11 = cusp(1 / 3, false);
  const c12 = cusp(2 / 3, false);
  const c2 = cusp(2 / 3, true);
  const c3 = cusp(1 / 3, true);
  const first6 = [asc, c2, c3, normalizeDegrees(mc + 180), normalizeDegrees(c11 + 180), normalizeDegrees(c12 + 180)];
  return [...first6, ...first6.map((c) => normalizeDegrees(c + 180))].map((c, i) => (i === 9 ? mc : i === 10 ? c11 : i === 11 ? c12 : c));
}

export interface KpPlanet extends KpLords {
  planet: PlanetName;
  house: number;
  retrograde: boolean;
  /** Houses signified, strongest level first: star lord's occupation and ownership, then its own. */
  levels: { star: number[]; own: number[] };
  signifies: number[];
}

export interface KpCusp extends KpLords {
  house: number;
}

export interface KpPromise {
  event: string;
  cusp: number;
  subLord: Lord;
  favourable: number[];
  negating: number[];
  hits: number[];
  blocks: number[];
  verdict: "Promised" | "Promised with delays" | "Weak promise";
  reason: string;
}

export interface KpAnalysis {
  ayanamsa: number;
  cusps: KpCusp[];
  planets: KpPlanet[];
  houseSignificators: { house: number; a: PlanetName[]; b: PlanetName[]; c: PlanetName[]; d: PlanetName[] }[];
  promises: KpPromise[];
  rulingPlanets: { at: Date; list: { role: string; planet: PlanetName }[]; strongest: PlanetName[] };
}

const EVENTS: { event: string; cusp: number; favourable: number[]; negating: number[] }[] = [
  { event: "Marriage", cusp: 7, favourable: [2, 7, 11], negating: [1, 6, 10] },
  { event: "Career and job", cusp: 10, favourable: [2, 6, 10, 11], negating: [5, 8, 12] },
  { event: "Children", cusp: 5, favourable: [2, 5, 11], negating: [1, 4, 10] },
  { event: "Higher education", cusp: 9, favourable: [4, 9, 11], negating: [3, 8, 12] },
  { event: "Owning property", cusp: 4, favourable: [4, 11, 12], negating: [3, 5, 10] },
  { event: "Foreign travel or settling abroad", cusp: 12, favourable: [3, 9, 12], negating: [2, 4, 11] },
  { event: "Wealth", cusp: 2, favourable: [2, 6, 11], negating: [5, 8, 12] },
];

export function kpAnalysis(chart: KundaliChart, now = new Date()): KpAnalysis {
  const birth = new Date(chart.utcDate);
  const ay = kpAyanamsa(birth);
  const { ramc, obliquity } = meridianAndObliquity(birth, chart.input.longitude);
  const { ascendant, midheaven } = computeAscendantAndMidheaven(birth, chart.input.latitude, chart.input.longitude);
  const tropical = placidusCusps(ramc, obliquity, chart.input.latitude, ascendant, midheaven);
  const cuspLon = tropical.map((c) => normalizeDegrees(c - ay));
  const cusps: KpCusp[] = cuspLon.map((lon, i) => ({ house: i + 1, ...kpLords(lon) }));

  // A planet belongs to the house whose cusp it has passed, before the next cusp.
  const houseOf = (lon: number) => {
    for (let i = 0; i < 12; i++) {
      const a = cuspLon[i];
      const b = cuspLon[(i + 1) % 12];
      const span = (b - a + 360) % 360;
      if ((lon - a + 360) % 360 < span) return i + 1;
    }
    return 1;
  };
  const shift = lahiriAyanamsa(birth) - ay; // chart longitudes are Lahiri
  const raw = chart.planets.map((p) => ({ p, lon: normalizeDegrees(p.siderealLongitude + shift) }));
  const houseByPlanet = new Map(raw.map(({ p, lon }) => [p.planet, houseOf(lon)]));
  const owned = (pl: PlanetName) => cusps.filter((c) => c.signLord === pl).map((c) => c.house);

  const planets: KpPlanet[] = raw.map(({ p, lon }) => {
    const lords = kpLords(lon);
    const starLord = lords.starLord as PlanetName;
    let own = [houseByPlanet.get(p.planet)!, ...owned(p.planet)];
    let star = [houseByPlanet.get(starLord)!, ...owned(starLord)];
    // Nodes act for the lord of the sign they occupy.
    if (p.planet === "Rahu" || p.planet === "Ketu") own = [...own, houseByPlanet.get(lords.signLord)!, ...owned(lords.signLord)];
    if (starLord === "Rahu" || starLord === "Ketu") {
      const nodeSignLord = kpLords(raw.find((r) => r.p.planet === starLord)!.lon).signLord;
      star = [...star, houseByPlanet.get(nodeSignLord)!, ...owned(nodeSignLord)];
    }
    star = [...new Set(star)].sort((a, b) => a - b);
    own = [...new Set(own)].filter((h) => !star.includes(h)).sort((a, b) => a - b);
    return { planet: p.planet, house: houseByPlanet.get(p.planet)!, retrograde: p.retrograde, ...lords, levels: { star, own }, signifies: [...star, ...own] };
  });

  const inStarOf = (pl: PlanetName) => planets.filter((x) => x.starLord === pl).map((x) => x.planet);
  const houseSignificators = cusps.map((c) => {
    const occupants = planets.filter((x) => x.house === c.house).map((x) => x.planet);
    return {
      house: c.house,
      a: [...new Set(occupants.flatMap(inStarOf))],
      b: occupants,
      c: inStarOf(c.signLord),
      d: [c.signLord],
    };
  });

  const signifiesOf = (pl: PlanetName) => planets.find((x) => x.planet === pl)!.signifies;
  const promises: KpPromise[] = EVENTS.map((e) => {
    const csl = cusps[e.cusp - 1].subLord;
    const sig = signifiesOf(csl as PlanetName);
    const hits = e.favourable.filter((h) => sig.includes(h));
    const blocks = e.negating.filter((h) => sig.includes(h));
    // Signifying more giving houses than denying ones promises the event; a tie promises it with delays.
    const verdict: KpPromise["verdict"] = hits.length >= 2 && hits.length > blocks.length ? "Promised" : hits.length >= 1 && hits.length >= blocks.length ? "Promised with delays" : "Weak promise";
    return {
      ...e,
      subLord: csl,
      hits,
      blocks,
      verdict,
      reason: `The ${ord(e.cusp)} cusp's sub lord is ${csl}, which signifies houses ${sig.join(", ")}. ${hits.length ? `It connects with ${hits.join(", ")} (houses that give this result)` : "It does not connect with the houses that give this result"}${blocks.length ? ` but also with ${blocks.join(", ")} (houses that deny or delay it)` : ""}.`,
    };
  });

  // Ruling planets for this moment at the birth place (used in KP to confirm timing and answer questions).
  const kpNow = kpAyanamsa(now);
  const ascNow = normalizeDegrees(computeAscendantAndMidheaven(now, chart.input.latitude, chart.input.longitude).ascendant - kpNow);
  const moonNow = normalizeDegrees(siderealLongitude("Moon", now) + lahiriAyanamsa(now) - kpNow);
  const la = kpLords(ascNow);
  const mo = kpLords(moonNow);
  const weekday = DateTime.fromJSDate(now, { zone: chart.input.timezone }).weekday % 7;
  const dayLord = (["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as PlanetName[])[weekday];
  const list = [
    { role: "Day lord", planet: dayLord },
    { role: "Moon sign lord", planet: mo.signLord },
    { role: "Moon star lord", planet: mo.starLord as PlanetName },
    { role: "Moon sub lord", planet: mo.subLord as PlanetName },
    { role: "Lagna sign lord", planet: la.signLord },
    { role: "Lagna star lord", planet: la.starLord as PlanetName },
    { role: "Lagna sub lord", planet: la.subLord as PlanetName },
  ];
  const counts = new Map<PlanetName, number>();
  list.forEach((r) => counts.set(r.planet, (counts.get(r.planet) ?? 0) + 1));
  const strongest = [...counts.entries()].sort((a, b) => b[1] - a[1]).filter(([, n], _, arr) => n === arr[0][1]).map(([pl]) => pl);

  return { ayanamsa: ay, cusps, planets, houseSignificators, promises, rulingPlanets: { at: now, list, strongest } };
}

const ord = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
