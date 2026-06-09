import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { ChatGateway } from './chat.gateway';
import {
  AckDeliveredDto,
  CreateDirectConversationDto,
  CreateGroupConversationDto,
  SendChatMessageDto,
  UpdateGroupConversationDto,
} from './dto/chat.dto';
import { ChatAttachmentsService } from './services/chat-attachments.service';
import { ChatSearchService } from './services/chat-search.service';
import { ConversationsService } from './services/conversations.service';
import { GroupsService } from './services/groups.service';
import { MessagesService } from './services/messages.service';

@ApiTags('Chats')
@ApiBearerAuth('clerk-auth')
@Controller('chats')
@UseGuards(ClerkAuthGuard)
export class ChatController {
  constructor(
    private readonly conversations: ConversationsService,
    private readonly messages: MessagesService,
    private readonly groups: GroupsService,
    private readonly chatSearch: ChatSearchService,
    private readonly attachments: ChatAttachmentsService,
    private readonly chatGateway: ChatGateway,
  ) {}

  private userId(req: Request): string {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException();
    }
    return userId;
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List inbox conversations (cursor paginated)' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'cursor', required: false })
  listConversations(
    @Req() req: Request,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.conversations.listConversations(
      this.userId(req),
      limit,
      cursor,
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Search conversations then platform users' })
  search(@Req() req: Request, @Query('q') q?: string) {
    return this.chatSearch.search(
      this.userId(req),
      typeof q === 'string' ? q : '',
    );
  }

  @Get('users/search')
  @ApiOperation({ summary: 'Search users to add to a group (all members)' })
  searchUsersForGroup(@Req() req: Request, @Query('q') q?: string) {
    return this.chatSearch.searchUsersForGroup(
      this.userId(req),
      typeof q === 'string' ? q : '',
    );
  }

  @Post('conversations/direct')
  @ApiOperation({ summary: 'Get or create a direct conversation' })
  createDirect(@Req() req: Request, @Body() dto: CreateDirectConversationDto) {
    return this.conversations.getOrCreateDirect(
      this.userId(req),
      dto.otherUserId,
    );
  }

  @Post('conversations/group')
  @ApiOperation({ summary: 'Create a group conversation' })
  createGroup(@Req() req: Request, @Body() dto: CreateGroupConversationDto) {
    return this.groups.createGroup(this.userId(req), {
      name: dto.name,
      handle: dto.handle,
      memberIds: dto.memberIds,
    });
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation metadata' })
  getConversation(@Req() req: Request, @Param('id') id: string) {
    return this.conversations.getConversation(this.userId(req), id);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({
    summary: 'List messages (cursor: before=older, after=newer)',
  })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'before', required: false })
  @ApiQuery({ name: 'after', required: false })
  listMessages(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
    @Query('before') before?: string,
    @Query('after') after?: string,
  ) {
    return this.messages.listMessages(
      this.userId(req),
      id,
      limit,
      before,
      after,
    );
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message (REST fallback)' })
  sendMessage(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: SendChatMessageDto,
  ) {
    return this.messages.sendMessage(this.userId(req), id, dto);
  }

  @Post('conversations/:id/read')
  @ApiOperation({ summary: 'Mark conversation as read' })
  markRead(@Req() req: Request, @Param('id') id: string) {
    return this.conversations.markRead(this.userId(req), id);
  }

  @Post('conversations/:id/delivered')
  @ApiOperation({ summary: 'Acknowledge message delivery' })
  ackDelivered(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: AckDeliveredDto,
  ) {
    return this.messages.ackDelivered(this.userId(req), id, dto.messageIds);
  }

  @Get('conversations/:conversationId/messages/:messageId/attachment')
  @ApiOperation({
    summary:
      'Stream a message attachment (auth required; not a public CDN URL)',
  })
  @ApiQuery({
    name: 'disposition',
    required: false,
    enum: ['inline', 'attachment'],
  })
  async streamMessageAttachment(
    @Req() req: Request,
    @Res() res: Response,
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Query('disposition', new DefaultValuePipe('attachment'))
    disposition: 'inline' | 'attachment',
  ) {
    const file = await this.attachments.openMessageAttachment(
      this.userId(req),
      conversationId,
      messageId,
    );

    const safeName = file.fileName.replace(/[^\w.\-() ]+/g, '_') || 'download';
    const disp = disposition === 'inline' ? 'inline' : 'attachment';

    res.setHeader('Content-Type', file.contentType);
    res.setHeader(
      'Content-Disposition',
      `${disp}; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    );
    res.setHeader('Cache-Control', 'private, no-store');

    file.stream.on('error', () => {
      if (!res.headersSent) {
        res.status(500).end();
      }
    });
    file.stream.pipe(res);
  }

  @Get('conversations/:id/attachments')
  @ApiOperation({ summary: 'List shared media or documents' })
  @ApiQuery({ name: 'tab', enum: ['media', 'documents'] })
  listAttachments(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('tab', new DefaultValuePipe('media')) tab: 'media' | 'documents',
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.attachments.listAttachments(
      this.userId(req),
      id,
      tab,
      limit,
      cursor,
    );
  }

  @Get('conversations/:id/member/:userId')
  @ApiOperation({ summary: 'Member profile for chat sidebar' })
  getMember(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('userId') memberUserId: string,
  ) {
    return this.attachments.getMemberProfile(
      this.userId(req),
      id,
      memberUserId,
    );
  }

  @Patch('conversations/:id')
  @ApiOperation({ summary: 'Update group profile (admin only)' })
  async updateGroup(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateGroupConversationDto,
  ) {
    const detail = await this.groups.updateGroupImage(
      this.userId(req),
      id,
      dto.imageUrl,
    );
    await this.chatGateway.broadcastConversationUpdated(id);
    return detail;
  }

  @Delete('conversations/:id/members/:userId')
  @ApiOperation({ summary: 'Remove a member from a group (admin only)' })
  async removeMember(
    @Req() req: Request,
    @Param('id') id: string,
    @Param('userId') memberUserId: string,
  ) {
    const detail = await this.groups.removeGroupMember(
      this.userId(req),
      id,
      memberUserId,
    );
    await this.chatGateway.broadcastConversationUpdated(id);
    await this.chatGateway.broadcastConversationRemoved(id, [memberUserId]);
    return detail;
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Delete/hide chat from your inbox (DM or group)' })
  async deleteChat(@Req() req: Request, @Param('id') id: string) {
    const userId = this.userId(req);
    await this.conversations.deleteChatForUser(userId, id);
    await this.chatGateway.broadcastConversationRemoved(id, [userId]);
    return { ok: true };
  }

  @Post('conversations/:id/leave')
  @ApiOperation({ summary: 'Leave a group' })
  async leaveGroup(@Req() req: Request, @Param('id') id: string) {
    const userId = this.userId(req);
    await this.conversations.leaveGroup(userId, id);
    await this.chatGateway.broadcastConversationUpdated(id);
    await this.chatGateway.broadcastConversationRemoved(id, [userId]);
    return { ok: true };
  }

  @Delete('conversations/:id/group')
  @ApiOperation({ summary: 'Delete group for everyone (admin only)' })
  async deleteGroup(@Req() req: Request, @Param('id') id: string) {
    const userIds = await this.groups.deleteGroup(this.userId(req), id);
    await this.chatGateway.broadcastConversationRemoved(id, userIds);
    return { ok: true };
  }
}
