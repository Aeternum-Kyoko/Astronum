import { NAKSHATRAS, SIGNS, type PlanetName } from "../constants";
import { nakshatraLord } from "../dasha";

export interface NakshatraReference {
  index: number;
  name: string;
  rulingPlanet: PlanetName;
  degreeSpan: string;
  deity: string;
  symbol: string;
  gana: "Deva" | "Manushya" | "Rakshasa";
  nature: string;
  keynote: string;
}

const ARCMIN_PER_NAKSHATRA = 800; // 360*60 / 27 = 13°20' exactly

function positionAt(arcmin: number): { signIndex: number; deg: number; min: number } {
  if (arcmin === 21600) return { signIndex: 11, deg: 30, min: 0 }; // display the zodiac's end as 30° Pisces, not 0° Aries
  const norm = ((arcmin % 21600) + 21600) % 21600;
  const signIndex = Math.floor(norm / 1800); // 1800 arcmin = 30°
  const remInSign = norm - signIndex * 1800;
  return { signIndex, deg: Math.floor(remInSign / 60), min: remInSign % 60 };
}

function fmt(deg: number, min: number): string {
  return `${deg}°${String(min).padStart(2, "0")}′`;
}

/** Exact sidereal degree span of a nakshatra, straddling sign boundaries wherever the arithmetic actually puts it (only every 9th nakshatra lands cleanly on one). */
function degreeSpanLabel(index: number): string {
  const start = positionAt(index * ARCMIN_PER_NAKSHATRA);
  const end = positionAt((index + 1) * ARCMIN_PER_NAKSHATRA);
  if (start.signIndex === end.signIndex) {
    return `${fmt(start.deg, start.min)}–${fmt(end.deg, end.min)} ${SIGNS[start.signIndex]}`;
  }
  return `${fmt(start.deg, start.min)} ${SIGNS[start.signIndex]} – ${fmt(end.deg, end.min)} ${SIGNS[end.signIndex]}`;
}

interface RawEntry {
  deity: string;
  symbol: string;
  gana: "Deva" | "Manushya" | "Rakshasa";
  nature: string;
  keynote: string;
}

