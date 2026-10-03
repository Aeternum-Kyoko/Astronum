import { SIGNS, SIGN_LORDS, type PlanetName } from "./constants";
import { getAspectedHouses } from "./aspects";
import { getDignity } from "./dignity";
import { analyzeBhavaStrength } from "./bhavaStrength";
import { SIGN_REFERENCE } from "./reference/signs";
import type { KundaliChart } from "./types";
import { DIGNITY_WORD, DIGNITY_WORD_HI } from "./houseReadings";
import type { Locale } from "../i18n/locale";
import { pick } from "../i18n/ui";
import { term } from "../i18n/terms";
import { listHi, ordHi } from "../i18n/hiGrammar";

/**
 * Career from the chart the way an astrologer builds it up:
 *  - the 10th house: its sign, lord, occupants and aspects;
 *  - the Dasamsa (D10): its ascendant, and where the D1 10th lord lands in it;
 *  - the Jaimini Amatyakaraka, the "minister" planet of profession;
 *  - every planet's link to the 10th, weighted, which ranks the fields;
 *  - the 6th (service) against the 7th (trade and partners) for job or business;
 *  - the dasha periods that activate career, split into rise and change.
 */

export interface CareerInfluence {
  planet: PlanetName;
  weight: number;
  why: string[];
}

export interface CareerAnalysis {
  tenth: {
    sign: string;
    lord: PlanetName;
    lordHouse: number;
    occupants: PlanetName[];
    aspectedBy: PlanetName[];
    text: string[];
  };
  d10: { ascendant: string; text: string[] } | null;
  atmakaraka: PlanetName;
  amatyakaraka: PlanetName;
  amatyaText: string;
  influences: CareerInfluence[];
  fields: { planet: PlanetName; fields: string[]; why: string }[];
  signStyle: string;
  mode: {
    verdict: "Job" | "Business" | "Either";
    jobScore: number;
    businessScore: number;
    reasons: string[];
  };
  periods: {
    label: string;
    start: Date;
    end: Date;
    kind: "Rise" | "Change" | "Steady";
    why: string;
  }[];
}

export const CAREER_FIELDS: Record<PlanetName, string[]> = {
  Sun: [
    "Government and civil services",
    "Administration and management",
    "Politics",
    "Medicine (especially cardiology)",
    "Leadership roles",
  ],
  Moon: [
    "Hospitality and food",
    "Nursing and care work",
    "Public relations and sales",
    "Dairy, water and shipping",
    "Psychology and counselling",
  ],
  Mars: [
    "Engineering",
    "Army, police and defence",
    "Surgery",
    "Real estate and construction",
    "Sports",
    "Manufacturing",
  ],
  Mercury: [
    "Business and trade",
    "Accounting and finance",
    "Writing, media and journalism",
    "IT and software",
    "Teaching languages and maths",
    "Consulting",
  ],
  Jupiter: [
    "Teaching and academia",
    "Law and judiciary",
    "Banking and investment",
    "Priesthood and counselling",
    "Finance advisory",
  ],
  Venus: [
    "Arts, music and film",
    "Fashion and design",
    "Luxury, beauty and cosmetics",
    "Hotels and entertainment",
    "Vehicles and interiors",
  ],
  Saturn: [
    "Industry and heavy machinery",
    "Mining, oil and labour-intensive trades",
    "Civil engineering and infrastructure",
    "Law enforcement and administration",
    "Social work",
  ],
  Rahu: [
    "Technology and research into the new",
    "Foreign trade and multinational firms",
    "Aviation",
    "Media, advertising and politics",
    "Pharmaceuticals",
  ],
  Ketu: [
    "Research and investigation",
    "Spiritual and healing work",
    "Coding and technical niches",
    "Astrology and occult sciences",
    "Alternative medicine",
  ],
};

