import { describe, it, expect } from "vitest";
import { computeDailyTransits, horoscopeForSign, resolveHoroscopeDay, signFromSlug, SIGN_SLUGS } from "../horoscope";

// 11 Jan 2024: Moon in Sagittarius, Jupiter in (sidereal) Aries, Saturn in Aquarius.
const t = computeDailyTransits("2024-01-11");

describe("computeDailyTransits", () => {
  it("places the transiting planets in the right sidereal signs", () => {
    expect(t.moonSignIndex).toBe(8);
    expect(t.jupiterSignIndex).toBe(0);
    expect(t.saturnSignIndex).toBe(10);
    expect(t.moonNakshatra).toBe("Purva Ashadha");
  });

  it("reports the Moon's sign change only when it happens before local midnight", () => {
    // The Moon left Sagittarius for Capricorn around midnight on 12–13 Jan 2024 IST.
    for (const date of ["2024-01-11", "2024-01-12", "2024-01-13"]) {
      const d = computeDailyTransits(date);
      if (d.moonChange) {
        expect(d.moonChange.signIndex).toBe((d.moonSignIndex + 1) % 12);
        expect(d.moonChange.at.getTime()).toBeLessThanOrEqual(new Date(`${date}T23:59:59.999+05:30`).getTime());
      }
    }
  });
});

describe("horoscopeForSign", () => {
  it("counts transit houses from the reader's Moon sign", () => {
    const sag = horoscopeForSign(8, t);
    expect(sag.moonHouse).toBe(1);
    expect(sag.jupiter.house).toBe(5);
    expect(sag.jupiter.favourable).toBe(true);
    expect(sag.saturn.house).toBe(3);
    expect(sag.saturn.status).toBe("Favourable");
  });

  it("names the three phases of Sade Sati", () => {
    expect(horoscopeForSign(11, t).saturn.status).toMatch(/rising/); // Pisces: Saturn 12th
    expect(horoscopeForSign(10, t).saturn.status).toMatch(/peak/); // Aquarius: Saturn 1st
    expect(horoscopeForSign(9, t).saturn.status).toMatch(/setting/); // Capricorn: Saturn 2nd
  });

  it("flags Chandrashtama and caps its rating", () => {
    const taurus = horoscopeForSign(1, t); // Sagittarius is the 8th from Taurus
    expect(taurus.moonHouse).toBe(8);
    expect(taurus.tone).toBe("Challenging");
    expect(taurus.rating).toBeLessThanOrEqual(2);
    expect(taurus.headline).toMatch(/Chandrashtama/);
  });

  it("keeps every rating between 1 and 5 across a month of days", () => {
    for (let day = 1; day <= 28; day += 3) {
      const d = computeDailyTransits(`2025-03-${String(day).padStart(2, "0")}`);
      for (let s = 0; s < 12; s++) {
        const h = horoscopeForSign(s, d);
        expect(h.rating).toBeGreaterThanOrEqual(1);
        expect(h.rating).toBeLessThanOrEqual(5);
        expect(h.reading.length).toBeGreaterThan(100);
      }
    }
  });
});

describe("slugs and days", () => {
  it("maps sign slugs both ways", () => {
    expect(SIGN_SLUGS[0]).toBe("aries");
    expect(signFromSlug("Pisces")).toBe(11);
    expect(signFromSlug("ophiuchus")).toBeNull();
  });

  it("resolves relative and absolute days in the reader's timezone", () => {
    const now = new Date("2024-01-11T20:00:00Z"); // already 12 Jan in India
    expect(resolveHoroscopeDay(undefined, "Asia/Kolkata", now)).toEqual({ date: "2024-01-12", label: "Today" });
    expect(resolveHoroscopeDay("tomorrow", "Asia/Kolkata", now)).toEqual({ date: "2024-01-13", label: "Tomorrow" });
    expect(resolveHoroscopeDay("2024-01-11", "Asia/Kolkata", now)).toEqual({ date: "2024-01-11", label: "Yesterday" });
    expect(resolveHoroscopeDay("2024-03-01", "Asia/Kolkata", now).label).toBeNull();
    expect(resolveHoroscopeDay("nonsense", "Asia/Kolkata", now)).toEqual({ date: "2024-01-12", label: "Today" });
  });
});
