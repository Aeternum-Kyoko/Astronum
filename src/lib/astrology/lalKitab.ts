import type { PlanetName } from "./constants";
import type { KundaliChart } from "./types";

/**
 * Lal Kitab. The chart is fixed — Aries is always the 1st house — and each
 * planet sits in the house it occupies from the Lagna. Planets are judged by
 * house alone: their permanent house (pakka ghar), exaltation and
 * debilitation by house, and the classic house-by-house readings. The book
 * is known for karmic debts (rin) shown by specific placements, and for
 * simple, inexpensive remedies (upay).
 */

type Verdict = "Good" | "Mixed" | "Weak";

export interface LalKitabPlanet {
  planet: PlanetName;
  house: number;
  status: string[];
  verdict: Verdict;
  reading: string;
  remedies: string[];
}

export interface Rin {
  name: string;
  cause: string;
  signs: string;
  remedy: string;
}

export interface LalKitabReading {
  planets: LalKitabPlanet[];
  rins: Rin[];
  rules: string[];
}

const PAKKA_GHAR: Record<PlanetName, number[]> = { Sun: [1], Moon: [4], Mars: [3, 8], Mercury: [7], Jupiter: [2], Venus: [7], Saturn: [8, 10], Rahu: [12], Ketu: [6] };
const EXALTED: Record<PlanetName, number[]> = { Sun: [1], Moon: [2], Mars: [10], Mercury: [6], Jupiter: [4], Venus: [12], Saturn: [7], Rahu: [3, 6], Ketu: [9, 12] };
const DEBILITATED: Record<PlanetName, number[]> = { Sun: [7], Moon: [8], Mars: [4], Mercury: [12], Jupiter: [10], Venus: [6], Saturn: [1], Rahu: [8, 9], Ketu: [3, 6] };

