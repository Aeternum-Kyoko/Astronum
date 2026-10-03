import type { PlanetName } from "@/lib/astrology/constants";
import { bhagyank, moolank, nameNumber, reduceToDigit, FRIENDLY, LO_SHU_LAYOUT, NUMBER_MEANINGS } from "@/lib/numerology";
import type { Locale } from "@/lib/i18n/locale";
import { term } from "@/lib/i18n/terms";
import { DIGITS_HI, DIRECTION_HI, ELEMENT_HI, KUA_USE_HI, NUMBER_KEYWORDS_HI, PLANES_HI } from "@/lib/loShu.hi";

/**
 * A detailed Lo Shu grid reading. The grid holds every non-zero digit of the
 * birth date plus the Driver (Moolank), the Conductor (Bhagyank) and — when
 * gender is given — the Kua number, as Indian Lo Shu numerology does. Each of
 * the nine numbers carries a planet, an element, a direction and a life area;
 * how often it repeats, which numbers are missing, and which of the eight
 * planes are complete or empty make up the reading. Missing numbers come with
 * the traditional remedies through their direction, element, colour and planet.
 */

export type Gender = "male" | "female";

export interface DigitInfo {
  planet: PlanetName;
  element: "Water" | "Earth" | "Wood" | "Metal" | "Fire";
  direction: string;
  area: string;
  /** Meaning by how many times it appears: once, twice, three times, four or more. */
  byCount: [string, string, string, string];
  missing: string;
  remedies: string[];
}

