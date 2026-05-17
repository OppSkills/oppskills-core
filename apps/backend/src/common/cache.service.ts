import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { Logger } from 'src/_utils/logger';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private redis!: Redis;
  private readonly logger: Logger;
  private connectionHealthy: boolean = false;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.logger = new Logger(CacheService.name);
    /**
     * Create the ioredis client in the constructor (not `onModuleInit`).
     * Other services (BullMQ, ReferralCounterService, etc.) capture
     * `getClient()` in their constructors; Nest runs all constructors before
     * any `onModuleInit`, so deferring init there left `this.redis` undefined.
     */
    this.initializeRedis();
  }

  private initializeRedis() {
    try {
      this.logger.debug('Initializing Redis client', {
        REDIS_URL: process.env.REDIS_URL ? 'SET' : 'NOT SET',
        REDISHOST: process.env.REDISHOST,
        REDISPORT: process.env.REDISPORT,
      });

      /**
       * ioredis accepts the URL as the first positional argument.
       * Passing { url: '...' } inside the options object is NOT supported
       * and was the root cause of the original connection failure.
       *
       * maxRetriesPerRequest: null is required so that BullMQ (which uses
       * this same client via getClient()) can manage its own retry logic
       * using blocking commands that must not auto-retry.
       */
      const sharedOptions: Redis['options'] & { maxRetriesPerRequest: null } = {
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
        retryStrategy: (times) => Math.min(times * 200, 5_000),
      };

      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL, sharedOptions);
      } else {
        this.redis = new Redis({
          host: process.env.REDISHOST || 'localhost',
          port: parseInt(process.env.REDISPORT || '6379', 10),
          password: process.env.REDISPASSWORD || undefined,
          ...sharedOptions,
        });
      }

      this.redis.on('error', (err) => {
        this.connectionHealthy = false;
        this.logger.error('Redis connection error', err);
      });

      this.redis.on('connect', () => {
        this.connectionHealthy = true;
        this.logger.debug('Connected to Redis successfully');
      });

      this.redis.on('reconnecting', () => {
        this.connectionHealthy = false;
        this.logger.warn('Redis reconnecting…');
      });

      // Periodic health check every 30 s
      this.pingInterval = setInterval(async () => {
        try {
          const pong = await this.redis.ping();
          this.connectionHealthy = pong === 'PONG';
          if (!this.connectionHealthy) {
            this.logger.warn('Redis ping returned unexpected response');
          }
        } catch (error) {
          this.connectionHealthy = false;
          this.logger.error('Redis health check failed', error);
        }
      }, 30_000);

      this.logger.debug('Redis client initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Redis client', error);
      this.connectionHealthy = false;
    }
  }

  /**
   * Expose the raw ioredis client for callers that need advanced operations
   * (BullMQ connections, pipelines, Lua eval, SCAN streams, etc.).
   *
   * Prefer the high-level methods (get/set/delete/setJSON/getJSON) for simple
   * cache operations — they include health-checking and graceful degradation.
   */
  getClient(): Redis {
    const client = this.redis;
    if (!client) {
      throw new Error(
        'CacheService: Redis client is not initialized. Check REDIS_URL / REDISHOST.',
      );
    }
    return client;
  }

  /**
   * Like {@link getClient} but never throws — for optional Redis usage
   * (e.g. rate limit fail-open when env is misconfigured).
   */
  tryGetClient(): Redis | null {
    return this.redis ?? null;
  }

  async set(key: string, value: string, ttl?: number) {
    if (!this.connectionHealthy) {
      this.logger.warn(`Redis unhealthy — skipping set for key: ${key}`);
      return;
    }
    try {
      if (ttl) {
        await this.redis.set(key, value, 'PX', ttl);
      } else {
        await this.redis.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}`, error);
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.connectionHealthy) {
      this.logger.warn(`Redis unhealthy — skipping get for key: ${key}`);
      return null;
    }
    try {
      return await this.redis.get(key);
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}`, error);
      return null;
    }
  }

  async delete(key: string) {
    if (!this.connectionHealthy) {
      this.logger.warn(`Redis unhealthy — skipping delete for key: ${key}`);
      return;
    }
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}`, error);
    }
  }

  async keys(pattern: string): Promise<string[]> {
    if (!this.connectionHealthy) {
      this.logger.warn(
        `Redis unhealthy — skipping keys query for pattern: ${pattern}`,
      );
      return [];
    }
    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      this.logger.error(`Error getting keys for pattern ${pattern}`, error);
      return [];
    }
  }

  async setJSON(key: string, value: unknown, ttl?: number) {
    if (!this.connectionHealthy) {
      this.logger.warn(`Redis unhealthy — skipping setJSON for key: ${key}`);
      return;
    }
    try {
      const jsonString = JSON.stringify(value);
      if (ttl) {
        await this.redis.set(key, jsonString, 'PX', ttl);
      } else {
        await this.redis.set(key, jsonString);
      }
    } catch (error) {
      this.logger.error(`Error setting JSON cache key ${key}`, error);
    }
  }

  async getJSON<T = unknown>(key: string): Promise<T | null> {
    if (!this.connectionHealthy) {
      this.logger.warn(`Redis unhealthy — skipping getJSON for key: ${key}`);
      return null;
    }
    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        this.logger.warn(`Failed to parse JSON for key ${key}`);
        return null;
      }
    } catch (error) {
      this.logger.error(`Error getting JSON cache key ${key}`, error);
      return null;
    }
  }

  async onModuleDestroy() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.redis) {
      try {
        await this.redis.quit();
        this.logger.debug('Redis connection closed');
      } catch (error) {
        this.logger.error('Error closing Redis connection', error);
      }
    }
  }
}
