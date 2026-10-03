import type { PlanetName } from "./constants";
import { HOUSE_SIGNIFICATION } from "./content";
import { getAspectedHouses } from "./aspects";
import { analyzeBhavaStrength, type StrengthVerdict } from "./bhavaStrength";
import { HOUSE_REFERENCE } from "./reference/houses";
import { PLANET_REFERENCE } from "./reference/planets";
import { isCombust } from "./birthDetails";
import type { KundaliChart } from "./types";
import { HOUSE_SIGNIFICATION_HI } from "./content.hi";
import { HOUSE_CLASS_HI, HOUSE_SANSKRIT_HI, PLANET_IN_HOUSES_HI } from "./reference/reference.hi";
import type { Locale } from "../i18n/locale";
import { pick } from "../i18n/ui";
import { term } from "../i18n/terms";
import { listHi, ordHi, ordHiDirect } from "../i18n/hiGrammar";

/**
 * A full reading of each of the twelve bhavas: its sign, its lord and where
 * that lord went, the planets inside it, the planets aspecting it, its
 * Sarvashtakavarga bindus, its natural significators, a strength verdict with
 * the reasons, the body areas it governs, and the dasha periods that bring it
 * alive. Everything is derived from the chart; only the wording is templated.
 */

export interface HouseReading {
  house: number;
  sanskrit: string;
  classification: string[];
  themes: string;
  sign: string;
  lord: PlanetName;
  lordHouse: number;
  lordSign: string;
  lordText: string;
  occupants: { planet: PlanetName; text: string; note?: string }[];
  aspects: { planet: PlanetName; benefic: boolean }[];
  aspectText: string;
  karakas: { planet: PlanetName; text: string }[];
  sav: number;
  savText: string;
  strength: { score: number; verdict: StrengthVerdict; rationale: string };
  body: string;
  summary: string;
  periods: { label: string; start: Date; end: Date; why: string }[];
}

const KENDRA = [1, 4, 7, 10];
const TRIKONA = [1, 5, 9];
const DUSTHANA = [6, 8, 12];
const BENEFICS = new Set<PlanetName>(["Jupiter", "Venus", "Mercury", "Moon"]);

const BODY: Record<number, string> = {
  1: "head, brain and overall constitution",
  2: "face, eyes, mouth, teeth and throat",
  3: "shoulders, arms, hands, ears and lungs",
  4: "chest, heart and breasts",
  5: "upper abdomen, stomach, liver and spine",
  6: "intestines, digestion and immunity",
  7: "lower abdomen, kidneys and bladder",
  8: "reproductive and excretory organs, chronic conditions",
  9: "hips and thighs",
  10: "knees, joints and bones",
  11: "calves, ankles and circulation",
  12: "feet, sleep and the left eye",
};

const BODY_HI: Record<number, string> = {
  1: "सिर, मस्तिष्क और संपूर्ण शरीर-रचना",
  2: "चेहरा, आँखें, मुख, दाँत और गला",
  3: "कंधे, भुजाएँ, हाथ, कान और फेफड़े",
  4: "छाती, हृदय और वक्ष",
  5: "ऊपरी पेट, आमाशय, यकृत और रीढ़",
  6: "आँतें, पाचन और रोग-प्रतिरोधक क्षमता",
  7: "निचला पेट, गुर्दे और मूत्राशय",
  8: "प्रजनन और उत्सर्जन अंग, पुराने रोग",
  9: "कूल्हे और जाँघें",
  10: "घुटने, जोड़ और हड्डियाँ",
  11: "पिंडलियाँ, टखने और रक्त संचार",
  12: "पैर, नींद और बाईं आँख",
};

