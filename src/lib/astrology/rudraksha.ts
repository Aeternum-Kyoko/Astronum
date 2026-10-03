import { SIGN_LORDS, type PlanetName } from "./constants";
import { nakshatraLord } from "./dasha";
import { planetDiagnosis, type PlanetDiagnosis } from "./planetDiagnosis";
import type { KundaliChart } from "./types";
import type { Locale } from "../i18n/locale";
import { term } from "../i18n/terms";
import { BUYING_HI, CARE_HI, ENERGISING_HI, GOAL_HI, GRADE_HI, MANTRA_HI, MUKHIS_HI, WEARING_HI } from "./rudraksha.hi";

/**
 * Rudraksha suggestions read from the birth chart. Each graha has its mukhi
 * (the classical correspondence used in Jyotish), so the question is which
 * grahas this chart most needs to support. Candidates are scored, with every
 * reason kept: the Lagna lord (lifelong), the Moon-sign and birth-star lords,
 * the running Mahadasha and Antardasha lords, helpful planets that are weak,
 * and planets behind an active affliction (Sade Sati, Mangal, Kaal Sarp or
 * Pitra dosha). Unlike gemstones, rudraksha is traditionally held safe for any
 * planet — it calms a troublesome graha rather than amplifying it — so weak or
 * afflicting planets can be supported freely.
 */

export interface Mukhi {
  mukhi: string;
  name: string;
  planet: PlanetName | null;
  deity: string;
  mantra: string;
  benefits: string[];
  note?: string;
}

