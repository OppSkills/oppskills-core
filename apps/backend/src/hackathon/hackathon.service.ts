import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, prisma } from '@oppskills/db';
import type {
  CreateHackathonDto,
  UpdateHackathonDto,
  UpdateHackathonRoundsDto,
  UpdateHackathonAdditionalInfoDto,
  HackathonAttendeeEligibilityValue,
  PrizeBreakdownDto,
  RegistrationFormDto,
} from '@oppskills/types';
import type { UpdateHackathonPrizeBreakdownDto } from './hackathon-update-nested.dto';

type LifecycleStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED';

type AccessLevelValue = 'ADMIN' | 'USER' | 'VIEWER';

/** Default attendee eligibility when not provided. */
const DEFAULT_ATTENDEE_ELIGIBILITY: HackathonAttendeeEligibilityValue[] = [
  'EVERYONE_CAN_APPLY',
];

@Injectable()
export class HackathonService {
  /**
   * Create a hackathon as a user.
   * - If `festivalId` is null/undefined => standalone hackathon.
   * - If `rounds` is not provided, no default rounds are created (organizers add them later).
   */
  async createHackathon(dto: CreateHackathonDto, userId: string) {
    if (dto.festivalId) {
      const festival = await prisma.festivalEntity.findUnique({
        where: { id: dto.festivalId },
        select: { id: true },
      });
      if (!festival) {
        throw new BadRequestException('Referenced festival does not exist.');
      }
    }

    const startDate = this.parseDate(dto.startDate, 'startDate');
    const endDate = this.parseDate(dto.endDate, 'endDate');
    if (endDate.getTime() < startDate.getTime()) {
      throw new BadRequestException('endDate must be >= startDate.');
    }

    // Validate cross-field constraints that class-validator cannot express easily.
    this.assertLocationValid(dto);
    this.assertUniversityRestrictionValid(dto);
    this.assertPricingValid(dto);

    const slug = await this.buildHackathonSlug(dto.slug, dto.name);

    // Build rounds data - either from DTO or empty (no default rounds)
    const roundsData = dto.rounds
      ? dto.rounds.map((round) => ({
          name: round.name,
          description: round.description,
          startsAt: this.parseDate(round.startsAt, 'rounds.startsAt'),
          endsAt: this.parseDate(round.endsAt, 'rounds.endsAt'),
          order: round.order,
          roundType: round.roundType,
          submissionConfig: round.submissionConfig
            ? (round.submissionConfig as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        }))
      : []; // Don't create default rounds - organizers can add them later

    // Determine attendee eligibility
    const attendeeEligibility =
      dto.attendeeEligibility && dto.attendeeEligibility.length > 0
        ? dto.attendeeEligibility
        : DEFAULT_ATTENDEE_ELIGIBILITY;

    try {
      const hackathon = await prisma.hackathonEntity.create({
        data: {
          name: dto.name,
          description: dto.description,
          startDate,
          endDate,
          mode: dto.mode,
          ownerId: userId,

          // Extended fields
          slug,
          festivalId: dto.festivalId ?? null,
          bannerImageUrl: dto.bannerImageUrl,
          visibility: dto.visibility ?? 'PUBLIC',
          hackathonType: dto.hackathonType ?? 'CODING_HACKATHON',
          participantType: dto.participantType ?? 'INDIVIDUAL',

          locationType: dto.location?.type,
          locationAddress: dto.location?.address,
          locationCity: dto.location?.city,
          locationVirtualLink: dto.location?.virtualLink,

          registrationDeadline: dto.registrationDeadline
            ? this.parseDate(dto.registrationDeadline, 'registrationDeadline')
            : undefined,
          externalRegistrationLink: dto.externalRegistrationLink,

          isFree: dto.isFree ?? true,
          entryFeeAmount: dto.entryFeeAmount,
          currency: dto.currency ?? 'INR',
          prizeTotalWorthAmount: dto.prizeTotalWorthAmount,

          // New prize fields
          prizeDescription: dto.prizeDescription ?? Prisma.JsonNull,
          prizeCertificate: dto.prizeCertificate ?? false,

          organizationName: dto.organizationName,
          organizationLogoUrl: dto.organizationLogoUrl,
          allowedUniversities: dto.allowedUniversities ?? [],

          // New eligibility & team settings
          attendeeEligibility,
          maxTeams: dto.maxTeams ?? null,

          // New contact info fields
          contactName: dto.additionalInfo?.contact?.name,
          contactEmail: dto.additionalInfo?.contact?.email,
          contactPhone: dto.additionalInfo?.contact?.phone,

          registrationForm: dto.registrationForm
            ? {
                create: {
                  externalFormLink: dto.registrationForm.externalFormLink,
                  fields: {
                    create: (dto.registrationForm.fields ?? []).map(
                      (field) => ({
                        label: field.label,
                        type: field.type,
                        required: field.required,
                        order: field.order,
                        options: field.options ?? [],
                        placeholder: field.placeholder,
                      }),
                    ),
                  },
                },
              }
            : undefined,

          rounds: {
            create: roundsData,
          },

          prizeBreakdown: dto.prizeBreakdown
            ? {
                create: dto.prizeBreakdown.map((prize) => ({
                  position: prize.position,
                  amount: prize.amount,
                  description: prize.description,
                })),
              }
            : undefined,

          // New attachments relation
          attachments: dto.additionalInfo?.attachments
            ? {
                create: dto.additionalInfo.attachments.map((att) => ({
                  storageKey: att.storageKey,
                  publicUrl: att.publicUrl,
                  fileName: att.fileName,
                  mimeType: att.mimeType,
                  sizeBytes: att.sizeBytes,
                })),
              }
            : undefined,
        },
        include: this.getHackathonIncludeClause(),
      });

      return hackathon;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'A hackathon with the same unique field already exists.',
          );
        }
        if (error.code === 'P2003') {
          throw new BadRequestException('Invalid reference provided.');
        }
      }

