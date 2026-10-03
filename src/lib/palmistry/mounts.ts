import { sToX, tToY, toImage, xToS, yToT, type PalmFrame, type Point } from "./frame";
import type { TracedLine } from "./lines";
import type { CreaseField } from "./ridges";
import type { PlanetName } from "../astrology/constants";
import type { Grade } from "../astrology/planetDiagnosis";
import type { Locale } from "../i18n/locale";
import { term } from "../i18n/terms";
import { GRADE_HI } from "../astrology/rudraksha.hi";
import { MOUNTS_HI } from "./mounts.hi";

/**
 * The mounts of the palm (Hasta Samudrika's parvatas), each ruled by a graha.
 * Where each mount lies comes from the hand landmarks via the palm frame.
 * What a single photo can show reliably is the *markings* on a mount — vertical
 * lines, crosses, stars, grilles — found here from where creases of different
 * directions meet (the four major lines are masked out first). How full or flat
 * a mount is cannot be judged from one flat photo, so the reader can add it by
 * pressing each mount; and when a kundli is on the device, every mount is
 * cross-checked against its planet's strength in the birth chart.
 */

export type MountKey = "jupiter" | "saturn" | "sun" | "mercury" | "upperMars" | "lowerMars" | "venus" | "moon" | "rahu" | "ketu";
export type Fullness = "flat" | "normal" | "full";
export type MountAnswers = Partial<Record<MountKey, Fullness>>;
export type KundliGrades = Partial<Record<PlanetName, Grade>>;
export type MarkingKind = "star" | "cross" | "grille" | "vertical" | "clear";

interface MountDef {
  key: MountKey;
  name: string;
  nameHi: string;
  planet: PlanetName;
  /** Box in palm coordinates (s across from the index knuckle, t down from the knuckles). */
  box: [s0: number, s1: number, t0: number, t1: number];
  where: string;
  governs: string;
  full: string;
  flat: string;
  marks: Record<Exclude<MarkingKind, "clear">, string>;
  /** Whether the reader can press-test fullness (Rahu and Ketu are plains, not raised mounts). */
  pressable: boolean;
}

