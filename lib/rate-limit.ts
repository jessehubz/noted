import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Production-ready rate limiter using Upstash Redis.
 * Works across all Vercel serverless instances (shared state via Redis).
 * Falls back to allowing requests if Upstash is not configured (dev mode).
 */

const isConfigured =
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_URL !== "your-upstash-redis-rest-url-here" &&
  process.env.UPSTASH_REDIS_REST_TOKEN &&
  process.env.UPSTASH_REDIS_REST_TOKEN !== "your-upstash-redis-rest-token-here";

const redis = isConfigured
  ? new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
  : null;

/**
 * Rate limiter for note creation: 5 notes per 60 seconds per IP.
 * Uses sliding window algorithm for smooth limiting.
 */
export const noteRateLimit = redis
  ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    prefix: "noted:note",
    analytics: true,
  })
  : null;

/**
 * Rate limiter for votes: 30 votes per 60 seconds per IP.
 */
export const voteRateLimit = redis
  ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "60 s"),
    prefix: "noted:vote",
    analytics: true,
  })
  : null;

/**
 * Rate limiter for comments: 10 comments per 60 seconds per user.
 */
export const commentRateLimit = redis
  ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    prefix: "noted:comment",
    analytics: true,
  })
  : null;

/**
 * Rate limiter for DMs: 20 messages per 60 seconds per user.
 */
export const dmRateLimit = redis
  ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "60 s"),
    prefix: "noted:dm",
    analytics: true,
  })
  : null;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit. If Upstash is not configured (local dev), always allows.
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<RateLimitResult> {
  if (!limiter) {
    // Upstash not configured — allow all (local dev)
    return { allowed: true, remaining: 999, resetAt: Date.now() + 60_000 };
  }

  const result = await limiter.limit(identifier);
  return {
    allowed: result.success,
    remaining: result.remaining,
    resetAt: result.reset,
  };
}
