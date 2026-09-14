import type { PlanetName, SignName, VargaKey } from "./constants";

/** One-line classical keynote for each sign — used to describe what the Ascendant, Moon, or Sun sign colors. */
export const SIGN_KEYNOTE: Record<SignName, string> = {
  Aries: "direct, initiating, and quick to act",
  Taurus: "steady, patient, and grounded in the material and sensory world",
  Gemini: "curious, communicative, and quick to adapt",
  Cancer: "emotionally attuned, protective, and rooted in home and memory",
  Leo: "confident, expressive, and drawn to recognition and leadership",
  Virgo: "analytical, precise, and oriented toward service and improvement",
  Libra: "relational, balance-seeking, and attentive to fairness and harmony",
  Scorpio: "intense, private, and drawn to what lies beneath the surface",
  Sagittarius: "expansive, philosophical, and driven by a search for meaning",
  Capricorn: "disciplined, ambitious, and patient about long-term structure",
  Aquarius: "independent, idea-driven, and oriented toward groups and the future",
  Pisces: "imaginative, empathetic, and porous to the moods around them",
};

/** One-line classical keynote for each graha — used in dasha and house-lord narration. */
export const PLANET_KEYNOTE: Record<PlanetName, string> = {
  Sun: "identity, authority, father, and vitality",
  Moon: "mind, emotion, mother, and instinctive response",
  Mars: "drive, courage, conflict, and physical energy",
  Mercury: "intellect, communication, commerce, and adaptability",
  Jupiter: "growth, wisdom, fortune, and higher learning",
  Venus: "relationships, pleasure, art, and material comfort",
  Saturn: "discipline, delay, responsibility, and long-term structure",
  Rahu: "ambition, obsession, and areas of unconventional, amplified drive",
  Ketu: "detachment, past-life residue, and areas of quiet renunciation",
};

/** Name and one-line classical use for each divisional chart (varga) beyond D1. */
export const VARGA_INFO: Record<VargaKey, { title: string; blurb: string }> = {
  D1: { title: "Rasi Chart", blurb: "The main birth chart — body, personality, and the overall shape of life." },
  D2: { title: "Hora", blurb: "Wealth and the flow of financial resources over a lifetime." },
  D3: { title: "Drekkana", blurb: "Siblings, courage, and short efforts and journeys." },
  D4: { title: "Chaturthamsa", blurb: "Home, property, vehicles, and fixed assets." },
  D7: { title: "Saptamsa", blurb: "Children, fertility, and legacy carried forward." },
  D9: { title: "Navamsa", blurb: "Marriage, spouse, and the inner strength a planet actually carries." },
  D10: { title: "Dasamsa", blurb: "Career, public standing, and professional achievement." },
  D12: { title: "Dwadasamsa", blurb: "Parents and ancestry." },
  D16: { title: "Shodasamsa", blurb: "Vehicles, comforts, and general happiness." },
  D20: { title: "Vimsamsa", blurb: "Spiritual practice and progress on a religious or devotional path." },
  D24: { title: "Chaturvimsamsa", blurb: "Education, learning, and accumulated knowledge." },
  D27: { title: "Bhamsa", blurb: "Innate strengths and weaknesses, read nakshatra by nakshatra." },
  D30: { title: "Trimsamsa", blurb: "Misfortunes, difficulties, and the finer texture of a marriage beyond the Navamsa." },
  D40: { title: "Khavedamsa", blurb: "Auspicious and inauspicious effects inherited from the maternal line." },
  D45: { title: "Akshavedamsa", blurb: "General character and conduct, inherited from the paternal line." },
  D60: { title: "Shashtiamsa", blurb: "The finest-grained classical division — past-life karma and overall life texture." },
};

/** Classical significations for houses 1-12, used in the house-lord table. */
export const HOUSE_SIGNIFICATION: Record<number, string> = {
  1: "self, body, personality, and general life direction",
  2: "wealth, family, speech, and accumulated values",
  3: "courage, siblings, effort, and short journeys",
  4: "home, mother, emotional foundation, and property",
  5: "children, intelligence, creativity, and past-life merit",
  6: "obstacles, health, debt, and daily work",
  7: "partnership, marriage, and open relationships",
  8: "transformation, longevity, shared resources, and the occult",
  9: "fortune, dharma, higher learning, and father",
  10: "career, public standing, and action in the world",
  11: "gains, aspirations, and social networks",
  12: "loss, expenditure, isolation, and spiritual release",
};