const LANDS_IN_HI: Record<number, string> = {
  1: "इस भाव के विषयों को आपसे व्यक्तिगत रूप से जोड़ता है — आप इन्हें जीते और आगे बढ़ाते हैं, और ये आपकी पहचान गढ़ते हैं",
  2: "इस भाव के विषयों को धन, परिवार और वाणी से जोड़ता है — ये आय का स्रोत या पारिवारिक विषय बनते हैं",
  3: "इस भाव के विषयों को आपके अपने प्रयास, साहस, संवाद और भाई-बहनों पर निर्भर बनाता है",
  4: "इस भाव के विषयों की जड़ें घर, माता, संपत्ति और मन की शांति में जमाता है",
  5: "इस भाव के विषयों को बुद्धि, संतान, रचनात्मकता और पूर्व पुण्य से जोड़ता है — एक शुभ प्रवाह",
  6: "इस भाव के विषयों को प्रतियोगिता, सेवा, ऋण या स्वास्थ्य समस्याओं से गुज़ारता है — लाभ बाधाओं पर विजय से आता है",
  7: "इस भाव के विषयों को साझेदारों, विवाह, ग्राहकों और सार्वजनिक व्यवहार के माध्यम से प्रवाहित करता है",
  8: "इस भाव के विषयों को अनिश्चित और परिवर्तनकारी बनाता है — अचानक बदलाव, छिपे विषय, शोध या विरासत",
  9: "इस भाव के विषयों को भाग्य, गुरु, धर्म और लंबी यात्राओं का आशीर्वाद देता है — सर्वश्रेष्ठ स्थितियों में से एक",
  10: "इस भाव के विषयों को करियर और सार्वजनिक प्रतिष्ठा में बदलता है — ये दृश्यमान और कर्म-प्रधान बनते हैं",
  11: "इस भाव के विषयों को लाभ, संपर्कों और पूर्ण इच्छाओं का स्रोत बनाता है",
  12: "इस भाव के विषयों को व्यय, दूरी, विदेश, विश्राम या आध्यात्मिक मुक्ति की ओर भेजता है",
};

export const DIGNITY_WORD_HI: Record<string, string> = {
  Exalted: "उच्च के",
  Moolatrikona: "मूलत्रिकोण राशि में",
  "Own Sign": "स्वराशि में",
  "Friend's Sign": "मित्र राशि में",
  "Neutral Sign": "सम राशि में",
  "Enemy's Sign": "शत्रु राशि में",
  Debilitated: "नीच के",
};

/** What any house lord does when it lands in a given house. */
const LANDS_IN: Record<number, string> = {
  1: "brings this house's matters to you personally — you embody and drive these matters, and they shape your identity",
  2: "ties this house's matters to money, family and speech — they become a source of income or a family matter",
  3: "makes this house's matters depend on your own effort, courage, communication and siblings",
  4: "roots this house's matters in home, mother, property and inner peace",
  5: "links this house's matters with intelligence, children, creativity and past merit — an auspicious flow",
  6: "puts this house's matters through competition, service, debt or health issues — gains come by overcoming obstacles",
  7: "channels this house's matters through partners, marriage, clients and public dealings",
  8: "makes this house's matters uncertain and transformative — sudden changes, hidden matters, research or inheritance",
  9: "blesses this house's matters with luck, teachers, dharma and long journeys — one of the best placements",
  10: "turns this house's matters into career and public standing — they become visible and action-oriented",
  11: "makes this house's matters a source of gains, networks and fulfilled wishes",
  12: "sends this house's matters towards expense, distance, foreign lands, rest or spiritual release",
};

export const DIGNITY_WORD: Record<string, string> = {
  Exalted: "exalted",
  Moolatrikona: "in its Moolatrikona sign",
  "Own Sign": "in its own sign",
  "Friend's Sign": "in a friend's sign",
  "Neutral Sign": "in a neutral sign",
  "Enemy's Sign": "in an enemy's sign",
  Debilitated: "debilitated",
};

const listJoin = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const first = (h: number) => HOUSE_SIGNIFICATION[h].split(",").slice(0, 2).join(" and").replace(" and and", " and");

const firstHi = (h: number) => HOUSE_SIGNIFICATION_HI[h].split(",").slice(0, 2).join(" और");

