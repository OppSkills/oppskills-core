import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@oppskills/db';
import { CommunityService } from '../community.service';
import { CommunityPostCacheService } from './community-post-cache.service';
import { CommunityPostCommentLikeService } from './community-post-comment-like.service';
import type { CreateCommunityPostCommentDto } from './dto/create-community-post-comment.dto';
import type { CommunityPostCommentListResponseDto } from './dto/community-post-comment-response.dto';

type CommentWithAuthor = {
  id: string;
  postId: string;
  parentId: string | null;
  content: string;
  likeCount: number;
  replyCount: number;
  createdAt: Date;
  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  };
};

@Injectable()
export class CommunityPostCommentService {
  constructor(
    private readonly communityService: CommunityService,
    private readonly commentLikeService: CommunityPostCommentLikeService,
    private readonly cacheService: CommunityPostCacheService,
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

  private async resolvePublishedPost(postId: string, handle: string) {
    const post = await prisma.communityPostEntity.findFirst({
      where: {
        id: postId,
        status: 'PUBLISHED',
        postKind: 'ORIGINAL',
        community: { handle: handle.toLowerCase() },
      },
      select: { id: true, communityId: true },
    });
    if (!post) {
      throw new NotFoundException('Post not found.');
    }
    return post;
  }

  async listTopLevelComments(
    handle: string,
    postId: string,
    cursor?: string,
    take = 20,
    viewerUserId?: string,
  ): Promise<CommunityPostCommentListResponseDto> {
    await this.resolvePublishedPost(postId, handle);

    const decoded = cursor ? this.decodeCursor(cursor) : null;
    const where: {
      postId: string;
      parentId: null;
      status: 'PUBLISHED';
      OR?: Array<
        { createdAt: Date; id: { lt: string } } | { createdAt: { lt: Date } }
      >;
    } = {
      postId,
      parentId: null,
      status: 'PUBLISHED',
    };

    if (decoded) {
      where.OR = [
        { createdAt: decoded.createdAt, id: { lt: decoded.id } },
        { createdAt: { lt: decoded.createdAt } },
      ];
    }

    const comments = await prisma.communityPostCommentEntity.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
      },
    });

    return this.buildCommentListResponse(comments, take, viewerUserId);
  }

  async listReplies(
    handle: string,
    postId: string,
    commentId: string,
    cursor?: string,
    take = 5,
    viewerUserId?: string,
  ): Promise<CommunityPostCommentListResponseDto> {
    await this.resolvePublishedPost(postId, handle);

    const parent = await prisma.communityPostCommentEntity.findFirst({
      where: {
        id: commentId,
        postId,
        parentId: null,
        status: 'PUBLISHED',
      },
      select: { id: true },
    });
    if (!parent) {
      throw new NotFoundException('Comment not found.');
    }

    const decoded = cursor ? this.decodeCursor(cursor) : null;
    const where: {
      postId: string;
      parentId: string;
      status: 'PUBLISHED';
      OR?: Array<
        { createdAt: Date; id: { gt: string } } | { createdAt: { gt: Date } }
      >;
    } = {
      postId,
      parentId: commentId,
      status: 'PUBLISHED',
    };

    if (decoded) {
      where.OR = [
        { createdAt: decoded.createdAt, id: { gt: decoded.id } },
        { createdAt: { gt: decoded.createdAt } },
      ];
    }

    const comments = await prisma.communityPostCommentEntity.findMany({
      where,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: take + 1,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
      },
    });

    return this.buildCommentListResponse(comments, take, viewerUserId);
  }

  private async buildCommentListResponse(
    comments: CommentWithAuthor[],
    take: number,
    viewerUserId?: string,
  ): Promise<CommunityPostCommentListResponseDto> {
    const hasMore = comments.length > take;
    const pageComments = hasMore ? comments.slice(0, take) : comments;
    const commentIds = pageComments.map((c) => c.id);
    const likedMap = viewerUserId
      ? await this.commentLikeService.batchIsLiked(commentIds, viewerUserId)
      : {};

    const items = await Promise.all(
      pageComments.map(async (comment) => {
        const likeCount = await this.commentLikeService.getDisplayLikeCount(
          comment.id,
          comment.likeCount,
        );
        return this.toCommentItem(
          comment,
          viewerUserId ? (likedMap[comment.id] ?? false) : undefined,
          likeCount,
        );
      }),
    );

    const last = pageComments[pageComments.length - 1];
    const nextCursor =
      hasMore && last ? this.encodeCursor(last.createdAt, last.id) : null;

    return { items, nextCursor, hasMore };
  }

  async createComment(
    userId: string,
    communityId: string,
    postId: string,
    dto: CreateCommunityPostCommentDto,
  ) {
    const content = dto.content.trim();
    if (content.length === 0) {
      throw new BadRequestException('Comment cannot be empty.');
    }

    const post = await prisma.communityPostEntity.findFirst({
      where: {
        id: postId,
        communityId,
        status: 'PUBLISHED',
        postKind: 'ORIGINAL',
      },
      select: { id: true },
    });
    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    if (dto.parentId) {
      const parent = await prisma.communityPostCommentEntity.findFirst({
        where: {
          id: dto.parentId,
          postId,
          parentId: null,
          status: 'PUBLISHED',
        },
        select: { id: true },
      });
      if (!parent) {
        throw new NotFoundException('Parent comment not found.');
      }
    }

    const comment = await prisma.$transaction(async (tx) => {
      const created = await tx.communityPostCommentEntity.create({
        data: {
          postId,
          authorId: userId,
          parentId: dto.parentId ?? null,
          content,
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
            },
          },
        },
      });

      if (dto.parentId) {
        await tx.communityPostCommentEntity.update({
          where: { id: dto.parentId },
          data: { replyCount: { increment: 1 } },
        });
      }

      await tx.communityPostEntity.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      });

      return created;
    });

    await this.cacheService.invalidatePost(postId);
    await this.cacheService.invalidateCommunityFeed(communityId);

    return this.toCommentItem(comment, false, comment.likeCount);
  }

  async deleteComment(
    userId: string,
    communityId: string,
    postId: string,
    commentId: string,
  ) {
    const comment = await prisma.communityPostCommentEntity.findFirst({
      where: { id: commentId, postId, status: 'PUBLISHED' },
      select: {
        id: true,
        authorId: true,
        parentId: true,
        post: { select: { communityId: true } },
      },
    });
    if (!comment || comment.post.communityId !== communityId) {
      throw new NotFoundException('Comment not found.');
    }

    const isAuthor = comment.authorId === userId;
    if (!isAuthor) {
      try {
        await this.communityService.checkCommunityWritePermission(
          userId,
          communityId,
        );
      } catch {
        throw new ForbiddenException(
          'You do not have permission to delete this comment.',
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.communityPostCommentEntity.update({
        where: { id: commentId },
        data: { status: 'DELETED' },
      });

      if (comment.parentId) {
        await tx.communityPostCommentEntity.update({
          where: { id: comment.parentId },
          data: { replyCount: { decrement: 1 } },
        });
      }

      await tx.communityPostEntity.update({
        where: { id: postId },
        data: { commentCount: { decrement: 1 } },
      });
    });

    await this.cacheService.invalidatePost(postId);
    await this.cacheService.invalidateCommunityFeed(communityId);

    return { success: true };
  }

  private toCommentItem(
    comment: CommentWithAuthor,
    isLikedByMe: boolean | undefined,
    likeCount: number,
  ) {
    return {
      id: comment.id,
      postId: comment.postId,
      parentId: comment.parentId,
      content: comment.content,
      likeCount,
      replyCount: comment.replyCount,
      ...(isLikedByMe !== undefined ? { isLikedByMe } : {}),
      author: comment.author,
      createdAt: comment.createdAt,
    };
  }
}