export const MUKHIS: Record<string, Mukhi> = {
  "1": {
    mukhi: "1",
    name: "Ek Mukhi",
    planet: "Sun",
    deity: "Lord Shiva",
    mantra: "Om Hreem Namah",
    benefits: ["Self-confidence, authority and leadership", "Clarity of purpose and spiritual focus", "Support for the heart, eyes and vitality"],
    note: "Genuine Ek Mukhi is rare and costly; the half-moon (kaju) form from India is the usual genuine one. 12 Mukhi is the practical Sun bead.",
  },
  "2": {
    mukhi: "2",
    name: "Do Mukhi",
    planet: "Moon",
    deity: "Ardhanarishvara (Shiva–Parvati)",
    mantra: "Om Namah",
    benefits: ["Emotional calm and a steadier mind", "Harmony in marriage and close relationships", "Better sleep and relief from anxiety"],
  },
  "3": {
    mukhi: "3",
    name: "Teen Mukhi",
    planet: "Mars",
    deity: "Agni",
    mantra: "Om Kleem Namah",
    benefits: ["Energy, courage and drive", "Freedom from past guilt and low moods", "Support for blood, muscles and stamina"],
  },
  "4": {
    mukhi: "4",
    name: "Char Mukhi",
    planet: "Mercury",
    deity: "Lord Brahma",
    mantra: "Om Hreem Namah",
    benefits: ["Sharper intellect, memory and speech", "Success in study, exams and communication", "Calmer nerves and skin"],
  },
  "5": {
    mukhi: "5",
    name: "Panch Mukhi",
    planet: "Jupiter",
    deity: "Kalagni Rudra",
    mantra: "Om Hreem Namah",
    benefits: ["Wisdom, good judgement and peace of mind", "Blessings of teachers, children and dharma", "Balanced blood pressure and digestion"],
    note: "The most common bead, safe for everyone — the traditional starting rudraksha.",
  },
  "6": {
    mukhi: "6",
    name: "Chhah Mukhi",
    planet: "Venus",
    deity: "Lord Kartikeya",
    mantra: "Om Hreem Hum Namah",
    benefits: ["Charm, creativity and love of the arts", "Harmony in love and marriage", "Willpower over the senses"],
  },
  "7": {
    mukhi: "7",
    name: "Saat Mukhi",
    planet: "Saturn",
    deity: "Goddess Mahalakshmi",
    mantra: "Om Hum Namah",
    benefits: ["Relief during Saturn's hard periods (Sade Sati, Dhaiya)", "Steady wealth through patient work", "Support for joints, bones and chronic complaints"],
  },
  "8": {
    mukhi: "8",
    name: "Aath Mukhi",
    planet: "Rahu",
    deity: "Lord Ganesha",
    mantra: "Om Hum Namah",
    benefits: ["Removes obstacles and confusion", "Protection from deception and sudden setbacks", "Calms the restlessness of Rahu"],
  },
  "9": {
    mukhi: "9",
    name: "Nau Mukhi",
    planet: "Ketu",
    deity: "Goddess Durga",
    mantra: "Om Hreem Hum Namah",
    benefits: ["Courage, protection and inner strength", "Calms Ketu's sudden detachment and losses", "Spiritual focus and fearlessness"],
  },
  "10": {
    mukhi: "10",
    name: "Das Mukhi",
    planet: null,
    deity: "Lord Vishnu",
    mantra: "Om Hreem Namah Namah",
    benefits: ["Protection from negativity and the evil eye", "Calms all nine grahas together", "Peace at home and in legal matters"],
  },
  "11": {
    mukhi: "11",
    name: "Gyarah Mukhi",
    planet: null,
    deity: "Lord Hanuman (Ekadasha Rudra)",
    mantra: "Om Hreem Hum Namah",
    benefits: ["Fearlessness, confidence and decision-making", "Success in adventure and new ventures", "Protection while travelling"],
  },
  "12": {
    mukhi: "12",
    name: "Barah Mukhi",
    planet: "Sun",
    deity: "Surya (the twelve Adityas)",
    mantra: "Om Kraum Sraum Raum Namah",
    benefits: ["Radiance, self-esteem and leadership", "Recognition from authority and government", "Support for eyesight and the heart"],
  },
  "13": {
    mukhi: "13",
    name: "Terah Mukhi",
    planet: "Venus",
    deity: "Kamadeva / Indra",
    mantra: "Om Hreem Namah",
    benefits: ["Attraction, charm and fulfilment of desires", "Success in arts, fashion and luxury", "Harmony in love"],
  },
  "14": {
    mukhi: "14",
    name: "Chaudah Mukhi",
    planet: "Saturn",
    deity: "Lord Hanuman / Shiva",
    mantra: "Om Namah",
    benefits: ["Strong protection from Saturn's harsh results", "Sharp intuition and right decisions", "Courage and endurance in hard times"],
    note: "Rare and costly; 7 Mukhi serves Saturn well for most people.",
  },
  "Gauri Shankar": {
    mukhi: "Gauri Shankar",
    name: "Gauri Shankar",
    planet: null,
    deity: "Shiva and Parvati",
    mantra: "Om Gauri Shankaraya Namah",
    benefits: ["Unity and understanding between partners", "Harmony in family life", "Support when marriage is delayed or strained"],
  },
  Ganesh: {
    mukhi: "Ganesh",
    name: "Ganesh Rudraksha",
    planet: null,
    deity: "Lord Ganesha",
    mantra: "Om Gan Ganapataye Namah",
    benefits: ["Removes obstacles at the start of ventures", "Focus and success in studies", "Good beginnings"],
  },
};

/** The mukhi of each graha, with the practical alternative where the main one is rare. */
export const PLANET_MUKHI: Record<PlanetName, { main: string; alternative?: string }> = {
  Sun: { main: "12", alternative: "1" },
  Moon: { main: "2" },
  Mars: { main: "3" },
  Mercury: { main: "4" },
  Jupiter: { main: "5" },
  Venus: { main: "6", alternative: "13" },
  Saturn: { main: "7", alternative: "14" },
  Rahu: { main: "8" },
  Ketu: { main: "9" },
};

const WEEKDAY: Record<PlanetName, string> = {
  Sun: "Sunday",
  Moon: "Monday",
  Mars: "Tuesday",
  Mercury: "Wednesday",
  Jupiter: "Thursday",
  Venus: "Friday",
  Saturn: "Saturday",
  Rahu: "Saturday",
  Ketu: "Tuesday",
};

export type Role = "Lifelong" | "Current period" | "Remedial" | "Supportive";

export type ReasonKind = "lagna" | "rashi" | "star" | "md" | "ad" | "weak" | "dusthana" | "sadeSati" | "dosha";

export interface Reason {
  text: string;
  points: number;
  kind: ReasonKind;
}