      if (error instanceof Error) {
        throw new InternalServerErrorException(
          `Error creating hackathon: ${error.message}`,
        );
      }
      throw new InternalServerErrorException('Error creating hackathon.');
    }
  }

  /**
   * List hackathons, optionally filtered by festival.
   * Includes all relations: owner, festival, rounds, questions, attachments, etc.
   */
  async listHackathons(input: { festivalId?: string }) {
    return prisma.hackathonEntity.findMany({
      where: input.festivalId ? { festivalId: input.festivalId } : undefined,
      include: this.getHackathonIncludeClause(),
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Public Endpoints (no auth) - sanitized data only
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * List public hackathons (PUBLISHED/ONGOING + APPROVED only).
   * Returns sanitized data without teams or participant PII.
   */
  async listPublicHackathons(input: { festivalId?: string } = {}) {
    const baseWhere: Record<string, unknown> = {
      status: { in: ['PUBLISHED', 'ONGOING'] },
      approvalStatus: 'APPROVED',
    };
    if (input.festivalId) {
      baseWhere.festivalId = input.festivalId;
    }

    const hackathons = await prisma.hackathonEntity.findMany({
      where: baseWhere,
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        bannerImageUrl: true,
        startDate: true,
        endDate: true,
        status: true,
        approvalStatus: true,
        mode: true,
        locationType: true,
        locationCity: true,
        locationAddress: true,
        locationVirtualLink: true,
        isFree: true,
        entryFeeAmount: true,
        currency: true,
        prizeTotalWorthAmount: true,
        prizeDescription: true,
        prizeCertificate: true,
        visibility: true,
        hackathonType: true,
        participantType: true,
        registrationCount: true,
        maxTeams: true,
        registrationDeadline: true,
        isRegistrationPaused: true,
        organizationName: true,
        organizationLogoUrl: true,
        attendeeEligibility: true,
        createdAt: true,
        // Owner info (public: name only)
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
        festival: {
          select: { id: true, name: true, slug: true },
        },
        // Rounds are public
        rounds: {
          select: {
            id: true,
            name: true,
            description: true,
            startsAt: true,
            endsAt: true,
            order: true,
            roundType: true,
            status: true,
          },
          orderBy: { order: 'asc' },
        },
        // Prize breakdown is public
        prizeBreakdown: {
          select: { id: true, position: true, amount: true, description: true },
          orderBy: { amount: 'desc' },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    return hackathons;
  }

  /**
   * Get a public hackathon by slug (PUBLISHED/ONGOING + APPROVED only).
   * Returns sanitized data without teams, participants, or PII.
   */
  async getPublicHackathonBySlug(slug: string) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        bannerImageUrl: true,
        startDate: true,
        endDate: true,
        status: true,
        approvalStatus: true,
        mode: true,
        locationType: true,
        locationCity: true,
        locationAddress: true,
        locationVirtualLink: true,
        isFree: true,
        entryFeeAmount: true,
        currency: true,
        prizeTotalWorthAmount: true,
        prizeDescription: true,
        prizeCertificate: true,
        visibility: true,
        hackathonType: true,
        participantType: true,
        registrationCount: true,
        maxTeams: true,
        registrationDeadline: true,
        isRegistrationPaused: true,
        organizationName: true,
        organizationLogoUrl: true,
        attendeeEligibility: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
        festival: {
          select: { id: true, name: true, slug: true },
        },
        rounds: {
          select: {
            id: true,
            name: true,
            description: true,
            startsAt: true,
            endsAt: true,
            order: true,
            roundType: true,
            status: true,
          },
          orderBy: { order: 'asc' },
        },
        prizeBreakdown: {
          select: { id: true, position: true, amount: true, description: true },
          orderBy: { amount: 'desc' },
        },
        registrationForm: {
          select: {
            id: true,
            externalFormLink: true,
            fields: {
              select: {
                id: true,
                label: true,
                type: true,
                required: true,
                order: true,
                options: true,
              },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    // Only return if publicly visible
    const isPubliclyVisible =
      (hackathon.status === 'PUBLISHED' || hackathon.status === 'ONGOING') &&
      hackathon.approvalStatus === 'APPROVED';

    if (!isPubliclyVisible) {
      throw new NotFoundException(
        'Hackathon not found or not publicly visible',
      );
    }

    return hackathon;
  }

  /**
   * Get a public hackathon by ID (PUBLISHED/ONGOING + APPROVED only).
   * Returns sanitized data without teams, participants, or PII.
   */
  async getPublicHackathonById(id: string) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        bannerImageUrl: true,
        startDate: true,
        endDate: true,
        status: true,
        approvalStatus: true,
        mode: true,
        locationType: true,
        locationCity: true,
        locationAddress: true,
        locationVirtualLink: true,
        isFree: true,
        entryFeeAmount: true,
        currency: true,
        prizeTotalWorthAmount: true,
        prizeDescription: true,
        prizeCertificate: true,
        visibility: true,
        hackathonType: true,
        participantType: true,
        registrationCount: true,
        maxTeams: true,
        registrationDeadline: true,
        isRegistrationPaused: true,
        organizationName: true,
        organizationLogoUrl: true,
        attendeeEligibility: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
        festival: {
          select: { id: true, name: true, slug: true },
        },
        rounds: {
          select: {
            id: true,
            name: true,
            description: true,
            startsAt: true,
            endsAt: true,
            order: true,
            roundType: true,
            status: true,
          },
          orderBy: { order: 'asc' },
        },
        prizeBreakdown: {
          select: { id: true, position: true, amount: true, description: true },
          orderBy: { amount: 'desc' },
        },
        registrationForm: {
          select: {
            id: true,
            externalFormLink: true,
            fields: {
              select: {
                id: true,
                label: true,
                type: true,
                required: true,
                order: true,
                options: true,
              },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    // Only return if publicly visible
    const isPubliclyVisible =
      (hackathon.status === 'PUBLISHED' || hackathon.status === 'ONGOING') &&
      hackathon.approvalStatus === 'APPROVED';

    if (!isPubliclyVisible) {
      throw new NotFoundException(
        'Hackathon not found or not publicly visible',
      );
    }

    return hackathon;
  }

  /**
   * List hackathons for the dashboard for a given user.
   *
   * Visibility rules:
   * - Owner can see their hackathons
   * - Managers can see hackathons they manage
   * - Evaluators are intentionally excluded for now
   *
   * This method returns a lightweight shape suitable for dashboard listing.
   */
  async listMyHackathons(userId: string) {
    const safeUserId = userId.trim();
    if (safeUserId.length === 0) {
      throw new BadRequestException('userId is required.');
    }

    return prisma.hackathonEntity.findMany({
      where: {
        OR: [
          { ownerId: safeUserId },
          {
            userRoles: {
              some: {
                userId: safeUserId,
                role: 'MANAGER',
              },
            },
          },
        ],
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        status: true,
        mode: true,
        startDate: true,
        endDate: true,
        registrationDeadline: true,
        bannerImageUrl: true,
        festivalId: true,
        ownerId: true,
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single hackathon by ID.
   * Includes all relations: owner, festival, rounds, questions, attachments, etc.
   *
   * Authorization:
   * - Public hackathons (PUBLISHED/ONGOING + APPROVED) are readable by any authenticated user.
   * - Non-public hackathons require owner, manager, or admin access.
   */
  async getHackathonById(id: string, userId: string) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { id },
      include: this.getHackathonIncludeClause(),
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    await this.assertCanReadHackathon(hackathon, userId);

    return hackathon;
  }

  /**
   * Get a single hackathon by slug.
   * Includes all relations: owner, festival, rounds, questions, attachments, etc.
   *
   * Authorization:
   * - Public hackathons (PUBLISHED/ONGOING + APPROVED) are readable by any authenticated user.
   * - Non-public hackathons require owner, manager, or admin access.
   */
  async getHackathonBySlug(slug: string, userId: string) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug },
      include: this.getHackathonIncludeClause(),
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    await this.assertCanReadHackathon(hackathon, userId);

    return hackathon;
  }

  /**
   * Check if a hackathon is publicly visible.
   */
  private isHackathonPubliclyVisible(hackathon: {
    status: string;
    approvalStatus: string;
  }): boolean {
    const publicStatuses = ['PUBLISHED', 'ONGOING'];
    return (
      publicStatuses.includes(hackathon.status) &&
      hackathon.approvalStatus === 'APPROVED'
    );
  }

  /**
   * Assert that a user can read a hackathon.
   * - Public hackathons are readable by any authenticated user.
   * - Non-public hackathons require owner, manager, or admin access.
   * Throws NotFoundException (404) to avoid leaking existence of private hackathons.
   */
  private async assertCanReadHackathon(
    hackathon: {
      id: string;
      ownerId: string;
      status: string;
      approvalStatus: string;
    },
    userId: string,
  ): Promise<void> {
    // Public hackathons are readable by anyone
    if (this.isHackathonPubliclyVisible(hackathon)) {
      return;
    }

    // Check if user is owner
    if (hackathon.ownerId === userId) {
      return;
    }

    // Check if user is admin
    const isAdmin = await this.isAdminUser(userId);
    if (isAdmin) {
      return;
    }

    // Check if user is manager
    const isManager = await this.isHackathonManager(hackathon.id, userId);
    if (isManager) {
      return;
    }

    // User is not authorized - throw 404 to avoid leaking existence
    throw new NotFoundException('Hackathon not found');
  }

  /**
   * Update a hackathon (owner, admin, or manager).
   * - Allowed only when status is DRAFT.
   * - Nested updates (rounds, questions, additionalInfo, etc.) use dedicated endpoints.
   */
  async updateHackathon(id: string, dto: UpdateHackathonDto, userId: string) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { id },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    // Check permission: owner OR admin OR manager
    if (hackathon.ownerId !== userId) {
      const isAdmin = await this.isAdminUser(userId);
      if (!isAdmin) {
        const isManager = await this.isHackathonManager(id, userId);
        if (!isManager) {
          throw new ForbiddenException(
            'You are not allowed to edit this hackathon.',
          );
        }
      }
    }

    const status = hackathon.status as LifecycleStatus;
    if (status !== 'DRAFT') {
      throw new ForbiddenException(
        'You can only edit a hackathon in DRAFT status.',
      );
    }

    // Nested updates are not supported via this endpoint - use dedicated endpoints.
    if (
      dto.rounds ||
      dto.prizeBreakdown ||
      dto.registrationForm ||
      dto.additionalInfo
    ) {
      throw new BadRequestException(
        'Nested updates (rounds, prizeBreakdown, registrationForm, additionalInfo) are not supported in PUT /hackathons/:id. Use dedicated endpoints.',
      );
    }

    if (dto.festivalId) {
      const festival = await prisma.festivalEntity.findUnique({
        where: { id: dto.festivalId },
        select: { id: true },
      });
      if (!festival) {
        throw new BadRequestException('Referenced festival does not exist.');
      }
    }

    // Validate cross-field constraints
    this.assertLocationValid(dto);
    this.assertUniversityRestrictionValid(dto);
    this.assertPricingValid(dto, hackathon);

    await this.assertPricingNotLockedByRegistration(id, hackathon, dto);

    const startDate = dto.startDate
      ? this.parseDate(dto.startDate, 'startDate')
      : hackathon.startDate;
    const endDate = dto.endDate
      ? this.parseDate(dto.endDate, 'endDate')
      : hackathon.endDate;
    if (endDate.getTime() < startDate.getTime()) {
      throw new BadRequestException('endDate must be >= startDate.');
    }

    const name = dto.name ?? hackathon.name;
    const slug = dto.slug
      ? await this.buildHackathonSlug(dto.slug, name, id)
      : undefined;

    return prisma.hackathonEntity.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        startDate,
        endDate,
        mode: dto.mode,

        slug,
        festivalId: dto.festivalId ?? null,
        bannerImageUrl: dto.bannerImageUrl,
        visibility: dto.visibility ?? undefined,
        hackathonType: dto.hackathonType ?? undefined,
        participantType: dto.participantType ?? undefined,

        locationType: dto.location?.type,
        locationAddress: dto.location?.address,
        locationCity: dto.location?.city,
        locationVirtualLink: dto.location?.virtualLink,

        registrationDeadline: dto.registrationDeadline
          ? this.parseDate(dto.registrationDeadline, 'registrationDeadline')
          : undefined,
        externalRegistrationLink: dto.externalRegistrationLink,

        isFree: dto.isFree ?? undefined,
        entryFeeAmount: dto.entryFeeAmount,
        currency: dto.currency ?? undefined,
        prizeTotalWorthAmount: dto.prizeTotalWorthAmount,

        // New prize fields
        prizeDescription:
          dto.prizeDescription !== undefined
            ? (dto.prizeDescription ?? Prisma.JsonNull)
            : undefined,
        prizeCertificate: dto.prizeCertificate,

        organizationName: dto.organizationName,
        organizationLogoUrl: dto.organizationLogoUrl,
        allowedUniversities: dto.allowedUniversities ?? undefined,

        // New eligibility & team settings
        attendeeEligibility: dto.attendeeEligibility,
        maxTeams: dto.maxTeams,
      },
      include: this.getHackathonIncludeClause(),
    });
  }

  async deleteHackathon(id: string, userId: string) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { id },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    if (hackathon.ownerId !== userId) {
      const isAdmin = await this.isAdminUser(userId);
      if (!isAdmin) {
        throw new ForbiddenException(
          'You are not allowed to delete this hackathon.',
        );
      }
    }

    await prisma.hackathonEntity.delete({ where: { id } });

    return { message: 'Hackathon deleted successfully.' };
  }

  async updateHackathonStatus(
    id: string,
    nextStatus: LifecycleStatus,
    userId: string,
  ) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { id },
      select: { id: true, ownerId: true, status: true },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    // Permission: owner OR admin OR manager
    if (hackathon.ownerId !== userId) {
      const isAdmin = await this.isAdminUser(userId);
      if (!isAdmin) {
        const isManager = await this.isHackathonManager(id, userId);
        if (!isManager) {
          throw new ForbiddenException(
            'You are not allowed to change this hackathon status.',
          );
        }
      }
    }

    const currentStatus = hackathon.status as LifecycleStatus;
    this.assertLifecycleTransitionAllowed(
      currentStatus,
      nextStatus,
      'hackathon',
    );

    return prisma.hackathonEntity.update({
      where: { id },
      data: { status: nextStatus },
    });
  }

  async registerForHackathon(hackathonId: string, userId: string) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { id: hackathonId },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    if (hackathon.ownerId === userId) {
      throw new ForbiddenException(
        'You cannot register for your own hackathon.',
      );
    }

    return {
      message: 'User registered successfully for hackathon.',
    };
  }

  /**
   * Replace all rounds of a hackathon.
   * - Allowed only when status is DRAFT.
   * - Owner-only (or admin).
   */
  async updateHackathonRounds(
    id: string,
    dto: UpdateHackathonRoundsDto,
    userId: string,
  ) {
    await this.assertHackathonEditableByUser(id, userId);

    // Validate round timeline constraints
    for (const round of dto.rounds) {
      const startsAt = this.parseDate(round.startsAt, 'rounds.startsAt');
      const endsAt = this.parseDate(round.endsAt, 'rounds.endsAt');
      if (endsAt.getTime() < startsAt.getTime()) {
        throw new BadRequestException(
          `Round "${round.name}": endsAt must be >= startsAt.`,
        );
      }
    }

    // Delete existing rounds and create new ones in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.roundEntity.deleteMany({
        where: { hackathonId: id },
      });

      await tx.roundEntity.createMany({
        data: dto.rounds.map((round) => ({
          hackathonId: id,
          name: round.name,
          description: round.description,
          startsAt: this.parseDate(round.startsAt, 'rounds.startsAt'),
          endsAt: this.parseDate(round.endsAt, 'rounds.endsAt'),
          order: round.order,
          roundType: round.roundType,
          submissionConfig: round.submissionConfig
            ? (round.submissionConfig as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        })),
      });
    });

    return prisma.hackathonEntity.findUnique({
      where: { id },
      include: this.getHackathonIncludeClause(),
    });
  }

  /**
   * Update additional info (contact + attachments) of a hackathon.
   * - Allowed only when status is DRAFT.
   * - Owner-only (or admin).
   */
  async updateHackathonAdditionalInfo(
    id: string,
    dto: UpdateHackathonAdditionalInfoDto,
    userId: string,
  ) {
    await this.assertHackathonEditableByUser(id, userId);

    // Update contact info and attachments in a transaction
    await prisma.$transaction(async (tx) => {
      // Update contact fields on hackathon
      await tx.hackathonEntity.update({
        where: { id },
        data: {
          contactName: dto.contact?.name,
          contactEmail: dto.contact?.email,
          contactPhone: dto.contact?.phone,
        },
      });

      // Replace attachments if provided
      if (dto.attachments !== undefined) {
        await tx.hackathonAttachmentEntity.deleteMany({
          where: { hackathonId: id },
        });

        if (dto.attachments.length > 0) {
          await tx.hackathonAttachmentEntity.createMany({
            data: dto.attachments.map((att) => ({
              hackathonId: id,
              storageKey: att.storageKey,
              publicUrl: att.publicUrl,
              fileName: att.fileName,
              mimeType: att.mimeType,
              sizeBytes: att.sizeBytes,
            })),
          });
        }
      }
    });

    return prisma.hackathonEntity.findUnique({
      where: { id },
      include: this.getHackathonIncludeClause(),
    });
  }

  /**
   * Replace the registration form for a hackathon.
   *
   * Semantics:
   * - If `externalFormLink` is provided (non-empty), the hackathon uses an external form
   *   and we clear internal `fields`.
   * - Otherwise, `fields` (if provided) fully replaces existing fields.
   *   Passing an empty fields array clears custom registration fields.
   */
  async updateHackathonRegistrationForm(
    id: string,
    dto: RegistrationFormDto,
    userId: string,
  ) {
    await this.assertHackathonEditableByUser(id, userId);

    const externalFormLink =
      typeof dto.externalFormLink === 'string' &&
      dto.externalFormLink.trim().length > 0
        ? dto.externalFormLink.trim()
        : undefined;

    const fields = Array.isArray(dto.fields) ? dto.fields : [];

    // Validate uniqueness of field order values (DB enforces uniqueness per form).
    if (!externalFormLink && fields.length > 0) {
      const seen = new Set<number>();
      for (const f of fields) {
        if (seen.has(f.order)) {
          throw new BadRequestException(
            `registrationForm.fields has duplicate order value: ${f.order}`,
          );
        }
        seen.add(f.order);
      }
    }

    await prisma.$transaction(async (tx) => {
      const form = await tx.registrationFormEntity.upsert({
        where: { hackathonId: id },
        create: {
          hackathonId: id,
          externalFormLink: externalFormLink ?? null,
        },
        update: {
          externalFormLink: externalFormLink ?? null,
        },
      });

      // Always clear existing fields; we'll re-create if needed.
      await tx.registrationFieldEntity.deleteMany({
        where: { registrationFormId: form.id },
      });

      // If external form link is used, no internal fields are stored.
      if (externalFormLink) return;
      if (fields.length === 0) return;

      await tx.registrationFieldEntity.createMany({
        data: fields.map((f) => ({
          registrationFormId: form.id,
          label: f.label,
          type: f.type,
          required: f.required,
          order: f.order,
          options: f.options ?? [],
          placeholder: f.placeholder,
        })),
      });
    });

    return prisma.hackathonEntity.findUnique({
      where: { id },
      include: this.getHackathonIncludeClause(),
    });
  }

  /**
   * Replace the prize breakdown list for a hackathon.
   */
  async updateHackathonPrizeBreakdown(
    id: string,
    dto: UpdateHackathonPrizeBreakdownDto,
    userId: string,
  ) {
    await this.assertHackathonEditableByUser(id, userId);

    const items: PrizeBreakdownDto[] = Array.isArray(dto.prizeBreakdown)
      ? dto.prizeBreakdown
      : [];

    // Validate amounts are parseable decimals (Prisma will also validate at the DB boundary).
    for (const item of items) {
      const amountNumber = Number(item.amount);
      if (!Number.isFinite(amountNumber)) {
        throw new BadRequestException(
          `Invalid prizeBreakdown.amount for position "${item.position}": "${item.amount}"`,
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.prizeBreakdownEntity.deleteMany({
        where: { hackathonId: id },
      });

      if (items.length === 0) return;

      await tx.prizeBreakdownEntity.createMany({
        data: items.map((p) => ({
          hackathonId: id,
          position: p.position,
          amount: p.amount,
          description: p.description,
        })),
      });
    });

    return prisma.hackathonEntity.findUnique({
      where: { id },
      include: this.getHackathonIncludeClause(),
    });
  }

  /**
   * Update the max teams limit.
   * - `null` means unlimited.
   * - Allowed only when status is DRAFT (permission enforced via assert).
   */
  async updateHackathonMaxTeams(
    id: string,
    maxTeams: number | null,
    userId: string,
  ) {
    await this.assertHackathonEditableByUser(id, userId);

    return prisma.hackathonEntity.update({
      where: { id },
      data: {
        maxTeams,
      },
      include: this.getHackathonIncludeClause(),
    });
  }

  /**
   * Assert that a hackathon exists, is editable (DRAFT status),
   * and the user has permission to edit it (owner OR admin OR manager).
   * @returns The hackathon if all checks pass.
   */
  private async assertHackathonEditableByUser(id: string, userId: string) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { id },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    // Check permission: owner OR admin OR manager
    if (hackathon.ownerId !== userId) {
      const isAdmin = await this.isAdminUser(userId);
      if (!isAdmin) {
        const isManager = await this.isHackathonManager(id, userId);
        if (!isManager) {
          throw new ForbiddenException(
            'You are not allowed to edit this hackathon.',
          );
        }
      }
    }

    const status = hackathon.status as LifecycleStatus;
    if (status !== 'DRAFT') {
      throw new ForbiddenException(
        'You can only edit a hackathon in DRAFT status.',
      );
    }

    return hackathon;
  }

  /**
   * Get the standard include clause for hackathon queries.
   * Includes all relations: owner, festival, rounds, questions, attachments, etc.
   */
  private getHackathonIncludeClause() {
    return {
      owner: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
        },
      },
      festival: true,
      rounds: {
        orderBy: { order: 'asc' as const },
      },
      prizeBreakdown: true,
      registrationForm: {
        include: {
          fields: {
            orderBy: { order: 'asc' as const },
          },
        },
      },
      attachments: true,
    };
  }

  private parseDate(value: string, fieldName: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid date for ${fieldName}.`);
    }
    return date;
  }

  private slugify(input: string): string {
    const base = input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');

    // Ensure non-empty slug.
    return base.length > 0 ? base : 'hackathon';
  }

  /**
   * Build a unique slug.
   * If `excludeId` is provided, slug uniqueness checks ignore that record.
   */
  private async buildHackathonSlug(
    requestedSlug: string | undefined,
    name: string,
    excludeId?: string,
  ): Promise<string> {
    const base = this.slugify(requestedSlug ?? name);

    const existing = await prisma.hackathonEntity.findFirst({
      where: excludeId
        ? {
            slug: base,
            NOT: {
              id: excludeId,
            },
          }
        : {
            slug: base,
          },
      select: { id: true },
    });

    if (!existing) return base;

    // Add a short suffix for uniqueness.
    const suffix = Math.random().toString(36).slice(2, 8);
    return `${base}-${suffix}`;
  }

  private assertLocationValid(
    dto: CreateHackathonDto | UpdateHackathonDto,
  ): void {
    if (!dto.location) return;

    if (dto.location.type === 'PHYSICAL') {
      if (!dto.location.address || dto.location.address.trim().length === 0) {
        throw new BadRequestException(
          'location.address is required for PHYSICAL events.',
        );
      }
      return;
    }

    if (dto.location.type === 'VIRTUAL') {
      if (
        !dto.location.virtualLink ||
        dto.location.virtualLink.trim().length === 0
      ) {
        throw new BadRequestException(
          'location.virtualLink is required for VIRTUAL events.',
        );
      }
    }
  }

  private assertUniversityRestrictionValid(
    dto: CreateHackathonDto | UpdateHackathonDto,
  ): void {
    if (dto.visibility !== 'UNIVERSITY_ONLY') return;
    const universities = dto.allowedUniversities ?? [];
    if (universities.length === 0) {
      throw new BadRequestException(
        'allowedUniversities must be provided when visibility is UNIVERSITY_ONLY.',
      );
    }
  }

  private assertPricingValid(
    dto: CreateHackathonDto | UpdateHackathonDto,
    currentHackathon?: {
      isFree: boolean;
      entryFeeAmount: unknown;
      registrationDeadline: Date | null;
    },
  ): void {
    const targetIsFree = dto.isFree ?? currentHackathon?.isFree ?? true;
    if (targetIsFree) return;

    const entryFeeAmount =
      dto.entryFeeAmount ?? currentHackathon?.entryFeeAmount;
    const hasEntryFeeAmount =
      typeof entryFeeAmount === 'string'
        ? entryFeeAmount.trim().length > 0
        : entryFeeAmount !== null && entryFeeAmount !== undefined;

    if (!hasEntryFeeAmount) {
      throw new BadRequestException(
        'entryFeeAmount is required when isFree is false.',
      );
    }

    const registrationDeadline =
      dto.registrationDeadline ?? currentHackathon?.registrationDeadline;
    const hasRegistrationDeadline =
      typeof registrationDeadline === 'string'
        ? registrationDeadline.trim().length > 0
        : registrationDeadline !== null && registrationDeadline !== undefined;

    if (!hasRegistrationDeadline) {
      throw new BadRequestException(
        'registrationDeadline is required when isFree is false.',
      );
    }
  }

  private async assertPricingNotLockedByRegistration(
    hackathonId: string,
    currentHackathon: {
      isFree: boolean;
      entryFeeAmount: unknown;
      chargeMode: unknown;
    },
    dto: UpdateHackathonDto & { chargeMode?: string },
  ): Promise<void> {
    const isPricingFieldChanging =
      (dto.isFree !== undefined && dto.isFree !== currentHackathon.isFree) ||
      (dto.entryFeeAmount !== undefined &&
        String(dto.entryFeeAmount) !==
          String(currentHackathon.entryFeeAmount)) ||
      ('chargeMode' in dto && dto.chargeMode !== currentHackathon.chargeMode);

    if (!isPricingFieldChanging) return;

    const [team, payment, submission] = await Promise.all([
      prisma.teamEntity.findFirst({
        where: { hackathonId },
        select: { id: true },
      }),
      prisma.hackathonPaymentEntity.findFirst({
        where: { hackathonId },
        select: { id: true },
      }),
      prisma.hackathonRegistrationSubmissionEntity.findFirst({
        where: { hackathonId },
        select: { id: true },
      }),
    ]);

    if (team || payment || submission) {
      throw new BadRequestException(
        'Cannot change pricing fields (isFree, entryFeeAmount, chargeMode) after registration has started.',
      );
    }
  }

  private async isAdminUser(userId: string): Promise<boolean> {
    const rows = await prisma.$queryRaw<
      Array<{ access_level: AccessLevelValue }>
    >`
      SELECT "access_level"
      FROM "oppskills"."user"
      WHERE "id" = ${userId}
      LIMIT 1
    `;
    return rows[0]?.access_level === 'ADMIN';
  }

  private assertLifecycleTransitionAllowed(
    currentStatus: LifecycleStatus,
    nextStatus: LifecycleStatus,
    entityName: 'hackathon' | 'festival',
  ): void {
    if (currentStatus === nextStatus) return;

    // Terminal states
    if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') {
      throw new ForbiddenException(
        `Cannot change ${entityName} status once it is ${currentStatus}.`,
      );
    }

    const allowedNext: Record<
      LifecycleStatus,
      ReadonlyArray<LifecycleStatus>
    > = {
      DRAFT: ['PUBLISHED', 'CANCELLED'],
      PUBLISHED: ['ONGOING', 'CANCELLED'],
      ONGOING: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    const candidates = allowedNext[currentStatus];
    if (!candidates.includes(nextStatus)) {
      throw new ForbiddenException(
        `Invalid ${entityName} status transition: ${currentStatus} -> ${nextStatus}.`,
      );
    }
  }

  // =====================
  // Role Management
  // =====================

  /**
   * Check if a user is a manager for a given hackathon.
   */
  async isHackathonManager(
    hackathonId: string,
    userId: string,
  ): Promise<boolean> {
    const role = await prisma.hackathonUserRoleEntity.findFirst({
      where: {
        hackathonId,
        userId,
        role: 'MANAGER',
      },
      select: { id: true },
    });
    return !!role;
  }

  /**
   * Assert that a hackathon exists, is editable (DRAFT status),
   * and the user has permission to write (owner OR admin OR manager).
   * @returns The hackathon if all checks pass.
   */
  async assertHackathonWritableByUser(id: string, userId: string) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { id },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    // Check permission: owner OR admin OR manager
    if (hackathon.ownerId !== userId) {
      const isAdmin = await this.isAdminUser(userId);
      if (!isAdmin) {
        const isManager = await this.isHackathonManager(id, userId);
        if (!isManager) {
          throw new ForbiddenException(
            'You are not allowed to edit this hackathon.',
          );
        }
      }
    }

    const status = hackathon.status as LifecycleStatus;
    if (status !== 'DRAFT') {
      throw new ForbiddenException(
        'You can only edit a hackathon in DRAFT status.',
      );
    }

    return hackathon;
  }

  /**
   * Get all roles for a hackathon (owner + managers + evaluators).
   */
  async getHackathonRoles(hackathonId: string) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { id: hackathonId },
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
        userRoles: {
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
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!hackathon) throw new NotFoundException('Hackathon not found');

    const managers = hackathon.userRoles
      .filter((r) => r.role === 'MANAGER')
      .map((r) => ({
        id: r.user.id,
        email: r.user.email,
        firstName: r.user.firstName,
        lastName: r.user.lastName,
        imageUrl: r.user.imageUrl,
        role: r.role as 'MANAGER' | 'EVALUATOR',
        assignedAt: r.createdAt.toISOString(),
      }));

    const evaluators = hackathon.userRoles
      .filter((r) => r.role === 'EVALUATOR')
      .map((r) => ({
        id: r.user.id,
        email: r.user.email,
        firstName: r.user.firstName,
        lastName: r.user.lastName,
        imageUrl: r.user.imageUrl,
        role: r.role as 'MANAGER' | 'EVALUATOR',
        assignedAt: r.createdAt.toISOString(),
      }));

    return {
      owner: hackathon.owner,
      managers,
      evaluators,
    };
  }

  /**
   * Add a role to a hackathon (owner/admin only).
   * @param hackathonId The hackathon ID
   * @param email The email of the user to add
   * @param role The role to assign (MANAGER or EVALUATOR)
   * @param currentUserId The user performing the action
   */
  async addHackathonRole(
    hackathonId: string,
    email: string,
    role: 'MANAGER' | 'EVALUATOR',
    currentUserId: string,
  ) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { id: hackathonId },
      select: { id: true, ownerId: true },
    });

    if (!hackathon) throw new NotFoundException('Hackathon not found');

    // Only owner or admin can add roles
    if (hackathon.ownerId !== currentUserId) {
      const isAdmin = await this.isAdminUser(currentUserId);
      if (!isAdmin) {
        throw new ForbiddenException(
          'Only the owner or admin can manage roles.',
        );
      }
    }

    // Lookup user by email
    const normalizedEmail = email.toLowerCase().trim();
    const targetUser = await prisma.userEntity.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!targetUser) {
      throw new BadRequestException(
        `No user found with email: ${normalizedEmail}`,
      );
    }

    // Cannot add owner as manager/evaluator
    if (targetUser.id === hackathon.ownerId) {
      throw new BadRequestException(
        'Cannot assign a role to the hackathon owner.',
      );
    }

    // Check if role already exists (idempotent - return success)
    const existingRole = await prisma.hackathonUserRoleEntity.findUnique({
      where: {
        hackathonId_userId_role: {
          hackathonId,
          userId: targetUser.id,
          role,
        },
      },
    });

    if (existingRole) {
      // Return early, already exists
      return {
        message: `User is already a ${role.toLowerCase()} for this hackathon.`,
        alreadyExists: true,
      };
    }

    await prisma.hackathonUserRoleEntity.create({
      data: {
        hackathonId,
        userId: targetUser.id,
        role,
        createdById: currentUserId,
      },
    });

    return {
      message: `Successfully added ${targetUser.firstName || targetUser.email} as ${role.toLowerCase()}.`,
      alreadyExists: false,
    };
  }

  /**
   * Remove a role from a hackathon (owner/admin only).
   * @param hackathonId The hackathon ID
   * @param email The email of the user to remove
   * @param role The role to remove (MANAGER or EVALUATOR)
   * @param currentUserId The user performing the action
   */
  async removeHackathonRole(
    hackathonId: string,
    email: string,
    role: 'MANAGER' | 'EVALUATOR',
    currentUserId: string,
  ) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { id: hackathonId },
      select: { id: true, ownerId: true },
    });

    if (!hackathon) throw new NotFoundException('Hackathon not found');

    // Only owner or admin can remove roles
    if (hackathon.ownerId !== currentUserId) {
      const isAdmin = await this.isAdminUser(currentUserId);
      if (!isAdmin) {
        throw new ForbiddenException(
          'Only the owner or admin can manage roles.',
        );
      }
    }

    // Lookup user by email
    const normalizedEmail = email.toLowerCase().trim();
    const targetUser = await prisma.userEntity.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!targetUser) {
      throw new BadRequestException(
        `No user found with email: ${normalizedEmail}`,
      );
    }

    // Attempt to delete the role
    const deleteResult = await prisma.hackathonUserRoleEntity.deleteMany({
      where: {
        hackathonId,
        userId: targetUser.id,
        role,
      },
    });

    if (deleteResult.count === 0) {
      throw new NotFoundException(
        `User does not have the ${role.toLowerCase()} role for this hackathon.`,
      );
    }

    return {
      message: `Successfully removed ${targetUser.firstName || targetUser.email} as ${role.toLowerCase()}.`,
    };
  }

  // =====================
  // Registrations (Teams) for Dashboard
  // =====================

  /**
   * Check if a user has permission to view hackathon registrations (owner/admin/manager).
   */
  private async hasViewRegistrationsPermission(
    ownerId: string,
    userId: string,
    hackathonId: string,
  ): Promise<boolean> {
    if (ownerId === userId) return true;
    const isAdmin = await this.isAdminUser(userId);
    if (isAdmin) return true;
    const isManager = await this.isHackathonManager(hackathonId, userId);
    return isManager;
  }

  /**
   * List all team registrations for a hackathon by slug (owner/manager/admin only).
   * Returns team data enriched with leader profile information and round submission statuses.
   */
  async listHackathonRegistrationsBySlug(
    slug: string,
    requesterUserId: string,
  ) {
    // Find hackathon by slug
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug },
      select: { id: true, ownerId: true },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    // Check permission
    const hasPermission = await this.hasViewRegistrationsPermission(
      hackathon.ownerId,
      requesterUserId,
      hackathon.id,
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to view registrations for this hackathon.',
      );
    }

    // Get all rounds for this hackathon
    const rounds = await prisma.roundEntity.findMany({
      where: { hackathonId: hackathon.id },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        order: true,
        roundType: true,
        startsAt: true,
        endsAt: true,
        status: true,
      },
    });

    // Query all teams with leader onboarding data and round submissions
    const teams = await prisma.teamEntity.findMany({
      where: { hackathonId: hackathon.id },
      include: {
        leader: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
            onboardingProfile: {
              include: {
                college: {
                  select: {
                    id: true,
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
          select: { id: true },
        },
        roundSubmissions: {
          select: {
            id: true,
            roundId: true,
            submittedAt: true,
            payload: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map to dashboard-friendly format
    return {
      hackathonId: hackathon.id,
      rounds: rounds.map((r) => ({
        id: r.id,
        name: r.name,
        order: r.order,
        roundType: r.roundType,
        startsAt: r.startsAt,
        endsAt: r.endsAt,
        status: r.status,
      })),
      teams: teams.map((team) => {
        const leader = team.leader;
        const profile = leader.onboardingProfile;

        // Derive university/institution from leader
        let university = '';
        if (profile) {
          if (profile.college) {
            university = profile.college.name;
          } else if (profile.schoolName) {
            university = profile.schoolName;
          } else if (profile.companyName) {
            university = profile.companyName;
          }
        }

        // Derive location from leader
        let location = '';
        if (profile) {
          const parts: string[] = [];
          if (profile.locationCity) parts.push(profile.locationCity);
          if (profile.locationState) parts.push(profile.locationState);
          if (profile.locationCountry) parts.push(profile.locationCountry);
          location = parts.join(', ');
        }

        // Build round submission status map
        const roundSubmissions = team.roundSubmissions.reduce(
          (acc, sub) => {
            acc[sub.roundId] = {
              submissionId: sub.id,
              submittedAt: sub.submittedAt,
              payload: sub.payload,
            };
            return acc;
          },
          {} as Record<
            string,
            { submissionId: string; submittedAt: Date | null; payload: unknown }
          >,
        );

        return {
          teamId: team.id,
          teamName: team.name,
          memberCount: team.members.length + 1, // +1 for leader
          maxSize: team.maxSize,
          createdAt: team.createdAt,
          leader: {
            id: leader.id,
            email: leader.email,
            firstName: leader.firstName,
            lastName: leader.lastName,
            imageUrl: leader.imageUrl,
            university,
            location,
          },
          roundSubmissions,
        };
      }),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Approval & Registration Control
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Submit hackathon for approval.
   * - Sets status to PUBLISHED and approvalStatus to PENDING.
   * - Requires owner/admin/manager permission.
   */
  async submitForApproval(id: string, userId: string, note?: string) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { id },
      select: { id: true, ownerId: true, status: true, approvalStatus: true },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    const hasPermission = await this.hasViewRegistrationsPermission(
      hackathon.ownerId,
      userId,
      id,
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'You are not allowed to submit this hackathon for approval.',
      );
    }

    // Update status to PUBLISHED and approvalStatus to PENDING
    return prisma.hackathonEntity.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        approvalStatus: 'PENDING',
        approvalSubmittedAt: new Date(),
        approvalApprovedAt: null,
        approvalRejectedAt: null,
        approvalNote: note,
      },
      select: {
        id: true,
        status: true,
        approvalStatus: true,
        approvalSubmittedAt: true,
      },
    });
  }

  /**
   * Update approval status (admin only).
   * - Approves or rejects a hackathon.
   */
  async updateApprovalStatus(
    id: string,
    approvalStatus: 'APPROVED' | 'REJECTED',
    userId: string,
    note?: string,
  ) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { id },
      select: { id: true, approvalStatus: true },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    // Admin-only check
    const isAdmin = await this.isAdminUser(userId);
    if (!isAdmin) {
      throw new ForbiddenException(
        'Only admins can approve or reject hackathons.',
      );
    }

    const now = new Date();
    return prisma.hackathonEntity.update({
      where: { id },
      data: {
        approvalStatus,
        approvalApprovedAt: approvalStatus === 'APPROVED' ? now : null,
        approvalRejectedAt: approvalStatus === 'REJECTED' ? now : null,
        approvalNote: note,
      },
      select: {
        id: true,
        approvalStatus: true,
        approvalApprovedAt: true,
        approvalRejectedAt: true,
        approvalNote: true,
      },
    });
  }

  /**
   * Update registration paused status.
   * - Requires owner/admin/manager permission.
   */
  async updateRegistrationPaused(
    id: string,
    isRegistrationPaused: boolean,
    userId: string,
  ) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { id },
      select: { id: true, ownerId: true },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    const hasPermission = await this.hasViewRegistrationsPermission(
      hackathon.ownerId,
      userId,
      id,
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'You are not allowed to modify this hackathon.',
      );
    }

    return prisma.hackathonEntity.update({
      where: { id },
      data: { isRegistrationPaused },
      select: {
        id: true,
        isRegistrationPaused: true,
      },
    });
  }

  /**
   * Get registration answers for a team (owner/manager/admin only).
   * Returns form fields and all team members' answers grouped for display.
   */
  async getTeamRegistrationAnswers(
    slug: string,
    teamId: string,
    requesterUserId: string,
  ) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug },
      select: { id: true, ownerId: true },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    const hasPermission = await this.hasViewRegistrationsPermission(
      hackathon.ownerId,
      requesterUserId,
      hackathon.id,
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to view registration answers.',
      );
    }

    const team = await prisma.teamEntity.findUnique({
      where: { id: teamId },
      include: {
        leader: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
        members: {
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
        },
      },
    });

    if (!team) throw new NotFoundException('Team not found');
    if (team.hackathonId !== hackathon.id) {
      throw new NotFoundException('Team not found in this hackathon');
    }

    const registrationForm = await prisma.registrationFormEntity.findUnique({
      where: { hackathonId: hackathon.id },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
      },
    });

    const fields = registrationForm?.fields ?? [];

    const allUserIds = [team.leaderId, ...team.members.map((m) => m.userId)];

    const submissions =
      await prisma.hackathonRegistrationSubmissionEntity.findMany({
        where: {
          hackathonId: hackathon.id,
          userId: { in: allUserIds },
        },
        include: {
          answers: {
            include: {
              field: true,
            },
          },
        },
      });

    const submissionByUserId = new Map(submissions.map((s) => [s.userId, s]));

    const respondents = [
      {
        userId: team.leader.id,
        email: team.leader.email,
        firstName: team.leader.firstName,
        lastName: team.leader.lastName,
        imageUrl: team.leader.imageUrl,
        isLeader: true,
        answers: this.formatAnswersForUser(
          submissionByUserId.get(team.leaderId),
          fields,
        ),
      },
      ...team.members.map((member) => ({
        userId: member.user.id,
        email: member.user.email,
        firstName: member.user.firstName,
        lastName: member.user.lastName,
        imageUrl: member.user.imageUrl,
        isLeader: false,
        answers: this.formatAnswersForUser(
          submissionByUserId.get(member.userId),
          fields,
        ),
      })),
    ];

    return {
      fields: fields.map((f) => ({
        id: f.id,
        label: f.label,
        type: f.type,
        order: f.order,
        options: f.options,
        required: f.required,
      })),
      respondents,
    };
  }

  private formatAnswersForUser(
    submission:
      | {
          answers: Array<{
            fieldId: string;
            valueText: string | null;
            valueJson: unknown;
          }>;
        }
      | undefined,
    fields: Array<{ id: string }>,
  ): Array<{ fieldId: string; value: string | null }> {
    if (!submission) {
      return fields.map((f) => ({ fieldId: f.id, value: null }));
    }

    const answerMap = new Map(submission.answers.map((a) => [a.fieldId, a]));

    return fields.map((f) => {
      const answer = answerMap.get(f.id);
      if (!answer) return { fieldId: f.id, value: null };

      if (answer.valueText !== null) {
        return { fieldId: f.id, value: answer.valueText };
      }
      if (answer.valueJson !== null) {
        if (Array.isArray(answer.valueJson)) {
          return { fieldId: f.id, value: answer.valueJson.join(', ') };
        }
        return { fieldId: f.id, value: String(answer.valueJson) };
      }
      return { fieldId: f.id, value: null };
    });
  }
}
