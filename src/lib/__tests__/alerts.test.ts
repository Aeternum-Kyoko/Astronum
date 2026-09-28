import { describe, it, expect } from "vitest";
import { buildDigest, type AlertUser } from "../alerts";
import type { Profile } from "../profiles";

const me: Profile = { id: "p1", name: "Asha", date: "1990-04-12", time: "06:45", place: "Jaipur", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata", relation: "Self", isDefault: true };
const base: AlertUser = { name: "Asha Sharma", email: "asha@example.test", notifyDaily: false, notifyDasha: false, notifyTransits: false, notifyFestivals: false, sentAlertKeys: "", unsubscribeToken: "tok" };
const now = new Date("2026-09-28T01:00:00Z");

describe("daily digest", () => {
  it("sends nothing when no alert is chosen", () => {
    expect(buildDigest(base, [me], "https://site.test", now)).toBeNull();
  });
  it("builds the daily section with stars, tara and dasha, and an unsubscribe link", () => {
    const d = buildDigest({ ...base, notifyDaily: true }, [me], "https://site.test", now)!;
    expect(d.text).toContain("Your day");
    expect(d.text).toContain("tara");
    expect(d.text).toContain("Running dasha");
    expect(d.html).toContain("https://site.test/unsubscribe?token=tok");
  });
  it("announces a dasha change once, then remembers it", () => {
    // Find a date a few days before this chart's next Antardasha by scanning forward.
    let found: { digest: NonNullable<ReturnType<typeof buildDigest>>; at: Date } | null = null;
    for (let d = 0; d < 1500 && !found; d += 5) {
      const at = new Date(now.getTime() + d * 86400_000);
      const digest = buildDigest({ ...base, notifyDasha: true }, [me], "https://site.test", at);
      if (digest) found = { digest, at };
    }
    expect(found).not.toBeNull();
    expect(found!.digest.newKeys.length).toBeGreaterThan(0);
    const again = buildDigest({ ...base, notifyDasha: true, sentAlertKeys: found!.digest.newKeys.join(",") }, [me], "https://site.test", found!.at);
    expect(again).toBeNull();
  });
});
