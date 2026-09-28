import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import { computeDailyPanchang } from "../panchang";
import { computePanchangExtras } from "../panchangExtras";

// Reference: Drik Panchang, New Delhi, 28 September 2026 (Monday).
const TZ = "Asia/Kolkata";
const p = computeDailyPanchang("2026-09-28", 28.6139, 77.209, TZ);
const x = computePanchangExtras(p, 28.6139, 77.209);
const hm = (d: Date) => DateTime.fromJSDate(d, { zone: TZ }).toFormat("HH:mm");
const near = (d: Date, expected: string, tol = 3) => {
  const [h, m] = expected.split(":").map(Number);
  const got = DateTime.fromJSDate(d, { zone: TZ });
  const diff = Math.abs(got.hour * 60 + got.minute - (h * 60 + m));
  expect(Math.min(diff, 1440 - diff), `${hm(d)} vs ${expected}`).toBeLessThanOrEqual(tol);
};

describe("panchang extras vs Drik Panchang (New Delhi, 28 Sep 2026)", () => {
  it("Brahma Muhurta 04:36–05:24", () => {
    near(x.brahmaMuhurta.start, "04:36");
    near(x.brahmaMuhurta.end, "05:24");
  });
  it("Durmuhurtam 12:36–13:23 and 14:59–15:47", () => {
    near(x.durmuhurtam[0].start, "12:36");
    near(x.durmuhurtam[0].end, "13:23");
    near(x.durmuhurtam[1].start, "14:59");
    near(x.durmuhurtam[1].end, "15:47");
  });
  it("Amrit Kalam 07:57–09:29", () => {
    near(x.amritKaal[0].start, "07:57", 6);
    near(x.amritKaal[0].end, "09:29", 6);
  });
  it("Varjyam 05:15–06:46 next morning", () => {
    const v = x.varjyam.find((w) => hm(w.start) < "07:00" && w.start > p.sunset)!;
    near(v.start, "05:15", 6);
  });
  it("Panchaka until 10:16 and Ganda Moola all day", () => {
    expect(x.panchaka).not.toBeNull();
    near(x.panchaka!.end, "10:16", 4);
    expect(x.gandaMoola!.start.getTime()).toBe(p.sunrise.getTime());
  });
  it("Monday Gowri day starts with Amirdha, night with Sugam", () => {
    expect(x.gowri.day.map((g) => g.name)).toEqual(["Amirdha", "Visham", "Rogam", "Laabam", "Dhanam", "Sugam", "Soram", "Uthi"]);
    expect(x.gowri.night[0].name).toBe("Sugam");
  });
  it("Udaya Lagna covers the day with twelve signs", () => {
    expect(x.udayaLagna.length).toBeGreaterThanOrEqual(12);
    expect(x.udayaLagna[0].start.getTime()).toBe(p.sunrise.getTime());
  });
});
