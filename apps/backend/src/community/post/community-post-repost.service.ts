import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@oppskills/db';
import type { CreateCommunityPostRepostDto } from './dto/create-community-post-comment.dto';
import { CommunityPostCacheService } from './community-post-cache.service';
import { CommunityPostUserInteractionService } from './community-post-user-interaction.service';

@Injectable()
export class CommunityPostRepostService {
  constructor(
    private readonly postCacheService: CommunityPostCacheService,
    private readonly interactionService: CommunityPostUserInteractionService,
  ) {}
  async createRepost(
    userId: string,
    communityId: string,
    originalPostId: string,
    dto: CreateCommunityPostRepostDto,
  ) {
    const original = await prisma.communityPostEntity.findFirst({
      where: {
        id: originalPostId,
        communityId,
        status: 'PUBLISHED',
        postKind: 'ORIGINAL',
      },
      select: { id: true, communityId: true, repostCount: true },
    });
    if (!original) {
      throw new NotFoundException('Post not found.');
    }

    const caption = dto.caption?.trim() ?? '';
    const isQuote = caption.length > 0;

    const existing = await prisma.communityPostRepostEntity.findUnique({
      where: {
        userId_originalPostId: { userId, originalPostId },
      },
    });
    if (existing) {
      throw new ConflictException('You have already reposted this post.');
    }

    const result = await prisma.$transaction(async (tx) => {
      const repostPost = await tx.communityPostEntity.create({
        data: {
          communityId: original.communityId,
          authorId: userId,
          content: isQuote ? caption : '',
          postKind: isQuote ? 'QUOTE_REPOST' : 'REPOST',
          repostedFromPostId: originalPostId,
        },
      });

      await tx.communityPostRepostEntity.create({
        data: {
          userId,
          originalPostId,
          repostPostId: repostPost.id,
        },
      });

      const updated = await tx.communityPostEntity.update({
        where: { id: originalPostId },
        data: { repostCount: { increment: 1 } },
        select: { repostCount: true },
      });

      return { repostPostId: repostPost.id, repostCount: updated.repostCount };
    });

    await this.postCacheService.invalidatePost(originalPostId);
    await this.postCacheService.invalidateCommunityFeed(communityId);

    this.interactionService.recordInteraction(originalPostId, userId, 'REPOST');

    return result;
  }

  async undoRepost(
    userId: string,
    communityId: string,
    originalPostId: string,
  ) {
    const original = await prisma.communityPostEntity.findFirst({
      where: {
        id: originalPostId,
        communityId,
        status: 'PUBLISHED',
        postKind: 'ORIGINAL',
      },
      select: { id: true, repostCount: true },
    });
    if (!original) {
      throw new NotFoundException('Post not found.');
    }

    const repostRecord = await prisma.communityPostRepostEntity.findUnique({
      where: {
        userId_originalPostId: { userId, originalPostId },
      },
    });
    if (!repostRecord) {
      throw new NotFoundException('Repost not found.');
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.communityPostEntity.update({
        where: { id: repostRecord.repostPostId },
        data: { status: 'DELETED' },
      });
      await tx.communityPostRepostEntity.delete({
        where: { id: repostRecord.id },
      });
      const updated = await tx.communityPostEntity.update({
        where: { id: originalPostId },
        data: { repostCount: { decrement: 1 } },
        select: { repostCount: true },
      });
      return { success: true, repostCount: Math.max(0, updated.repostCount) };
    });

    await this.postCacheService.invalidatePost(originalPostId);
    await this.postCacheService.invalidatePost(repostRecord.repostPostId);
    await this.postCacheService.invalidateCommunityFeed(communityId);

    return result;
  }

  async batchIsReposted(
    postIds: string[],
    userId: string,
  ): Promise<Record<string, boolean>> {
    const result: Record<string, boolean> = {};
    if (postIds.length === 0) return result;

    const reposts = await prisma.communityPostRepostEntity.findMany({
      where: { userId, originalPostId: { in: postIds } },
      select: { originalPostId: true },
    });
    const repostedSet = new Set(reposts.map((r) => r.originalPostId));
    for (const id of postIds) {
      result[id] = repostedSet.has(id);
    }
    return result;
  }
}
