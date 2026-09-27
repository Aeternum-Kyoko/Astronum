import { hmac, timingSafeEqual } from "@/lib/auth";

/**
 * Signed user sessions: `user:<id>:<version>:<expiry>.<hmac>`. The version
 * must match the user's current sessionVersion (bumped on password reset), so
 * old sessions can be revoked without a session table. The "user:"
 * prefix keeps these from ever verifying as admin tokens (whose payload is a
 * bare expiry) and vice versa. Kept free of Next/Prisma imports so it can be
 * unit-tested and used from the proxy.
 */

export const USER_COOKIE = "astronum_session";
export const USER_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export async function createUserSessionToken(userId: string, version: number, now = Date.now()): Promise<string> {
  const payload = `user:${userId}:${version}:${now + USER_SESSION_TTL_MS}`;
  return `${payload}.${await hmac(payload)}`;
}

/** Who the token was issued for, or null if it's forged, malformed or expired. Callers must still check the version. */
export async function verifyUserSessionToken(
  token: string | undefined | null,
  now = Date.now()
): Promise<{ userId: string; version: number } | null> {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!timingSafeEqual(await hmac(payload), signature)) return null;

  const [kind, userId, version, expiry] = payload.split(":");
  if (kind !== "user" || !userId || !/^\d+$/.test(version ?? "") || !expiry) return null;
  return Number(expiry) > now ? { userId, version: Number(version) } : null;
}

export const userCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: USER_SESSION_TTL_MS / 1000,
};