export const DIGITS: Record<number, DigitInfo> = {
  1: {
    planet: "Sun",
    element: "Water",
    direction: "North",
    area: "career and self-expression",
    byCount: [
      "You feel more than you say — you express yourself better in writing or action than in words.",
      "A balanced communicator: you see both sides and explain yourself clearly.",
      "Expressive and talkative — good with people, but sometimes says more than needed.",
      "So much to say that you can feel misunderstood; learning to listen balances it.",
    ],
    missing: "Without 1, expressing your feelings and asserting yourself take effort, and career direction can feel unclear at times.",
    remedies: ["Keep the North of your home or desk clean and open; a small water bowl or fountain there activates it.", "Offer water to the rising Sun (Surya arghya) on Sundays.", "Wear or carry something in blue or black, the colours of Water."],
  },
  2: {
    planet: "Moon",
    element: "Earth",
    direction: "South-West",
    area: "marriage and relationships",
    byCount: [
      "Sensitive, intuitive and caring — you sense others' moods easily.",
      "A strong intuition and good judge of people; a natural partner and peacemaker.",
      "Very sensitive — easily hurt and slow to forget; protect your energy.",
      "Highly emotional and impatient at times; grounding routines help a lot.",
    ],
    missing: "Without 2, sensitivity and patience may be low and relationships can need extra care and listening.",
    remedies: ["Keep the South-West heavy, tidy and well-lit; a pair of objects (two candles, a couple's picture) suits it.", "Wear white or cream on Mondays and respect your mother.", "Keep a bowl of rock salt or a crystal in the South-West."],
  },
  3: {
    planet: "Jupiter",
    element: "Wood",
    direction: "East",
    area: "family, health and planning",
    byCount: [
      "Good imagination and the ability to plan ahead.",
      "Creative and sharp — strong ideas and a clear mind.",
      "Imagination can run away with you — prone to daydreams and arguments.",
      "Overthinking and worry; channel it into writing or creative work.",
    ],
    missing: "Without 3, imagination and long-term planning need support, and family matters may need patience.",
    remedies: ["Place healthy green plants in the East.", "Wear yellow on Thursdays and honour teachers and elders.", "Plan your week in writing — it builds the missing planning habit."],
  },
  4: {
    planet: "Rahu",
    element: "Wood",
    direction: "South-East",
    area: "wealth and prosperity",
    byCount: [
      "Practical, orderly and hardworking — good with structure.",
      "Very disciplined and skilled with the hands; systems come naturally.",
      "Rigid at times — slow to change a way of working.",
      "So fixed in routine that new ideas struggle to enter; flexibility helps.",
    ],
    missing: "Without 4, discipline and organisation don't come easily, and savings may slip away.",
    remedies: ["Keep a money plant or green plant in the South-East.", "Use green and keep your finances on a simple written budget.", "Clear clutter regularly — order is the missing 4's medicine."],
  },
  5: {
    planet: "Mercury",
    element: "Earth",
    direction: "Centre",
    area: "health, balance and stability",
    byCount: [
      "Emotional balance and adaptability — you bounce back well.",
      "Strong determination and energy; you get things moving.",
      "Restless and impulsive — loves risk and change, can be hasty.",
      "Reckless energy; slow down, especially when driving and deciding.",
    ],
    missing: "Without 5, the centre of the grid is empty — balance, flexibility and steady health need conscious care.",
    remedies: ["Keep the centre of your home open and uncluttered.", "Wear green on Wednesdays.", "A daily routine of walking and regular meals restores the missing centre."],
  },
  6: {
    planet: "Venus",
    element: "Metal",
    direction: "North-West",
    area: "helpful people, mentors and travel",
    byCount: [
      "You love your home and family and take care of them.",
      "Very responsible for family — sometimes worried about them.",
      "Over-protective and anxious at home, though deeply creative.",
      "Tension at home is likely; set boundaries kindly.",
    ],
    missing: "Without 6, home and family responsibilities can feel heavy and help from others may come late.",
    remedies: ["Hang a metal wind chime in the North-West.", "Wear white or silver on Fridays and beautify your home.", "Thank and help mentors — it opens the door of helpful people."],
  },
  7: {
    planet: "Ketu",
    element: "Metal",
    direction: "West",
    area: "children, creativity and luck",
    byCount: [
      "You learn through experience; a quiet spiritual depth.",
      "A deep thinker drawn to spirituality; some losses become teachers.",
      "Heavy lessons through sacrifice or loneliness; spiritual practice is your strength.",
      "Repeated losses push you toward a spiritual path — follow it.",
    ],
    missing: "Without 7, luck can feel delayed and lessons come through experience rather than ease.",
    remedies: ["Place metal objects or a brass bowl in the West.", "A daily meditation or prayer practice.", "Feed dogs or birds — a traditional Ketu remedy."],
  },
  8: {
    planet: "Saturn",
    element: "Earth",
    direction: "North-East",
    area: "knowledge and education",
    byCount: [
      "Methodical and detail-minded — good with money and documents.",
      "Strong with finances and very organised.",
      "Materialistic streak — money can become restless pursuit.",
      "So fixed on security that life feels heavy; generosity lightens it.",
    ],
    missing: "Without 8, money management and attention to detail need care, and study needs steady effort.",
    remedies: ["Keep the North-East clean, light and calm — a study corner suits it.", "Serve elders and wear blue or black on Saturdays.", "Track expenses weekly."],
  },
  9: {
    planet: "Mars",
    element: "Fire",
    direction: "South",
    area: "fame and reputation",
    byCount: [
      "Ambitious, energetic and humanitarian.",
      "Intellectually sharp and idealistic — can be critical of others.",
      "Quick-tempered and impatient; channel the fire into sport or work.",
      "Aggressive energy; anger management and exercise are essential.",
    ],
    missing: "Without 9, ambition and drive may need a push, and recognition comes slowly.",
    remedies: ["Add red accents or a warm light in the South.", "Exercise regularly and recite the Hanuman Chalisa on Tuesdays.", "Set public goals — the missing 9 grows through visible effort."],
  },
};

export interface Plane {
  name: string;
  numbers: number[];
  strong: string;
  empty: string;
}

