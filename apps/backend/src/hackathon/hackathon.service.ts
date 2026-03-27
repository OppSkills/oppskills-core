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
import { AnalyticsService } from 'src/analytics/analytics.service';
import { Logger } from '../_utils/logger';
import { DELETED_RESOURCE_OWNER_ID } from '../_utils/constants';

type LifecycleStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED';

type AccessLevelValue = 'ADMIN' | 'USER' | 'VIEWER';

/**
 * Get min team size from participant type.
 * For absolute values, returns the same as max.
 * For range values, returns the minimum value.
 */
function getMinSizeFromParticipantType(participantType: string): number {
  switch (participantType) {
    case 'INDIVIDUAL':
      return 1;
    case 'TEAM_OF_2':
      return 2;
    case 'TEAM_OF_3':
      return 3;
    case 'TEAM_OF_4':
      return 4;
    case 'TEAM_OF_5':
      return 5;
    case 'TEAM_OF_6':
      return 6;
    case 'MORE_THAN_6':
      return 10;
    case 'TEAM_OF_2_3':
      return 2;
    case 'TEAM_OF_2_4':
      return 2;
    case 'TEAM_OF_3_4':
      return 3;
    case 'TEAM_OF_3_5':
      return 3;
    case 'TEAM_OF_4_5':
      return 4;
    case 'TEAM_OF_4_6':
      return 4;
    case 'TEAM_OF_5_6':
      return 5;
    default:
      return 4;
  }
}

/** Default attendee eligibility when not provided. */
const DEFAULT_ATTENDEE_ELIGIBILITY: HackathonAttendeeEligibilityValue[] = [
  'EVERYONE_CAN_APPLY',
];

@Injectable()
export class HackathonService {
  private readonly logger = new Logger(HackathonService.name);
  /**
   * Create a hackathon as a user.
   * - If `festivalId` is null/undefined => standalone hackathon.
   * - If `rounds` is not provided, no default rounds are created (organizers add them later).
   */

  constructor(private readonly analyticsService: AnalyticsService) { }