/** [verdict, reading] for houses 1–12. */
const READINGS: Record<PlanetName, [Verdict, string][]> = {
  Sun: [
    ["Good", "A king-like Sun: self-respect, government favour and good health. Keep your character clean; dishonesty makes it fall."],
    ["Good", "Wealth through your own effort and family support; generous speech. Avoid accepting gifts you have not earned."],
    ["Good", "Brave and self-made; siblings and neighbours help. Long life; keep good conduct towards neighbours."],
    ["Mixed", "Comforts and inherited property, but a heated home atmosphere. Help the needy and keep peace with your mother."],
    ["Good", "Clever, respected and blessed with children; rise through intelligence. Don't delay good deeds."],
    ["Mixed", "Victory over enemies and a service career, but family friction. Keep the Sun strong through discipline."],
    ["Weak", "Debilitated: strain in marriage and business partnerships, and the father's health may suffer. Remedies help a great deal."],
    ["Mixed", "Long life but a hot temper and sudden changes. Never accept free things from others."],
    ["Good", "Fortunate and religious; good relations with father and teachers. Generosity multiplies luck."],
    ["Good", "High position and authority, often in government. Avoid wearing blue or black; keep good relations with seniors."],
    ["Good", "Gains from powerful people; a vegetarian, clean life keeps the Sun strong."],
    ["Weak", "Expenses, poor sleep and trouble with government. Keep your house's courtyard open to sunlight."],
  ],
  Moon: [
    ["Good", "Calm, kind and caring; the mother's blessings protect you. Keep water or milk flowing to others."],
    ["Good", "Exalted: steady wealth, a sweet voice and a good family life. Never sell milk or water for profit."],
    ["Good", "Long life and helpful siblings; a sharp, imaginative mind. Serve young girls."],
    ["Good", "In its own house: home comforts, property and a loving mother — one of the best placements."],
    ["Good", "Good children and education; a sensitive heart. Don't be greedy."],
    ["Mixed", "Service to others and caring work, but worry and weak health. Offer milk at a temple."],
    ["Mixed", "An emotional, devoted marriage; mother-in-law relations need care. Keep silver with you."],
    ["Weak", "Debilitated: anxiety, emotional losses and trouble with inheritance. Perform the Moon's remedies faithfully."],
    ["Good", "Religious, fortunate and fond of travel; blessings of the elders."],
    ["Mixed", "Public fame but a fluctuating career; avoid milk at night."],
    ["Good", "Gains through the public and women; many friends."],
    ["Mixed", "Restless mind and sleep trouble, but spiritual and generous. Avoid sleeping late."],
  ],
  Mars: [
    ["Good", "Brave, energetic and honest; leadership. Keep away from lies and quarrels."],
    ["Mixed", "Earnings through property or courage, but harsh speech hurts the family."],
    ["Good", "In its own house: courage, helpful brothers and success through effort."],
    ["Weak", "Debilitated: fire in the home — anger, property disputes and trouble with the mother. Remedies needed."],
    ["Mixed", "Intelligent and competitive; care needed for children's health."],
    ["Good", "Defeats enemies and wins disputes; good for service, sport and the police."],
    ["Mixed", "Passionate partnerships with friction — Mangal Dosha by Lal Kitab. Keep sweetness in speech."],
    ["Weak", "Sudden accidents or surgery and trouble with siblings. Donate sweets on Tuesdays."],
    ["Good", "Fortune through brothers and courage; respect elders."],
    ["Good", "Exalted: authority, property, engineering or army success."],
    ["Good", "Gains through property and siblings; a fearless nature."],
    ["Mixed", "Expenses on land and hospitals; control anger at night."],
  ],
  Mercury: [
    ["Mixed", "Clever and witty, but restless; avoid gossip and eggs, alcohol and meat."],
    ["Good", "Wealth through trade, writing and speech."],
    ["Mixed", "Skilled communicator, but can harm siblings through words."],
    ["Good", "Educated, with comforts; gains through trade and property."],
    ["Good", "Intelligent children and success in study and business."],
    ["Good", "Exalted: brilliant intellect, success in accounts, law and trade."],
    ["Good", "In its own house: a smart partner and good business sense."],
    ["Weak", "Nervous strain and trouble through speech or documents. Clean your teeth with alum."],
    ["Mixed", "Religious learning, but beware of hypocrisy; respect sisters and daughters."],
    ["Good", "A career in business, media or accounts."],
    ["Mixed", "Gains through friends, but friends may deceive."],
    ["Weak", "Debilitated: loss through bad advice, worry and sleeplessness. Avoid green in the bedroom."],
  ],
  Jupiter: [
    ["Good", "Wise, respected and religious; a teacher's nature."],
    ["Good", "In its own house: wealth, a large family and honour — the best place for Jupiter."],
    ["Mixed", "Learned and courageous, but may lose through overconfidence."],
    ["Good", "Exalted: property, vehicles, a happy home and a noble mother."],
    ["Good", "Blessed children and deep intelligence."],
    ["Mixed", "Service and healing, but health of the liver needs care."],
    ["Mixed", "A wise spouse, but delays in marriage; respect gurus."],
    ["Mixed", "Long life and inheritance; spiritual research."],
    ["Good", "Highly fortunate, religious and prosperous."],
    ["Weak", "Debilitated: career setbacks unless you stay humble; don't hoard wealth."],
    ["Good", "Gains through elders and good deeds."],
    ["Mixed", "Spiritual and charitable, but expenses; keep yellow items at home."],
  ],
  Venus: [
    ["Good", "Attractive and artistic; a comfortable life."],
    ["Good", "Wealth through family, beauty or art; a sweet voice."],
    ["Mixed", "Romantic and social, but careless with money."],
    ["Mixed", "Comforts and vehicles, but domestic arguments."],
    ["Mixed", "Creative and romantic; love life is eventful."],
    ["Weak", "Debilitated: trouble in marriage and with women's health. Remedies for Venus help."],
    ["Good", "In its own house: a loving, beautiful partner and business success."],
    ["Mixed", "Hidden desires and sudden gains through the spouse."],
    ["Good", "Fortunate marriage and religious journeys."],
    ["Good", "Success in arts, fashion and luxury trades."],
    ["Good", "Gains through women and arts."],
    ["Good", "Exalted: luxurious pleasures and a happy bed life; generous."],
  ],
  Saturn: [
    ["Weak", "Debilitated: struggle early in life and health trouble. Avoid alcohol and meat."],
    ["Mixed", "Wealth that comes slowly; avoid lies."],
    ["Good", "Hardworking and long-lived; property later in life."],
    ["Mixed", "Mother's health and domestic peace need care; don't keep liquor at home."],
    ["Mixed", "Delays with children; keep a disciplined life."],
    ["Mixed", "Victory over enemies through patience; service jobs."],
    ["Good", "Exalted: a mature partner, success in business and law."],
    ["Good", "In its own house: long life, inheritance and endurance."],
    ["Good", "Fortunate after hard work; respect elders."],
    ["Good", "In its own house: a strong career through discipline; government or industry."],
    ["Good", "Steady gains and a long life."],
    ["Mixed", "Expenses and isolation, but good for spiritual life; don't lie."],
  ],
  Rahu: [
    ["Mixed", "Ambitious and unconventional; sudden rise and fall."],
    ["Weak", "Unstable finances and family quarrels; keep silver with you."],
    ["Good", "Exalted: courage and success against enemies; long life."],
    ["Mixed", "Restless home life; property through unusual means."],
    ["Mixed", "Clever but anxious about children."],
    ["Good", "Exalted: defeats enemies and wins disputes."],
    ["Mixed", "An unusual marriage; avoid deception in partnerships."],
    ["Weak", "Debilitated: sudden troubles, accidents and scandals. Remedies strongly advised."],
    ["Weak", "Debilitated: confusion in faith and trouble with father. Keep good relations with in-laws."],
    ["Mixed", "Rise in career through bold moves; avoid shortcuts."],
    ["Mixed", "Gains, but through risky company."],
    ["Mixed", "In its own house: expenses and sleep trouble, but foreign links."],
  ],
  Ketu: [
    ["Mixed", "Spiritual and intuitive, but restless."],
    ["Mixed", "Irregular income; speak carefully."],
    ["Weak", "Debilitated: separation from siblings and travel troubles."],
    ["Mixed", "Unsettled home; mother's health needs care."],
    ["Mixed", "Intelligent but worries over children."],
    ["Weak", "Debilitated in Lal Kitab: health and legal troubles — though its own house; feed dogs."],
    ["Mixed", "Detached partnerships; travel with the spouse."],
    ["Mixed", "Research and occult gifts; sudden events."],
    ["Good", "Exalted: spiritual fortune and blessings; good for sons."],
    ["Mixed", "A career with breaks and changes."],
    ["Good", "Gains through spiritual or technical work."],
    ["Good", "Exalted: liberation, peaceful sleep and spiritual growth."],
  ],
};