export const PLANES: Plane[] = [
  { name: "Mental plane", numbers: [4, 9, 2], strong: "A sharp mind, good memory and strong analytical ability.", empty: "Memory and focus need training — notes, routines and puzzles help." },
  { name: "Emotional plane", numbers: [3, 5, 7], strong: "Emotional balance, intuition and spiritual depth.", empty: "Feelings are hard to express; you may keep emotions locked inside." },
  { name: "Practical plane", numbers: [8, 1, 6], strong: "Practical skill, material success and good organisation.", empty: "Practical and money matters need extra effort and planning." },
  { name: "Thought plane", numbers: [4, 3, 8], strong: "A natural planner — ideas come with a method.", empty: "You act before planning; slowing down to plan pays off." },
  { name: "Will plane", numbers: [9, 5, 1], strong: "Determination and willpower — you finish what you start.", empty: "Willpower wavers; small daily commitments build it." },
  { name: "Action plane", numbers: [2, 7, 6], strong: "You turn ideas into action easily.", empty: "Procrastination — ideas wait too long to be acted on." },
  { name: "Golden Raj Yoga (4-5-6)", numbers: [4, 5, 6], strong: "The most prized plane: success, fame and prosperity through effort.", empty: "No Raj Yoga here — success comes through persistence rather than ease." },
  { name: "Silver Raj Yoga (2-5-8)", numbers: [2, 5, 8], strong: "Property, wealth and lasting stability.", empty: "Property and wealth come through steady saving rather than windfalls." },
];

const KUA_DIRECTIONS: Record<number, { group: "East" | "West"; best: [string, string, string, string] }> = {
  1: { group: "East", best: ["South-East", "East", "South", "North"] },
  2: { group: "West", best: ["North-East", "West", "North-West", "South-West"] },
  3: { group: "East", best: ["South", "North", "South-East", "East"] },
  4: { group: "East", best: ["North", "South", "East", "South-East"] },
  6: { group: "West", best: ["West", "North-East", "South-West", "North-West"] },
  7: { group: "West", best: ["North-West", "South-West", "North-East", "West"] },
  8: { group: "West", best: ["South-West", "North-West", "West", "North-East"] },
  9: { group: "East", best: ["East", "South-East", "North", "South"] },
};

/**
 * The Kua number (Ba Zhai feng shui). The year turns at the Chinese solar new
 * year (about 4 February), so earlier births count the previous year.
 */
export function kuaNumber(date: string, gender: Gender): number {
  let year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  if (month === 1 || (month === 2 && day < 4)) year--;
  const r = reduceToDigit(year % 100);
  const after2000 = year >= 2000;
  let k = gender === "male" ? (after2000 ? 9 : 10) - r : (after2000 ? 6 : 5) + r;
  k = reduceToDigit(k <= 0 ? k + 9 : k);
  if (k === 5) k = gender === "male" ? 2 : 8;
  return k;
}

export interface DigitLabel {
  planet: string;
  element: string;
  direction: string;
  area: string;
}

export interface LoShuReport {
  locale: Locale;
  date: string;
  driver: number;
  conductor: number;
  kua: number | null;
  /** The numbers placed, in order: date digits, then driver, conductor and Kua. */
  placed: number[];
  counts: Record<number, number>;
  cells: { n: number; count: number; label: DigitLabel; meaning: string | null }[][];
  present: { n: number; count: number; meaning: string; label: DigitLabel }[];
  missing: { n: number; meaning: string; remedies: string[]; label: DigitLabel }[];
  planes: { name: string; numbers: number[]; strong: string; empty: string; filled: number; status: "complete" | "partial" | "empty"; missingNumbers: number[] }[];
  driverConductor: string;
  kuaDirections: { group: string; best: { direction: string; use: string }[] } | null;
  name: { number: number; compound: number; fills: number | null; suits: boolean; text: string } | null;
  personalYear: { year: number; number: number; keywords: string };
  strengths: string[];
  challenges: string[];
  topRemedies: string[];
  score: number;
}

const ordinalCount = (c: number) => (c === 1 ? "once" : c === 2 ? "twice" : `${c} times`);

/** A number's planet, element, direction and life area in the reader's language. */
export function digitLabel(n: number, locale: Locale = "en"): DigitLabel {
  const d = DIGITS[n];
  return locale === "hi"
    ? { planet: term("hi", d.planet), element: ELEMENT_HI[d.element], direction: DIRECTION_HI[d.direction], area: DIGITS_HI[n].area }
    : { planet: d.planet, element: d.element, direction: d.direction, area: d.area };
}

