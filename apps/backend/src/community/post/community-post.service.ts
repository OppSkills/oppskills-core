import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma, Prisma } from '@oppskills/db';
import { CommunityService } from '../community.service';
import { CommunityPostCacheService } from './community-post-cache.service';
import { CommunityPostLikeService } from './community-post-like.service';
import { CommunityPostRepostService } from './community-post-repost.service';
import {
  CreateCommunityPostDto,
  UpdateCommunityPostDto,
} from './dto/create-community-post.dto';
import { AnalyticsService } from 'src/analytics/analytics.service';
import { SkillsService } from 'src/skills/skills.service';
import type {
  CommunityPostDetailResponseDto,
  CommunityPostFeedItemDto,
  CommunityPostFeedResponseDto,
} from './dto/community-post-response.dto';

const postInclude = {
  community: {
    select: {
      id: true,
      name: true,
      handle: true,
      avatarImage: true,
      _count: {
        select: { members: true },
      },
    },
  },
  author: {
    select: { id: true, firstName: true, lastName: true, imageUrl: true },
  },
  images: { orderBy: { sortOrder: 'asc' as const } },
  skills: {
    include: {
      skill: {
        select: {
          name: true,
        },
      },
    },
  },
  repostedFrom: {
    include: {
      community: {
        select: {
          id: true,
          name: true,
          handle: true,
          avatarImage: true,
          _count: {
            select: { members: true },
          },
        },
      },
      author: {
        select: { id: true, firstName: true, lastName: true, imageUrl: true },
      },
      images: { orderBy: { sortOrder: 'asc' as const } },
      skills: {
        include: {
          skill: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  },
};

type PostWithRelations = {
  id: string;
  content: string;
  likeCount: number;
  commentCount: number;
  repostCount: number;
  postKind: 'ORIGINAL' | 'REPOST' | 'QUOTE_REPOST';
  createdAt: Date;
  skills: Array<{
    postId: string;
    skillId: string;
    skill: {
      name: string;
    };
  }>;
  community: {
    id: string;
    name: string;
    handle: string;
    avatarImage: string | null;
    _count: {
      members: number;
    };
  };
  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  };
  images: Array<{ id: string; postId: string; url: string; sortOrder: number }>;
  repostedFrom: {
    id: string;
    content: string;
    likeCount: number;
    commentCount: number;
    repostCount: number;
    createdAt: Date;
    skills: Array<{
      postId: string;
      skillId: string;
      skill: {
        name: string;
      };
    }>;
    community: {
      id: string;
      name: string;
      handle: string;
      avatarImage: string | null;
      _count: {
        members: number;
      };
    };
    author: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      imageUrl: string | null;
    };
    images: Array<{ id: string; postId: string; url: string; sortOrder: number }>;
  } | null;
};

@Injectable()
export class CommunityPostService {
  constructor(
    private readonly communityService: CommunityService,
    private readonly cacheService: CommunityPostCacheService,
    private readonly likeService: CommunityPostLikeService,
    private readonly repostService: CommunityPostRepostService,
    private readonly analyticsService: AnalyticsService,
    private readonly skillsService: SkillsService,
  ) {}

  encodeCursor(createdAt: Date, id: string): string {
    return `${createdAt.toISOString()}::${id}`;
  }

  decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
    const separator = cursor.indexOf('::');
    if (separator <= 0) return null;
    const dateStr = cursor.slice(0, separator);
    const id = cursor.slice(separator + 2);
    const createdAt = new Date(dateStr);
    if (Number.isNaN(createdAt.getTime()) || !id) return null;
    return { createdAt, id };
  }

  encodePersonalizedCursor(score: number, createdAt: Date, id: string): string {
    return `${score}::${createdAt.toISOString()}::${id}`;
  }

  decodePersonalizedCursor(
    cursor: string,
  ): { score: number; createdAt: Date; id: string } | null {
    const parts = cursor.split('::');
    if (parts.length !== 3) return null;
    const score = Number(parts[0]);
    const createdAt = new Date(parts[1]);
    const id = parts[2];
    if (Number.isNaN(score) || Number.isNaN(createdAt.getTime()) || !id)
      return null;
    return { score, createdAt, id };
  }

  async createPost(
    userId: string,
    communityId: string,
    dto: CreateCommunityPostDto,
  ) {
    await this.communityService.checkCommunityWritePermission(
      userId,
      communityId,
    );

    const content = dto.content?.trim() ?? '';
    const hasImages = dto.imageUrls && dto.imageUrls.length > 0;
    if (content.length === 0 && !hasImages) {
      throw new BadRequestException(
        'Post must contain either text content or at least one image.',
      );
    }

    if (dto.skillIds && dto.skillIds.length > 0) {
      if (dto.skillIds.length > 5) {
        throw new BadRequestException(
          'Cannot associate more than 5 skills with a post.',
        );
      }
    }

    const post = await prisma.communityPostEntity.create({
      data: {
        communityId,
        authorId: userId,
        content,
        postKind: 'ORIGINAL',
        skills: {
          create: (dto.skillIds ?? []).map((skillId) => ({
            skillId,
          })),
        },
        images: {
          create: (dto.imageUrls ?? []).map((url, index) => ({
            url: url.trim(),
            sortOrder: index,
          })),
        },
      },
      include: postInclude,
    });

    await this.cacheService.addToTimeline(communityId, post.id, post.createdAt);
    await this.cacheService.invalidateCommunityFeed(communityId);

    if (dto.skillIds && dto.skillIds.length > 0) {
      await this.skillsService.incrementSkillScores(dto.skillIds);
    }

    return this.toFeedItem(post, false, post.likeCount, false);
  }

  async updatePost(
    userId: string,
    communityId: string,
    postId: string,
    dto: UpdateCommunityPostDto,
  ) {
    await this.communityService.checkCommunityWritePermission(
      userId,
      communityId,
    );

    const existing = await prisma.communityPostEntity.findFirst({
      where: {
        id: postId,
        communityId,
        status: 'PUBLISHED',
        postKind: 'ORIGINAL',
      },
      include: {
        images: true,
      },
    });
    if (!existing) {
      throw new NotFoundException('Post not found.');
    }

    const content =
      dto.content !== undefined ? dto.content.trim() : existing.content;
    const hasImages =
      dto.imageUrls !== undefined
        ? dto.imageUrls.length > 0
        : existing.images.length > 0;

    if (content.length === 0 && !hasImages) {
      throw new BadRequestException(
        'Post must contain either text content or at least one image.',
      );
    }

    const post = await prisma.$transaction(async (tx) => {
      if (dto.imageUrls !== undefined) {
        await tx.communityPostImageEntity.deleteMany({ where: { postId } });
        if (dto.imageUrls.length > 0) {
          await tx.communityPostImageEntity.createMany({
            data: dto.imageUrls.map((url, index) => ({
              postId,
              url: url.trim(),
              sortOrder: index,
            })),
          });
        }
      }

      return tx.communityPostEntity.update({
        where: { id: postId },
        data: { content },
        include: postInclude,
      });
    });

    await this.cacheService.invalidateCommunityFeed(communityId);
    await this.cacheService.invalidatePost(postId);

    const likeCount = await this.likeService.getDisplayLikeCount(
      postId,
      post.likeCount,
    );
    return this.toFeedItem(post, false, likeCount, false);
  }

  async deletePost(userId: string, communityId: string, postId: string) {
    await this.communityService.checkCommunityWritePermission(
      userId,
      communityId,
    );

    const existing = await prisma.communityPostEntity.findFirst({
      where: { id: postId, communityId, status: 'PUBLISHED' },
    });
    if (!existing) {
      throw new NotFoundException('Post not found.');
    }

    await prisma.communityPostEntity.update({
      where: { id: postId },
      data: { status: 'DELETED' },
    });

    if (existing.postKind === 'ORIGINAL') {
      await this.cacheService.removeFromTimeline(communityId, postId);
      await this.cacheService.invalidateCommunityFeed(communityId);
    }
    await this.cacheService.invalidatePost(postId);

    return { success: true };
  }

  async getPublicPostById(
    handle: string,
    postId: string,
    viewerUserId?: string,
  ): Promise<CommunityPostDetailResponseDto> {
    const normalizedHandle = handle.toLowerCase();
    const cached =
      await this.cacheService.getPost<CommunityPostDetailResponseDto>(postId);

    if (cached) {
      if (cached.community.handle !== normalizedHandle) {
        throw new NotFoundException('Post not found.');
      }
      await this.analyticsService.trackPostView(postId);
      if (viewerUserId) {
        const result = await this.attachViewerFlags(cached, viewerUserId);
        await this.analyticsService.trackServedPosts(viewerUserId, [cached.id]);
        return result;
      }
      return cached;
    }

    const post = await prisma.communityPostEntity.findFirst({
      where: {
        id: postId,
        status: 'PUBLISHED',
        postKind: 'ORIGINAL',
        community: { handle: normalizedHandle },
      },
      include: postInclude,
    });
    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    await this.analyticsService.trackPostView(postId);

    const baseItem = await this.hydrateFeedItem(post);
    await this.cacheService.setPost(postId, baseItem);

    if (viewerUserId) {
      const result = await this.attachViewerFlags(baseItem, viewerUserId);
      await this.analyticsService.trackServedPosts(viewerUserId, [baseItem.id]);
      return result;
    }
    return baseItem;
  }

  async listPublicFeed(
    handle: string,
    cursor?: string,
    take = 10,
    viewerUserId?: string,
  ): Promise<CommunityPostFeedResponseDto> {
    const community = await prisma.communityEntity.findUnique({
      where: { handle: handle.toLowerCase() },
      select: { id: true },
    });
    if (!community) {
      throw new NotFoundException('Community not found.');
    }

    const cacheCursor = cursor ?? 'start';
    const cached =
      await this.cacheService.getFeedPage<CommunityPostFeedResponseDto>(
        community.id,
        cacheCursor,
        take,
      );
    if (cached) {
      if (viewerUserId) {
        const result = {
          ...cached,
          items: await this.attachViewerFlagsToItems(
            cached.items,
            viewerUserId,
          ),
        };
        const postIds = result.items.map((item) => item.id);
        await this.analyticsService.trackServedPosts(viewerUserId, postIds);
        return result;
      }
      return cached;
    }

    const posts = await this.fetchCommunityFeedPosts(
      community.id,
      cursor,
      take + 1,
    );
    const hasMore = posts.length > take;
    const pagePosts = hasMore ? posts.slice(0, take) : posts;

    const items = await Promise.all(
      pagePosts.map((post) => this.hydrateFeedItem(post)),
    );

    const lastPost = pagePosts[pagePosts.length - 1];
    const nextCursor =
      hasMore && lastPost
        ? this.encodeCursor(lastPost.createdAt, lastPost.id)
        : null;

    const response: CommunityPostFeedResponseDto = {
      items,
      nextCursor,
      hasMore,
    };

    await this.cacheService.setFeedPage(
      community.id,
      cacheCursor,
      take,
      response,
    );

    if (viewerUserId) {
      const result = {
        ...response,
        items: await this.attachViewerFlagsToItems(
          response.items,
          viewerUserId,
        ),
      };
      const postIds = result.items.map((item) => item.id);
      await this.analyticsService.trackServedPosts(viewerUserId, postIds);
      return result;
    }

    return response;
  }

  async listGlobalPublicFeed(
    cursor?: string,
    take = 20,
    viewerUserId?: string,
  ): Promise<CommunityPostFeedResponseDto> {
    let usePersonalized = false;
    let userInteractions: any = [];

    if (viewerUserId) {
      userInteractions = await prisma.communityPostUserInteraction.groupBy({
        by: ['skillId'],
        where: { userId: viewerUserId },
        _sum: { score: true },
      });
      if (userInteractions.length > 0) {
        usePersonalized = true;
      }
    }

    if (!usePersonalized) {
      let fallbackCursor = cursor;
      if (cursor && cursor.split('::').length === 3) {
        const decodedPersonalized = this.decodePersonalizedCursor(cursor);
        if (decodedPersonalized) {
          fallbackCursor = this.encodeCursor(
            decodedPersonalized.createdAt,
            decodedPersonalized.id,
          );
        }
      }

      const posts = await this.fetchGlobalFeedPosts(fallbackCursor, take + 1);
      const hasMore = posts.length > take;
      const pagePosts = hasMore ? posts.slice(0, take) : posts;

      const items = await Promise.all(
        pagePosts.map((post) => this.hydrateFeedItem(post, viewerUserId)),
      );

      const lastPost = pagePosts[pagePosts.length - 1];
      const nextCursor =
        hasMore && lastPost
          ? this.encodeCursor(lastPost.createdAt, lastPost.id)
          : null;

      const result = { items, nextCursor, hasMore };
      if (viewerUserId) {
        const postIds = result.items.map((item) => item.id);
        await this.analyticsService.trackServedPosts(viewerUserId, postIds);
      }

      return result;
    }

    // Personalized Feed path
    let decodedCursor: { score: number; createdAt: Date; id: string } | null =
      null;
    if (cursor) {
      decodedCursor = this.decodePersonalizedCursor(cursor);
      if (!decodedCursor) {
        const decodedDefault = this.decodeCursor(cursor);
        if (decodedDefault) {
          decodedCursor = {
            score: 0,
            createdAt: decodedDefault.createdAt,
            id: decodedDefault.id,
          };
        }
      }
    }

    const limit = take + 1;
    const scoresJson = JSON.stringify(
      userInteractions.map((ui) => ({
        skillId: ui.skillId,
        score: ui._sum.score ?? 0,
      })),
    );

    let cursorFilterSql = Prisma.empty;
    if (decodedCursor) {
      cursorFilterSql = Prisma.sql`
        AND (score, "createdAt", id) < (${decodedCursor.score}, ${decodedCursor.createdAt}, ${decodedCursor.id})
      `;
    }

    interface RawPostScore {
      id: string;
      createdAt: Date;
      score: number;
    }

    const rawResults = await prisma.$queryRaw<RawPostScore[]>`
      WITH post_scores AS (
        SELECT 
          p.id, 
          p.created_at AS "createdAt", 
          COALESCE(SUM(s.score), 0)::int AS score
        FROM community.community_post p
        LEFT JOIN community.community_post_skill ps ON ps.post_id = p.id
        LEFT JOIN (
          SELECT (elem->>'skillId')::text AS skill_id, (elem->>'score')::int AS score
          FROM jsonb_array_elements(${scoresJson}::jsonb) elem
        ) s ON ps.skill_id = s.skill_id
        WHERE p.status = 'PUBLISHED' AND p.post_kind = 'ORIGINAL'
        GROUP BY p.id, p.created_at
      )
      SELECT id, "createdAt", score
      FROM post_scores
      WHERE 1=1
      ${cursorFilterSql}
      ORDER BY score DESC, "createdAt" DESC, id DESC
      LIMIT ${limit};
    `;

    const hasMore = rawResults.length > take;
    const pageResults = hasMore ? rawResults.slice(0, take) : rawResults;
    const postIds = pageResults.map((r) => r.id);

    const posts = await prisma.communityPostEntity.findMany({
      where: { id: { in: postIds } },
      include: postInclude,
    });

    const postsMap = new Map(posts.map((p) => [p.id, p]));
    const orderedPosts = postIds
      .map((id) => postsMap.get(id))
      .filter((p) => p !== undefined) as PostWithRelations[];

    const items = await Promise.all(
      orderedPosts.map((post) => this.hydrateFeedItem(post, viewerUserId)),
    );

    const lastResult = pageResults[pageResults.length - 1];
    const nextCursor =
      hasMore && lastResult
        ? this.encodePersonalizedCursor(
            lastResult.score,
            lastResult.createdAt,
            lastResult.id,
          )
        : null;

    const result = { items, nextCursor, hasMore };
    if (viewerUserId) {
      const servedIds = result.items.map((item) => item.id);
      await this.analyticsService.trackServedPosts(viewerUserId, servedIds);
    }

    return result;
  }

  async listUserFeed(
    handle: string,
    userId: string,
    cursor?: string,
    take = 10,
    viewerUserId?: string,
  ): Promise<CommunityPostFeedResponseDto> {
    const community = await prisma.communityEntity.findUnique({
      where: { handle: handle.toLowerCase() },
      select: { id: true },
    });
    if (!community) {
      throw new NotFoundException('Community not found.');
    }

    const posts = await this.fetchUserFeedPosts(
      userId,
      community.id,
      cursor,
      take + 1,
    );
    const hasMore = posts.length > take;
    const pagePosts = hasMore ? posts.slice(0, take) : posts;

    const items = await Promise.all(
      pagePosts.map((post) => this.hydrateFeedItem(post, viewerUserId)),
    );

    const lastPost = pagePosts[pagePosts.length - 1];
    const nextCursor =
      hasMore && lastPost
        ? this.encodeCursor(lastPost.createdAt, lastPost.id)
        : null;

    const result = { items, nextCursor, hasMore };
    if (viewerUserId) {
      const postIds = result.items.map((item) => item.id);
      await this.analyticsService.trackServedPosts(viewerUserId, postIds);
    }

    return result;
  }

  private async fetchGlobalFeedPosts(
    cursor: string | undefined,
    limit: number,
  ): Promise<PostWithRelations[]> {
    const decoded = cursor ? this.decodeCursor(cursor) : null;

    const where: Prisma.CommunityPostEntityWhereInput = {
      status: 'PUBLISHED',
      postKind: 'ORIGINAL',
    };

    if (decoded) {
      where.OR = [
        { createdAt: decoded.createdAt, id: { lt: decoded.id } },
        { createdAt: { lt: decoded.createdAt } },
      ];
    }

    return prisma.communityPostEntity.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      include: postInclude,
    });
  }

  private async fetchCommunityFeedPosts(
    communityId: string,
    cursor: string | undefined,
    limit: number,
  ): Promise<PostWithRelations[]> {
    const decoded = cursor ? this.decodeCursor(cursor) : null;

    const where: {
      communityId: string;
      status: 'PUBLISHED';
      postKind: 'ORIGINAL';
      OR?: Array<
        { createdAt: Date; id: { lt: string } } | { createdAt: { lt: Date } }
      >;
    } = {
      communityId,
      status: 'PUBLISHED',
      postKind: 'ORIGINAL',
    };

    if (decoded) {
      where.OR = [
        { createdAt: decoded.createdAt, id: { lt: decoded.id } },
        { createdAt: { lt: decoded.createdAt } },
      ];
    }

    const posts = await prisma.communityPostEntity.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      include: postInclude,
    });

    if (!cursor && posts.length > 0) {
      await this.cacheService.hydrateTimeline(
        communityId,
        posts.map((p) => ({ id: p.id, createdAt: p.createdAt })),
      );
    }

    return posts;
  }

  private async fetchUserFeedPosts(
    userId: string,
    communityId: string,
    cursor: string | undefined,
    limit: number,
  ): Promise<PostWithRelations[]> {
    const decoded = cursor ? this.decodeCursor(cursor) : null;

    const where: {
      authorId: string;
      communityId: string;
      status: 'PUBLISHED';
      OR?: Array<
        { createdAt: Date; id: { lt: string } } | { createdAt: { lt: Date } }
      >;
    } = {
      authorId: userId,
      communityId,
      status: 'PUBLISHED',
    };

    if (decoded) {
      where.OR = [
        { createdAt: decoded.createdAt, id: { lt: decoded.id } },
        { createdAt: { lt: decoded.createdAt } },
      ];
    }

    return prisma.communityPostEntity.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      include: postInclude,
    });
  }

  private async attachViewerFlagsToItems<T extends CommunityPostFeedItemDto>(
    items: T[],
    viewerUserId: string,
  ): Promise<T[]> {
    if (items.length === 0) {
      return items;
    }

    const postIds = items.map((item) => item.id);
    const likedMap = await this.likeService.batchIsLiked(postIds, viewerUserId);

    const originalPostIds = items
      .filter((item) => item.postKind === 'ORIGINAL')
      .map((item) => item.id);
    const repostedMap =
      originalPostIds.length > 0
        ? await this.repostService.batchIsReposted(
            originalPostIds,
            viewerUserId,
          )
        : {};

    return items.map((item) => ({
      ...item,
      isLikedByMe: likedMap[item.id] ?? false,
      ...(item.postKind === 'ORIGINAL'
        ? { isRepostedByMe: repostedMap[item.id] ?? false }
        : {}),
    }));
  }

  private async attachViewerFlags(
    item: CommunityPostDetailResponseDto,
    viewerUserId: string,
  ): Promise<CommunityPostDetailResponseDto> {
    const [withFlags] = await this.attachViewerFlagsToItems(
      [item],
      viewerUserId,
    );
    return withFlags;
  }

  private async hydrateFeedItem(
    post: PostWithRelations,
    viewerUserId?: string,
  ) {
    const likeCount = await this.likeService.getDisplayLikeCount(
      post.id,
      post.likeCount,
    );

    if (viewerUserId) {
      return this.attachViewerFlags(
        this.toFeedItem(post, undefined, likeCount, undefined),
        viewerUserId,
      );
    }

    return this.toFeedItem(post, undefined, likeCount, undefined);
  }

  private toFeedItem(
    post: PostWithRelations,
    isLikedByMe: boolean | undefined,
    likeCount: number,
    isRepostedByMe: boolean | undefined,
  ) {
    return {
      id: post.id,
      content: post.content,
      images: post.images.map((img) => img.url),
      likeCount,
      commentCount: post.commentCount,
      repostCount: post.repostCount,
      postKind: post.postKind,
      skills: post.skills.map((s) => s.skill.name),
      ...(post.repostedFrom
        ? {
            repostedFrom: {
              id: post.repostedFrom.id,
              content: post.repostedFrom.content,
              images: post.repostedFrom.images.map((img) => img.url),
              likeCount: post.repostedFrom.likeCount,
              commentCount: post.repostedFrom.commentCount,
              repostCount: post.repostedFrom.repostCount,
              createdAt: post.repostedFrom.createdAt,
              author: post.repostedFrom.author,
              community: {
                id: post.repostedFrom.community.id,
                name: post.repostedFrom.community.name,
                handle: post.repostedFrom.community.handle,
                avatarImage: post.repostedFrom.community.avatarImage,
                memberCount: post.repostedFrom.community._count?.members ?? 0,
              },
              skills: post.repostedFrom.skills.map((s) => s.skill.name),
            },
          }
        : {}),
      ...(isLikedByMe !== undefined ? { isLikedByMe } : {}),
      ...(isRepostedByMe !== undefined ? { isRepostedByMe } : {}),
      author: post.author,
      createdAt: post.createdAt,
      community: {
        id: post.community.id,
        name: post.community.name,
        handle: post.community.handle,
        avatarImage: post.community.avatarImage,
        memberCount: post.community._count?.members ?? 0,
      },
    };
  }
}
