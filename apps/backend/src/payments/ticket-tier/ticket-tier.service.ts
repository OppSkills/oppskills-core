import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  prisma,
  EventPaymentStatus,
  HackathonPaymentStatus,
} from '@oppskills/db';
import { Decimal } from '@prisma/client/runtime/library';

interface CreateTicketTierParams {
  // One of eventId or hackathonId must be provided
  eventSlug?: string;
  hackathonSlug?: string;
  userId: string;
  name: string;
  description?: string;
  price: number;
  capacity?: number;
  order?: number;
  isActive?: boolean;
  isFree?: boolean;
}

interface UpdateTicketTierParams {
  tierId: string;
  userId: string;
  name?: string;
  description?: string;
  price?: number;
  capacity?: number;
  order?: number;
  isActive?: boolean;
  isFree?: boolean;
}

const tierPublicSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  currency: true,
  capacity: true,
  order: true,
  isFree: true,
} as const;

@Injectable()
export class TicketTierService {
  constructor() {}

  /** Normalise tier pricing: free tiers always have price 0; paid tiers need price > 0. */
  private resolveTierPricing(
    isFree: boolean | undefined,
    price: number | undefined,
    existing?: { isFree: boolean; price: Decimal },
  ): { isFree: boolean; price: number } {
    const resolvedIsFree = isFree ?? existing?.isFree ?? false;
    const resolvedPrice =
      price !== undefined
        ? price
        : existing
          ? Number(existing.price)
          : undefined;

    if (resolvedIsFree) {
      return { isFree: true, price: 0 };
    }

    if (resolvedPrice === undefined) {
      throw new BadRequestException('Price is required for paid ticket tiers');
    }
    if (resolvedPrice <= 0) {
      throw new BadRequestException(
        'Paid ticket tiers must have a price greater than 0, or mark the tier as free',
      );
    }
    return { isFree: false, price: resolvedPrice };
  }

  private async userCanManageEventTickets(
    eventId: string,
    userId: string,
  ): Promise<boolean> {
    const ev = await prisma.eventEntity.findUnique({
      where: { id: eventId },
      select: { ownerId: true },
    });
    if (!ev) return false;
    if (ev.ownerId === userId) return true;
    const mgr = await prisma.eventUserRoleEntity.findFirst({
      where: { eventId, userId, role: 'MANAGER' },
    });
    return !!mgr;
  }

  private async userCanManageHackathonTickets(
    hackathonId: string,
    userId: string,
  ): Promise<boolean> {
    const h = await prisma.hackathonEntity.findUnique({
      where: { id: hackathonId },
      select: { ownerId: true },
    });
    if (!h) return false;
    if (h.ownerId === userId) return true;
    const mgr = await prisma.hackathonUserRoleEntity.findFirst({
      where: { hackathonId, userId, role: 'MANAGER' },
    });
    return !!mgr;
  }

  private async attachEventTierSoldCounts<T extends { id: string }>(
    tiers: T[],
  ): Promise<Array<T & { ticketsSold: number }>> {
    if (tiers.length === 0) return [];
    const grouped = await prisma.eventPaymentEntity.groupBy({
      by: ['ticketTierId'],
      where: {
        ticketTierId: { in: tiers.map((t) => t.id) },
        paymentStatus: {
          in: [EventPaymentStatus.CAPTURED, EventPaymentStatus.AUTHORIZED],
        },
      },
      _count: { _all: true },
    });
    const map = new Map(
      grouped
        .filter((g) => g.ticketTierId != null)
        .map((g) => [g.ticketTierId as string, g._count._all]),
    );
    return tiers.map((t) => ({ ...t, ticketsSold: map.get(t.id) ?? 0 }));
  }

