import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, prisma } from '@oppskills/db';
import type { CreateHackathonDto, UpdateHackathonDto } from '@oppskills/types';

type LifecycleStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED';

type AccessLevelValue = 'ADMIN' | 'USER' | 'VIEWER';

@Injectable()
export class HackathonService {
  /**
   * Create a hackathon as a user.
   * - If `festivalId` is null/undefined => standalone hackathon.
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

          organizationName: dto.organizationName,
          organizationLogoUrl: dto.organizationLogoUrl,
          allowedUniversities: dto.allowedUniversities ?? [],

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

          rounds: dto.rounds
            ? {
                create: dto.rounds.map((round) => ({
                  name: round.name,
                  description: round.description,
                  startsAt: this.parseDate(round.startsAt, 'rounds.startsAt'),
                  order: round.order,
                })),
              }
            : undefined,

          prizeBreakdown: dto.prizeBreakdown
            ? {
                create: dto.prizeBreakdown.map((prize) => ({
                  position: prize.position,
                  amount: prize.amount,
                  description: prize.description,
                })),
              }
            : undefined,
        },
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
          festival: true,
          rounds: true,
          prizeBreakdown: true,
          registrationForm: {
            include: {
              fields: true,
            },
          },
        },
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

  async listHackathons(input: { festivalId?: string }) {
    return prisma.hackathonEntity.findMany({
      where: input.festivalId ? { festivalId: input.festivalId } : undefined,
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
        festival: true,
        rounds: true,
        prizeBreakdown: true,
        registrationForm: {
          include: {
            fields: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getHackathonById(id: string) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { id },
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
        festival: true,
        rounds: true,
        prizeBreakdown: true,
        registrationForm: {
          include: {
            fields: true,
          },
        },
      },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');
    return hackathon;
  }

  /**
   * Update a hackathon (owner-only).
   * - Allowed only when status is DRAFT.
   */
  async updateHackathon(id: string, dto: UpdateHackathonDto, userId: string) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { id },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    if (hackathon.ownerId !== userId) {
      const isAdmin = await this.isAdminUser(userId);
      if (!isAdmin) {
        throw new ForbiddenException(
          'You are not allowed to edit this hackathon.',
        );
      }
    }

    const status = hackathon.status as LifecycleStatus;
    if (status !== 'DRAFT') {
      throw new ForbiddenException(
        'You can only edit a hackathon in DRAFT status.',
      );
    }

    // Nested updates are not supported via this endpoint (yet).
    if (dto.rounds || dto.prizeBreakdown || dto.registrationForm) {
      throw new BadRequestException(
        'Nested updates (rounds, prizeBreakdown, registrationForm) are not supported in PUT /hackathons/:id. Use dedicated endpoints.',
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
    this.assertPricingValid(dto);

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

        organizationName: dto.organizationName,
        organizationLogoUrl: dto.organizationLogoUrl,
        allowedUniversities: dto.allowedUniversities ?? undefined,
      },
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
        festival: true,
        rounds: true,
        prizeBreakdown: true,
        registrationForm: {
          include: {
            fields: true,
          },
        },
      },
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

    // Permission: owner OR admin
    if (hackathon.ownerId !== userId) {
      const isAdmin = await this.isAdminUser(userId);
      if (!isAdmin) {
        throw new ForbiddenException(
          'You are not allowed to change this hackathon status.',
        );
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
  ): void {
    const isFree = dto.isFree ?? true;
    if (isFree) return;
    if (!dto.entryFeeAmount || dto.entryFeeAmount.trim().length === 0) {
      throw new BadRequestException(
        'entryFeeAmount is required when isFree is false.',
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
}
