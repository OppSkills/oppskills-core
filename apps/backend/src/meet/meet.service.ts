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
import { CreateCommunityMeetDto } from './dto/create-community-meet.dto';

type MeetRow = Awaited<
  ReturnType<typeof prisma.communityMeetEntity.findUniqueOrThrow>
> & {
  host: { id: string; firstName: string | null; lastName: string | null };
  community: { id: string; name: string; ownerId: string };
};

@Injectable()
export class MeetService {
  constructor(private readonly config: ConfigService) {}

  private getMeetBaseUrl(): string {
    return (
      this.config.get<string>('MEET_BASE_URL')?.trim() ||
      'http://localhost:3003'
    ).replace(/\/+$/g, '');
  }

  private getLivekitConfig(): { apiKey: string; apiSecret: string; url: string } {
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
    const isManager =
      community.members.length > 0 &&
      ['ADMIN', 'EDITOR'].includes(community.members[0].role);

    if (!isOwner && !isManager) {
      throw new ForbiddenException(
        'You do not have permission to manage meets for this community.',
      );
    }
  }

  private async assertCanJoinMeet(
    _userId: string,
    meet: MeetRow,
  ): Promise<void> {
    if (meet.status === 'ENDED') {
      throw new BadRequestException('This meeting has ended.');
    }

    if (meet.audienceScope === 'MEMBER_TYPES') {
      throw new ForbiddenException(
        'This meeting is restricted to specific member types (not yet supported).',
      );
    }
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
      hostUserId: meet.hostUserId,
      hostName: this.formatHostName(meet.host),
      status: meet.status,
      meetUrl: `${this.getMeetBaseUrl()}/${meet.inviteCode}`,
      createdAt: meet.createdAt.toISOString(),
    };
  }

  async createMeet(
    userId: string,
    communityId: string,
    dto: CreateCommunityMeetDto,
  ): Promise<CommunityMeetResponse> {
    await this.assertCanManageCommunity(userId, communityId);

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

    const meet = await prisma.communityMeetEntity.create({
      data: {
        communityId,
        inviteCode,
        kind: dto.kind,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        scheduledStartAt,
        audienceScope: dto.audienceScope ?? 'ALL',
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

  async listMeets(
    userId: string,
    communityId: string,
  ): Promise<CommunityMeetResponse[]> {
    await this.assertCanManageCommunity(userId, communityId);

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
      communityName: meet.community.name,
      hostName: this.formatHostName(meet.host),
      hostUserId: meet.hostUserId,
      audienceScope: meet.audienceScope,
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
