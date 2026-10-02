import { INDEX, LITTLE, MIDDLE, RING, THUMB, WRIST, type Landmark } from "./frame";
import { TEMPLATES, type LineKey, type TracedLine } from "./lines";

export const LINE_INFO: Record<LineKey, { name: string; nameHi: string; governs: string }> = {
  heart: { name: "Heart line", nameHi: "हृदय रेखा", governs: "feelings, affection and how you relate" },
  head: { name: "Head line", nameHi: "मस्तिष्क रेखा", governs: "thinking style, focus and decisions" },
  life: { name: "Life line", nameHi: "जीवन रेखा", governs: "vitality, stamina and big life changes" },
  fate: { name: "Fate line", nameHi: "भाग्य रेखा", governs: "career, duty and life direction" },
};

export interface LineReading {
  key: LineKey;
  name: string;
  nameHi: string;
  found: boolean;
  /** Short traits, e.g. "Deep", "Curved", "Ends under Jupiter". */
  traits: string[];
  text: string;
}

export interface Trait {
  label: string;
  value: string;
  text: string;
}

export interface PalmReading {
  element: { name: string; sanskrit: string; text: string; palm: string; fingers: string };
  lines: LineReading[];
  fingers: Trait[];
  summary: string;
}

const d3 = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
const chain = (lm: Landmark[], idx: readonly number[]) => idx.slice(1).reduce((sum, i, k) => sum + d3(lm[idx[k]], lm[i]), 0);

export interface HandMeasures {
  palmRatio: number; // palm length ÷ palm width
  fingerRatio: number; // middle finger ÷ palm length
  indexToRing: number;
  thumbToIndex: number;
  littleToRing: number;
}

/** Proportions from MediaPipe's world landmarks (true 3D, so camera tilt doesn't skew them). */
export function measureHand(world: Landmark[]): HandMeasures {
  const palmLength = d3(world[WRIST], world[MIDDLE[0]]);
  // The knuckle span understates the full palm width by about a fifth.
  const palmWidth = d3(world[INDEX[0]], world[LITTLE[0]]) * 1.25;
  const index = chain(world, INDEX);
  const ring = chain(world, RING);
  return {
    palmRatio: palmLength / palmWidth,
    fingerRatio: chain(world, MIDDLE) / palmLength,
    indexToRing: index / ring,
    thumbToIndex: chain(world, THUMB.slice(1)) / index,
    littleToRing: chain(world, LITTLE) / ring,
  };
}

const ELEMENTS = {
  Earth: { sanskrit: "Prithvi", text: "Practical, steady and dependable. You trust what you can see and build things that last; routine and hands-on work suit you." },
  Air: { sanskrit: "Vayu", text: "Curious, communicative and quick-minded. Ideas, conversation and learning energise you; you need variety to stay engaged." },
  Fire: { sanskrit: "Agni", text: "Energetic, confident and driven by enthusiasm. You act on instinct, lead naturally and are happiest with a goal to chase." },
  Water: { sanskrit: "Jal", text: "Sensitive, intuitive and imaginative. You read people and moods easily; creative and caring work brings out your best." },
} as const;

function handElement(m: HandMeasures): PalmReading["element"] {
  const longPalm = m.palmRatio > 1.22;
  const longFingers = m.fingerRatio > 0.85;
  const name = longPalm ? (longFingers ? "Water" : "Fire") : longFingers ? "Air" : "Earth";
  return {
    name: `${name} hand`,
    ...ELEMENTS[name],
    palm: longPalm ? "Rectangular palm" : "Square palm",
    fingers: longFingers ? "Long fingers" : "Short fingers",
  };
}

function fingerTraits(m: HandMeasures): Trait[] {
  const out: Trait[] = [];
  if (m.indexToRing > 1.02)
    out.push({ label: "Index vs ring finger", value: "Index longer · Jupiter (Guru)", text: "A strong Jupiter finger shows self-belief, ambition and a natural pull toward leading, teaching or advising." });
  else if (m.indexToRing < 0.97)
    out.push({ label: "Index vs ring finger", value: "Ring longer · Sun (Surya)", text: "A strong Sun finger shows creativity, a taste for risk and a wish to be recognised for what you make." });
  else out.push({ label: "Index vs ring finger", value: "About equal · balanced", text: "Jupiter and the Sun are evenly matched: ambition is tempered by diplomacy, and you can lead or support as needed." });

  if (m.thumbToIndex > 0.75)
    out.push({ label: "Thumb", value: "Long · strong will", text: "A long thumb is the classic sign of willpower and logic. You finish what you start and are hard to talk out of a decision." });
  else if (m.thumbToIndex < 0.62)
    out.push({ label: "Thumb", value: "Short · heart-led", text: "A shorter thumb leans toward feeling over planning — warm and spontaneous, though deadlines may need outside structure." });
  else out.push({ label: "Thumb", value: "Medium · balanced will", text: "Will and flexibility are in balance: firm when it matters, open to persuasion when it doesn't." });

  if (m.littleToRing > 0.84)
    out.push({ label: "Little finger", value: "Long · Mercury (Budh)", text: "A long Mercury finger shows a way with words, persuasion and business sense." });
  else if (m.littleToRing < 0.76)
    out.push({ label: "Little finger", value: "Short · reserved", text: "A short Mercury finger suggests you express yourself better in deeds than in speeches, and may underplay your own worth." });
  else out.push({ label: "Little finger", value: "Medium · Mercury", text: "Mercury is moderate: you communicate clearly when you are sure of your ground." });
  return out;
}

