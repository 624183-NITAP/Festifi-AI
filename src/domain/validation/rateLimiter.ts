/**
 * FestiFi AI — Token Bucket Rate Limiter
 * Protects server-side AI endpoints from abuse, denial of service,
 * and runaway billable queries.
 *
 * ARCHITECTURAL CONSTRAINTS & DEPLOYMENT CONSIDERATIONS:
 * 1. Single-Instance / Stateful Container Model:
 *    This implementation maintains an in-memory Map of token buckets keyed by client identifier.
 *    It is optimal for single-process environments, standalone Node.js servers, or stateful containers
 *    with sticky routing.
 * 2. Multi-Instance / Serverless Scaling (Cloud Deployments):
 *    In multi-instance clusters (e.g. AWS ECS/EKS with multiple replicas, Vercel Serverless,
 *    Cloudflare Workers), memory state is not shared across isolated process boundaries.
 *    For production deployments scaling across multiple pods or serverless instances,
 *    replace or back this store with an atomic distributed store such as:
 *    - Redis (Upstash Redis or ioredis) using EVAL Lua scripts for atomic token consumption.
 *    - Cloudflare KV / Durable Objects with sliding-window or token-bucket rate limiting.
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
 * Prunes inactive buckets to prevent unbounded memory growth in long-running processes.
 */
function pruneStaleBuckets(now: number): void {
  if (rateLimitBuckets.size <= 500) return;
  const staleThreshold = 10 * 60 * 1000; // 10 minutes
  for (const [key, bucket] of rateLimitBuckets.entries()) {
    if (now - bucket.lastRefill > staleThreshold) {
      rateLimitBuckets.delete(key);
    }
  }
}

/**
 * Resets the in-memory rate limit store. Useful for testing environments.
 */
export function _resetRateLimitsForTesting(): void {
  rateLimitBuckets.clear();
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
  pruneStaleBuckets(now);
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
