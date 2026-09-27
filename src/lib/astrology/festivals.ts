import { DateTime } from "luxon";
import {
  addDays,
  localDate,
  localDayTimes,
  lunarMonthsBetween,
  sankranti,
  tithiSpan,
  type DayTimes,
  type LunarMonth,
  type LunarMonthSpan,
} from "./lunarCalendar";

/**
 * Festival and vrat dates for a year at a given place. Each festival is a
 * tithi in an (amanta) lunar month, observed on the civil day on which that
 * tithi prevails at its karmakala — the part of the day the observance belongs
 * to (sunrise for most, midnight for Janmashtami, pradosh for Diwali, and so
 * on). Regional traditions differ, so dates can vary by a day between
 * almanacs; the defaults follow common North Indian practice.
 */

export type Karmakala = "sunrise" | "midday" | "afternoon" | "pradosh" | "midnight" | "moonrise";

export type FestivalCategory = "Festival" | "Ekadashi" | "Purnima" | "Amavasya" | "Sankashti Chaturthi" | "Pradosh Vrat" | "Sankranti";

export interface FestivalDef {
  slug: string;
  name: string;
  month: LunarMonth;
  /** 0 = Shukla Pratipada … 14 = Purnima, 15 = Krishna Pratipada … 29 = Amavasya. */
  tithi: number;
  kala: Karmakala;
  description: string;
  /** Observed this many days after the resolved tithi day (Holi follows Holika Dahan). */
  offsetDays?: number;
}

const S = (n: number) => n - 1; // Shukla tithi n
const K = (n: number) => 14 + n; // Krishna tithi n (amanta)
const PURNIMA = 14;
const AMAVASYA = 29;

export const FESTIVALS: FestivalDef[] = [
  { slug: "vasant-panchami", name: "Vasant Panchami", month: "Magha", tithi: S(5), kala: "sunrise", description: "Welcomes spring and honours Saraswati, goddess of learning and the arts. Children often begin their education on this day." },
  { slug: "maha-shivaratri", name: "Maha Shivaratri", month: "Magha", tithi: K(14), kala: "midnight", description: "The great night of Shiva, kept with fasting, night-long vigil and worship of the Shivalinga, especially at midnight (nishita kaal)." },
  { slug: "holika-dahan", name: "Holika Dahan", month: "Phalguna", tithi: PURNIMA, kala: "pradosh", description: "Bonfires on the full-Moon evening before Holi mark the victory of devotion (Prahlad) over evil (Holika)." },
  { slug: "holi", name: "Holi", month: "Phalguna", tithi: PURNIMA, kala: "pradosh", offsetDays: 1, description: "The festival of colours, celebrated the morning after Holika Dahan." },
  { slug: "ugadi-gudi-padwa", name: "Ugadi / Gudi Padwa · Chaitra Navratri begins", month: "Chaitra", tithi: S(1), kala: "sunrise", description: "The Hindu new year in much of India, and the first day of Chaitra Navratri." },
  { slug: "ram-navami", name: "Ram Navami", month: "Chaitra", tithi: S(9), kala: "midday", description: "The birth of Lord Rama, celebrated at midday (madhyahna), the time of his birth." },
  { slug: "hanuman-jayanti", name: "Hanuman Jayanti", month: "Chaitra", tithi: PURNIMA, kala: "sunrise", description: "The birth of Hanuman, observed with the Hanuman Chalisa, temple visits and offerings of sindoor." },
  { slug: "akshaya-tritiya", name: "Akshaya Tritiya", month: "Vaishakha", tithi: S(3), kala: "sunrise", description: "An especially auspicious day whose merit is said never to diminish — popular for buying gold and starting ventures." },
  { slug: "guru-purnima", name: "Guru Purnima", month: "Ashadha", tithi: PURNIMA, kala: "sunrise", description: "A day to honour one's teachers and gurus, and the birth of Maharishi Vyasa." },
  { slug: "nag-panchami", name: "Nag Panchami", month: "Shravana", tithi: S(5), kala: "sunrise", description: "Worship of the serpent deities; also traditionally observed for relief from Kaal Sarp Dosha." },
  { slug: "raksha-bandhan", name: "Raksha Bandhan", month: "Shravana", tithi: PURNIMA, kala: "sunrise", description: "Sisters tie a rakhi on their brothers' wrists, celebrating the bond of protection and love." },
  { slug: "janmashtami", name: "Krishna Janmashtami", month: "Shravana", tithi: K(8), kala: "midnight", description: "The birth of Lord Krishna, celebrated at midnight with fasting, bhajans and the swinging of Bal Gopal's cradle." },
  { slug: "ganesh-chaturthi", name: "Ganesh Chaturthi", month: "Bhadrapada", tithi: S(4), kala: "midday", description: "The birth of Ganesha, with Ganpati idols installed at madhyahna and worshipped for up to ten days." },
  { slug: "sharad-navratri", name: "Sharad Navratri begins", month: "Ashwin", tithi: S(1), kala: "sunrise", description: "Nine nights of worship of Durga in her nine forms, beginning with Ghatasthapana." },
  { slug: "dussehra", name: "Dussehra (Vijayadashami)", month: "Ashwin", tithi: S(10), kala: "afternoon", description: "The victory of Rama over Ravana and of Durga over Mahishasura — good over evil." },
  { slug: "karva-chauth", name: "Karva Chauth", month: "Ashwin", tithi: K(4), kala: "moonrise", description: "Married women fast from sunrise to moonrise for their husbands' long life, breaking the fast on sighting the Moon." },
  { slug: "dhanteras", name: "Dhanteras", month: "Ashwin", tithi: K(13), kala: "pradosh", description: "The first day of Diwali, honouring Dhanvantari and Lakshmi — traditionally a day for buying gold, silver or utensils." },
  { slug: "diwali", name: "Diwali (Lakshmi Puja)", month: "Ashwin", tithi: AMAVASYA, kala: "pradosh", description: "The festival of lights. Lakshmi Puja is performed in the evening (pradosh kaal) of Kartika Amavasya." },
  { slug: "govardhan-puja", name: "Govardhan Puja", month: "Kartika", tithi: S(1), kala: "sunrise", description: "Commemorates Krishna lifting Govardhan hill; the Annakut feast is offered." },
  { slug: "bhai-dooj", name: "Bhai Dooj", month: "Kartika", tithi: S(2), kala: "afternoon", description: "Sisters pray for their brothers' long life and apply a tilak on the last day of the Diwali festival." },
  { slug: "chhath-puja", name: "Chhath Puja", month: "Kartika", tithi: S(6), kala: "sunrise", description: "Worship of the Sun god and Chhathi Maiya with arghya offered at sunset and sunrise." },
  { slug: "dev-uthani-ekadashi", name: "Dev Uthani Ekadashi", month: "Kartika", tithi: S(11), kala: "sunrise", description: "Vishnu awakens from his four-month sleep, ending Chaturmas and reopening the season for weddings." },
  { slug: "kartik-purnima", name: "Kartik Purnima · Guru Nanak Jayanti", month: "Kartika", tithi: PURNIMA, kala: "sunrise", description: "A sacred full Moon for holy dips and lamps (Dev Deepawali), and the birth anniversary of Guru Nanak." },
];

