import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { prisma } from '@oppskills/db';
import type { Prisma } from '@oppskills/db';
import type {
  CreateEventDto,
  UpdateEventDto,
  EventLifecycleStatusValue,
  EventUserRoleValue,
} from '@oppskills/types';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
import { Logger } from '../_utils/logger';
import { DELETED_RESOURCE_OWNER_ID } from '../_utils/constants';
import { EMAIL_EVENTS } from '../email/email.events';
import type { EventJoinedEventPayload } from '../email/email.events';
import { AnalyticsService } from 'src/analytics/analytics.service';

type AccessLevelValue = 'ADMIN' | 'USER' | 'VIEWER';
type LifecycleStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);
  private readonly GOOGLE_SHEETS_ENABLED_EVENT_ID = 'cmjn3pgst0001oz01flu5hcgw';
  private readonly EVENT_PASS_EMAIL_DISABLED_EVENT_ID =
    'cmjn3pgst0001oz01flu5hcgw';

  constructor(
    private readonly googleSheetsService: GoogleSheetsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly analyticsService: AnalyticsService,
  ) { }

  /**
   * Create an event as a user.
   * - If `festivalId` is null/undefined => standalone event.
   * - Initial status is DRAFT.
   */
  async createEvent(dto: CreateEventDto, userId: string) {
    const startDate = this.parseDate(dto.startDate, 'startDate');
    const endDate = this.parseDate(dto.endDate, 'endDate');
    if (endDate.getTime() < startDate.getTime()) {
      throw new BadRequestException('endDate must be >= startDate.');
    }

    this.assertLocationValid(dto.location);

    const slug = await this.buildEventSlug(dto.slug, dto.name);

    const registrationDeadline = dto.registrationDeadline
      ? this.parseDate(dto.registrationDeadline, 'registrationDeadline')
      : null;

    return prisma.eventEntity.create({
      data: {
        slug,
        name: dto.name,
        description: dto.description,
        bannerImageUrl: dto.bannerImageUrl,

        startDate,
        endDate,

        festivalId: dto.festivalId,

        locationType: dto.location?.type,
        locationAddress: dto.location?.address,
        locationCity: dto.location?.city,
        locationVirtualLink: dto.location?.virtualLink,

        registrationDeadline,

        maxUsers: dto.maxUsers,

        isFree: dto.isFree ?? true,
        entryFeeAmount: dto.entryFeeAmount,
        currency: dto.currency ?? 'INR',

        visibility: dto.visibility ?? 'PUBLIC',
        eventType: dto.eventType,
        attendeeEligibility: dto.attendeeEligibility ?? [],

        organizationName: dto.organizationName,
        organizationLogoUrl: dto.organizationLogoUrl,

        ownerId: userId,
        status: 'DRAFT',
      },
      include: {
        owner: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        festival: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }

  /**
   * List public events (PUBLISHED/ONGOING + APPROVED only).
   * Returns sanitized data without participants or roles.
   */
  async listPublicEvents(
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

    // 2. Filter Mode (UPCOMING / PAST)
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
        statusConditions.push({ startDate: { gt: now } });
      }
      if (input.status.includes('Recent')) {
        // Recent = created within the last 30 days
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        statusConditions.push({ createdAt: { gte: thirtyDaysAgo } });
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
            { locationType: { in: ['VIRTUAL'] } },
            { locationVirtualLink: { not: null } },
          ],
        });
      }
      if (input.modes.includes('In Person')) {
        modeConditions.push({
          locationType: { in: ['PHYSICAL'] },
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
          const e = new Date(
            now.getFullYear(),
            now.getMonth() + offset + 1,
            0,
            23,
            59,
            59,
            999,
          );
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
      if (input.eligibility.includes('School'))
        eligibilityValues.push('SCHOOL_STUDENTS');
      if (
        input.eligibility.includes('UG') ||
        input.eligibility.includes('PG')
      ) {
        eligibilityValues.push('COLLEGE_STUDENTS');
      }
      if (input.eligibility.includes('Open'))
        eligibilityValues.push('EVERYONE_CAN_APPLY');

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
          // If only 'Recent' is selected, default to latest created first.
          // Otherwise, soonest starting first.
          if (input.status?.length === 1 && input.status[0] === 'Recent') {
            orderBy = { createdAt: 'desc' };
          } else {
            orderBy = { startDate: 'asc' };
          }
          break;
      }
    }

    // Pagination logic
    // Default 10 results. If appendResults=true, then 20 results.
    // Callers can pass `take` directly to override the default (e.g. for merged pagination).
    const isAppended = String(input.appendResults) === 'true';

    const take = input.take != null ? input.take : isAppended ? 20 : 10;
    const page = input.page ? Math.max(1, Number(input.page)) : 1;
    const skip = (page - 1) * take;

    // Query events with sanitized fields - no participants or registrant PII
    // We fetch take + 1 to determine if there are more results
    const events = await prisma.eventEntity.findMany({
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
        locationType: true,
        locationCity: true,
        locationAddress: true,
        locationVirtualLink: true,
        isFree: true,
        entryFeeAmount: true,
        currency: true,
        feeBearer: true,
        visibility: true,
        eventType: true,
        registrationCount: true,
        maxUsers: true,
        registrationDeadline: true,
        isRegistrationPaused: true,
        organizationName: true,
        organizationLogoUrl: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        attendeeEligibility: true,
        createdAt: true,
        // Owner info (public: name only, no email exposed in list)
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
        // Prize breakdown is public
        prizeBreakdown: {
          select: { id: true, position: true, amount: true, description: true },
          orderBy: { amount: 'desc' },
        },
      },
    });

    // Determine if there's further results
    const further = events.length > take;
    const items = events.slice(0, take);

    // Track impressions for all returned events
    Promise.all(
      items.map((event) =>
        this.analyticsService.trackPostImpression('event', event.slug),
      ),
    ).catch((err) => {
      this.logger.error('Failed to track impressions', err);
    });

    return { items, further };
  }

  /**
   * Get a public event by slug (PUBLISHED/ONGOING + APPROVED only).
   * Returns sanitized data without participants, roles, or registrant PII.
   */
  async getPublicEventBySlug(slug: string) {
    const event = await prisma.eventEntity.findUnique({
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
        locationType: true,
        locationCity: true,
        locationAddress: true,
        locationVirtualLink: true,
        isFree: true,
        entryFeeAmount: true,
        currency: true,
        feeBearer: true,
        visibility: true,
        impressions: true,
        eventType: true,
        registrationCount: true,
        maxUsers: true,
        registrationDeadline: true,
        isRegistrationPaused: true,
        organizationName: true,
        organizationLogoUrl: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        attendeeEligibility: true,
        createdAt: true,
        // Owner info (public: first/last name, imageUrl, email)
        // Note: Owner email is intentionally included for contact purposes
        // as requested in the event detail page requirements
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
            email: true,
          },
        },
        festival: {
          select: { id: true, name: true, slug: true },
        },
        // Attachments are public
        attachments: {
          select: {
            id: true,
            storageKey: true,
            publicUrl: true,
            fileName: true,
            mimeType: true,
            sizeBytes: true,
          },
        },
        // Registration form fields are public (for registration UI)
        registrationForm: {
          include: { fields: { orderBy: { order: 'asc' } } },
        },
        // Prize breakdown is public
        prizeBreakdown: {
          select: { id: true, position: true, amount: true, description: true },
          orderBy: { amount: 'desc' },
        },
        // NOTE: NO participants - this is the key security fix
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Only return PUBLISHED/ONGOING + APPROVED events publicly
    const isPubliclyVisible =
      (event.status === 'PUBLISHED' || event.status === 'ONGOING') &&
      event.approvalStatus === 'APPROVED';

    if (!isPubliclyVisible) {
      throw new NotFoundException('Event not found or not publicly visible');
    }

    this.analyticsService.trackPageView('event', slug);

    return event;
  }

  /**
   * Get a public event by ID (PUBLISHED/ONGOING + APPROVED only).
   * Returns sanitized data without participants, roles, or registrant PII.
   */
  async getPublicEventById(id: string) {
    const event = await prisma.eventEntity.findUnique({
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
        locationType: true,
        locationCity: true,
        locationAddress: true,
        locationVirtualLink: true,
        isFree: true,
        entryFeeAmount: true,
        currency: true,
        feeBearer: true,
        visibility: true,
        eventType: true,
        registrationCount: true,
        maxUsers: true,
        registrationDeadline: true,
        isRegistrationPaused: true,
        organizationName: true,
        organizationLogoUrl: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        attendeeEligibility: true,
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
        attachments: {
          select: {
            id: true,
            storageKey: true,
            publicUrl: true,
            fileName: true,
            mimeType: true,
            sizeBytes: true,
          },
        },
        registrationForm: {
          include: { fields: { orderBy: { order: 'asc' } } },
        },
        prizeBreakdown: {
          select: { id: true, position: true, amount: true, description: true },
          orderBy: { amount: 'desc' },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const isPubliclyVisible =
      (event.status === 'PUBLISHED' || event.status === 'ONGOING') &&
      event.approvalStatus === 'APPROVED';

    if (!isPubliclyVisible) {
      throw new NotFoundException('Event not found or not publicly visible');
    }

    this.analyticsService.trackPageView('event', event.slug);

    return event;
  }

  /**
   * List events for the dashboard for a given user.
   *
   * Visibility rules:
   * - Owner can see their events
   * - Managers can see events they manage
   */
  async listMyEvents(userId: string) {
    // Get events where user is owner
    const ownedEvents = await prisma.eventEntity.findMany({
      where: { ownerId: userId, isDeleted: false },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        approvalStatus: true,
        startDate: true,
        endDate: true,
        registrationCount: true,
        maxUsers: true,
        registrationDeadline: true,
        isRegistrationPaused: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get events where user has a manager role
    const managedRoles = await prisma.eventUserRoleEntity.findMany({
      where: {
        userId,
        role: 'MANAGER',
      },
      select: {
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            approvalStatus: true,
            startDate: true,
            endDate: true,
            registrationCount: true,
            maxUsers: true,
            registrationDeadline: true,
            isRegistrationPaused: true,
          },
        },
      },
    });

    const ownedSet = new Set(ownedEvents.map((e) => e.id));

    const result: Array<{
      id: string;
      name: string;
      slug: string;
      status: string;
      approvalStatus: string | null;
      startDate: Date;
      endDate: Date;
      registrationCount: number;
      maxUsers: number | null;
      registrationDeadline: Date | null;
      isRegistrationPaused: boolean;
      role: 'OWNER' | 'MANAGER';
    }> = ownedEvents.map((e) => ({ ...e, role: 'OWNER' as const }));

    for (const { event } of managedRoles) {
      if (!ownedSet.has(event.id)) {
        result.push({ ...event, role: 'MANAGER' as const });
      }
    }

    return result;
  }

  /**
   * Get a single event by ID for dashboard (full data, permission required).
   */
  async getEventByIdForDashboard(id: string, requesterUserId: string) {
    const event = await prisma.eventEntity.findUnique({
      where: { id, isDeleted: false },
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
        festival: {
          select: { id: true, name: true, slug: true },
        },
        participants: {
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
        attachments: true,
        registrationForm: {
          include: { fields: { orderBy: { order: 'asc' } } },
        },
        prizeBreakdown: {
          orderBy: { amount: 'desc' },
        },
      },
    });
    if (!event) throw new NotFoundException('Event not found');

    // Verify permission - owner, admin, or manager can view full data
    const hasPermission = await this.hasEditPermission(
      event.ownerId,
      requesterUserId,
      id,
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        "You do not have permission to view this event's full details.",
      );
    }

    return event;
  }

  /**
   * Get a single event by slug for dashboard (full data, permission required).
   */
  async getEventBySlugForDashboard(slug: string, requesterUserId: string) {
    const event = await prisma.eventEntity.findUnique({
      where: { slug, isDeleted: false },
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
        festival: {
          select: { id: true, name: true, slug: true },
        },
        participants: {
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
        attachments: true,
        registrationForm: {
          include: { fields: { orderBy: { order: 'asc' } } },
        },
        prizeBreakdown: {
          orderBy: { amount: 'desc' },
        },
      },
    });
    if (!event) throw new NotFoundException('Event not found');

    // Verify permission - owner, admin, or manager can view full data
    const hasPermission = await this.hasEditPermission(
      event.ownerId,
      requesterUserId,
      event.id,
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        "You do not have permission to view this event's full details.",
      );
    }

    return event;
  }

  /**
   * Get a single event by ID (internal use - kept for backwards compatibility).
   * @deprecated Use getEventByIdForDashboard for authenticated access or getPublicEventById for public access.
   */
  async getEventById(id: string) {
    const event = await prisma.eventEntity.findUnique({
      where: { id, isDeleted: false },
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
        festival: {
          select: { id: true, name: true, slug: true },
        },
        participants: {
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
        attachments: true,
        registrationForm: {
          include: { fields: { orderBy: { order: 'asc' } } },
        },
        prizeBreakdown: {
          orderBy: { amount: 'desc' },
        },
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  /**
   * Get a single event by slug (internal use - kept for backwards compatibility).
   * @deprecated Use getEventBySlugForDashboard for authenticated access or getPublicEventBySlug for public access.
   */
  async getEventBySlug(slug: string) {
    const event = await prisma.eventEntity.findUnique({
      where: { slug, isDeleted: false },
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
        festival: {
          select: { id: true, name: true, slug: true },
        },
        participants: {
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
        attachments: true,
        registrationForm: {
          include: { fields: { orderBy: { order: 'asc' } } },
        },
        prizeBreakdown: {
          orderBy: { amount: 'desc' },
        },
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  /**
   * Update an event (owner, admin, or manager).
   * - DRAFT events can be fully edited.
   * - PUBLISHED+APPROVED events can have basic info edited, but this triggers re-approval.
   */
  async updateEvent(id: string, dto: UpdateEventDto, userId: string) {
    const event = await prisma.eventEntity.findUnique({
      where: { id, isDeleted: false },
      select: {
        id: true,
        ownerId: true,
        status: true,
        approvalStatus: true,
        name: true,
        slug: true,
        description: true,
        bannerImageUrl: true,
        startDate: true,
        endDate: true,
      },
    });
    if (!event) throw new NotFoundException('Event not found');

    const hasPermission = await this.hasEditPermission(
      event.ownerId,
      userId,
      id,
    );
    if (!hasPermission) {
      throw new ForbiddenException('You are not allowed to edit this event.');
    }

    // Determine if basic info is being changed (triggers re-approval)
    const isBasicInfoChange =
      (dto.name !== undefined && dto.name !== event.name) ||
      (dto.slug !== undefined && dto.slug !== event.slug) ||
      (dto.description !== undefined &&
        dto.description !== event.description) ||
      (dto.bannerImageUrl !== undefined &&
        dto.bannerImageUrl !== event.bannerImageUrl);

    // For non-DRAFT events, only allow edits if they are basic info changes (which will reset approval)
    const isDraft = event.status === 'DRAFT';
    const isApproved = event.approvalStatus === 'APPROVED';

    if (!isDraft && !isBasicInfoChange) {
      throw new ForbiddenException(
        'Only DRAFT events can be fully edited. For published events, only basic info changes are allowed.',
      );
    }

    // Parse dates if provided
    const startDate = dto.startDate
      ? this.parseDate(dto.startDate, 'startDate')
      : event.startDate;
    const endDate = dto.endDate
      ? this.parseDate(dto.endDate, 'endDate')
      : event.endDate;

    if (endDate.getTime() < startDate.getTime()) {
      throw new BadRequestException('endDate must be >= startDate.');
    }

    this.assertLocationValid(dto.location);
    this.assertPassSettingsValid(dto);

    const name = dto.name ?? event.name;
    const slug = dto.slug
      ? await this.buildEventSlug(dto.slug, name, id)
      : undefined;

    const registrationDeadline = dto.registrationDeadline
      ? this.parseDate(dto.registrationDeadline, 'registrationDeadline')
      : undefined;

    // Build update data
    const updateData: Record<string, unknown> = {
      slug,
      name: dto.name,
      description: dto.description,
      bannerImageUrl: dto.bannerImageUrl,
      festivalId: dto.festivalId,

      startDate,
      endDate,

      locationType: dto.location?.type,
      locationAddress: dto.location?.address,
      locationCity: dto.location?.city,
      locationVirtualLink: dto.location?.virtualLink,

      registrationDeadline,

      maxUsers: dto.maxUsers,

      isFree: dto.isFree,
      entryFeeAmount: dto.entryFeeAmount,
      currency: dto.currency,

      visibility: dto.visibility,
      eventType: dto.eventType,
      attendeeEligibility: dto.attendeeEligibility,

      organizationName: dto.organizationName,
      organizationLogoUrl: dto.organizationLogoUrl,

      // Pass Settings
      passSendingMode: dto.passSendingMode,
      collegeRestrictionEnabled: dto.collegeRestrictionEnabled,
      allowedCollegeIds: dto.allowedCollegeIds,
      allowedEmailDomains: dto.allowedEmailDomains,
      collegeMatchMode: dto.collegeMatchMode,
    };

    // If an approved event's basic info is being changed, reset approval status
    if (!isDraft && isApproved && isBasicInfoChange) {
      updateData.approvalStatus = 'PENDING';
      updateData.approvalSubmittedAt = new Date();
      updateData.approvalApprovedAt = null;
      updateData.approvalRejectedAt = null;
      updateData.approvalNote = null;
    }

    return prisma.eventEntity.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        festival: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }

  /**
   * Delete an event.
   */
  async deleteEvent(id: string, userId: string) {
    const event = await prisma.eventEntity.findUnique({
      where: { id, isDeleted: false },
      select: { id: true, ownerId: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    if (event.ownerId !== userId) {
      const isAdmin = await this.isAdminUser(userId);
      if (!isAdmin) {
        throw new ForbiddenException(
          'You are not allowed to delete this event.',
        );
      }
    }

    await prisma.eventEntity.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        ownerId: DELETED_RESOURCE_OWNER_ID,
      },
    });
    return { message: 'Event deleted successfully.' };
  }

  /**
   * Update event status.
   */
  async updateEventStatus(
    id: string,
    nextStatus: LifecycleStatus,
    userId: string,
  ) {
    const event = await prisma.eventEntity.findUnique({
      where: { id, isDeleted: false },
      select: { id: true, ownerId: true, status: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    // Permission: owner OR admin OR manager
    const hasPermission = await this.hasEditPermission(
      event.ownerId,
      userId,
      id,
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'You are not allowed to change this event status.',
      );
    }

    const currentStatus = event.status as LifecycleStatus;
    this.assertLifecycleTransitionAllowed(currentStatus, nextStatus);

    const updateData: Prisma.EventEntityUpdateInput = { status: nextStatus };
    if (nextStatus === 'DRAFT') {
      updateData.approvalStatus = 'PENDING';
      updateData.approvalSubmittedAt = null;
      updateData.approvalApprovedAt = null;
      updateData.approvalRejectedAt = null;
      updateData.approvalNote = null;
    }

    return prisma.eventEntity.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Join an event.
   * - Owner cannot join their own event.
   * - Cannot double-join.
   * - Enforces maxUsers limit.
   * - Only allowed for PUBLISHED or ONGOING events.
   * - Must be APPROVED.
   * - Must not have registrations paused.
   * - Lazy-creates default registration fields at registration time.
   * - Optionally accepts registration form answers (for both defaults and custom questions).
   */
  async joinEvent(
    eventId: string,
    userId: string,
    answers?: Array<{ fieldId: string; value: string | number | string[] }>,
  ) {
    const event = await prisma.eventEntity.findUnique({
      where: { id: eventId, isDeleted: false },
      select: {
        id: true,
        name: true,
        slug: true,
        startDate: true,
        eventType: true,
        locationType: true,
        locationAddress: true,
        locationCity: true,
        locationVirtualLink: true,
        ownerId: true,
        status: true,
        approvalStatus: true,
        isRegistrationPaused: true,
        maxUsers: true,
        registrationCount: true,
        registrationDeadline: true,
        passSendingMode: true,
        collegeRestrictionEnabled: true,
        allowedCollegeIds: true,
        allowedEmailDomains: true,
        collegeMatchMode: true,
        isFree: true,
        freeCollegeIds: true,
      },
    });
    if (!event) throw new NotFoundException('Event not found');

    // Check status
    if (event.status !== 'PUBLISHED' && event.status !== 'ONGOING') {
      throw new BadRequestException('Event is not accepting registrations.');
    }

    // Check approval status
    if (event.approvalStatus !== 'APPROVED') {
      throw new BadRequestException('Event has not been approved yet.');
    }

    // Check if registrations are paused
    if (event.isRegistrationPaused) {
      throw new BadRequestException(
        'Event registrations are currently paused.',
      );
    }

    // Check deadline
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      throw new BadRequestException('Registration deadline has passed.');
    }

    // Owner cannot join their own event
    if (event.ownerId === userId) {
      throw new BadRequestException('You cannot join your own event.');
    }

    // Check if already joined
    const existing = await prisma.eventParticipantEntity.findUnique({
      where: {
        eventId_userId: { eventId, userId },
      },
    });
    if (existing) {
      throw new ConflictException('You have already joined this event.');
    }

    // For paid events, verify payment has been captured
    // (Payment flow creates participant via EventPaymentService.verifyPayment)
    if (!event.isFree) {
      // Check if user is from a free college
      let isCollegeFree = false;
      if (event.freeCollegeIds && event.freeCollegeIds.length > 0) {
        const userProfile = await prisma.userOnboardingProfileEntity.findUnique(
          {
            where: { userId },
            select: { collegeId: true },
          },
        );
        if (
          userProfile?.collegeId &&
          event.freeCollegeIds.includes(userProfile.collegeId)
        ) {
          isCollegeFree = true;
        }
      }

      if (!isCollegeFree) {
        // Check for captured payment
        const capturedPayment = await prisma.eventPaymentEntity.findFirst({
          where: {
            eventId,
            payerUserId: userId,
            paymentStatus: 'CAPTURED',
          },
        });

        if (!capturedPayment) {
          throw new BadRequestException(
            'Payment required. Please complete payment before registering for this event.',
          );
        }
      }
    }

    // Fetch user's onboarding profile to determine userCategory
    const userOnboardingProfile =
      await prisma.userOnboardingProfileEntity.findUnique({
        where: { userId },
        select: { userCategory: true },
      });
    const userCategory = userOnboardingProfile?.userCategory;

    // Default gender options matching Prisma Gender enum
    const DEFAULT_GENDER_OPTIONS = [
      'MALE',
      'FEMALE',
      'OTHER',
      'PREFER_NOT_TO_SAY',
    ];

    // Define default fields that should be lazy-created
    // Order is negative so they sort before custom fields (which use 0+)
    type DefaultFieldDef = {
      label: string;
      type: 'TEXT' | 'EMAIL' | 'PHONE_NO' | 'OPTIONS';
      order: number;
      required: boolean;
      options: string[];
      frontendId: string; // The ID sent by frontend (e.g., "default-name")
    };

    const defaultFieldDefs: DefaultFieldDef[] = [
      {
        frontendId: 'default-name',
        label: 'Name',
        type: 'TEXT',
        order: -50,
        required: true,
        options: [],
      },
      {
        frontendId: 'default-email',
        label: 'Email',
        type: 'EMAIL',
        order: -40,
        required: true,
        options: [],
      },
      {
        frontendId: 'default-phone',
        label: 'Phone No.',
        type: 'PHONE_NO',
        order: -30,
        required: true,
        options: [],
      },
      {
        frontendId: 'default-gender',
        label: 'Gender',
        type: 'OPTIONS',
        order: -20,
        required: true,
        options: DEFAULT_GENDER_OPTIONS,
      },
    ];

    // Add conditional identity field based on userCategory
    if (userCategory === 'SCHOOL_STUDENT') {
      defaultFieldDefs.push({
        frontendId: 'default-school-name',
        label: 'School Name',
        type: 'TEXT',
        order: -10,
        required: true,
        options: [],
      });
    } else if (
      userCategory === 'COLLEGE_STUDENT' ||
      userCategory === 'PROFESSIONAL_SCHOOL_STUDENT' ||
      userCategory === 'FRESHER'
    ) {
      defaultFieldDefs.push({
        frontendId: 'default-college-name',
        label: 'College Name',
        type: 'TEXT',
        order: -9,
        required: true,
        options: [],
      });
    } else if (userCategory === 'WORKING_PROFESSIONAL') {
      defaultFieldDefs.push({
        frontendId: 'default-company-name',
        label: 'Company Name',
        type: 'TEXT',
        order: -8,
        required: false,
        options: [],
      });
    } else {
      // Fallback: if no category, ask for College Name
      defaultFieldDefs.push({
        frontendId: 'default-college-name',
        label: 'College Name',
        type: 'TEXT',
        order: -9,
        required: true,
        options: [],
      });
    }

    // Upsert registration form if missing
    let regForm = await prisma.eventRegistrationFormEntity.findUnique({
      where: { eventId },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!regForm) {
      regForm = await prisma.eventRegistrationFormEntity.create({
        data: { eventId },
        include: {
          fields: {
            orderBy: { order: 'asc' },
          },
        },
      });
    }

    const registrationFormId = regForm.id;

    // Lazy-create missing default fields
    // Build a map of existing fields by label for matching
    const existingFieldsByLabel = new Map<
      string,
      (typeof regForm.fields)[number]
    >(regForm.fields.map((f) => [f.label.toLowerCase(), f]));

    // Track used orders to avoid unique constraint violations
    const usedOrders = new Set(regForm.fields.map((f) => f.order));

    // Map frontend field IDs to real DB field IDs
    const frontendIdToDbId = new Map<string, string>();

    for (const def of defaultFieldDefs) {
      const existingField = existingFieldsByLabel.get(def.label.toLowerCase());

      if (existingField) {
        // Field already exists - map the frontend ID to the existing DB ID
        frontendIdToDbId.set(def.frontendId, existingField.id);

        // If it's the Gender field and options are empty, update with default options
        if (
          def.label.toLowerCase() === 'gender' &&
          existingField.type === 'OPTIONS' &&
          (!existingField.options || existingField.options.length === 0)
        ) {
          await prisma.eventRegistrationFieldEntity.update({
            where: { id: existingField.id },
            data: { options: DEFAULT_GENDER_OPTIONS },
          });
        }
      } else {
        // Field doesn't exist - create it
        // Find an available order if the desired one is taken (handles race conditions)
        let orderToUse = def.order;
        while (usedOrders.has(orderToUse)) {
          orderToUse -= 1;
        }
        usedOrders.add(orderToUse);

        try {
          const newField = await prisma.eventRegistrationFieldEntity.create({
            data: {
              registrationFormId,
              label: def.label,
              type: def.type,
              required: def.required,
              order: orderToUse,
              options: def.options,
            },
          });
          frontendIdToDbId.set(def.frontendId, newField.id);
        } catch (error: any) {
          // Handle race condition: if another request created the field concurrently,
          // refetch and use the existing field
          if (error?.code === 'P2002') {
            const refetchedForm =
              await prisma.eventRegistrationFormEntity.findUnique({
                where: { eventId },
                include: {
                  fields: {
                    orderBy: { order: 'asc' },
                  },
                },
              });
            const refetchedField = refetchedForm?.fields.find(
              (f) => f.label.toLowerCase() === def.label.toLowerCase(),
            );
            if (refetchedField) {
              frontendIdToDbId.set(def.frontendId, refetchedField.id);
            } else {
              // If still not found, try with a different order
              let retryOrder = orderToUse - 1;
              while (usedOrders.has(retryOrder)) {
                retryOrder -= 1;
              }
              const newField = await prisma.eventRegistrationFieldEntity.create(
                {
                  data: {
                    registrationFormId,
                    label: def.label,
                    type: def.type,
                    required: def.required,
                    order: retryOrder,
                    options: def.options,
                  },
                },
              );
              frontendIdToDbId.set(def.frontendId, newField.id);
            }
          } else {
            throw error;
          }
        }
      }
    }

    // Update existing field IDs for non-default fields (already in DB with real IDs)
    for (const existingField of regForm.fields) {
      if (!existingField.id.startsWith('default-')) {
        frontendIdToDbId.set(existingField.id, existingField.id);
      }
    }

    // Re-fetch the fields after potential creations/updates
    const updatedRegForm = await prisma.eventRegistrationFormEntity.findUnique({
      where: { eventId },
      include: {
        fields: {
          select: {
            id: true,
            label: true,
            type: true,
            required: true,
            options: true,
            order: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    const registrationFields = updatedRegForm?.fields ?? [];

    // Transform answers: replace frontend "default-*" IDs with real DB IDs
    const providedAnswers = (answers ?? [])
      .map((a) => ({
        fieldId: frontendIdToDbId.get(a.fieldId) ?? a.fieldId,
        value: a.value,
      }))
      .filter((a) => {
        // If it still starts with 'default-', it means it wasn't in our current mapping
        // (likely a field from a different user category that's no longer relevant or shouldn't be handled here)
        return !a.fieldId.startsWith('default-');
      });

    const providedFieldIds = new Set(providedAnswers.map((a) => a.fieldId));

    // Identity field labels - only the one matching user's category should be required
    const identityFieldLabels = new Set([
      'school name',
      'college name',
      'company name',
    ]);

    // Determine which identity field label is required for this user
    const requiredIdentityLabel =
      userCategory === 'SCHOOL_STUDENT'
        ? 'school name'
        : userCategory === 'WORKING_PROFESSIONAL'
          ? 'company name'
          : 'college name'; // Default for COLLEGE_STUDENT, FRESHER, PROFESSIONAL_SCHOOL_STUDENT, or null

    // Check for required fields
    for (const field of registrationFields) {
      if (field.required) {
        const fieldLabelLower = field.label.toLowerCase();

        // Skip identity fields that don't match the user's category
        if (
          identityFieldLabels.has(fieldLabelLower) &&
          fieldLabelLower !== requiredIdentityLabel
        ) {
          continue;
        }

        if (!providedFieldIds.has(field.id)) {
          throw new BadRequestException(`Field "${field.label}" is required.`);
        }
        // Also check that required field answer is not empty
        const answer = providedAnswers.find((a) => a.fieldId === field.id);
        if (answer) {
          const value = answer.value;
          const isEmpty =
            value === '' ||
            value === null ||
            value === undefined ||
            (Array.isArray(value) && value.length === 0);
          if (isEmpty) {
            throw new BadRequestException(
              `Field "${field.label}" is required and cannot be empty.`,
            );
          }
        }
      }
    }

    // Validate each provided answer
    if (providedAnswers.length > 0) {
      const fieldMap = new Map<string, (typeof registrationFields)[number]>(
        registrationFields.map((f) => [f.id, f]),
      );

      for (const answer of providedAnswers) {
        const field = fieldMap.get(answer.fieldId);
        if (!field) {
          throw new BadRequestException(`Unknown field ID: ${answer.fieldId}`);
        }

        // Reject ATTACHMENTS type for now
        if (field.type === 'ATTACHMENTS') {
          throw new BadRequestException(`Attachments are not supported yet.`);
        }

        // Type validation
        const value = answer.value;
        switch (field.type) {
          case 'TEXT':
          case 'EMAIL':
          case 'PHONE_NO':
            if (typeof value !== 'string') {
              throw new BadRequestException(
                `Field "${field.label}" must be a string.`,
              );
            }
            if (field.type === 'EMAIL' && value.length > 0) {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(value)) {
                throw new BadRequestException(
                  `Field "${field.label}" must be a valid email.`,
                );
              }
            }
            break;
          case 'NUMBER':
            if (typeof value !== 'number' && typeof value !== 'string') {
              throw new BadRequestException(
                `Field "${field.label}" must be a number.`,
              );
            }
            break;
          case 'OPTIONS': {
            // Use field options, or default gender options for Gender field
            const effectiveOptions =
              field.label.toLowerCase() === 'gender' &&
                (!field.options || field.options.length === 0)
                ? DEFAULT_GENDER_OPTIONS
                : field.options;

            if (Array.isArray(value)) {
              for (const v of value) {
                if (!effectiveOptions.includes(v)) {
                  throw new BadRequestException(
                    `Invalid option "${v}" for field "${field.label}".`,
                  );
                }
              }
            } else if (typeof value === 'string') {
              if (value.length > 0 && !effectiveOptions.includes(value)) {
                throw new BadRequestException(
                  `Invalid option "${value}" for field "${field.label}".`,
                );
              }
            }
            break;
          }
        }
      }
    }

    // Fetch user data for email and validation
    const user = await prisma.userEntity.findUnique({
      where: { id: userId },
      select: {
        email: true,
        firstName: true,
        onboardingProfile: {
          select: {
            collegeId: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    // NEW: Validate college restrictions
    if (event.collegeRestrictionEnabled) {
      this.validateCollegeEligibility(event, user);
    }

    // Check capacity (use transaction for atomic update)
    const result = await prisma.$transaction(async (tx) => {
      // Re-fetch within transaction to ensure consistency
      const currentEvent = await tx.eventEntity.findUnique({
        where: { id: eventId, isDeleted: false },
        select: { maxUsers: true, registrationCount: true },
      });
      if (!currentEvent) throw new NotFoundException('Event not found');

      if (
        currentEvent.maxUsers !== null &&
        currentEvent.registrationCount >= currentEvent.maxUsers
      ) {
        throw new BadRequestException('Event is at full capacity.');
      }

      // Create participant and increment count
      // Set approval fields based on pass sending mode
      const isImmediate = event.passSendingMode === 'IMMEDIATE';
      const participant = await tx.eventParticipantEntity.create({
        data: {
          eventId,
          userId,
          approved: isImmediate,
          approvedAt: isImmediate ? new Date() : null,
          passEmailSent: false, // Will be set by email listener
        },
      });

      await tx.eventEntity.update({
        where: { id: eventId },
        data: { registrationCount: { increment: 1 } },
      });

      // Create submission and answers if provided
      let submissionId: string | undefined;
      if (providedAnswers.length > 0 && registrationFields.length > 0) {
        const submission = await tx.eventRegistrationSubmissionEntity.create({
          data: {
            eventId,
            userId,
            participantId: participant.id,
          },
        });
        submissionId = submission.id;

        // Create answers
        const answerData = providedAnswers.map((a) => ({
          submissionId: submission.id,
          fieldId: a.fieldId,
          valueText:
            typeof a.value === 'string' ? a.value : JSON.stringify(a.value),
          valueJson: a.value,
        }));

        await tx.eventRegistrationAnswerEntity.createMany({
          data: answerData,
        });
      }

      // After successful registration, log to Google Sheets asynchronously
      // Pass submissionId so it can read from DB-saved answers for consistency
      this.logToGoogleSheets(
        eventId,
        userId,
        providedAnswers,
        submissionId,
      ).catch((err) => {
        console.error('Failed to log to Google Sheets:', err);
      });

      return { participantId: participant.id };
    });

    // Format event date and time for email
    const eventDate = event.startDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const eventTime = event.startDate.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Build location string
    let eventLocation: string | undefined;
    if (event.locationType === 'PHYSICAL') {
      eventLocation = [event.locationAddress, event.locationCity]
        .filter(Boolean)
        .join(', ');
    } else if (event.locationType === 'VIRTUAL' && event.locationVirtualLink) {
      eventLocation = 'Online Event';
    }

    // Emit event.participant.registered for pass email sending (skip for specific events)
    if (eventId !== this.EVENT_PASS_EMAIL_DISABLED_EVENT_ID) {
      this.eventEmitter.emit('event.participant.registered', {
        eventId: event.id,
        userId,
        participantId: result.participantId,
        passSendingMode: event.passSendingMode,
      });
    }

    return { message: 'Successfully joined the event.' };
  }

  /**
   * Validates if a user is eligible to register for an event based on college restrictions.
   */
  private validateCollegeEligibility(
    event: {
      collegeRestrictionEnabled: boolean;
      allowedCollegeIds: string[];
      allowedEmailDomains: string[];
      collegeMatchMode: string;
    },
    user: {
      email: string;
      onboardingProfile?: { collegeId: string | null } | null;
    },
  ): void {
    if (!event.collegeRestrictionEnabled) return;

    const { allowedCollegeIds, allowedEmailDomains, collegeMatchMode } = event;

    const userCollegeId = user.onboardingProfile?.collegeId;
    const userEmail = user.email;

    // Extract domain from email
    const emailDomain = userEmail.split('@')[1]?.toLowerCase();

    // Check matches based on mode
    const collegeMatches =
      userCollegeId && allowedCollegeIds.includes(userCollegeId);
    const emailMatches =
      emailDomain &&
      allowedEmailDomains.some(
        (domain) => emailDomain === domain.toLowerCase(),
      );

    let isEligible = false;

    switch (collegeMatchMode) {
      case 'PROFILE_ONLY':
        isEligible = !!collegeMatches;
        break;
      case 'EMAIL_ONLY':
        isEligible = !!emailMatches;
        break;
      case 'EITHER_OR':
        isEligible = !!collegeMatches || !!emailMatches;
        break;
      case 'BOTH_REQUIRED':
        isEligible = !!collegeMatches && !!emailMatches;
        break;
    }

    if (!isEligible) {
      throw new ForbiddenException(
        'Registration is not allowed for this event.',
      );
    }
  }

  /**
   * Approves a participant for an event and triggers pass email sending.
   */
  async approveParticipant(
    eventId: string,
    participantId: string,
    approverId: string,
  ): Promise<void> {
    // Verify approver has permission (owner/manager)
    const event = await this.getEventByIdForDashboard(eventId, approverId);

    const participant = await prisma.eventParticipantEntity.findUnique({
      where: { id: participantId },
      include: {
        user: true,
        event: true,
      },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    if (participant.eventId !== eventId) {
      throw new BadRequestException(
        'Participant does not belong to this event',
      );
    }

    if (participant.approved) {
      throw new BadRequestException('Participant already approved');
    }

    // Update participant
    await prisma.eventParticipantEntity.update({
      where: { id: participantId },
      data: {
        approved: true,
        approvedAt: new Date(),
        approvedById: approverId,
      },
    });

    // Emit event to send pass email
    this.eventEmitter.emit('event.participant.approved', {
      participantId,
      eventId,
      userId: participant.userId,
    });
  }

  /**
   * Logs event registration to Google Sheets.
   * Writes to 'Registrations' tab with auto-headers and one column per question.
   */
  private async logToGoogleSheets(
    eventId: string,
    userId: string,
    answers: Array<{ fieldId: string; value: string | number | string[] }>,
    submissionId?: string,
  ) {
    if (eventId !== this.GOOGLE_SHEETS_ENABLED_EVENT_ID) {
      this.logger.debug(`Skipping Google Sheets logging for event ${eventId}`);
      return;
    }

    try {
      // Fetch user, event, and registration form data
      const user = await prisma.userEntity.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true },
      });
      const event = await prisma.eventEntity.findUnique({
        where: { id: eventId, isDeleted: false },
        select: { name: true },
      });

      if (!user || !event) return;

      const regForm = await prisma.eventRegistrationFormEntity.findUnique({
        where: { eventId },
        include: {
          fields: {
            select: { id: true, label: true },
            orderBy: { order: 'asc' },
          },
        },
      });

      // If submissionId provided, try to read from DB-saved answers for consistency
      let answersToLog = answers;
      if (submissionId) {
        const dbAnswers = await prisma.eventRegistrationAnswerEntity.findMany({
          where: { submissionId },
          select: { fieldId: true, valueText: true, valueJson: true },
        });
        if (dbAnswers.length > 0) {
          answersToLog = dbAnswers.map((a) => ({
            fieldId: a.fieldId,
            value: a.valueJson as string | number | string[],
          }));
        }
      }

      // Build fixed columns
      const fixedColumns: Record<string, string | number | null> = {
        timestamp: new Date().toISOString(),
        eventId: eventId,
        eventName: event.name,
        userId: userId,
        fullName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
        email: user.email,
        submissionId: submissionId ?? '',
      };

      // Build question columns with stable headers: "<label> (<fieldId>)"
      const questionColumns: Record<string, string | number | null> = {};
      const fieldInfoMap = new Map<string, string>();
      if (regForm) {
        for (const field of regForm.fields) {
          fieldInfoMap.set(field.id, field.label);
        }
      }

      for (const answer of answersToLog) {
        const label = fieldInfoMap.get(answer.fieldId) || 'Unknown';
        const headerKey = `${label} (${answer.fieldId})`;
        const val = Array.isArray(answer.value)
          ? answer.value.join(', ')
          : String(answer.value ?? '');
        questionColumns[headerKey] = val;
      }

      // Use the new appendRegistrationRow method
      await this.googleSheetsService.appendRegistrationRow(
        'Registrations',
        fixedColumns,
        questionColumns,
      );
    } catch (error) {
      console.error('Error in logToGoogleSheets:', error);
    }
  }

  /**
   * Leave an event.
   * - Decrements registrationCount.
   */
  async leaveEvent(eventId: string, userId: string) {
    const event = await prisma.eventEntity.findUnique({
      where: { id: eventId, isDeleted: false },
      select: { id: true, status: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    // Check if user is a participant
    const participant = await prisma.eventParticipantEntity.findUnique({
      where: {
        eventId_userId: { eventId, userId },
      },
    });
    if (!participant) {
      throw new BadRequestException('You are not a participant of this event.');
    }

    // Cannot leave completed or cancelled events
    if (event.status === 'COMPLETED' || event.status === 'CANCELLED') {
      throw new BadRequestException(
        `Cannot leave an event that is ${event.status.toLowerCase()}.`,
      );
    }

    return prisma.$transaction(async (tx) => {
      await tx.eventParticipantEntity.delete({
        where: { id: participant.id },
      });

      await tx.eventEntity.update({
        where: { id: eventId },
        data: { registrationCount: { decrement: 1 } },
      });

      return { message: 'Successfully left the event.' };
    });
  }

  /**
   * Check if a user is registered for an event.
   * Returns detailed status including payment and registration form completion.
   */
  async checkUserRegistration(eventId: string, userId: string) {
    const event = await prisma.eventEntity.findUnique({
      where: { id: eventId, isDeleted: false },
      select: {
        id: true,
        isFree: true,
        entryFeeAmount: true,
      },
    });
    if (!event) throw new NotFoundException('Event not found');

    const participant = await prisma.eventParticipantEntity.findUnique({
      where: {
        eventId_userId: { eventId, userId },
      },
      select: {
        id: true,
        joinedAt: true,
      },
    });

    // Check if registration answers exist
    const registrationSubmission =
      await prisma.eventRegistrationSubmissionEntity.findFirst({
        where: { eventId, userId },
        select: { id: true },
      });
    const hasRegistrationAnswers = !!registrationSubmission;

    // Check if payment exists and is captured (for paid events)
    let paymentCompleted = false;
    if (!event.isFree && event.entryFeeAmount) {
      const payment = await prisma.eventPaymentEntity.findFirst({
        where: {
          eventId,
          payerUserId: userId,
          paymentStatus: 'CAPTURED',
        },
        select: { id: true },
      });
      paymentCompleted = !!payment;
    } else {
      // Free events don't require payment
      paymentCompleted = true;
    }

    // Determine registration status:
    // - isRegistered: true only if participant exists AND answers are submitted
    // - isPaidButIncomplete: payment done but answers missing (needs to re-submit form)
    const isPaidButIncomplete =
      !!participant && paymentCompleted && !hasRegistrationAnswers;
    const isFullyRegistered =
      !!participant && paymentCompleted && hasRegistrationAnswers;

    return {
      isRegistered: isFullyRegistered,
      isPaidButIncomplete,
      hasRegistrationAnswers,
      paymentCompleted,
      participantId: participant?.id ?? null,
      registeredAt: participant?.joinedAt ?? null,
    };
  }

  /**
   * Submit registration answers for a user who has paid but is missing answers.
   * This allows paid users to complete their registration form without paying again.
   */
  async submitMissingRegistrationAnswers(
    eventId: string,
    userId: string,
    answers: Array<{ fieldId: string; value: string | number | string[] }>,
  ) {
    const event = await prisma.eventEntity.findUnique({
      where: { id: eventId, isDeleted: false },
      select: {
        id: true,
        isFree: true,
        entryFeeAmount: true,
        registrationForm: {
          include: { fields: true },
        },
      },
    });
    if (!event) throw new NotFoundException('Event not found');

    // Check if user is a participant
    const participant = await prisma.eventParticipantEntity.findUnique({
      where: {
        eventId_userId: { eventId, userId },
      },
      select: { id: true },
    });

    if (!participant) {
      throw new BadRequestException(
        'You are not registered for this event. Please complete registration first.',
      );
    }

    // Check if registration answers already exist
    const existingSubmission =
      await prisma.eventRegistrationSubmissionEntity.findFirst({
        where: { eventId, userId },
      });

    if (existingSubmission) {
      throw new BadRequestException(
        'Registration form has already been submitted.',
      );
    }

    // For paid events, verify payment was completed
    if (!event.isFree && event.entryFeeAmount) {
      const payment = await prisma.eventPaymentEntity.findFirst({
        where: {
          eventId,
          payerUserId: userId,
          paymentStatus: 'CAPTURED',
        },
        select: { id: true },
      });

      if (!payment) {
        throw new BadRequestException(
          'Payment not found. Please complete payment first.',
        );
      }
    }

    // Map frontend field IDs to DB field IDs
    // Since payment was already made, the registration form and fields should exist
    const regForm = event.registrationForm;

    // Get user's category to determine which identity field to expect
    const userOnboardingProfile =
      await prisma.userOnboardingProfileEntity.findUnique({
        where: { userId },
        select: { userCategory: true },
      });
    const userCategory = userOnboardingProfile?.userCategory;

    // Build mapping from frontend IDs to DB IDs
    const frontendIdToDbId = new Map<string, string>();

    // Map label-based matching for default fields
    const defaultFieldLabels: Record<string, string> = {
      'default-name': 'name',
      'default-email': 'email',
      'default-phone': 'phone no.',
      'default-gender': 'gender',
      'default-school-name': 'school name',
      'default-college-name': 'college name',
      'default-company-name': 'company name',
    };

    if (regForm?.fields) {
      for (const field of regForm.fields) {
        // Map existing DB field IDs directly
        frontendIdToDbId.set(field.id, field.id);

        // Also map by matching labels for default fields
        const labelLower = field.label.toLowerCase();
        for (const [frontendId, label] of Object.entries(defaultFieldLabels)) {
          if (labelLower === label) {
            frontendIdToDbId.set(frontendId, field.id);
          }
        }
      }
    }

    // Transform answers: replace frontend "default-*" IDs with real DB IDs
    const mappedAnswers = answers
      .map((a) => ({
        fieldId: frontendIdToDbId.get(a.fieldId) ?? a.fieldId,
        value: a.value,
      }))
      .filter((a) => {
        // If it still starts with 'default-', skip it (field doesn't exist or wrong category)
        return !a.fieldId.startsWith('default-');
      });

    // Create submission and save answers
    const submission = await prisma.eventRegistrationSubmissionEntity.create({
      data: {
        eventId,
        userId,
        participantId: participant.id,
      },
    });

    if (mappedAnswers.length > 0) {
      const answerData = mappedAnswers.map((a) => ({
        submissionId: submission.id,
        fieldId: a.fieldId,
        valueText:
          typeof a.value === 'string' ? a.value : JSON.stringify(a.value),
        valueJson: a.value,
      }));

      await prisma.eventRegistrationAnswerEntity.createMany({
        data: answerData,
      });
    }

    this.logger.log(
      `Saved ${mappedAnswers.length} missing registration answers for user ${userId} in event ${eventId}`,
    );

    return {
      success: true,
      message: 'Registration form submitted successfully.',
      participantId: participant.id,
    };
  }

  /**
   * List all registrations for an event by slug (owner/manager/admin only).
   * Returns participant data enriched with onboarding profile information.
   */
  async listEventRegistrationsBySlug(slug: string, requesterUserId: string) {
    // Find event by slug
    const event = await prisma.eventEntity.findUnique({
      where: { slug, isDeleted: false },
      select: { id: true, ownerId: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    // Check permission (owner, admin, or manager)
    const hasPermission = await this.hasEditPermission(
      event.ownerId,
      requesterUserId,
      event.id,
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to view registrations for this event.',
      );
    }

    // Query all participants with onboarding data
    const participants = await prisma.eventParticipantEntity.findMany({
      where: { eventId: event.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
            onboardingProfile: {
              select: {
                id: true,
                userCategory: true,
                gender: true,
                schoolName: true,
                schoolClass: true,
                companyName: true,
                jobTitle: true,
                collegeCurrentYear: true,
                locationCity: true,
                locationState: true,
                locationCountry: true,
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
        submission: {
          select: {
            id: true,
            submittedAt: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    // Map to dashboard-friendly format
    return participants.map((p) => {
      const user = p.user;
      const profile = user.onboardingProfile;

      // Derive university/institution
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

      // Derive location
      let location = '';
      if (profile) {
        const parts: string[] = [];
        if (profile.locationCity) parts.push(profile.locationCity);
        if (profile.locationState) parts.push(profile.locationState);
        if (profile.locationCountry) parts.push(profile.locationCountry);
        location = parts.join(', ');
      }

      // Derive course/category
      let course = '';
      if (profile) {
        const category = profile.userCategory;
        switch (category) {
          case 'SCHOOL_STUDENT':
            course = profile.schoolClass
              ? `School - Class ${profile.schoolClass}`
              : 'School Student';
            break;
          case 'COLLEGE_STUDENT':
          case 'PROFESSIONAL_SCHOOL_STUDENT':
            if (profile.collegeCurrentYear) {
              course = `Year ${profile.collegeCurrentYear}`;
            } else {
              course = 'College Student';
            }
            break;
          case 'WORKING_PROFESSIONAL':
            course = profile.jobTitle || 'Working Professional';
            break;
          case 'FRESHER':
            course = 'Fresher';
            break;
          default:
            course = '';
        }
      }

      return {
        id: p.id,
        name:
          [user.firstName, user.lastName].filter(Boolean).join(' ') || 'N/A',
        email: user.email,
        avatarUrl: user.imageUrl || null,
        university,
        location,
        course,
        gender: profile?.gender ?? null,
        status: p.submission ? 'Completed' : 'Incomplete',
        registeredOn: p.joinedAt.toISOString(),
        approved: p.approved,
        passEmailSent: p.passEmailSent,
        passEmailSentAt: p.passEmailSentAt?.toISOString(),
        approvedAt: p.approvedAt?.toISOString(),
      };
    });
  }

  /**
   * Get all roles for an event (owner + managers + evaluators).
   */
  async getEventRoles(eventId: string) {
    const event = await prisma.eventEntity.findUnique({
      where: { id: eventId, isDeleted: false },
      select: {
        id: true,
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
        },
      },
    });

    if (!event) throw new NotFoundException('Event not found');

    const managers = event.userRoles
      .filter((r) => r.role === 'MANAGER')
      .map((r) => ({
        id: r.user.id,
        email: r.user.email,
        firstName: r.user.firstName,
        lastName: r.user.lastName,
        imageUrl: r.user.imageUrl,
        role: r.role as EventUserRoleValue,
        assignedAt: r.createdAt.toISOString(),
      }));

    const evaluators = event.userRoles
      .filter((r) => r.role === 'EVALUATOR')
      .map((r) => ({
        id: r.user.id,
        email: r.user.email,
        firstName: r.user.firstName,
        lastName: r.user.lastName,
        imageUrl: r.user.imageUrl,
        role: r.role as EventUserRoleValue,
        assignedAt: r.createdAt.toISOString(),
      }));

    return {
      owner: event.owner,
      managers,
      evaluators,
    };
  }

  /**
   * Get all roles for an event with permission check (owner/manager/admin only).
   * Protects manager/evaluator emails from public access.
   */
  async getEventRolesWithPermission(eventId: string, requesterUserId: string) {
    const event = await prisma.eventEntity.findUnique({
      where: { id: eventId, isDeleted: false },
      select: {
        id: true,
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
        },
      },
    });

    if (!event) throw new NotFoundException('Event not found');

    // Verify permission - only owner, admin, or manager can view roles
    const hasPermission = await this.hasEditPermission(
      event.ownerId,
      requesterUserId,
      eventId,
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to view roles for this event.',
      );
    }

    const managers = event.userRoles
      .filter((r) => r.role === 'MANAGER')
      .map((r) => ({
        id: r.user.id,
        email: r.user.email,
        firstName: r.user.firstName,
        lastName: r.user.lastName,
        imageUrl: r.user.imageUrl,
        role: r.role as EventUserRoleValue,
        assignedAt: r.createdAt.toISOString(),
      }));

    const evaluators = event.userRoles
      .filter((r) => r.role === 'EVALUATOR')
      .map((r) => ({
        id: r.user.id,
        email: r.user.email,
        firstName: r.user.firstName,
        lastName: r.user.lastName,
        imageUrl: r.user.imageUrl,
        role: r.role as EventUserRoleValue,
        assignedAt: r.createdAt.toISOString(),
      }));

    return {
      owner: event.owner,
      managers,
      evaluators,
    };
  }

  /**
   * Add a role to an event (owner/admin only).
   */
  async addEventRole(
    eventId: string,
    email: string,
    role: EventUserRoleValue,
    assignedByUserId: string,
  ) {
    const event = await prisma.eventEntity.findUnique({
      where: { id: eventId, isDeleted: false },
      select: { id: true, ownerId: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    // Permission check: owner or admin
    if (event.ownerId !== assignedByUserId) {
      const isAdmin = await this.isAdminUser(assignedByUserId);
      if (!isAdmin) {
        throw new ForbiddenException(
          'You are not allowed to add roles to this event.',
        );
      }
    }

    // Find user by email
    const user = await prisma.userEntity.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
      },
    });
    if (!user)
      throw new NotFoundException(`User with email "${email}" not found.`);

    // Cannot assign role to owner
    if (user.id === event.ownerId) {
      throw new BadRequestException('Cannot assign a role to the event owner.');
    }

    // Check if role already exists
    const existing = await prisma.eventUserRoleEntity.findUnique({
      where: {
        eventId_userId_role: { eventId, userId: user.id, role },
      },
    });
    if (existing) {
      throw new ConflictException(
        `User already has the ${role} role for this event.`,
      );
    }

    await prisma.eventUserRoleEntity.create({
      data: {
        eventId,
        userId: user.id,
        role,
        createdById: assignedByUserId,
      },
    });

    return {
      message: `Role ${role} added successfully.`,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        role,
      },
    };
  }

  /**
   * Remove a role from an event (owner/admin only).
   */
  async removeEventRole(
    eventId: string,
    email: string,
    role: EventUserRoleValue,
    removedByUserId: string,
  ) {
    const event = await prisma.eventEntity.findUnique({
      where: { id: eventId, isDeleted: false },
      select: { id: true, ownerId: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    // Permission check: owner or admin
    if (event.ownerId !== removedByUserId) {
      const isAdmin = await this.isAdminUser(removedByUserId);
      if (!isAdmin) {
        throw new ForbiddenException(
          'You are not allowed to remove roles from this event.',
        );
      }
    }

    // Find user by email
    const user = await prisma.userEntity.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user)
      throw new NotFoundException(`User with email "${email}" not found.`);

    // Find and delete the role
    const existing = await prisma.eventUserRoleEntity.findUnique({
      where: {
        eventId_userId_role: { eventId, userId: user.id, role },
      },
    });
    if (!existing) {
      throw new NotFoundException(
        `User does not have the ${role} role for this event.`,
      );
    }

    await prisma.eventUserRoleEntity.delete({
      where: { id: existing.id },
    });

    return { message: `Role ${role} removed successfully.` };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Nested Update Methods (DRAFT only)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Update additional info (contact + attachments) for an event.
   * - Replaces contact info fields.
   * - Replaces attachments if provided.
   */
  async updateEventAdditionalInfo(
    id: string,
    dto: {
      additionalInfo?: {
        contact?: { name?: string; email?: string; phone?: string };
        attachments?: Array<{
          storageKey: string;
          publicUrl?: string;
          fileName?: string;
          mimeType?: string;
          sizeBytes?: number;
        }>;
      };
    },
    userId: string,
  ) {
    await this.assertEventEditableByUser(id, userId);

    const additionalInfo = dto.additionalInfo;
    const contact = additionalInfo?.contact;
    const attachments = additionalInfo?.attachments;

    return prisma.$transaction(async (tx) => {
      // Update contact info
      await tx.eventEntity.update({
        where: { id },
        data: {
          contactName: contact?.name,
          contactEmail: contact?.email,
          contactPhone: contact?.phone,
        },
      });

      // Replace attachments if provided
      if (attachments !== undefined) {
        // Delete existing attachments
        await tx.eventAttachmentEntity.deleteMany({
          where: { eventId: id },
        });

        // Create new attachments
        if (attachments.length > 0) {
          await tx.eventAttachmentEntity.createMany({
            data: attachments.map((a) => ({
              eventId: id,
              storageKey: a.storageKey,
              publicUrl: a.publicUrl,
              fileName: a.fileName,
              mimeType: a.mimeType,
              sizeBytes: a.sizeBytes,
            })),
          });
        }
      }

      return { message: 'Additional info updated successfully.' };
    });
  }

  /**
   * Update registration form for an event.
   * - Replaces the entire form (externalFormLink OR internal fields).
   */
  async updateEventRegistrationForm(
    id: string,
    dto: {
      registrationForm: {
        externalFormLink?: string;
        fields?: Array<{
          label: string;
          type: string;
          required: boolean;
          order: number;
          options?: string[];
          placeholder?: string;
        }>;
      };
    },
    userId: string,
  ) {
    await this.assertEventEditableByUser(id, userId);

    const form = dto.registrationForm;

    return prisma.$transaction(async (tx) => {
      // Find or create the registration form
      let regForm = await tx.eventRegistrationFormEntity.findUnique({
        where: { eventId: id },
      });

      if (!regForm) {
        regForm = await tx.eventRegistrationFormEntity.create({
          data: {
            eventId: id,
            externalFormLink: form.externalFormLink,
          },
        });
      } else {
        // Update external form link
        await tx.eventRegistrationFormEntity.update({
          where: { id: regForm.id },
          data: { externalFormLink: form.externalFormLink },
        });
      }

      // Replace fields if provided
      if (form.fields !== undefined) {
        // Delete existing fields
        await tx.eventRegistrationFieldEntity.deleteMany({
          where: { registrationFormId: regForm.id },
        });

        // Create new fields
        if (form.fields.length > 0) {
          await tx.eventRegistrationFieldEntity.createMany({
            data: form.fields.map((f) => ({
              registrationFormId: regForm.id,
              label: f.label,
              type: f.type as
                | 'TEXT'
                | 'PHONE_NO'
                | 'EMAIL'
                | 'NUMBER'
                | 'ATTACHMENTS'
                | 'OPTIONS',
              required: f.required,
              order: f.order,
              options: f.options ?? [],
              placeholder: f.placeholder,
            })),
          });
        }
      }

      return { message: 'Registration form updated successfully.' };
    });
  }

  /**
   * Update prize breakdown for an event.
   * - Replaces all prizes.
   */
  async updateEventPrizeBreakdown(
    id: string,
    dto: {
      prizeBreakdown: Array<{
        position: string;
        amount: string;
        description?: string;
      }>;
    },
    userId: string,
  ) {
    await this.assertEventEditableByUser(id, userId);

    return prisma.$transaction(async (tx) => {
      // Delete existing prizes
      await tx.eventPrizeBreakdownEntity.deleteMany({
        where: { eventId: id },
      });

      // Create new prizes
      if (dto.prizeBreakdown.length > 0) {
        await tx.eventPrizeBreakdownEntity.createMany({
          data: dto.prizeBreakdown.map((p) => ({
            eventId: id,
            position: p.position,
            amount: p.amount,
            description: p.description,
          })),
        });
      }

      return { message: 'Prize breakdown updated successfully.' };
    });
  }

  /**
   * Update max users limit for an event.
   * - `null` means unlimited.
   */
  async updateEventMaxUsers(
    id: string,
    dto: { maxUsers?: number | null },
    userId: string,
  ) {
    await this.assertEventEditableByUser(id, userId);

    await prisma.eventEntity.update({
      where: { id },
      data: { maxUsers: dto.maxUsers },
    });

    return { message: 'Max users limit updated successfully.' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Approval Workflow Methods
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Submit an event for approval.
   * - Sets status to PUBLISHED.
   * - Sets approvalStatus to PENDING.
   * - Requires owner/admin/manager permission.
   */
  async submitForApproval(id: string, userId: string, note?: string) {
    const event = await prisma.eventEntity.findUnique({
      where: { id, isDeleted: false },
      select: { id: true, ownerId: true, status: true, approvalStatus: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    const hasPermission = await this.hasEditPermission(
      event.ownerId,
      userId,
      id,
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'You are not allowed to submit this event for approval.',
      );
    }

    // Update status to PUBLISHED and approvalStatus to PENDING
    return prisma.eventEntity.update({
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
   * - Approves or rejects an event.
   */
  async updateApprovalStatus(
    id: string,
    approvalStatus: 'APPROVED' | 'REJECTED',
    userId: string,
    note?: string,
  ) {
    const event = await prisma.eventEntity.findUnique({
      where: { id, isDeleted: false },
      select: { id: true, approvalStatus: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    // Admin-only check
    const isAdmin = await this.isAdminUser(userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can approve or reject events.');
    }

    const now = new Date();
    return prisma.eventEntity.update({
      where: { id },
      data: {
        approvalStatus,
        approvalApprovedAt: approvalStatus === 'APPROVED' ? now : null,
        approvalRejectedAt: approvalStatus === 'REJECTED' ? now : null,
        approvalNote: note,
      },
      select: {
        id: true,
        status: true,
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
    const event = await prisma.eventEntity.findUnique({
      where: { id, isDeleted: false },
      select: { id: true, ownerId: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    const hasPermission = await this.hasEditPermission(
      event.ownerId,
      userId,
      id,
    );
    if (!hasPermission) {
      throw new ForbiddenException('You are not allowed to modify this event.');
    }

    return prisma.eventEntity.update({
      where: { id },
      data: { isRegistrationPaused },
      select: {
        id: true,
        isRegistrationPaused: true,
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Assert that an event exists, is editable (DRAFT status),
   * and the user has permission to edit it (owner OR admin OR manager).
   */
  private async assertEventEditableByUser(id: string, userId: string) {
    const event = await prisma.eventEntity.findUnique({
      where: { id, isDeleted: false },
      select: {
        id: true,
        ownerId: true,
        status: true,
        name: true,
        startDate: true,
        endDate: true,
      },
    });
    if (!event) throw new NotFoundException('Event not found');

    if (event.status !== 'DRAFT') {
      throw new ForbiddenException('Only DRAFT events can be edited.');
    }

    const hasPermission = await this.hasEditPermission(
      event.ownerId,
      userId,
      id,
    );
    if (!hasPermission) {
      throw new ForbiddenException('You are not allowed to edit this event.');
    }

    return event;
  }

  private async hasEditPermission(
    ownerId: string,
    userId: string,
    eventId: string,
  ): Promise<boolean> {
    if (ownerId === userId) return true;

    const isAdmin = await this.isAdminUser(userId);
    if (isAdmin) return true;

    // Check if user is a manager
    const managerRole = await prisma.eventUserRoleEntity.findFirst({
      where: {
        eventId,
        userId,
        role: 'MANAGER',
      },
    });
    return !!managerRole;
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
    return base.length > 0 ? base : 'event';
  }

  private async buildEventSlug(
    requestedSlug: string | undefined,
    name: string,
    excludeId?: string,
  ): Promise<string> {
    const base = this.slugify(requestedSlug ?? name);

    const existing = await prisma.eventEntity.findFirst({
      where: excludeId
        ? { slug: base, NOT: { id: excludeId } }
        : { slug: base },
      select: { id: true },
    });
    if (!existing) return base;

    const suffix = Math.random().toString(36).slice(2, 8);
    return `${base}-${suffix}`;
  }

  private assertLocationValid(
    location: CreateEventDto['location'] | undefined,
  ): void {
    if (!location) return;

    if (location.type === 'PHYSICAL') {
      if (!location.address || location.address.trim().length === 0) {
        throw new BadRequestException(
          'location.address is required for PHYSICAL events.',
        );
      }
      return;
    }

    if (location.type === 'VIRTUAL') {
      if (!location.virtualLink || location.virtualLink.trim().length === 0) {
        throw new BadRequestException(
          'location.virtualLink is required for VIRTUAL events.',
        );
      }
    }
  }

  private assertPassSettingsValid(dto: UpdateEventDto): void {
    if (!dto.collegeRestrictionEnabled) return;

    const { allowedCollegeIds, allowedEmailDomains, collegeMatchMode } = dto;

    const hasColleges =
      allowedCollegeIds &&
      Array.isArray(allowedCollegeIds) &&
      allowedCollegeIds.length > 0;
    const hasDomains =
      allowedEmailDomains &&
      Array.isArray(allowedEmailDomains) &&
      allowedEmailDomains.length > 0;

    const mode = collegeMatchMode || 'EITHER_OR';

    if (mode === 'PROFILE_ONLY' || mode === 'BOTH_REQUIRED') {
      if (!hasColleges) {
        throw new BadRequestException(
          'At least one college must be selected when profile matching is required.',
        );
      }
    }

    if (mode === 'EMAIL_ONLY' || mode === 'BOTH_REQUIRED') {
      if (!hasDomains) {
        throw new BadRequestException(
          'At least one email domain must be added when email matching is required.',
        );
      }
    }

    if (mode === 'EITHER_OR') {
      if (!hasColleges && !hasDomains) {
        throw new BadRequestException(
          'At least one college or email domain must be provided when college restriction is enabled.',
        );
      }
    }
  }

  private async isAdminUser(userId: string): Promise<boolean> {
    const user = await prisma.userEntity.findUnique({
      where: { id: userId },
      select: { accessLevel: true },
    });
    return user?.accessLevel === 'ADMIN';
  }

  /**
   * Get registration answers for a specific participant (owner/manager/admin only).
   */
  async getParticipantRegistrationAnswers(
    slug: string,
    participantId: string,
    requesterUserId: string,
  ) {
    const event = await prisma.eventEntity.findUnique({
      where: { slug, isDeleted: false },
      select: { id: true, ownerId: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    const hasPermission = await this.hasEditPermission(
      event.ownerId,
      requesterUserId,
      event.id,
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to view registration answers for this event.',
      );
    }

    const participant = await prisma.eventParticipantEntity.findUnique({
      where: { id: participantId },
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
        submission: {
          include: {
            answers: {
              include: {
                field: {
                  select: {
                    id: true,
                    label: true,
                    type: true,
                    order: true,
                    options: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    if (participant.eventId !== event.id) {
      throw new NotFoundException('Participant not found in this event');
    }

    const user = participant.user;
    const submission = participant.submission;
    const answers = submission?.answers ?? [];

    const fieldsMap = new Map<
      string,
      {
        id: string;
        label: string;
        type: string;
        order: number;
        options: string[];
      }
    >();
    for (const answer of answers) {
      if (answer.field && !fieldsMap.has(answer.field.id)) {
        fieldsMap.set(answer.field.id, {
          id: answer.field.id,
          label: answer.field.label,
          type: answer.field.type,
          order: answer.field.order,
          options: answer.field.options,
        });
      }
    }
    const fields = Array.from(fieldsMap.values()).sort(
      (a, b) => a.order - b.order,
    );

    const formattedAnswers = answers.map((a) => ({
      fieldId: a.fieldId,
      value: a.valueJson ?? a.valueText,
    }));

    return {
      participant: {
        id: participant.id,
        name:
          [user.firstName, user.lastName].filter(Boolean).join(' ') || 'N/A',
        email: user.email,
        avatarUrl: user.imageUrl || null,
        registeredAt: participant.joinedAt.toISOString(),
      },
      fields,
      answers: formattedAnswers,
    };
  }

  private assertLifecycleTransitionAllowed(
    currentStatus: LifecycleStatus,
    nextStatus: LifecycleStatus,
  ): void {
    if (currentStatus === nextStatus) return;

    // Terminal states
    if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') {
      throw new ForbiddenException(
        `Cannot change event status once it is ${currentStatus}.`,
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
        `Invalid event status transition: ${currentStatus} -> ${nextStatus}.`,
      );
    }
  }
}
