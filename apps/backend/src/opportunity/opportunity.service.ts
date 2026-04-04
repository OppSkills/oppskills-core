import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@oppskills/db';
import { EventService } from '../event/event.service';
import { HackathonService } from '../hackathon/hackathon.service';

@Injectable()
export class OpportunityService {
  private readonly logger = new Logger(OpportunityService.name);

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
    appendResults?: boolean;
    search?: string;
  }) {
    const pageNum = params.page ? Math.max(1, Number(params.page)) : 1;
    const isAppended = String(params.appendResults) === 'true';
    const PAGE_SIZE = isAppended ? 20 : 10;

    const takeNeeded = pageNum * PAGE_SIZE;

    const [eventsRes, hackathonsRes] = await Promise.all([
      this.eventService.listPublicEvents({
        festivalId: params.festivalId,
        page: 1,
        take: takeNeeded + 1,
        search: params.search,
        filterMode: 'PAST',
      }),
      this.hackathonService.listPublicHackathons({
        festivalId: params.festivalId,
        page: 1,
        take: takeNeeded + 1,
        search: params.search,
        filterMode: 'PAST',
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
    const further = merged.length > start + PAGE_SIZE;

    return { items, further, total: merged.length, page: pageNum };
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
    const opportunitySelect = {
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
    };

    const [matchingHackathons, matchingEvents] = await Promise.all([
      prisma.hackathonEntity.findMany({
        where: {
          name: { contains: q, mode: 'insensitive' },
          status: 'PUBLISHED',
          approvalStatus: 'APPROVED',
          isDeleted: false,
        },
        select: opportunitySelect,
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
        select: opportunitySelect,
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
        select: opportunitySelect,
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
        select: opportunitySelect,
        take: 8,
        orderBy: [
          { registrationCount: 'desc' },
          { views: 'desc' },
          { impressions: 'desc' },
        ],
      }),
    ]);

    const combinedTop = [
      ...topHackathons.map(h => ({ ...h, type: 'HACKATHON' })),
      ...topEvents.map(e => ({ ...e, type: 'EVENT' })),
    ];

    // Final sort for the top 8
    combinedTop.sort((a, b) => {
      // Primary: Registrations
      if (b.registrationCount !== a.registrationCount) {
        return b.registrationCount - a.registrationCount;
      }
      // Secondary: Views
      const viewsB = Number(b.views);
      const viewsA = Number(a.views);
      if (viewsB !== viewsA) {
        return viewsB - viewsA;
      }
      // Tertiary: Impressions
      const imprB = Number(b.impressions);
      const imprA = Number(a.impressions);
      return imprB - imprA;
    });

    const finalTop = combinedTop.slice(0, 8);

    return {
      hackathons: matchingHackathons,
      events: matchingEvents,
      topOpportunities: finalTop,
    };
  }
}
