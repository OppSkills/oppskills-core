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
import { CommunityStatsResponseDto } from './dto/community-stats-response.dto';
import { Logger } from '../_utils/logger';

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);

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
                accessControlRole: {
                  in: ['ADMIN', 'MODERATOR', 'READ_ONLY'],
                },
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
    const myMemberRecord = community.members[0];
    const isDashboardEligible =
      isOwner ||
      (myMemberRecord &&
        ['ADMIN', 'MODERATOR', 'READ_ONLY'].includes(
          myMemberRecord.accessControlRole,
        ));

    if (!isDashboardEligible) {
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

      this.logger.info({
        action: 'COMMUNITY_CREATED',
        communityId: community.id,
        communitySlug: community.handle,
        userId: ownerId,
      });

      return this.toResponseDto(community);
    } catch (error) {
      this.logger.error({
        action: 'COMMUNITY_CREATION_FAILED',
        userId: ownerId,
        handle: dto.handle,
        error: error instanceof Error ? error.message : String(error),
      });

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
    const myMemberRecord = community.members[0];
    const hasDashboardAccess =
      isOwner ||
      (myMemberRecord &&
        ['ADMIN', 'MODERATOR', 'READ_ONLY'].includes(
          myMemberRecord.accessControlRole,
        ));

    if (!hasDashboardAccess) {
      this.logger.warn({
        action: 'COMMUNITY_PERMISSION_DENIED',
        permissionType: 'MANAGE',
        communityId,
        userId,
      });
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
    const myMemberRecord = community.members[0];
    const isReadEligible =
      isOwner ||
      (myMemberRecord &&
        ['ADMIN', 'MODERATOR', 'READ_ONLY'].includes(
          myMemberRecord.accessControlRole,
        ));

    if (!isReadEligible) {
      this.logger.warn({
        action: 'COMMUNITY_PERMISSION_DENIED',
        permissionType: 'READ',
        communityId,
        userId,
      });
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
      this.logger.warn({
        action: 'COMMUNITY_PERMISSION_DENIED',
        permissionType: 'WRITE',
        communityId,
        userId,
      });
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
      this.logger.warn({
        action: 'COMMUNITY_PERMISSION_DENIED',
        permissionType: 'ADMIN',
        communityId,
        userId,
      });
      throw new ForbiddenException(
        'You do not have permission to perform administrative actions in this community.',
      );
    }
    return community;
  }

  async listMembers(
    currentUserId: string,
    communityId: string,
    query?: {
      page?: number;
      take?: number;
      search?: string;
      role?: string;
      sortDirection?: 'asc' | 'desc';
    },
  ) {
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

    // 2. Fetch all members with pagination and search filters
    const page = query?.page || 1;
    const take = query?.take || 20;
    const search = query?.search;
    const role = query?.role;
    const sortDirection = query?.sortDirection || 'asc';

    const where: Prisma.CommunityMemberEntityWhereInput = {
      communityId,
    };

    if (role && role !== 'All Members') {
      where.role = {
        equals: role,
        mode: 'insensitive',
      };
    }

    if (search) {
      const searchLower = search.toLowerCase();
      where.OR = [
        {
          user: {
            OR: [
              { firstName: { contains: searchLower, mode: 'insensitive' } },
              { lastName: { contains: searchLower, mode: 'insensitive' } },
              { email: { contains: searchLower, mode: 'insensitive' } },
            ],
          },
        },
        {
          role: { contains: searchLower, mode: 'insensitive' },
        },
      ];
    }

    const hasOwnerInMembers = await prisma.communityMemberEntity.count({
      where: { communityId, userId: community.ownerId },
    }).then((c) => c > 0);

    const isOwnerLegacy = !hasOwnerInMembers && community.owner;

    // Determine if the legacy owner matches the active search / role filters
    let legacyOwnerMatches = false;
    let legacyOwnerRecord: any = null;

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

    if (isOwnerLegacy && community.owner) {
      const owner = community.owner;
      const ownerDisplayName =
        [owner.firstName, owner.lastName].filter(Boolean).join(' ') ||
        owner.email.split('@')[0];
      const ownerRole = 'OWNER';

      let matchesSearch = true;
      if (search) {
        const searchLower = search.toLowerCase();
        matchesSearch =
          ownerDisplayName.toLowerCase().includes(searchLower) ||
          owner.email.toLowerCase().includes(searchLower) ||
          ownerRole.toLowerCase().includes(searchLower);
      }

      let matchesRole = true;
      if (role && role !== 'All Members') {
        matchesRole = ownerRole.toLowerCase() === role.toLowerCase();
      }

      if (matchesSearch && matchesRole) {
        legacyOwnerMatches = true;
        const ownerProfileInfo = mapProfileDetails(
          owner,
          community.createdAt,
        );
        legacyOwnerRecord = {
          id: `owner-${owner.id}`,
          userId: owner.id,
          name: ownerDisplayName,
          email: owner.email,
          role: 'OWNER',
          accessControlRole: 'ADMIN',
          avatarUrl: owner.imageUrl || '/avatars/user.png',
          lastAssignedDate: community.createdAt
            .toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
            .replace(/\//g, '-'),
          ...ownerProfileInfo,
        };
      }
    }

    const dbCount = await prisma.communityMemberEntity.count({ where });
    const total = legacyOwnerMatches ? dbCount + 1 : dbCount;

    let skip = (page - 1) * take;
    let dbTake = take;

    if (legacyOwnerMatches) {
      if (page === 1) {
        dbTake = Math.max(0, take - 1);
      } else {
        skip = skip - 1;
      }
    }

    let members: any[] = [];
    if (dbTake > 0) {
      members = await prisma.communityMemberEntity.findMany({
        where,
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
        orderBy: [
          { accessControlRole: 'asc' }, // ADMIN, MODERATOR, READ_ONLY
          {
            user: {
              firstName: sortDirection === 'desc' ? 'desc' : 'asc',
            },
          },
          {
            user: {
              lastName: sortDirection === 'desc' ? 'desc' : 'asc',
            },
          },
        ],
        skip,
        take: dbTake,
      });
    }

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

    if (legacyOwnerMatches && page === 1) {
      mappedMembers.unshift(legacyOwnerRecord);
    }

    return {
      items: mappedMembers,
      total,
      page,
      take,
      totalPages: Math.ceil(total / take),
    };
  }

  async getMemberRecord(userId: string, communityId: string) {
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
          },
        },
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
    const isDashboardEligible =
      isOwner ||
      (myMemberRecord &&
        ['ADMIN', 'MODERATOR', 'READ_ONLY'].includes(
          myMemberRecord.accessControlRole,
        ));

    if (!isDashboardEligible) {
      throw new ForbiddenException(
        'You do not have permission to view this community.',
      );
    }

    let member = community.members[0];
    if (!member && isOwner && community.owner) {
      const owner = community.owner;
      const displayName =
        [owner.firstName, owner.lastName].filter(Boolean).join(' ') ||
        owner.email.split('@')[0];
      return {
        id: `owner-${owner.id}`,
        userId: owner.id,
        name: displayName,
        email: owner.email,
        role: 'OWNER',
        accessControlRole: 'ADMIN',
        avatarUrl: owner.imageUrl || '/avatars/user.png',
        lastAssignedDate: community.createdAt
          .toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
          .replace(/\//g, '-'),
      };
    }

    if (!member) {
      throw new NotFoundException('Member record not found.');
    }

    const fullMember = await prisma.communityMemberEntity.findUnique({
      where: { id: member.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!fullMember) {
      throw new NotFoundException('Member record not found.');
    }

    const displayName =
      [fullMember.user.firstName, fullMember.user.lastName]
        .filter(Boolean)
        .join(' ') || fullMember.user.email.split('@')[0];

    return {
      id: fullMember.id,
      userId: fullMember.userId,
      name: displayName,
      email: fullMember.user.email,
      role: isOwner ? 'OWNER' : fullMember.role,
      accessControlRole: isOwner ? 'ADMIN' : fullMember.accessControlRole,
      avatarUrl: fullMember.user.imageUrl || '/avatars/user.png',
      lastAssignedDate: fullMember.createdAt
        .toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
        .replace(/\//g, '-'),
    };
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
      if (
        dto.accessControlRole &&
        dto.accessControlRole !== 'READ_ONLY' &&
        dto.accessControlRole !== 'MEMBER'
      ) {
        throw new ForbiddenException(
          'Moderators can only add members with READ_ONLY access.',
        );
      }
    }

    if (dto.userIds.includes(currentUserId)) {
      this.logger.warn({
        action: 'COMMUNITY_ADD_MEMBERS_SELF_FORBIDDEN',
        communityId,
        userId: currentUserId,
      });
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
      this.logger.warn({
        action: 'COMMUNITY_ADD_MEMBERS_NOT_FOUND',
        communityId,
        userId: currentUserId,
        invalidUserIds,
      });
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
      this.logger.warn({
        action: 'COMMUNITY_ADD_MEMBERS_CONFLICT',
        communityId,
        userId: currentUserId,
        existingUserIds,
      });
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

    this.logger.info({
      action: 'COMMUNITY_MEMBERS_BULK_ADDED',
      communityId,
      userId: currentUserId,
      addedUserIds: dto.userIds,
      role: dto.role,
      accessControlRole: dto.accessControlRole,
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

  private validateHierarchyAction(
    currentUserId: string,
    communityOwnerId: string,
    requesterMember: { accessControlRole: string } | undefined | null,
    targetMember: { userId: string; accessControlRole: string },
  ): void {
    const isOwner = communityOwnerId === currentUserId;
    const isTargetOwner = communityOwnerId === targetMember.userId;

    // owner can edit himself and all other
    if (isOwner) {
      return;
    }

    // no-one can edit himself
    if (targetMember.userId === currentUserId) {
      this.logger.warn({
        action: 'COMMUNITY_HIERARCHY_VIOLATION_SELF_EDIT',
        userId: currentUserId,
        targetUserId: targetMember.userId,
      });
      throw new ForbiddenException('You cannot modify your own member record.');
    }

    // Target is owner, but requester is not owner
    if (isTargetOwner) {
      this.logger.warn({
        action: 'COMMUNITY_HIERARCHY_VIOLATION_OWNER_EDIT',
        userId: currentUserId,
        targetUserId: targetMember.userId,
      });
      throw new ForbiddenException(
        'Only the community owner can modify the owner.',
      );
    }

    const getRank = (accessControlRole: string) => {
      if (accessControlRole === 'ADMIN') return 3;
      if (accessControlRole === 'MODERATOR') return 2;
      return 1; // READ_ONLY
    };

    const requesterRank = requesterMember
      ? getRank(requesterMember.accessControlRole)
      : 0;
    const targetRank = getRank(targetMember.accessControlRole);

    if (requesterRank <= targetRank) {
      this.logger.warn({
        action: 'COMMUNITY_HIERARCHY_VIOLATION_LOWER_RANK',
        userId: currentUserId,
        targetUserId: targetMember.userId,
        requesterRank,
        targetRank,
      });
      throw new ForbiddenException(
        'Only users with a higher access role can modify this member.',
      );
    }
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

    this.validateHierarchyAction(
      currentUserId,
      community.ownerId,
      community.members[0],
      member,
    );

    const updated = await prisma.communityMemberEntity.update({
      where: { id: memberId },
      data: { role },
    });

    this.logger.info({
      action: 'COMMUNITY_MEMBER_ROLE_UPDATED',
      communityId,
      userId: currentUserId,
      targetMemberId: memberId,
      targetUserId: member.userId,
      oldRole: member.role,
      newRole: role,
    });

    return updated;
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

    this.validateHierarchyAction(
      currentUserId,
      community.ownerId,
      community.members[0],
      member,
    );

    const updated = await prisma.communityMemberEntity.update({
      where: { id: memberId },
      data: { accessControlRole },
    });

    this.logger.info({
      action: 'COMMUNITY_MEMBER_ACCESS_UPDATED',
      communityId,
      userId: currentUserId,
      targetMemberId: memberId,
      targetUserId: member.userId,
      oldAccessControlRole: member.accessControlRole,
      newAccessControlRole: accessControlRole,
    });

    return updated;
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

    this.validateHierarchyAction(
      currentUserId,
      community.ownerId,
      community.members[0],
      member,
    );

    const deleted = await prisma.communityMemberEntity.delete({
      where: { id: memberId },
    });

    const isSelf = member.userId === currentUserId;
    this.logger.info({
      action: isSelf ? 'COMMUNITY_MEMBER_LEFT' : 'COMMUNITY_MEMBER_REMOVED',
      communityId,
      userId: currentUserId,
      targetMemberId: memberId,
      targetUserId: member.userId,
    });

    return deleted;
  }

  async getCommunityStats(
    currentUserId: string,
    communityId: string,
  ): Promise<CommunityStatsResponseDto> {
    const community = await this.checkCommunityReadPermission(
      currentUserId,
      communityId,
    );

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalMembersDb,
      newMembers30DaysDb,
      adminCountDb,
      moderatorCount,
      hasOwnerInMembers,
    ] = await Promise.all([
      prisma.communityMemberEntity.count({
        where: { communityId },
      }),
      prisma.communityMemberEntity.count({
        where: {
          communityId,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.communityMemberEntity.count({
        where: {
          communityId,
          accessControlRole: 'ADMIN',
        },
      }),
      prisma.communityMemberEntity.count({
        where: {
          communityId,
          accessControlRole: 'MODERATOR',
        },
      }),
      prisma.communityMemberEntity
        .count({
          where: {
            communityId,
            userId: community.ownerId,
          },
        })
        .then((count) => count > 0),
    ]);

    let totalMembers = totalMembersDb;
    let adminCount = adminCountDb;
    let newMembers30Days = newMembers30DaysDb;

    // Handle legacy community edge-case where owner is not present in members
    if (!hasOwnerInMembers) {
      totalMembers += 1;
      adminCount += 1;
      if (community.createdAt >= thirtyDaysAgo) {
        newMembers30Days += 1;
      }
    }

    return {
      totalMembers,
      newMembers30Days,
      pageImpressions: 0,
      postImpressions: 0,
      adminCount,
      moderatorCount,
    };
  }

  async getCommunityByHandle(handle: string) {
    const community = await prisma.communityEntity.findUnique({
      where: { handle: handle.trim().toLowerCase() },
      select: {
        id: true,
        name: true,
        handle: true,
        description: true,
        avatarImage: true,
        coverImage: true,
      },
    });
    if (!community) {
      throw new NotFoundException('Community not found');
    }
    return community;
  }

  async joinCommunity(
    userId: string,
    communityId: string,
    referralCode?: string,
  ) {
    const community = await prisma.communityEntity.findUnique({
      where: { id: communityId },
    });
    if (!community) {
      throw new NotFoundException('Community not found.');
    }

    const existing = await prisma.communityMemberEntity.findUnique({
      where: {
        communityId_userId: {
          communityId,
          userId,
        },
      },
    });
    if (existing) {
      this.logger.warn({
        action: 'COMMUNITY_JOIN_ALREADY_MEMBER',
        communityId,
        userId,
      });
      throw new ConflictException('You are already a member of this community.');
    }

    let referralId: string | null = null;
    if (referralCode) {
      const referral = await prisma.referralEntity.findUnique({
        where: { code: referralCode },
      });
      if (
        referral &&
        !referral.isDeleted &&
        referral.isActive &&
        referral.entityType === 'COMMUNITY' &&
        referral.entityId === communityId
      ) {
        if (referral.referrerId !== userId) {
          referralId = referral.id;
        }
      }
    }

    const member = await prisma.communityMemberEntity.create({
      data: {
        communityId,
        userId,
        role: 'MEMBER',
        accessControlRole: 'MEMBER',
        referralId,
      },
    });

    this.logger.info({
      action: 'COMMUNITY_MEMBER_JOINED',
      communityId,
      userId,
      memberId: member.id,
      role: 'MEMBER',
      referralId: referralId || undefined,
    });

    if (referralId) {
      await prisma.referralEntity.update({
        where: { id: referralId },
        data: {
          registrationsCount: { increment: 1 },
          lastRegistrationAt: new Date(),
        },
      });

      this.logger.info({
        action: 'COMMUNITY_REFERRAL_USED',
        communityId,
        userId,
        referralId,
      });
    }

    return { success: true, memberId: member.id };
  }
}