const SHUKLA_EKADASHI: Record<LunarMonth, string> = {
  Chaitra: "Kamada", Vaishakha: "Mohini", Jyeshtha: "Nirjala", Ashadha: "Devshayani", Shravana: "Shravana Putrada",
  Bhadrapada: "Parivartini", Ashwin: "Papankusha", Kartika: "Devutthana", Margashirsha: "Mokshada", Pausha: "Pausha Putrada",
  Magha: "Jaya", Phalguna: "Amalaki",
};
const KRISHNA_EKADASHI: Record<LunarMonth, string> = {
  Chaitra: "Varuthini", Vaishakha: "Apara", Jyeshtha: "Yogini", Ashadha: "Kamika", Shravana: "Aja", Bhadrapada: "Indira",
  Ashwin: "Rama", Kartika: "Utpanna", Margashirsha: "Saphala", Pausha: "Shattila", Magha: "Vijaya", Phalguna: "Papmochani",
};

export interface Observance {
  slug: string;
  name: string;
  category: FestivalCategory;
  date: string; // YYYY-MM-DD, local
  month: string; // e.g. "Kartika" or "Adhika Shravana"
  tithiStart: Date;
  tithiEnd: Date;
  description?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  timezone: string;
}

function kalaMoment(kala: Karmakala, t: DayTimes): Date {
  const day = t.sunset.getTime() - t.sunrise.getTime();
  switch (kala) {
    case "sunrise":
      return new Date(t.sunrise.getTime() + 60_000);
    case "midday":
      return new Date(t.sunrise.getTime() + day / 2);
    case "afternoon":
      return new Date(t.sunrise.getTime() + (day * 3.5) / 5); // middle of aparahna, the 4th fifth of the day
    case "pradosh":
      return new Date(t.sunset.getTime() + 45 * 60_000);
    case "midnight":
      return new Date((t.sunset.getTime() + t.nextSunrise.getTime()) / 2); // nishita
    case "moonrise":
      return t.moonrise ?? new Date(t.sunset.getTime() + 45 * 60_000);
  }
}

