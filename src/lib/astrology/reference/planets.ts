import { PLANETS, SIGNS, DASHA_YEARS, type PlanetName, type SignName } from "../constants";
import { EXALTATION_SIGN, OWN_SIGNS, FRIENDS, ENEMIES } from "../dignity";
import { moolatrikonaRange } from "../moolatrikona";

export interface PlanetReference {
  name: PlanetName;
  sanskrit: string;
  nature: string;
  significations: string;
  exaltationSign: SignName | null;
  debilitationSign: SignName | null;
  ownSigns: SignName[];
  moolatrikona: { sign: SignName; fromDegree: number; toDegree: number } | null;
  friends: PlanetName[];
  enemies: PlanetName[];
  neutral: PlanetName[];
  dashaYears: number | null;
  inHouses: string[]; // index 0 = house 1 ... index 11 = house 12
}

const SANSKRIT: Record<PlanetName, string> = {
  Sun: "Surya",
  Moon: "Chandra",
  Mars: "Mangala",
  Mercury: "Budha",
  Jupiter: "Guru (Brihaspati)",
  Venus: "Shukra",
  Saturn: "Shani",
  Rahu: "Rahu",
  Ketu: "Ketu",
};

const NATURE: Record<PlanetName, string> = {
  Sun: "Mild natural malefic (a luminary, not classed with the true malefics)",
  Moon: "Natural benefic when waxing, more neutral when waning",
  Mars: "Natural malefic",
  Mercury: "Neutral — takes on the nature of whatever it associates with",
  Jupiter: "Greatest natural benefic",
  Venus: "Natural benefic",
  Saturn: "Natural malefic (the most severe of the classical malefics)",
  Rahu: "Shadow malefic (functions like an amplified, unconventional Saturn)",
  Ketu: "Shadow malefic (functions like an intense, detached Mars)",
};

const SIGNIFICATIONS: Record<PlanetName, string> = {
  Sun: "Soul, identity, authority, father, and the body's core vitality. The Sun signifies government, leadership, and the drive to stand out — where it sits shows what a person builds their fundamental sense of self around.",
  Moon: "Mind, emotion, mother, and the moment-to-moment instinctive response to life. Being the fastest-moving graha, its placement colors mood, habits, and the emotional lens through which everything else in the chart is experienced.",
  Mars: "Drive, courage, physical energy, and conflict. Mars signifies siblings, land, and the willingness to act and assert — its placement shows where a person fights, competes, or takes direct physical initiative.",
  Mercury: "Intellect, communication, commerce, and adaptability. Mercury signifies learning, analysis, and the ability to process and exchange information — its placement shapes how a person thinks and speaks.",
  Jupiter: "Wisdom, growth, fortune, and higher learning. Jupiter signifies teachers, children, and expansion in every sense — its placement typically shows where a person finds the most support, optimism, and long-term growth.",
  Venus: "Relationships, pleasure, art, and material comfort. Venus signifies marriage, luxury, and aesthetic sense — its placement shows where a person seeks harmony, beauty, and enjoyment.",
  Saturn: "Discipline, delay, responsibility, and long-term structure. Saturn signifies hard work, old age, and the lessons that come through restriction — its placement shows where life demands patience before it delivers.",
  Rahu: "Ambition, obsession, and areas of unconventional, amplified drive. Rahu signifies foreign lands, technology, and material desire pushed past normal limits — its placement shows where a person chases more, often without knowing when to stop.",
  Ketu: "Detachment, past-life residue, and quiet renunciation. Ketu signifies spirituality, isolation, and sudden endings — its placement shows an area already mastered in some sense, where the native tends to disengage rather than strive.",
};

