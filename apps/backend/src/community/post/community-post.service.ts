import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@oppskills/db';
import { CommunityService } from '../community.service';
import { CommunityPostCacheService } from './community-post-cache.service';
import { CommunityPostLikeService } from './community-post-like.service';
import { CommunityPostRepostService } from './community-post-repost.service';
import {
  CreateCommunityPostDto,
  UpdateCommunityPostDto,
} from './dto/create-community-post.dto';
import type {
  CommunityPostDetailResponseDto,
  CommunityPostFeedResponseDto,
} from './dto/community-post-response.dto';

const postInclude = {
  community: {
    select: { id: true, name: true, handle: true, avatarImage: true },
  },
  author: {
    select: { id: true, firstName: true, lastName: true, imageUrl: true },
  },
  images: { orderBy: { sortOrder: 'asc' as const } },
  repostedFrom: {
    include: {
      community: {
        select: { id: true, name: true, handle: true, avatarImage: true },
      },
      author: {
        select: { id: true, firstName: true, lastName: true, imageUrl: true },
      },
      images: { orderBy: { sortOrder: 'asc' as const } },
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
  community: {
    id: string;
    name: string;
    handle: string;
    avatarImage: string | null;
  };
  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  };
  images: Array<{ url: string; sortOrder: number }>;
  repostedFrom?: {
    id: string;
    content: string;
    likeCount: number;
    commentCount: number;
    repostCount: number;
    createdAt: Date;
    community: {
      id: string;
      name: string;
      handle: string;
      avatarImage: string | null;
    };
    author: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      imageUrl: string | null;
    };
    images: Array<{ url: string; sortOrder: number }>;
  } | null;
};

@Injectable()
export class CommunityPostService {
  constructor(
    private readonly communityService: CommunityService,
    private readonly cacheService: CommunityPostCacheService,
    private readonly likeService: CommunityPostLikeService,
    private readonly repostService: CommunityPostRepostService,
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

  async createPost(
    userId: string,
    communityId: string,
    dto: CreateCommunityPostDto,
  ) {
    await this.communityService.checkCommunityWritePermission(
      userId,
      communityId,
    );

    const content = dto.content.trim();
    if (content.length === 0) {
      throw new BadRequestException('Post content cannot be empty.');
    }

    const post = await prisma.communityPostEntity.create({
      data: {
        communityId,
        authorId: userId,
        content,
        postKind: 'ORIGINAL',
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
      where: { id: postId, communityId, status: 'PUBLISHED', postKind: 'ORIGINAL' },
    });
    if (!existing) {
      throw new NotFoundException('Post not found.');
    }

    const content =
      dto.content !== undefined ? dto.content.trim() : existing.content;
    if (content.length === 0) {
      throw new BadRequestException('Post content cannot be empty.');
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
    const cached = await this.cacheService.getPost<CommunityPostDetailResponseDto>(
      postId,
    );
    if (cached && !viewerUserId) {
      return cached;
    }

    const post = await prisma.communityPostEntity.findFirst({
      where: {
        id: postId,
        status: 'PUBLISHED',
        postKind: 'ORIGINAL',
        community: { handle: handle.toLowerCase() },
      },
      include: postInclude,
    });
    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    const item = await this.hydrateFeedItem(post, viewerUserId);

    if (!viewerUserId) {
      await this.cacheService.setPost(postId, item);
    }

    return item;
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
    const cached = await this.cacheService.getFeedPage<CommunityPostFeedResponseDto>(
      community.id,
      cacheCursor,
      take,
    );
    if (cached && !viewerUserId) {
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
      pagePosts.map((post) => this.hydrateFeedItem(post, viewerUserId)),
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

    if (!viewerUserId) {
      await this.cacheService.setFeedPage(
        community.id,
        cacheCursor,
        take,
        response,
      );
    }

    return response;
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

    const posts = await this.fetchUserFeedPosts(userId, community.id, cursor, take + 1);
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

    return { items, nextCursor, hasMore };
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
        | { createdAt: Date; id: { lt: string } }
        | { createdAt: { lt: Date } }
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
        | { createdAt: Date; id: { lt: string } }
        | { createdAt: { lt: Date } }
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

  private async hydrateFeedItem(
    post: PostWithRelations,
    viewerUserId?: string,
  ) {
    const likeCount = await this.likeService.getDisplayLikeCount(
      post.id,
      post.likeCount,
    );

    let isLikedByMe: boolean | undefined;
    let isRepostedByMe: boolean | undefined;

    if (viewerUserId) {
      const likedMap = await this.likeService.batchIsLiked([post.id], viewerUserId);
      isLikedByMe = likedMap[post.id] ?? false;

      if (post.postKind === 'ORIGINAL') {
        const repostedMap = await this.repostService.batchIsReposted(
          [post.id],
          viewerUserId,
        );
        isRepostedByMe = repostedMap[post.id] ?? false;
      }
    }

    return this.toFeedItem(
      post,
      isLikedByMe,
      likeCount,
      isRepostedByMe,
    );
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
              community: post.repostedFrom.community,
            },
          }
        : {}),
      ...(isLikedByMe !== undefined ? { isLikedByMe } : {}),
      ...(isRepostedByMe !== undefined ? { isRepostedByMe } : {}),
      author: post.author,
      createdAt: post.createdAt,
      community: post.community,
    };
  }
}
