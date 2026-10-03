import { INDEX, LITTLE, MIDDLE, RING, THUMB, WRIST, type Landmark } from "./frame";
import { TEMPLATES, type LineKey, type TracedLine } from "./lines";
import type { Locale } from "../i18n/locale";

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

type Tr = (en: string, hi: string) => string;
const translator = (locale: Locale): Tr => (en, hi) => (locale === "hi" ? hi : en);

const ELEMENTS = {
  Earth: { sanskrit: "Prithvi", hiName: "पृथ्वी", text: ["Practical, steady and dependable. You trust what you can see and build things that last; routine and hands-on work suit you.", "व्यावहारिक, स्थिर और भरोसेमंद। आप जो दिखता है उस पर भरोसा करते हैं और टिकाऊ चीज़ें बनाते हैं; दिनचर्या और हाथ का काम आपको सूट करता है।"] },
  Air: { sanskrit: "Vayu", hiName: "वायु", text: ["Curious, communicative and quick-minded. Ideas, conversation and learning energise you; you need variety to stay engaged.", "जिज्ञासु, संवादी और तेज़ दिमाग। विचार, बातचीत और सीखना आपको ऊर्जा देते हैं; रुचि बनाए रखने के लिए विविधता चाहिए।"] },
  Fire: { sanskrit: "Agni", hiName: "अग्नि", text: ["Energetic, confident and driven by enthusiasm. You act on instinct, lead naturally and are happiest with a goal to chase.", "ऊर्जावान, आत्मविश्वासी और उत्साह से भरे। आप सहज बुद्धि से काम करते हैं, स्वाभाविक नेतृत्व करते हैं और किसी लक्ष्य के पीछे सबसे ख़ुश रहते हैं।"] },
  Water: { sanskrit: "Jal", hiName: "जल", text: ["Sensitive, intuitive and imaginative. You read people and moods easily; creative and caring work brings out your best.", "संवेदनशील, अंतर्ज्ञानी और कल्पनाशील। आप लोगों और उनके मन को आसानी से पढ़ लेते हैं; रचनात्मक और सेवा का काम आपकी श्रेष्ठता निकालता है।"] },
} as const;

function handElement(m: HandMeasures, T: Tr, hi: boolean): PalmReading["element"] {
  const longPalm = m.palmRatio > 1.22;
  const longFingers = m.fingerRatio > 0.85;
  const key = longPalm ? (longFingers ? "Water" : "Fire") : longFingers ? "Air" : "Earth";
  const e = ELEMENTS[key];
  return {
    name: hi ? `${e.hiName} हस्त` : `${key} hand`,
    sanskrit: hi ? e.hiName : e.sanskrit,
    text: hi ? e.text[1] : e.text[0],
    palm: longPalm ? T("Rectangular palm", "आयताकार हथेली") : T("Square palm", "चौकोर हथेली"),
    fingers: longFingers ? T("Long fingers", "लंबी उँगलियाँ") : T("Short fingers", "छोटी उँगलियाँ"),
  };
}

