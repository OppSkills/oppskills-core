import Redis from 'ioredis';

export const RedisProvider = {
  provide: 'REDIS',
  useFactory: () => {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      throw new Error('REDIS_URL is not defined');
    }

    return new Redis(redisUrl, {
      maxRetriesPerRequest: null,
    });
  },
};