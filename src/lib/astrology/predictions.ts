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
import { HOUSE_SIGNIFICATION_HI, PLANET_KEYNOTE_HI, SIGN_KEYNOTE_HI } from "./content.hi";
import { ELEMENT_HI, NAKSHATRA_HI, PLANET_IN_HOUSES_HI, QUALITY_HI, SIGN_DESCRIPTION_HI } from "./reference/reference.hi";
import type { Locale } from "../i18n/locale";
import { pick } from "../i18n/ui";
import { term } from "../i18n/terms";
import { listHi, ordHi } from "../i18n/hiGrammar";

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

const DIGNITY_PHRASE_HI: Record<Dignity, string> = {
  Exalted: "उच्च के — अपने बल के शिखर पर",
  Moolatrikona: "मूलत्रिकोण में — बहुत सहज और प्रभावी",
  "Own Sign": "स्वराशि में — अपने घर में, आत्मविश्वासी",
  "Friend's Sign": "मित्र राशि में — काफ़ी सहज",
  "Neutral Sign": "सम राशि में",
  "Enemy's Sign": "शत्रु राशि में — कुछ दबाव में कार्य करते हुए",
  Debilitated: "नीच के — सबसे कमज़ोर, फल देने के लिए सहारे की आवश्यकता",
};

const first = (h: number, hi: boolean) => (hi ? HOUSE_SIGNIFICATION_HI[h] : HOUSE_SIGNIFICATION[h]).split(",")[0];

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

