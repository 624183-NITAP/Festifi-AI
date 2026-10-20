/**
 * FestiFi AI — Token Bucket Rate Limiter
 * Protects server-side AI endpoints from abuse, denial of service,
 * and runaway billable queries.
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const rateLimitBuckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Checks and consumes a token for a given client identifier (e.g., client IP).
 * @param clientId IP address or session token
 * @param capacity Maximum tokens bucket can hold (default 20)
 * @param refillRatePerSecond Number of tokens restored per second (default 0.33 => 20/min)
 */
export function checkRateLimit(
  clientId: string,
  capacity: number = 20,
  refillRatePerSecond: number = 0.33
): RateLimitResult {
  const now = Date.now();
  let bucket = rateLimitBuckets.get(clientId);

  if (!bucket) {
    bucket = { tokens: capacity, lastRefill: now };
    rateLimitBuckets.set(clientId, bucket);
  } else {
    // Refill tokens based on elapsed time
    const elapsedSeconds = (now - bucket.lastRefill) / 1000;
    const addedTokens = elapsedSeconds * refillRatePerSecond;
    bucket.tokens = Math.min(capacity, bucket.tokens + addedTokens);
    bucket.lastRefill = now;
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return {
      allowed: true,
      remaining: Math.floor(bucket.tokens),
      resetInSeconds: Math.ceil((capacity - bucket.tokens) / refillRatePerSecond),
    };
  }

  return {
    allowed: false,
    remaining: 0,
    resetInSeconds: Math.ceil((1 - bucket.tokens) / refillRatePerSecond),
  };
}
