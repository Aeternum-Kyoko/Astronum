import { describe, it, expect } from "vitest";
import { calculateKundali } from "../kundali";
import { rudrakshaPlan, PLANET_MUKHI } from "../rudraksha";
import { SIGN_LORDS } from "../constants";

const birth = { date: "1985-11-23", time: "22:10", latitude: 19.076, longitude: 72.8777, name: "T", timezone: "Asia/Kolkata", place: "Mumbai" };
const chart = calculateKundali(birth);
const plan = rudrakshaPlan(chart);
const all = [...plan.top, ...plan.others];

describe("rudrakshaPlan", () => {
  it("always includes the Lagna lord's bead as the lifelong one", () => {
    const lagnaLord = SIGN_LORDS[chart.ascendant.signIndex];
    const r = all.find((x) => x.planet === lagnaLord)!;
    expect(r.role).toBe("Lifelong");
    expect(r.bead.mukhi).toBe(PLANET_MUKHI[lagnaLord].main);
    expect(r.reasons[0].text).toMatch(/Lord of your Lagna/);
  });

  it("supports the running Mahadasha and Antardasha lords", () => {
    expect(all.some((r) => r.reasons.some((x) => /Mahadasha until/.test(x.text)) && r.planet === chart.currentDasha!.lord)).toBe(true);
  });

  it("answers an active Sade Sati with Saturn's bead", () => {
    expect(chart.sadeSati.active).toBe(true);
    const sat = all.find((r) => r.planet === "Saturn")!;
    expect(sat.bead.mukhi).toBe("7");
    expect(sat.reasons.some((x) => /Sade Sati/.test(x.text))).toBe(true);
  });

  it("ranks by the sum of its reasons and builds a three-bead combination", () => {
    for (const r of all) expect(r.score).toBe(r.reasons.reduce((a, x) => a + x.points, 0));
    expect(plan.top).toHaveLength(3);
    expect(plan.top[0].score).toBeGreaterThanOrEqual(plan.top[2].score);
    expect(plan.combination.beads).toEqual(plan.top.map((r) => r.bead.mukhi));
  });

  it("gives a bead for each life goal from the house that governs it", () => {
    expect(plan.goals.map((g) => g.goal)).toContain("Career and status");
    const tenthLord = SIGN_LORDS[(chart.ascendant.signIndex + 9) % 12];
    expect(plan.goals.find((g) => g.goal === "Career and status")!.bead.mukhi).toBe(PLANET_MUKHI[tenthLord].main);
  });
});

describe("rudrakshaPlan in Hindi", () => {
  it("gives the same beads with Hindi reasons, names and mantras", () => {
    const hi = rudrakshaPlan(chart, "hi");
    expect(hi.top.map((r) => r.bead.mukhi)).toEqual(plan.top.map((r) => r.bead.mukhi));
    expect(hi.top[0].reasons[0].text).toMatch(/लग्न/);
    expect(hi.top[0].bead.name).toMatch(/मुखी/);
    expect(hi.top[0].bead.mantra).toMatch(/^ॐ/);
    expect(hi.combination.text).toMatch(/संयोजन/);
    expect(hi.wearing[0]).toMatch(/धारण/);
  });
});
