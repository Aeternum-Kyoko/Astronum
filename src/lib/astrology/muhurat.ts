import { DateTime } from "luxon";
import { NAKSHATRAS } from "./constants";
import { lahiriAyanamsa } from "./ayanamsa";
import { computeRawPositions, siderealSunMoon } from "./ephemeris";
import { karanaIndex, karanaName, tithiIndex, tithiName } from "./birthDetails";
import { normalizeDegrees } from "./math";
import { computeDailyPanchang, type TimeSpan } from "./panchang";
import { observancesForYear, type Location } from "./festivals";

/**
 * Shubh muhurat shortlist: days in a month that pass the classical panchang
 * checks (shuddhi) for an activity — nakshatra, weekday and tithi at sunrise,
 * no Bhadra, and for the big life events no Kharmas, no Chaturmas and (for
 * marriage) Jupiter and Venus clear of the Sun. Traditions vary; a family
 * astrologer also checks the couple's or owner's own chart.
 */

export const ACTIVITIES = {
  marriage: {
    label: "Marriage (Vivah)",
    nakshatras: ["Rohini", "Mrigashira", "Magha", "Uttara Phalguni", "Hasta", "Swati", "Anuradha", "Mula", "Uttara Ashadha", "Uttara Bhadrapada", "Revati"],
    weekdays: [1, 3, 4, 5], // Mon, Wed, Thu, Fri (Sunday = 0)
    avoidAshtami: true,
    seasonal: true,
    benefics: true,
  },
  "griha-pravesh": {
    label: "Griha Pravesh (housewarming)",
    nakshatras: ["Rohini", "Mrigashira", "Uttara Phalguni", "Chitra", "Anuradha", "Uttara Ashadha", "Uttara Bhadrapada", "Revati"],
    weekdays: [1, 3, 4, 5],
    avoidAshtami: true,
    seasonal: true,
    benefics: false,
  },
  vehicle: {
    label: "Buying a vehicle",
    nakshatras: ["Ashwini", "Mrigashira", "Punarvasu", "Pushya", "Hasta", "Chitra", "Swati", "Anuradha", "Shravana", "Dhanishta", "Shatabhisha", "Revati"],
    weekdays: [0, 1, 3, 4, 5],
    avoidAshtami: true,
    seasonal: false,
    benefics: false,
  },
  property: {
    label: "Buying property",
    nakshatras: ["Mrigashira", "Punarvasu", "Pushya", "Uttara Phalguni", "Hasta", "Chitra", "Anuradha", "Uttara Ashadha", "Shravana", "Dhanishta", "Uttara Bhadrapada", "Revati"],
    weekdays: [1, 4, 5],
    avoidAshtami: false,
    seasonal: false,
    benefics: false,
  },
  business: {
    label: "Starting a business",
    nakshatras: ["Ashwini", "Rohini", "Pushya", "Uttara Phalguni", "Hasta", "Chitra", "Anuradha", "Uttara Ashadha", "Shravana", "Uttara Bhadrapada", "Revati"],
    weekdays: [1, 3, 4, 5],
    avoidAshtami: true,
    seasonal: false,
    benefics: false,
  },
} as const;

export type Activity = keyof typeof ACTIVITIES;

export function isActivity(s: string | undefined): s is Activity {
  return !!s && s in ACTIVITIES;
}

export interface MuhuratDay {
  date: string;
  weekday: string;
  tithi: string;
  nakshatra: string;
  nakshatraEndsAt: Date | null;
  window: TimeSpan & { label: string };
  rahuKaal: TimeSpan;
}

export interface MuhuratMonth {
  activity: Activity;
  days: MuhuratDay[];
  /** Why the whole month is blocked, if it is (Kharmas / Chaturmas). */
  blockedReason: string | null;
}

function separation(a: number, b: number): number {
  const d = normalizeDegrees(a - b);
  return Math.min(d, 360 - d);
}

/** Month is "YYYY-MM". */
export function findMuhurats(activity: Activity, month: string, loc: Location): MuhuratMonth {
  const rules = ACTIVITIES[activity];
  const first = DateTime.fromISO(`${month}-01`, { zone: loc.timezone });
  if (!first.isValid) throw new Error("Invalid month");

  // Chaturmas runs from Devshayani Ekadashi to Devutthana Ekadashi.
  const obs = observancesForYear(first.year, loc);
  const chaturmasStart = obs.find((o) => o.name === "Devshayani Ekadashi")?.date;
  const chaturmasEnd = obs.find((o) => o.name === "Devutthana Ekadashi")?.date;

  const days: MuhuratDay[] = [];
  const blocks = new Set<string>();
  for (let d = first; d.month === first.month; d = d.plus({ days: 1 })) {
    const date = d.toISODate()!;
    const p = computeDailyPanchang(date, loc.latitude, loc.longitude, loc.timezone);
    const { sun, moon } = siderealSunMoon(p.sunrise);
    const weekday = d.weekday % 7;
    const t = tithiIndex(sun, moon);
    const inPaksha = (t % 15) + 1;
    const nakshatra = NAKSHATRAS[Math.floor(moon / (360 / 27))];

    if (rules.seasonal) {
      const sunSign = Math.floor(sun / 30);
      if (sunSign === 8 || sunSign === 11) {
        blocks.add("Kharmas (the Sun in Sagittarius or Pisces)");
        continue;
      }
      if (chaturmasStart && chaturmasEnd && date >= chaturmasStart && date < chaturmasEnd) {
        blocks.add("Chaturmas (Devshayani to Devutthana Ekadashi)");
        continue;
      }
    }
    if (!(rules.weekdays as readonly number[]).includes(weekday)) continue;
    if (!(rules.nakshatras as readonly string[]).includes(nakshatra)) continue;
    if (t === 29 || [4, 9, 14].includes(inPaksha)) continue; // Amavasya and the Rikta tithis
    if (rules.avoidAshtami && inPaksha === 8) continue;
    if (karanaName(karanaIndex(sun, moon)) === "Vishti") continue; // Bhadra
    if (rules.benefics) {
      const raw = computeRawPositions(p.sunrise);
      const ayan = lahiriAyanamsa(p.sunrise);
      const sid = (planet: string) => normalizeDegrees(raw.tropicalLongitudes[planet] - ayan);
      if (separation(sid("Jupiter"), sun) <= 11 || separation(sid("Venus"), sun) <= 10) {
        blocks.add("Jupiter or Venus combust (too close to the Sun)");
        continue;
      }
    }

    // Abhijit (not on Wednesdays) or else the first favourable daytime Choghadiya clear of Rahu Kaal.
    const clearOfRahu = (s: TimeSpan) => s.end <= p.rahuKaal.start || s.start >= p.rahuKaal.end;
    const good = p.choghadiya.day.find((c) => c.quality === "Good" && clearOfRahu(c));
    const window =
      weekday !== 3 && clearOfRahu(p.abhijit)
        ? { ...p.abhijit, label: "Abhijit Muhurta" }
        : good
          ? { start: good.start, end: good.end, label: `${good.name} Choghadiya` }
          : { ...p.abhijit, label: "Abhijit Muhurta" };

    days.push({
      date,
      weekday: p.vara.name,
      tithi: `${tithiName(t).paksha} ${tithiName(t).tithi}`,
      nakshatra,
      nakshatraEndsAt: p.nakshatra.endsAt,
      window,
      rahuKaal: p.rahuKaal,
    });
  }

  const blockedReason = days.length === 0 && blocks.size > 0 ? [...blocks].join("; ") : null;
  return { activity, days, blockedReason };
}