const UPAY: Record<PlanetName, string[]> = {
  Sun: ["Offer water mixed with jaggery to the rising Sun every morning", "Float a copper coin in flowing water", "Respect and serve your father; avoid accepting free gifts"],
  Moon: ["Keep a silver piece or square of silver with you", "Serve your mother and take her blessings", "Keep a pot of water by your bed at night and pour it on a plant in the morning"],
  Mars: ["Float sweets (batashe) in flowing water on Tuesdays", "Keep good relations with brothers", "Keep honey or a red handkerchief with you"],
  Mercury: ["Feed green fodder to cows", "Float a copper coin with a hole in flowing water", "Clean your teeth with alum; respect your sisters and daughters"],
  Jupiter: ["Apply a saffron or turmeric tilak on the forehead", "Serve teachers and priests; water a peepal tree", "Keep a yellow cloth or turmeric at home"],
  Venus: ["Donate curd, ghee or camphor", "Respect your spouse and keep your appearance clean", "Feed cows with part of your meal"],
  Saturn: ["Feed crows and help labourers", "Donate mustard oil after seeing your reflection in it on Saturdays", "Avoid alcohol, meat and lies"],
  Rahu: ["Keep a square piece of solid silver with you", "Float barley or coal in flowing water", "Keep good relations with your in-laws; avoid wearing blue"],
  Ketu: ["Feed dogs, especially black-and-white ones", "Donate a blanket to the needy", "Worship Ganesha and help your nephews"],
};