function fingerTraits(m: HandMeasures, T: Tr): Trait[] {
  const out: Trait[] = [];
  const ir = T("Index vs ring finger", "तर्जनी बनाम अनामिका");
  if (m.indexToRing > 1.02)
    out.push({ label: ir, value: T("Index longer · Jupiter (Guru)", "तर्जनी लंबी · गुरु"), text: T("A strong Jupiter finger shows self-belief, ambition and a natural pull toward leading, teaching or advising.", "बलवान गुरु उँगली आत्मविश्वास, महत्वाकांक्षा और नेतृत्व, शिक्षण या सलाह की ओर स्वाभाविक झुकाव दिखाती है।") });
  else if (m.indexToRing < 0.97)
    out.push({ label: ir, value: T("Ring longer · Sun (Surya)", "अनामिका लंबी · सूर्य"), text: T("A strong Sun finger shows creativity, a taste for risk and a wish to be recognised for what you make.", "बलवान सूर्य उँगली रचनात्मकता, जोखिम लेने की रुचि और अपने काम के लिए पहचान पाने की इच्छा दिखाती है।") });
  else out.push({ label: ir, value: T("About equal · balanced", "लगभग बराबर · संतुलित"), text: T("Jupiter and the Sun are evenly matched: ambition is tempered by diplomacy, and you can lead or support as needed.", "गुरु और सूर्य बराबर हैं: महत्वाकांक्षा में व्यवहार-कुशलता है, और आप ज़रूरत अनुसार नेतृत्व या सहयोग कर सकते हैं।") });

  const th = T("Thumb", "अँगूठा");
  if (m.thumbToIndex > 0.75)
    out.push({ label: th, value: T("Long · strong will", "लंबा · दृढ़ इच्छाशक्ति"), text: T("A long thumb is the classic sign of willpower and logic. You finish what you start and are hard to talk out of a decision.", "लंबा अँगूठा इच्छाशक्ति और तर्क का पारंपरिक चिह्न है। आप जो शुरू करते हैं, पूरा करते हैं और अपने निर्णय से आसानी से नहीं हटते।") });
  else if (m.thumbToIndex < 0.62)
    out.push({ label: th, value: T("Short · heart-led", "छोटा · हृदय-प्रधान"), text: T("A shorter thumb leans toward feeling over planning — warm and spontaneous, though deadlines may need outside structure.", "छोटा अँगूठा योजना से ज़्यादा भावना की ओर झुकता है — स्नेही और सहज, पर समय-सीमा के लिए बाहरी ढाँचा चाहिए।") });
  else out.push({ label: th, value: T("Medium · balanced will", "मध्यम · संतुलित इच्छाशक्ति"), text: T("Will and flexibility are in balance: firm when it matters, open to persuasion when it doesn't.", "इच्छाशक्ति और लचीलापन संतुलित हैं: ज़रूरी हो तो दृढ़, वरना समझाने पर मान जाने वाले।") });

  const lf = T("Little finger", "कनिष्ठा");
  if (m.littleToRing > 0.84)
    out.push({ label: lf, value: T("Long · Mercury (Budh)", "लंबी · बुध"), text: T("A long Mercury finger shows a way with words, persuasion and business sense.", "लंबी बुध उँगली शब्दों की कला, समझाने की क्षमता और व्यापारिक समझ दिखाती है।") });
  else if (m.littleToRing < 0.76)
    out.push({ label: lf, value: T("Short · reserved", "छोटी · संकोची"), text: T("A short Mercury finger suggests you express yourself better in deeds than in speeches, and may underplay your own worth.", "छोटी बुध उँगली बताती है कि आप भाषण से ज़्यादा काम से अपनी बात रखते हैं, और अपनी योग्यता को कम आँक सकते हैं।") });
  else out.push({ label: lf, value: T("Medium · Mercury", "मध्यम · बुध"), text: T("Mercury is moderate: you communicate clearly when you are sure of your ground.", "बुध मध्यम है: जब आप आश्वस्त होते हैं तो अपनी बात साफ़ कहते हैं।") });
  return out;
}

const breaks = (l: TracedLine) => l.segments.length - 1;
const first = (l: TracedLine) => l.path[0];
const last = (l: TracedLine) => l.path.at(-1)!;

function common(l: TracedLine, T: Tr) {
  const depth = l.depth >= 1.9 ? T("Deep", "गहरी") : l.depth >= 1.35 ? T("Clear", "स्पष्ट") : T("Faint", "हल्की");
  const breakTrait = breaks(l) === 1 ? T("One break", "एक टूटन") : T(`${breaks(l)} breaks`, `${breaks(l)} टूटन`);
  return { depth, breakTrait };
}

