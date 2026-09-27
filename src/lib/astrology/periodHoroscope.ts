import { DateTime } from "luxon";
import { SIGNS, type PlanetName } from "./constants";
import { isRetrograde, siderealLongitude } from "./ephemeris";
import { signOffsetHouse } from "./math";
import { horoscopeText } from "./horoscopeText";
import { isGocharaFavourable, signPeriods } from "./transits";
import { ordinal } from "./predictions";

/**
 * Weekly, monthly and yearly horoscopes by Moon sign, built from the actual
 * transits in the window: which houses (counted from the reader's Moon sign)
 * the planets move through, when they change sign, and which days the Moon
 * favours. Dates are in India time, the audience's day.
 */

export const TIMEZONE = "Asia/Kolkata";
const text = horoscopeText("en");
const focus = (house: number) => text.focus[house].toLowerCase();

const PLANET_VERB: Partial<Record<PlanetName, (house: number) => string>> = {
  Sun: (h) => `The Sun in your ${ordinal(h)} house puts ${focus(h)} in the spotlight`,
  Mercury: (h) => `Mercury in your ${ordinal(h)} house keeps ${focus(h)} busy with talk, plans and paperwork`,
  Venus: (h) => `Venus in your ${ordinal(h)} house sweetens ${focus(h)}`,
  Mars: (h) => `Mars in your ${ordinal(h)} house energises — and can overheat — ${focus(h)}`,
  Jupiter: (h) => `Jupiter in your ${ordinal(h)} house expands ${focus(h)}`,
  Saturn: (h) => `Saturn in your ${ordinal(h)} house asks for patience and structure in ${focus(h)}`,
  Rahu: (h) => `Rahu in your ${ordinal(h)} house amplifies ambition and restlessness around ${focus(h)}`,
  Ketu: (h) => `Ketu in your ${ordinal(h)} house brings detachment around ${focus(h)}`,
};

export function transitSentence(planet: PlanetName, house: number): string {
  const fav = isGocharaFavourable(planet, house);
  return `${PLANET_VERB[planet]!(house)} — ${fav ? "a favourable position" : "a testing position"}.`;
}

export interface Movement {
  planet: PlanetName;
  date: Date;
  sign: string;
  house: number;
  sentence: string;
}