export function loShuReport(date: string, opts: { gender?: Gender | null; name?: string | null; now?: Date; locale?: Locale } = {}): LoShuReport {
  const locale = opts.locale ?? "en";
  const hi = locale === "hi";
  const driver = moolank(date);
  const conductor = bhagyank(date);
  const kua = opts.gender ? kuaNumber(date, opts.gender) : null;
  const placed = [...date.replace(/\D/g, "").split("").map(Number).filter((d) => d > 0), driver, conductor, ...(kua ? [kua] : [])];
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  for (const d of placed) counts[d]++;

  const text = (n: number) => (hi ? DIGITS_HI[n] : DIGITS[n]);
  const meaning = (n: number) => (counts[n] ? text(n).byCount[Math.min(3, counts[n] - 1)] : null);
  const planetName = (n: number) => digitLabel(n, locale).planet;
  const keywords = (n: number) => (hi ? NUMBER_KEYWORDS_HI[n] : NUMBER_MEANINGS[n].keywords.toLowerCase());

  const cells = LO_SHU_LAYOUT.map((row) => row.map((n) => ({ n, count: counts[n], label: digitLabel(n, locale), meaning: meaning(n) })));
  const present = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => counts[n]).map((n) => ({ n, count: counts[n], meaning: meaning(n)!, label: digitLabel(n, locale) }));
  const missing = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((n) => !counts[n]).map((n) => ({ n, meaning: text(n).missing, remedies: text(n).remedies, label: digitLabel(n, locale) }));
  const planes = PLANES.map((plane) => {
    const filled = plane.numbers.filter((n) => counts[n]).length;
    const t = hi ? PLANES_HI[plane.name] : plane;
    return {
      name: t.name,
      numbers: plane.numbers,
      strong: t.strong,
      empty: t.empty,
      filled,
      status: (filled === 3 ? "complete" : filled === 0 ? "empty" : "partial") as "complete" | "partial" | "empty",
      missingNumbers: plane.numbers.filter((n) => !counts[n]),
    };
  });

  const friendly = FRIENDLY[driver].includes(conductor) && FRIENDLY[conductor].includes(driver);
  const oneWay = FRIENDLY[driver].includes(conductor) || FRIENDLY[conductor].includes(driver);
  const driverConductor = hi
    ? driver === conductor
      ? `मूलांक और भाग्यांक दोनों ${driver} (${planetName(driver)}) हैं — जीवन का एक ही केंद्रित विषय: ${keywords(driver)}।`
      : `मूलांक ${driver} (${planetName(driver)}) आपका स्वभाव गढ़ता है — ${keywords(driver)}; भाग्यांक ${conductor} (${planetName(conductor)}) आपका भाग्य गढ़ता है — ${keywords(conductor)}। ${
          friendly ? "दोनों मित्र अंक हैं, इसलिए आपका स्वभाव और जीवन की दिशा एक ही ओर खिंचते हैं।" : oneWay ? "दोनों आंशिक मित्र हैं — अधिकतर तालमेल, कभी-कभी भीतरी खिंचाव।" : "दोनों मित्र अंक नहीं हैं — स्वभाव और भाग्य अलग दिशा में खिंचते हैं, इसलिए परिणाम भीतरी समायोजन के बाद आते हैं।"
        }`
    : driver === conductor
      ? `Driver and Conductor are both ${driver} (${planetName(driver)}) — a single, focused life theme: ${keywords(driver)}.`
      : `Driver ${driver} (${planetName(driver)}) shapes your personality — ${keywords(driver)}; Conductor ${conductor} (${planetName(conductor)}) shapes your destiny — ${keywords(conductor)}. ${
          friendly
            ? "They are friendly numbers, so who you are and where life leads pull in the same direction."
            : oneWay
              ? "They are partly friendly — mostly in step, with occasional inner tension."
              : "They are not friendly numbers — your nature and your destiny pull differently, so results come after inner adjustment."
        }`;

  const KUA_USE = hi ? KUA_USE_HI : ["success and wealth", "health", "love and relationships", "personal growth and study"];
  const kuaDirections = kua
    ? {
        group: hi ? (KUA_DIRECTIONS[kua].group === "East" ? "पूर्व समूह" : "पश्चिम समूह") : `${KUA_DIRECTIONS[kua].group} group`,
        best: KUA_DIRECTIONS[kua].best.map((direction, i) => ({ direction: hi ? DIRECTION_HI[direction] : direction, use: KUA_USE[i] })),
      }
    : null;

  let name: LoShuReport["name"] = null;
  if (opts.name?.trim()) {
    const nn = nameNumber(opts.name);
    const fills = counts[nn.digit] ? null : nn.digit;
    const suits = FRIENDLY[driver].includes(nn.digit) && FRIENDLY[conductor].includes(nn.digit);
    name = {
      number: nn.digit,
      compound: nn.compound,
      fills,
      suits,
      text: hi
        ? `आपका नामांक ${nn.compound} → ${nn.digit} (${planetName(nn.digit)}) है। ${fills ? `यह आपकी ग्रिड का लुप्त ${fills} पूरा करता है — आपका नाम स्वयं एक उपाय है।` : `${nn.digit} पहले से आपकी ग्रिड में है, इसलिए नाम उसे और मज़बूत करता है।`} ${suits ? "यह आपके मूलांक और भाग्यांक दोनों का मित्र है।" : "यह मूलांक और भाग्यांक दोनों का मित्र नहीं है; वर्तनी में छोटा बदलाव इसे अनुकूल बना सकता है (अंक ज्योतिष टूल देखें)।"}`
        : `Your name number is ${nn.compound} → ${nn.digit} (${planetName(nn.digit)}). ${
            fills ? `It supplies the missing ${fills} in your grid — your name works as a remedy.` : `${nn.digit} is already in your grid, so your name strengthens it.`
          } ${suits ? "It is friendly to both your Driver and Conductor." : "It is not friendly to both your Driver and Conductor; a small spelling change can harmonise it (see the Numerology tool)."}`,
    };
  }

  const now = opts.now ?? new Date();
  const py = reduceToDigit(Number(date.slice(8, 10)) + Number(date.slice(5, 7)) + reduceToDigit(now.getFullYear()));

  const strengths = [
    ...planes.filter((p) => p.status === "complete").map((p) => `${p.name}: ${p.strong}`),
    ...present.filter((p) => p.count === 2).map((p) => (hi ? `${p.n} दो बार (${p.label.planet}): ${p.meaning}` : `${p.n} twice (${p.label.planet}): ${p.meaning}`)),
  ];
  const challenges = [
    ...planes.filter((p) => p.status === "empty").map((p) => (hi ? `${p.name} खाली है: ${p.empty}` : `${p.name} is empty: ${p.empty}`)),
    ...present.filter((p) => p.count >= 3).map((p) => (hi ? `${p.n} ${p.count} बार आता है: ${p.meaning}` : `${p.n} appears ${ordinalCount(p.count)}: ${p.meaning}`)),
  ];
  // Remedies first for numbers that would complete a Raj Yoga or another nearly-full plane.
  const priority = [...missing].sort((a, b) => {
    const weight = (n: number) => planes.filter((p) => p.status === "partial" && p.missingNumbers.length === 1 && p.missingNumbers[0] === n).length * 2 + (n === 5 ? 1 : 0);
    return weight(b.n) - weight(a.n);
  });
  const topRemedies = priority.slice(0, 3).map((m) => (hi ? `लुप्त ${m.n} (${m.label.planet}, ${m.label.direction}) के लिए: ${m.remedies[0]}` : `For the missing ${m.n} (${m.label.planet}, ${m.label.direction}): ${m.remedies[0]}`));

  const score = Math.round(((9 - missing.length) / 9) * 60 + planes.filter((p) => p.status === "complete").length * 6 - planes.filter((p) => p.status === "empty").length * 4 - present.filter((p) => p.count >= 3).length * 3 + 20);

  return {
    locale,
    date,
    driver,
    conductor,
    kua,
    placed,
    counts,
    cells,
    present,
    missing,
    planes,
    driverConductor,
    kuaDirections,
    name,
    personalYear: { year: now.getFullYear(), number: py, keywords: keywords(py) },
    strengths,
    challenges,
    topRemedies,
    score: Math.max(0, Math.min(100, score)),
  };
}