  async createHackathon(dto: CreateHackathonDto, userId: string) {
    this.logger.log(
      `Creating hackathon for user ${userId} with payload: ${JSON.stringify(dto)}`,
    );
    const normalizedFestivalId =
      typeof dto.festivalId === 'string' && dto.festivalId.trim().length > 0
        ? dto.festivalId.trim()
        : undefined;

    if (normalizedFestivalId) {
      const festival = await prisma.festivalEntity.findUnique({
        where: { id: normalizedFestivalId },
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
          festivalId: normalizedFestivalId ?? null,
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
      where: {
        isDeleted: false,
        ...(input.festivalId ? { festivalId: input.festivalId } : {}),
      },
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
  async listPublicHackathons(
    input: {
      festivalId?: string;
      page?: number;
      appendResults?: boolean;
      take?: number;
      search?: string;
      filterMode?: 'UPCOMING' | 'PAST';
      modes?: string[];
      status?: string[];
      eventDates?: string[];
      eligibility?: string[];
      sort?: string;
    } = {},
  ) {
    const now = new Date();
    const baseWhere: Record<string, any> = {
      isDeleted: false,
      status: { in: ['PUBLISHED', 'ONGOING'] },
      approvalStatus: 'APPROVED',
    };

    if (input.festivalId) {
      baseWhere.festivalId = input.festivalId;
    }

    const conditions: any[] = [];

    // 1. Search Query
    if (input.search) {
      conditions.push({
        OR: [
          { name: { contains: input.search, mode: 'insensitive' } },
          { description: { contains: input.search, mode: 'insensitive' } },
          { locationCity: { contains: input.search, mode: 'insensitive' } },
        ],
      });
    }

    // 2. Filter Mode (UPCOMING / PAST) - Existing logic
    if (input.filterMode === 'UPCOMING') {
      conditions.push({
        OR: [
          { registrationDeadline: { gt: now } },
          { registrationDeadline: null },
        ],
      });
    } else if (input.filterMode === 'PAST') {
      conditions.push({
        registrationDeadline: { lt: now },
      });
    }

    // 3. Status Filters (Frontend: Upcoming, Recent)
    if (input.status && input.status.length > 0) {
      const statusConditions: any[] = [];
      if (input.status.includes('Upcoming')) {
        statusConditions.push({
          OR: [{ startDate: { gt: now } }, { status: 'PUBLISHED' }],
        });
      }
      if (input.status.includes('Recent')) {
        statusConditions.push({
          OR: [{ endDate: { lt: now } }, { status: 'COMPLETED' }],
        });
      }
      if (statusConditions.length > 0) {
        conditions.push({ OR: statusConditions });
      }
    }

    // 4. Location (Modes) Filters (Frontend: Online, In Person)
    if (input.modes && input.modes.length > 0) {
      const modeConditions: any[] = [];
      if (input.modes.includes('Online')) {
        modeConditions.push({
          OR: [
            { mode: { equals: 'online', mode: 'insensitive' } },
            { locationType: { in: ['VIRTUAL', 'ONLINE'] } },
          ],
        });
      }
      if (input.modes.includes('In Person')) {
        modeConditions.push({
          OR: [
            { mode: { in: ['offline', 'hybrid'], mode: 'insensitive' } },
            { locationType: { in: ['PHYSICAL', 'OFFLINE', 'IN_PERSON', 'HYBRID'] } },
          ],
        });
      }
      if (modeConditions.length > 0) {
        conditions.push({ OR: modeConditions });
      }
    }

    // 5. Event Date Filters
    if (input.eventDates && input.eventDates.length > 0) {
      const getDateBoundaries = (offset = 0, unit: 'week' | 'month') => {
        const start = new Date(now);
        if (unit === 'week') {
          start.setDate(now.getDate() - now.getDay() + offset * 7);
          start.setHours(0, 0, 0, 0);
          const end = new Date(start);
          end.setDate(start.getDate() + 7);
          return { start, end };
        } else {
          const s = new Date(now.getFullYear(), now.getMonth() + offset, 1);
          const e = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59, 999);
          return { start: s, end: e };
        }
      };

      const dateConditions: any[] = [];
      input.eventDates.forEach((d) => {
        let bounds;
        if (d === 'This week') bounds = getDateBoundaries(0, 'week');
        if (d === 'Next week') bounds = getDateBoundaries(1, 'week');
        if (d === 'This month') bounds = getDateBoundaries(0, 'month');
        if (d === 'Next month') bounds = getDateBoundaries(1, 'month');

        if (bounds) {
          dateConditions.push({
            startDate: { gte: bounds.start, lt: bounds.end },
          });
        }
      });

      if (dateConditions.length > 0) {
        conditions.push({ OR: dateConditions });
      }
    }

    // 6. Eligibility Filters
    if (input.eligibility && input.eligibility.length > 0) {
      const eligibilityValues: any[] = [];
      if (input.eligibility.includes('School')) eligibilityValues.push('SCHOOL_STUDENTS');
      if (input.eligibility.includes('UG') || input.eligibility.includes('PG')) {
        eligibilityValues.push('COLLEGE_STUDENTS');
      }
      if (input.eligibility.includes('Open')) eligibilityValues.push('EVERYONE_CAN_APPLY');

      if (eligibilityValues.length > 0) {
        conditions.push({
          attendeeEligibility: { hasSome: eligibilityValues },
        });
      }
    }

    if (conditions.length > 0) {
      baseWhere.AND = conditions;
    }

    // 7. Sorting Logic
    let orderBy: any = { createdAt: 'desc' }; // Default
    if (input.sort) {
      switch (input.sort) {
        case 'recently_added':
          orderBy = { createdAt: 'desc' };
          break;
        case 'submission_date':
          orderBy = { registrationDeadline: 'asc' };
          break;
        case 'price_amount':
          orderBy = [{ isFree: 'desc' }, { entryFeeAmount: 'asc' }];
          break;
        case 'most_relevant':
        default:
          // If only 'Recent' is selected, default to latest first. 
          // Otherwise (Upcoming or Both), soonest first.
          if (input.status?.length === 1 && input.status[0] === 'Recent') {
            orderBy = { startDate: 'desc' };
          } else {
            orderBy = { startDate: 'asc' };
          }
          break;
      }
    }

    // Pagination logic
    // Callers can pass `take` directly to override the default (e.g. for merged pagination).
    const take =
      input.take != null
        ? input.take
        : String(input.appendResults) === 'true' || input.appendResults === true
          ? 40
          : 20;
    const page = input.page ? Math.max(1, Number(input.page)) : 1;
    const skip = (page - 1) * take;

    // We fetch take + 1 to determine if there are more results
    const hackathons = await prisma.hackathonEntity.findMany({
      where: baseWhere,
      skip,
      take: take + 1,
      orderBy,
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
        views: true,
        impressions: true,
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
            submissionConfig: true,
          },
          orderBy: { order: 'asc' },
        },
        // Prize breakdown is public
        prizeBreakdown: {
          select: { id: true, position: true, amount: true, description: true },
          orderBy: { amount: 'desc' },
        },
      },
    });

    // Determine if there's further results
    const further = hackathons.length > take;
    const items = further ? hackathons.slice(0, take) : hackathons;

    // Track impressions for all returned hackathons (type 'opportunity')
    Promise.all(
      items.map((hackathon) =>
        this.analyticsService.trackPostImpression(
          'opportunity',
          hackathon.slug,
        ),
      ),
    ).catch((err) => {
      this.logger.error('Failed to track impressions', err);
    });

    return { items, further };
  }

