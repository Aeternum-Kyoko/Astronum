import { describe, it, expect, beforeAll } from "vitest";
import { createUserSessionToken, verifyUserSessionToken, USER_SESSION_TTL_MS } from "../userSession";
import { createSessionToken, verifySessionToken } from "../auth";
import { checkRateLimit } from "../rateLimit";
import { safeRedirectPath } from "../safeRedirect";

beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret-for-unit-tests";
});

describe("user session tokens", () => {
  it("round-trips the user id and session version", async () => {
    const token = await createUserSessionToken("cmabc123", 3);
    expect(await verifyUserSessionToken(token)).toEqual({ userId: "cmabc123", version: 3 });
  });

  it("rejects tampered, malformed and expired tokens", async () => {
    const token = await createUserSessionToken("cmabc123", 0);
    expect(await verifyUserSessionToken(token.replace("cmabc123", "cmevil999"))).toBeNull();
    expect(await verifyUserSessionToken(token.slice(0, -2) + "00")).toBeNull();
    expect(await verifyUserSessionToken("nonsense")).toBeNull();
    expect(await verifyUserSessionToken(undefined)).toBeNull();
    expect(await verifyUserSessionToken(token, Date.now() + USER_SESSION_TTL_MS + 1000)).toBeNull();
  });

  it("never lets a user token pass as an admin token, or the reverse", async () => {
    expect(await verifySessionToken(await createUserSessionToken("cmabc123", 0))).toBe(false);
    expect(await verifyUserSessionToken(await createSessionToken())).toBeNull();
  });
});

describe("checkRateLimit", () => {
  it("allows up to the limit within a window, then resets", () => {
    const key = `test-${Math.random()}`;
    const t0 = 1_000_000;
    for (let i = 0; i < 3; i++) expect(checkRateLimit(key, 3, 60_000, t0).allowed).toBe(true);
    const blocked = checkRateLimit(key, 3, 60_000, t0 + 1000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBe(59);
    expect(checkRateLimit(key, 3, 60_000, t0 + 60_001).allowed).toBe(true);
  });
});

describe("safeRedirectPath", () => {
  it("keeps same-site paths and rejects anything that could leave the site", () => {
    expect(safeRedirectPath("/kundali?name=A")).toBe("/kundali?name=A");
    expect(safeRedirectPath("//evil.com")).toBe("/account");
    expect(safeRedirectPath("/\\evil.com")).toBe("/account");
    expect(safeRedirectPath("https://evil.com")).toBe("/account");
    expect(safeRedirectPath(null, "/")).toBe("/");
  });
});
