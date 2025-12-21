import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@oppskills/db';
import type {
  CreateEventDto,
  UpdateEventDto,
  EventLifecycleStatusValue,
  EventUserRoleValue,
} from '@oppskills/types';

type AccessLevelValue = 'ADMIN' | 'USER' | 'VIEWER';
type LifecycleStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED';

@Injectable()
export class EventService {
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
   * List events, optionally filtered by festival.
   * Public endpoint: only returns PUBLISHED + APPROVED events.
   */
  async listEvents(input: { festivalId?: string } = {}) {
    const baseWhere: Record<string, unknown> = {
      status: 'PUBLISHED',
      approvalStatus: 'APPROVED',
    };
    if (input.festivalId) {
      baseWhere.festivalId = input.festivalId;
    }

    return prisma.eventEntity.findMany({
      where: baseWhere,
      include: {
        owner: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        festival: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
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
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        startDate: true,
        endDate: true,
        registrationCount: true,
        maxUsers: true,
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
            startDate: true,
            endDate: true,
            registrationCount: true,
            maxUsers: true,
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
      startDate: Date;
      endDate: Date;
      registrationCount: number;
      maxUsers: number | null;
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
   * Get a single event by ID.
   */
  async getEventById(id: string) {
    const event = await prisma.eventEntity.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, email: true, firstName: true, lastName: true, imageUrl: true },
        },
        festival: {
          select: { id: true, name: true, slug: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true, imageUrl: true },
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
   * Get a single event by slug.
   */
  async getEventBySlug(slug: string) {
    const event = await prisma.eventEntity.findUnique({
      where: { slug },
      include: {
        owner: {
          select: { id: true, email: true, firstName: true, lastName: true, imageUrl: true },
        },
        festival: {
          select: { id: true, name: true, slug: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true, lastName: true, imageUrl: true },
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
      where: { id },
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

    const hasPermission = await this.hasEditPermission(event.ownerId, userId, id);
    if (!hasPermission) {
      throw new ForbiddenException('You are not allowed to edit this event.');
    }

    // Determine if basic info is being changed (triggers re-approval)
    const isBasicInfoChange =
      (dto.name !== undefined && dto.name !== event.name) ||
      (dto.slug !== undefined && dto.slug !== event.slug) ||
      (dto.description !== undefined && dto.description !== event.description) ||
      (dto.bannerImageUrl !== undefined && dto.bannerImageUrl !== event.bannerImageUrl);

    // For non-DRAFT events, only allow edits if they are basic info changes (which will reset approval)
    const isDraft = event.status === 'DRAFT';
    const isApproved = event.approvalStatus === 'APPROVED';

    if (!isDraft && !isBasicInfoChange) {
      throw new ForbiddenException('Only DRAFT events can be fully edited. For published events, only basic info changes are allowed.');
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
      where: { id },
      select: { id: true, ownerId: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    if (event.ownerId !== userId) {
      const isAdmin = await this.isAdminUser(userId);
      if (!isAdmin) {
        throw new ForbiddenException('You are not allowed to delete this event.');
      }
    }

    await prisma.eventEntity.delete({ where: { id } });
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
      where: { id },
      select: { id: true, ownerId: true, status: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    // Permission: owner OR admin OR manager
    const hasPermission = await this.hasEditPermission(event.ownerId, userId, id);
    if (!hasPermission) {
      throw new ForbiddenException('You are not allowed to change this event status.');
    }

    const currentStatus = event.status as LifecycleStatus;
    this.assertLifecycleTransitionAllowed(currentStatus, nextStatus);

    return prisma.eventEntity.update({
      where: { id },
      data: { status: nextStatus },
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
   */
  async joinEvent(eventId: string, userId: string) {
    const event = await prisma.eventEntity.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        ownerId: true,
        status: true,
        approvalStatus: true,
        isRegistrationPaused: true,
        maxUsers: true,
        registrationCount: true,
        registrationDeadline: true,
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
      throw new BadRequestException('Event registrations are currently paused.');
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

    // Check capacity (use transaction for atomic update)
    return prisma.$transaction(async (tx) => {
      // Re-fetch within transaction to ensure consistency
      const currentEvent = await tx.eventEntity.findUnique({
        where: { id: eventId },
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
      await tx.eventParticipantEntity.create({
        data: {
          eventId,
          userId,
        },
      });

      await tx.eventEntity.update({
        where: { id: eventId },
        data: { registrationCount: { increment: 1 } },
      });

      return { message: 'Successfully joined the event.' };
    });
  }

  /**
   * Leave an event.
   * - Decrements registrationCount.
   */
  async leaveEvent(eventId: string, userId: string) {
    const event = await prisma.eventEntity.findUnique({
      where: { id: eventId },
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
   * Get all roles for an event (owner + managers + evaluators).
   */
  async getEventRoles(eventId: string) {
    const event = await prisma.eventEntity.findUnique({
      where: { id: eventId },
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
   * Add a role to an event (owner/admin only).
   */
  async addEventRole(
    eventId: string,
    email: string,
    role: EventUserRoleValue,
    assignedByUserId: string,
  ) {
    const event = await prisma.eventEntity.findUnique({
      where: { id: eventId },
      select: { id: true, ownerId: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    // Permission check: owner or admin
    if (event.ownerId !== assignedByUserId) {
      const isAdmin = await this.isAdminUser(assignedByUserId);
      if (!isAdmin) {
        throw new ForbiddenException('You are not allowed to add roles to this event.');
      }
    }

    // Find user by email
    const user = await prisma.userEntity.findUnique({
      where: { email },
      select: { id: true, email: true, firstName: true, lastName: true, imageUrl: true },
    });
    if (!user) throw new NotFoundException(`User with email "${email}" not found.`);

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
      throw new ConflictException(`User already has the ${role} role for this event.`);
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
      where: { id: eventId },
      select: { id: true, ownerId: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    // Permission check: owner or admin
    if (event.ownerId !== removedByUserId) {
      const isAdmin = await this.isAdminUser(removedByUserId);
      if (!isAdmin) {
        throw new ForbiddenException('You are not allowed to remove roles from this event.');
      }
    }

    // Find user by email
    const user = await prisma.userEntity.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) throw new NotFoundException(`User with email "${email}" not found.`);

    // Find and delete the role
    const existing = await prisma.eventUserRoleEntity.findUnique({
      where: {
        eventId_userId_role: { eventId, userId: user.id, role },
      },
    });
    if (!existing) {
      throw new NotFoundException(`User does not have the ${role} role for this event.`);
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
    dto: { additionalInfo?: { contact?: { name?: string; email?: string; phone?: string }; attachments?: Array<{ storageKey: string; publicUrl?: string; fileName?: string; mimeType?: string; sizeBytes?: number }> } },
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
    dto: { registrationForm: { externalFormLink?: string; fields?: Array<{ label: string; type: string; required: boolean; order: number; options?: string[]; placeholder?: string }> } },
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
              type: f.type as 'TEXT' | 'PHONE_NO' | 'EMAIL' | 'NUMBER' | 'ATTACHMENTS' | 'OPTIONS',
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
    dto: { prizeBreakdown: Array<{ position: string; amount: string; description?: string }> },
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
      where: { id },
      select: { id: true, ownerId: true, status: true, approvalStatus: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    const hasPermission = await this.hasEditPermission(event.ownerId, userId, id);
    if (!hasPermission) {
      throw new ForbiddenException('You are not allowed to submit this event for approval.');
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
      where: { id },
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
      where: { id },
      select: { id: true, ownerId: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    const hasPermission = await this.hasEditPermission(event.ownerId, userId, id);
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
      where: { id },
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

    const hasPermission = await this.hasEditPermission(event.ownerId, userId, id);
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
      PUBLISHED: ['ONGOING', 'CANCELLED'],
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
