import { Module } from '@nestjs/common';
import { CommunityPostController } from './community-post.controller';
import {
  CommunityPostPublicController,
  CommunityPostUserFeedController,
  CommunityPostGlobalFeedController,
} from './community-post-public.controller';
import { CommunityPostService } from './community-post.service';
import { CommunityPostLikeService } from './community-post-like.service';
import { CommunityPostCommentService } from './community-post-comment.service';
import { CommunityPostCommentLikeService } from './community-post-comment-like.service';
import { CommunityPostRepostService } from './community-post-repost.service';
import { CommunityPostCacheService } from './community-post-cache.service';
import { CommunityPostUserInteractionService } from './community-post-user-interaction.service';
import { CommunityModule } from '../community.module';
import { AnalyticsModule } from '../../analytics/analytics.module';
import { SkillsModule } from '../../skills/skills.module';

@Module({
  imports: [CommunityModule, AnalyticsModule, SkillsModule],
  controllers: [
    CommunityPostPublicController,
    CommunityPostUserFeedController,
    CommunityPostGlobalFeedController,
    CommunityPostController,
  ],
  providers: [
    CommunityPostService,
    CommunityPostLikeService,
    CommunityPostCommentService,
    CommunityPostCommentLikeService,
    CommunityPostRepostService,
    CommunityPostCacheService,
    CommunityPostUserInteractionService,
  ],
  exports: [CommunityPostService, CommunityPostUserInteractionService],
})
export class CommunityPostModule {}