export const MOUNTS: MountDef[] = [
  {
    key: "jupiter",
    name: "Mount of Jupiter",
    nameHi: "गुरु पर्वत",
    planet: "Jupiter",
    box: [-0.12, 0.22, 0.0, 0.2],
    where: "below the index finger",
    governs: "ambition, leadership, wisdom, faith and self-respect",
    full: "A full Jupiter mount marks a natural leader: ambitious, respected, generous and drawn to teaching, law or guidance.",
    flat: "A flat Jupiter mount suggests modest ambition — you may undersell yourself; confidence grows with recognition.",
    marks: {
      star: "A star on Jupiter is one of the best signs in palmistry: ambitions fulfilled and honours received.",
      cross: "A cross on Jupiter is classically read as a happy, well-matched marriage.",
      grille: "A grille on Jupiter warns of pride or a domineering streak — leadership works best with humility.",
      vertical: "Vertical lines on Jupiter show ambition that turns into real achievement.",
    },
    pressable: true,
  },
  {
    key: "saturn",
    name: "Mount of Saturn",
    nameHi: "शनि पर्वत",
    planet: "Saturn",
    box: [0.2, 0.45, 0.0, 0.17],
    where: "below the middle finger",
    governs: "duty, patience, discipline, study and solitude",
    full: "A full Saturn mount gives a serious, disciplined, studious nature — wise, but prone to over-caution or melancholy.",
    flat: "A flat Saturn mount (the most common) suggests a lighter, more carefree outlook on duty and routine.",
    marks: {
      star: "A star on Saturn points to intense, fateful turning points — powerful but demanding.",
      cross: "A cross on Saturn classically warns of obstacles in work; patience and planning soften it.",
      grille: "A grille on Saturn suggests worry and gloom at times — routines and company help.",
      vertical: "A clear vertical line on Saturn is steady good fortune earned through effort.",
    },
    pressable: true,
  },
  {
    key: "sun",
    name: "Mount of the Sun",
    nameHi: "सूर्य पर्वत",
    planet: "Sun",
    box: [0.45, 0.72, 0.0, 0.17],
    where: "below the ring finger",
    governs: "creativity, fame, charisma and success",
    full: "A full Sun mount gives charm, artistic taste and a wish to shine — success through creativity and visibility.",
    flat: "A flat Sun mount suggests a practical person who works without needing the spotlight.",
    marks: {
      star: "A star on the Sun mount is the classic sign of brilliant success and recognition.",
      cross: "A cross on the Sun mount warns of disappointments in recognition — let the work speak first.",
      grille: "A grille on the Sun mount points to vanity or craving praise; real talent needs patience.",
      vertical: "A vertical line here is the Sun line itself — fame, success and creative fulfilment.",
    },
    pressable: true,
  },
  {
    key: "mercury",
    name: "Mount of Mercury",
    nameHi: "बुध पर्वत",
    planet: "Mercury",
    box: [0.72, 1.06, 0.0, 0.2],
    where: "below the little finger",
    governs: "communication, business, intelligence and healing",
    full: "A full Mercury mount gives a quick mind, a way with words and sharp business sense.",
    flat: "A flat Mercury mount suggests you express yourself better in deeds than in words.",
    marks: {
      star: "A star on Mercury promises success in business, science or eloquence.",
      cross: "A cross on Mercury classically warns against shady dealings — read contracts carefully.",
      grille: "A grille on Mercury shows nervous restlessness; slow down before big deals.",
      vertical: "Short vertical lines on Mercury are the healer's lines — a gift for medicine, counselling or care.",
    },
    pressable: true,
  },
  {
    key: "upperMars",
    name: "Upper Mars",
    nameHi: "उच्च मंगल",
    planet: "Mars",
    box: [0.78, 1.08, 0.24, 0.5],
    where: "on the outer edge, between the heart and head lines",
    governs: "endurance, moral courage and self-control",
    full: "A full Upper Mars gives calm courage and staying power — you hold firm under pressure.",
    flat: "A flat Upper Mars suggests you avoid conflict and may give up early when pushed.",
    marks: {
      star: "A star on Upper Mars shows success won through endurance and nerve.",
      cross: "A cross on Upper Mars warns of conflicts — choose your battles.",
      grille: "A grille on Upper Mars shows a quick temper under strain.",
      vertical: "Vertical lines on Upper Mars strengthen resilience.",
    },
    pressable: true,
  },
  {
    key: "lowerMars",
    name: "Lower Mars",
    nameHi: "निम्न मंगल",
    planet: "Mars",
    box: [-0.26, 0.06, 0.2, 0.42],
    where: "between the thumb and index finger, above the ball of the thumb",
    governs: "physical courage, drive and assertiveness",
    full: "A full Lower Mars gives physical courage, drive and a fighting spirit.",
    flat: "A flat Lower Mars suggests a gentle, cautious nature that avoids confrontation.",
    marks: {
      star: "A star on Lower Mars shows success through bravery — sport, defence or bold ventures.",
      cross: "A cross on Lower Mars warns of quarrels or injuries — avoid needless risks.",
      grille: "A grille on Lower Mars shows a combative streak; channel it into sport or work.",
      vertical: "Vertical lines on Lower Mars add courage and initiative.",
    },
    pressable: true,
  },
  {
    key: "venus",
    name: "Mount of Venus",
    nameHi: "शुक्र पर्वत",
    planet: "Venus",
    box: [-0.3, 0.2, 0.45, 0.95],
    where: "the ball of the thumb, inside the life line",
    governs: "love, warmth, vitality, family and the arts",
    full: "A full Venus mount gives warmth, passion, good stamina and love of beauty, music and family life.",
    flat: "A flat Venus mount suggests a reserved, self-contained heart and energy that needs looking after.",
    marks: {
      star: "A star on Venus is read as a great love or success in matters of the heart.",
      cross: "A single clear cross on Venus is classically one great, lasting love.",
      grille: "A grille on Venus shows strong passions and a full emotional life.",
      vertical: "Vertical lines on Venus add vitality and devotion to family.",
    },
    pressable: true,
  },
  {
    key: "moon",
    name: "Mount of the Moon",
    nameHi: "चंद्र पर्वत",
    planet: "Moon",
    box: [0.62, 1.08, 0.52, 0.95],
    where: "the outer edge of the palm, above the wrist",
    governs: "imagination, intuition, emotions and travel",
    full: "A full Moon mount gives rich imagination and intuition — creative, poetic and drawn to travel.",
    flat: "A flat Moon mount suggests a practical, realistic mind that trusts facts over feelings.",
    marks: {
      star: "A star on the Moon mount shows success through imagination and creative work.",
      cross: "A cross on the Moon mount suggests over-thinking or superstition — ground yourself.",
      grille: "A grille on the Moon mount points to restlessness and anxious moods.",
      vertical: "Lines on the Moon mount are classically travel lines — journeys, often abroad.",
    },
    pressable: true,
  },
  {
    key: "rahu",
    name: "Rahu (Plain of Mars)",
    nameHi: "राहु क्षेत्र",
    planet: "Rahu",
    box: [0.28, 0.6, 0.38, 0.7],
    where: "the hollow centre of the palm",
    governs: "worldly ambition, hidden struggles and the middle years",
    full: "",
    flat: "",
    marks: {
      star: "A star in the centre of the palm brings sudden gains in the middle years.",
      cross: "A cross in the centre (the Mystic Cross) shows interest in the occult and intuition.",
      grille: "Many crossing lines in the centre show struggles in the middle years before things settle.",
      vertical: "A clear vertical line through the centre strengthens the fate line — a defined path.",
    },
    pressable: false,
  },
  {
    key: "ketu",
    name: "Ketu",
    nameHi: "केतु क्षेत्र",
    planet: "Ketu",
    box: [0.28, 0.6, 0.78, 1.0],
    where: "the base of the palm, just above the wrist",
    governs: "early life, past karma and spiritual leaning",
    full: "",
    flat: "",
    marks: {
      star: "A star at the base of the palm shows early good fortune.",
      cross: "A cross at the base suggests hurdles in early life.",
      grille: "Crossing lines at the base show a struggling or unsettled early life.",
      vertical: "Vertical lines at the base show a spiritual leaning from early on.",
    },
    pressable: false,
  },
];

