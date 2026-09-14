import { SIGNS, SIGN_SANSKRIT, SIGN_LORDS, type SignName, type PlanetName } from "../constants";
import { SIGN_KEYNOTE } from "../content";

export interface SignReference {
  name: SignName;
  signIndex: number;
  sanskrit: string;
  element: "Fire" | "Earth" | "Air" | "Water";
  quality: "Movable" | "Fixed" | "Dual";
  rulingPlanet: PlanetName;
  bodyPart: string;
  keynote: string;
  description: string;
  harmoniousWith: SignName[];
  challengingWith: SignName[];
}

const RAW: Omit<SignReference, "name" | "signIndex" | "sanskrit" | "rulingPlanet" | "keynote">[] = [
  {
    element: "Fire",
    quality: "Movable",
    bodyPart: "head and face",
    description:
      "The zodiac's opening sign — direct, self-starting energy that would rather act first and reflect afterward. Aries natives tend to lead with initiative and physical courage, and often carry a natural competitiveness into whatever they take up.",
    harmoniousWith: ["Leo", "Sagittarius"],
    challengingWith: ["Cancer", "Libra", "Capricorn"],
  },
  {
    element: "Earth",
    quality: "Fixed",
    bodyPart: "face, throat, and neck",
    description:
      "Grounded, patient, and oriented toward the tangible — comfort, resources, and the sensory world. Taurus natives build slowly but durably, and resist being rushed or pushed off a course once they've committed to it.",
    harmoniousWith: ["Virgo", "Capricorn"],
    challengingWith: ["Leo", "Scorpio", "Aquarius"],
  },
  {
    element: "Air",
    quality: "Dual",
    bodyPart: "arms, hands, shoulders, and lungs",
    description:
      "Quick, curious, and communicative — Gemini natives absorb information from many directions at once and think best out loud. The dual nature gives real adaptability, sometimes at the cost of sustained follow-through.",
    harmoniousWith: ["Libra", "Aquarius"],
    challengingWith: ["Virgo", "Sagittarius", "Pisces"],
  },
  {
    element: "Water",
    quality: "Movable",
    bodyPart: "chest and stomach",
    description:
      "Emotionally attuned and protective, with a memory that runs deep. Cancer natives are shaped strongly by home, family, and early experience, and lead with feeling even when the outer presentation is composed.",
    harmoniousWith: ["Scorpio", "Pisces"],
    challengingWith: ["Aries", "Libra", "Capricorn"],
  },
  {
    element: "Fire",
    quality: "Fixed",
    bodyPart: "heart and upper spine",
    description:
      "Warm, expressive, and drawn to recognition — Leo natives carry themselves with a natural sense of presence. There's genuine generosity here alongside a real need to be seen and to matter to the people around them.",
    harmoniousWith: ["Aries", "Sagittarius"],
    challengingWith: ["Taurus", "Scorpio", "Aquarius"],
  },
  {
    element: "Earth",
    quality: "Dual",
    bodyPart: "digestive system and intestines",
    description:
      "Precise, analytical, and quietly perfectionistic — Virgo natives notice what's out of place before anyone else does. The instinct to improve and refine shows up everywhere, from craft and work to health and daily routine.",
    harmoniousWith: ["Taurus", "Capricorn"],
    challengingWith: ["Gemini", "Sagittarius", "Pisces"],
  },
  {
    element: "Air",
    quality: "Movable",
    bodyPart: "kidneys and lower back",
    description:
      "Relational and balance-seeking by instinct — Libra natives read a room quickly and care deeply about fairness. Partnership, aesthetics, and harmony matter enough here that real decisiveness can take conscious effort.",
    harmoniousWith: ["Gemini", "Aquarius"],
    challengingWith: ["Cancer", "Capricorn", "Aries"],
  },
  {
    element: "Water",
    quality: "Fixed",
    bodyPart: "reproductive and excretory organs",
    description:
      "Intense, private, and drawn to whatever lies beneath the surface — Scorpio natives don't do anything by halves. Loyalty runs deep once earned, and there's a real capacity for transformation through crisis rather than in spite of it.",
    harmoniousWith: ["Cancer", "Pisces"],
    challengingWith: ["Taurus", "Leo", "Aquarius"],
  },
  {
    element: "Fire",
    quality: "Dual",
    bodyPart: "hips and thighs",
    description:
      "Expansive and philosophical, with a restless need to understand the bigger picture. Sagittarius natives are drawn to travel, higher learning, and belief systems, and speak their mind with a bluntness that reads as honesty more often than tact.",
    harmoniousWith: ["Aries", "Leo"],
    challengingWith: ["Gemini", "Virgo", "Pisces"],
  },
  {
    element: "Earth",
    quality: "Movable",
    bodyPart: "knees, bones, and skin",
    description:
      "Disciplined and long-game by temperament — Capricorn natives are willing to defer gratification for a structure that lasts. Ambition here is patient rather than showy, built through consistent, often unglamorous effort.",
    harmoniousWith: ["Taurus", "Virgo"],
    challengingWith: ["Aries", "Cancer", "Libra"],
  },
  {
    element: "Air",
    quality: "Fixed",
    bodyPart: "calves, ankles, and circulatory system",
    description:
      "Independent and idea-driven, more at home with the collective and the future than with convention. Aquarius natives value their autonomy highly and often find their real community among people who think unconventionally too.",
    harmoniousWith: ["Gemini", "Libra"],
    challengingWith: ["Taurus", "Leo", "Scorpio"],
  },
  {
    element: "Water",
    quality: "Dual",
    bodyPart: "feet",
    description:
      "Imaginative, empathetic, and porous to the moods of whoever's nearby — Pisces natives close the zodiac by dissolving boundaries rather than drawing them. Compassion and artistic sensitivity come easily; firm limits usually don't.",
    harmoniousWith: ["Cancer", "Scorpio"],
    challengingWith: ["Gemini", "Virgo", "Sagittarius"],
  },
];

export const SIGN_REFERENCE: SignReference[] = SIGNS.map((name, i) => ({
  name: name as SignName,
  signIndex: i,
  sanskrit: SIGN_SANSKRIT[i],
  rulingPlanet: SIGN_LORDS[i] as PlanetName,
  keynote: SIGN_KEYNOTE[name as SignName],
  ...RAW[i],
}));
