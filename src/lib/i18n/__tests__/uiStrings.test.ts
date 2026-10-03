import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { UI_HI } from "../ui.hi";

/** Every literal passed to t("…") in the app, so each one is checked for a Hindi translation. */
function usedStrings(): Map<string, string> {
  const found = new Map<string, string>();
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name !== "__tests__" && e.name !== "generated") walk(p);
      } else if (/\.tsx?$/.test(e.name)) {
        const src = fs.readFileSync(p, "utf8");
        for (const m of src.matchAll(/\b(?:t|tr)\("((?:[^"\\]|\\.)*)"\)/g)) found.set(JSON.parse(`"${m[1]}"`), p);
      }
    }
  };
  walk(path.resolve(__dirname, "../../.."));
  return found;
}

describe("Hindi interface strings", () => {
  it("has a Hindi translation for every string the interface shows", () => {
    const missing = [...usedStrings()].filter(([s]) => !UI_HI[s]).map(([s, file]) => `${path.relative(process.cwd(), file)}: ${s}`);
    expect(missing, `Missing Hindi:\n${missing.join("\n")}`).toEqual([]);
  });
});
