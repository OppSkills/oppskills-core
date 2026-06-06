import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, CommunityAccessControlRole } from '@prisma/client';
import { prisma } from '@oppskills/db';
import { CreateCommunityDto } from './dto/create-community.dto';
import { CommunityResponseDto } from './dto/community-response.dto';
import type { CommunityListItemDto } from './dto/community-list-item.dto';
import { AddCommunityMembersDto } from './dto/add-community-members.dto';
import { CommunityEmailQueue } from '../email/queue/community-email.queue';
import type { PublicCommunityListItemDto } from './dto/public-community-list-item.dto';
import type { PublicCommunityProfileDto } from './dto/public-community-profile.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import {
  buildHandleCandidates,
  deriveCommunityHandleFromName,
  isValidCommunityHandle,
  normalizeCommunityHandle,
} from './community-handle.util';

@Injectable()
export class CommunityService {
  constructor(private readonly communityEmailQueue: CommunityEmailQueue) {}

  /**
   * Communities the user can open in the manage dashboard: owned, or member with ADMIN/EDITOR.
   */
  async listMyCommunities(userId: string): Promise<CommunityListItemDto[]> {
    const rows = await prisma.communityEntity.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        handle: true,
        avatarImage: true,
        industry: true,
        ownerId: true,
        createdAt: true,
        members: {
          where: { userId },
          select: { role: true, accessControlRole: true },
        },
      },
    });

    return rows.map((row) => {
      const myRole =
        row.ownerId === userId
          ? ('OWNER' as const)
          : row.members[0]?.accessControlRole === 'ADMIN'
            ? ('ADMIN' as const)
            : row.members[0]?.accessControlRole === 'MODERATOR'
              ? ('MODERATOR' as const)
              : ('READ_ONLY' as const);

      return {
        id: row.id,
        name: row.name,
        handle: row.handle,
        avatarImage: row.avatarImage,
        industry: row.industry,
        myRole,
        createdAt: row.createdAt,
      };
    });
  }

  async getCommunityById(
    userId: string,
    communityId: string,
  ): Promise<CommunityResponseDto> {
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
        'You do not have permission to view this community.',
      );
    }

    return this.toResponseDto(community);
  }

  async create(
    ownerId: string,
    dto: CreateCommunityDto,
  ): Promise<CommunityResponseDto> {
    const website =
      typeof dto.website === 'string' && dto.website.trim().length > 0
        ? dto.website.trim()
        : null;

    try {
      const community = await prisma.$transaction(async (tx) => {
        const created = await tx.communityEntity.create({
          data: {
            name: dto.name.trim(),
            handle: dto.handle.trim().toLowerCase(),
            description: dto.description?.trim() || null,
            website,
            industry: dto.industry,
            coverImage: dto.coverImage?.trim() || null,
            avatarImage: dto.avatarImage?.trim() || null,
            ownerId,
          },
        });

        await tx.communityMemberEntity.create({
          data: {
            communityId: created.id,
            userId: ownerId,
            role: 'OWNER',
            accessControlRole: 'ADMIN',
          },
        });

        return created;
      });

      return this.toResponseDto(community);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target;
          const fields = Array.isArray(target)
            ? target.map((v) => String(v))
            : typeof target === 'string'
              ? [target]
              : [];

          if (fields.some((f) => f.includes('handle'))) {
            throw new ConflictException('Handle already taken');
          }

          throw new ConflictException(
            'A community with this name already exists for your account',
          );
        }
      }

      if (error instanceof Error) {
        throw new InternalServerErrorException(
          `Error creating community: ${error.message}`,
        );
      }

      throw new InternalServerErrorException('Error creating community.');
    }
  }

  async listPublicCommunities(input: {
    page?: number;
    take?: number;
    search?: string;
    industry?: string[];
    sort?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{
    items: PublicCommunityListItemDto[];
    total: number;
    totalPages: number;
    page: number;
  }> {
    const page = Math.max(1, input.page ?? 1);
    const take = Math.min(50, Math.max(1, input.take ?? 10));
    const skip = (page - 1) * take;

    const conditions: Prisma.CommunityEntityWhereInput[] = [];

    if (input.search?.trim()) {
      const q = input.search.trim();
      conditions.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { handle: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    if (input.industry && input.industry.length > 0) {
      conditions.push({
        industry: {
          in: input.industry as PublicCommunityListItemDto['industry'][],
        },
      });
    }

    const where: Prisma.CommunityEntityWhereInput =
      conditions.length > 0 ? { AND: conditions } : {};

    const sort = input.sort ?? 'recently_added';
    const sortOrder = input.sortOrder ?? 'desc';
    let orderBy: Prisma.CommunityEntityOrderByWithRelationInput = {
      createdAt: sortOrder,
    };
    if (sort === 'name') {
      orderBy = { name: sortOrder };
    }

    const [rows, total] = await Promise.all([
      prisma.communityEntity.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          name: true,
          handle: true,
          description: true,
          industry: true,
          coverImage: true,
          avatarImage: true,
          createdAt: true,
          _count: {
            select: {
              members: true,
              posts: { where: { status: 'PUBLISHED' } },
            },
          },
        },
      }),
      prisma.communityEntity.count({ where }),
    ]);

    const items: PublicCommunityListItemDto[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      handle: row.handle,
      description: row.description,
      industry: row.industry,
      coverImage: row.coverImage,
      avatarImage: row.avatarImage,
      memberCount: row._count.members,
      postCount: row._count.posts,
      createdAt: row.createdAt,
    }));

    return {
      items,
      total,
      totalPages: Math.max(1, Math.ceil(total / take)),
      page,
    };
  }

  async getPublicProfileByHandle(
    handle: string,
    viewerUserId?: string,
  ): Promise<PublicCommunityProfileDto> {
    const community = await prisma.communityEntity.findUnique({
      where: { handle: handle.toLowerCase() },
      include: {
        ...(viewerUserId
          ? {
              members: {
                where: { userId: viewerUserId },
                select: { accessControlRole: true },
              },
            }
          : {}),
        _count: {
          select: {
            members: true,
            posts: { where: { status: 'PUBLISHED' } },
          },
        },
      },
    });

    if (!community) {
      throw new NotFoundException('Community not found.');
    }

    let myRole: PublicCommunityProfileDto['myRole'] = null;
    if (viewerUserId) {
      if (community.ownerId === viewerUserId) {
        myRole = 'OWNER';
      } else if (
        'members' in community &&
        Array.isArray(community.members) &&
        community.members.length > 0
      ) {
        myRole = community.members[0]
          .accessControlRole as PublicCommunityProfileDto['myRole'];
      }
    }

    return {
      id: community.id,
      name: community.name,
      handle: community.handle,
      description: community.description,
      website: community.website,
      industry: community.industry,
      coverImage: community.coverImage,
      avatarImage: community.avatarImage,
      memberCount: community._count.members,
      postCount: community._count.posts,
      createdAt: community.createdAt,
      myRole,
    };
  }

  async updateCommunity(
    userId: string,
    communityId: string,
    dto: UpdateCommunityDto,
  ): Promise<CommunityResponseDto> {
    await this.checkCommunityWritePermission(userId, communityId);

    const data: Prisma.CommunityEntityUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      data.description = dto.description.trim() || null;
    }
    if (dto.website !== undefined) {
      data.website =
        typeof dto.website === 'string' && dto.website.trim().length > 0
          ? dto.website.trim()
          : null;
    }
    if (dto.coverImage !== undefined) {
      data.coverImage = dto.coverImage.trim() || null;
    }
    if (dto.avatarImage !== undefined) {
      data.avatarImage = dto.avatarImage.trim() || null;
    }

    try {
      const community = await prisma.communityEntity.update({
        where: { id: communityId },
        data,
      });
      return this.toResponseDto(community);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'A community with this name already exists for your account',
          );
        }
      }
      throw error;
    }
  }

  private toResponseDto(community: {
    id: string;
    name: string;
    handle: string;
    description: string | null;
    website: string | null;
    industry: CommunityResponseDto['industry'];
    coverImage: string | null;
    avatarImage: string | null;
    ownerId: string;
    createdAt: Date;
  }): CommunityResponseDto {
    return {
      id: community.id,
      name: community.name,
      handle: community.handle,
      description: community.description,
      website: community.website,
      industry: community.industry,
      coverImage: community.coverImage,
      avatarImage: community.avatarImage,
      ownerId: community.ownerId,
      createdAt: community.createdAt,
    };
  }

  async checkCommunityManagementPermission(
    userId: string,
    communityId: string,
  ) {
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
        'You do not have permission to manage this community.',
      );
    }
    return community;
  }

  async checkCommunityReadPermission(userId: string, communityId: string) {
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
        'You do not have permission to view this community.',
      );
    }
    return community;
  }

  async checkCommunityWritePermission(userId: string, communityId: string) {
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
    const myMemberRecord = community.members[0];
    const isWriteEligible =
      isOwner ||
      (myMemberRecord &&
        ['ADMIN', 'MODERATOR'].includes(myMemberRecord.accessControlRole));

    if (!isWriteEligible) {
      throw new ForbiddenException(
        'You do not have permission to modify data in this community.',
      );
    }
    return community;
  }

  async checkCommunityAdminPermission(userId: string, communityId: string) {
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
    const myMemberRecord = community.members[0];
    const isAdmin = myMemberRecord?.accessControlRole === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to perform administrative actions in this community.',
      );
    }
    return community;
  }

  async listMembers(currentUserId: string, communityId: string) {
    // 1. Fetch community details and verify read permission
    const community = await prisma.communityEntity.findUnique({
      where: { id: communityId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
            createdAt: true,
            onboardingProfile: {
              include: {
                college: {
                  select: {
                    name: true,
                    city: true,
                    state: true,
                    country: true,
                  },
                },
              },
            },
          },
        },
        members: {
          where: { userId: currentUserId },
        },
      },
    });

    if (!community) {
      throw new NotFoundException('Community not found.');
    }

    const isOwner = community.ownerId === currentUserId;
    const isMember = community.members.length > 0;

    if (!isOwner && !isMember) {
      throw new ForbiddenException(
        'You do not have permission to view this community.',
      );
    }

    // 2. Fetch all members
    const members = await prisma.communityMemberEntity.findMany({
      where: { communityId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
            createdAt: true,
            onboardingProfile: {
              include: {
                college: {
                  select: {
                    name: true,
                    city: true,
                    state: true,
                    country: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const mapProfileDetails = (user: any, memberCreatedAt: Date) => {
      const profile = user.onboardingProfile;
      let university = 'Not Specified';
      if (profile) {
        if (profile.college) {
          university = profile.college.name;
        } else if (profile.schoolName) {
          university = profile.schoolName;
        } else if (profile.companyName) {
          university = profile.companyName;
        }
      }

      let location = 'Not Specified';
      if (profile) {
        const parts = [
          profile.locationCoords ||
            (profile.college ? profile.college.city : null),
          profile.locationState ||
            (profile.college ? profile.college.state : null),
          profile.locationCountry ||
            (profile.college ? profile.college.country : null),
        ].filter(Boolean);
        if (parts.length > 0) {
          location = parts.join(', ');
        }
      }

      const tags: string[] = [];
      if (profile) {
        const categoryLabels: Record<string, string> = {
          SCHOOL_STUDENT: 'School Student',
          COLLEGE_STUDENT: 'College Student',
          WORKING_PROFESSIONAL: 'Working Professional',
          FRESHER: 'Fresher',
          PROFESSIONAL_SCHOOL_STUDENT: 'Professional School Student',
        };
        if (profile.userCategory && categoryLabels[profile.userCategory]) {
          tags.push(categoryLabels[profile.userCategory]);
        }
        if (profile.course) {
          let courseStr = profile.course;
          if (profile.courseSpecialization) {
            courseStr += ` (${profile.courseSpecialization})`;
          }
          tags.push(courseStr);
        }
        if (profile.collegeCurrentYear) {
          tags.push(`${profile.collegeCurrentYear} Year`);
        } else if (profile.jobTitle) {
          tags.push(profile.jobTitle);
        }
        if (profile.skills && profile.skills.length > 0) {
          tags.push(...profile.skills.slice(0, 2));
        }
      }
      if (tags.length === 0) {
        tags.push('Member');
      }

      const regDate = user.createdAt || memberCreatedAt;
      const registeredDate =
        regDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }) +
        ', ' +
        regDate.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

      return { university, location, tags, registeredDate };
    };

    // 3. Map members list, and ensure the community owner record has role: 'OWNER' and accessControlRole: 'ADMIN'
    const mappedMembers = members.map((m) => {
      const displayName =
        [m.user.firstName, m.user.lastName].filter(Boolean).join(' ') ||
        m.user.email.split('@')[0];
      const isMemberOwner = m.userId === community.ownerId;
      const profileInfo = mapProfileDetails(m.user, m.createdAt);
      return {
        id: m.id,
        userId: m.user.id,
        name: displayName,
        email: m.user.email,
        role: isMemberOwner ? 'OWNER' : m.role,
        accessControlRole: isMemberOwner ? 'ADMIN' : m.accessControlRole,
        avatarUrl: m.user.imageUrl || '/avatars/user.png',
        lastAssignedDate: m.createdAt
          .toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
          .replace(/\//g, '-'),
        ...profileInfo,
      };
    });

    // 4. If the owner is somehow not in the members list (e.g. for legacy communities), we can add the owner manually
    const hasOwnerInMembers = mappedMembers.some(
      (m) => m.userId === community.ownerId,
    );
    if (!hasOwnerInMembers && community.owner) {
      const ownerDisplayName =
        [community.owner.firstName, community.owner.lastName]
          .filter(Boolean)
          .join(' ') || community.owner.email.split('@')[0];
      const ownerProfileInfo = mapProfileDetails(
        community.owner,
        community.createdAt,
      );
      mappedMembers.unshift({
        id: `owner-${community.owner.id}`,
        userId: community.owner.id,
        name: ownerDisplayName,
        email: community.owner.email,
        role: 'OWNER',
        accessControlRole: 'ADMIN',
        avatarUrl: community.owner.imageUrl || '/avatars/user.png',
        lastAssignedDate: community.createdAt
          .toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
          .replace(/\//g, '-'),
        ...ownerProfileInfo,
      });
    }

    return mappedMembers;
  }

  async addMembersToCommunity(
    currentUserId: string,
    communityId: string,
    dto: AddCommunityMembersDto,
  ) {
    const community = await this.checkCommunityWritePermission(
      currentUserId,
      communityId,
    );

    const requesterMember = community.members[0];
    const isOwner = community.ownerId === currentUserId;
    const isAdmin = requesterMember?.accessControlRole === 'ADMIN';

    if (!isOwner && !isAdmin) {
      if (dto.accessControlRole && dto.accessControlRole !== 'READ_ONLY') {
        throw new ForbiddenException(
          'Moderators can only add members with READ_ONLY access.',
        );
      }
    }

    if (dto.userIds.includes(currentUserId)) {
      throw new BadRequestException(
        'You cannot add your own user ID to the community members.',
      );
    }

    // Verify all user IDs exist in database
    const users = await prisma.userEntity.findMany({
      where: { id: { in: dto.userIds } },
      select: { id: true },
    });
    const foundUserIds = users.map((u) => u.id);
    const invalidUserIds = dto.userIds.filter(
      (id) => !foundUserIds.includes(id),
    );
    if (invalidUserIds.length > 0) {
      throw new NotFoundException(
        `The following user IDs do not exist: ${invalidUserIds.join(', ')}`,
      );
    }

    // Check if any of these users are already members
    const existingMembers = await prisma.communityMemberEntity.findMany({
      where: {
        communityId,
        userId: { in: dto.userIds },
      },
      select: { userId: true },
    });
    const existingUserIds = existingMembers.map((m) => m.userId);
    if (existingUserIds.length > 0) {
      throw new ConflictException(
        `The following users are already members of this community: ${existingUserIds.join(', ')}`,
      );
    }

    // Bulk add members
    await prisma.communityMemberEntity.createMany({
      data: dto.userIds.map((uid) => ({
        communityId,
        userId: uid,
        role: dto.role,
        accessControlRole: dto.accessControlRole,
      })),
    });

    // Queue welcome emails in chunks of 100 to avoid resource/rate limiting issues
    const BATCH_SIZE = 100;
    for (let i = 0; i < dto.userIds.length; i += BATCH_SIZE) {
      const batch = dto.userIds.slice(i, i + BATCH_SIZE);
      await this.communityEmailQueue.addCommunityWelcomeBatch(
        communityId,
        batch,
      );
    }

    return { success: true, count: dto.userIds.length };
  }

  async getUniqueMemberTypes(
    currentUserId: string,
    communityId: string,
  ): Promise<string[]> {
    await this.checkCommunityReadPermission(currentUserId, communityId);

    const uniqueRoles = await prisma.communityMemberEntity.findMany({
      where: { communityId },
      select: { role: true },
      distinct: ['role'],
    });

    return uniqueRoles.map((r) => r.role);
  }

  async updateMemberType(
    currentUserId: string,
    communityId: string,
    memberId: string,
    role: string,
  ) {
    const community = await this.checkCommunityWritePermission(
      currentUserId,
      communityId,
    );

    const member = await prisma.communityMemberEntity.findFirst({
      where: { id: memberId, communityId },
    });
    if (!member) {
      throw new NotFoundException('Community member not found.');
    }

    const requesterMember = community.members[0];
    const isOwner = community.ownerId === currentUserId;
    const isAdmin = requesterMember?.accessControlRole === 'ADMIN';

    // Moderators cannot modify admins or other moderators
    if (!isOwner && !isAdmin) {
      if (
        member.accessControlRole === 'ADMIN' ||
        member.accessControlRole === 'MODERATOR'
      ) {
        throw new ForbiddenException(
          'Moderators cannot modify roles of admins or other moderators.',
        );
      }
    }

    // Admin cannot change role (type) of other admin
    if (member.accessControlRole === 'ADMIN') {
      if (!isOwner) {
        throw new ForbiddenException('Admins cannot modify other admins.');
      }
    }

    return prisma.communityMemberEntity.update({
      where: { id: memberId },
      data: { role },
    });
  }

  async updateMemberAccess(
    currentUserId: string,
    communityId: string,
    memberId: string,
    accessControlRole: CommunityAccessControlRole,
  ) {
    const community = await this.checkCommunityAdminPermission(
      currentUserId,
      communityId,
    );

    const member = await prisma.communityMemberEntity.findFirst({
      where: { id: memberId, communityId },
    });
    if (!member) {
      throw new NotFoundException('Community member not found.');
    }

    // Check if target member is owner
    if (member.userId === community.ownerId) {
      throw new BadRequestException(
        'The access control role of the owner cannot be changed.',
      );
    }

    // Admin cannot demote/change role of other admin
    if (member.accessControlRole === 'ADMIN') {
      const isOwner = community.ownerId === currentUserId;
      if (!isOwner) {
        throw new ForbiddenException('Admins cannot modify other admins.');
      }
    }

    return prisma.communityMemberEntity.update({
      where: { id: memberId },
      data: { accessControlRole },
    });
  }

  async deleteMember(
    currentUserId: string,
    communityId: string,
    memberId: string,
  ) {
    const community = await this.checkCommunityWritePermission(
      currentUserId,
      communityId,
    );

    const member = await prisma.communityMemberEntity.findFirst({
      where: { id: memberId, communityId },
    });
    if (!member) {
      throw new NotFoundException('Community member not found.');
    }

    // Check if target member is owner
    if (member.userId === community.ownerId) {
      throw new BadRequestException('The community owner cannot be removed.');
    }

    const requesterMember = community.members[0];
    const isOwner = community.ownerId === currentUserId;
    const isAdmin = requesterMember?.accessControlRole === 'ADMIN';

    // Moderators cannot remove admins or other moderators
    if (!isOwner && !isAdmin) {
      if (
        member.accessControlRole === 'ADMIN' ||
        member.accessControlRole === 'MODERATOR'
      ) {
        throw new ForbiddenException(
          'Moderators cannot remove admins or other moderators.',
        );
      }
    }

    // Admin cannot delete/remove other admin
    if (member.accessControlRole === 'ADMIN') {
      if (!isOwner) {
        throw new ForbiddenException('Admins cannot remove other admins.');
      }
    }

    return prisma.communityMemberEntity.delete({
      where: { id: memberId },
    });
  }

  async isHandleAvailable(handle: string): Promise<boolean> {
    const normalized = normalizeCommunityHandle(handle);
    if (!isValidCommunityHandle(normalized)) {
      return false;
    }

    const existing = await prisma.communityEntity.findUnique({
      where: { handle: normalized },
      select: { id: true },
    });
    return !existing;
  }

  async suggestHandles(name: string, limit = 5): Promise<string[]> {
    const base = deriveCommunityHandleFromName(name);
    const candidates = buildHandleCandidates(base);
    if (candidates.length === 0) return [];

    const taken = await prisma.communityEntity.findMany({
      where: { handle: { in: candidates } },
      select: { handle: true },
    });
    const takenSet = new Set(taken.map((row) => row.handle));

    return candidates.filter((handle) => !takenSet.has(handle)).slice(0, limit);
  }

  async followCommunity(
    userId: string,
    communityId: string,
  ): Promise<{ following: boolean; memberCount: number }> {
    const community = await prisma.communityEntity.findUnique({
      where: { id: communityId },
      select: { id: true, ownerId: true },
    });
    if (!community) {
      throw new NotFoundException('Community not found.');
    }

    if (community.ownerId === userId) {
      const memberCount = await prisma.communityMemberEntity.count({
        where: { communityId },
      });
      return { following: true, memberCount };
    }

    const existing = await prisma.communityMemberEntity.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });
    if (existing) {
      const memberCount = await prisma.communityMemberEntity.count({
        where: { communityId },
      });
      return { following: true, memberCount };
    }

    await prisma.communityMemberEntity.create({
      data: {
        communityId,
        userId,
        role: 'MEMBER',
        accessControlRole: 'READ_ONLY',
      },
    });

    const memberCount = await prisma.communityMemberEntity.count({
      where: { communityId },
    });
    return { following: true, memberCount };
  }

  async unfollowCommunity(
    userId: string,
    communityId: string,
  ): Promise<{ following: boolean; memberCount: number }> {
    const community = await prisma.communityEntity.findUnique({
      where: { id: communityId },
      select: { id: true, ownerId: true },
    });
    if (!community) {
      throw new NotFoundException('Community not found.');
    }

    if (community.ownerId === userId) {
      throw new BadRequestException('Community owners cannot unfollow their community.');
    }

    const member = await prisma.communityMemberEntity.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });
    if (!member) {
      const memberCount = await prisma.communityMemberEntity.count({
        where: { communityId },
      });
      return { following: false, memberCount };
    }

    if (member.accessControlRole !== 'READ_ONLY') {
      throw new ForbiddenException(
        'You cannot unfollow a community where you have a management role.',
      );
    }

    await prisma.communityMemberEntity.delete({
      where: { communityId_userId: { communityId, userId } },
    });

    const memberCount = await prisma.communityMemberEntity.count({
      where: { communityId },
    });
    return { following: false, memberCount };
  }
}