function heart(l: TracedLine, T: Tr): LineReading {
  const end = last(l);
  const rise = first(l).t - Math.min(...l.path.map((p) => p.t));
  const curved = rise > 0.08;
  const { depth, breakTrait } = common(l, T);
  const traits = [depth, curved ? T("Curved", "घुमावदार") : T("Straight", "सीधी")];
  const parts: string[] = [];
  if (end.s < 0.12) {
    traits.push(T("Ends under Jupiter", "गुरु पर्वत पर समाप्त"));
    parts.push(T("It reaches toward the index finger (the mount of Jupiter): you hold high ideals in love and give loyally, and you hope for the same in return.", "यह तर्जनी (गुरु पर्वत) तक पहुँचती है: प्रेम में आपके आदर्श ऊँचे हैं, आप निष्ठा से देते हैं और वैसी ही निष्ठा चाहते हैं।"));
  } else if (end.s < 0.28) {
    traits.push(T("Ends between Jupiter and Saturn", "गुरु और शनि के बीच समाप्त"));
    parts.push(T("It ends between the index and middle fingers, the most balanced placement: warm and generous, yet sensible about whom you trust.", "यह तर्जनी और मध्यमा के बीच समाप्त होती है — सबसे संतुलित स्थिति: स्नेही और उदार, फिर भी भरोसा सोच-समझकर करते हैं।"));
  } else {
    traits.push(T("Ends under Saturn", "शनि पर्वत पर समाप्त"));
    parts.push(T("It stops below the middle finger (Saturn): you are self-contained with feelings and show love through actions and loyalty more than words.", "यह मध्यमा (शनि) के नीचे रुकती है: आप भावनाओं में संयमित हैं और प्रेम शब्दों से ज़्यादा कर्म और निष्ठा से दिखाते हैं।"));
  }
  parts.push(curved ? T("Its upward curve shows feelings you express openly and warmly.", "ऊपर की ओर घुमाव खुलकर और गर्मजोशी से व्यक्त भावनाएँ दिखाता है।") : T("A straighter course shows a rational, steady heart that takes time to open up.", "सीधा मार्ग तर्कशील, स्थिर हृदय दिखाता है जो धीरे-धीरे खुलता है।"));
  if (l.depth >= 1.9) parts.push(T("Being deep, your emotions run strong and lasting.", "गहरी होने से आपकी भावनाएँ प्रबल और स्थायी हैं।"));
  if (breaks(l) > 0) {
    traits.push(breakTrait);
    parts.push(T("The break marks an emotional turning point — a time when your outlook on relationships changed.", "टूटन एक भावनात्मक मोड़ दिखाती है — जब संबंधों को लेकर आपका दृष्टिकोण बदला।"));
  }
  return { key: "heart", ...names("heart", T), found: true, traits, text: parts.join(" ") };
}

function head(l: TracedLine, life: TracedLine, T: Tr): LineReading {
  const a = first(l);
  const b = last(l);
  const slope = (b.t - a.t) / Math.max(0.1, b.s - a.s);
  const { depth, breakTrait } = common(l, T);
  const traits = [depth];
  const parts: string[] = [];
  if (b.s > 0.8) {
    traits.push(T("Long", "लंबी"));
    parts.push(T("A long head line crossing most of the palm shows thoroughness: you like to think things through and see every angle.", "हथेली के अधिकांश भाग को पार करती लंबी मस्तिष्क रेखा गहनता दिखाती है: आप हर पहलू सोचकर निर्णय लेना पसंद करते हैं।"));
  } else if (b.s > 0.55) {
    traits.push(T("Medium", "मध्यम"));
    parts.push(T("A medium-length head line shows a clear, focused mind that gets to the point.", "मध्यम लंबाई की मस्तिष्क रेखा साफ़, केंद्रित दिमाग दिखाती है जो सीधे मुद्दे पर आता है।"));
  } else {
    traits.push(T("Short", "छोटी"));
    parts.push(T("A shorter head line shows quick, decisive thinking — you trust your first read and act on it.", "छोटी मस्तिष्क रेखा तेज़, निर्णायक सोच दिखाती है — आप पहली समझ पर भरोसा कर काम करते हैं।"));
  }
  if (slope > 0.32) {
    traits.push(T("Sloping", "ढलानदार"));
    parts.push(T("It slopes toward the mount of the Moon (Chandra), which palmists link with imagination and creative thinking.", "यह चंद्र पर्वत की ओर झुकती है, जिसे हस्तरेखा-शास्त्र कल्पना और रचनात्मक सोच से जोड़ता है।"));
  } else if (slope < 0.14) {
    traits.push(T("Straight", "सीधी"));
    parts.push(T("It runs straight across, the mark of a practical, logical thinker.", "यह सीधी चलती है — व्यावहारिक, तार्किक विचारक का चिह्न।"));
  } else parts.push(T("Its gentle slope blends logic with imagination.", "हल्का झुकाव तर्क और कल्पना का मेल दिखाता है।"));
  if (life.found) {
    const joined = Math.hypot(a.s - first(life).s, a.t - first(life).t) < 0.07;
    traits.push(joined ? T("Joined to life line", "जीवन रेखा से जुड़ी") : T("Separate from life line", "जीवन रेखा से अलग"));
    parts.push(
      joined
        ? T("It begins joined to the life line: you were careful and family-minded early on, and weigh decisions before acting.", "यह जीवन रेखा से जुड़कर शुरू होती है: आप शुरू से सावधान और परिवार-प्रिय रहे, और निर्णय तौलकर लेते हैं।")
        : T("It starts apart from the life line, a sign of early independence and confidence in your own judgement.", "यह जीवन रेखा से अलग शुरू होती है — जल्दी स्वतंत्रता और अपने निर्णय पर भरोसे का संकेत।")
    );
  }
  if (breaks(l) > 0) {
    traits.push(breakTrait);
    parts.push(T("A break suggests a change in thinking or direction — a new field of study or a fresh way of seeing things.", "टूटन सोच या दिशा में बदलाव दिखाती है — पढ़ाई का नया क्षेत्र या चीज़ों को देखने का नया तरीका।"));
  }
  return { key: "head", ...names("head", T), found: true, traits, text: parts.join(" ") };
}