export function houseReadings(chart: KundaliChart, now = new Date(), locale: Locale = "en"): HouseReading[] {
  const hi = locale === "hi";
  const L = pick(locale);
  const n = (x: string) => term(locale, x);
  const strength = analyzeBhavaStrength(chart.ascendant.signIndex, chart.planets, chart.shadbala, locale);
  const sun = chart.planets.find((p) => p.planet === "Sun")!;
  const horizon = new Date(now.getTime() + 30 * 365.25 * 86400_000);
  const P = new Map(chart.planets.map((p) => [p.planet, p]));

  return Array.from({ length: 12 }, (_, i) => {
    const house = i + 1;
    const ref = HOUSE_REFERENCE[i];
    const hl = chart.houseLords.find((h) => h.house === house)!;
    const signIndex = (chart.ascendant.signIndex + i) % 12;
    const lord = hl.lord;
    const lp = P.get(lord)!;
    const fromItself = ((hl.lordHouse - house + 12) % 12) + 1;

    // Lord placement
    const lordParts = hi
      ? [`${ordHiDirect(house)} भाव ${n(hl.sign)} में पड़ता है, इसलिए इसके स्वामी ${n(lord)} हैं। ${n(lord)} आपके ${ordHi(hl.lordHouse)} भाव में हैं, जो ${LANDS_IN_HI[hl.lordHouse]}।`]
      : [`The ${ordinal(house)} house falls in ${hl.sign}, so ${lord} is its lord. ${lord} sits in your ${ordinal(hl.lordHouse)} house, which ${LANDS_IN[hl.lordHouse]}.`];
    if (hl.lordHouse === house) lordParts.push(L("A lord in its own house protects and sustains everything this house stands for.", "अपने ही भाव में बैठा स्वामी इस भाव के सभी विषयों की रक्षा और पोषण करता है।"));
    else if ([6, 8, 12].includes(fromItself))
      lordParts.push(
        L(
          `It is ${ordinal(fromItself)} from the house it rules, a classically weak link — this house's matters meet ${fromItself === 6 ? "obstacles and disputes" : fromItself === 8 ? "disruptions and sudden turns" : "losses or distance"} before they settle.`,
          `ये अपने भाव से ${ordHi(fromItself)} स्थान पर हैं, जो शास्त्रीय रूप से कमज़ोर संबंध है — इस भाव के विषय स्थिर होने से पहले ${fromItself === 6 ? "बाधाओं और विवादों" : fromItself === 8 ? "व्यवधानों और अचानक मोड़ों" : "हानि या दूरी"} से गुज़रते हैं।`
        )
      );
    else if ([1, 4, 7, 10, 5, 9].includes(fromItself)) lordParts.push(L(`It is ${ordinal(fromItself)} from the house it rules, a supportive angle for this house.`, `ये अपने भाव से ${ordHi(fromItself)} स्थान पर हैं, जो इस भाव के लिए सहायक कोण है।`));
    if (lp.dignity) {
      const strong = lp.dignity === "Exalted" || lp.dignity === "Own Sign" || lp.dignity === "Moolatrikona";
      lordParts.push(
        hi
          ? `${n(lord)} ${DIGNITY_WORD_HI[lp.dignity]} हैं${strong ? ", इसलिए प्रबल फल देते हैं" : lp.dignity === "Debilitated" ? ", इसलिए सहारे के बिना फल देने में संघर्ष करते हैं" : lp.dignity === "Enemy's Sign" ? ", जिससे इनके फलों पर दबाव पड़ता है" : ""}।`
          : `${lord} is ${DIGNITY_WORD[lp.dignity]}${strong ? ", so it delivers strongly" : lp.dignity === "Debilitated" ? ", so it struggles to deliver without support" : lp.dignity === "Enemy's Sign" ? ", which strains its results" : ""}.`
      );
    }
    if (lord !== "Sun" && isCombust(lp, sun)) lordParts.push(L(`${lord} is combust, so the house's results need extra conscious effort.`, `${n(lord)} अस्त हैं, इसलिए इस भाव के फलों के लिए अतिरिक्त सजग प्रयास चाहिए।`));
    if (lp.retrograde && lord !== "Rahu" && lord !== "Ketu") lordParts.push(L(`${lord} is retrograde: results come after revisiting, delay or an unconventional route.`, `${n(lord)} वक्री हैं: फल दोहराव, देरी या अपरंपरागत मार्ग से आते हैं।`));

    // Occupants
    const occupants = chart.planets
      .filter((p) => p.house === house)
      .map((p) => {
        const ruled = chart.houseLords.filter((h) => h.lord === p.planet).map((h) => h.house);
        return {
          planet: p.planet,
          text: hi ? PLANET_IN_HOUSES_HI[p.planet][i] : PLANET_REFERENCE.find((r) => r.name === p.planet)!.inHouses[i],
          note: ruled.length
            ? L(`As lord of your ${ruled.map(ordinal).join(" and ")}, it brings ${ruled.map(first).join(" and ")} into this house.`, `आपके ${ruled.map(ordHi).join(" और ")} भाव के स्वामी होने से ये ${ruled.map(firstHi).join(" और ")} को इस भाव में लाते हैं।`)
            : undefined,
        };
      });

    // Aspects (graha drishti) on this house's sign
    const aspects = chart.planets
      .filter((p) => p.house !== house && getAspectedHouses(p.planet).includes(((signIndex - p.signIndex + 12) % 12) + 1))
      .map((p) => ({ planet: p.planet, benefic: BENEFICS.has(p.planet) }));
    const good = aspects.filter((a) => a.benefic).map((a) => a.planet);
    const join = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
    const bad = aspects.filter((a) => !a.benefic).map((a) => a.planet);
    const aspectText = hi
      ? aspects.length
        ? [good.length ? `${listHi(good.map(n))} की इस भाव पर दृष्टि है और ये इसकी रक्षा करते हैं` : "", bad.length ? `${listHi(bad.map(n))} की दृष्टि दबाव, उत्साह या देरी जोड़ती है` : ""].filter(Boolean).join("; ") + "।"
        : "इस भाव पर किसी ग्रह की दृष्टि नहीं है, इसलिए इसके फल इसके स्वामी और इसमें बैठे ग्रह ही तय करते हैं।"
      : aspects.length
      ? [good.length ? `${join(good)} ${good.length > 1 ? "aspect this house and protect it" : "aspects this house and protects it"}` : "", bad.length ? `${join(bad)} ${bad.length > 1 ? "aspect" : "aspects"} it, adding pressure, drive or delay` : ""]
          .filter(Boolean)
          .join("; ") + "."
      : "No planet aspects this house, so its lord and occupants decide its results on their own.";

    // Natural significators
    const karakas = ref.karaka.map((k) => {
      const kp = P.get(k)!;
      const bala = chart.shadbala.find((s) => s.planet === k);
      return {
        planet: k,
        text: hi
          ? `नैसर्गिक कारक ${n(k)} आपके ${ordHi(kp.house)} भाव में हैं${kp.dignity ? ` (${n(kp.dignity)})` : ""}${bala ? ` और षड्बल से ${bala.isStrong ? "बलवान" : "बल में कम"} हैं` : ""}।`
          : `${k}, the natural significator, sits in your ${ordinal(kp.house)}${kp.dignity ? ` (${kp.dignity.toLowerCase()})` : ""}${bala ? ` and is ${bala.isStrong ? "strong" : "below strength"} by Shadbala` : ""}.`,
      };
    });
    if (ref.karaka.some((k) => P.get(k)!.house === house) && ref.karaka.length) {
      karakas.push({ planet: ref.karaka[0], text: L("A significator sitting in its own house can, classically, overdo its results here (karako bhava nashaya) — balance is needed.", "अपने ही भाव में बैठा कारक, शास्त्रों के अनुसार, यहाँ के फल अधिक कर सकता है (कारको भाव नाशाय) — संतुलन चाहिए।") });
    }

    const sav = chart.ashtakavarga.sarva[signIndex];
    const savText = hi
      ? `${sav} सर्वाष्टकवर्ग बिंदु (28 औसत है)। ${sav >= 30 ? "इस राशि से गोचर अच्छे फल देते हैं, और भाव को अच्छा सहारा है।" : sav <= 24 ? "कम अंक — यहाँ गोचर इन विषयों पर दबाव डालते हैं; इन्हें सावधानी से संभालें।" : "औसत अंक।"}`
      : `${sav} Sarvashtakavarga bindus (28 is average). ${sav >= 30 ? "Transits through this sign bring good results, and the house is well supported." : sav <= 24 ? "A low score — transits here tend to strain these matters; handle them with care." : "An average score."}`;

    const st = strength[i];
    const verdictWord = st.verdict === "Strong" ? "well supported" : st.verdict === "Balanced" ? "moderately supported" : "in need of care";
    const summaryHi = `आपका ${ordHiDirect(house)} भाव — ${firstHi(house)} — ${st.verdict === "Strong" ? "अच्छी तरह समर्थित" : st.verdict === "Balanced" ? "मध्यम रूप से समर्थित" : "देखभाल की आवश्यकता में"} है। ${
      KENDRA.includes(hl.lordHouse) || TRIKONA.includes(hl.lordHouse) ? `इसके स्वामी का ${TRIKONA.includes(hl.lordHouse) ? "त्रिकोण" : "केंद्र"} में होना एक शक्ति है।` : DUSTHANA.includes(hl.lordHouse) ? "इसके स्वामी के दुःस्थान में होने से फल प्रयास और समय से मिलते हैं।" : ""
    } ${occupants.length ? `${listHi(occupants.map((o) => n(o.planet)))} यहाँ रहकर इसे रंगते${occupants.length > 1 ? " हैं" : " है"}।` : "यह ख़ाली है, इसलिए इसे इसके स्वामी से पढ़ें।"}`.replace(/\s+/g, " ");
    const summaryEn = `Your ${ordinal(house)} house of ${first(house)} is ${verdictWord}. ${
      KENDRA.includes(hl.lordHouse) || TRIKONA.includes(hl.lordHouse) ? `Its lord in a ${TRIKONA.includes(hl.lordHouse) ? "trikona" : "kendra"} is a strength.` : DUSTHANA.includes(hl.lordHouse) ? "Its lord in a dusthana means results come through effort and time." : ""
    } ${occupants.length ? `${listJoin(occupants.map((o) => o.planet))} ${occupants.length > 1 ? "live" : "lives"} here and colour${occupants.length > 1 ? "" : "s"} it.` : "It is empty, so read it through its lord."}`.replace(/\s+/g, " ");

    // Periods: Antardashas of the lord and occupants, upcoming within ~30 years
    const relevant = new Set<PlanetName>([lord, ...occupants.map((o) => o.planet)]);
    const periods: HouseReading["periods"] = [];
    for (const md of chart.dashas) {
      for (const ad of md.subPeriods ?? []) {
        const s = new Date(ad.start);
        const e = new Date(ad.end);
        if (e < now || s > horizon) continue;
        const hit = [md.lord, ad.lord].filter((l) => relevant.has(l as PlanetName));
        if (!hit.length || !relevant.has(ad.lord as PlanetName)) continue;
        periods.push({
          label: `${n(md.lord)}–${n(ad.lord)}`,
          start: s,
          end: e,
          why: ad.lord === lord ? L(`${lord} rules this house`, `${n(lord)} इस भाव के स्वामी हैं`) : L(`${ad.lord} sits in this house`, `${n(ad.lord)} इस भाव में बैठे हैं`),
        });
        if (periods.length >= 4) break;
      }
      if (periods.length >= 4) break;
    }

    return {
      house,
      sanskrit: hi ? HOUSE_SANSKRIT_HI[i] : ref.sanskritName,
      classification: hi ? ref.classification.map((c) => HOUSE_CLASS_HI[c]) : ref.classification,
      themes: hi ? HOUSE_SIGNIFICATION_HI[house] : HOUSE_SIGNIFICATION[house],
      sign: hl.sign,
      lord,
      lordHouse: hl.lordHouse,
      lordSign: hl.lordSign,
      lordText: lordParts.join(" "),
      occupants,
      aspects,
      aspectText,
      karakas,
      sav,
      savText,
      strength: { score: Math.round(st.score), verdict: st.verdict, rationale: st.rationale },
      body: hi ? BODY_HI[house] : BODY[house],
      summary: hi ? summaryHi : summaryEn,
      periods,
    };
  });
}

