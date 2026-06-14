import { Injectable } from '@nestjs/common';
import { prisma } from '@oppskills/db';
import { Logger } from 'src/_utils/logger';

@Injectable()
export class CommunityPostUserInteractionService {
  private readonly logger = new Logger(
    CommunityPostUserInteractionService.name,
  );

  private getScore(
    type: 'LIKE' | 'SHARE' | 'COMMENT' | 'SAVE' | 'REPOST',
  ): number {
    switch (type) {
      case 'LIKE':
        return 5;
      case 'SHARE':
        return 8;
      case 'COMMENT':
        return 3;
      case 'SAVE':
        return 10;
      case 'REPOST':
        return 15;
      default:
        return 1;
    }
  }

  recordInteraction(
    postId: string,
    userId: string,
    type: 'LIKE' | 'SHARE' | 'COMMENT' | 'SAVE' | 'REPOST',
  ): void {
    // Run asynchronously without awaiting so the caller doesn't block
    this.runRecordInteraction(postId, userId, type).catch((err) => {
      this.logger.error(
        `Failed to record post interaction [${type}] for user ${userId} on post ${postId}`,
        err,
      );
    });
  }

  private async runRecordInteraction(
    postId: string,
    userId: string,
    type: 'LIKE' | 'SHARE' | 'COMMENT' | 'SAVE' | 'REPOST',
  ): Promise<void> {
    this.logger.info(
      `Recording post interaction [${type}] for user ${userId} on post ${postId}`,
    );

    const post = await prisma.communityPostEntity.findUnique({
      where: { id: postId },
      select: {
        skills: {
          select: {
            skillId: true,
          },
        },
      },
    });

    if (!post) {
      this.logger.warn(`Post ${postId} not found, cannot record interaction.`);
      return;
    }

    if (!post.skills || post.skills.length === 0) {
      this.logger.info(
        `No skills found for post ${postId}, skipping interaction recording.`,
      );
      return;
    }

    const score = this.getScore(type);

    const result = await prisma.communityPostUserInteraction.createMany({
      data: post.skills.map((s) => ({
        postId,
        userId,
        skillId: s.skillId,
        interactionType: type,
        score,
      })),
      skipDuplicates: true,
    });

    this.logger.info(
      `Successfully recorded interaction [${type}] (score ${score}) for user ${userId} across ${result.count} new skills on post ${postId} (attempted ${post.skills.length})`,
    );
  }
}