function movements(signIndex: number, planets: PlanetName[], from: Date, to: Date): Movement[] {
  const out: Movement[] = [];
  for (const planet of planets) {
    for (const period of signPeriods(planet, from, to).slice(1)) {
      const house = signOffsetHouse(period.signIndex, signIndex);
      out.push({ planet, date: period.start, sign: SIGNS[period.signIndex], house, sentence: transitSentence(planet, house) });
    }
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

const houseAt = (planet: PlanetName, signIndex: number, at: Date) => signOffsetHouse(Math.floor(siderealLongitude(planet, at) / 30), signIndex);

const MOON_GOOD = new Set([1, 3, 6, 7, 10, 11]);
const MOON_HARD = new Set([4, 8, 12]);

export interface DayOutlook {
  date: string;
  moonHouse: number;
  tone: "Favourable" | "Mixed" | "Challenging";
  note: string;
}

function dayOutlook(signIndex: number, date: string): DayOutlook {
  const at = DateTime.fromISO(date, { zone: TIMEZONE }).set({ hour: 6 }).toJSDate();
  const moonHouse = houseAt("Moon", signIndex, at);
  return {
    date,
    moonHouse,
    tone: MOON_GOOD.has(moonHouse) ? "Favourable" : MOON_HARD.has(moonHouse) ? "Challenging" : "Mixed",
    note: text.moonHeadline[moonHouse],
  };
}

function backdrop(signIndex: number, at: Date): string[] {
  return (["Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"] as PlanetName[]).map((p) => transitSentence(p, houseAt(p, signIndex, at)));
}

function ratingFrom(favourable: number, total: number): number {
  const share = favourable / total;
  return share >= 0.7 ? 5 : share >= 0.55 ? 4 : share >= 0.4 ? 3 : share >= 0.25 ? 2 : 1;
}

// ——— Weekly ——————————————————————————————————————————————————————————

export interface WeeklyHoroscope {
  weekStart: string;
  weekEnd: string;
  rating: number;
  summary: string;
  days: DayOutlook[];
  bestDays: string[];
  cautionDays: string[];
  themes: string[];
  movements: Movement[];
}

export function weeklyHoroscope(signIndex: number, anyDate: string): WeeklyHoroscope {
  const start = DateTime.fromISO(anyDate, { zone: TIMEZONE }).startOf("week"); // Monday
  const days = Array.from({ length: 7 }, (_, i) => dayOutlook(signIndex, start.plus({ days: i }).toISODate()!));
  const mid = start.plus({ days: 3, hours: 12 }).toJSDate();
  const favourable = days.filter((d) => d.tone === "Favourable").length;
  const bestDays = days.filter((d) => d.tone === "Favourable").map((d) => d.date);
  const cautionDays = days.filter((d) => d.moonHouse === 8 || d.tone === "Challenging").map((d) => d.date);
  const weekday = (d: string) => DateTime.fromISO(d).toFormat("cccc");
  const summary =
    favourable >= 4
      ? `A productive week: the Moon spends most of it in supportive houses, with ${bestDays.map(weekday).slice(0, 3).join(", ")} standing out.`
      : favourable >= 2
        ? `A mixed week — pick your moments. ${bestDays.map(weekday).join(" and ")} ${bestDays.length === 1 ? "is" : "are"} the days to push forward.`
        : "A week for steady routine rather than big launches; conserve energy and plan.";
  return {
    weekStart: days[0].date,
    weekEnd: days[6].date,
    rating: ratingFrom(favourable, 7),
    summary,
    days,
    bestDays,
    cautionDays,
    themes: backdrop(signIndex, mid).slice(0, 4),
    movements: movements(signIndex, ["Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu"], start.toJSDate(), start.plus({ days: 7 }).toJSDate()),
  };
}

// ——— Monthly ————————————————————————————————————————————————————————

export interface MonthlyHoroscope {
  month: string; // YYYY-MM
  rating: number;
  summary: string;
  themes: string[];
  movements: Movement[];
  bestDates: string[];
  chandrashtama: { from: string; to: string }[];
}

export function monthlyHoroscope(signIndex: number, month: string): MonthlyHoroscope {
  const start = DateTime.fromISO(`${month}-01`, { zone: TIMEZONE }).startOf("month");
  const end = start.endOf("month");
  const days = Array.from({ length: start.daysInMonth! }, (_, i) => dayOutlook(signIndex, start.plus({ days: i }).toISODate()!));
  const mid = start.plus({ days: 14 }).toJSDate();

  const planets: PlanetName[] = ["Sun", "Mercury", "Venus", "Mars"];
  const favourablePlanets = planets.filter((p) => isGocharaFavourable(p, houseAt(p, signIndex, mid))).length;
  const slow = (["Jupiter", "Saturn"] as PlanetName[]).filter((p) => isGocharaFavourable(p, houseAt(p, signIndex, mid))).length;
  const rating = ratingFrom(favourablePlanets + slow, planets.length + 2);

  // Group consecutive Chandrashtama days into windows.
  const chandrashtama: { from: string; to: string }[] = [];
  for (const d of days) {
    if (d.moonHouse !== 8) continue;
    const last = chandrashtama[chandrashtama.length - 1];
    if (last && DateTime.fromISO(last.to).plus({ days: 1 }).toISODate() === d.date) last.to = d.date;
    else chandrashtama.push({ from: d.date, to: d.date });
  }

  const sunHouse = houseAt("Sun", signIndex, mid);
  return {
    month,
    rating,
    summary: `This month the Sun lights up your ${ordinal(sunHouse)} house — ${focus(sunHouse)}. ${
      rating >= 4 ? "Most of the key planets are on your side, so it is a good month to move plans forward." : rating === 3 ? "Planetary support is mixed; progress comes with steady effort." : "Several planets sit in testing positions — favour consolidation over new risks."
    }`,
    themes: backdrop(signIndex, mid),
    movements: movements(signIndex, ["Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu"], start.toJSDate(), end.toJSDate()),
    bestDates: days.filter((d) => d.moonHouse === 11 || d.moonHouse === 10 || d.moonHouse === 6 || d.moonHouse === 3).map((d) => d.date),
    chandrashtama,
  };
}

// ——— Yearly —————————————————————————————————————————————————————————

export interface YearSegment {
  planet: PlanetName;
  from: Date;
  to: Date;
  sign: string;
  house: number;
  favourable: boolean;
  text: string;
}

export interface YearlyHoroscope {
  year: number;
  rating: number;
  summary: string;
  slowPlanets: YearSegment[];
  months: { month: string; sunHouse: number; favourable: boolean; focus: string }[];
  retrogrades: { planet: PlanetName; from: Date; to: Date }[];
}

export function retrogradePeriods(planet: "Mercury" | "Venus" | "Mars" | "Jupiter" | "Saturn", from: Date, to: Date) {
  const out: { planet: PlanetName; from: Date; to: Date }[] = [];
  let startedAt: Date | null = isRetrograde(planet, from) ? from : null;
  for (let t = from.getTime() + 86400_000; t <= to.getTime(); t += 86400_000) {
    const r = isRetrograde(planet, new Date(t));
    if (r && !startedAt) startedAt = new Date(t);
    if (!r && startedAt) {
      out.push({ planet, from: startedAt, to: new Date(t) });
      startedAt = null;
    }
  }
  if (startedAt) out.push({ planet, from: startedAt, to });
  return out;
}

export function yearlyHoroscope(signIndex: number, year: number): YearlyHoroscope {
  const start = DateTime.fromObject({ year, month: 1, day: 1 }, { zone: TIMEZONE });
  const end = start.endOf("year");

  const slowPlanets: YearSegment[] = [];
  for (const planet of ["Jupiter", "Saturn", "Rahu", "Ketu"] as PlanetName[]) {
    for (const p of signPeriods(planet, start.toJSDate(), end.toJSDate())) {
      const house = signOffsetHouse(p.signIndex, signIndex);
      const favourable = isGocharaFavourable(planet, house);
      const detail =
        planet === "Jupiter" ? text.jupiter[house] : planet === "Saturn" ? text.saturnText(saturnKindFor(house), house) : transitSentence(planet, house);
      slowPlanets.push({ planet, from: p.start, to: p.end, sign: SIGNS[p.signIndex], house, favourable, text: detail });
    }
  }

  const months = Array.from({ length: 12 }, (_, i) => {
    const m = start.plus({ months: i, days: 14 });
    const sunHouse = houseAt("Sun", signIndex, m.toJSDate());
    return { month: m.toFormat("yyyy-LL"), sunHouse, favourable: isGocharaFavourable("Sun", sunHouse), focus: text.focus[sunHouse] };
  });

  const jupiterGoodDays = slowPlanets
    .filter((s) => s.planet === "Jupiter" && s.favourable)
    .reduce((sum, s) => sum + (s.to.getTime() - s.from.getTime()), 0);
  const saturnGoodDays = slowPlanets
    .filter((s) => s.planet === "Saturn" && s.favourable)
    .reduce((sum, s) => sum + (s.to.getTime() - s.from.getTime()), 0);
  const yearMs = end.toMillis() - start.toMillis();
  const score = (jupiterGoodDays / yearMs) * 2 + saturnGoodDays / yearMs + months.filter((m) => m.favourable).length / 12;
  const rating = score >= 2.2 ? 5 : score >= 1.6 ? 4 : score >= 1 ? 3 : score >= 0.5 ? 2 : 1;

  const jupiterNow = slowPlanets.find((s) => s.planet === "Jupiter")!;
  const saturnNow = slowPlanets.find((s) => s.planet === "Saturn")!;
  return {
    year,
    rating,
    summary: `${year} opens with Jupiter in your ${ordinal(jupiterNow.house)} house and Saturn in your ${ordinal(saturnNow.house)}. ${
      rating >= 4 ? "The two great planets largely support you — a year to build and expand." : rating === 3 ? "It is a year of balance: real opportunities, with areas that need patience." : "The slow planets ask for patience this year; steady effort and sensible caution pay off."
    }`,
    slowPlanets,
    months,
    retrogrades: (["Mercury", "Venus", "Mars", "Jupiter", "Saturn"] as const)
      .flatMap((p) => retrogradePeriods(p, start.toJSDate(), end.toJSDate()))
      .sort((a, b) => a.from.getTime() - b.from.getTime()),
  };
}

function saturnKindFor(house: number) {
  if (house === 12) return "sadeSatiRising" as const;
  if (house === 1) return "sadeSatiPeak" as const;
  if (house === 2) return "sadeSatiSetting" as const;
  if (house === 4) return "kantaka" as const;
  if (house === 8) return "ashtama" as const;
  return [3, 6, 11].includes(house) ? ("favourable" as const) : ("neutral" as const);
}