function lifeLine(l: TracedLine, T: Tr): LineReading {
  // How far the arc swings out compared with a typical life line, averaged along its course.
  const typical = TEMPLATES.find((t) => t.key === "life")!.prior;
  const swing = l.path.reduce((a, p) => a + p.s - typical(p.t), 0) / l.path.length;
  const end = last(l);
  const { depth, breakTrait } = common(l, T);
  const traits = [depth];
  const parts: string[] = [];
  if (swing > -0.02) {
    traits.push(T("Wide arc", "चौड़ा घेरा"));
    parts.push(T("It sweeps in a wide arc around the mount of Venus (Shukra): you have good stamina, enjoy life and recover your energy quickly.", "यह शुक्र पर्वत के चारों ओर चौड़ा घेरा बनाती है: आपमें अच्छी सहनशक्ति है, आप जीवन का आनंद लेते हैं और जल्दी ऊर्जा पाते हैं।"));
  } else {
    traits.push(T("Close to thumb", "अँगूठे के पास"));
    parts.push(T("It hugs the ball of the thumb: you guard your energy and do best with rest and a steady routine.", "यह अँगूठे के उभार के पास चलती है: आप अपनी ऊर्जा सँभालकर रखते हैं और आराम व स्थिर दिनचर्या से सबसे अच्छा करते हैं।"));
  }
  if (l.depth >= 1.9) parts.push(T("Its depth shows a robust constitution and drive.", "इसकी गहराई मज़बूत शरीर और लगन दिखाती है।"));
  else if (l.depth < 1.35) parts.push(T("Being fine, it asks you to look after your energy rather than run on reserves.", "पतली होने से यह कहती है कि ऊर्जा का ध्यान रखें, उसे खर्च करते न रहें।"));
  if (end.t > 0.85) traits.push(T("Reaches the wrist", "कलाई तक"));
  if (breaks(l) > 0) {
    traits.push(breakTrait);
    parts.push(T("A break marks a major change of circumstances — a move, a new phase or a fresh start — not misfortune.", "टूटन परिस्थितियों में बड़ा बदलाव दिखाती है — स्थान-परिवर्तन, नया चरण या नई शुरुआत — दुर्भाग्य नहीं।"));
  }
  parts.push(T("Its length shows how you use your energy; palmists do not read it as the length of life.", "इसकी लंबाई बताती है कि आप ऊर्जा कैसे उपयोग करते हैं; हस्तरेखा-शास्त्री इसे आयु की लंबाई नहीं मानते।"));
  return { key: "life", ...names("life", T), found: true, traits, text: parts.join(" ") };
}

function fate(l: TracedLine, life: TracedLine, T: Tr): LineReading {
  const start = first(l);
  const { depth, breakTrait } = common(l, T);
  const traits = [depth];
  const parts: string[] = [];
  const fromLife = life.found && life.path.some((p) => Math.hypot(p.s - start.s, p.t - start.t) < 0.07);
  if (fromLife) {
    traits.push(T("Rises from life line", "जीवन रेखा से निकलती"));
    parts.push(T("It rises out of the life line: family, upbringing or your own early effort shaped your path.", "यह जीवन रेखा से निकलती है: परिवार, परवरिश या आपके शुरुआती प्रयास ने आपका मार्ग गढ़ा।"));
  } else if (start.t > 0.75) {
    traits.push(T("Starts at the wrist", "कलाई से शुरू"));
    parts.push(T("It rises from near the wrist, a sign of a sense of direction or duty from an early age.", "यह कलाई के पास से उठती है — कम उम्र से ही दिशा या कर्तव्य-बोध का संकेत।"));
  } else {
    traits.push(T("Starts mid-palm", "हथेली के बीच से शुरू"));
    parts.push(T("It begins higher in the palm: your path comes into focus later, often around the thirties, by your own choices.", "यह हथेली में ऊपर से शुरू होती है: आपका मार्ग बाद में, अक्सर तीस के आसपास, अपने चुनावों से स्पष्ट होता है।"));
  }
  parts.push(T("Saturn (Shani) rules this line — steady work brings steady results.", "यह रेखा शनि की है — निरंतर परिश्रम से स्थिर परिणाम मिलते हैं।"));
  if (breaks(l) > 0) {
    traits.push(breakTrait);
    parts.push(T("Breaks point to changes of job or career direction.", "टूटन नौकरी या करियर की दिशा में बदलाव दिखाती है।"));
  }
  return { key: "fate", ...names("fate", T), found: true, traits, text: parts.join(" ") };
}

