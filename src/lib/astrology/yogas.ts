import type { PlanetPlacement, Yoga } from "./types";
import { getDignity } from "./dignity";
import { SIGN_LORDS, type PlanetName } from "./constants";

const KENDRA_HOUSES = new Set([1, 4, 7, 10]);
const BENEFICS = new Set<PlanetName>(["Mercury", "Jupiter", "Venus"]);

function houseFrom(base: PlanetPlacement, target: PlanetPlacement): number {
  return ((target.signIndex - base.signIndex + 12) % 12) + 1;
}

function houseFromSignIndex(baseSignIndex: number, target: PlanetPlacement): number {
  return ((target.signIndex - baseSignIndex + 12) % 12) + 1;
}

const MAHAPURUSHA: { planet: PlanetName; name: string }[] = [
  { planet: "Mars", name: "Ruchaka Yoga" },
  { planet: "Mercury", name: "Bhadra Yoga" },
  { planet: "Jupiter", name: "Hamsa Yoga" },
  { planet: "Venus", name: "Malavya Yoga" },
  { planet: "Saturn", name: "Sasha Yoga" },
];

export function detectYogas(planets: PlanetPlacement[], ascendantSignIndex: number): Yoga[] {
  const byName = new Map(planets.map((p) => [p.planet, p]));
  const yogas: Yoga[] = [];

  for (const { planet, name } of MAHAPURUSHA) {
    const p = byName.get(planet);
    if (!p) continue;
    const dignity = getDignity(planet, p.signIndex);
    const present = KENDRA_HOUSES.has(p.house) && (dignity === "Exalted" || dignity === "Own Sign");
    yogas.push({
      name: `${name} (Panch Mahapurusha)`,
      present,
      description: present
        ? `${planet} is in a kendra house (${p.house}) in its own or exalted sign — a classical Panch Mahapurusha combination associated with strength of character and achievement.`
        : `${planet} does not form ${name} in this chart (not in a kendra house in its own or exalted sign).`,
    });
  }

  const moon = byName.get("Moon");
  const jupiter = byName.get("Jupiter");
  if (moon && jupiter) {
    const rel = houseFrom(moon, jupiter);
    const present = KENDRA_HOUSES.has(rel);
    yogas.push({
      name: "Gaj Kesari Yoga",
      present,
      description: present
        ? "Jupiter is in a kendra (1st, 4th, 7th or 10th) from the Moon — a well-known combination for wisdom, reputation, and steady prosperity."
        : "Jupiter is not in a kendra from the Moon, so classical Gaj Kesari Yoga is not indicated.",
    });
  }

  const mars = byName.get("Mars");
  if (moon && mars) {
    const present = moon.signIndex === mars.signIndex;
    yogas.push({
      name: "Chandra-Mangal Yoga",
      present,
      description: present
        ? "Moon and Mars are conjunct — a combination classically linked to drive, resourcefulness, and the ability to generate wealth."
        : "Moon and Mars are not conjunct in this chart.",
    });
  }

  if (moon) {
    const others = planets.filter((p) => p.planet !== "Moon" && p.planet !== "Sun");
    const secondFromMoon = (moon.signIndex + 1) % 12;
    const twelfthFromMoon = (moon.signIndex + 11) % 12;
    const hasNeighbor = others.some((p) => p.signIndex === secondFromMoon || p.signIndex === twelfthFromMoon);
    yogas.push({
      name: "Kemadruma Yoga",
      present: !hasNeighbor,
      description: !hasNeighbor
        ? "No planets (besides the Sun) fall in the houses immediately before or after the Moon — the classical condition for Kemadruma Yoga, traditionally read as a caution needing the rest of the chart to be weighed carefully."
        : "Planets flank the Moon on at least one side, so Kemadruma Yoga is cancelled.",
    });
  }

  // --- Neechabhanga Raja Yoga: a debilitated planet's debilitation is cancelled
  // when the lord of its debilitation sign sits in a kendra from the Lagna or the Moon.
  {
    const debilitated = planets.filter((p) => getDignity(p.planet, p.signIndex) === "Debilitated");
    const cancelled = debilitated.filter((p) => {
      const dispositor = byName.get(SIGN_LORDS[p.signIndex] as PlanetName);
      if (!dispositor) return false;
      const fromLagna = houseFromSignIndex(ascendantSignIndex, dispositor);
      const fromMoon = moon ? houseFrom(moon, dispositor) : null;
      return KENDRA_HOUSES.has(fromLagna) || (fromMoon !== null && KENDRA_HOUSES.has(fromMoon));
    });
    const present = cancelled.length > 0;
    yogas.push({
      name: "Neechabhanga Raja Yoga",
      present,
      description: present
        ? `${cancelled.map((p) => p.planet).join(", ")} ${cancelled.length > 1 ? "are" : "is"} debilitated but the dispositor of that sign sits in a kendra from the Lagna or the Moon, classically cancelling the debilitation and turning it into a source of unexpected rise.`
        : debilitated.length > 0
          ? "A planet is debilitated in this chart, but the cancellation condition (its dispositor in a kendra from the Lagna or Moon) is not met."
          : "No planet is debilitated in this chart, so there is nothing to cancel.",
    });
  }

  // --- Vipareeta Raja Yoga: a dushthana (6th/8th/12th) lord placed in one of the OTHER two dushthanas.
  {
    const dushthanaLordOf = (house: number) => {
      const signIndex = (ascendantSignIndex + house - 1) % 12;
      return SIGN_LORDS[signIndex] as PlanetName;
    };
    const variants: { house: number; other: number[] }[] = [
      { house: 6, other: [8, 12] },
      { house: 8, other: [6, 12] },
      { house: 12, other: [6, 8] },
    ];
    const found = variants.filter(({ house, other }) => {
      const lord = byName.get(dushthanaLordOf(house));
      return lord && other.includes(lord.house);
    });
    const present = found.length > 0;
    yogas.push({
      name: "Vipareeta Raja Yoga",
      present,
      description: present
        ? `The lord of house ${found.map((f) => f.house).join(", ")} sits in another dushthana house (6th/8th/12th) — a classical Vipareeta Raja Yoga, often read as strength that emerges from overcoming difficulty rather than easy circumstance.`
        : "No dushthana (6th/8th/12th) lord is placed in another dushthana house, so Vipareeta Raja Yoga is not indicated.",
    });
  }

  // --- Parivartana Yoga: any two planets mutually exchange signs (each sits in a sign the other rules).
  {
    const classical = planets.filter((p) => p.planet !== "Rahu" && p.planet !== "Ketu");
    const pairs: string[] = [];
    for (let i = 0; i < classical.length; i++) {
      for (let j = i + 1; j < classical.length; j++) {
        const a = classical[i];
        const b = classical[j];
        if (SIGN_LORDS[a.signIndex] === b.planet && SIGN_LORDS[b.signIndex] === a.planet) {
          pairs.push(`${a.planet} ↔ ${b.planet}`);
        }
      }
    }
    const present = pairs.length > 0;
    yogas.push({
      name: "Parivartana Yoga",
      present,
      description: present
        ? `${pairs.join(", ")} mutually exchange signs — each sits in a sign the other rules, a classical combination that strongly links the two houses/significations involved.`
        : "No two planets mutually exchange signs in this chart.",
    });
  }

  // --- Adhi Yoga: only benefics (Mercury/Jupiter/Venus), no malefics, occupy the 6th/7th/8th houses from the Moon.
  if (moon) {
    const targetHouses = new Set([6, 7, 8]);
    const occupants = planets.filter((p) => p.planet !== "Moon" && targetHouses.has(houseFrom(moon, p)));
    const present = occupants.length > 0 && occupants.every((p) => BENEFICS.has(p.planet));
    yogas.push({
      name: "Adhi Yoga",
      present,
      description: present
        ? "Only benefic planets (Mercury, Jupiter, and/or Venus) occupy the 6th, 7th, or 8th house from the Moon, with no malefic among them — a classical combination for sustained authority and the ability to overcome opposition."
        : "The 6th/7th/8th houses from the Moon are either empty of benefics or also hold a malefic, so Adhi Yoga is not indicated.",
    });
  }

  // --- Shakat Yoga: the Moon sits in the 6th, 8th, or 12th house from Jupiter.
  if (moon && jupiter) {
    const rel = houseFrom(jupiter, moon);
    const present = rel === 6 || rel === 8 || rel === 12;
    yogas.push({
      name: "Shakat Yoga",
      present,
      description: present
        ? "The Moon is in the 6th, 8th, or 12th house from Jupiter — classically read as a caution for fluctuating fortune that Jupiter's other strengths need to offset."
        : "The Moon is not in the 6th, 8th, or 12th house from Jupiter, so Shakat Yoga is not indicated.",
    });
  }

  // --- Guru Chandal Yoga: Jupiter conjunct Rahu.
  {
    const rahu = byName.get("Rahu");
    const present = !!(jupiter && rahu && jupiter.signIndex === rahu.signIndex);
    yogas.push({
      name: "Guru Chandal Yoga",
      present,
      description: present
        ? "Jupiter is conjunct Rahu — a combination classically read as Jupiter's wisdom being filtered through Rahu's unconventional, amplifying influence, for better or worse depending on the rest of the chart."
        : "Jupiter is not conjunct Rahu in this chart.",
    });
  }

  // --- Budh-Aditya Yoga: Sun conjunct Mercury.
  {
    const sun = byName.get("Sun");
    const mercury = byName.get("Mercury");
    const present = !!(sun && mercury && sun.signIndex === mercury.signIndex);
    yogas.push({
      name: "Budh-Aditya Yoga",
      present,
      description: present
        ? "Sun and Mercury are conjunct — a classical combination for sharp intellect and articulate communication."
        : "Sun and Mercury are not conjunct in this chart.",
    });
  }

  // --- Amala Yoga: only a benefic, no malefic, in the 10th house from the Moon or from the Lagna.
  {
    const tenthFromMoonOccupants = moon ? planets.filter((p) => p.planet !== "Moon" && houseFrom(moon, p) === 10) : [];
    const tenthFromLagnaOccupants = planets.filter((p) => houseFromSignIndex(ascendantSignIndex, p) === 10);
    const clean = (occupants: PlanetPlacement[]) => occupants.length > 0 && occupants.every((p) => BENEFICS.has(p.planet));
    const present = clean(tenthFromMoonOccupants) || clean(tenthFromLagnaOccupants);
    yogas.push({
      name: "Amala Yoga",
      present,
      description: present
        ? "Only a benefic (Mercury, Jupiter, and/or Venus) occupies the 10th house from the Moon or the Lagna, with no malefic there — classically associated with a lasting good reputation."
        : "The 10th house from the Moon and from the Lagna is either empty of benefics or also holds a malefic, so Amala Yoga is not indicated.",
    });
  }

  return yogas;
}
