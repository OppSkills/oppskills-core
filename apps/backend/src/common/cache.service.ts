import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { OnModuleDestroy } from '@nestjs/common';
import { Logger } from 'src/_utils/logger';
@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private redis: Redis;
  private readonly logger: Logger;
  private connectionHealthy: boolean = false;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.logger = new Logger(CacheService.name);
  }

  async onModuleInit() {
    // this.initializeRedis();
  }

  private initializeRedis() {
    try {
      // Log environment variables for debugging
      this.logger.debug('Redis environment variables:', {
        REDIS_URL: process.env.REDIS_URL ? 'SET' : 'NOT SET',
        REDISHOST: process.env.REDISHOST,
        REDISPORT: process.env.REDISPORT,
      });

      // Use REDIS_URL if available, otherwise fall back to individual host/port
      const redisConfig = process.env.REDIS_URL
        ? { url: process.env.REDIS_URL }
        : {
            host: process.env.REDISHOST || 'localhost',
            port: parseInt(process.env.REDISPORT || '6379'),
          };

      this.logger.debug('Redis config:', redisConfig);

      this.redis = new Redis({
        ...redisConfig,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          const delay = Math.min(times * 100, 3000);
          return delay;
        },
      });

      this.redis.on('error', (err) => {
        this.connectionHealthy = false;
        this.logger.error('Redis connection error:', err);
      });

      this.redis.on('connect', () => {
        this.connectionHealthy = true;
        this.logger.debug('Connected to Redis successfully');
      });

      // Set up a periodic health check
      this.pingInterval = setInterval(async () => {
        try {
          const pong = await this.redis.ping();
          this.connectionHealthy = pong === 'PONG';
          if (!this.connectionHealthy) {
            this.logger.warn('Redis ping failed, unexpected response');
          }
        } catch (error) {
          this.connectionHealthy = false;
          this.logger.error('Redis health check failed:', error);
          this.reconnect();
        }
      }, 30000); // Every 30 seconds

      this.logger.debug('Redis client initialized for cache service');
    } catch (error) {
      this.logger.error('Failed to initialize Redis client:', error);
      this.connectionHealthy = false;
      // Schedule a reconnection attempt
      setTimeout(() => this.reconnect(), 5000);
    }
  }

  private async reconnect() {
    try {
      this.logger.debug('Attempting to reconnect to Redis...');
      if (this.redis) {
        try {
          await this.redis.quit();
        } catch (e) {
          // Ignore errors during quit
        }
      }
      this.initializeRedis();
    } catch (error) {
      this.logger.error('Redis reconnection failed:', error);
    }
  }

  async set(key: string, value: any, ttl?: number) {
    try {
      if (!this.connectionHealthy) {
        this.logger.warn(
          `Redis connection unhealthy, skipping set for key: ${key}`,
        );
        return;
      }

      if (ttl) {
        await this.redis.set(key, value, 'PX', ttl);
      } else {
        await this.redis.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error);
      this.checkConnectionHealth();
    }
  }

  async get(key: string) {
    try {
      if (!this.connectionHealthy) {
        this.logger.warn(
          `Redis connection unhealthy, skipping get for key: ${key}`,
        );
        return null;
      }

      return await this.redis.get(key);
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}:`, error);
      this.checkConnectionHealth();
      return null;
    }
  }

  async delete(key: string) {
    try {
      if (!this.connectionHealthy) {
        this.logger.warn(
          `Redis connection unhealthy, skipping delete for key: ${key}`,
        );
        return;
      }

      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}:`, error);
      this.checkConnectionHealth();
    }
  }

  private async checkConnectionHealth() {
    try {
      const pong = await this.redis.ping();
      this.connectionHealthy = pong === 'PONG';
      if (!this.connectionHealthy) {
        this.reconnect();
      }
    } catch (error) {
      this.connectionHealthy = false;
      this.reconnect();
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
        this.logger.error('Error closing Redis connection:', error);
      }
    }
  }

  async keys(pattern: string) {
    try {
      if (!this.connectionHealthy) {
        this.logger.warn(
          `Redis connection unhealthy, skipping keys query for pattern: ${pattern}`,
        );
        return [];
      }

      return await this.redis.keys(pattern);
    } catch (error) {
      this.logger.error(
        `Error getting cache keys for pattern ${pattern}:`,
        error,
      );
      this.checkConnectionHealth();
      return [];
    }
  }

  /**
   * Set a JSON object in Redis
   */
  async setJSON(key: string, value: any, ttl?: number) {
    try {
      if (!this.connectionHealthy) {
        this.logger.warn(
          `Redis connection unhealthy, skipping setJSON for key: ${key}`,
        );
        return;
      }

      const jsonString = JSON.stringify(value);
      if (ttl) {
        await this.redis.set(key, jsonString, 'PX', ttl);
      } else {
        await this.redis.set(key, jsonString);
      }
    } catch (error) {
      this.logger.error(`Error setting JSON cache key ${key}:`, error);
      this.checkConnectionHealth();
    }
  }

  /**
   * Get and parse a JSON object from Redis
   */
  async getJSON(key: string) {
    try {
      if (!this.connectionHealthy) {
        this.logger.warn(
          `Redis connection unhealthy, skipping getJSON for key: ${key}`,
        );
        return null;
      }

      const value = await this.redis.get(key);
      if (!value) return null;

      try {
        return JSON.parse(value);
      } catch (err) {
        this.logger.warn(`Failed to parse JSON for key ${key}:`, err);
        return null;
      }
    } catch (error) {
      this.logger.error(`Error getting JSON cache key ${key}:`, error);
      this.checkConnectionHealth();
      return null;
    }
  }
}