const names = (k: LineKey, T: Tr) => ({ name: T(LINE_INFO[k].name, LINE_INFO[k].nameHi), nameHi: LINE_INFO[k].nameHi });

function missing(k: LineKey, T: Tr): LineReading {
  const text =
    k === "fate"
      ? T("No clear fate line showed up. Many palms have only a faint one or none at all; it is read as a free-spirited path you shape yourself rather than one set by duty.", "स्पष्ट भाग्य रेखा नहीं दिखी। कई हथेलियों में यह हल्की होती है या होती ही नहीं; इसे कर्तव्य से तय नहीं, अपने बनाए स्वतंत्र मार्ग के रूप में पढ़ा जाता है।")
      : T(`The ${LINE_INFO[k].name.toLowerCase()} didn't show clearly in this photo. Try brighter, even light from the side and keep the palm flat and in focus.`, `इस फ़ोटो में ${LINE_INFO[k].nameHi} साफ़ नहीं दिखी। बगल से तेज़, समान रोशनी में हथेली को सपाट और फ़ोकस में रखकर फिर से कोशिश करें।`);
  return { key: k, ...names(k, T), found: false, traits: [k === "fate" ? T("Not visible", "दिखाई नहीं दी") : T("Not detected", "पहचानी नहीं गई")], text };
}

export function readPalm(lines: TracedLine[], world: Landmark[] | null, locale: Locale = "en"): PalmReading {
  const T = translator(locale);
  const hi = locale === "hi";
  const by = (k: LineKey) => lines.find((l) => l.key === k)!;
  const L = by("life");
  const readings: LineReading[] = [
    by("heart").found ? heart(by("heart"), T) : missing("heart", T),
    by("head").found ? head(by("head"), L, T) : missing("head", T),
    L.found ? lifeLine(L, T) : missing("life", T),
    by("fate").found ? fate(by("fate"), L, T) : missing("fate", T),
  ];
  const measures = world ? measureHand(world) : null;
  const element = measures
    ? handElement(measures, T, hi)
    : { name: T("Hand shape", "हाथ का आकार"), sanskrit: "", text: T("Hold your whole hand in view, fingers together, to read its shape.", "हाथ का आकार पढ़ने के लिए पूरा हाथ, उँगलियाँ साथ रखकर, दिखाएँ।"), palm: "", fingers: "" };
  const fingers = measures ? fingerTraits(measures, T) : [];

  const deepest = lines.filter((l) => l.found).sort((a, b) => b.depth - a.depth)[0];
  const lead: Record<LineKey, [string, string]> = {
    heart: ["your feelings and relationships lead the way", "आपकी भावनाएँ और संबंध आगे रहते हैं"],
    head: ["your mind and judgement lead the way", "आपका मन और विवेक आगे रहते हैं"],
    life: ["your vitality and drive lead the way", "आपकी जीवन-शक्ति और लगन आगे रहती है"],
    fate: ["your sense of purpose and work lead the way", "आपका उद्देश्य और कर्म आगे रहते हैं"],
  };
  const summary = hi
    ? `${element.name}${element.sanskrit ? ` (${element.sanskrit} तत्व)` : ""}${deepest ? `, और आपकी ${LINE_INFO[deepest.key].nameHi} सबसे प्रबल है — ${lead[deepest.key][1]}` : ""}।`
    : `${element.name}${element.sanskrit ? ` (${element.sanskrit} tattva)` : ""}${deepest ? `, and your ${LINE_INFO[deepest.key].name.toLowerCase()} is the strongest — ${lead[deepest.key][0]}` : ""}.`;
  return { element, lines: readings, fingers, summary };
}
