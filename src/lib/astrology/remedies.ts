import type { PlanetName } from "./constants";
import { isCombust } from "./birthDetails";
import type { KundaliChart } from "./types";

/**
 * Traditional Jyotish remedies (upayas) derived from the chart. Gemstones are
 * recommended only for the benefic lords — Lagna (life stone), 5th (lucky
 * stone) and 9th (fortune stone) — because a gem strengthens a planet for
 * better or worse; weak or afflicted planets get mantra, charity and fasting
 * instead, which are considered safe for any planet.
 */

export interface PlanetRemedyInfo {
  gem: string;
  gemAlt: string;
  metal: string;
  finger: string;
  day: string;
  mantra: string;
  deity: string;
  charity: string;
  rudraksha: string;
  practice: string;
}

export const PLANET_REMEDIES: Record<PlanetName, PlanetRemedyInfo> = {
  Sun: {
    gem: "Ruby (Manik)",
    gemAlt: "Red garnet",
    metal: "Gold or copper",
    finger: "Ring finger",
    day: "Sunday",
    mantra: "Om Hraam Hreem Hraum Sah Suryaya Namah",
    deity: "Surya — recite the Aditya Hridayam",
    charity: "Wheat, jaggery or copper on Sundays",
    rudraksha: "1 or 12 Mukhi",
    practice: "Offer water (arghya) to the rising Sun and honour your father.",
  },
  Moon: {
    gem: "Pearl (Moti)",
    gemAlt: "Moonstone",
    metal: "Silver",
    finger: "Little finger",
    day: "Monday",
    mantra: "Om Shraam Shreem Shraum Sah Chandraya Namah",
    deity: "Shiva and Parvati",
    charity: "Rice, milk or white cloth on Mondays",
    rudraksha: "2 Mukhi",
    practice: "Keep a calm routine, spend time near water and look after your mother.",
  },
  Mars: {
    gem: "Red Coral (Moonga)",
    gemAlt: "Carnelian",
    metal: "Gold or copper",
    finger: "Ring finger",
    day: "Tuesday",
    mantra: "Om Kraam Kreem Kraum Sah Bhaumaya Namah",
    deity: "Hanuman — recite the Hanuman Chalisa",
    charity: "Red lentils (masoor dal) or jaggery on Tuesdays",
    rudraksha: "3 Mukhi",
    practice: "Channel energy into exercise and avoid acting in anger.",
  },
  Mercury: {
    gem: "Emerald (Panna)",
    gemAlt: "Peridot",
    metal: "Gold",
    finger: "Little finger",
    day: "Wednesday",
    mantra: "Om Braam Breem Braum Sah Budhaya Namah",
    deity: "Vishnu — recite the Vishnu Sahasranama",
    charity: "Green moong dal or green cloth on Wednesdays",
    rudraksha: "4 Mukhi",
    practice: "Feed green grass to cows and keep your word in dealings.",
  },
  Jupiter: {
    gem: "Yellow Sapphire (Pukhraj)",
    gemAlt: "Yellow topaz or citrine",
    metal: "Gold",
    finger: "Index finger",
    day: "Thursday",
    mantra: "Om Graam Greem Graum Sah Gurave Namah",
    deity: "Vishnu and Brihaspati",
    charity: "Chana dal, turmeric or yellow cloth on Thursdays",
    rudraksha: "5 Mukhi",
    practice: "Respect teachers and elders, and study or teach something worthwhile.",
  },
  Venus: {
    gem: "Diamond (Heera)",
    gemAlt: "White sapphire or white zircon",
    metal: "Platinum or silver",
    finger: "Middle finger",
    day: "Friday",
    mantra: "Om Draam Dreem Draum Sah Shukraya Namah",
    deity: "Lakshmi",
    charity: "Rice, sugar or white clothes on Fridays",
    rudraksha: "6 Mukhi",
    practice: "Keep your surroundings clean and beautiful, and treat women with respect.",
  },
  Saturn: {
    gem: "Blue Sapphire (Neelam)",
    gemAlt: "Amethyst",
    metal: "Silver or panchdhatu",
    finger: "Middle finger",
    day: "Saturday",
    mantra: "Om Praam Preem Praum Sah Shanaischaraya Namah",
    deity: "Shani and Hanuman",
    charity: "Black sesame, mustard oil, black cloth or iron on Saturdays",
    rudraksha: "7 Mukhi",
    practice: "Serve the elderly and labourers, and be patient and disciplined.",
  },
  Rahu: {
    gem: "Hessonite (Gomed)",
    gemAlt: "Orange zircon",
    metal: "Silver or panchdhatu",
    finger: "Middle finger",
    day: "Saturday",
    mantra: "Om Bhraam Bhreem Bhraum Sah Rahave Namah",
    deity: "Durga",
    charity: "A black blanket or mustard on Saturdays",
    rudraksha: "8 Mukhi",
    practice: "Avoid intoxicants and shortcuts; keep your dealings transparent.",
  },
  Ketu: {
    gem: "Cat's Eye (Lehsunia)",
    gemAlt: "Tiger's eye",
    metal: "Silver or panchdhatu",
    finger: "Little finger",
    day: "Tuesday",
    mantra: "Om Sraam Sreem Sraum Sah Ketave Namah",
    deity: "Ganesha",
    charity: "A blanket or sesame to the needy",
    rudraksha: "9 Mukhi",
    practice: "Meditate, feed stray dogs and let go of what no longer serves you.",
  },
};

