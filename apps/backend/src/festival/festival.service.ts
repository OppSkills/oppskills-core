import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@oppskills/db';
import type { CreateFestivalDto, UpdateFestivalDto } from '@oppskills/types';

type AccessLevelValue = 'ADMIN' | 'USER' | 'VIEWER';
type LifecycleStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED';

@Injectable()
export class FestivalService {
  async createFestival(dto: CreateFestivalDto, userId: string) {
    const startDate = this.parseDate(dto.startDate, 'startDate');
    const endDate = this.parseDate(dto.endDate, 'endDate');
    if (endDate.getTime() < startDate.getTime()) {
      throw new BadRequestException('endDate must be >= startDate.');
    }

    this.assertLocationValid(dto.location);

    const slug = await this.buildFestivalSlug(dto.slug, dto.name);

    return prisma.festivalEntity.create({
      data: {
        slug,
        name: dto.name,
        description: dto.description,
        posterImageUrl: dto.posterImageUrl,
        websiteUrl: dto.websiteUrl,

        locationType: dto.location?.type,
        locationAddress: dto.location?.address,
        locationCity: dto.location?.city,
        locationVirtualLink: dto.location?.virtualLink,

        startDate,
        endDate,

        organizerId: userId,
        organizationName: dto.organizationName,
        organizationLogoUrl: dto.organizationLogoUrl,
      },
      include: {
        hackathons: true,
      },
    });
  }

  async listFestivals() {
    return prisma.festivalEntity.findMany({
      include: {
        hackathons: {
          select: { id: true, slug: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFestivalById(id: string) {
    const festival = await prisma.festivalEntity.findUnique({
      where: { id },
      include: {
        hackathons: {
          include: {
            rounds: true,
          },
        },
      },
    });
    if (!festival) throw new NotFoundException('Festival not found');
    return festival;
  }

  async updateFestival(id: string, dto: UpdateFestivalDto, userId: string) {
    const existing = await prisma.festivalEntity.findUnique({
      where: { id },
      select: { id: true, organizerId: true },
    });
    if (!existing) throw new NotFoundException('Festival not found');
    if (existing.organizerId !== userId) {
      const isAdmin = await this.isAdminUser(userId);
      if (!isAdmin) {
        throw new ForbiddenException(
          'You are not allowed to edit this festival.',
        );
      }
    }

    const startDate = this.parseDate(dto.startDate, 'startDate');
    const endDate = this.parseDate(dto.endDate, 'endDate');
    if (endDate.getTime() < startDate.getTime()) {
      throw new BadRequestException('endDate must be >= startDate.');
    }

    this.assertLocationValid(dto.location);

    const slug = await this.buildFestivalSlug(dto.slug, dto.name, id);

    return prisma.festivalEntity.update({
      where: { id },
      data: {
        slug,
        name: dto.name,
        description: dto.description,
        posterImageUrl: dto.posterImageUrl,
        websiteUrl: dto.websiteUrl,

        locationType: dto.location?.type,
        locationAddress: dto.location?.address,
        locationCity: dto.location?.city,
        locationVirtualLink: dto.location?.virtualLink,

        startDate,
        endDate,

        organizationName: dto.organizationName,
        organizationLogoUrl: dto.organizationLogoUrl,
      },
      include: {
        hackathons: true,
      },
    });
  }

  async deleteFestival(id: string, userId: string) {
    const existing = await prisma.festivalEntity.findUnique({
      where: { id },
      select: { id: true, organizerId: true },
    });
    if (!existing) throw new NotFoundException('Festival not found');
    if (existing.organizerId !== userId) {
      const isAdmin = await this.isAdminUser(userId);
      if (!isAdmin) {
        throw new ForbiddenException(
          'You are not allowed to delete this festival.',
        );
      }
    }

    await prisma.festivalEntity.delete({ where: { id } });
    return { message: 'Festival deleted successfully.' };
  }

  async updateFestivalStatus(
    id: string,
    nextStatus: LifecycleStatus,
    userId: string,
  ) {
    const existing = await prisma.festivalEntity.findUnique({
      where: { id },
      select: { id: true, organizerId: true, status: true },
    });
    if (!existing) throw new NotFoundException('Festival not found');

    // Permission: organizer OR admin
    if (existing.organizerId !== userId) {
      const isAdmin = await this.isAdminUser(userId);
      if (!isAdmin) {
        throw new ForbiddenException(
          'You are not allowed to change this festival status.',
        );
      }
    }

    const currentStatus = existing.status as LifecycleStatus;
    this.assertLifecycleTransitionAllowed(
      currentStatus,
      nextStatus,
      'festival',
    );

    return prisma.festivalEntity.update({
      where: { id },
      data: { status: nextStatus },
    });
  }

  async getHackathonsUnderFestival(id: string) {
    const festival = await prisma.festivalEntity.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!festival) throw new NotFoundException('Festival not found');

    return prisma.hackathonEntity.findMany({
      where: { festivalId: id },
      include: { rounds: true },
      orderBy: { createdAt: 'desc' },
    });
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
    return base.length > 0 ? base : 'festival';
  }

  private async buildFestivalSlug(
    requestedSlug: string | undefined,
    name: string,
    excludeId?: string,
  ): Promise<string> {
    const base = this.slugify(requestedSlug ?? name);

    const existing = await prisma.festivalEntity.findFirst({
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
    location: CreateFestivalDto['location'] | undefined,
  ): void {
    if (!location) return;

    if (location.type === 'PHYSICAL') {
      if (!location.address || location.address.trim().length === 0) {
        throw new BadRequestException(
          'location.address is required for PHYSICAL festivals.',
        );
      }
      return;
    }

    if (location.type === 'VIRTUAL') {
      if (!location.virtualLink || location.virtualLink.trim().length === 0) {
        throw new BadRequestException(
          'location.virtualLink is required for VIRTUAL festivals.',
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
