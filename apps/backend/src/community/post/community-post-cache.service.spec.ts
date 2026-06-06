import { Test, TestingModule } from '@nestjs/testing';
import { CommunityPostCacheService } from './community-post-cache.service';
import { CacheService } from '../../common/cache.service';

describe('CommunityPostCacheService', () => {
  let cacheService: CommunityPostCacheService;
  let redisMock: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    zadd: jest.Mock;
    expire: jest.Mock;
    exists: jest.Mock;
    zrem: jest.Mock;
    pipeline: jest.Mock;
    scanStream: jest.Mock;
  };

  beforeEach(async () => {
    redisMock = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      zadd: jest.fn(),
      expire: jest.fn(),
      exists: jest.fn(),
      zrem: jest.fn(),
      pipeline: jest.fn(() => ({
        zadd: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      })),
      scanStream: jest.fn(() => ({
        [Symbol.asyncIterator]: async function* () {
          yield [];
        },
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityPostCacheService,
        {
          provide: CacheService,
          useValue: {
            tryGetClient: () => redisMock,
          },
        },
      ],
    }).compile();

    cacheService = module.get(CommunityPostCacheService);
  });

  it('invalidates feed cache keys for a community', async () => {
    const keys = ['cp:feed:comm1:start:10'];
    redisMock.scanStream.mockReturnValue({
      [Symbol.asyncIterator]: async function* () {
        yield keys;
      },
    });

    await cacheService.invalidateCommunityFeed('comm1');
    expect(redisMock.del).toHaveBeenCalledWith(...keys);
  });

  it('adds post to timeline zset', async () => {
    const createdAt = new Date('2026-06-06T12:00:00.000Z');
    await cacheService.addToTimeline('comm1', 'post1', createdAt);
    expect(redisMock.zadd).toHaveBeenCalledWith(
      'cp:tl:comm1',
      createdAt.getTime(),
      'post1',
    );
    expect(redisMock.expire).toHaveBeenCalled();
  });
});