const depthWord = (l: TracedLine) => (l.depth >= 1.9 ? "Deep" : l.depth >= 1.35 ? "Clear" : "Faint");
const breaks = (l: TracedLine) => l.segments.length - 1;
const first = (l: TracedLine) => l.path[0];
const last = (l: TracedLine) => l.path.at(-1)!;

function heart(l: TracedLine): LineReading {
  const end = last(l);
  const rise = first(l).t - Math.min(...l.path.map((p) => p.t));
  const curved = rise > 0.08;
  const traits = [depthWord(l), curved ? "Curved" : "Straight"];
  const parts: string[] = [];
  if (end.s < 0.12) {
    traits.push("Ends under Jupiter");
    parts.push("It reaches toward the index finger (the mount of Jupiter): you hold high ideals in love and give loyally, and you hope for the same in return.");
  } else if (end.s < 0.28) {
    traits.push("Ends between Jupiter and Saturn");
    parts.push("It ends between the index and middle fingers, the most balanced placement: warm and generous, yet sensible about whom you trust.");
  } else {
    traits.push("Ends under Saturn");
    parts.push("It stops below the middle finger (Saturn): you are self-contained with feelings and show love through actions and loyalty more than words.");
  }
  parts.push(curved ? "Its upward curve shows feelings you express openly and warmly." : "A straighter course shows a rational, steady heart that takes time to open up.");
  if (l.depth >= 1.9) parts.push("Being deep, your emotions run strong and lasting.");
  if (breaks(l) > 0) {
    traits.push(breaks(l) === 1 ? "One break" : `${breaks(l)} breaks`);
    parts.push("The break marks an emotional turning point — a time when your outlook on relationships changed.");
  }
  return { key: "heart", ...names("heart"), found: true, traits, text: parts.join(" ") };
}

function head(l: TracedLine, life: TracedLine): LineReading {
  const a = first(l);
  const b = last(l);
  const slope = (b.t - a.t) / Math.max(0.1, b.s - a.s);
  const traits = [depthWord(l)];
  const parts: string[] = [];
  if (b.s > 0.8) {
    traits.push("Long");
    parts.push("A long head line crossing most of the palm shows thoroughness: you like to think things through and see every angle.");
  } else if (b.s > 0.55) {
    traits.push("Medium");
    parts.push("A medium-length head line shows a clear, focused mind that gets to the point.");
  } else {
    traits.push("Short");
    parts.push("A shorter head line shows quick, decisive thinking — you trust your first read and act on it.");
  }
  if (slope > 0.32) {
    traits.push("Sloping");
    parts.push("It slopes toward the mount of the Moon (Chandra), which palmists link with imagination and creative thinking.");
  } else if (slope < 0.14) {
    traits.push("Straight");
    parts.push("It runs straight across, the mark of a practical, logical thinker.");
  } else parts.push("Its gentle slope blends logic with imagination.");
  if (life.found) {
    const joined = Math.hypot(a.s - first(life).s, a.t - first(life).t) < 0.07;
    traits.push(joined ? "Joined to life line" : "Separate from life line");
    parts.push(
      joined
        ? "It begins joined to the life line: you were careful and family-minded early on, and weigh decisions before acting."
        : "It starts apart from the life line, a sign of early independence and confidence in your own judgement."
    );
  }
  if (breaks(l) > 0) {
    traits.push(breaks(l) === 1 ? "One break" : `${breaks(l)} breaks`);
    parts.push("A break suggests a change in thinking or direction — a new field of study or a fresh way of seeing things.");
  }
  return { key: "head", ...names("head"), found: true, traits, text: parts.join(" ") };
}

