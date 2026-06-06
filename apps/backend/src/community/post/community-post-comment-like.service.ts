import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@oppskills/db';

@Injectable()
export class CommunityPostCommentLikeService {
  async toggleLike(
    commentId: string,
    userId: string,
  ): Promise<{ liked: boolean; likeCount: number }> {
    const comment = await prisma.communityPostCommentEntity.findFirst({
      where: { id: commentId, status: 'PUBLISHED' },
      select: { id: true, likeCount: true },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found.');
    }

    return this.toggleLikeDb(commentId, userId, comment.likeCount);
  }

  private async toggleLikeDb(
    commentId: string,
    userId: string,
    currentCount: number,
  ): Promise<{ liked: boolean; likeCount: number }> {
    const existing = await prisma.communityPostCommentLikeEntity.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });

    if (existing) {
      const updated = await prisma.$transaction(async (tx) => {
        await tx.communityPostCommentLikeEntity.delete({
          where: { commentId_userId: { commentId, userId } },
        });
        return tx.communityPostCommentEntity.update({
          where: { id: commentId },
          data: { likeCount: { decrement: 1 } },
          select: { likeCount: true },
        });
      });
      return {
        liked: false,
        likeCount: Math.max(0, updated.likeCount),
      };
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.communityPostCommentLikeEntity.create({
        data: { commentId, userId },
      });
      return tx.communityPostCommentEntity.update({
        where: { id: commentId },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      });
    });

    return { liked: true, likeCount: updated.likeCount };
  }

  async batchIsLiked(
    commentIds: string[],
    userId: string,
  ): Promise<Record<string, boolean>> {
    const result: Record<string, boolean> = {};
    if (commentIds.length === 0) return result;

    const likes = await prisma.communityPostCommentLikeEntity.findMany({
      where: { commentId: { in: commentIds }, userId },
      select: { commentId: true },
    });
    const likedSet = new Set(likes.map((l) => l.commentId));
    for (const id of commentIds) {
      result[id] = likedSet.has(id);
    }
    return result;
  }

  async getDisplayLikeCount(
    _commentId: string,
    dbLikeCount: number,
  ): Promise<number> {
    return dbLikeCount;
  }
}
