import { describe, expect, it } from "vitest";
import { KUNDLI_SECTIONS, EXPERT_CATEGORIES, PERSONAL_CATEGORIES } from "../kundliLibrary";

describe("Kundli tool inventory", () => {
  it("retains every existing non-legacy deep link", () => {
    const existing = ["rasi","navamsa","vargas","compare","houses","planets","report","career","relationships","wealth","education","property","dashas","transits","monthly","annual","timeline","calendar","yogini","chara","shadbala","ashtakavarga","lords","yogas","sectors","kp","lalkitab","tables","remedies","rudraksha","vastu","precision","journal","calculations"];
    expect(KUNDLI_SECTIONS.map(item => item.slug).sort()).toEqual(existing.sort());
    expect(new Set(KUNDLI_SECTIONS.map(item => item.tab)).size).toBe(existing.length);
  });
  it("keeps numerical and specialist systems out of Personal collections", () => {
    for (const slug of ["shadbala","ashtakavarga","kp","lalkitab","tables","calendar","yogini","chara","journal","calculations"]) {
      expect(KUNDLI_SECTIONS.find(item => item.slug === slug)?.personal).toBeUndefined();
      expect(KUNDLI_SECTIONS.find(item => item.slug === slug)?.expert).toBeTruthy();
    }
  });
  it("provides a home and bilingual descriptions for all tools", () => {
    for (const item of KUNDLI_SECTIONS) {
      expect(EXPERT_CATEGORIES).toContain(item.expert);
      if(item.personal) expect(PERSONAL_CATEGORIES).toContain(item.personal);
      expect(item.titleHi.length).toBeGreaterThan(0);
      expect(item.descriptionHi.length).toBeGreaterThan(0);
    }
  });
});