export function lalKitab(chart: KundaliChart): LalKitabReading {
  const H = new Map(chart.planets.map((p) => [p.planet, p.house]));
  const planets: LalKitabPlanet[] = chart.planets.map((p) => {
    const h = p.house;
    const status: string[] = [];
    if (PAKKA_GHAR[p.planet].includes(h)) status.push("In its permanent house (pakka ghar)");
    if (EXALTED[p.planet].includes(h)) status.push("Exalted (uchcha) by Lal Kitab");
    if (DEBILITATED[p.planet].includes(h)) status.push("Debilitated (neecha) by Lal Kitab");
    const [verdict, reading] = READINGS[p.planet][h - 1];
    return { planet: p.planet, house: h, status, verdict, reading, remedies: verdict === "Good" ? [] : UPAY[p.planet] };
  });

  const inAny = (pl: PlanetName[], houses: number[]) => pl.filter((x) => houses.includes(H.get(x)!));
  const rins: Rin[] = [];
  const push = (name: string, hit: PlanetName[], houses: number[], cause: string, remedy: string) => {
    if (hit.length) rins.push({ name, cause, signs: `${hit.join(" and ")} in the ${houses.filter((h) => hit.some((x) => H.get(x) === h)).map(ord).join(" or ")} house`, remedy });
  };
  push("Pitra Rin (ancestral debt)", inAny(["Venus", "Mercury", "Rahu"], [2, 5, 9, 12]), [2, 5, 9, 12], "Disrespect of family deities, elders or the family priest in past generations.", "Collect an equal amount of money from every family member and donate it for a good cause on one day; water a peepal tree.");
  push("Matri Rin (debt to the mother)", inAny(["Ketu"], [4]), [4], "Neglect of a mother or mother-figure in the family line.", "Collect equal silver from all family members and float it in flowing water on one day.");
  push("Stri Rin (debt to women)", inAny(["Sun", "Rahu", "Ketu"], [2, 7]), [2, 7], "Mistreatment of a wife or women in the family line.", "Feed 100 cows in one day with money contributed by all family members.");
  push("Bhai-Bandhu Rin (debt to relatives)", inAny(["Mercury", "Ketu"], [1, 8]), [1, 8], "Deceiving or harming relatives or friends.", "Collect money from all relatives and spend it on medicines or help for the needy.");
  push("Behen-Beti Rin (debt to sisters and daughters)", inAny(["Moon"], [3, 6]), [3, 6], "Mistreatment of a sister or daughter.", "Buy yellow cowries with family contributions, burn them and float the ash in flowing water.");
  push("Zulm Rin (debt of cruelty)", inAny(["Sun", "Moon", "Mars"], [10, 11]), [10, 11], "Cruelty or cheating towards the helpless.", "Feed 100 labourers in one day with money from all family members.");
  push("Ajanma Rin (debt to the unborn)", inAny(["Sun", "Venus", "Mars"], [12]), [12], "Harm to an unborn child or a pregnant woman in the family line.", "Collect one coconut from each family member and float them all in flowing water on one day.");
  push("Kudrati Rin (divine debt)", inAny(["Mars", "Moon"], [6]), [6], "Harm to animals or disregard for nature.", "Feed dogs and help widows; the whole family should contribute.");

  return {
    planets,
    rins,
    rules: [
      "Lal Kitab remedies are done for 40 or 43 consecutive days, one remedy at a time, and only during daylight.",
      "Remedies should be done by you or a blood relative; someone else's remedy doesn't work for you.",
      "Keep good conduct — Lal Kitab holds that behaviour strengthens or spoils every planet.",
      "For a karmic debt (rin), the whole family contributes equally; the remedy is done together.",
    ],
  };
}

function ord(n: number) {
  return `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
}
