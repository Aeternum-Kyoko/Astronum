import { type PlanetName } from "../constants";

export type HouseClassification = "Kendra" | "Trikona" | "Dushthana" | "Upachaya" | "Maraka";

export interface HouseReference {
  house: number;
  sanskritName: string;
  classification: HouseClassification[];
  karaka: PlanetName[];
  description: string;
}

export const HOUSE_REFERENCE: HouseReference[] = [
  {
    house: 1,
    sanskritName: "Tanu Bhava",
    classification: ["Kendra"],
    karaka: ["Sun"],
    description:
      "The house of self — physical body, temperament, and the lens through which everything else in the chart is expressed. As the first Kendra it's considered one of the four pillars of the chart, and its lord's strength colors overall vitality and life direction.",
  },
  {
    house: 2,
    sanskritName: "Dhana Bhava",
    classification: ["Maraka"],
    karaka: ["Jupiter"],
    description:
      "Accumulated wealth, family, speech, and early-life values — what you keep and what you're taught to value. Classically also a Maraka (\"death-inflicting\") house in dasha timing, not because it causes harm but because its lord can trigger endings tied to the 8th from it.",
  },
  {
    house: 3,
    sanskritName: "Sahaja Bhava",
    classification: ["Upachaya"],
    karaka: ["Mars"],
    description:
      "Courage, effort, siblings, and short journeys — the house of what you build through your own initiative rather than what you inherit. Being an Upachaya house, its results are classically read as improving with age and sustained effort.",
  },
  {
    house: 4,
    sanskritName: "Sukha Bhava",
    classification: ["Kendra"],
    karaka: ["Moon", "Venus"],
    description:
      "Home, mother, emotional foundation, and property — inner contentment (sukha) rather than outer achievement. As a Kendra, a well-placed 4th lord is read as giving genuine peace of mind, not just material comfort.",
  },
  {
    house: 5,
    sanskritName: "Putra Bhava",
    classification: ["Trikona"],
    karaka: ["Jupiter"],
    description:
      "Children, intelligence, creativity, and Purva Punya — merit carried forward from past actions. One of the three Trikona (fortune) houses, and classically the house most closely tied to good fortune expressing through personal talent.",
  },
  {
    house: 6,
    sanskritName: "Ripu Bhava",
    classification: ["Dushthana", "Upachaya"],
    karaka: ["Mars", "Saturn"],
    description:
      "Obstacles, disease, debt, enemies, and daily work — the friction of daily life, faced and (ideally) overcome. It's unusual among the Dushthanas for also being an Upachaya house, meaning a difficult start here often improves with effort over time.",
  },
  {
    house: 7,
    sanskritName: "Yuvati Bhava",
    classification: ["Kendra", "Maraka"],
    karaka: ["Venus"],
    description:
      "Marriage, partnership, and open one-to-one relationships — the counterpart to the 1st house's self. As a Kendra its lord's condition matters greatly for the chart's overall strength; as a Maraka house it's also weighed carefully in longevity analysis.",
  },
  {
    house: 8,
    sanskritName: "Randhra Bhava",
    classification: ["Dushthana"],
    karaka: ["Saturn"],
    description:
      "Transformation, longevity, shared resources, and the occult — classically the most sensitive house in the chart, associated with sudden change and what lies hidden. Difficult by nature, but also linked to deep research, inheritance, and genuine transformation.",
  },
  {
    house: 9,
    sanskritName: "Dharma Bhava (Bhagya Bhava)",
    classification: ["Trikona"],
    karaka: ["Jupiter", "Sun"],
    description:
      "Fortune, higher learning, father, and one's guiding philosophy or dharma — widely considered the single most auspicious house in Parashari astrology. Its lord's strength is a major factor in how much support and \"luck\" a chart carries overall.",
  },
  {
    house: 10,
    sanskritName: "Karma Bhava",
    classification: ["Kendra", "Upachaya"],
    karaka: ["Sun", "Saturn", "Mercury", "Jupiter"],
    description:
      "Career, public standing, and action taken in the world — the most visible house in the chart, sitting exactly opposite the 4th's private inner life. Being both a Kendra and an Upachaya, professional results here are classically expected to build steadily over a lifetime.",
  },
  {
    house: 11,
    sanskritName: "Labha Bhava",
    classification: ["Upachaya"],
    karaka: ["Jupiter"],
    description:
      "Gains, income, aspirations, and social networks — what comes to you through your efforts and your circle. As an Upachaya house it's read as generally improving over time, and it's the house every Mahadasha lord ideally has some connection to for gains to actually materialize.",
  },
  {
    house: 12,
    sanskritName: "Vyaya Bhava",
    classification: ["Dushthana"],
    karaka: ["Saturn"],
    description:
      "Loss, expenditure, isolation, and spiritual release (moksha) — the house of what is given up, whether through expense, distance, or deliberate renunciation. Difficult in worldly terms but classically the house most associated with liberation and letting go.",
  },
];