export interface Marking {
  kind: Exclude<MarkingKind, "clear">;
  /** Where it is, in image pixels. */
  at: Point;
}

export interface MountReading {
  key: MountKey;
  name: string;
  nameHi: string;
  planet: PlanetName;
  where: string;
  pressable: boolean;
  inView: boolean;
  /** Outline in image pixels. */
  outline: Point[];
  centre: Point;
  markings: Marking[];
  /** The main sign read on this mount. */
  sign: MarkingKind;
  /** Share of the mount's skin covered by fine lines (beyond the major lines). */
  lineDensity: number;
  fullness: Fullness | null;
  text: string;
  kundli: string | null;
  /** −2 … +2: how strongly the mount reads overall. */
  strength: number;
}

const BINS = 6; // 30° direction bins

/** True where a pixel looks like palm skin: colour close to the palm centre's (computed by the caller at base resolution). */
export type SkinMask = Uint8Array | null;

export function readMounts(
  field: CreaseField,
  threshold: number,
  traced: TracedLine[],
  frame: PalmFrame,
  answers: MountAnswers,
  kundli: KundliGrades | null,
  skinIn: SkinMask = null,
  locale: Locale = "en"
): MountReading[] {
  const hi = locale === "hi";
  const { width: w, height: h, response, orientation, valid } = field;
  // Shrink the skin mask by a few pixels: the hand's outline itself is a strong edge and must not read as markings.
  let skin: SkinMask = null;
  if (skinIn) {
    skin = new Uint8Array(w * h);
    for (let y = 3; y < h - 3; y++)
      for (let x = 3; x < w - 3; x++) {
        let all = 1;
        for (let dy = -3; dy <= 3 && all; dy += 3) for (let dx = -3; dx <= 3 && all; dx += 3) all = skinIn[(y + dy) * w + x + dx];
        skin[y * w + x] = all;
      }
  }
  // Mask the four major lines (they cross several mounts) with a few pixels to spare.
  const masked = new Uint8Array(w * h);
  for (const l of traced)
    if (l.found)
      for (const p of l.path) {
        const cx = Math.round(sToX(p.s, w));
        const cy = Math.round(tToY(p.t, h));
        for (let dy = -5; dy <= 5; dy++)
          for (let dx = -5; dx <= 5; dx++) {
            const x = cx + dx;
            const y = cy + dy;
            if (x >= 0 && y >= 0 && x < w && y < h && dx * dx + dy * dy <= 25) masked[y * w + x] = 1;
          }
      }
  const strong = (i: number) => valid[i] && !masked[i] && (!skin || skin[i]) && response[i] >= threshold;
  const bin = (a: number) => Math.min(BINS - 1, Math.floor((a / Math.PI) * BINS));
  // Crease centre lines: strong pixels at least as strong as both neighbours straight across the crease.
  const centre = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (!strong(i)) continue;
      const across = orientation[i] + Math.PI / 2;
      const dx = Math.round(Math.cos(across));
      const dy = Math.round(Math.sin(across));
      if (response[i] >= response[i + dy * w + dx] && response[i] >= response[i - dy * w - dx]) centre[i] = 1;
    }

  return MOUNTS.map((m) => {
    const [s0, s1, t0, t1] = m.box;
    const x0 = Math.max(0, Math.round(sToX(s0, w)));
    const x1 = Math.min(w - 1, Math.round(sToX(s1, w)));
    const y0 = Math.max(0, Math.round(tToY(t0, h)));
    const y1 = Math.min(h - 1, Math.round(tToY(t1, h)));
    const area = Math.max(1, (Math.round(sToX(s1, w)) - Math.round(sToX(s0, w)) + 1) * (Math.round(tToY(t1, h)) - Math.round(tToY(t0, h)) + 1));
    let usable = 0;
    let lit = 0;
    const hist = new Array(BINS).fill(0);
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        const i = y * w + x;
        if (!valid[i] || masked[i] || (skin && !skin[i])) continue;
        usable++;
        if (strong(i)) {
          lit++;
          hist[bin(orientation[i])] += response[i];
        }
      }
    const inView = usable / area > 0.45;
    const lineDensity = usable ? lit / usable : 0;

    // Junctions: points where strong creases of clearly different directions meet. Only crease pixels in a
    // ring 3–7 px out count, so a line's own rounded end (all directions, close in) isn't mistaken for a
    // junction; nearby candidates then merge into one marking.
    const crosses: Point[] = [];
    const stars: Point[] = [];
    const near = (list: Point[], x: number, y: number, r: number) => list.some((p) => (p.x - x) ** 2 + (p.y - y) ** 2 < r * r);
    for (let y = y0 + 3; y <= y1 - 3; y++)
      for (let x = x0 + 3; x <= x1 - 3; x++) {
        if (!centre[y * w + x] || response[y * w + x] < threshold * 1.3) continue;
        // Count the directions (8 sectors) in which crease arms leave this point, within a ring 3–7 px out.
        const sectors = new Array(8).fill(0);
        for (let dy = -7; dy <= 7; dy++)
          for (let dx = -7; dx <= 7; dx++) {
            const r2 = dx * dx + dy * dy;
            if (r2 < 9 || r2 > 49) continue;
            const xx = x + dx;
            const yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
            if (centre[yy * w + xx]) sectors[Math.floor(((Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI)) * 8) % 8]++;
          }
        const arms = sectors.filter((c) => c >= 2).length;
        // A line's middle has 2 opposite arms and its end 1; two lines crossing give 4; three or more give a star.
        if (arms >= 6) {
          if (!near(stars, x, y, 14)) stars.push({ x, y });
        } else if (arms >= 4) {
          if (!near(crosses, x, y, 14) && !near(stars, x, y, 14)) crosses.push({ x, y });
        }
      }
    // A cross found before a star at the same spot is part of that star.
    for (let i = crosses.length - 1; i >= 0; i--) if (near(stars, crosses[i].x, crosses[i].y, 14)) crosses.splice(i, 1);
    const totalDir = hist.reduce((a, b) => a + b, 0) || 1;
    const vertical = (hist[2] + hist[3]) / totalDir; // 60°–120°: running along the palm's length

    let sign: MarkingKind = "clear";
    if (inView) {
      if (crosses.length + stars.length >= 3 || (lineDensity > 0.22 && vertical < 0.6)) sign = "grille";
      else if (stars.length && lineDensity >= 0.05) sign = "star";
      else if (crosses.length) sign = "cross";
      else if (lineDensity > 0.05 && vertical >= 0.55) sign = "vertical";
    }
    const at = (p: Point) => toImage(frame, xToS(p.x, w), yToT(p.y, h));
    const markings: Marking[] =
      sign === "star" ? stars.slice(0, 2).map((p) => ({ kind: "star" as const, at: at(p) })) : sign === "cross" ? crosses.slice(0, 2).map((p) => ({ kind: "cross" as const, at: at(p) })) : [];

    const fullness = m.pressable ? (answers[m.key] ?? null) : null;
    const c = hi ? { ...m, ...MOUNTS_HI[m.key] } : m;
    const planet = hi ? term("hi", m.planet) : m.planet;
    const parts: string[] = [
      hi ? `${c.name.split(" (")[0]}, ${c.where}, के स्वामी ${planet} हैं; यह ${c.governs} का क्षेत्र है।` : `${c.name.split(" (")[0]}, ${c.where}, is ruled by ${planet} and governs ${c.governs}.`,
    ];
    if (!inView) parts.push(hi ? "यह फ़ोटो में पूरा नहीं दिखा, इसलिए इसके चिह्न नहीं पढ़े जा सके — पूरी हथेली दिखाकर फिर से फ़ोटो लें।" : "It isn't fully in the photo, so its markings can't be read — retake with the whole palm in view.");
    else {
      if (fullness === "full") parts.push(c.full);
      else if (fullness === "flat") parts.push(c.flat);
      else if (fullness === "normal") parts.push(hi ? `सामान्य, समतल पर्वत: ${planet} के गुण संतुलन में हैं।` : `An even, normal mount: ${planet}'s qualities are present in balance.`);
      parts.push(sign === "clear" ? (hi ? "इस पर कोई विशेष चिह्न नहीं है, इसलिए इसके गुण सहजता से काम करते हैं।" : "It is clear of special markings, so its qualities work smoothly.") : c.marks[sign]);
      if (sign !== "grille" && lineDensity > 0.14) parts.push(hi ? "इसे कई बारीक रेखाएँ काटती हैं — यहाँ की ऊर्जा व्यस्त और कुछ बिखरी हुई है।" : "Many fine lines cross it — energy here is busy and somewhat scattered.");
    }

    const markScore: Record<MarkingKind, number> = { star: 1, vertical: 1, clear: 0, cross: -0.5, grille: -1 };
    const strength = (fullness === "full" ? 1 : fullness === "flat" ? -1 : 0) + (inView ? markScore[sign] : 0);

    let kundliNote: string | null = null;
    const grade = kundli?.[m.planet];
    if (grade) {
      const strongChart = grade === "Excellent" || grade === "Good";
      const weakChart = grade === "Weak" || grade === "Very weak";
      const g = hi ? GRADE_HI[grade] : grade.toLowerCase();
      kundliNote = hi
        ? strength > 0 && strongChart
          ? `पुष्टि: आपकी कुंडली में भी ${planet} ${g} हैं — यह आपके जीवन की स्पष्ट शक्ति है।`
          : strength < 0 && weakChart
            ? `कुंडली भी यही कहती है: वहाँ भी ${planet} ${g} हैं — इस क्षेत्र को सचेत सहारा चाहिए, और ${planet} के उपाय मदद करते हैं।`
            : strength > 0 && weakChart
              ? `रोचक: कुंडली में ${planet} ${g} हैं, फिर भी हथेली यहाँ शक्ति दिखाती है — हाथ अक्सर वह दिखाता है जो आपने जन्म के वादे से आगे बनाया है।`
              : strength < 0 && strongChart
                ? `कुंडली में ${planet} ${g} हैं, पर हथेली यहाँ शांत है — एक ऐसी शक्ति जिसका पूरा उपयोग अभी बाकी है।`
                : `आपकी कुंडली में ${planet} ${g} हैं।`
        : strength > 0 && strongChart
          ? `Confirmed: ${planet} is also ${g} in your kundli — a clear strength in your life.`
          : strength < 0 && weakChart
            ? `Your kundli agrees: ${planet} is ${g} there too — this area needs conscious support, and ${planet}'s remedies help.`
            : strength > 0 && weakChart
              ? `Interesting: ${planet} is ${g} in your kundli, yet the palm shows strength here — the hand often shows what you have built beyond the birth promise.`
              : strength < 0 && strongChart
                ? `${planet} is ${g} in your kundli, but the palm reads quieter here — a strength you have yet to fully use.`
                : `In your kundli ${planet} is ${g}.`;
    }

    const outline = [
      [s0, t0],
      [s1, t0],
      [s1, t1],
      [s0, t1],
    ].map(([s, t]) => toImage(frame, s, t));
    return {
      key: m.key,
      name: c.name,
      nameHi: m.nameHi,
      planet: m.planet,
      where: c.where,
      pressable: m.pressable,
      inView,
      outline,
      centre: toImage(frame, (s0 + s1) / 2, (t0 + t1) / 2),
      markings,
      sign: inView ? sign : "clear",
      lineDensity,
      fullness,
      text: parts.join(" "),
      kundli: kundliNote,
      strength,
    };
  });
}

/** The mounts that stand out, strongest first — the reader's dominant planetary type. */
export function dominantMounts(mounts: MountReading[]): MountReading[] {
  return mounts.filter((m) => m.strength > 0).sort((a, b) => b.strength - a.strength);
}
