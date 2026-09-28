import { describe, it, expect } from "vitest";
import { currentTransits, saturnCycles, signPeriods } from "../transits";

const days = (a: Date, b: Date) => Math.abs(a.getTime() - b.getTime()) / 86400_000;

describe("signPeriods", () => {
  it("finds Saturn's 2023 ingress into sidereal Aquarius (17 Jan 2023) to within a day", () => {
    const p = signPeriods("Saturn", new Date("2022-12-01"), new Date("2023-03-01"));
    const aquarius = p.find((x) => x.signIndex === 10)!;
    expect(days(aquarius.start, new Date("2023-01-17T12:00:00Z"))).toBeLessThan(1);
  });

  it("finds Jupiter's May 2024 ingress into sidereal Taurus (1 May 2024)", () => {
    const p = signPeriods("Jupiter", new Date("2024-04-01"), new Date("2024-06-01"));
    const taurus = p.find((x) => x.signIndex === 1)!;
    expect(days(taurus.start, new Date("2024-05-01T12:00:00Z"))).toBeLessThan(1);
  });

  it("tiles the requested span with no gaps", () => {
    const from = new Date("2024-01-01");
    const to = new Date("2024-03-01");
    const p = signPeriods("Sun", from, to);
    expect(p[0].start).toEqual(from);
    expect(p[p.length - 1].end).toEqual(to);
    for (let i = 1; i < p.length; i++) expect(p[i].start).toEqual(p[i - 1].end);
  });
});

describe("currentTransits", () => {
  // 11 Jan 2024: Saturn in Aquarius, Jupiter in Aries, Rahu in Pisces, Ketu in Virgo.
  const t = currentTransits(9, 0, new Date("2024-01-11T06:00:00Z")); // natal Moon Capricorn, Lagna Aries
  const get = (p: string) => t.find((x) => x.planet === p)!;

  it("places the slow planets in the right signs and counts houses from Moon and Lagna", () => {
    expect(get("Saturn").sign).toBe("Aquarius");
    expect(get("Saturn").houseFromMoon).toBe(2);
    expect(get("Saturn").houseFromLagna).toBe(11);
    expect(get("Jupiter").sign).toBe("Aries");
    expect(get("Rahu").sign).toBe("Pisces");
    expect(get("Ketu").sign).toBe("Virgo");
  });

  it("marks gochara results and the next ingress", () => {
    expect(get("Jupiter").houseFromMoon).toBe(4);
    expect(get("Jupiter").favourable).toBe(false);
    expect(get("Jupiter").next?.sign).toBe("Taurus");
    expect(days(get("Jupiter").next!.date, new Date("2024-05-01T12:00:00Z"))).toBeLessThan(1);
    expect(get("Rahu").retrograde).toBe(true);
  });
});

describe("saturnCycles", () => {
  it("finds a Capricorn-Moon native's Sade Sati running Jan 2017 – Mar 2025 with all three phases", () => {
    // Saturn: Sagittarius (12th) from Jan 2017, Capricorn (1st) from Jan 2020, Aquarius (2nd) Jan 2023 – Mar 2025.
    const cycles = saturnCycles(9, new Date("2015-01-01"), new Date("2030-01-01"));
    const sade = cycles.find((c) => c.kind === "Sade Sati")!;
    expect(sade.start.getUTCFullYear()).toBe(2017);
    expect(sade.end.getUTCFullYear()).toBe(2025);
    // Each phase appears once, in order, even though Saturn's retrograde loops cross the boundaries more than once.
    expect(sade.phases.map((p) => p.phase)).toEqual(["Rising", "Peak", "Setting"]);
    // Retrograde loops back into Sagittarius in 2020 are merged, not split into a second Sade Sati.
    expect(cycles.filter((c) => c.kind === "Sade Sati")).toHaveLength(1);
  });

  it("also reports the Dhaiya periods", () => {
    const kinds = saturnCycles(9, new Date("1990-01-01"), new Date("2030-01-01")).map((c) => c.kind);
    expect(kinds).toContain("Kantaka Shani");
    expect(kinds).toContain("Ashtama Shani");
  });
});