export interface StoneRecommendation {
  kind: "Life stone" | "Lucky stone" | "Fortune stone";
  planet: PlanetName;
  house: 1 | 5 | 9;
  gem: string;
  why: string;
}

export interface PlanetSupport {
  planet: PlanetName;
  reasons: string[];
  /** Whether a gemstone is safe for this planet in this chart (never for 6th/8th/12th lords). */
  gemSuitable: boolean;
}

export interface DoshaRemedy {
  name: string;
  remedies: string[];
}

export interface RemedyPlan {
  stones: StoneRecommendation[];
  support: PlanetSupport[];
  doshas: DoshaRemedy[];
}

const DUSTHANA = new Set([6, 8, 12]);

export function computeRemedies(chart: KundaliChart): RemedyPlan {
  const lordOf = (house: number) => chart.houseLords.find((h) => h.house === house)!.lord;
  const lagnaLord = lordOf(1);
  const housesRuledBy = (planet: PlanetName) => chart.houseLords.filter((h) => h.lord === planet).map((h) => h.house);
  // A planet that rules a dusthana is a functional malefic unless it is also the Lagna lord.
  const gemSuitable = (planet: PlanetName) =>
    planet !== "Rahu" && planet !== "Ketu" && (planet === lagnaLord || !housesRuledBy(planet).some((h) => DUSTHANA.has(h)));

  const stones: StoneRecommendation[] = [];
  const seen = new Set<PlanetName>();
  const addStone = (kind: StoneRecommendation["kind"], house: 1 | 5 | 9, why: string) => {
    const planet = lordOf(house);
    if (seen.has(planet) || !gemSuitable(planet)) return;
    seen.add(planet);
    stones.push({ kind, planet, house, gem: PLANET_REMEDIES[planet].gem, why });
  };
  addStone("Life stone", 1, "Strengthens your Lagna lord — health, confidence and overall direction.");
  addStone("Lucky stone", 5, "Strengthens your 5th lord — intelligence, children, creativity and past merit.");
  addStone("Fortune stone", 9, "Strengthens your 9th lord — luck, dharma, mentors and higher learning.");

  const sun = chart.planets.find((p) => p.planet === "Sun")!;
  const support: PlanetSupport[] = [];
  for (const p of chart.planets) {
    const reasons: string[] = [];
    const bala = chart.shadbala.find((s) => s.planet === p.planet);
    if (bala && !bala.isStrong) reasons.push(`Below its required Shadbala (${bala.rupas.toFixed(2)} of ${bala.requiredRupas} rupas)`);
    if (p.dignity === "Debilitated") reasons.push(`Debilitated in ${p.sign}`);
    if (isCombust(p, sun)) reasons.push("Combust — too close to the Sun");
    if (chart.currentDasha?.lord === p.planet) reasons.push("Lord of your current Mahadasha");
    else if (chart.currentAntardasha?.lord === p.planet) reasons.push("Lord of your current Antardasha");
    if (reasons.length > 0) support.push({ planet: p.planet, reasons, gemSuitable: gemSuitable(p.planet) });
  }

  const doshas: DoshaRemedy[] = [];
  if (chart.mangalDosha.status === "present") {
    doshas.push({
      name: "Mangal Dosha",
      remedies: [
        "Recite the Hanuman Chalisa on Tuesdays and visit a Hanuman temple.",
        `Chant the Mangal mantra — ${PLANET_REMEDIES.Mars.mantra} — 108 times on Tuesdays.`,
        "Donate red lentils or jaggery on Tuesdays.",
        "Traditionally, matching with a partner who also has Mangal Dosha balances it; rituals such as Kumbh Vivah are decided with an astrologer.",
      ],
    });
  }
  if (chart.doshas.find((d) => (d.key ?? d.name).startsWith("Kaal Sarp"))?.present) {
    doshas.push({
      name: "Kaal Sarp Dosha",
      remedies: [
        "Chant the Maha Mrityunjaya mantra daily.",
        "Worship Shiva, especially on Mondays and on Nag Panchami.",
        "The Kaal Sarp Dosh puja (traditionally performed at Trimbakeshwar or Ujjain) is done under a priest's guidance.",
      ],
    });
  }
  if (chart.doshas.find((d) => (d.key ?? d.name).startsWith("Pitra"))?.present) {
    doshas.push({
      name: "Pitra Dosha",
      remedies: [
        "Offer tarpan and shraddha to your ancestors on Amavasya and during Pitru Paksha.",
        "Feed crows, cows and the needy in your ancestors' names.",
        "Pind daan at Gaya is the traditional remedy for serious cases.",
      ],
    });
  }
  if (chart.sadeSati.active) {
    doshas.push({
      name: `Sade Sati (${chart.sadeSati.phase} phase)`,
      remedies: [
        "Recite the Hanuman Chalisa or Shani Chalisa on Saturdays.",
        `Chant the Shani mantra — ${PLANET_REMEDIES.Saturn.mantra} — 108 times on Saturdays.`,
        "Donate mustard oil, black sesame or black cloth on Saturdays, and serve the elderly.",
      ],
    });
  }

  return { stones, support, doshas };
}