const RAW: RawEntry[] = [
  { deity: "The Ashwini Kumaras (twin divine physicians)", symbol: "A horse's head", gana: "Deva", nature: "Light and swift (Laghu)", keynote: "Quick to act and quick to heal — the energy of a fast start, first response, and pioneering initiative." },
  { deity: "Yama, god of death and dharma", symbol: "The yoni (womb)", gana: "Manushya", nature: "Fierce (Ugra)", keynote: "The intensity of birth, death, and everything that must be restrained or endured to bring something new into being." },
  { deity: "Agni, the fire god", symbol: "A razor or flame", gana: "Rakshasa", nature: "Mixed (Mishra)", keynote: "A sharp, purifying edge — burns away what's unnecessary, sometimes bluntly, in service of something cleaner underneath." },
  { deity: "Brahma (Prajapati), the creator", symbol: "An ox-cart or chariot", gana: "Manushya", nature: "Fixed (Dhruva/Sthira)", keynote: "Fertility, growth, and material abundance — a steady, sensuous appetite for what is beautiful and lasting." },
  { deity: "Soma, the Moon god", symbol: "A deer's head", gana: "Deva", nature: "Soft (Mridu)", keynote: "A gentle, searching curiosity — always looking a little further, never quite satisfied with the first answer." },
  { deity: "Rudra, the storm god", symbol: "A teardrop or gemstone", gana: "Manushya", nature: "Sharp (Tikshna)", keynote: "Transformation through upheaval — growth that comes only after something is first broken down." },
  { deity: "Aditi, mother of the gods", symbol: "A bow and quiver", gana: "Deva", nature: "Movable (Chara)", keynote: "Renewal and safe return — the sense of coming home again after having gone through something difficult." },
  { deity: "Brihaspati, guru of the gods", symbol: "A cow's udder or lotus", gana: "Deva", nature: "Light and swift (Laghu)", keynote: "Nourishment and quiet abundance — classically considered one of the most auspicious nakshatras of all." },
  { deity: "The Nagas, serpent deities", symbol: "A coiled serpent", gana: "Rakshasa", nature: "Sharp (Tikshna)", keynote: "Hypnotic, entwining, and secretive — power that works below the surface rather than out in the open." },
  { deity: "The Pitris, ancestral spirits", symbol: "A royal throne", gana: "Rakshasa", nature: "Fierce (Ugra)", keynote: "Lineage and inherited authority — status and power that come from what was handed down, not built from scratch." },
  { deity: "Bhaga, god of fortune and marital bliss", symbol: "The front legs of a bed", gana: "Manushya", nature: "Fierce (Ugra)", keynote: "Ease, enjoyment, and the pleasures of partnership — a comfortable, sociable warmth." },
  { deity: "Aryaman, god of patronage and contracts", symbol: "The back legs of a bed", gana: "Manushya", nature: "Fixed (Dhruva/Sthira)", keynote: "Reliable partnership and generosity — the kind of steady support that holds up over the long run." },
  { deity: "Savitar, the enlivening aspect of the Sun", symbol: "A hand or closed fist", gana: "Deva", nature: "Light and swift (Laghu)", keynote: "Skillful hands and practical craft — the ability to actually make something happen, not just plan it." },
  { deity: "Vishvakarma, the divine architect", symbol: "A bright jewel or pearl", gana: "Rakshasa", nature: "Soft (Mridu)", keynote: "An eye for design and brilliance — drawn to what shines, and often skilled at creating it." },
  { deity: "Vayu, the wind god", symbol: "A young shoot or coral", gana: "Deva", nature: "Movable (Chara)", keynote: "Independence and adaptability — moves with circumstance rather than resisting it, like wind finding its way." },
  { deity: "Indra-Agni, joint deities of power and fire", symbol: "A decorated archway or potter's wheel", gana: "Rakshasa", nature: "Mixed (Mishra)", keynote: "Focused, goal-driven determination — a single-minded push toward a chosen purpose." },
  { deity: "Mitra, god of friendship and alliance", symbol: "A lotus or triumphal archway", gana: "Deva", nature: "Soft (Mridu)", keynote: "Loyalty and deep, considered friendship — relationships built slowly and taken seriously." },
  { deity: "Indra, king of the gods", symbol: "A circular amulet or umbrella", gana: "Rakshasa", nature: "Sharp (Tikshna)", keynote: "Courageous leadership through seniority and effort — earned authority rather than given." },
  { deity: "Nirriti, goddess of dissolution", symbol: "A bunch of roots or a lion's tail", gana: "Rakshasa", nature: "Sharp (Tikshna)", keynote: "Going to the root of things, even when that means confronting destruction along the way." },
  { deity: "Apas, the water goddess", symbol: "A fan or winnowing basket", gana: "Manushya", nature: "Fierce (Ugra)", keynote: "Early, unstoppable momentum — conviction that carries a person forward before the outcome is even settled." },
  { deity: "The Vishvadevas, universal gods", symbol: "An elephant's tusk", gana: "Manushya", nature: "Fixed (Dhruva/Sthira)", keynote: "Quiet, universal integrity — victory that comes from principle and steady effort rather than force." },
  { deity: "Vishnu, the preserver", symbol: "An ear or three footprints", gana: "Deva", nature: "Movable (Chara)", keynote: "Listening, learning, and connection across distance — the instinct to hear and to travel far to do it." },
  { deity: "The Vasus, eight elemental gods", symbol: "A drum or flute", gana: "Rakshasa", nature: "Movable (Chara)", keynote: "Rhythm, wealth, and generosity expressed through sound and celebration." },
  { deity: "Varuna, god of cosmic law and the ocean", symbol: "An empty circle or a hundred flowers/stars", gana: "Rakshasa", nature: "Movable (Chara)", keynote: "Vast, somewhat solitary depth — healing gifts, but a natural inclination toward privacy." },
  { deity: "Aja Ekapada, the one-footed serpent", symbol: "The front legs of a funeral cot, or a sword", gana: "Manushya", nature: "Fierce (Ugra)", keynote: "Intense, sometimes turbulent spiritual fire — transformation that can feel two-edged before it settles." },
  { deity: "Ahir Budhnya, serpent of the deep", symbol: "The back legs of a funeral cot, or a twin serpent", gana: "Manushya", nature: "Fixed (Dhruva/Sthira)", keynote: "Deep, hidden wisdom that surfaces slowly — a quiet reservoir rather than a visible display." },
  { deity: "Pushan, nourisher and guide of souls", symbol: "A fish, or a pair of fish", gana: "Deva", nature: "Soft (Mridu)", keynote: "Compassionate completion — the last nakshatra, closing one cycle gently before the next begins." },
];

export const NAKSHATRA_REFERENCE: NakshatraReference[] = NAKSHATRAS.map((name, index) => ({
  index,
  name,
  rulingPlanet: nakshatraLord(index),
  degreeSpan: degreeSpanLabel(index),
  ...RAW[index],
}));
