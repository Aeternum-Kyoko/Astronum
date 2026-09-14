import { describe, it, expect } from "vitest";
import { computeVimshottariDasha, computeAntardashas, computePratyantardashas, moonDashaBalance } from "../dasha";
import { DASHA_SEQUENCE, DASHA_YEARS } from "../constants";

const YEAR_MS = 365.25 * 86400000;
const birth = new Date(Date.UTC(1990, 5, 15, 9, 0, 0));

describe("computeVimshottariDasha", () => {
  it("follows the fixed Ketu→Venus→Sun→...→Mercury cyclic order regardless of start point", () => {
    const dashas = computeVimshottariDasha(200, birth); // arbitrary Moon longitude
    for (let i = 1; i < dashas.length; i++) {
      const prevIndex = DASHA_SEQUENCE.indexOf(dashas[i - 1].lord);
      const currIndex = DASHA_SEQUENCE.indexOf(dashas[i].lord);
      expect(currIndex).toBe((prevIndex + 1) % 9);
    }
  });

  it("chains periods with no gap or overlap", () => {
    const dashas = computeVimshottariDasha(45, birth);
    for (let i = 1; i < dashas.length; i++) {
      expect(dashas[i].start.getTime()).toBe(dashas[i - 1].end.getTime());
    }
    expect(dashas[0].start.getTime()).toBe(birth.getTime());
  });

  it("gives every full (non-birth) Mahadasha exactly its classical number of years", () => {
    const dashas = computeVimshottariDasha(0.001, birth); // near-zero elapsed fraction, so periods after the first are full
    for (let i = 1; i < dashas.length; i++) {
      const years = (dashas[i].end.getTime() - dashas[i].start.getTime()) / YEAR_MS;
      expect(years).toBeCloseTo(DASHA_YEARS[dashas[i].lord], 2);
    }
  });

  it("gives a Moon at the very start of a nakshatra a full first Mahadasha", () => {
    const dashas = computeVimshottariDasha(0, birth);
    const years = (dashas[0].end.getTime() - dashas[0].start.getTime()) / YEAR_MS;
    expect(years).toBeCloseTo(DASHA_YEARS[dashas[0].lord], 2);
  });

  it("gives a Moon at the very end of a nakshatra almost no first Mahadasha", () => {
    const nakshatraSpan = 360 / 27;
    const almostNextNakshatra = nakshatraSpan - 0.0001;
    const dashas = computeVimshottariDasha(almostNextNakshatra, birth);
    const years = (dashas[0].end.getTime() - dashas[0].start.getTime()) / YEAR_MS;
    expect(years).toBeLessThan(0.01);
  });
});

describe("computeAntardashas", () => {
  it("starts with the Mahadasha lord's own Antardasha first", () => {
    const antardashas = computeAntardashas("Jupiter", birth, 0);
    expect(antardashas[0].lord).toBe("Jupiter");
  });

  it("sums to exactly the Mahadasha's own duration", () => {
    const mahadashaYears = DASHA_YEARS.Saturn;
    const antardashas = computeAntardashas("Saturn", birth, 0);
    const totalYears = (antardashas[antardashas.length - 1].end.getTime() - antardashas[0].start.getTime()) / YEAR_MS;
    expect(totalYears).toBeCloseTo(mahadashaYears, 2);
  });

  it("scales each Antardasha lord's share proportionally to its classical years", () => {
    const antardashas = computeAntardashas("Venus", birth, 0);
    const venusAntardasha = antardashas.find((a) => a.lord === "Venus")!;
    const years = (venusAntardasha.end.getTime() - venusAntardasha.start.getTime()) / YEAR_MS;
    // Venus-Venus antardasha = 20 * 20 / 120 years
    expect(years).toBeCloseTo((DASHA_YEARS.Venus * DASHA_YEARS.Venus) / 120, 2);
  });
});

describe("computePratyantardashas", () => {
  it("starts with the Antardasha lord's own Pratyantardasha first", () => {
    const antardashas = computeAntardashas("Jupiter", birth, 0);
    const jupiterAntardasha = antardashas.find((a) => a.lord === "Jupiter")!;
    const pratyantardashas = computePratyantardashas("Jupiter", jupiterAntardasha, 0);
    expect(pratyantardashas[0].lord).toBe("Jupiter");
  });

  it("sums to exactly the Antardasha's own duration", () => {
    const antardashas = computeAntardashas("Saturn", birth, 0);
    const antardasha = antardashas[2];
    const antardashaYears = (antardasha.end.getTime() - antardasha.start.getTime()) / YEAR_MS;
    const pratyantardashas = computePratyantardashas("Saturn", antardasha, 0);
    const totalYears =
      (pratyantardashas[pratyantardashas.length - 1].end.getTime() - pratyantardashas[0].start.getTime()) / YEAR_MS;
    expect(totalYears).toBeCloseTo(antardashaYears, 4);
  });
});

describe("moonDashaBalance", () => {
  it("picks the correct nakshatra lord as the starting Mahadasha lord", () => {
    // Nakshatra index 8 (Ashlesha) is ruled by Mercury; longitude just inside it.
    const nakshatraSpan = 360 / 27;
    const { startLordIndex } = moonDashaBalance(8 * nakshatraSpan + 1);
    expect(DASHA_SEQUENCE[startLordIndex]).toBe("Mercury");
  });
});