export const CAREER_FIELDS_HI: Record<PlanetName, string[]> = {
  Sun: [
    "सरकारी और प्रशासनिक सेवाएँ",
    "प्रशासन और प्रबंधन",
    "राजनीति",
    "चिकित्सा (विशेषकर हृदय रोग)",
    "नेतृत्व की भूमिकाएँ",
  ],
  Moon: [
    "आतिथ्य और खाद्य",
    "नर्सिंग और देखभाल",
    "जनसंपर्क और बिक्री",
    "डेयरी, जल और जहाज़रानी",
    "मनोविज्ञान और परामर्श",
  ],
  Mars: [
    "इंजीनियरिंग",
    "सेना, पुलिस और रक्षा",
    "शल्य चिकित्सा",
    "रियल एस्टेट और निर्माण",
    "खेल",
    "उत्पादन",
  ],
  Mercury: [
    "व्यापार और वाणिज्य",
    "लेखा और वित्त",
    "लेखन, मीडिया और पत्रकारिता",
    "आईटी और सॉफ़्टवेयर",
    "भाषा और गणित का शिक्षण",
    "परामर्श सेवाएँ",
  ],
  Jupiter: [
    "शिक्षण और अकादमिक क्षेत्र",
    "क़ानून और न्यायपालिका",
    "बैंकिंग और निवेश",
    "पौरोहित्य और मार्गदर्शन",
    "वित्तीय सलाह",
  ],
  Venus: [
    "कला, संगीत और फ़िल्म",
    "फ़ैशन और डिज़ाइन",
    "विलासिता, सौंदर्य और प्रसाधन",
    "होटल और मनोरंजन",
    "वाहन और इंटीरियर",
  ],
  Saturn: [
    "उद्योग और भारी मशीनरी",
    "खनन, तेल और श्रम-प्रधान व्यवसाय",
    "सिविल इंजीनियरिंग और इंफ़्रास्ट्रक्चर",
    "क़ानून-व्यवस्था और प्रशासन",
    "समाज सेवा",
  ],
  Rahu: [
    "तकनीक और नए क्षेत्रों में शोध",
    "विदेश व्यापार और बहुराष्ट्रीय कंपनियाँ",
    "विमानन",
    "मीडिया, विज्ञापन और राजनीति",
    "फ़ार्मास्युटिकल्स",
  ],
  Ketu: [
    "शोध और अन्वेषण",
    "आध्यात्मिक और उपचार कार्य",
    "कोडिंग और तकनीकी विशेषज्ञता",
    "ज्योतिष और गूढ़ विद्या",
    "वैकल्पिक चिकित्सा",
  ],
};

const ELEMENT_STYLE_HI: Record<string, string> = {
  Fire: "आप वहाँ सबसे अच्छा काम करते हैं जहाँ नेतृत्व, पहल और दृश्यता हो।",
  Earth:
    "आप व्यावहारिक, मापने योग्य परिणामों के साथ सबसे अच्छा काम करते हैं — धन, व्यवस्थाएँ और भौतिक वस्तुएँ।",
  Air: "आप विचारों, लोगों और संवाद के साथ सबसे अच्छा काम करते हैं।",
  Water:
    "आप वहाँ सबसे अच्छा काम करते हैं जहाँ देखभाल, अंतर्ज्ञान और भावनात्मक समझ महत्वपूर्ण हो।",
};

const TENTH_LORD_IN_HI: Record<number, string> = {
  1: "करियर स्व-निर्मित है और आपके व्यक्तित्व से जुड़ा है — आप स्वयं अपना ब्रांड हैं।",
  2: "करियर परिवार, वित्त, वाणी या खाद्य से बढ़ता है; काम की कमाई अच्छी तरह संचित होती है।",
  3: "संवाद, मीडिया, बिक्री, यात्रा और आपकी अपनी पहल करियर को चलाते हैं।",
  4: "काम संपत्ति, वाहन, शिक्षा या घर से जुड़ता है; संभवतः घर से या पारिवारिक व्यवसाय में काम।",
  5: "बुद्धि और रचनात्मकता आगे रहती हैं — शिक्षण, सलाह, सट्टा या रचनात्मक क्षेत्र; एक शुभ स्थिति।",
  6: "सेवा, प्रतियोगिता, स्वास्थ्य, क़ानून या वित्त से जुड़ी नौकरी; प्रतिद्वंद्वियों को हराकर सफलता।",
  7: "साझेदारी, ग्राहक, व्यापार और विदेशी व्यवहार; व्यवसाय अनुकूल है।",
  8: "करियर में अचानक मोड़; शोध, बीमा, गूढ़ विद्या, खनन या पर्दे के पीछे का काम उपयुक्त, और विराम भी आ सकते हैं।",
  9: "भाग्य करियर का साथ देता है — शिक्षण, क़ानून, धर्म, दूर के काम; गुरु सहायता करते हैं।",
  10: "स्वामी अपने ही भाव में — मज़बूत, स्थिर करियर और सार्वजनिक प्रतिष्ठा।",
  11: "करियर लाभ और संपर्क लाता है; बड़ी संस्थाएँ और पूरी होती महत्वाकांक्षाएँ।",
  12: "विदेश, अस्पताल, आश्रम, जेल या पर्दे के पीछे काम; काम से जुड़े ख़र्च।",
};

