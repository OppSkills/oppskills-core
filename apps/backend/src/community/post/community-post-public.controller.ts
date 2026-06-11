import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { OptionalAuthService } from '../../common/optional-auth.service';
import { CommunityPostService } from './community-post.service';
import { CommunityPostCommentService } from './community-post-comment.service';
import { CommunityPostFeedQueryDto } from './dto/community-post-feed-query.dto';
import {
  CommunityPostDetailResponseDto,
  CommunityPostFeedResponseDto,
} from './dto/community-post-response.dto';
import { CommunityPostCommentListResponseDto } from './dto/community-post-comment-response.dto';

@ApiTags('Community Posts')
@Controller('communities/public/:handle/posts')
export class CommunityPostPublicController {
  constructor(
    private readonly postService: CommunityPostService,
    private readonly commentService: CommunityPostCommentService,
    private readonly optionalAuth: OptionalAuthService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List public community feed posts' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiResponse({ status: 200, type: CommunityPostFeedResponseDto })
  async listFeed(
    @Param('handle') handle: string,
    @Query() query: CommunityPostFeedQueryDto,
    @Req() req: Request,
  ): Promise<CommunityPostFeedResponseDto> {
    const viewerUserId = await this.optionalAuth.resolveUserId(req);
    return this.postService.listPublicFeed(
      handle,
      query.cursor,
      query.take ?? 10,
      viewerUserId,
    );
  }

  @Get(':postId')
  @ApiOperation({ summary: 'Get a single community post' })
  @ApiResponse({ status: 200, type: CommunityPostDetailResponseDto })
  async getPost(
    @Param('handle') handle: string,
    @Param('postId') postId: string,
    @Req() req: Request,
  ): Promise<CommunityPostDetailResponseDto> {
    const viewerUserId = await this.optionalAuth.resolveUserId(req);
    return this.postService.getPublicPostById(handle, postId, viewerUserId);
  }

  @Get(':postId/comments')
  @ApiOperation({ summary: 'List top-level comments on a post' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiResponse({ status: 200, type: CommunityPostCommentListResponseDto })
  async listComments(
    @Param('handle') handle: string,
    @Param('postId') postId: string,
    @Query() query: CommunityPostFeedQueryDto,
    @Req() req: Request,
  ): Promise<CommunityPostCommentListResponseDto> {
    const viewerUserId = await this.optionalAuth.resolveUserId(req);
    return this.commentService.listTopLevelComments(
      handle,
      postId,
      query.cursor,
      query.take ?? 20,
      viewerUserId,
    );
  }

  @Get(':postId/comments/:commentId/replies')
  @ApiOperation({ summary: 'List replies to a comment' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiResponse({ status: 200, type: CommunityPostCommentListResponseDto })
  async listReplies(
    @Param('handle') handle: string,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Query() query: CommunityPostFeedQueryDto,
    @Req() req: Request,
  ): Promise<CommunityPostCommentListResponseDto> {
    const viewerUserId = await this.optionalAuth.resolveUserId(req);
    return this.commentService.listReplies(
      handle,
      postId,
      commentId,
      query.cursor,
      query.take ?? 5,
      viewerUserId,
    );
  }
}

@ApiTags('Community Posts')
@Controller('communities/public/:handle/users')
export class CommunityPostUserFeedController {
  constructor(
    private readonly postService: CommunityPostService,
    private readonly optionalAuth: OptionalAuthService,
  ) {}

  @Get(':userId/feed')
  @ApiOperation({ summary: 'List a user feed within a community' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiResponse({ status: 200, type: CommunityPostFeedResponseDto })
  async listUserFeed(
    @Param('handle') handle: string,
    @Param('userId') userId: string,
    @Query() query: CommunityPostFeedQueryDto,
    @Req() req: Request,
  ): Promise<CommunityPostFeedResponseDto> {
    const viewerUserId = await this.optionalAuth.resolveUserId(req);
    return this.postService.listUserFeed(
      handle,
      userId,
      query.cursor,
      query.take ?? 10,
      viewerUserId,
    );
  }
}

@ApiTags('Community Posts')
@Controller('communities/public-posts')
export class CommunityPostGlobalFeedController {
  constructor(
    private readonly postService: CommunityPostService,
    private readonly optionalAuth: OptionalAuthService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List mixed/global public community feed posts' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiResponse({ status: 200, type: CommunityPostFeedResponseDto })
  async listGlobalFeed(
    @Query() query: CommunityPostFeedQueryDto,
    @Req() req: Request,
  ): Promise<CommunityPostFeedResponseDto> {
    const viewerUserId = await this.optionalAuth.resolveUserId(req);
    return this.postService.listGlobalPublicFeed(
      query.cursor,
      query.take ?? 20,
      viewerUserId,
    );
  }
}