function lifeLine(l: TracedLine): LineReading {
  // How far the arc swings out compared with a typical life line, averaged along its course.
  const typical = TEMPLATES.find((t) => t.key === "life")!.prior;
  const swing = l.path.reduce((a, p) => a + p.s - typical(p.t), 0) / l.path.length;
  const end = last(l);
  const traits = [depthWord(l)];
  const parts: string[] = [];
  if (swing > -0.02) {
    traits.push("Wide arc");
    parts.push("It sweeps in a wide arc around the mount of Venus (Shukra): you have good stamina, enjoy life and recover your energy quickly.");
  } else {
    traits.push("Close to thumb");
    parts.push("It hugs the ball of the thumb: you guard your energy and do best with rest and a steady routine.");
  }
  if (l.depth >= 1.9) parts.push("Its depth shows a robust constitution and drive.");
  else if (l.depth < 1.35) parts.push("Being fine, it asks you to look after your energy rather than run on reserves.");
  if (end.t > 0.85) traits.push("Reaches the wrist");
  if (breaks(l) > 0) {
    traits.push(breaks(l) === 1 ? "One break" : `${breaks(l)} breaks`);
    parts.push("A break marks a major change of circumstances — a move, a new phase or a fresh start — not misfortune.");
  }
  parts.push("Its length shows how you use your energy; palmists do not read it as the length of life.");
  return { key: "life", ...names("life"), found: true, traits, text: parts.join(" ") };
}

function fate(l: TracedLine, life: TracedLine): LineReading {
  const start = first(l);
  const traits = [depthWord(l)];
  const parts: string[] = [];
  const fromLife = life.found && life.path.some((p) => Math.hypot(p.s - start.s, p.t - start.t) < 0.07);
  if (fromLife) {
    traits.push("Rises from life line");
    parts.push("It rises out of the life line: family, upbringing or your own early effort shaped your path.");
  } else if (start.t > 0.75) {
    traits.push("Starts at the wrist");
    parts.push("It rises from near the wrist, a sign of a sense of direction or duty from an early age.");
  } else {
    traits.push("Starts mid-palm");
    parts.push("It begins higher in the palm: your path comes into focus later, often around the thirties, by your own choices.");
  }
  parts.push("Saturn (Shani) rules this line — steady work brings steady results.");
  if (breaks(l) > 0) {
    traits.push(breaks(l) === 1 ? "One break" : `${breaks(l)} breaks`);
    parts.push("Breaks point to changes of job or career direction.");
  }
  return { key: "fate", ...names("fate"), found: true, traits, text: parts.join(" ") };
}

const names = (k: LineKey) => ({ name: LINE_INFO[k].name, nameHi: LINE_INFO[k].nameHi });

function missing(k: LineKey): LineReading {
  const text =
    k === "fate"
      ? "No clear fate line showed up. Many palms have only a faint one or none at all; it is read as a free-spirited path you shape yourself rather than one set by duty."
      : `The ${LINE_INFO[k].name.toLowerCase()} didn't show clearly in this photo. Try brighter, even light from the side and keep the palm flat and in focus.`;
  return { key: k, ...names(k), found: false, traits: [k === "fate" ? "Not visible" : "Not detected"], text };
}

export function readPalm(lines: TracedLine[], world: Landmark[] | null): PalmReading {
  const by = (k: LineKey) => lines.find((l) => l.key === k)!;
  const L = by("life");
  const readings: LineReading[] = [
    by("heart").found ? heart(by("heart")) : missing("heart"),
    by("head").found ? head(by("head"), L) : missing("head"),
    L.found ? lifeLine(L) : missing("life"),
    by("fate").found ? fate(by("fate"), L) : missing("fate"),
  ];
  const measures = world ? measureHand(world) : null;
  const element = measures
    ? handElement(measures)
    : { name: "Hand shape", sanskrit: "", text: "Hold your whole hand in view, fingers together, to read its shape.", palm: "", fingers: "" };
  const fingers = measures ? fingerTraits(measures) : [];

  const deepest = lines.filter((l) => l.found).sort((a, b) => b.depth - a.depth)[0];
  const lead: Record<LineKey, string> = {
    heart: "your feelings and relationships lead the way",
    head: "your mind and judgement lead the way",
    life: "your vitality and drive lead the way",
    fate: "your sense of purpose and work lead the way",
  };
  const summary = `${element.name}${element.sanskrit ? ` (${element.sanskrit} tattva)` : ""}${
    deepest ? `, and your ${LINE_INFO[deepest.key].name.toLowerCase()} is the strongest — ${lead[deepest.key]}` : ""
  }.`;
  return { element, lines: readings, fingers, summary };
}
