import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { prisma } from '@oppskills/db';
import type {
  CommunityMeetResponse,
  MeetJoinTokenResponse,
  MeetPreviewResponse,
} from '@oppskills/types';
import { AccessToken, VideoGrant } from 'livekit-server-sdk';
import { randomBytes } from 'crypto';
import {
  buildCommunityAudienceWhere,
  COMMUNITY_NOTIFICATION_ROSTER,
} from '../notification/community-audience.util';
import { CreateCommunityMeetDto } from './dto/create-community-meet.dto';

type MeetRow = Awaited<
  ReturnType<typeof prisma.communityMeetEntity.findUniqueOrThrow>
> & {
  host: { id: string; firstName: string | null; lastName: string | null };
  community: { id: string; name: string; ownerId: string } | null;
};

@Injectable()
export class MeetService {
  constructor(private readonly config: ConfigService) {}

  private getMeetBaseUrl(): string {
    const configured = this.config.get<string>('MEET_BASE_URL')?.trim();
    const fallback =
      process.env.NODE_ENV === 'production'
        ? 'https://meet.oppskills.com'
        : 'http://localhost:3003';
    return (configured || fallback).replace(/\/+$/g, '');
  }

  private getLivekitConfig(): {
    apiKey: string;
    apiSecret: string;
    url: string;
  } {
    const apiKey = this.config.get<string>('LIVEKIT_API_KEY')?.trim();
    const apiSecret = this.config.get<string>('LIVEKIT_API_SECRET')?.trim();
    const url = this.config.get<string>('LIVEKIT_URL')?.trim();

    if (!apiKey || !apiSecret || !url) {
      throw new InternalServerErrorException(
        'LiveKit is not configured. Set LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_URL.',
      );
    }

    return { apiKey, apiSecret, url };
  }

  private formatHostName(host: {
    firstName: string | null;
    lastName: string | null;
  }): string {
    const parts = [host.firstName, host.lastName].filter(
      (part): part is string =>
        typeof part === 'string' && part.trim().length > 0,
    );
    return parts.length > 0 ? parts.join(' ') : 'Host';
  }

  private async nextInviteCode(): Promise<string> {
    const candidates = Array.from({ length: 5 }, () =>
      randomBytes(6).toString('base64url'),
    );
    const availability = await Promise.all(
      candidates.map(async (code) => ({
        code,
        exists: !!(await prisma.communityMeetEntity.findUnique({
          where: { inviteCode: code },
        })),
      })),
    );
    const available = availability.find((r) => !r.exists);
    if (available) return available.code;
    throw new BadRequestException('Failed to generate meet invite code');
  }