export function planetReadings(chart: KundaliChart, locale: Locale = "en"): PlanetReading[] {
  const hi = locale === "hi";
  const L = pick(locale);
  const n = (x: string) => term(locale, x);
  const sun = chart.planets.find((p) => p.planet === "Sun")!;
  return chart.planets.map((p) => {
    const ref = PLANET_REFERENCE.find((r) => r.name === p.planet)!;
    const signRef = SIGN_REFERENCE[p.signIndex];
    const nak = NAKSHATRA_REFERENCE[p.nakshatraIndex];
    const ruled = housesRuledBy(chart, p.planet);
    const bala = chart.shadbala.find((s) => s.planet === p.planet);
    const flags: string[] = [];
    if (p.retrograde && p.planet !== "Rahu" && p.planet !== "Ketu") flags.push(L("Retrograde — its results turn inward, arrive in revisited or unconventional ways", "वक्री — इनके फल भीतर की ओर मुड़ते हैं, दोहराए या अपरंपरागत ढंग से आते हैं"));
    if (isCombust(p, sun)) flags.push(L("Combust — overshadowed by the Sun, so its significations need conscious effort", "अस्त — सूर्य से ढके हुए, इसलिए इनके कारकत्वों के लिए सजग प्रयास चाहिए"));
    if (hi) {
      const nh = NAKSHATRA_HI[p.nakshatraIndex];
      return {
        planet: p.planet,
        headline: `${n(p.planet)} ${n(p.sign)} में, ${ordHi(p.house)} भाव में`,
        house: PLANET_IN_HOUSES_HI[p.planet][p.house - 1],
        sign: `${n(p.sign)} में — ${n(SIGN_LORDS[p.signIndex])} की ${ELEMENT_HI[signRef.element]} तत्व, ${QUALITY_HI[signRef.quality]} राशि — ${n(p.planet)} के ${PLANET_KEYNOTE_HI[p.planet]} के विषय ${SIGN_KEYNOTE_HI[p.sign]} रंग लेते हैं${p.dignity ? `। ये ${DIGNITY_PHRASE_HI[p.dignity]} हैं` : ""}।`,
        nakshatra: `ये ${n(p.nakshatra)} नक्षत्र के ${p.pada} पद में हैं (स्वामी ${n(nak.rulingPlanet)}; देवता: ${nh.deity})। ${nh.keynote}`,
        lordship:
          ruled.length > 0
            ? `आपके ${listHi(ruled.map(ordHi))} भाव (${ruled.map((h) => first(h, true)).join("; ")}) के स्वामी होने से ${n(p.planet)} इन विषयों को ${ordHi(p.house)} भाव — ${HOUSE_SIGNIFICATION_HI[p.house]} — में ले आते हैं।`
            : null,
        strength: bala
          ? `षड्बल: आवश्यक ${bala.requiredRupas} में से ${bala.rupas.toFixed(2)} रूप — ${bala.isStrong ? "पूरे फल देने के लिए पर्याप्त बलवान" : "बल से कम, इसलिए फल अधिक प्रयास या देर से मिलते हैं"}।`
          : null,
        flags,
      };
    }

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
  titleHi: string;
  houses: number[];
  karakas: PlanetName[];
  extra?: (chart: KundaliChart, locale: Locale) => string[];
}

const AREAS: AreaDef[] = [
  {
    key: "self",
    title: "Personality & Vitality",
    titleHi: "व्यक्तित्व और जीवन-शक्ति",
    houses: [1],
    karakas: ["Sun"],
    extra: (chart, locale) => {
      const lagnaLord = SIGN_LORDS[chart.ascendant.signIndex];
      const lord = chart.planets.find((p) => p.planet === lagnaLord)!;
      if (locale === "hi")
        return [
          `आपका लग्न ${term("hi", chart.ascendant.sign)} है: ${SIGN_DESCRIPTION_HI[chart.ascendant.signIndex]}`,
          `लग्नेश ${term("hi", lagnaLord)} — जो आपके शरीर और जीवन-शक्ति के प्रतीक हैं — आपके ${ordHi(lord.house)} भाव में हैं${lord.dignity ? `, ${DIGNITY_PHRASE_HI[lord.dignity]}` : ""}।`,
        ];
      return [
        `Your Lagna is ${chart.ascendant.sign}: ${SIGN_REFERENCE[chart.ascendant.signIndex].description}`,
        `The Lagna lord ${lagnaLord} — the planet that stands for your body and vitality — is in your ${ordinal(lord.house)} house${lord.dignity ? `, ${DIGNITY_PHRASE[lord.dignity]}` : ""}.`,
      ];
    },
  },
  {
    key: "career",
    title: "Career & Status",
    titleHi: "करियर और प्रतिष्ठा",
    houses: [10],
    karakas: ["Sun", "Saturn", "Mercury"],
    extra: (chart, locale) => {
      const d10 = chart.divisionalCharts.D10;
      if (locale === "hi")
        return d10 ? [`दशमांश (D10), यानी करियर के चार्ट में लग्न ${term("hi", d10.ascendant.sign)} है — ${SIGN_KEYNOTE_HI[d10.ascendant.sign]}, जो आपके काम करने के ढंग और पेशेवर छवि को रंगता है।`] : [];
      return d10 ? [`In the Dasamsa (D10), the chart of career, the ascendant is ${d10.ascendant.sign} — ${SIGN_KEYNOTE[d10.ascendant.sign]}, which colours how you work and are seen professionally.`] : [];
    },
  },
  {
    key: "wealth",
    title: "Money, Family & Speech",
    titleHi: "धन, परिवार और वाणी",
    houses: [2],
    karakas: ["Jupiter", "Venus"],
    extra: (chart, locale) => {
      const named = chart.yogas.filter((y) => y.present && /Lakshmi|Gaj Kesari|Mahapurusha/i.test(y.key ?? y.name)).map((y) => y.name);
      const dhana = analyzeYogas(chart, new Date(), locale).findings.filter((f) => f.category === "dhana" && f.strength !== "Weak").map((f) => `${f.name} (${locale === "hi" ? term("hi", f.strength) : f.strength.toLowerCase()})`);
      const all = [...dhana, ...named];
      if (locale === "hi")
        return all.length ? [`आपकी कुंडली में धन योग: ${listHi(all)} — हर एक कैसे बनता है, यह योग और दोष में देखें।`] : ["कोई प्रबल धन योग नहीं बनता, इसलिए धन निरंतर प्रयास और नीचे दी गई अवधियों में बनता है।"];
      return all.length ? [`Wealth combinations in your chart: ${listPhrase(all)} — see Yogas & Doshas for how each is formed.`] : ["No strong Dhan Yoga is formed, so wealth builds through steady effort and the periods below."];
    },
  },
  {
    key: "marriage",
    title: "Marriage & Relationships",
    titleHi: "विवाह और संबंध",
    houses: [7],
    karakas: ["Venus", "Jupiter"],
    extra: (chart, locale) => {
      const out: string[] = [];
      const d9 = chart.divisionalCharts.D9;
      if (locale === "hi") {
        if (d9) {
          const s7 = (d9.ascendant.signIndex + 6) % 12;
          out.push(`नवांश (D9), यानी विवाह के चार्ट में सातवाँ भाव ${term("hi", SIGNS[s7])} में है, जिसके स्वामी ${term("hi", SIGN_LORDS[s7])} हैं।`);
        }
        const m = chart.mangalDosha;
        out.push(
          m.status === "present"
            ? `मांगलिक दोष है (${({ none: "शून्य", mild: "हल्का", moderate: "मध्यम", strong: "प्रबल" } as const)[m.severity]}) — मिलान में परंपरागत रूप से तौला जाता है।`
            : m.status === "cancelled"
              ? "मांगलिक दोष बनता है पर शास्त्रीय अपवाद से भंग है।"
              : "मांगलिक दोष नहीं है।"
        );
        return out;
      }
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
  { key: "education", title: "Education & Intellect", titleHi: "शिक्षा और बुद्धि", houses: [4, 5], karakas: ["Mercury", "Jupiter"] },
  { key: "children", title: "Children & Creativity", titleHi: "संतान और रचनात्मकता", houses: [5], karakas: ["Jupiter"] },
  { key: "home", title: "Home, Mother & Property", titleHi: "घर, माता और संपत्ति", houses: [4], karakas: ["Moon", "Mars"] },
  { key: "siblings", title: "Siblings, Courage & Communication", titleHi: "भाई-बहन, साहस और संवाद", houses: [3], karakas: ["Mars", "Mercury"] },
  { key: "health", title: "Health, Debts & Rivals", titleHi: "स्वास्थ्य, ऋण और प्रतिद्वंद्वी", houses: [6], karakas: ["Mars", "Saturn"] },
  { key: "longevity", title: "Longevity, Sudden Events & Research", titleHi: "आयु, आकस्मिक घटनाएँ और शोध", houses: [8], karakas: ["Saturn"] },
  { key: "fortune", title: "Father, Fortune & Dharma", titleHi: "पिता, भाग्य और धर्म", houses: [9], karakas: ["Sun", "Jupiter"] },
  { key: "gains", title: "Gains, Friends & Ambitions", titleHi: "लाभ, मित्र और महत्वाकांक्षाएँ", houses: [11], karakas: ["Jupiter"] },
  { key: "foreign", title: "Foreign Lands, Expenses & Spirituality", titleHi: "विदेश, व्यय और आध्यात्म", houses: [12], karakas: ["Saturn", "Ketu"] },
];

function ratingFor(score: number): number {
  return score >= 70 ? 5 : score >= 58 ? 4 : score >= 45 ? 3 : score >= 32 ? 2 : 1;
}

const allAntardashas = (chart: KundaliChart) => chart.dashas.flatMap((m) => (m.subPeriods ?? []).map((a) => ({ maha: m, antar: a })));

export function lifeAreaReadings(chart: KundaliChart, now = new Date(), locale: Locale = "en"): LifeAreaReading[] {
  const hi = locale === "hi";
  const n = (x: string) => term(locale, x);
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
      if (hi) {
        const qHi =
          quality === "trine"
            ? "शुभ त्रिकोण — बहुत सहायक स्थिति"
            : quality === "angular"
              ? "केंद्र भाव — स्थिर, स्पष्ट सहारा"
              : quality === "difficult"
                ? "कठिन भाव, इसलिए फल प्रयास, सेवा या कुछ देर से मिलते हैं"
                : `इस क्षेत्र को ${first(hl.lordHouse, true)} से जोड़ते हुए`;
        points.push(`आपका ${ordHi(house)} भाव (${HOUSE_SIGNIFICATION_HI[house]}) ${n(hl.sign)} में है। इसके स्वामी ${n(hl.lord)} ${ordHi(hl.lordHouse)} भाव में हैं — ${qHi}।`.replace(`आपका ${ordHi(house)} भाव`, `आपके ${ordHi(house)} भाव`));
      }
      const qualityText =
        quality === "trine"
          ? "a fortunate trine — a very supportive placement"
          : quality === "angular"
            ? "an angular house — steady, visible support"
            : quality === "difficult"
              ? "a difficult house, so results come through effort, service or after some delay"
              : `linking this area with ${HOUSE_SIGNIFICATION[hl.lordHouse].split(",")[0]}`;
      if (!hi) points.push(`Your ${ordinal(house)} house (${HOUSE_SIGNIFICATION[house]}) is in ${hl.sign}. Its lord ${hl.lord} sits in the ${ordinal(hl.lordHouse)} house — ${qualityText}.`);

      const occupants = chart.planets.filter((p) => p.house === house);
      occupants.forEach((o) => occupantsAll.add(o.planet));
      if (occupants.length) {
        const benefic = occupants.filter((o) => BENEFIC_PLANETS.has(o.planet)).map((o) => o.planet);
        const malefic = occupants.filter((o) => !BENEFIC_PLANETS.has(o.planet)).map((o) => o.planet);
        if (hi) {
          const parts = [benefic.length ? `${listHi(benefic.map(n))} स्वाभाविक सहारा देते हैं` : "", malefic.length ? `${listHi(malefic.map(n))} उत्साह के साथ घर्षण भी देते हैं` : ""].filter(Boolean);
          points.push(`${ordHi(house)} भाव में ग्रह: ${parts.join("; ")}।`);
        } else {
          const parts = [
            benefic.length ? `${listPhrase(benefic)} add${benefic.length === 1 ? "s" : ""} natural support` : "",
            malefic.length ? `${listPhrase(malefic)} add${malefic.length === 1 ? "s" : ""} drive but also friction` : "",
          ].filter(Boolean);
          points.push(`Planets in the ${ordinal(house)} house: ${parts.join("; ")}.`);
        }
      }
    }

    for (const k of area.karakas) {
      const bala = chart.shadbala.find((s) => s.planet === k);
      if (bala) points.push(hi ? `${n(k)}, यहाँ के नैसर्गिक कारक, षड्बल से ${bala.isStrong ? "बलवान" : "बल से कम"} हैं।` : `${k}, a natural significator here, is ${bala.isStrong ? "strong" : "below strength"} by Shadbala.`);
    }
    points.push(...(area.extra?.(chart, locale) ?? []));

    const verdict: StrengthVerdict = score >= 58 ? "Strong" : score >= 40 ? "Balanced" : "Weak";
    const summary = hi
      ? verdict === "Strong"
        ? `${area.titleHi} आपकी कुंडली के बेहतर समर्थित क्षेत्रों में से एक है।`
        : verdict === "Balanced"
          ? `${area.titleHi} को उचित सहारा है; फल समय और प्रयास पर निर्भर करते हैं।`
          : `${area.titleHi} पर अधिक सजग ध्यान चाहिए; नीचे दी गई अवधियों में यह क्षेत्र केंद्र में आता है।`
      : verdict === "Strong"
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
        label: `${n(maha.lord)}–${n(antar.lord)}`,
        start: antar.start,
        end: antar.end,
        why: whyRelevant(antar.lord, lords, occupantsAll, area.karakas, locale),
      });
      if (periods.length >= 5) break;
    }

    return { key: area.key, title: hi ? area.titleHi : area.title, rating: ratingFor(score), verdict, summary, points, periods };
  });
}