const IN_HOUSES: Record<PlanetName, string[]> = {
  Sun: [
    "Strong sense of self and visible personality; can run hot-headed or overly proud if afflicted.",
    "Authority in speech and family finances; a commanding presence around wealth and values.",
    "Courage and initiative with siblings; assertive short-distance efforts.",
    "Some friction with emotional comfort and mother, but pride in home and property.",
    "Confident, visible children; strong intellect and a flair for performance.",
    "Good at confronting obstacles directly; can indicate conflict with authority figures or health flare-ups.",
    "A commanding, sometimes dominant approach to partnership and marriage.",
    "Interest in the hidden and transformative; can bring sudden change tied to authority or father.",
    "Strong fortune and a philosophical, principled father figure; drawn to higher learning.",
    "Excellent for career and public standing — one of its classically strongest placements.",
    "Steady gains through leadership roles and influential networks.",
    "Withdrawn or humbled sense of self; better suited to behind-the-scenes authority or foreign settings.",
  ],
  Moon: [
    "Emotionally expressive, changeable personality; the mind is close to the surface.",
    "Emotional relationship with money and family; comfort-seeking speech.",
    "Restless courage; frequent short trips, changeable relationship with siblings.",
    "One of its best placements — deep emotional comfort, strong bond with mother and home.",
    "Warm, nurturing approach to children and creative expression.",
    "Emotional strain around health or daily routine; sensitivity to stress.",
    "Emotionally invested, sometimes moody approach to partnership.",
    "Emotional intensity around transformation and shared resources; can bring worry.",
    "Emotionally driven philosophy or faith; nurturing father-figures or mentors.",
    "Public-facing emotional sensitivity; career tied to nurturing, caregiving, or public mood.",
    "Emotional fulfillment through friendships and social belonging.",
    "Restless mind, tendency toward worry or withdrawal; benefits from solitude and reflection.",
  ],
  Mars: [
    "Assertive, energetic, sometimes impulsive personality; physically active.",
    "Blunt speech, assertive about finances and family; risk of harsh words.",
    "One of its best placements — real courage, strong bond with or drive alongside siblings.",
    "Friction with emotional comfort and domestic peace; property gained through effort or dispute.",
    "Passionate, competitive approach to creativity and children.",
    "Excellent placement — direct confrontation and victory over obstacles, enemies, and disease.",
    "Passionate but potentially combative approach to partnership; classical placement checked for Kuja Dosha.",
    "Sudden, intense events tied to transformation; needs care around accidents.",
    "Assertive personal philosophy; can create friction with father or teachers.",
    "Highly driven, competitive career — excellent for fields needing courage or technical skill.",
    "Strong drive and initiative in pursuing gains and goals.",
    "Restless energy that needs an outlet; risk of hidden conflict or overspending if unchecked.",
  ],
  Mercury: [
    "Communicative, quick-witted personality; youthful demeanor.",
    "Sharp financial and business acumen; articulate speech.",
    "Skillful communication with siblings; good writing and short-distance networking.",
    "Intellectual, analytical relationship with home and mother; interest in domestic organization.",
    "Clever, inventive approach to creativity; good for analytical or technical learning.",
    "Good problem-solving around health and daily work; effective at managing routine and detail.",
    "Communicative, business-like approach to partnership; marriage to an intellectually compatible partner.",
    "Analytical curiosity about the hidden and transformative; interest in research.",
    "Intellectually curious approach to philosophy and higher learning; skilled teacher or writer.",
    "Excellent for careers in communication, trade, analysis, or commerce.",
    "Networking-driven gains; income through communication or intellectual work.",
    "Overthinking or restlessness in solitude; benefits from quiet, analytical pursuits.",
  ],
  Jupiter: [
    "Wise, optimistic, respected personality; natural teacher-like presence.",
    "Excellent for accumulated wealth and generous, truthful speech.",
    "Philosophical rather than combative approach to siblings and effort.",
    "Strong emotional wisdom and a comfortable, ethical home life.",
    "One of its best placements — wise, fortunate children and strong creative or teaching talent.",
    "Tends to soften obstacles and disease through optimism and ethical conduct.",
    "Wise, respectful, often traditional approach to marriage and partnership.",
    "Philosophical, unafraid approach to transformation; often brings unexpected support through crisis.",
    "One of its best placements — deep fortune, strong faith, and a wise father figure.",
    "Respected, principled, often teaching- or advisory-flavored career.",
    "Excellent for gains — generous income and fulfillment of long-term goals.",
    "Charitable, spiritually inclined; comfortable with solitude and philosophical retreat.",
  ],
  Venus: [
    "Charming, aesthetically minded personality; often physically attractive or graceful.",
    "Excellent for wealth through comfort-oriented or artistic means; refined speech.",
    "Diplomatic, harmonious relationship with siblings; enjoys short pleasurable trips.",
    "One of its best placements — deep comfort, a beautiful home, and close bond with mother.",
    "Strong artistic and romantic creativity; affectionate relationship with children.",
    "Tends to bring ease around health, though can indicate indulgence-related issues.",
    "One of its best placements — harmonious, affectionate marriage and partnership.",
    "Attraction to the mystical and sensual sides of transformation; gains through partnership resources.",
    "Refined personal philosophy; often a loving, indulgent father figure.",
    "Career in art, beauty, luxury, or diplomacy; publicly liked and admired.",
    "Pleasurable gains through social networks and creative or artistic work.",
    "Enjoys solitude in comfort; can indicate expenditure on luxury or private pleasures.",
  ],
  Saturn: [
    "Serious, reserved personality; matures slowly but gains real depth with age.",
    "Frugal, careful relationship with money; measured, sometimes blunt speech.",
    "Distant or dutiful relationship with siblings; effort comes through discipline rather than ease.",
    "Emotional restraint; can indicate a delayed but eventually stable home and property situation.",
    "Delayed but eventually earned success with children and creative recognition.",
    "One of its better placements — disciplined, effective at overcoming obstacles and managing daily responsibility.",
    "Serious, dutiful, often delayed approach to marriage; values commitment over romance.",
    "Deep, patient engagement with transformation; can indicate longevity through discipline.",
    "Traditional, dutiful relationship with philosophy and father; steady rather than dramatic fortune.",
    "Excellent long-term placement — career built slowly through discipline and endurance rather than shortcuts.",
    "Steady, hard-earned gains that build significantly over time.",
    "Comfortable with solitude and restriction; disciplined spiritual or ascetic inclination.",
  ],
  Rahu: [
    "Unconventional, ambitious personality; can feel like an outsider until finding its own path.",
    "Amplified, sometimes obsessive drive for wealth; unconventional sources of income.",
    "Bold, unconventional courage; ambitious short-distance or technological pursuits.",
    "Restlessness at home; unconventional domestic situations or foreign property.",
    "Unconventional or foreign-influenced creativity; complicated relationship with children.",
    "Excellent placement classically — Rahu's amplifying drive works well against obstacles and enemies.",
    "Unconventional or foreign-connected partnership; intense, sometimes obsessive attachment.",
    "Deep, obsessive interest in the occult and hidden; sudden transformative events.",
    "Unorthodox personal philosophy; foreign travel or teachers outside one's own tradition.",
    "Ambitious, unconventional career, often involving technology, foreign connections, or rapid rise.",
    "Strong material gains through unconventional or large-scale networks.",
    "Amplified isolation or escapism; needs conscious grounding to avoid excess.",
  ],
  Ketu: [
    "Detached, quietly unusual personality; carries an old-soul quality.",
    "Indifference to accumulated wealth; unconventional or minimal attachment to family speech patterns.",
    "Detached from sibling dynamics; effort directed inward rather than outward.",
    "Emotional detachment from home; can indicate a spiritually inclined but unsettled domestic life.",
    "Detached or unconventional relationship with children; sharp but scattered intelligence.",
    "One of its better placements — Ketu's sharp, detached focus is effective against illness and obstacles.",
    "Detachment or karmic quality in marriage; can indicate separation or an unconventional partner.",
    "Natural affinity for the occult, research, and sudden transformation; comfort with endings.",
    "Renunciate or unconventional approach to philosophy and father; drawn to mysticism over doctrine.",
    "Detachment from conventional career ambition; can still achieve quietly through focused, solitary skill.",
    "Indifferent to material gain despite opportunities; fulfillment found elsewhere.",
    "One of its most natural placements — genuine comfort with solitude, release, and spiritual withdrawal.",
  ],
};