const ELEMENT_STYLE: Record<string, string> = {
  Fire: "You work best where you can lead, initiate and be visible.",
  Earth:
    "You work best with practical, measurable results — money, systems and material things.",
  Air: "You work best with ideas, people and communication.",
  Water:
    "You work best where care, intuition and emotional intelligence matter.",
};

const listOf = (xs: string[]) =>
  xs.length <= 1
    ? xs.join("")
    : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;
const ordinal = (n: number) =>
  `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const dist = (from: number, to: number) => ((to - from + 12) % 12) + 1;

export function careerAnalysis(
  chart: KundaliChart,
  now = new Date(),
  locale: Locale = "en",
): CareerAnalysis {
  const hi = locale === "hi";
  const L = pick(locale);
  const n = (x: string) => term(locale, x);
  const style =
    (hi ? ELEMENT_STYLE_HI : ELEMENT_STYLE)[
      SIGN_REFERENCE[(chart.ascendant.signIndex + 9) % 12].element
    ] ?? "";
  const FIELDS = hi ? CAREER_FIELDS_HI : CAREER_FIELDS;
  const P = new Map(chart.planets.map((p) => [p.planet, p]));
  const lagna = chart.ascendant.signIndex;
  const tenthSign = (lagna + 9) % 12;
  const lordOf = (h: number) => SIGN_LORDS[(lagna + h - 1) % 12] as PlanetName;
  const l10 = lordOf(10);
  const pl10 = P.get(l10)!;
  const occupants = chart.planets
    .filter((p) => p.house === 10)
    .map((p) => p.planet);
  const aspectedBy = chart.planets
    .filter(
      (p) =>
        p.house !== 10 &&
        getAspectedHouses(p.planet).includes(dist(p.signIndex, tenthSign)),
    )
    .map((p) => p.planet);

  const tenthText = hi
    ? [
        `आपका दसवाँ भाव ${n(SIGNS[tenthSign])} में है, जिसके स्वामी ${n(l10)} हैं। ${style}`,
        `दशमेश ${n(l10)} आपके ${ordHi(pl10.house)} भाव में हैं${pl10.dignity ? `, ${DIGNITY_WORD_HI[pl10.dignity]}` : ""}। ${TENTH_LORD_IN_HI[pl10.house]}`,
        occupants.length
          ? `दसवें भाव में ${listHi(occupants.map(n))} हैं — ${occupants.map((o) => CAREER_FIELDS_HI[o][0]).join(", ")} और ऐसे क्षेत्र स्वाभाविक रूप से आते हैं।`
          : "दसवाँ भाव ख़ाली है, इसलिए इसके स्वामी और इस पर दृष्टि डालने वाले ग्रह दिशा तय करते हैं।",
        aspectedBy.length
          ? `${listHi(aspectedBy.map(n))} की दसवें भाव पर दृष्टि है और ये अपना रंग जोड़ते हैं।`
          : "",
      ].filter(Boolean)
    : [
        `Your 10th house falls in ${SIGNS[tenthSign]}, ruled by ${l10}. ${ELEMENT_STYLE[SIGN_REFERENCE[tenthSign].element] ?? ""}`,
        `The 10th lord ${l10} sits in your ${ordinal(pl10.house)} house${pl10.dignity ? `, ${DIGNITY_WORD[pl10.dignity]}` : ""}. ${TENTH_LORD_IN[pl10.house]}`,
        occupants.length
          ? `${listOf(occupants)} ${occupants.length > 1 ? "occupy" : "occupies"} the 10th — ${occupants.map((o) => CAREER_FIELDS[o][0].toLowerCase()).join(", ")} and similar fields come naturally.`
          : "The 10th is empty, so its lord and the planets aspecting it decide the direction.",
        aspectedBy.length
          ? `${listOf(aspectedBy)} ${aspectedBy.length > 1 ? "aspect the 10th house and add their" : "aspects the 10th house and adds its"} flavour.`
          : "",
      ].filter(Boolean);

  // D10
  const D10 = chart.divisionalCharts.D10;
  let d10: CareerAnalysis["d10"] = null;
  if (D10) {
    const asc = D10.ascendant.signIndex;
    const d10Lord = SIGN_LORDS[asc] as PlanetName;
    const inD10 = (pl: PlanetName) => {
      const x = D10.planets.find((p) => p.planet === pl);
      return x ? dist(asc, x.signIndex) : null;
    };
    const l10InD10 = inD10(l10);
    const lordInD10 = inD10(d10Lord);
    const good = (h: number | null) =>
      h !== null && [1, 4, 5, 7, 9, 10, 11].includes(h);
    const d10Dig = (() => {
      const x = D10.planets.find((p) => p.planet === l10);
      return x ? getDignity(l10, x.signIndex) : null;
    })();
    d10 = {
      ascendant: D10.ascendant.sign,
      text: hi
        ? [
            `दशमांश (D10), यानी करियर का चार्ट, ${n(D10.ascendant.sign)} लग्न का है, जिसके स्वामी ${n(d10Lord)} उसके ${lordInD10 ? ordHi(lordInD10) : "—"} भाव में हैं — ${good(lordInD10) ? "पेशेवर उन्नति के लिए सहायक स्थिति" : "ऐसी स्थिति जिसमें करियर की उन्नति के लिए अधिक प्रयास चाहिए"}।`,
            l10InD10 !== null
              ? `आपके जन्म कुंडली के दशमेश ${n(l10)} D10 के ${ordHi(l10InD10)} भाव में हैं${d10Dig ? ` (${n(d10Dig)})` : ""} — ${good(l10InD10) ? "जो जन्म कुंडली के करियर के वादे की पुष्टि करता है" : "इसलिए जन्म कुंडली का वादा अधिक संघर्ष से पूरा होता है"}।`
              : "",
          ].filter(Boolean)
        : [
            `The Dasamsa (D10), the chart of career, rises in ${D10.ascendant.sign}, ruled by ${d10Lord}, which sits in its ${lordInD10 ? ordinal(lordInD10) : "—"} house — ${good(lordInD10) ? "a supportive placement for professional growth" : "a placement that makes career growth take more effort"}.`,
            l10InD10 !== null
              ? `Your D1 10th lord ${l10} falls in the ${ordinal(l10InD10)} house of the D10${d10Dig ? ` (${d10Dig.toLowerCase()})` : ""} — ${good(l10InD10) ? "confirming the career promise of the birth chart" : "so the birth chart's promise is delivered with more struggle"}.`
              : "",
          ].filter(Boolean),
    };
  }

  // Jaimini karakas: seven planets by degree within their sign, highest first.
  const byDegree = chart.planets
    .filter((p) => p.planet !== "Rahu" && p.planet !== "Ketu")
    .sort((a, b) => b.degreeInSign - a.degreeInSign);
  const atmakaraka = byDegree[0].planet;
  const amatyakaraka = byDegree[1].planet;
  const amk = P.get(amatyakaraka)!;
  const amatyaText = hi
    ? `${n(amatyakaraka)} का अंश दूसरा सबसे ऊँचा है (${n(amk.sign)} में ${amk.degreeInSign.toFixed(1)}°), इसलिए ये आपके अमात्यकारक हैं — जैमिनी ज्योतिष में व्यवसाय के लिए पढ़ा जाने वाला ग्रह। ये आपके ${ordHi(amk.house)} भाव में हैं, जो ${CAREER_FIELDS_HI[amatyakaraka].slice(0, 2).join(" या ")} की ओर संकेत करता है।`
    : `${amatyakaraka} has the second-highest degree (${amk.degreeInSign.toFixed(1)}° in ${amk.sign}), making it your Amatyakaraka — the planet Jaimini astrology reads for profession. It sits in your ${ordinal(amk.house)} house, pointing to ${CAREER_FIELDS[amatyakaraka].slice(0, 2).join(" or ").toLowerCase()}.`;

  // Weighted influences on career
  const infl = new Map<PlanetName, CareerInfluence>();
  const add = (pl: PlanetName, w: number, why: string) => {
    const e = infl.get(pl) ?? { planet: pl, weight: 0, why: [] };
    e.weight += w;
    e.why.push(why);
    infl.set(pl, e);
  };
  add(l10, 4, L("rules the 10th house", "दसवें भाव के स्वामी हैं"));
  occupants.forEach((o) =>
    add(o, 4, L("sits in the 10th house", "दसवें भाव में बैठे हैं")),
  );
  aspectedBy.forEach((a) =>
    add(a, 2, L("aspects the 10th house", "दसवें भाव पर दृष्टि डालते हैं")),
  );
  add(amatyakaraka, 3, L("is the Amatyakaraka", "अमात्यकारक हैं"));
  if (D10) {
    add(
      SIGN_LORDS[D10.ascendant.signIndex] as PlanetName,
      2,
      L("rules the D10 ascendant", "D10 लग्न के स्वामी हैं"),
    );
    D10.planets
      .filter(
        (p) =>
          dist(D10.ascendant.signIndex, p.signIndex) === 10 ||
          dist(D10.ascendant.signIndex, p.signIndex) === 1,
      )
      .forEach((p) =>
        add(
          p.planet,
          2,
          L(
            `sits in the ${dist(D10.ascendant.signIndex, p.signIndex) === 1 ? "1st" : "10th"} house of the D10`,
            `D10 के ${dist(D10.ascendant.signIndex, p.signIndex) === 1 ? "पहले" : "दसवें"} भाव में बैठे हैं`,
          ),
        ),
      );
  }
  // The planet in the sign of the 10th lord (the dispositor chain) colours too
  const disp = SIGN_LORDS[pl10.signIndex] as PlanetName;
  if (disp !== l10)
    add(
      disp,
      1,
      L("is the dispositor of the 10th lord", "दशमेश के राशि-स्वामी हैं"),
    );
  for (const e of infl.values()) {
    const bala = chart.shadbala.find((s) => s.planet === e.planet);
    if (bala?.isStrong) {
      e.weight += 1;
      e.why.push(L("is strong by Shadbala", "षड्बल से बलवान हैं"));
    }
  }
  const influences = [...infl.values()].sort((a, b) => b.weight - a.weight);
  const fields = influences
    .slice(0, 3)
    .map((e) => ({
      planet: e.planet,
      fields: FIELDS[e.planet],
      why: hi
        ? `${n(e.planet)} ${listHi(e.why)}।`
        : `${e.planet} ${e.why.join(", ")}.`,
    }));

  // Job or business
  const bhava = analyzeBhavaStrength(
    lagna,
    chart.planets,
    chart.shadbala,
    locale,
  );
  const reasons: string[] = [];
  let job = bhava[5].score / 10;
  let biz = bhava[6].score / 10;
  reasons.push(
    L(
      `6th house (service) strength ${Math.round(bhava[5].score)}/100; 7th house (trade, partners, clients) ${Math.round(bhava[6].score)}/100.`,
      `छठे भाव (सेवा) का बल ${Math.round(bhava[5].score)}/100; सातवें भाव (व्यापार, साझेदार, ग्राहक) का ${Math.round(bhava[6].score)}/100।`,
    ),
  );
  if (pl10.house === 6 || pl10.house === 10) {
    job += 3;
    reasons.push(
      L(
        `10th lord in the ${ordinal(pl10.house)} favours employment and service.`,
        `दशमेश का ${ordHi(pl10.house)} भाव में होना नौकरी और सेवा के अनुकूल है।`,
      ),
    );
  }
  if (pl10.house === 7 || pl10.house === 3 || pl10.house === 11) {
    biz += 3;
    reasons.push(
      L(
        `10th lord in the ${ordinal(pl10.house)} favours independent work, trade or business.`,
        `दशमेश का ${ordHi(pl10.house)} भाव में होना स्वतंत्र कार्य, व्यापार या व्यवसाय के अनुकूल है।`,
      ),
    );
  }
  const mercury = chart.shadbala.find((s) => s.planet === "Mercury");
  if (mercury?.isStrong) {
    biz += 2;
    reasons.push(
      L(
        "A strong Mercury, the planet of commerce, supports business.",
        "वाणिज्य के ग्रह बुध का बलवान होना व्यवसाय में सहायक है।",
      ),
    );
  }
  const saturn = chart.shadbala.find((s) => s.planet === "Saturn");
  if (saturn?.isStrong) {
    job += 2;
    reasons.push(
      L(
        "A strong Saturn, the planet of service and structure, supports steady employment.",
        "सेवा और व्यवस्था के ग्रह शनि का बलवान होना स्थिर नौकरी में सहायक है।",
      ),
    );
  }
  const l7 = P.get(lordOf(7))!;
  if ([1, 10, 11].includes(l7.house)) {
    biz += 2;
    reasons.push(
      L(
        `The 7th lord in the ${ordinal(l7.house)} brings business partners and clients.`,
        `सप्तमेश का ${ordHi(l7.house)} भाव में होना व्यापारिक साझेदार और ग्राहक लाता है।`,
      ),
    );
  }
  if (P.get("Rahu")!.house === 10 || P.get("Rahu")!.house === 7) {
    biz += 1;
    reasons.push(
      L(
        "Rahu in the 10th or 7th adds appetite for risk and enterprise.",
        "दसवें या सातवें भाव में राहु जोखिम और उद्यम की रुचि बढ़ाते हैं।",
      ),
    );
  }
  const verdict =
    Math.abs(job - biz) < 1.5 ? "Either" : job > biz ? "Job" : "Business";

  // Career periods
  const careerPlanets = new Set<PlanetName>([l10, ...occupants, amatyakaraka]);
  const changePlanets = new Set<PlanetName>([
    "Rahu",
    "Ketu",
    lordOf(8),
    lordOf(12),
  ]);
  const periods: CareerAnalysis["periods"] = [];
  const birth = new Date(chart.utcDate).getTime();
  for (const md of chart.dashas) {
    for (const ad of md.subPeriods ?? []) {
      const s = new Date(ad.start);
      const e = new Date(ad.end);
      const age = (s.getTime() - birth) / (365.25 * 86400_000);
      if (e < now || age > 70) continue;
      const lordsHere = [md.lord, ad.lord] as PlanetName[];
      const careerHit = lordsHere.filter((l) => careerPlanets.has(l));
      if (
        !careerPlanets.has(ad.lord as PlanetName) &&
        !(careerHit.length && changePlanets.has(ad.lord as PlanetName))
      )
        continue;
      const change =
        changePlanets.has(ad.lord as PlanetName) &&
        !careerPlanets.has(ad.lord as PlanetName);
      const riseFactor =
        [lordOf(11), lordOf(9), lordOf(5)].includes(ad.lord as PlanetName) ||
        careerHit.length === 2;
      periods.push({
        label: `${n(md.lord)}–${n(ad.lord)}`,
        start: s,
        end: e,
        kind: change ? "Change" : riseFactor ? "Rise" : "Steady",
        why: hi
          ? change
            ? `${n(ad.lord)} बदलाव, नौकरी परिवर्तन या नई दिशाएँ लाते हैं, जबकि ${careerHit.map(n).join(" और ")} करियर को केंद्र में रखते हैं`
            : `${n(ad.lord)} ${ad.lord === l10 ? "दसवें भाव के स्वामी हैं" : occupants.includes(ad.lord as PlanetName) ? "दसवें भाव में बैठे हैं" : "अमात्यकारक हैं"}${careerHit.length === 2 ? `, और ${n(md.lord)} भी करियर ग्रह हैं` : ""}`
          : change
            ? `${ad.lord} brings shifts, job changes or new directions while ${careerHit.join(" and ")} keep career in focus`
            : `${ad.lord} ${ad.lord === l10 ? "rules the 10th" : occupants.includes(ad.lord as PlanetName) ? "sits in the 10th" : "is the Amatyakaraka"}${careerHit.length === 2 ? `, and ${md.lord} is also a career planet` : ""}`,
      });
      if (periods.length >= 8) break;
    }
    if (periods.length >= 8) break;
  }

  return {
    tenth: {
      sign: SIGNS[tenthSign],
      lord: l10,
      lordHouse: pl10.house,
      occupants,
      aspectedBy,
      text: tenthText,
    },
    d10,
    atmakaraka,
    amatyakaraka,
    amatyaText,
    influences,
    fields,
    signStyle: style,
    mode: {
      verdict,
      jobScore: Math.round(job * 10) / 10,
      businessScore: Math.round(biz * 10) / 10,
      reasons,
    },
    periods,
  };
}

const TENTH_LORD_IN: Record<number, string> = {
  1: "Career is self-made and tied to your personality — you are your own brand.",
  2: "Career grows out of family, finance, speech or food; earnings from work accumulate well.",
  3: "Communication, media, sales, travel and your own initiative drive the career.",
  4: "Work connects to property, vehicles, education or home; possibly working from home or in a family concern.",
  5: "Intelligence and creativity lead — teaching, advisory, speculation or creative fields; an auspicious placement.",
  6: "Service, competition, health, law or finance-related employment; success by beating rivals.",
  7: "Partnerships, clients, trade and foreign dealings; business is favoured.",
  8: "Career has sudden turns; research, insurance, occult, mining or hidden work suits, and there may be breaks.",
  9: "Fortune supports career — teaching, law, religion, long-distance work; mentors help.",
  10: "The lord in its own house — a strong, stable career and public reputation.",
  11: "Career brings gains and networks; large organisations and fulfilled ambitions.",
  12: "Work abroad, in hospitals, ashrams, prisons or behind the scenes; expenses tied to work.",
};
