import { SIGN_LORDS, type PlanetName } from "./constants";
import { getDignity } from "./dignity";
import { getAspectedHouses } from "./aspects";
import { isCombust } from "./birthDetails";
import { HOUSE_SIGNIFICATION } from "./content";
import type { KundaliChart, PlanetPlacement } from "./types";
import { HOUSE_SIGNIFICATION_HI } from "./content.hi";
import type { Locale } from "../i18n/locale";
import { pick } from "../i18n/ui";
import { term } from "../i18n/terms";
import { ordHi } from "../i18n/hiGrammar";

/**
 * Parashari yoga analysis driven by house lordship, not fixed patterns:
 *  - Yogakaraka: the one planet that rules both a kendra and a trikona for the Lagna;
 *  - Raj Yogas: every link between a kendra lord and a trikona lord;
 *  - Dhan Yogas: every link between the wealth lords (2nd, 11th) and the lords of 1, 5, 9;
 *  - Arisht Yogas: the classical afflictions, each checked for its cancellation.
 * Each finding names the planets and houses, how the link is formed, why it
 * is strong or weak, and the dasha periods that switch it on.
 */

export type YogaCategory = "yogakaraka" | "raja" | "dhana" | "arishta";
export type YogaStrength = "Strong" | "Moderate" | "Weak" | "Mitigated";

export interface YogaActivation {
  label: string;
  start: Date;
  end: Date;
  /** The sub-period within it when every planet of the yoga is running. */
  peak?: { label: string; start: Date; end: Date };
}

export interface YogaFinding {
  id: string;
  category: YogaCategory;
  name: string;
  strength: YogaStrength;
  planets: PlanetName[];
  houses: number[];
  /** How the combination is formed, in one sentence. */
  formation: string;
  /** What raises or lowers its strength (or, for arishta, what softens it). */
  reasons: string[];
  effect: string;
  activation: YogaActivation[];
}

export interface YogaAnalysis {
  lagnaSign: string;
  yogakaraka: PlanetName | null;
  functional: { benefics: PlanetName[]; malefics: PlanetName[]; neutral: PlanetName[] };
  findings: YogaFinding[];
}

