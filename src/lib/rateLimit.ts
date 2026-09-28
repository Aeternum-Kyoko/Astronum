/**
 * Fixed-window, in-memory rate limiter for login attempts. Per server process
 * only — enough to blunt password guessing on a single instance; put a shared
 * store (e.g. Redis) behind this if the app is ever scaled horizontally.
 */

const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): { allowed: boolean; retryAfterSec: number } {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    }
    return { allowed: true, retryAfterSec: 0 };
  }
  bucket.count += 1;
  return { allowed: bucket.count <= limit, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
}
