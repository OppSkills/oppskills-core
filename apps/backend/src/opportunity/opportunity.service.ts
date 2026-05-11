import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@oppskills/db';
import { EventService } from '../event/event.service';
import { HackathonService } from '../hackathon/hackathon.service';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class OpportunityService {
  private readonly logger = new Logger(OpportunityService.name);
  private readonly OPPORTUNITY_SELECT = {
    id: true,
    name: true,
    slug: true,
    bannerImageUrl: true,
    startDate: true,
    registrationDeadline: true,
    locationAddress: true,
    locationType: true,
    registrationCount: true,
    prizeTotalWorthAmount: true,
    entryFeeAmount: true,
    isFree: true,
    currency: true,
    organizationName: true,
    views: true,
    impressions: true,
  } as const;

  constructor(
    private readonly eventService: EventService,
    private readonly hackathonService: HackathonService,
  ) { }

  /**
   * List past public opportunities (Deadline < Now).
   */
  async listPublicPastOpportunities(params: {
    festivalId?: string;
    page?: number;
    take?: number;
    search?: string;
  }) {
    const requestedTake = Number(params.take) || 10;
    const PAGE_SIZE = [10, 20, 30, 40].includes(requestedTake)
      ? requestedTake
      : 10;

    const pageNum = Math.max(1, Number(params.page) || 1);

    const takeNeeded = pageNum * PAGE_SIZE;

    const [eventsRes, hackathonsRes] = await Promise.all([
      this.eventService.listPublicEvents({
        festivalId: params.festivalId,
        page: 1,
        take: takeNeeded,
        search: params.search,
        filterMode: 'PAST',
        bypassValidation: true,
      }),
      this.hackathonService.listPublicHackathons({
        festivalId: params.festivalId,
        page: 1,
        take: takeNeeded,
        search: params.search,
        filterMode: 'PAST',
        bypassValidation: true,
      }),
    ]);

    const normalizedEvents = (eventsRes.items as any[]).map((e) => ({
      ...e,
      type: 'EVENT',
    }));

    const normalizedHackathons = (hackathonsRes.items as any[]).map((h) => ({
      ...h,
      type: 'HACKATHON',
    }));

    const merged = [...normalizedEvents, ...normalizedHackathons];

    merged.sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateB - dateA;
    });

    const start = (pageNum - 1) * PAGE_SIZE;
    const items = merged.slice(start, start + PAGE_SIZE);

    const totalCount = (eventsRes.total ?? 0) + (hackathonsRes.total ?? 0);
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return { items, totalPages, total: totalCount, page: pageNum };
  }

  /**
   * Search opportunities (events and hackathons) by query string.
   * Returns:
   * - 4 matching hackathons
   * - 4 matching events
   * - 8 top opportunities (ranked by registrations, views, impressions)
   */
  async searchOpportunities(query: string) {
    const q = query.trim();
    if (!q) {
      return {
        hackathons: [],
        events: [],
        topOpportunities: [],
      };
    }
    // (PUBLISHED + APPROVED)
    const [matchingHackathons, matchingEvents] = await Promise.all([
      prisma.hackathonEntity.findMany({
        where: {
          name: { contains: q, mode: 'insensitive' },
          status: 'PUBLISHED',
          approvalStatus: 'APPROVED',
          isDeleted: false,
        },
        select: this.OPPORTUNITY_SELECT,
        take: 4,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.eventEntity.findMany({
        where: {
          name: { contains: q, mode: 'insensitive' },
          status: 'PUBLISHED',
          approvalStatus: 'APPROVED',
          isDeleted: false,
        },
        select: this.OPPORTUNITY_SELECT,
        take: 4,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // 2. Fetch top 8 overall (among those that match q)
    // Preference: Registrations > Views > Impressions
    const [topHackathons, topEvents] = await Promise.all([
      prisma.hackathonEntity.findMany({
        where: {
          name: { contains: q, mode: 'insensitive' },
          status: 'PUBLISHED',
          approvalStatus: 'APPROVED',
          isDeleted: false,
        },
        select: this.OPPORTUNITY_SELECT,
        take: 8,
        orderBy: [
          { registrationCount: 'desc' },
          { views: 'desc' },
          { impressions: 'desc' },
        ],
      }),
      prisma.eventEntity.findMany({
        where: {
          name: { contains: q, mode: 'insensitive' },
          status: 'PUBLISHED',
          approvalStatus: 'APPROVED',
          isDeleted: false,
        },
        select: this.OPPORTUNITY_SELECT,
        take: 8,
        orderBy: [
          { registrationCount: 'desc' },
          { views: 'desc' },
          { impressions: 'desc' },
        ],
      }),
    ]);

    const combinedTop = [
      ...topHackathons.map((h) => ({ ...h, type: 'HACKATHON' })),
      ...topEvents.map((e) => ({ ...e, type: 'EVENT' })),
    ];

    // Final sort for the top 8
    combinedTop.sort((a, b) => {
      // Primary: Registrations
      const regB = Number(b.registrationCount ?? 0);
      const regA = Number(a.registrationCount ?? 0);
      if (regB !== regA) {
        return regB - regA;
      }
      // Secondary: Views
      const viewsB = Number(b.views ?? 0);
      const viewsA = Number(a.views ?? 0);
      if (viewsB !== viewsA) {
        return viewsB - viewsA;
      }
      // Tertiary: Impressions
      const imprB = Number(b.impressions ?? 0);
      const imprA = Number(a.impressions ?? 0);
      return imprB - imprA;
    });

    const finalTop = combinedTop.slice(0, 8);

    // 3. Cleanup: Remove internal sorting fields (views, impressions) before returning
    const sanitize = (item: any) => {
      const { views: _v, impressions: _i, ...rest } = item;
      return rest;
    };

    return {
      hackathons: matchingHackathons.map(sanitize),
      events: matchingEvents.map(sanitize),
      topOpportunities: finalTop.map(sanitize),
    };
  }

  /**
   * Autosuggest search for hackathons and events.
   * Returns a mixed list sorted by matching score.
   */
  async autosuggestOpportunities(query: string) {
    const q = query.trim();
    if (!q) return [];

    const now = new Date();

    const [hackathons, events] = await Promise.all([
      prisma.hackathonEntity.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            },
            {
              OR: [
                { registrationDeadline: { gte: now } },
                { registrationDeadline: null },
              ],
            },
          ],
          status: 'PUBLISHED',
          approvalStatus: 'APPROVED',
          isDeleted: false,
        },
        select: {
          slug: true,
          name: true,
          description: true,
          bannerImageUrl: true,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.eventEntity.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            },
            {
              OR: [
                { registrationDeadline: { gte: now } },
                { registrationDeadline: null },
              ],
            },
          ],
          status: 'PUBLISHED',
          approvalStatus: 'APPROVED',
          isDeleted: false,
        },
        select: {
          slug: true,
          name: true,
          description: true,
          bannerImageUrl: true,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const mixed = [
      ...hackathons.map((h) => ({ ...h, type: 'HACKATHON' })),
      ...events.map((e) => ({ ...e, type: 'EVENT' })),
    ];

    const lowerQuery = q.toLowerCase();

    const results = mixed.map((item) => {
      // 1. Sanitize once during mapping
      const strippedDesc = sanitizeHtml(item.description || '', {
        allowedTags: [],
        allowedAttributes: {},
      })
        .replace(/\s+/g, ' ')
        .trim();

      // 2. Score against plain text
      let score = 0;
      const lowerName = item.name.toLowerCase();
      const lowerDesc = strippedDesc.toLowerCase();

      if (lowerName === lowerQuery) {
        score += 100;
      } else if (lowerName.startsWith(lowerQuery)) {
        score += 50;
      } else if (lowerName.includes(lowerQuery)) {
        score += 20;
      }

      if (lowerDesc.includes(lowerQuery)) {
        score += 5;
      }

      return {
        slug: item.slug,
        type: item.type,
        thumbnail: item.bannerImageUrl,
        title: item.name,
        description:
          strippedDesc.length > 50
            ? strippedDesc.substring(0, 50).trim() + '...'
            : strippedDesc ||
              `Check out this exciting ${item.type.toLowerCase()} on OppSkills!`,
        score,
      };
    });

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    // Return final items (dropping the score field)
    return results.map(({ score: _, ...item }) => item);
  }
}
