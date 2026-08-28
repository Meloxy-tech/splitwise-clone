/**
 * Minimal in-memory rate limiter, keyed by an identifier (usually IP).
 * Good enough for a single-instance deployment (e.g. Vercel hobby / Render
 * free tier). For multi-instance production use, swap this for an
 * Upstash Redis-backed limiter — same interface, no other code changes.
 */

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  { limit = 10, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): { success: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { success: false, remaining: 0 };
  }

  bucket.count += 1;
  return { success: true, remaining: limit - bucket.count };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}
