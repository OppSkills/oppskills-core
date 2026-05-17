import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { Logger } from 'src/_utils/logger';
import { CacheService } from '../cache.service';
import {
  RATE_LIMIT_KEY,
  SKIP_RATE_LIMIT_KEY,
  RateLimitOptions,
} from './rate-limit.decorator';

/**
 * Default limits applied when no @RateLimit() decorator is present.
 *
 * - Unauthenticated (IP-keyed): 60 req / minute — protects public discovery
 * - Authenticated  (user-keyed): 200 req / minute — comfortable for normal usage
 */
const DEFAULTS = {
  unauthenticated: { limit: 60, windowMs: 60_000 },
  authenticated: { limit: 200, windowMs: 60_000 },
} as const;

/**
 * Sliding-window rate limiter backed by Redis sorted sets.
 *
 * Algorithm (atomic Lua script):
 *  1. Remove entries older than (now - windowMs)
 *  2. Count remaining entries (requests in the current window)
 *  3. If count >= limit → reject with 429
 *  4. Otherwise → record the new request with PEXPIREAT on the key
 *
 * Why sorted sets?
 *  Unlike a simple counter this approach never under-counts at window
 *  boundaries — each entry carries its exact timestamp as the score.
 *
 * Key format: rl:{keyPrefix}:{identifier}
 *  identifier = userId when authenticated, otherwise the client IP.
 *
 * Fail-open: if CacheService/Redis is unavailable the guard logs a warning
 * and allows the request through — no false 429s block production traffic.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // ── 1. Check @SkipRateLimit() on handler or controller ──────────────────
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const redis = this.cacheService.tryGetClient();

    // ── 2. If Redis is not yet ready, fail-open ──────────────────────────────
    if (!redis) {
      this.logger.warn(
        '[RateLimitGuard] Redis not available; rate limiting is disabled.',
      );
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // ── 3. Resolve effective options ─────────────────────────────────────────
    const override = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    const isAuthenticated = !!request.user?.id;
    const defaults = isAuthenticated
      ? DEFAULTS.authenticated
      : DEFAULTS.unauthenticated;

    const limit = override?.limit ?? defaults.limit;
    const windowMs = override?.windowMs ?? defaults.windowMs;
    const keyPrefix = override?.keyPrefix ?? 'default';

    // ── 4. Derive the rate-limit identity key ─────────────────────────────────
    const identifier = isAuthenticated
      ? `user:${request.user!.id}`
      : `ip:${this.extractIp(request)}`;

    const redisKey = `rl:${keyPrefix}:${identifier}`;

    // ── 5. Run atomic Lua script ──────────────────────────────────────────────
    try {
      const now = Date.now();
      const windowStart = now - windowMs;

      /**
       * Returns [count_after_add, allowed]
       * - count_after_add: requests recorded in the window after this one
       * - allowed: 1 = within limit, 0 = over limit
       *
       * The check + record is one atomic operation → no TOCTOU races.
       */
      const script = `
        local key        = KEYS[1]
        local now        = tonumber(ARGV[1])
        local window_ms  = tonumber(ARGV[2])
        local limit      = tonumber(ARGV[3])
        local win_start  = now - window_ms

        redis.call('ZREMRANGEBYSCORE', key, '-inf', win_start)

        local count = redis.call('ZCARD', key)

        if count >= limit then
          redis.call('PEXPIRE', key, window_ms)
          return {count, 0}
        end

        redis.call('ZADD', key, now, now .. '-' .. math.random(1, 999999))
        redis.call('PEXPIRE', key, window_ms)
        return {count + 1, 1}
      `;

      const result = (await (redis as any).eval(
        script,
        1,
        redisKey,
        now.toString(),
        windowMs.toString(),
        limit.toString(),
      )) as [number, number];

      const currentCount = result[0];
      const allowed = result[1] === 1;
      const remaining = Math.max(0, limit - currentCount);
      const resetAt = Math.ceil((now + windowMs) / 1000);

      // ── 6. Standard rate-limit response headers ───────────────────────────
      response.setHeader('X-RateLimit-Limit', limit.toString());
      response.setHeader('X-RateLimit-Remaining', remaining.toString());
      response.setHeader('X-RateLimit-Reset', resetAt.toString());
      response.setHeader('X-RateLimit-Window-Ms', windowMs.toString());

      if (!allowed) {
        const retryAfterSeconds = Math.ceil(windowMs / 1000);
        response.setHeader('Retry-After', retryAfterSeconds.toString());

        this.logger.warn('[RateLimitGuard] Rate limit exceeded', {
          key: redisKey,
          count: currentCount,
          limit,
        });

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            error: 'Too Many Requests',
            message: `Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) throw error;

      // Redis error → fail-open
      this.logger.error('[RateLimitGuard] Redis error; allowing request', {
        error: error instanceof Error ? error.message : String(error),
        key: redisKey,
      });
      return true;
    }
  }

  private extractIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return (
      (request.headers['x-real-ip'] as string) ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }
}