export interface RudrakshaRec {
  planet: PlanetName;
  /** The planet's name in the reader's language. */
  planetName: string;
  bead: Mukhi;
  alternative: Mukhi | null;
  score: number;
  role: Role;
  reasons: Reason[];
  /** The planet's overall strength in this chart. */
  diagnosis: PlanetDiagnosis;
  grade: string;
  day: string;
}

export interface GoalRec {
  goal: string;
  bead: Mukhi;
  why: string;
}

export interface RudrakshaPlan {
  locale: Locale;
  top: RudrakshaRec[];
  others: RudrakshaRec[];
  combination: { beads: string[]; text: string };
  goals: GoalRec[];
  wearing: string[];
  energising: string[];
  care: string[];
  buying: string[];
}

const ordinal = (n: number) => `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
const listJoin = (xs: string[], and = "and") => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} ${and} ${xs[xs.length - 1]}`);

/** A bead's details in the reader's language (the mukhi count and planet stay the same). */
export function localBead(key: string, locale: Locale): Mukhi {
  const m = MUKHIS[key];
  if (locale !== "hi") return m;
  const h = MUKHIS_HI[key];
  return { ...m, name: h.name, deity: h.deity, benefits: h.benefits, note: h.note, mantra: MANTRA_HI[key] ?? m.mantra };
}

