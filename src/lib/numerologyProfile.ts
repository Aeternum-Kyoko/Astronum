import { chaldeanLetterValues, isValidBirthDate, nameNumber, reduceToDigit } from "@/lib/numerology";

const PYTHAGOREAN: Record<string, number> = Object.fromEntries("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter, i) => [letter, (i % 9) + 1]));
const MASTER = new Set([11, 22, 33]);
const root = (n: number, keepMaster = false) => {
  let value = Math.abs(Math.trunc(n));
  while (value > 9 && !(keepMaster && MASTER.has(value))) value = sum(String(value).split("").map(Number));
  return value;
};
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

function dateParts(date: string) {
  if (!isValidBirthDate(date)) throw new RangeError("Enter a real birth date from 1900 to today.");
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

export function personalCycles(date: string, calendarYear: number, month: number, day: number) {
  const { month: birthMonth, day: birthDay } = dateParts(date);
  const yearTotal = birthMonth + birthDay + sum(String(calendarYear).split("").map(Number));
  const personalYearCompound = yearTotal;
  const personalYear = root(yearTotal);
  const personalMonth = root(personalYear + month);
  const personalDay = root(personalMonth + day);
  return { personalYear, personalYearCompound, personalMonth, personalDay, universalYear: root(sum(String(calendarYear).split("").map(Number))) };
}

function nameParts(name: string, yAsVowel: boolean) {
  const letters = Array.from(name.toUpperCase()).filter((letter) => /^[A-Z]$/.test(letter));
  const values = letters.map((letter) => ({ letter, value: PYTHAGOREAN[letter], vowel: "AEIOU".includes(letter) || (letter === "Y" && yAsVowel) }));
  const expressionTotal = sum(values.map((x) => x.value));
  const soulTotal = sum(values.filter((x) => x.vowel).map((x) => x.value));
  const personalityTotal = sum(values.filter((x) => !x.vowel).map((x) => x.value));
  return {
    values,
    expression: { compound: expressionTotal, number: root(expressionTotal, true) },
    soulUrge: { compound: soulTotal, number: root(soulTotal, true) },
    personality: { compound: personalityTotal, number: root(personalityTotal, true) },
  };
}

export function westernNumerology(name: string, date: string, yAsVowel = false) {
  const { year, month, day } = dateParts(date);
  const lifePathTotal = sum(`${year}${String(month).padStart(2, "0")}${String(day).padStart(2, "0")}`.split("").map(Number));
  const lifePath = root(lifePathTotal, true);
  const monthRoot = root(month, true);
  const dayRoot = root(day, true);
  const yearRoot = root(sum(String(year).split("").map(Number)), true);
  const pinnacleCompounds = [monthRoot + dayRoot, dayRoot + yearRoot, 0, monthRoot + yearRoot];
  // The third Pinnacle combines the first two Pinnacles; retain the unreduced compound inputs.
  pinnacleCompounds[2] = pinnacleCompounds[0] + pinnacleCompounds[1];
  const pinnacles = pinnacleCompounds.map((compound, index) => ({ number: root(compound, true), compound }));
  const challenges = [Math.abs(monthRoot - dayRoot), Math.abs(dayRoot - yearRoot), 0, Math.abs(monthRoot - yearRoot)];
  challenges[2] = Math.abs(challenges[0] - challenges[1]);
  const firstEnd = 36 - root(lifePath);
  const ranges = [{ start: 0, end: firstEnd }, { start: firstEnd + 1, end: firstEnd + 9 }, { start: firstEnd + 10, end: firstEnd + 18 }, { start: firstEnd + 19, end: null as number | null }];
  return {
    lifePath: { compound: lifePathTotal, number: lifePath },
    birthday: { compound: day, number: dayRoot },
    attitude: { compound: month + day, number: root(month + day, true) },
    name: nameParts(name, yAsVowel),
    yAsVowel,
    pinnacles: pinnacles.map((p, i) => ({ ...p, challenge: challenges[i], ...ranges[i] })),
  };
}

export function numerologyProfile(name: string, date: string, now = new Date(), yAsVowel = false) {
  const { day, month } = dateParts(date);
  const chaldeanLetters = chaldeanLetterValues(name);
  const western = westernNumerology(name, date, yAsVowel);
  const nameRoot = nameNumber(name);
  const current = personalCycles(date, now.getFullYear(), now.getMonth() + 1, now.getDate());
  const personalYearTimeline = Array.from({ length: 9 }, (_, index) => {
    const year = now.getFullYear() + index - 4;
    const cycle = personalCycles(date, year, 1, 1);
    return { year, number: cycle.personalYear, current: year === now.getFullYear() };
  });
  const relationship = nameRoot.digit === reduceToDigit(day) || nameRoot.digit === reduceToDigit(month + day)
    ? "Your Chaldean name root echoes a core birth-date number, giving the name and date a shared emphasis."
    : "Your Chaldean name root differs from the birth-day and month-day roots, adding a separate name-number theme to the birth-date themes.";
  return {
    birth: { date, day, month },
    indian: {
      moolank: { compound: day, number: reduceToDigit(day) },
      bhagyank: { compound: sum(date.replace(/\D/g, "").split("").map(Number)), number: reduceToDigit(sum(date.replace(/\D/g, "").split("").map(Number))) },
      name: { ...nameRoot, letters: chaldeanLetters },
      relationship,
    },
    cycles: { ...current, year: now.getFullYear(), personalYearTimeline },
    western,
  };
}
