import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ClerkAuthGuard } from '../../common/clerk-auth.guard';
import { RateLimit } from '../../common/rate-limit/rate-limit.decorator';
import { CommunityPostService } from './community-post.service';
import { CommunityPostLikeService } from './community-post-like.service';
import { CommunityPostCommentService } from './community-post-comment.service';
import { CommunityPostCommentLikeService } from './community-post-comment-like.service';
import { CommunityPostRepostService } from './community-post-repost.service';
import {
  CreateCommunityPostDto,
  UpdateCommunityPostDto,
} from './dto/create-community-post.dto';
import {
  CreateCommunityPostCommentDto,
  CreateCommunityPostRepostDto,
} from './dto/create-community-post-comment.dto';
import {
  CommunityPostFeedItemDto,
  ToggleCommunityPostLikeResponseDto,
} from './dto/community-post-response.dto';
import {
  CommunityPostCommentItemDto,
  CreateCommunityPostRepostResponseDto,
  ToggleCommunityPostCommentLikeResponseDto,
  UndoCommunityPostRepostResponseDto,
} from './dto/community-post-comment-response.dto';

@ApiTags('Community Posts')
@ApiBearerAuth('clerk-auth')
@Controller('communities/:communityId/posts')
@UseGuards(ClerkAuthGuard)
export class CommunityPostController {
  constructor(
    private readonly postService: CommunityPostService,
    private readonly likeService: CommunityPostLikeService,
    private readonly commentService: CommunityPostCommentService,
    private readonly commentLikeService: CommunityPostCommentLikeService,
    private readonly repostService: CommunityPostRepostService,
  ) {}

  private getUserId(req: Request): string {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    return userId;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ limit: 30, windowMs: 60_000, keyPrefix: 'community-post' })
  @ApiOperation({ summary: 'Create a community post' })
  @ApiBody({ type: CreateCommunityPostDto })
  @ApiResponse({ status: 201, type: CommunityPostFeedItemDto })
  async createPost(
    @Param('communityId') communityId: string,
    @Body() dto: CreateCommunityPostDto,
    @Req() req: Request,
  ) {
    return this.postService.createPost(this.getUserId(req), communityId, dto);
  }

  @Patch(':postId')
  @ApiOperation({ summary: 'Update a community post' })
  @ApiBody({ type: UpdateCommunityPostDto })
  @ApiResponse({ status: 200, type: CommunityPostFeedItemDto })
  async updatePost(
    @Param('communityId') communityId: string,
    @Param('postId') postId: string,
    @Body() dto: UpdateCommunityPostDto,
    @Req() req: Request,
  ) {
    return this.postService.updatePost(
      this.getUserId(req),
      communityId,
      postId,
      dto,
    );
  }

  @Delete(':postId')
  @ApiOperation({ summary: 'Delete a community post (soft delete)' })
  @ApiResponse({ status: 200 })
  async deletePost(
    @Param('communityId') communityId: string,
    @Param('postId') postId: string,
    @Req() req: Request,
  ) {
    return this.postService.deletePost(
      this.getUserId(req),
      communityId,
      postId,
    );
  }

  @Post(':postId/like')
  @RateLimit({ limit: 30, windowMs: 60_000, keyPrefix: 'community-like' })
  @ApiOperation({ summary: 'Toggle like on a community post' })
  @ApiResponse({ status: 200, type: ToggleCommunityPostLikeResponseDto })
  async toggleLike(
    @Param('postId') postId: string,
    @Req() req: Request,
  ): Promise<ToggleCommunityPostLikeResponseDto> {
    return this.likeService.toggleLike(postId, this.getUserId(req));
  }

  @Post(':postId/comments')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ limit: 30, windowMs: 60_000, keyPrefix: 'community-comment' })
  @ApiOperation({ summary: 'Create a comment or reply on a post' })
  @ApiBody({ type: CreateCommunityPostCommentDto })
  @ApiResponse({ status: 201, type: CommunityPostCommentItemDto })
  async createComment(
    @Param('communityId') communityId: string,
    @Param('postId') postId: string,
    @Body() dto: CreateCommunityPostCommentDto,
    @Req() req: Request,
  ) {
    return this.commentService.createComment(
      this.getUserId(req),
      communityId,
      postId,
      dto,
    );
  }

  @Delete(':postId/comments/:commentId')
  @ApiOperation({ summary: 'Delete a comment (soft delete)' })
  @ApiResponse({ status: 200 })
  async deleteComment(
    @Param('communityId') communityId: string,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Req() req: Request,
  ) {
    return this.commentService.deleteComment(
      this.getUserId(req),
      communityId,
      postId,
      commentId,
    );
  }

  @Post(':postId/comments/:commentId/like')
  @RateLimit({
    limit: 30,
    windowMs: 60_000,
    keyPrefix: 'community-comment-like',
  })
  @ApiOperation({ summary: 'Toggle like on a comment' })
  @ApiResponse({ status: 200, type: ToggleCommunityPostCommentLikeResponseDto })
  async toggleCommentLike(
    @Param('commentId') commentId: string,
    @Req() req: Request,
  ): Promise<ToggleCommunityPostCommentLikeResponseDto> {
    return this.commentLikeService.toggleLike(commentId, this.getUserId(req));
  }

  @Post(':postId/repost')
  @HttpCode(HttpStatus.CREATED)
  @RateLimit({ limit: 20, windowMs: 60_000, keyPrefix: 'community-repost' })
  @ApiOperation({ summary: 'Repost a post (direct or with caption)' })
  @ApiBody({ type: CreateCommunityPostRepostDto })
  @ApiResponse({ status: 201, type: CreateCommunityPostRepostResponseDto })
  async createRepost(
    @Param('communityId') communityId: string,
    @Param('postId') postId: string,
    @Body() dto: CreateCommunityPostRepostDto,
    @Req() req: Request,
  ) {
    return this.repostService.createRepost(
      this.getUserId(req),
      communityId,
      postId,
      dto,
    );
  }

  @Delete(':postId/repost')
  @ApiOperation({ summary: 'Undo a repost' })
  @ApiResponse({ status: 200, type: UndoCommunityPostRepostResponseDto })
  async undoRepost(
    @Param('communityId') communityId: string,
    @Param('postId') postId: string,
    @Req() req: Request,
  ) {
    return this.repostService.undoRepost(
      this.getUserId(req),
      communityId,
      postId,
    );
  }
}