const KENDRA = [1, 4, 7, 10];
const TRIKONA = [1, 5, 9];
const DUSTHANA = [6, 8, 12];
const MALEFICS = new Set<PlanetName>(["Sun", "Mars", "Saturn", "Rahu", "Ketu"]);
const CLASSICAL: PlanetName[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

const ordinalEn = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const topicEn = (h: number) => HOUSE_SIGNIFICATION[h].split(",").slice(0, 2).join(" and").replace(/ and and/, " and");
const topicHi = (h: number) => HOUSE_SIGNIFICATION_HI[h].split(",").slice(0, 2).join(" और");
const dist = (from: number, to: number) => ((to - from + 12) % 12) + 1;

type Link = { kind: "exchange" | "conjunction" | "mutual aspect" | "aspect" | "placement"; weight: number; text: string };

export function analyzeYogas(chart: KundaliChart, now = new Date(), locale: Locale = "en"): YogaAnalysis {
  const hi = locale === "hi";
  const L = pick(locale);
  const n = (x: string) => term(locale, x);
  /** "10th" / "दसवें" */
  const ordinal = (h: number) => (hi ? ordHi(h) : ordinalEn(h));
  const topic = (h: number) => (hi ? topicHi(h) : topicEn(h));
  const list = (hs: number[]) => hs.map(ordinal).join(hi ? " और " : " and ");
  const P = new Map(chart.planets.map((p) => [p.planet, p]));
  const sun = P.get("Sun")!;
  const moon = P.get("Moon")!;
  const lagna = chart.ascendant.signIndex;
  const lordOf = (h: number) => SIGN_LORDS[(lagna + h - 1) % 12] as PlanetName;
  const housesRuled = (pl: PlanetName) => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((h) => lordOf(h) === pl);
  const aspects = (a: PlanetPlacement, b: PlanetPlacement) => getAspectedHouses(a.planet).includes(dist(a.signIndex, b.signIndex));
  const jupiterSees = (sign: number) => {
    const j = P.get("Jupiter")!;
    return [1, 5, 7, 9].includes(dist(j.signIndex, sign));
  };

  /** Strength points for one planet and the reasons behind them. */
  function condition(pl: PlanetName): { score: number; notes: string[] } {
    const p = P.get(pl)!;
    const notes: string[] = [];
    let score = 0;
    const dig = getDignity(pl, p.signIndex, p.degreeInSign);
    if (dig === "Exalted" || dig === "Moolatrikona" || dig === "Own Sign") {
      score += 2;
      notes.push(L(`${pl} is ${dig === "Own Sign" ? "in its own sign" : dig.toLowerCase()} in ${p.sign} — strong`, `${n(pl)} ${n(p.sign)} में ${dig === "Own Sign" ? "स्वराशि में" : n(dig)} हैं — बलवान`));
    } else if (dig === "Friend's Sign") {
      score += 1;
      notes.push(L(`${pl} is in a friend's sign`, `${n(pl)} मित्र राशि में हैं`));
    } else if (dig === "Enemy's Sign") {
      score -= 1;
      notes.push(L(`${pl} is in an enemy's sign`, `${n(pl)} शत्रु राशि में हैं`));
    } else if (dig === "Debilitated") {
      score -= 2;
      notes.push(L(`${pl} is debilitated in ${p.sign} — weak`, `${n(pl)} ${n(p.sign)} में नीच के हैं — कमज़ोर`));
    }
    if (DUSTHANA.includes(p.house)) {
      score -= 2;
      notes.push(L(`${pl} sits in the ${ordinal(p.house)}, a dusthana house`, `${n(pl)} ${ordinal(p.house)} भाव में हैं, जो दुःस्थान है`));
    } else if (KENDRA.includes(p.house) || TRIKONA.includes(p.house)) {
      score += 1;
      notes.push(L(`${pl} sits in the ${ordinal(p.house)}, a ${KENDRA.includes(p.house) ? "kendra" : "trikona"}`, `${n(pl)} ${ordinal(p.house)} भाव में हैं, जो ${KENDRA.includes(p.house) ? "केंद्र" : "त्रिकोण"} है`));
    }
    if (pl !== "Sun" && isCombust(p, sun)) {
      score -= 1;
      notes.push(L(`${pl} is combust, too close to the Sun`, `${n(pl)} अस्त हैं, सूर्य के बहुत निकट`));
    }
    return { score, notes };
  }

  function links(a: PlanetName, b: PlanetName, targetHousesOfB: number[], targetHousesOfA: number[]): Link[] {
    const pa = P.get(a)!;
    const pb = P.get(b)!;
    const out: Link[] = [];
    if (SIGN_LORDS[pa.signIndex] === b && SIGN_LORDS[pb.signIndex] === a) out.push({ kind: "exchange", weight: 3, text: L(`${a} and ${b} exchange signs (parivartana)`, `${n(a)} और ${n(b)} में राशि परिवर्तन है`) });
    if (pa.signIndex === pb.signIndex) out.push({ kind: "conjunction", weight: 3, text: L(`${a} and ${b} are together in the ${ordinal(pa.house)} house`, `${n(a)} और ${n(b)} ${ordinal(pa.house)} भाव में साथ हैं`) });
    const ab = aspects(pa, pb);
    const ba = aspects(pb, pa);
    if (pa.signIndex !== pb.signIndex) {
      if (ab && ba) out.push({ kind: "mutual aspect", weight: 2, text: L(`${a} and ${b} aspect each other`, `${n(a)} और ${n(b)} की परस्पर दृष्टि है`) });
      else if (ab || ba) out.push({ kind: "aspect", weight: 1, text: L(`${ab ? a : b} aspects ${ab ? b : a}`, `${n(ab ? a : b)} की ${n(ab ? b : a)} पर दृष्टि है`) });
    }
    if (!out.some((l) => l.kind === "exchange" || l.kind === "conjunction")) {
      if (targetHousesOfB.includes(pa.house)) out.push({ kind: "placement", weight: 1, text: L(`${a} sits in the ${ordinal(pa.house)}, a house ${b} rules`, `${n(a)} ${ordinal(pa.house)} भाव में हैं, जिसके स्वामी ${n(b)} हैं`) });
      else if (targetHousesOfA.includes(pb.house)) out.push({ kind: "placement", weight: 1, text: L(`${b} sits in the ${ordinal(pb.house)}, a house ${a} rules`, `${n(b)} ${ordinal(pb.house)} भाव में हैं, जिसके स्वामी ${n(a)} हैं`) });
    }
    return out;
  }

  const lifespanEnd = new Date(new Date(chart.utcDate).getTime() + 100 * 365.25 * 86400_000);
  /**
   * Current or future Mahadashas of the planets involved (within a lifespan),
   * each with the partner's Antardasha inside it, when the yoga peaks.
   */
  function activation(planets: PlanetName[]): YogaActivation[] {
    const out: YogaActivation[] = [];
    for (const md of chart.dashas) {
      if (!planets.includes(md.lord as PlanetName)) continue;
      const start = new Date(md.start);
      const end = new Date(md.end);
      if (end < now || start > lifespanEnd) continue;
      const peak = (md.subPeriods ?? []).find((ad) => ad.lord !== md.lord && planets.includes(ad.lord as PlanetName) && new Date(ad.end) >= now);
      out.push({
        label: L(`${md.lord} Mahadasha`, `${n(md.lord)} महादशा`),
        start,
        end,
        ...(peak ? { peak: { label: L(`${peak.lord} Antardasha`, `${n(peak.lord)} अंतर्दशा`), start: new Date(peak.start), end: new Date(peak.end) } } : {}),
      });
    }
    return out.sort((x, y) => x.start.getTime() - y.start.getTime()).slice(0, 3);
  }

  const grade = (score: number): YogaStrength => (score >= 5 ? "Strong" : score >= 2 ? "Moderate" : "Weak");

  // ---- Functional nature and Yogakaraka
  const kendraOnly = [4, 7, 10];
  const trikonaOnly = [5, 9];
  const yogakaraka = CLASSICAL.find((pl) => housesRuled(pl).some((h) => kendraOnly.includes(h)) && housesRuled(pl).some((h) => trikonaOnly.includes(h))) ?? null;
  const benefics: PlanetName[] = [];
  const malefics: PlanetName[] = [];
  const neutral: PlanetName[] = [];
  // Parashari functional nature: trikona lords help, lords of 3, 6, 8 and 11 harm, the rest take the colour of what they join.
  for (const pl of CLASSICAL) {
    const hs = housesRuled(pl);
    const trikonaLord = hs.some((h) => TRIKONA.includes(h)) && (!hs.includes(8) || hs.includes(1));
    if (pl === yogakaraka || trikonaLord) benefics.push(pl);
    else if (hs.some((h) => [3, 6, 8, 11].includes(h))) malefics.push(pl);
    else neutral.push(pl);
  }

  const findings: YogaFinding[] = [];

  if (yogakaraka) {
    const hs = housesRuled(yogakaraka);
    const c = condition(yogakaraka);
    const p = P.get(yogakaraka)!;
    findings.push({
      id: "yogakaraka",
      category: "yogakaraka",
      name: L(`${yogakaraka} is your Yogakaraka`, `${n(yogakaraka)} आपके योगकारक हैं`),
      strength: grade(c.score + 3),
      planets: [yogakaraka],
      houses: hs,
      formation: L(
        `For a ${chart.ascendant.sign} Lagna, ${yogakaraka} rules both the ${ordinal(hs.find((h) => kendraOnly.includes(h))!)} (a kendra) and the ${ordinal(hs.find((h) => trikonaOnly.includes(h))!)} (a trikona), so on its own it forms a Raj Yoga.`,
        `${n(chart.ascendant.sign)} लग्न के लिए ${n(yogakaraka)} ${ordinal(hs.find((h) => kendraOnly.includes(h))!)} (केंद्र) और ${ordinal(hs.find((h) => trikonaOnly.includes(h))!)} (त्रिकोण) दोनों भावों के स्वामी हैं, इसलिए अकेले ही राजयोग बनाते हैं।`
      ),
      reasons: [...c.notes, L(`It sits in your ${ordinal(p.house)} house, so its results come through ${topic(p.house)}.`, `ये आपके ${ordinal(p.house)} भाव में हैं, इसलिए इनके फल ${topic(p.house)} के माध्यम से आते हैं।`)],
      effect: L(
        `The single most helpful planet in your chart. Its periods tend to bring status, support and progress in ${hs.map(topic).join(" and ")}. Strengthening it is usually the first remedy an astrologer suggests.`,
        `आपकी कुंडली का सबसे सहायक ग्रह। इनकी दशाएँ प्रायः ${hs.map(topic).join(" और ")} में प्रतिष्ठा, सहारा और प्रगति लाती हैं। इन्हें बल देना प्रायः ज्योतिषी का पहला सुझाया उपाय होता है।`
      ),
      activation: activation([yogakaraka]),
    });
  }

  // ---- Raj Yogas: kendra lord + trikona lord
  const seen = new Set<string>();
  const kendraLords = [...new Set(KENDRA.map(lordOf))];
  const trikonaLords = [...new Set(TRIKONA.map(lordOf))];
  for (const k of kendraLords) {
    for (const t of trikonaLords) {
      if (k === t) continue;
      const key = [k, t].sort().join("-");
      if (seen.has(key)) continue;
      seen.add(key);
      const kH = housesRuled(k).filter((h) => KENDRA.includes(h));
      const tH = housesRuled(t).filter((h) => TRIKONA.includes(h));
      const ls = links(k, t, housesRuled(t), housesRuled(k));
      if (!ls.length) continue;
      const ck = condition(k);
      const ct = condition(t);
      const reasons = [...ls.map((l) => l.text), ...ck.notes, ...ct.notes];
      let score = Math.max(...ls.map((l) => l.weight)) + ck.score + ct.score;
      for (const pl of [k, t]) {
        const bad = housesRuled(pl).filter((h) => h === 6 || h === 8 || h === 12);
        if (bad.length && pl !== lordOf(1)) {
          score -= 1;
          reasons.push(L(`${pl} also rules the ${list(bad)}, which dilutes the yoga`, `${n(pl)} ${list(bad)} भाव के भी स्वामी हैं, जिससे योग कमज़ोर होता है`));
        }
      }
      const houses = [...new Set([...kH, ...tH])].sort((a, b) => a - b);
      const dk = houses.includes(9) && houses.includes(10);
      findings.push({
        id: `raja-${key}`,
        category: "raja",
        name: dk ? L("Dharma-Karmadhipati Raj Yoga", "धर्म-कर्माधिपति राजयोग") : L(`Raj Yoga of ${k} and ${t}`, `${n(k)} और ${n(t)} का राजयोग`),
        strength: grade(score),
        planets: [k, t],
        houses,
        formation: L(`${k} rules the ${list(kH)} (kendra) and ${t} rules the ${list(tH)} (trikona); ${ls[0].text}.`, `${n(k)} ${list(kH)} (केंद्र) और ${n(t)} ${list(tH)} (त्रिकोण) भाव के स्वामी हैं; ${ls[0].text}।`),
        reasons,
        effect: dk
          ? L("The lords of dharma (9th) and karma (10th) joined — the most celebrated Raj Yoga, for a career that carries meaning, recognition and the backing of luck.", "धर्म (नवम) और कर्म (दशम) के स्वामियों का संबंध — सबसे प्रसिद्ध राजयोग, ऐसे करियर के लिए जिसमें अर्थ, पहचान और भाग्य का साथ हो।")
          : L(`Links effort and position (${kH.map(topic).join(", ")}) with fortune and merit (${tH.map(topic).join(", ")}) — rise in status and authority, especially in the periods below.`, `प्रयास और पद (${kH.map(topic).join(", ")}) को भाग्य और पुण्य (${tH.map(topic).join(", ")}) से जोड़ता है — प्रतिष्ठा और अधिकार में उन्नति, विशेषकर नीचे दी गई अवधियों में।`),
        activation: activation([k, t]),
      });
    }
  }
  // Nodes in a kendra with a trikona lord, or in a trikona with a kendra lord
  for (const node of ["Rahu", "Ketu"] as const) {
    const nd = P.get(node)!;
    const partners = chart.planets.filter((p) => p.signIndex === nd.signIndex && p.planet !== node);
    const partner = partners.find((p) => (KENDRA.includes(nd.house) && trikonaLords.includes(p.planet)) || (TRIKONA.includes(nd.house) && kendraLords.includes(p.planet)));
    if (!partner) continue;
    const c = condition(partner.planet);
    findings.push({
      id: `raja-${node}`,
      category: "raja",
      name: L(`Raj Yoga through ${node}`, `${n(node)} द्वारा राजयोग`),
      strength: grade(2 + c.score),
      planets: [node, partner.planet],
      houses: [nd.house, ...housesRuled(partner.planet)],
      formation: L(
        `${node} sits in the ${ordinal(nd.house)} (${KENDRA.includes(nd.house) ? "a kendra" : "a trikona"}) with ${partner.planet}, lord of the ${list(housesRuled(partner.planet))}. A node gives the results of the planet it joins.`,
        `${n(node)} ${ordinal(nd.house)} भाव (${KENDRA.includes(nd.house) ? "केंद्र" : "त्रिकोण"}) में ${list(housesRuled(partner.planet))} भाव के स्वामी ${n(partner.planet)} के साथ हैं। छाया ग्रह जिस ग्रह के साथ हो, उसी के फल देता है।`
      ),
      reasons: c.notes,
      effect: L(`${node}'s period can bring a sudden, unconventional rise tied to ${topic(nd.house)}.`, `${n(node)} की दशा ${topic(nd.house)} से जुड़ी अचानक, अपरंपरागत उन्नति ला सकती है।`),
      activation: activation([node, partner.planet]),
    });
  }

  // ---- Dhan Yogas: wealth lords with the lords of 1, 5, 9 (and each other)
  const wealthH = [2, 11];
  const supportH = [1, 2, 5, 9, 11];
  const dseen = new Set<string>();
  for (const w of [...new Set(wealthH.map(lordOf))]) {
    for (const s of [...new Set(supportH.map(lordOf))]) {
      if (w === s) continue;
      const key = [w, s].sort().join("-");
      if (dseen.has(key)) continue;
      dseen.add(key);
      const wH = housesRuled(w).filter((h) => wealthH.includes(h));
      const sH = housesRuled(s).filter((h) => supportH.includes(h));
      const ls = links(w, s, housesRuled(s), housesRuled(w));
      if (!ls.length) continue;
      const cw = condition(w);
      const cs = condition(s);
      const score = Math.max(...ls.map((l) => l.weight)) + cw.score + cs.score;
      const houses = [...new Set([...wH, ...sH])].sort((a, b) => a - b);
      findings.push({
        id: `dhana-${key}`,
        category: "dhana",
        name: houses.includes(2) && houses.includes(11) ? L("Dhan Yoga of the 2nd and 11th lords", "द्वितीयेश और एकादशेश का धन योग") : L(`Dhan Yoga of ${w} and ${s}`, `${n(w)} और ${n(s)} का धन योग`),
        strength: grade(score),
        planets: [w, s],
        houses,
        formation: L(`${w} rules the ${list(wH)} and ${s} rules the ${list(sH)}; ${ls[0].text}.`, `${n(w)} ${list(wH)} और ${n(s)} ${list(sH)} भाव के स्वामी हैं; ${ls[0].text}।`),
        reasons: [...ls.map((l) => l.text), ...cw.notes, ...cs.notes],
        effect: L(`Joins the houses of ${houses.map(topic).join(", ")} — a classical indication of earning and saving well, strongest in the periods below.`, `${houses.map(topic).join(", ")} के भावों को जोड़ता है — अच्छी कमाई और बचत का शास्त्रीय संकेत, नीचे दी गई अवधियों में सबसे प्रबल।`),
        activation: activation([w, s]),
      });
    }
  }
  // Lakshmi Yoga: strong 9th lord in a kendra or trikona, Lagna lord not weak
  {
    const l9 = lordOf(9);
    const p9 = P.get(l9)!;
    const d9 = getDignity(l9, p9.signIndex, p9.degreeInSign);
    const l1 = P.get(lordOf(1))!;
    const l1ok = !DUSTHANA.includes(l1.house) && getDignity(l1.planet, l1.signIndex) !== "Debilitated";
    if ((KENDRA.includes(p9.house) || TRIKONA.includes(p9.house)) && (d9 === "Exalted" || d9 === "Own Sign" || d9 === "Moolatrikona") && l1ok) {
      findings.push({
        id: "dhana-lakshmi",
        category: "dhana",
        name: L("Lakshmi Yoga", "लक्ष्मी योग"),
        strength: "Strong",
        planets: [l9, l1.planet],
        houses: [9, 1],
        formation: L(
          `The 9th lord ${l9} is ${d9 === "Own Sign" ? "in its own sign" : d9.toLowerCase()} in the ${ordinal(p9.house)} house, and the Lagna lord ${l1.planet} is not weak.`,
          `नवमेश ${n(l9)} ${ordinal(p9.house)} भाव में ${d9 === "Own Sign" ? "स्वराशि में" : n(d9)} हैं, और लग्नेश ${n(l1.planet)} कमज़ोर नहीं हैं।`
        ),
        reasons: hi
          ? [`नवमेश ${KENDRA.includes(p9.house) ? "केंद्र" : "त्रिकोण"} में`, `लग्नेश ${n(l1.planet)} ${ordinal(l1.house)} भाव में`]
          : [`9th lord in a ${KENDRA.includes(p9.house) ? "kendra" : "trikona"}`, `Lagna lord ${l1.planet} in the ${ordinal(l1.house)}`],
        effect: L("A classical yoga of lasting prosperity, generosity and good fortune.", "स्थायी समृद्धि, उदारता और सौभाग्य का शास्त्रीय योग।"),
        activation: activation([l9]),
      });
    }
  }
  // Vasumati Yoga: benefics in upachaya houses (3, 6, 10, 11) from the Moon
  {
    const inUpachaya = (["Mercury", "Jupiter", "Venus"] as const).filter((b) => [3, 6, 10, 11].includes(dist(moon.signIndex, P.get(b)!.signIndex)));
    if (inUpachaya.length >= 2) {
      findings.push({
        id: "dhana-vasumati",
        category: "dhana",
        name: L("Vasumati Yoga", "वसुमती योग"),
        strength: inUpachaya.length === 3 ? "Strong" : "Moderate",
        planets: [...inUpachaya],
        houses: inUpachaya.map((b) => dist(moon.signIndex, P.get(b)!.signIndex)),
        formation: L(`${inUpachaya.join(" and ")} sit in upachaya houses (3rd, 6th, 10th, 11th) counted from the Moon.`, `${inUpachaya.map(n).join(" और ")} चंद्र से उपचय भावों (3, 6, 10, 11) में हैं।`),
        reasons: inUpachaya.map((b) => L(`${b} is ${ordinal(dist(moon.signIndex, P.get(b)!.signIndex))} from the Moon`, `${n(b)} चंद्र से ${ordinal(dist(moon.signIndex, P.get(b)!.signIndex))} भाव में`)),
        effect: L("Wealth that grows steadily with age through your own effort.", "अपने प्रयास से उम्र के साथ निरंतर बढ़ता धन।"),
        activation: activation([...inUpachaya]),
      });
    }
  }

  // ---- Arisht Yogas, each with its classical softeners
  const arishta = (id: string, name: string, planets: PlanetName[], houses: number[], formation: string, effect: string, softeners: string[]) => {
    findings.push({
      id: `arishta-${id}`,
      category: "arishta",
      name,
      strength: softeners.length ? "Mitigated" : "Moderate",
      planets,
      houses,
      formation,
      reasons: softeners.length ? softeners : [L("No classical softener is present, so the remedies for these planets matter more.", "कोई शास्त्रीय शमन उपस्थित नहीं है, इसलिए इन ग्रहों के उपाय अधिक महत्वपूर्ण हैं।")],
      effect,
      activation: activation(planets),
    });
  };
  const l1 = P.get(lordOf(1))!;
  if (DUSTHANA.includes(l1.house)) {
    const soft: string[] = [];
    const d = getDignity(l1.planet, l1.signIndex);
    if (d === "Exalted" || d === "Own Sign") soft.push(L(`${l1.planet} is ${d === "Exalted" ? "exalted" : "in its own sign"}, which keeps it strong`, `${n(l1.planet)} ${d === "Exalted" ? "उच्च के" : "स्वराशि में"} हैं, जो इन्हें बलवान रखता है`));
    if (jupiterSees(l1.signIndex) && l1.planet !== "Jupiter") soft.push(L("Jupiter protects it by aspect or conjunction", "गुरु दृष्टि या युति से इनकी रक्षा करते हैं"));
    if (l1.house === 6 || l1.house === 12) {
      const vip = lordOf(l1.house) === l1.planet;
      if (vip) soft.push(L("It rules the house it sits in", "ये जिस भाव में हैं, उसी के स्वामी हैं"));
    }
    arishta(
      "lagnesh",
      L("Lagna lord in a dusthana", "लग्नेश दुःस्थान में"),
      [l1.planet],
      [1, l1.house],
      L(`Your Lagna lord ${l1.planet} sits in the ${ordinal(l1.house)} house (${topic(l1.house)}).`, `आपके लग्नेश ${n(l1.planet)} ${ordinal(l1.house)} भाव (${topic(l1.house)}) में हैं।`),
      L("The body and vitality need looking after; progress can come through struggle, service or distance from home.", "शरीर और जीवन-शक्ति का ध्यान रखना होगा; प्रगति संघर्ष, सेवा या घर से दूरी के माध्यम से आ सकती है।"),
      soft
    );
  }
  const elong = (moon.siderealLongitude - sun.siderealLongitude + 360) % 360;
  const waning = elong > 180;
  const moonAfflicters = chart.planets.filter((p) => MALEFICS.has(p.planet) && p.planet !== "Sun" && (p.signIndex === moon.signIndex || aspects(p, moon)));
  if (DUSTHANA.includes(moon.house) && waning && moonAfflicters.length) {
    const soft: string[] = [];
    if (jupiterSees(moon.signIndex)) soft.push(L("Jupiter aspects or joins the Moon", "गुरु की चंद्र पर दृष्टि या युति है"));
    const dm = getDignity("Moon", moon.signIndex);
    if (dm === "Exalted" || dm === "Own Sign") soft.push(L(`The Moon is ${dm === "Exalted" ? "exalted" : "in its own sign"}`, `चंद्र ${dm === "Exalted" ? "उच्च के" : "स्वराशि में"} हैं`));
    arishta(
      "balarishta",
      L("Balarishta (afflicted Moon)", "बालारिष्ट (पीड़ित चंद्र)"),
      ["Moon", ...moonAfflicters.map((p) => p.planet)],
      [moon.house],
      L(`A waning Moon in the ${ordinal(moon.house)} house is afflicted by ${moonAfflicters.map((p) => p.planet).join(" and ")}.`, `${ordinal(moon.house)} भाव में क्षीण चंद्र ${moonAfflicters.map((p) => n(p.planet)).join(" और ")} से पीड़ित हैं।`),
      L("Classically a caution for health in childhood and for emotional resilience; in adults it reads as sensitivity that benefits from routine and care.", "शास्त्रों में यह बचपन के स्वास्थ्य और भावनात्मक दृढ़ता के लिए सावधानी है; वयस्कों में यह संवेदनशीलता है जिसे नियमित दिनचर्या और देखभाल से लाभ होता है।"),
      soft
    );
  }
  const hemmed = (sign: number, exclude: PlanetName) => {
    const at = (s: number) => chart.planets.filter((p) => p.signIndex === s && p.planet !== exclude);
    const second = at((sign + 1) % 12);
    const twelfth = at((sign + 11) % 12);
    const isMal = (ps: PlanetPlacement[]) => ps.length > 0 && ps.every((p) => MALEFICS.has(p.planet));
    return isMal(second) && isMal(twelfth) ? [...second, ...twelfth].map((p) => p.planet) : null;
  };
  const lagnaHem = hemmed(lagna, "Ketu" as PlanetName);
  if (lagnaHem) {
    const soft: string[] = [];
    if (jupiterSees(lagna)) soft.push(L("Jupiter aspects the Lagna", "गुरु की लग्न पर दृष्टि है"));
    if (chart.planets.some((p) => p.house === 1 && ["Jupiter", "Venus", "Mercury"].includes(p.planet))) soft.push(L("A benefic sits in the Lagna", "लग्न में एक शुभ ग्रह है"));
    arishta(
      "papakartari-lagna",
      L("Papakartari on the Lagna", "लग्न पर पापकर्तरी"),
      lagnaHem,
      [12, 1, 2],
      L(`The Lagna is hemmed in by malefics — ${lagnaHem.join(", ")} in the 12th and 2nd houses.`, `लग्न पाप ग्रहों से घिरा है — बारहवें और दूसरे भाव में ${lagnaHem.map(n).join(", ")}।`),
      L("Feeling boxed in by circumstances; health and confidence improve with deliberate effort.", "परिस्थितियों से घिरे होने का अनुभव; सजग प्रयास से स्वास्थ्य और आत्मविश्वास सुधरता है।"),
      soft
    );
  }
  const moonHem = hemmed(moon.signIndex, "Moon");
  if (moonHem) {
    const soft: string[] = [];
    if (jupiterSees(moon.signIndex)) soft.push(L("Jupiter aspects the Moon", "गुरु की चंद्र पर दृष्टि है"));
    arishta(
      "papakartari-moon",
      L("Chandra Papakartari", "चंद्र पापकर्तरी"),
      ["Moon", ...moonHem],
      [moon.house],
      L(`The Moon is hemmed in by malefics — ${moonHem.join(", ")} on either side.`, `चंद्र दोनों ओर पाप ग्रहों से घिरे हैं — ${moonHem.map(n).join(", ")}।`),
      L("Worry and mental pressure; meditation and supportive company help.", "चिंता और मानसिक दबाव; ध्यान और सहयोगी संगति से लाभ।"),
      soft
    );
  }
  const l8 = lordOf(8);
  if (l8 !== l1.planet && (P.get(l8)!.house === 1 || P.get(l8)!.signIndex === l1.signIndex)) {
    const soft: string[] = [];
    if (jupiterSees(P.get(l8)!.signIndex)) soft.push(L("Jupiter aspects the combination", "गुरु की इस योग पर दृष्टि है"));
    arishta(
      "l8-lagna",
      L("8th lord afflicting the Lagna", "अष्टमेश से लग्न पीड़ित"),
      [l8, l1.planet],
      [1, 8],
      L(`The 8th lord ${l8} ${P.get(l8)!.house === 1 ? "sits in the Lagna" : `joins the Lagna lord ${l1.planet}`}.`, `अष्टमेश ${n(l8)} ${P.get(l8)!.house === 1 ? "लग्न में हैं" : `लग्नेश ${n(l1.planet)} के साथ हैं`}।`),
      L("Sudden ups and downs in health and fortune; also a natural pull towards research and the hidden.", "स्वास्थ्य और भाग्य में अचानक उतार-चढ़ाव; साथ ही शोध और गूढ़ विषयों की ओर स्वाभाविक खिंचाव।"),
      soft
    );
  }
  for (const [a, b, nameEn, effectEn, nameHi, effectHi] of [
    ["Sun", "Rahu", "Grahan Yoga (Sun with Rahu)", "Clouds confidence and relations with father or authority.", "ग्रहण योग (सूर्य-राहु)", "आत्मविश्वास और पिता या अधिकारियों से संबंधों पर छाया डालता है।"],
    ["Sun", "Ketu", "Grahan Yoga (Sun with Ketu)", "Can make recognition come late or feel detached from ego.", "ग्रहण योग (सूर्य-केतु)", "पहचान देर से दिला सकता है या अहं से विरक्ति देता है।"],
    ["Moon", "Rahu", "Grahan Yoga (Moon with Rahu)", "Restless mind and anxiety; calming routines help.", "ग्रहण योग (चंद्र-राहु)", "बेचैन मन और चिंता; शांत दिनचर्या से लाभ।"],
    ["Moon", "Ketu", "Grahan Yoga (Moon with Ketu)", "Emotional detachment; spiritual depth.", "ग्रहण योग (चंद्र-केतु)", "भावनात्मक विरक्ति; आध्यात्मिक गहराई।"],
    ["Saturn", "Rahu", "Shrapit Yoga", "Delays and obstacles that ease with patience and service.", "श्रापित योग", "देरी और बाधाएँ जो धैर्य और सेवा से हल्की होती हैं।"],
    ["Mars", "Rahu", "Angarak Yoga", "Anger and rash action; channel the energy into sport or discipline.", "अंगारक योग", "क्रोध और जल्दबाज़ी; ऊर्जा को खेल या अनुशासन में लगाएँ।"],
  ] as const) {
    const name = L(nameEn, nameHi);
    const effect = L(effectEn, effectHi);
    const pa = P.get(a)!;
    if (pa.signIndex !== P.get(b)!.signIndex) continue;
    const soft: string[] = [];
    if (jupiterSees(pa.signIndex)) soft.push(L("Jupiter aspects the pair", "गुरु की इस जोड़ी पर दृष्टि है"));
    const d = getDignity(a, pa.signIndex);
    if (d === "Exalted" || d === "Own Sign") soft.push(L(`${a} is strong in its own or exalted sign`, `${n(a)} अपनी या उच्च राशि में बलवान हैं`));
    arishta(`${a}-${b}`, name, [a, b], [pa.house], L(`${a} and ${b} are together in the ${ordinal(pa.house)} house (${topic(pa.house)}).`, `${n(a)} और ${n(b)} ${ordinal(pa.house)} भाव (${topic(pa.house)}) में साथ हैं।`), effect, soft);
  }
  const in8 = chart.planets.filter((p) => p.house === 8 && ["Mars", "Saturn", "Rahu"].includes(p.planet));
  if (in8.length) {
    const soft: string[] = [];
    if (jupiterSees((lagna + 7) % 12)) soft.push(L("Jupiter aspects the 8th house", "गुरु की अष्टम भाव पर दृष्टि है"));
    for (const p of in8) {
      const d = getDignity(p.planet, p.signIndex);
      if (d === "Own Sign" || d === "Exalted") soft.push(L(`${p.planet} is strong in its own or exalted sign`, `${n(p.planet)} अपनी या उच्च राशि में बलवान हैं`));
    }
    arishta(
      "malefic-8",
      L("Malefics in the 8th house", "अष्टम भाव में पाप ग्रह"),
      in8.map((p) => p.planet),
      [8],
      L(`${in8.map((p) => p.planet).join(" and ")} ${in8.length > 1 ? "occupy" : "occupies"} the 8th house.`, `${in8.map((p) => n(p.planet)).join(" और ")} अष्टम भाव में हैं।`),
      L("A caution for accidents, surgery and sudden events; careful driving and regular check-ups are sensible.", "दुर्घटना, शल्य-चिकित्सा और अचानक घटनाओं के प्रति सावधानी; सावधानी से वाहन चलाना और नियमित जाँच उचित है।"),
      soft
    );
  }

  const order: Record<YogaStrength, number> = { Strong: 0, Moderate: 1, Weak: 2, Mitigated: 3 };
  findings.sort((a, b) => a.category.localeCompare(b.category) || order[a.strength] - order[b.strength]);
  return { lagnaSign: chart.ascendant.sign, yogakaraka, functional: { benefics, malefics, neutral }, findings };
}