/** The civil day on which a tithi span prevails at the given karmakala. */
export function observanceDay(span: { start: Date; end: Date }, kala: Karmakala, loc: Location, dayCache = new Map<string, DayTimes>()): string {
  const times = (date: string) => {
    let t = dayCache.get(date);
    if (!t) {
      t = localDayTimes(date, loc.latitude, loc.longitude, loc.timezone);
      dayCache.set(date, t);
    }
    return t;
  };
  const first = addDays(localDate(span.start, loc.timezone), -1);
  const last = localDate(span.end, loc.timezone);
  const candidates: string[] = [];
  for (let d = first; d <= last; d = addDays(d, 1)) candidates.push(d);

  const within = (m: Date) => m >= span.start && m < span.end;
  for (const d of candidates) if (within(kalaMoment(kala, times(d)))) return d;
  // The tithi missed the karmakala entirely (a short, "kshaya" tithi): fall back to sunrise, then to the day it began.
  for (const d of candidates) if (within(kalaMoment("sunrise", times(d)))) return d;
  return localDate(span.start, loc.timezone);
}

const cache = new Map<string, Observance[]>();

/** All festivals and vrats falling in a Gregorian year at a place, sorted by date. */
export function observancesForYear(year: number, loc: Location): Observance[] {
  const key = `${year}|${loc.latitude.toFixed(2)}|${loc.longitude.toFixed(2)}|${loc.timezone}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const from = DateTime.fromObject({ year, month: 1, day: 1 }, { zone: loc.timezone });
  const months = lunarMonthsBetween(from.minus({ days: 20 }).toJSDate(), from.plus({ years: 1, days: 20 }).toJSDate());
  const dayCache = new Map<string, DayTimes>();
  const out: Observance[] = [];

  const add = (month: LunarMonthSpan, tithi: number, kala: Karmakala, entry: Omit<Observance, "date" | "month" | "tithiStart" | "tithiEnd">, offsetDays = 0) => {
    const span = tithiSpan(month.start, tithi);
    const date = addDays(observanceDay(span, kala, loc, dayCache), offsetDays);
    out.push({ ...entry, date, month: `${month.adhika ? "Adhika " : ""}${month.name}`, tithiStart: span.start, tithiEnd: span.end });
  };

  for (const m of months) {
    if (!m.adhika) {
      for (const f of FESTIVALS.filter((f) => f.month === m.name)) {
        add(m, f.tithi, f.kala, { slug: f.slug, name: f.name, category: "Festival", description: f.description }, f.offsetDays);
      }
    }
    const tag = m.adhika ? "adhika-" : "";
    add(m, S(11), "sunrise", {
      slug: `${tag}${m.name.toLowerCase()}-shukla-ekadashi`,
      name: `${m.adhika ? "Padmini" : SHUKLA_EKADASHI[m.name]} Ekadashi`,
      category: "Ekadashi",
    });
    add(m, K(11), "sunrise", {
      slug: `${tag}${m.name.toLowerCase()}-krishna-ekadashi`,
      name: `${m.adhika ? "Parama" : KRISHNA_EKADASHI[m.name]} Ekadashi`,
      category: "Ekadashi",
    });
    add(m, PURNIMA, "sunrise", { slug: `${tag}${m.name.toLowerCase()}-purnima`, name: `${m.adhika ? "Adhika " : ""}${m.name} Purnima`, category: "Purnima" });
    add(m, AMAVASYA, "sunrise", { slug: `${tag}${m.name.toLowerCase()}-amavasya`, name: `${m.adhika ? "Adhika " : ""}${m.name} Amavasya`, category: "Amavasya" });
    add(m, K(4), "moonrise", { slug: `${tag}${m.name.toLowerCase()}-sankashti`, name: "Sankashti Chaturthi", category: "Sankashti Chaturthi" });
    add(m, S(13), "pradosh", { slug: `${tag}${m.name.toLowerCase()}-shukla-pradosh`, name: "Pradosh Vrat (Shukla)", category: "Pradosh Vrat" });
    add(m, K(13), "pradosh", { slug: `${tag}${m.name.toLowerCase()}-krishna-pradosh`, name: "Pradosh Vrat (Krishna)", category: "Pradosh Vrat" });
  }

  // Makar Sankranti: the Sun's ingress into sidereal Capricorn; after sunset, it is observed the next day.
  const ingress = sankranti(9, from.minus({ days: 5 }).toJSDate());
  let sankrantiDay = localDate(ingress, loc.timezone);
  if (ingress > localDayTimes(sankrantiDay, loc.latitude, loc.longitude, loc.timezone).sunset) sankrantiDay = addDays(sankrantiDay, 1);
  out.push({
    slug: "makar-sankranti",
    name: "Makar Sankranti · Pongal",
    category: "Sankranti",
    date: sankrantiDay,
    month: "Magha",
    tithiStart: ingress,
    tithiEnd: ingress,
    description: "The Sun enters Capricorn and begins its northward journey (Uttarayana) — celebrated with kite-flying, sesame sweets, holy dips and Pongal.",
  });

  const yearStr = String(year);
  const result = out.filter((o) => o.date.startsWith(yearStr)).sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
  cache.set(key, result);
  return result;
}

export function findFestival(year: number, slug: string, loc: Location): Observance | null {
  return observancesForYear(year, loc).find((o) => o.slug === slug) ?? null;
}