  /**
   * Get a public hackathon by slug (PUBLISHED/ONGOING + APPROVED only).
   * Returns sanitized data without teams, participants, or PII.
   */
  async getPublicHackathonBySlug(slug: string) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug, isDeleted: false },
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
        chargeMode: true,
        feeBearer: true,
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
        views: true,
        impressions: true,
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
            submissionConfig: true,
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
        attachments: {
          select: {
            id: true,
            fileName: true,
            publicUrl: true,
            mimeType: true,
            sizeBytes: true,
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
    this.analyticsService.trackPageView('opportunity', slug);

    return hackathon;
  }

  /**
   * Get a public hackathon by ID (PUBLISHED/ONGOING + APPROVED only).
   * Returns sanitized data without teams, participants, or PII.
   */
  async getPublicHackathonById(id: string) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { id, isDeleted: false },
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
        views: true,
        impressions: true,
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
            submissionConfig: true,
          },
          orderBy: { order: 'asc' },
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            publicUrl: true,
            mimeType: true,
            sizeBytes: true,
          },
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

    this.analyticsService.trackPageView('opportunity', hackathon.slug);

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
        isDeleted: false,
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
      where: { id, isDeleted: false },
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
      where: { slug, isDeleted: false },
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
      where: { id, isDeleted: false },
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

    const normalizedFestivalId =
      typeof dto.festivalId === 'string' && dto.festivalId.trim().length > 0
        ? dto.festivalId.trim()
        : undefined;

    if (normalizedFestivalId) {
      const festival = await prisma.festivalEntity.findUnique({
        where: { id: normalizedFestivalId },
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
        festivalId: normalizedFestivalId ?? null,
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
        chargeMode: dto.chargeMode ?? undefined,
        feeBearer: dto.feeBearer ?? undefined,
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
        freeCollegeIds: dto.freeCollegeIds ?? undefined,

        // New eligibility & team settings
        attendeeEligibility: dto.attendeeEligibility,
        maxTeams: dto.maxTeams,
      },
      include: this.getHackathonIncludeClause(),
    });
  }

  async deleteHackathon(id: string, userId: string) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { id, isDeleted: false },
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

    await prisma.hackathonEntity.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        ownerId: DELETED_RESOURCE_OWNER_ID,
      },
    });

    return { message: 'Hackathon deleted successfully.' };
  }

  async updateHackathonStatus(
    id: string,
    nextStatus: LifecycleStatus,
    userId: string,
  ) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { id, isDeleted: false },
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

    const updateData: Prisma.HackathonEntityUpdateInput = {
      status: nextStatus,
    };
    if (nextStatus === 'DRAFT') {
      updateData.approvalStatus = 'PENDING';
      updateData.approvalSubmittedAt = null;
      updateData.approvalApprovedAt = null;
      updateData.approvalRejectedAt = null;
      updateData.approvalNote = null;
    }

    return prisma.hackathonEntity.update({
      where: { id },
      data: updateData,
    });
  }

  async registerForHackathon(hackathonId: string, userId: string) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { id: hackathonId, isDeleted: false },
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
   * Update rounds of a hackathon using diff/upsert approach.
   * - Owner/admin/manager can edit.
   * - In DRAFT: full edit allowed.
   * - After publish: only future rounds can be edited/deleted/created.
   *   Rounds that have already started cannot be modified.
   */
  async updateHackathonRounds(
    id: string,
    dto: UpdateHackathonRoundsDto,
    userId: string,
  ) {
    const hackathon = await this.assertHackathonRoundsEditableByUser(
      id,
      userId,
    );
    const now = new Date();
    const isDraft = hackathon.status === 'DRAFT';

    // Load existing rounds with submission counts
    const existingRounds = await prisma.roundEntity.findMany({
      where: { hackathonId: id },
      include: {
        _count: { select: { teamSubmissions: true } },
      },
    });
    const existingById = new Map(existingRounds.map((r) => [r.id, r]));

    // Validate all incoming rounds
    for (const round of dto.rounds) {
      const startsAt = this.parseDate(round.startsAt, 'rounds.startsAt');
      const endsAt = this.parseDate(round.endsAt, 'rounds.endsAt');
      if (endsAt.getTime() < startsAt.getTime()) {
        throw new BadRequestException(
          `Round "${round.name}": end time must be after start time.`,
        );
      }
    }

    // Split incoming rounds into updates vs creates
    const incomingWithId = dto.rounds.filter((r) => r.id);
    const incomingNew = dto.rounds.filter((r) => !r.id);
    const incomingIds = new Set(incomingWithId.map((r) => r.id));

    // Rounds to delete: existing but not in incoming
    const toDeleteIds = existingRounds
      .filter((r) => !incomingIds.has(r.id))
      .map((r) => r.id);

    // Non-DRAFT constraints
    if (!isDraft) {
      // Check updates: cannot edit rounds that have started
      for (const round of incomingWithId) {
        const existing = existingById.get(round.id!);
        if (!existing) {
          throw new BadRequestException(
            `Round with id "${round.id}" not found.`,
          );
        }
        if (existing.startsAt.getTime() <= now.getTime()) {
          throw new BadRequestException(
            `Round "${existing.name}" has already started and cannot be edited.`,
          );
        }
      }

      // Check creates: new rounds must start in the future
      for (const round of incomingNew) {
        const startsAt = this.parseDate(round.startsAt, 'rounds.startsAt');
        if (startsAt.getTime() <= now.getTime()) {
          throw new BadRequestException(
            `New round "${round.name}" must start in the future.`,
          );
        }
      }

      // Check deletes: cannot delete started rounds or rounds with submissions
      for (const roundId of toDeleteIds) {
        const existing = existingById.get(roundId)!;
        if (existing.startsAt.getTime() <= now.getTime()) {
          throw new BadRequestException(
            `Round "${existing.name}" has already started and cannot be deleted.`,
          );
        }
        if (existing._count.teamSubmissions > 0) {
          throw new BadRequestException(
            `Round "${existing.name}" has submissions and cannot be deleted.`,
          );
        }
      }
    }

    // Apply changes in transaction
    await prisma.$transaction(async (tx) => {
      // Delete removed rounds
      if (toDeleteIds.length > 0) {
        await tx.roundEntity.deleteMany({
          where: { id: { in: toDeleteIds } },
        });
      }

      // Update existing rounds
      for (const round of incomingWithId) {
        await tx.roundEntity.update({
          where: { id: round.id },
          data: {
            name: round.name,
            description: round.description,
            startsAt: this.parseDate(round.startsAt, 'rounds.startsAt'),
            endsAt: this.parseDate(round.endsAt, 'rounds.endsAt'),
            order: round.order,
            roundType: round.roundType,
            submissionConfig: round.submissionConfig
              ? (round.submissionConfig as Prisma.InputJsonValue)
              : Prisma.JsonNull,
          },
        });
      }

      // Create new rounds
      if (incomingNew.length > 0) {
        await tx.roundEntity.createMany({
          data: incomingNew.map((round) => ({
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
      }
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
      where: { id, isDeleted: false },
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

  private async assertHackathonRoundsEditableByUser(
    id: string,
    userId: string,
  ) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { id, isDeleted: false },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

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
    if (status === 'CANCELLED' || status === 'COMPLETED') {
      throw new ForbiddenException(
        'Cannot edit rounds for a cancelled or completed hackathon.',
      );
    }

    return hackathon;
  }

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

  async getMyTeamSubmissions(slug: string, userId: string) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug, isDeleted: false },
      include: {
        rounds: { orderBy: { order: 'asc' } },
      },
    });

    if (!hackathon) {
      throw new NotFoundException(`Hackathon with slug "${slug}" not found.`);
    }

    const team = await prisma.teamEntity.findFirst({
      where: {
        hackathonId: hackathon.id,
        OR: [{ leaderId: userId }, { members: { some: { userId } } }],
      },
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
        roundSubmissions: true,
        roundQualifications: true,
      },
    });

    if (!team) {
      return {
        team: null,
        rounds: hackathon.rounds,
        submissions: {},
        qualifications: {},
      };
    }

    const submissionsByRoundId: Record<
      string,
      (typeof team.roundSubmissions)[0]
    > = {};
    for (const sub of team.roundSubmissions) {
      submissionsByRoundId[sub.roundId] = sub;
    }

    const qualificationsByRoundId: Record<
      string,
      { qualified: boolean; qualifiedAt: Date | null }
    > = {};
    for (const qual of team.roundQualifications) {
      qualificationsByRoundId[qual.roundId] = {
        qualified: qual.qualified,
        qualifiedAt: qual.qualifiedAt,
      };
    }

    return {
      team: {
        id: team.id,
        name: team.name,
        leader: team.leader,
        members: team.members.map((m) => m.user),
        isLeader: team.leaderId === userId,
      },
      rounds: hackathon.rounds,
      submissions: submissionsByRoundId,
      qualifications: qualificationsByRoundId,
    };
  }

  async upsertRoundSubmission(
    slug: string,
    roundId: string,
    userId: string,
    dto: import('@oppskills/types').UpsertRoundSubmissionDto,
  ) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug, isDeleted: false },
      include: {
        rounds: { where: { id: roundId } },
      },
    });

    if (!hackathon) {
      throw new NotFoundException(`Hackathon with slug "${slug}" not found.`);
    }

    const round = hackathon.rounds[0];
    if (!round) {
      throw new NotFoundException(
        `Round "${roundId}" not found in this hackathon.`,
      );
    }

    const team = await prisma.teamEntity.findFirst({
      where: {
        hackathonId: hackathon.id,
        leaderId: userId,
      },
    });

    if (!team) {
      throw new ForbiddenException(
        'Only the team leader can submit. You are not leading a team in this hackathon.',
      );
    }

    const now = new Date();
    if (now < round.startsAt) {
      throw new BadRequestException(
        `Round "${round.name}" has not started yet. Submissions open on ${round.startsAt.toISOString()}.`,
      );
    }
    if (now > round.endsAt) {
      throw new BadRequestException(
        `Round "${round.name}" has ended. Submissions closed on ${round.endsAt.toISOString()}.`,
      );
    }

    const submissionConfig = round.submissionConfig as Record<
      string,
      unknown
    > | null;
    if (submissionConfig && submissionConfig.enabled === false) {
      throw new BadRequestException(
        'Submissions are not enabled for this round.',
      );
    }

    // For rounds after the first, check if team was qualified from previous round
    if (round.order > 1) {
      const previousRounds = await prisma.roundEntity.findMany({
        where: {
          hackathonId: hackathon.id,
          order: { lt: round.order },
        },
        orderBy: { order: 'desc' },
        take: 1,
      });

      if (previousRounds.length > 0) {
        const previousRound = previousRounds[0];
        const qualification =
          await prisma.teamRoundQualificationEntity.findUnique({
            where: {
              teamId_roundId: {
                teamId: team.id,
                roundId: previousRound.id,
              },
            },
          });

        if (!qualification || !qualification.qualified) {
          throw new ForbiddenException(
            `Your team must be qualified from "${previousRound.name}" to submit for "${round.name}".`,
          );
        }
      }
    }

    const maxFiles = 3;
    const maxFileSizeBytes = 50 * 1024 * 1024;

    if (dto.files && dto.files.length > maxFiles) {
      throw new BadRequestException(`Maximum ${maxFiles} files allowed.`);
    }

    if (dto.files) {
      for (const file of dto.files) {
        if (file.size > maxFileSizeBytes) {
          throw new BadRequestException(
            `File "${file.name}" exceeds maximum size of 50MB.`,
          );
        }
      }
    }

    const payload = {
      files: dto.files || [],
      note: dto.note || null,
    } as unknown as Prisma.InputJsonValue;

    const submission = await prisma.hackathonTeamRoundSubmissionEntity.upsert({
      where: {
        teamId_roundId: {
          teamId: team.id,
          roundId: round.id,
        },
      },
      create: {
        teamId: team.id,
        roundId: round.id,
        payload,
        submittedAt: now,
      },
      update: {
        payload,
        submittedAt: now,
      },
    });

    return {
      message: 'Submission saved successfully.',
      submission,
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
      feeBearer: unknown;
    },
    dto: UpdateHackathonDto & { chargeMode?: string },
  ): Promise<void> {
    const isPricingFieldChanging =
      (dto.isFree !== undefined && dto.isFree !== currentHackathon.isFree) ||
      (dto.entryFeeAmount !== undefined &&
        String(dto.entryFeeAmount) !==
        String(currentHackathon.entryFeeAmount)) ||
      ('chargeMode' in dto && dto.chargeMode !== currentHackathon.chargeMode) ||
      ('feeBearer' in dto && dto.feeBearer !== currentHackathon.feeBearer);

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
        'Cannot change pricing fields (isFree, entryFeeAmount, chargeMode, feeBearer) after registration has started.',
      );
    }
  }

  private async isAdminUser(userId: string): Promise<boolean> {
    const user = await prisma.userEntity.findUnique({
      where: { id: userId },
      select: { accessLevel: true },
    });
    return user?.accessLevel === 'ADMIN';
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
      PUBLISHED: ['DRAFT', 'ONGOING', 'CANCELLED'],
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
      where: { id, isDeleted: false },
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
      where: { id: hackathonId, isDeleted: false },
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
      where: { id: hackathonId, isDeleted: false },
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
      where: { id: hackathonId, isDeleted: false },
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
      where: { slug, isDeleted: false },
      select: { id: true, ownerId: true, participantType: true },
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
          select: {
            id: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
                onboardingProfile: {
                  select: {
                    collegeCurrentYear: true,
                    skills: true,
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
          },
        },
        roundSubmissions: {
          select: {
            id: true,
            roundId: true,
            submittedAt: true,
            payload: true,
          },
        },
        roundQualifications: {
          select: {
            roundId: true,
            qualified: true,
            qualifiedAt: true,
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

        // Build round qualification status map
        const roundQualifications = team.roundQualifications.reduce(
          (acc, qual) => {
            acc[qual.roundId] = {
              qualified: qual.qualified,
              qualifiedAt: qual.qualifiedAt,
            };
            return acc;
          },
          {} as Record<
            string,
            { qualified: boolean; qualifiedAt: Date | null }
          >,
        );

        // Calculate minSize based on hackathon participantType
        const minSize = getMinSizeFromParticipantType(
          hackathon.participantType,
        );

        return {
          teamId: team.id,
          teamName: team.name,
          memberCount: team.members.length + 1, // +1 for leader
          maxSize: team.maxSize,
          minSize,
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
          roundQualifications,
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
      where: { id, isDeleted: false },
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
   * Set qualification status for a team in a specific round.
   * Only owner/admin/manager can qualify/disqualify teams.
   */
  async setTeamRoundQualification(
    slug: string,
    roundId: string,
    teamId: string,
    qualified: boolean,
    userId: string,
  ) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug, isDeleted: false },
      select: { id: true, ownerId: true },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    await this.assertHackathonRoundsEditableByUser(hackathon.id, userId);

    const round = await prisma.roundEntity.findFirst({
      where: { id: roundId, hackathonId: hackathon.id },
    });
    if (!round) throw new NotFoundException('Round not found');

    const team = await prisma.teamEntity.findFirst({
      where: { id: teamId, hackathonId: hackathon.id },
    });
    if (!team) throw new NotFoundException('Team not found');

    const result = await prisma.teamRoundQualificationEntity.upsert({
      where: { teamId_roundId: { teamId, roundId } },
      create: {
        teamId,
        roundId,
        qualified,
        qualifiedAt: new Date(),
        qualifiedBy: userId,
      },
      update: {
        qualified,
        qualifiedAt: new Date(),
        qualifiedBy: userId,
      },
    });

    return result;
  }

  /**
   * Bulk set qualification status for multiple teams in a round.
   */
  async bulkSetTeamRoundQualification(
    slug: string,
    roundId: string,
    teamIds: string[],
    qualified: boolean,
    userId: string,
  ) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug, isDeleted: false },
      select: { id: true, ownerId: true },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    await this.assertHackathonRoundsEditableByUser(hackathon.id, userId);

    const round = await prisma.roundEntity.findFirst({
      where: { id: roundId, hackathonId: hackathon.id },
    });
    if (!round) throw new NotFoundException('Round not found');

    const teams = await prisma.teamEntity.findMany({
      where: { id: { in: teamIds }, hackathonId: hackathon.id },
      select: { id: true },
    });
    const validTeamIds = teams.map((t) => t.id);

    const results = await prisma.$transaction(
      validTeamIds.map((teamId) =>
        prisma.teamRoundQualificationEntity.upsert({
          where: { teamId_roundId: { teamId, roundId } },
          create: {
            teamId,
            roundId,
            qualified,
            qualifiedAt: new Date(),
            qualifiedBy: userId,
          },
          update: {
            qualified,
            qualifiedAt: new Date(),
            qualifiedBy: userId,
          },
        }),
      ),
    );

    return { updated: results.length, teamIds: validTeamIds };
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
      where: { id, isDeleted: false },
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
      where: { id, isDeleted: false },
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
      where: { slug, isDeleted: false },
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