const CLASSICAL_SEVEN: PlanetName[] = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

function computeNeutral(planet: PlanetName): PlanetName[] {
  const friends = FRIENDS[planet] ?? [];
  const enemies = ENEMIES[planet] ?? [];
  return CLASSICAL_SEVEN.filter((p) => p !== planet && !friends.includes(p) && !enemies.includes(p));
}

export const PLANET_REFERENCE: PlanetReference[] = PLANETS.map((planet) => {
  const exaltIndex = EXALTATION_SIGN[planet];
  const moolatrikona = moolatrikonaRange(planet);

  return {
    name: planet,
    sanskrit: SANSKRIT[planet],
    nature: NATURE[planet],
    significations: SIGNIFICATIONS[planet],
    exaltationSign: exaltIndex !== undefined ? (SIGNS[exaltIndex] as SignName) : null,
    debilitationSign: exaltIndex !== undefined ? (SIGNS[(exaltIndex + 6) % 12] as SignName) : null,
    ownSigns: (OWN_SIGNS[planet] ?? []).map((i) => SIGNS[i] as SignName),
    moolatrikona: moolatrikona
      ? { sign: SIGNS[moolatrikona.signIndex] as SignName, fromDegree: moolatrikona.fromDegree, toDegree: moolatrikona.toDegree }
      : null,
    friends: FRIENDS[planet] ?? [],
    enemies: ENEMIES[planet] ?? [],
    neutral: computeNeutral(planet),
    dashaYears: DASHA_YEARS[planet] ?? null,
    inHouses: IN_HOUSES[planet],
  };
});
