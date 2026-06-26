import "server-only";

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  ok: boolean;
  retryAfterSeconds: number;
};

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  {
    limit,
    windowMs,
  }: {
    limit: number;
    windowMs: number;
  },
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return { ok: true, retryAfterSeconds: 0 };
}

/**
 * Applique une limite et lève une erreur si dépassée.
 * À utiliser dans les Server Actions (le message remonte au client).
 */
export function enforceRateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): void {
  const result = checkRateLimit(key, opts);
  if (!result.ok) {
    throw new Error(
      `Trop de requêtes. Réessayez dans ${result.retryAfterSeconds} secondes.`,
    );
  }
}
