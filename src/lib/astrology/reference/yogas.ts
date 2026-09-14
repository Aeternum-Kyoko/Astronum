export interface ReferenceYoga {
  name: string;
  category: "Raja Yoga" | "Dhana Yoga" | "Mahapurusha Yoga" | "Chandra Yoga" | "Dosha" | "Other";
  definition: string;
  effect: string;
  /** Whether this site's calculation engine (src/lib/astrology/yogas.ts / kundali.ts) actually detects this on a real chart, or whether it's reference-only. */
  detectedByEngine: boolean;
}

/**
 * A broader classical yoga/dosha glossary than the engine computes. The
 * `detectedByEngine: true` entries mirror the exact rule coded in
 * `../yogas.ts` (the 16 Mahapurusha/Chandra/Raja combinations) and
 * `../kundali.ts`'s `detectDoshas` (the 3 doshas) — definitions here match
 * what the engine specifically checks, not just the general classical form.
 * The `detectedByEngine: false` entries are reference-only: well-known
 * classical combinations this site doesn't (yet) compute on a live chart.
 */
export const YOGA_REFERENCE: ReferenceYoga[] = [
  {
    name: "Ruchaka Yoga",
    category: "Mahapurusha Yoga",
    definition: "Mars sits in a kendra (1st, 4th, 7th, or 10th house from the Lagna) in its own sign or exalted.",
    effect: "Physical courage, leadership, competitive drive, and a commanding presence.",
    detectedByEngine: true,
  },
  {
    name: "Bhadra Yoga",
    category: "Mahapurusha Yoga",
    definition: "Mercury sits in a kendra in its own sign or exalted.",
    effect: "Sharp intellect, business acumen, and articulate, persuasive communication.",
    detectedByEngine: true,
  },
  {
    name: "Hamsa Yoga",
    category: "Mahapurusha Yoga",
    definition: "Jupiter sits in a kendra in its own sign or exalted.",
    effect: "Wisdom, ethical conduct, and a respected, teacher-like standing.",
    detectedByEngine: true,
  },
  {
    name: "Malavya Yoga",
    category: "Mahapurusha Yoga",
    definition: "Venus sits in a kendra in its own sign or exalted.",
    effect: "Beauty, artistic talent, luxury, and comfortable material circumstances.",
    detectedByEngine: true,
  },
  {
    name: "Sasha Yoga",
    category: "Mahapurusha Yoga",
    definition: "Saturn sits in a kendra in its own sign or exalted.",
    effect: "Authority and leadership earned through discipline, patience, and endurance.",
    detectedByEngine: true,
  },
  {
    name: "Gaj Kesari Yoga",
    category: "Chandra Yoga",
    definition: "Jupiter sits in a kendra (1st, 4th, 7th, or 10th) counted from the Moon.",
    effect: "Wisdom, a strong reputation, and steady, resilient prosperity.",
    detectedByEngine: true,
  },
  {
    name: "Chandra-Mangal Yoga",
    category: "Chandra Yoga",
    definition: "The Moon and Mars are conjunct (share a sign).",
    effect: "Drive, resourcefulness, and an active ability to generate wealth.",
    detectedByEngine: true,
  },
  {
    name: "Kemadruma Yoga",
    category: "Chandra Yoga",
    definition: "No planet besides the Sun occupies the sign immediately before or after the Moon.",
    effect: "Classically a caution for isolation or struggle — read against the strength of the rest of the chart, not in isolation.",
    detectedByEngine: true,
  },
  {
    name: "Neechabhanga Raja Yoga",
    category: "Raja Yoga",
    definition: "A debilitated planet's dispositor (the lord of its debilitation sign) sits in a kendra from the Lagna or the Moon, cancelling the debilitation.",
    effect: "Turns an apparent weakness into a source of unexpected rise or achievement.",
    detectedByEngine: true,
  },
  {
    name: "Vipareeta Raja Yoga",
    category: "Raja Yoga",
    definition: "The lord of one dushthana (6th, 8th, or 12th house) is placed in a different dushthana.",
    effect: "Strength or success that emerges specifically from overcoming difficulty rather than from easy circumstance.",
    detectedByEngine: true,
  },
  {
    name: "Parivartana Yoga",
    category: "Raja Yoga",
    definition: "Two planets mutually exchange signs — each sits in a sign the other rules.",
    effect: "Strongly links the two houses and significations involved, for better or worse depending on which houses.",
    detectedByEngine: true,
  },
  {
    name: "Adhi Yoga",
    category: "Chandra Yoga",
    definition: "Only benefic planets (Mercury, Jupiter, and/or Venus) occupy the 6th, 7th, or 8th house from the Moon, with no malefic among them.",
    effect: "Sustained authority and a real ability to overcome opposition.",
    detectedByEngine: true,
  },
  {
    name: "Shakat Yoga",
    category: "Chandra Yoga",
    definition: "The Moon sits in the 6th, 8th, or 12th house from Jupiter.",
    effect: "A classical caution for fluctuating fortune, needing Jupiter's other strengths to offset it.",
    detectedByEngine: true,
  },
  {
    name: "Guru Chandal Yoga",
    category: "Other",
    definition: "Jupiter is conjunct Rahu.",
    effect: "Jupiter's wisdom filtered through Rahu's unconventional, amplifying influence — for better or worse depending on the rest of the chart.",
    detectedByEngine: true,
  },
  {
    name: "Budh-Aditya Yoga",
    category: "Other",
    definition: "The Sun and Mercury are conjunct.",
    effect: "Sharp intellect and articulate, confident communication.",
    detectedByEngine: true,
  },
  {
    name: "Amala Yoga",
    category: "Raja Yoga",
    definition: "Only a benefic (Mercury, Jupiter, and/or Venus), with no malefic, occupies the 10th house from the Moon or from the Lagna.",
    effect: "A lasting, largely unblemished good reputation.",
    detectedByEngine: true,
  },
  {
    name: "Mangal Dosha (Kuja Dosha)",
    category: "Dosha",
    definition: "Mars occupies the 1st, 2nd, 4th, 7th, 8th, or 12th house from the Lagna.",
    effect: "Classically weighed carefully in marriage compatibility; traditionally read as bringing friction or intensity into partnership unless matched or mitigated.",
    detectedByEngine: true,
  },
  {
    name: "Kaal Sarp Dosha",
    category: "Dosha",
    definition: "All seven classical planets fall on one side of the Rahu-Ketu axis.",
    effect: "A karmic, all-or-nothing quality to the chart's themes — often read as obstruction and delay followed by breakthrough once the underlying pattern is worked through.",
    detectedByEngine: true,
  },
  {
    name: "Pitra Dosha",
    category: "Dosha",
    definition: "Rahu or Ketu occupies the 9th house, or the Sun is conjunct a lunar node.",
    effect: "Classically linked to unresolved afflictions relating to ancestry and the paternal line.",
    detectedByEngine: true,
  },
  {
    name: "Dhana Yoga",
    category: "Dhana Yoga",
    definition: "The lords of the 2nd and 11th houses (the two houses most associated with wealth) are conjunct, in mutual aspect, or exchange signs.",
    effect: "Financial gain and the steady accumulation of resources.",
    detectedByEngine: false,
  },
  {
    name: "Raja Yoga (general)",
    category: "Raja Yoga",
    definition: "A lord of one of the four kendras (1st/4th/7th/10th) connects — by conjunction, mutual aspect, or sign exchange — with a lord of one of the three trikonas (1st/5th/9th).",
    effect: "Power, status, and authority — the broad classical category that most specifically named Raja Yogas (including several above) are considered special cases of.",
    detectedByEngine: false,
  },
  {
    name: "Saraswati Yoga",
    category: "Other",
    definition: "Jupiter, Venus, and Mercury are together placed in a kendra, a trikona, or the 2nd house, with Jupiter itself in a strong condition.",
    effect: "Deep learning, eloquence, and accomplishment in scholarship or the arts.",
    detectedByEngine: false,
  },
  {
    name: "Lakshmi Yoga",
    category: "Raja Yoga",
    definition: "The 9th lord is strong and well-placed while the Lagna lord is also strong.",
    effect: "Wealth, grace, and good fortune that tends to arrive without excessive struggle.",
    detectedByEngine: false,
  },
  {
    name: "Shubha Kartari Yoga",
    category: "Other",
    definition: "A house or planet is flanked on both adjacent sides (the signs immediately before and after) by benefic planets.",
    effect: "A protective, supportive quality around whatever the flanked house or planet signifies.",
    detectedByEngine: false,
  },
  {
    name: "Papa Kartari Yoga",
    category: "Other",
    definition: "A house or planet is flanked on both adjacent sides by malefic planets.",
    effect: "Pressure, constriction, and obstacles around whatever the flanked house or planet signifies.",
    detectedByEngine: false,
  },
  {
    name: "Sunapha Yoga",
    category: "Chandra Yoga",
    definition: "A planet other than the Sun occupies the 2nd house counted from the Moon.",
    effect: "Self-made wealth, skill, and a solid personal reputation.",
    detectedByEngine: false,
  },
  {
    name: "Anapha Yoga",
    category: "Chandra Yoga",
    definition: "A planet other than the Sun occupies the 12th house counted from the Moon.",
    effect: "Personal comfort, good health, and refined tastes.",
    detectedByEngine: false,
  },
  {
    name: "Durudhara Yoga",
    category: "Chandra Yoga",
    definition: "Planets other than the Sun occupy both the 2nd and 12th houses counted from the Moon at once.",
    effect: "Combines Sunapha's and Anapha's benefits — wealth and comfort together.",
    detectedByEngine: false,
  },
  {
    name: "Vasumati Yoga",
    category: "Dhana Yoga",
    definition: "Benefic planets occupy the Upachaya houses (3rd, 6th, 10th, or 11th) counted from the Lagna or from the Moon.",
    effect: "Wealth and resources that build steadily and increase over a lifetime.",
    detectedByEngine: false,
  },
  {
    name: "Grahan Yoga (Grahana Yoga)",
    category: "Other",
    definition: "The Sun or Moon is conjunct Rahu or Ketu — an \"eclipse\" combination.",
    effect: "Classically read as obscuring or complicating that luminary's significations until it's consciously worked with.",
    detectedByEngine: false,
  },
  {
    name: "Vish Yoga",
    category: "Other",
    definition: "The Moon is conjunct Saturn.",
    effect: "Emotional heaviness, delay, or restriction — but also real depth and resilience once matured.",
    detectedByEngine: false,
  },
  {
    name: "Angarak Yoga",
    category: "Other",
    definition: "Mars is conjunct Rahu or Ketu.",
    effect: "Amplified aggression or impulsiveness — channelled productively when the rest of the chart provides support and outlet.",
    detectedByEngine: false,
  },
];