  private async assertCanManageCommunity(
    userId: string,
    communityId: string,
  ): Promise<void> {
    const community = await prisma.communityEntity.findUnique({
      where: { id: communityId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!community) {
      throw new NotFoundException('Community not found.');
    }

    const isOwner = community.ownerId === userId;
    const member = community.members[0];
    const isManager =
      member && ['ADMIN', 'MODERATOR'].includes(member.accessControlRole);

    if (!isOwner && !isManager) {
      throw new ForbiddenException(
        'You do not have permission to manage meets for this community.',
      );
    }
  }

  private async assertCanReadCommunity(
    userId: string,
    communityId: string,
  ): Promise<void> {
    const community = await prisma.communityEntity.findUnique({
      where: { id: communityId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!community) {
      throw new NotFoundException('Community not found.');
    }

    const isOwner = community.ownerId === userId;
    const isMember = community.members.length > 0;

    if (!isOwner && !isMember) {
      throw new ForbiddenException(
        'You do not have permission to view meets for this community.',
      );
    }
  }

  private async assertCanJoinMeet(
    userId: string,
    meet: MeetRow,
  ): Promise<void> {
    if (meet.status === 'ENDED') {
      throw new BadRequestException('This meeting has ended.');
    }

    if (meet.audienceScope === 'ALL' || !meet.communityId) {
      return;
    }

    const community = meet.community;
    if (!community) {
      throw new ForbiddenException('Community not found for this meeting.');
    }

    if (meet.hostUserId === userId || community.ownerId === userId) {
      return;
    }

    const audience =
      meet.audienceFilter?.trim() || COMMUNITY_NOTIFICATION_ROSTER;

    const member = await prisma.communityMemberEntity.findFirst({
      where: {
        ...buildCommunityAudienceWhere(
          meet.communityId,
          community.ownerId,
          audience,
        ),
        userId,
      },
    });

    if (member) {
      return;
    }

    throw new ForbiddenException(
      `You do not have permission to join this meeting. Access is limited to: ${audience}.`,
    );
  }

  private toResponse(meet: MeetRow): CommunityMeetResponse {
    return {
      id: meet.id,
      communityId: meet.communityId,
      inviteCode: meet.inviteCode,
      kind: meet.kind,
      title: meet.title,
      description: meet.description,
      scheduledStartAt: meet.scheduledStartAt?.toISOString() ?? null,
      audienceScope: meet.audienceScope,
      audienceFilter: meet.audienceFilter,
      hostUserId: meet.hostUserId,
      hostName: this.formatHostName(meet.host),
      status: meet.status,
      meetUrl: `${this.getMeetBaseUrl()}/${meet.inviteCode}`,
      createdAt: meet.createdAt.toISOString(),
    };
  }

  private async createMeetRecord(
    userId: string,
    dto: CreateCommunityMeetDto,
    communityId: string | null,
  ): Promise<CommunityMeetResponse> {
    const inviteCode = await this.nextInviteCode();
    const livekitRoomName = `meet-${inviteCode}`;
    const now = new Date();

    let scheduledStartAt: Date | null = null;
    let status: 'ACTIVE' | 'SCHEDULED' = 'ACTIVE';

    if (dto.kind === 'SCHEDULED') {
      if (!dto.scheduledStartAt) {
        throw new BadRequestException(
          'scheduledStartAt is required for scheduled meets.',
        );
      }
      scheduledStartAt = new Date(dto.scheduledStartAt);
      if (Number.isNaN(scheduledStartAt.getTime())) {
        throw new BadRequestException('Invalid scheduledStartAt.');
      }
      status = 'SCHEDULED';
    } else if (dto.kind === 'INSTANT') {
      scheduledStartAt = now;
    }

    const isCommunityMeet = communityId !== null;
    const audienceScope =
      dto.audienceScope ?? (isCommunityMeet ? 'MEMBER_TYPES' : 'ALL');
    const audienceFilter =
      isCommunityMeet && audienceScope === 'MEMBER_TYPES'
        ? dto.audienceFilter?.trim() || COMMUNITY_NOTIFICATION_ROSTER
        : null;

    const meet = await prisma.communityMeetEntity.create({
      data: {
        communityId,
        inviteCode,
        kind: dto.kind,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        scheduledStartAt,
        audienceScope,
        audienceFilter,
        hostUserId: userId,
        livekitRoomName,
        status,
      },
      include: {
        host: {
          select: { id: true, firstName: true, lastName: true },
        },
        community: {
          select: { id: true, name: true, ownerId: true },
        },
      },
    });

    return this.toResponse(meet);
  }

  async createPersonalMeet(
    userId: string,
    dto: CreateCommunityMeetDto,
  ): Promise<CommunityMeetResponse> {
    return this.createMeetRecord(userId, dto, null);
  }

  async createMeet(
    userId: string,
    communityId: string,
    dto: CreateCommunityMeetDto,
  ): Promise<CommunityMeetResponse> {
    await this.assertCanManageCommunity(userId, communityId);
    return this.createMeetRecord(userId, dto, communityId);
  }

  async listMeets(
    userId: string,
    communityId: string,
  ): Promise<CommunityMeetResponse[]> {
    await this.assertCanReadCommunity(userId, communityId);

    const meets = await prisma.communityMeetEntity.findMany({
      where: { communityId },
      orderBy: { createdAt: 'desc' },
      include: {
        host: {
          select: { id: true, firstName: true, lastName: true },
        },
        community: {
          select: { id: true, name: true, ownerId: true },
        },
      },
    });

    return meets.map((meet) => this.toResponse(meet));
  }

  async listHostedMeets(userId: string): Promise<CommunityMeetResponse[]> {
    const meets = await prisma.communityMeetEntity.findMany({
      where: { hostUserId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        host: {
          select: { id: true, firstName: true, lastName: true },
        },
        community: {
          select: { id: true, name: true, ownerId: true },
        },
      },
    });

    return meets.map((meet) => this.toResponse(meet));
  }

  async getMeetPreview(
    userId: string,
    inviteCode: string,
  ): Promise<MeetPreviewResponse> {
    const meet = await this.findMeetByInviteCode(inviteCode);
    await this.assertCanJoinMeet(userId, meet);

    return {
      inviteCode: meet.inviteCode,
      title: meet.title,
      description: meet.description,
      kind: meet.kind,
      status: meet.status,
      scheduledStartAt: meet.scheduledStartAt?.toISOString() ?? null,
      communityName: meet.community?.name ?? null,
      hostName: this.formatHostName(meet.host),
      hostUserId: meet.hostUserId,
      audienceScope: meet.audienceScope,
      audienceFilter: meet.audienceFilter,
    };
  }

  async createJoinToken(
    userId: string,
    inviteCode: string,
  ): Promise<MeetJoinTokenResponse> {
    const meet = await this.findMeetByInviteCode(inviteCode);
    await this.assertCanJoinMeet(userId, meet);

    const user = await prisma.userEntity.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const participantName = this.formatHostName(user);
    const participantIdentity = user.id;
    const { apiKey, apiSecret, url } = this.getLivekitConfig();

    const grant: VideoGrant = {
      roomJoin: true,
      room: meet.livekitRoomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    };

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantIdentity,
      name: participantName,
      ttl: '6h',
    });
    at.addGrant(grant);
    const token = await at.toJwt();

    if (meet.status === 'SCHEDULED') {
      await prisma.communityMeetEntity.update({
        where: { id: meet.id },
        data: { status: 'ACTIVE' },
      });
    }

    return {
      token,
      livekitUrl: url,
      roomName: meet.livekitRoomName,
      participantName,
      participantIdentity,
    };
  }

  private async findMeetByInviteCode(inviteCode: string): Promise<MeetRow> {
    const meet = await prisma.communityMeetEntity.findUnique({
      where: { inviteCode },
      include: {
        host: {
          select: { id: true, firstName: true, lastName: true },
        },
        community: {
          select: { id: true, name: true, ownerId: true },
        },
      },
    });

    if (!meet) {
      throw new NotFoundException('Meeting not found.');
    }

    return meet;
  }
}
