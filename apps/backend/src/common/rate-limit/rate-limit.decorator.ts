import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit';
export const SKIP_RATE_LIMIT_KEY = 'skip_rate_limit';

export interface RateLimitOptions {
  /**
   * Maximum number of requests allowed within the window.
   */
  limit: number;
  /**
   * Sliding window duration in milliseconds.
   * @default 60_000 (1 minute)
   */
  windowMs?: number;
  /**
   * Namespace prefix for the Redis key, useful for grouping routes
   * (e.g. 'payment', 'auth'). Defaults to 'default'.
   */
  keyPrefix?: string;
}

/**
 * Override the default rate-limit for a controller or route handler.
 *
 * @example
 * // Stricter limit on payment endpoints
 * @RateLimit({ limit: 20, windowMs: 60_000, keyPrefix: 'payment' })
 */
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

/**
 * Exempt a route from rate-limiting entirely.
 * Apply to webhook endpoints that are already protected by signature verification.
 */
export const SkipRateLimit = () => SetMetadata(SKIP_RATE_LIMIT_KEY, true);