  private async attachHackathonTierSoldCounts<T extends { id: string }>(
    tiers: T[],
  ): Promise<Array<T & { ticketsSold: number }>> {
    if (tiers.length === 0) return [];
    const grouped = await prisma.hackathonPaymentEntity.groupBy({
      by: ['ticketTierId'],
      where: {
        ticketTierId: { in: tiers.map((t) => t.id) },
        paymentStatus: {
          in: [
            HackathonPaymentStatus.CAPTURED,
            HackathonPaymentStatus.AUTHORIZED,
          ],
        },
      },
      _count: { _all: true },
    });
    const map = new Map(
      grouped
        .filter((g) => g.ticketTierId != null)
        .map((g) => [g.ticketTierId as string, g._count._all]),
    );
    return tiers.map((t) => ({ ...t, ticketsSold: map.get(t.id) ?? 0 }));
  }

  // ─── EVENT TICKET TIERS ─────────────────────────────────────────────────────

  async listEventTicketTiers(slug: string, userId: string) {
    const event = await prisma.eventEntity.findUnique({
      where: { slug },
      select: { id: true, ownerId: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.ownerId !== userId) {
      const role = await prisma.eventUserRoleEntity.findFirst({
        where: { eventId: event.id, userId },
      });
      if (!role) throw new ForbiddenException('Not authorised');
    }
    const tiers = await prisma.ticketTierEntity.findMany({
      where: { eventId: event.id },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return this.attachEventTierSoldCounts(tiers);
  }

  /** Public variant — no auth required, only active tiers */
  async listEventTicketTiersPublic(eventId: string) {
    return prisma.ticketTierEntity.findMany({
      where: { eventId, isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: tierPublicSelect,
    });
  }

  async createEventTicketTier(params: CreateTicketTierParams) {
    const event = await prisma.eventEntity.findUnique({
      where: { slug: params.eventSlug },
      select: { id: true, ownerId: true },
    });
    if (!event) throw new NotFoundException('Event not found');
    if (!(await this.userCanManageEventTickets(event.id, params.userId)))
      throw new ForbiddenException('Not authorised');

    const { isFree, price } = this.resolveTierPricing(
      params.isFree,
      params.price,
    );

    return prisma.ticketTierEntity.create({
      data: {
        name: params.name,
        description: params.description,
        price: new Decimal(price),
        isFree,
        capacity: params.capacity ?? null,
        order: params.order ?? 0,
        isActive: params.isActive ?? true,
        eventId: event.id,
      },
    });
  }

  async updateEventTicketTier(params: UpdateTicketTierParams) {
    const tier = await prisma.ticketTierEntity.findUnique({
      where: { id: params.tierId },
      select: {
        id: true,
        eventId: true,
        hackathonId: true,
        isFree: true,
        price: true,
      },
    });
    if (!tier || !tier.eventId)
      throw new NotFoundException('Ticket tier not found');

    if (!(await this.userCanManageEventTickets(tier.eventId, params.userId)))
      throw new ForbiddenException('Not authorised');

    const pricing =
      params.isFree !== undefined || params.price !== undefined
        ? this.resolveTierPricing(params.isFree, params.price, tier)
        : null;

    return prisma.ticketTierEntity.update({
      where: { id: params.tierId },
      data: {
        ...(params.name !== undefined && { name: params.name }),
        ...(params.description !== undefined && {
          description: params.description,
        }),
        ...(pricing && {
          isFree: pricing.isFree,
          price: new Decimal(pricing.price),
        }),
        ...(params.capacity !== undefined && { capacity: params.capacity }),
        ...(params.order !== undefined && { order: params.order }),
        ...(params.isActive !== undefined && { isActive: params.isActive }),
      },
    });
  }

  async deleteEventTicketTier(tierId: string, userId: string) {
    const tier = await prisma.ticketTierEntity.findUnique({
      where: { id: tierId },
      select: { id: true, eventId: true },
    });
    if (!tier || !tier.eventId)
      throw new NotFoundException('Ticket tier not found');

    if (!(await this.userCanManageEventTickets(tier.eventId, userId)))
      throw new ForbiddenException('Not authorised');

    // Check if any payments reference this tier; if so, only soft-delete
    const paymentCount = await prisma.eventPaymentEntity.count({
      where: { ticketTierId: tierId },
    });
    if (paymentCount > 0) {
      return prisma.ticketTierEntity.update({
        where: { id: tierId },
        data: { isActive: false },
      });
    }

    return prisma.ticketTierEntity.delete({ where: { id: tierId } });
  }

  // ─── HACKATHON TICKET TIERS ──────────────────────────────────────────────────

  async listHackathonTicketTiers(slug: string, userId: string) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug },
      select: { id: true, ownerId: true },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');
    if (hackathon.ownerId !== userId) {
      const role = await prisma.hackathonUserRoleEntity.findFirst({
        where: { hackathonId: hackathon.id, userId },
      });
      if (!role) throw new ForbiddenException('Not authorised');
    }
    const tiers = await prisma.ticketTierEntity.findMany({
      where: { hackathonId: hackathon.id },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    return this.attachHackathonTierSoldCounts(tiers);
  }

  /** Public variant — no auth required, only active tiers */
  async listHackathonTicketTiersPublic(hackathonId: string) {
    return prisma.ticketTierEntity.findMany({
      where: { hackathonId, isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      select: tierPublicSelect,
    });
  }

  async createHackathonTicketTier(params: CreateTicketTierParams) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug: params.hackathonSlug },
      select: { id: true, ownerId: true },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');
    if (
      !(await this.userCanManageHackathonTickets(hackathon.id, params.userId))
    )
      throw new ForbiddenException('Not authorised');

    const { isFree, price } = this.resolveTierPricing(
      params.isFree,
      params.price,
    );

    return prisma.ticketTierEntity.create({
      data: {
        name: params.name,
        description: params.description,
        price: new Decimal(price),
        isFree,
        capacity: params.capacity ?? null,
        order: params.order ?? 0,
        isActive: params.isActive ?? true,
        hackathonId: hackathon.id,
      },
    });
  }

  async updateHackathonTicketTier(params: UpdateTicketTierParams) {
    const tier = await prisma.ticketTierEntity.findUnique({
      where: { id: params.tierId },
      select: {
        id: true,
        hackathonId: true,
        isFree: true,
        price: true,
      },
    });
    if (!tier || !tier.hackathonId)
      throw new NotFoundException('Ticket tier not found');

    if (
      !(await this.userCanManageHackathonTickets(
        tier.hackathonId,
        params.userId,
      ))
    )
      throw new ForbiddenException('Not authorised');

    const pricing =
      params.isFree !== undefined || params.price !== undefined
        ? this.resolveTierPricing(params.isFree, params.price, tier)
        : null;

    return prisma.ticketTierEntity.update({
      where: { id: params.tierId },
      data: {
        ...(params.name !== undefined && { name: params.name }),
        ...(params.description !== undefined && {
          description: params.description,
        }),
        ...(pricing && {
          isFree: pricing.isFree,
          price: new Decimal(pricing.price),
        }),
        ...(params.capacity !== undefined && { capacity: params.capacity }),
        ...(params.order !== undefined && { order: params.order }),
        ...(params.isActive !== undefined && { isActive: params.isActive }),
      },
    });
  }

  async deleteHackathonTicketTier(tierId: string, userId: string) {
    const tier = await prisma.ticketTierEntity.findUnique({
      where: { id: tierId },
      select: { id: true, hackathonId: true },
    });
    if (!tier || !tier.hackathonId)
      throw new NotFoundException('Ticket tier not found');

    if (!(await this.userCanManageHackathonTickets(tier.hackathonId, userId)))
      throw new ForbiddenException('Not authorised');

    const paymentCount = await prisma.hackathonPaymentEntity.count({
      where: { ticketTierId: tierId },
    });
    if (paymentCount > 0) {
      return prisma.ticketTierEntity.update({
        where: { id: tierId },
        data: { isActive: false },
      });
    }

    return prisma.ticketTierEntity.delete({ where: { id: tierId } });
  }

  // ─── LOOKUP (used by checkout services) ──────────────────────────────────────

  async getTicketTierById(tierId: string) {
    const tier = await prisma.ticketTierEntity.findUnique({
      where: { id: tierId },
    });
    if (!tier) throw new NotFoundException('Ticket tier not found');
    return tier;
  }
}