export function rudrakshaPlan(chart: KundaliChart, locale: Locale = "en"): RudrakshaPlan {
  const hi = locale === "hi";
  const T = (en: string, h: string) => (hi ? h : en);
  const name = (p: PlanetName) => (hi ? term("hi", p) : p);
  const sign = (s: string) => (hi ? term("hi", s) : s);
  const fmt = (d: Date | string) => new Date(d).toLocaleDateString(hi ? "hi-IN" : "en-GB", { month: "short", year: "numeric" });
  const houseWord = (hs: number[]) => (hi ? `${hs.join(" और ")} भाव` : `${listJoin(hs.map(ordinal))} house${hs.length > 1 ? "s" : ""}`);

  const asc = chart.ascendant.signIndex;
  const moon = chart.planets.find((p) => p.planet === "Moon")!;
  const diag = new Map(planetDiagnosis(chart).map((d) => [d.planet, d]));
  const gradeText = (p: PlanetName) => (hi ? GRADE_HI[diag.get(p)!.grade] : diag.get(p)!.grade.toLowerCase());
  const ruled = (p: PlanetName) => Array.from({ length: 12 }, (_, i) => i + 1).filter((h) => SIGN_LORDS[(asc + h - 1) % 12] === p);
  const reasons = new Map<PlanetName, Reason[]>(chart.planets.map((p) => [p.planet, []]));
  const add = (p: PlanetName, kind: ReasonKind, text: string, points: number) => reasons.get(p)!.push({ text, points, kind });

  const lagnaLord = SIGN_LORDS[asc] as PlanetName;
  add(lagnaLord, "lagna", T(`Lord of your Lagna (${chart.ascendant.sign}) — the planet of your body, health and life path. Its bead is the one rudraksha you can wear for life.`, `आपके लग्न (${sign(chart.ascendant.sign)}) के स्वामी — शरीर, स्वास्थ्य और जीवन-पथ के ग्रह। इनका रुद्राक्ष आप आजीवन पहन सकते हैं।`), 10);
  const rashiLord = SIGN_LORDS[moon.signIndex] as PlanetName;
  add(rashiLord, "rashi", T(`Lord of your Moon sign (${moon.sign}) — it steadies the mind and emotions.`, `आपकी चंद्र राशि (${sign(moon.sign)}) के स्वामी — मन और भावनाओं को स्थिर करते हैं।`), 7);
  const starLord = nakshatraLord(moon.nakshatraIndex) as PlanetName;
  add(starLord, "star", T(`Lord of your birth star ${moon.nakshatra} — it also started your Vimshottari dasha.`, `आपके जन्म नक्षत्र ${term("hi", moon.nakshatra)} के स्वामी — आपकी विंशोत्तरी दशा इन्हीं से शुरू हुई।`), 4);

  const md = chart.currentDasha;
  const ad = chart.currentAntardasha;
  if (md) add(md.lord as PlanetName, "md", T(`You are in its Mahadasha until ${fmt(md.end)} — the planet shaping these years.`, `${fmt(md.end)} तक इनकी महादशा चल रही है — इन वर्षों को यही ग्रह गढ़ रहे हैं।`), 8);
  if (ad && ad.lord !== md?.lord) add(ad.lord as PlanetName, "ad", T(`Its Antardasha runs until ${fmt(ad.end)}.`, `${fmt(ad.end)} तक इनकी अंतर्दशा चल रही है।`), 4);

  for (const [p, d] of diag) {
    const houses = ruled(p);
    const good = houses.some((h) => [1, 5, 9, 4, 7, 10].includes(h)) && !houses.every((h) => [6, 8, 12].includes(h));
    if ((d.grade === "Weak" || d.grade === "Very weak") && (good || p === "Rahu" || p === "Ketu"))
      add(
        p,
        "weak",
        T(
          `It is ${d.grade.toLowerCase()} in your chart${houses.length ? ` yet rules your ${houseWord(houses)}` : ""} — a helpful planet held back, which its rudraksha strengthens.`,
          `आपकी कुंडली में यह ${GRADE_HI[d.grade]} है${houses.length ? `, फिर भी आपके ${houseWord(houses)} का स्वामी है` : ""} — एक सहायक ग्रह जो दबा हुआ है; इसका रुद्राक्ष इसे बल देता है।`
        ),
        6
      );
    const placed = chart.planets.find((x) => x.planet === p)!;
    if ([6, 8, 12].includes(placed.house) && d.score < 50)
      add(p, "dusthana", T(`It sits in your ${ordinal(placed.house)} house, a difficult house, without much strength.`, `यह आपके ${placed.house}वें भाव (कठिन भाव) में है और अधिक बलवान नहीं है।`), 3);
  }

  const phaseHi: Record<string, string> = { rising: "आरंभिक", peak: "मध्य (चरम)", setting: "अंतिम" };
  if (chart.sadeSati.active)
    add("Saturn", "sadeSati", T(`Sade Sati is running now (${chart.sadeSati.phase} phase) — Saturn's bead is the classic support for these years.`, `अभी साढ़े साती चल रही है (${phaseHi[chart.sadeSati.phase ?? "peak"]} चरण) — इन वर्षों में शनि का रुद्राक्ष पारंपरिक सहारा है।`), 7);
  const dosha = (n: string) => chart.doshas.find((d) => (d.key ?? d.name).startsWith(n) && d.present && !d.cancelled);
  if (dosha("Mangal")) add("Mars", "dosha", T("Mangal Dosha is present in your chart — Mars's bead calms it.", "आपकी कुंडली में मंगल दोष है — मंगल का रुद्राक्ष इसे शांत करता है।"), 5);
  if (dosha("Kaal Sarp")) {
    add("Rahu", "dosha", T("Kaal Sarp Dosha is present — the Rahu bead (8 Mukhi) is its traditional remedy.", "कालसर्प दोष है — राहु का रुद्राक्ष (आठ मुखी) इसका पारंपरिक उपाय है।"), 6);
    add("Ketu", "dosha", T("Kaal Sarp Dosha is present — the Ketu bead (9 Mukhi) completes the remedy.", "कालसर्प दोष है — केतु का रुद्राक्ष (नौ मुखी) उपाय को पूरा करता है।"), 5);
  }
  if (dosha("Pitra")) add("Sun", "dosha", T("Pitra Dosha is present — the Sun's bead supports ancestral blessings.", "पितृ दोष है — सूर्य का रुद्राक्ष पितरों के आशीर्वाद में सहायक है।"), 4);

  const recs: RudrakshaRec[] = chart.planets.map((p) => {
    const rs = reasons.get(p.planet)!.sort((a, b) => b.points - a.points);
    const score = rs.reduce((a, r) => a + r.points, 0);
    const m = PLANET_MUKHI[p.planet];
    const kinds = new Set(rs.map((r) => r.kind));
    const role: Role = kinds.has("lagna") ? "Lifelong" : kinds.has("md") || kinds.has("ad") ? "Current period" : ["weak", "dusthana", "sadeSati", "dosha"].some((k) => kinds.has(k as ReasonKind)) ? "Remedial" : "Supportive";
    return {
      planet: p.planet,
      planetName: name(p.planet),
      bead: localBead(m.main, locale),
      alternative: m.alternative ? localBead(m.alternative, locale) : null,
      score,
      role,
      reasons: rs,
      diagnosis: diag.get(p.planet)!,
      grade: gradeText(p.planet),
      day: hi ? term("hi", WEEKDAY[p.planet]) : WEEKDAY[p.planet],
    };
  });
  recs.sort((a, b) => b.score - a.score);
  const top = recs.filter((r) => r.score > 0).slice(0, 3);
  const others = recs.filter((r) => r.score > 0 && !top.includes(r));

  // Life goals, each read from the house that governs it.
  const lordOf = (h: number) => SIGN_LORDS[(asc + h - 1) % 12] as PlanetName;
  const bead = (p: PlanetName) => localBead(PLANET_MUKHI[p].main, locale);
  const venus = diag.get("Venus")!;
  const weakMarriage = venus.score < 45 || diag.get(lordOf(7))!.score < 45;
  const goal = (en: string) => (hi ? GOAL_HI[en] : en);
  const goals: GoalRec[] = [
    { goal: goal("Career and status"), bead: bead(lordOf(10)), why: T(`Your 10th house of career is ruled by ${lordOf(10)} (${gradeText(lordOf(10))} in your chart).`, `आपके करियर के दसवें भाव के स्वामी ${name(lordOf(10))} हैं (आपकी कुंडली में ${gradeText(lordOf(10))})।`) },
    { goal: goal("Wealth and savings"), bead: bead(lordOf(2)), why: T(`Your 2nd house of wealth is ruled by ${lordOf(2)} (${gradeText(lordOf(2))}).`, `धन के दूसरे भाव के स्वामी ${name(lordOf(2))} हैं (${gradeText(lordOf(2))})।`) },
    {
      goal: goal("Marriage and relationships"),
      bead: weakMarriage ? localBead("Gauri Shankar", locale) : bead(lordOf(7)),
      why: weakMarriage
        ? T(`Venus is ${gradeText("Venus")} and your 7th lord ${lordOf(7)} is ${gradeText(lordOf(7))} — Gauri Shankar is the classic bead for harmony between partners.`, `शुक्र ${gradeText("Venus")} हैं और सप्तमेश ${name(lordOf(7))} ${gradeText(lordOf(7))} हैं — दंपत्ति में सामंजस्य के लिए गौरी शंकर पारंपरिक रुद्राक्ष है।`)
        : T(`Your 7th house of marriage is ruled by ${lordOf(7)} (${gradeText(lordOf(7))}).`, `विवाह के सातवें भाव के स्वामी ${name(lordOf(7))} हैं (${gradeText(lordOf(7))})।`),
    },
    {
      goal: goal("Education and exams"),
      bead: diag.get("Mercury")!.score < 50 ? localBead("4", locale) : bead(lordOf(5)),
      why:
        diag.get("Mercury")!.score < 50
          ? T(`Mercury, the planet of learning, is ${gradeText("Mercury")} in your chart — 4 Mukhi supports study and memory.`, `विद्या के ग्रह बुध आपकी कुंडली में ${gradeText("Mercury")} हैं — चार मुखी पढ़ाई और स्मरण-शक्ति में सहायक है।`)
          : T(`Your 5th house of learning is ruled by ${lordOf(5)} (${gradeText(lordOf(5))}).`, `विद्या के पाँचवें भाव के स्वामी ${name(lordOf(5))} हैं (${gradeText(lordOf(5))})।`),
    },
    { goal: goal("Health and vitality"), bead: bead(lagnaLord), why: T(`Your Lagna lord ${lagnaLord} governs the body (${gradeText(lagnaLord)} in your chart).`, `आपके लग्नेश ${name(lagnaLord)} शरीर के कारक हैं (आपकी कुंडली में ${gradeText(lagnaLord)})।`) },
    { goal: goal("Obstacles and new beginnings"), bead: localBead("Ganesh", locale), why: T("Ganesh Rudraksha removes obstacles at the start of any venture — suitable for everyone.", "गणेश रुद्राक्ष हर नए काम की शुरुआत में बाधाएँ दूर करता है — सभी के लिए उपयुक्त।") },
    { goal: goal("Protection and peace"), bead: localBead("10", locale), why: T("10 Mukhi has no ruling planet and calms all nine grahas — a protective bead for the home and family.", "दस मुखी का कोई स्वामी ग्रह नहीं; यह नौ ग्रहों को शांत करता है — घर-परिवार के लिए रक्षक रुद्राक्ष।") },
  ];

  const comboBeads = top.map((r) => r.bead.mukhi);
  const roleText = (r: RudrakshaRec) =>
    r.role === "Lifelong"
      ? T(`your body and life path (${r.planet}, your Lagna lord)`, `आपका शरीर और जीवन-पथ (${r.planetName}, आपके लग्नेश)`)
      : r.role === "Current period"
        ? T(`the running ${r.planet} period`, `चल रही ${r.planetName} की दशा`)
        : r.role === "Remedial"
          ? T(`relief from ${r.planet}'s difficult results`, `${r.planetName} के कठिन फलों से राहत`)
          : T(`${r.planet}'s qualities`, `${r.planetName} के गुण`);
  const combination = {
    beads: comboBeads,
    text: top.length
      ? T(
          `Your personal combination: ${top.map((r) => `${r.bead.mukhi} Mukhi (${r.planet})`).join(" + ")}, strung together in one mala or bracelet${comboBeads.includes("5") ? "" : ", with 5 Mukhi beads between them if you like"}. It supports ${listJoin(top.map(roleText))}.`,
          `आपका व्यक्तिगत संयोजन: ${top.map((r) => `${r.bead.name} (${r.planetName})`).join(" + ")}, एक माला या ब्रेसलेट में एक साथ${comboBeads.includes("5") ? "" : "; चाहें तो बीच में पंच मुखी दाने जोड़ें"}। यह ${listJoin(top.map(roleText), "और")} में सहायक है।`
        )
      : T("Start with a 5 Mukhi mala, which suits everyone.", "पंच मुखी माला से शुरू करें — यह सभी के लिए उपयुक्त है।"),
  };

  const firstDay = top[0] ? (hi ? `${top[0].day} (${top[0].planetName})` : `${top[0].day} for your main bead (${top[0].planet})`) : hi ? "सोमवार" : "a Monday";
  return {
    locale,
    top,
    others,
    combination,
    goals,
    wearing: hi
      ? WEARING_HI(firstDay)
      : [
          `Start on the bead's day — ${firstDay} — or on any Monday, in the morning after bathing, facing east.`,
          "Wear it on a red, yellow or black silk or woollen thread, or capped in silver or gold, so the bead touches the skin. Around the neck (resting near the heart) or on the right wrist is traditional.",
          "A mala should have an odd number of beads (27 + 1 or 54 + 1 is common); a single bead or small bracelet is enough for personal remedies.",
          "Chant the bead's mantra 9 or 108 times when you put it on, and a few times each morning after.",
        ],
    energising: hi
      ? ENERGISING_HI
      : [
          "Soak new beads overnight in clean water or a little ghee to settle them, then wash with Ganga jal or raw milk.",
          "Place them before a Shiva lingam or a picture of Lord Shiva, offer a flower and incense, and chant \"Om Namah Shivaya\" 108 times.",
          "Then chant the bead's own mantra 108 times while holding it, and wear it.",
        ],
    care: hi
      ? CARE_HI
      : [
          "Remove before bathing with soap or swimming, and keep it away from perfume and chemicals.",
          "Every month or two, wash with clean water and apply a drop of sandalwood or mustard oil with a soft brush; dry in shade, not sunlight.",
          "Traditionally it is taken off before sleep, at a cremation ground and at a birth, and kept in a clean place when not worn.",
          "Do not let others wear your energised beads.",
        ],
    buying: hi
      ? BUYING_HI
      : [
          "Buy only lab-certified beads (X-ray or CT scan certificate) — fake or carved mukhis are common, especially Ek Mukhi and 14 Mukhi.",
          "Nepal beads are larger with deep, clear lines; Indonesian (Java) beads are smaller and cheaper. Both are genuine and equally valid.",
          "Count the mukhis (natural lines running top to bottom) yourself; they must run the full length without being cut or glued.",
          "A genuine bead sinks in water is a myth — rely on certification, not home tests.",
        ],
  };
}
