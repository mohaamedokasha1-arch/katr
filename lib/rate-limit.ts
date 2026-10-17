interface Bucket {
  count: number;
  resetAt: number;
}

const globalRate = globalThis as typeof globalThis & {
  __rakebRateBuckets?: Map<string, Bucket>;
};

function buckets(): Map<string, Bucket> {
  if (!globalRate.__rakebRateBuckets) globalRate.__rakebRateBuckets = new Map();
  return globalRate.__rakebRateBuckets;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

/** Simple fixed-window limiter for the demo API. Replace with Redis in production. */
export function rateLimit(key: string, limit = 10, windowMs = 60_000): RateLimitResult {
  const store = buckets();
  const now = Date.now();
  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    const next = { count: 1, resetAt: now + windowMs };
    store.set(key, next);
    if (store.size > 5000) {
      for (const [entryKey, entry] of store) {
        if (entry.resetAt <= now) store.delete(entryKey);
      }
    }
    return { ok: true, remaining: limit - 1, resetAt: next.resetAt };
  }
  if (current.count >= limit) {
    return { ok: false, remaining: 0, resetAt: current.resetAt };
  }
  current.count += 1;
  return { ok: true, remaining: limit - current.count, resetAt: current.resetAt };
}

export function clientFingerprint(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for') ?? '';
  const ip = forwarded.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown';
  const ua = headers.get('user-agent') ?? 'unknown';
  return `${ip}|${ua.slice(0, 80)}`;
}