function whyRelevant(planet: PlanetName, lords: Set<PlanetName>, occupants: Set<PlanetName>, karakas: PlanetName[], locale: Locale): string {
  if (locale === "hi") {
    const n = term("hi", planet);
    if (lords.has(planet)) return `${n} इस क्षेत्र के स्वामी हैं`;
    if (occupants.has(planet)) return `${n} इस क्षेत्र में बैठे हैं`;
    if (karakas.includes(planet)) return `${n} इसके नैसर्गिक कारक हैं`;
    return "";
  }
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

function dashaTone(chart: KundaliChart, lord: PlanetName, p: PlanetPlacement, locale: Locale = "en"): { tone: DashaReading["tone"]; reasons: string[] } {
  const L = pick(locale);
  const ruled = housesRuledBy(chart, lord);
  const bala = chart.shadbala.find((s) => s.planet === lord);
  const good: string[] = [];
  const hard: string[] = [];
  if (ruled.some((h) => TRIKONA.has(h))) good.push(L("it rules a trine house", "ये त्रिकोण भाव के स्वामी हैं"));
  if (ruled.some((h) => KENDRA.has(h) && h !== 1)) good.push(L("it rules an angular house", "ये केंद्र भाव के स्वामी हैं"));
  if (ruled.length && ruled.every((h) => DUSTHANA.has(h))) hard.push(L("it rules only difficult houses", "ये केवल कठिन भावों के स्वामी हैं"));
  if (TRIKONA.has(p.house) || KENDRA.has(p.house)) good.push(L(`it sits in the ${ordinal(p.house)} house, a strong position`, `ये ${ordHi(p.house)} भाव में हैं, जो एक बलवान स्थिति है`));
  if (DUSTHANA.has(p.house)) hard.push(L(`it sits in the difficult ${ordinal(p.house)} house`, `ये कठिन ${ordHi(p.house)} भाव में हैं`));
  if (p.dignity === "Exalted" || p.dignity === "Moolatrikona" || p.dignity === "Own Sign") good.push(L("it is in a sign of dignity", "ये गरिमा वाली राशि में हैं"));
  if (p.dignity === "Debilitated") hard.push(L("it is debilitated", "ये नीच के हैं"));
  if (bala) (bala.isStrong ? good : hard).push(bala.isStrong ? L("it is strong by Shadbala", "ये षड्बल से बलवान हैं") : L("it is below strength by Shadbala", "ये षड्बल से बल में कम हैं"));
  const score = good.length - hard.length + (ruled.some((h) => TRIKONA.has(h)) ? 1 : 0) - (ruled.length && ruled.every((h) => DUSTHANA.has(h)) ? 1 : 0);
  const tone = score >= 2 ? "Supportive" : score <= -1 ? "Demanding" : "Mixed";
  return { tone, reasons: tone === "Supportive" ? good : tone === "Demanding" ? hard : [...good, ...hard] };
}

function relation(a: PlanetName, b: PlanetName): "friends" | "enemies" | "neutral" {
  if (a === b || FRIENDS[a]?.includes(b)) return "friends";
  if (ENEMIES[a]?.includes(b)) return "enemies";
  return "neutral";
}

export function dashaReadings(chart: KundaliChart, locale: Locale = "en"): DashaReading[] {
  if (locale === "hi") return dashaReadingsHi(chart);
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

function dashaReadingsHi(chart: KundaliChart): DashaReading[] {
  const place = (planet: PlanetName) => chart.planets.find((p) => p.planet === planet)!;
  const n = (x: string) => term("hi", x);
  return chart.dashas.map((maha: DashaPeriod) => {
    const lord = maha.lord as PlanetName;
    const p = place(lord);
    const ruled = housesRuledBy(chart, lord);
    const years = (maha.end.getTime() - maha.start.getTime()) / (365.25 * 86400_000);
    const text = [
      `${n(lord)} की दशा लगभग ${Math.round(years)} वर्ष तक ${PLANET_KEYNOTE_HI[lord]} को सामने लाती है।`,
      `${n(lord)} आपके ${ordHi(p.house)} भाव में हैं, इसलिए ${HOUSE_SIGNIFICATION_HI[p.house]} मुख्य विषय बनते हैं${p.dignity ? `; ये ${DIGNITY_PHRASE_HI[p.dignity]} हैं` : ""}।`,
    ];
    if (ruled.length) {
      text.push(`आपके ${listHi(ruled.map(ordHi))} भाव के स्वामी होने से ये ${listHi(ruled.map((h) => first(h, true)))} को भी सक्रिय करते हैं।`);
    } else {
      const dispositor = SIGN_LORDS[p.signIndex];
      text.push(`छाया ग्रह होने से ये अपने राशि-स्वामी ${n(dispositor)} (${n(p.sign)} के स्वामी) के माध्यम से कार्य करते हैं, इसलिए ${n(dispositor)} की स्थिति तय करती है कि यह अवधि कैसी बीतेगी।`);
    }
    const { tone, reasons } = dashaTone(chart, lord, p, "hi");
    const because = reasons.length ? ` — ${listHi(reasons)}` : "";
    text.push(
      tone === "Supportive"
        ? `कुल मिलाकर सहायक अवधि${because}।`
        : tone === "Demanding"
          ? `कुल मिलाकर कठिन अवधि${because}; यह धैर्य, अनुशासन और उपायों का फल देती है।`
          : `कुल मिलाकर मिश्रित अवधि${because}।`
    );
    const antardashas = (maha.subPeriods ?? []).map((a) => {
      const sub = a.lord as PlanetName;
      const sp = place(sub);
      const rel = relation(lord, sub);
      return {
        lord: sub,
        start: a.start,
        end: a.end,
        text: `${n(sub)} का ध्यान ${PLANET_KEYNOTE_HI[sub].split(",").slice(0, 2).join(" और")} पर, आपके ${ordHi(sp.house)} भाव (${first(sp.house, true)}) के माध्यम से। ${
          rel === "friends" ? `${n(lord)} और ${n(sub)} मित्र हैं, इसलिए यह उप-दशा प्रायः सहजता से चलती है।` : rel === "enemies" ? `${n(lord)} और ${n(sub)} नैसर्गिक शत्रु हैं, इसलिए दोनों के उद्देश्यों में कुछ टकराव की अपेक्षा रखें।` : `${n(lord)} और ${n(sub)} एक-दूसरे के प्रति सम हैं।`
        }`,
      };
    });
    return { lord, start: maha.start, end: maha.end, tone, text, antardashas };
  });
}
