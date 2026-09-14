import { VARGA_KEYS, type VargaKey } from "../constants";
import { VARGA_INFO } from "../content";

export interface DivisionalChartReference {
  key: VargaKey;
  divisions: number;
  title: string;
  blurb: string;
  description: string;
}

const DIVISIONS: Record<VargaKey, number> = {
  D1: 1,
  D2: 2,
  D3: 3,
  D4: 4,
  D7: 7,
  D9: 9,
  D10: 10,
  D12: 12,
  D16: 16,
  D20: 20,
  D24: 24,
  D27: 27,
  D30: 30,
  D40: 40,
  D45: 45,
  D60: 60,
};

const DESCRIPTIONS: Record<VargaKey, string> = {
  D1: "The Rasi chart — the foundation every other divisional chart is read against. It shows the raw placement of every planet by sign and house, and is always consulted first before any varga is brought in to refine the picture.",
  D2: "The Hora splits each sign into two 15° halves ruled by the Sun and Moon, and is read for the flow and management of wealth over a lifetime — not just how much comes in, but how it's held onto.",
  D3: "The Drekkana divides each sign into three 10° thirds and is the classical chart for siblings, courage, and short efforts — the day-to-day initiative a person brings to their own life, separate from what they inherit.",
  D4: "The Chaturthamsa splits each sign into four 7.5° quarters and speaks to home, land, vehicles, and fixed property — the material base a person builds or is given to stand on.",
  D7: "The Saptamsa divides each sign into seven parts and is read for children, fertility, and legacy — what a person is able to bring into being and pass forward.",
  D9: "The Navamsa is the second-most-consulted chart after the Rasi itself. Traditionally read for marriage and spouse, it's also used more broadly to check the underlying strength of any planet — a planet that looks good in the Rasi but weak in the Navamsa is considered to have surface promise without deep support.",
  D10: "The Dasamsa divides each sign into ten parts and is the primary chart for career, professional standing, and public achievement — what a person is recognized and rewarded for doing in the world.",
  D12: "The Dwadasamsa splits each sign into twelve parts and is read for parents and ancestry — the inheritance, blessings, and karmic patterns carried forward from the family line.",
  D16: "The Shodasamsa (Kalamsa) divides each sign into sixteen parts and speaks to vehicles, comforts, and general happiness — the accumulated ease or difficulty of daily material life.",
  D20: "The Vimsamsa divides each sign into twenty parts and is consulted for spiritual inclination and progress along a religious or devotional path, separate from outward material success.",
  D24: "The Chaturvimsamsa (Siddhamsa) splits each sign into twenty-four parts and is read for education, learning, and the depth of knowledge a person is able to accumulate and apply.",
  D27: "The Bhamsa (Nakshatramsa) divides each sign into twenty-seven parts, mapped against the nakshatras themselves, and is used to read a person's innate strengths and weaknesses at a fine grain.",
  D30: "The Trimsamsa is built from unequal divisions ruled by the five classical non-luminary planets rather than equal slices, and is the traditional chart for misfortunes and difficulties — including a finer read on marriage than the Navamsa alone provides.",
  D40: "The Khavedamsa divides each sign into forty parts and is read for auspicious and inauspicious effects inherited specifically through the maternal line.",
  D45: "The Akshavedamsa divides each sign into forty-five parts and speaks to general character and conduct, read as inherited through the paternal line.",
  D60: "The Shashtiamsa is the finest-grained of the classical divisional charts, splitting each sign into sixty parts. It's traditionally considered the most important chart for confirming a planet's true, deep-seated nature and past-life karma — used to double-check conclusions drawn from every other chart.",
};

export const DIVISIONAL_CHART_REFERENCE: DivisionalChartReference[] = VARGA_KEYS.map((key) => ({
  key,
  divisions: DIVISIONS[key],
  title: VARGA_INFO[key].title,
  blurb: VARGA_INFO[key].blurb,
  description: DESCRIPTIONS[key],
}));
