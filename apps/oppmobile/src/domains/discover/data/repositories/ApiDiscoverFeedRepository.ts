// src/domains/discover/data/repositories/ApiDiscoverFeedRepository.ts
// Fetches public hackathons and events from the backend and assembles the DiscoverFeedEntity.
// Maps: GET /hackathons/public (no auth) → hackathon + competition listings
//       GET /events/public (no auth)     → event + community listings

import { apiClient } from '../../../../shared/api/apiClient';
import type { DiscoverFeedEntity } from '../../domain/entities/DiscoverFeed';
import type { DiscoverFeedRepository } from '../../domain/repositories/DiscoverFeedRepository';
import type {
  DiscoverCategoryItem,
  DiscoverCompactItem,
  DiscoverOpportunityItem,
  DiscoverFeatureEventItem,
} from '../../../../shared/types/discover';
import type { PublicHackathonResponse } from '../../../hackathons/data/repositories/ApiHackathonDetailRepository';
import type { PublicEventResponse } from '../../../events/data/repositories/ApiEventDetailRepository';
import { TONE_CYCLE } from '../mappers/mapDiscoverFeed';

// ─── Tone assignment ──────────────────────────────────────────────────────────
function cycleTone(index: number): 'violet' | 'indigo' | 'teal' | 'amber' {
  // TONE_CYCLE is fixed-length & index is always valid — non-null assertion is safe
  return TONE_CYCLE[index % TONE_CYCLE.length] as 'violet' | 'indigo' | 'teal' | 'amber';
}

// ─── Format helpers ───────────────────────────────────────────────────────────
function fmtDeadline(isoString: string | null | undefined): string {
  if (!isoString) return 'Open';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtEventTiming(startDate: string): string {
  const d = new Date(startDate);
  const monthDay = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
  return `${monthDay} · ${time}`;
}

function formatPrize(h: PublicHackathonResponse): { label: string; value: string } {
  if (h.prizeTotalWorthAmount && h.prizeTotalWorthAmount > 0) {
    const sym = h.currency === 'INR' ? '₹' : h.currency;
    return {
      label: 'Prizes worth',
      value: `${sym} ${h.prizeTotalWorthAmount.toLocaleString('en-IN')}`,
    };
  }
  return { label: 'Entry Fee', value: h.isFree ? 'Free' : `₹ ${h.entryFeeAmount ?? '—'}` };
}

function formatEventFee(e: PublicEventResponse): string {
  if (e.isFree) return 'Free';
  if (e.entryFeeAmount) return `${e.currency === 'INR' ? 'INR' : e.currency} ${e.entryFeeAmount}`;
  return 'Paid';
}

function hackathonModeLabel(h: PublicHackathonResponse): string {
  const fee = h.isFree ? 'Free' : `₹${h.entryFeeAmount ?? ''}`;
  const mode = h.locationType === 'VIRTUAL' ? 'Online' : 'Offline';
  return `${fee} · ${mode}`;
}

// ─── Static categories (never change) ─────────────────────────────────────────
const CATEGORIES: readonly DiscoverCategoryItem[] = [
  { id: 'hackathons', label: 'Hackathons' },
  { id: 'competitions', label: 'Competitions' },
  { id: 'events', label: 'Events' },
  { id: 'communities', label: 'Communities' },
];

export class ApiDiscoverFeedRepository implements DiscoverFeedRepository {
  async getFeed(): Promise<DiscoverFeedEntity> {
    // Fetch hackathons and events in parallel
    const [hackathons, events] = await Promise.all([
      apiClient.get<PublicHackathonResponse[]>('/hackathons/public'),
      apiClient.get<PublicEventResponse[]>('/events/public'),
    ]);

    // ── Top listings: first 3 hackathons mapped to compact items ──────────────
    const defaultTopListings: DiscoverCompactItem[] = hackathons
      .slice(0, 3)
      .map((h, i) => {
        const { label: valueLabel, value } = formatPrize(h);
        return {
          kind: 'compact' as const,
          id: h.id,
          title: h.name,
          host: h.organizationName ?? h.owner.firstName ?? 'OppSkills',
          registerBy: fmtDeadline(h.registrationDeadline),
          eventDate: fmtDeadline(h.startDate),
          tagLabel: 'Hackathon',
          valueLabel,
          value,
          tone: cycleTone(i),
          imageUrl: h.bannerImageUrl || undefined,
        };
      });

    // ── Recent listings: first 2 events mapped to compact items ───────────────
    const defaultRecentListings: DiscoverCompactItem[] = events
      .slice(0, 2)
      .map((e, i) => ({
        kind: 'compact' as const,
        id: e.id,
        title: e.name,
        host: e.organizationName ?? e.owner.firstName ?? 'OppSkills',
        registerBy: fmtDeadline(e.registrationDeadline),
        eventDate: fmtDeadline(e.startDate),
        tagLabel: 'Event',
        valueLabel: 'Entry Fee',
        value: formatEventFee(e),
        tone: cycleTone(i + 1),
        imageUrl: e.bannerImageUrl || undefined,
      }));

    // ── Hackathon listings (CODING_HACKATHON type) ────────────────────────────
    const hackathonListings: DiscoverOpportunityItem[] = hackathons
      .filter((h) => h.hackathonType === 'CODING_HACKATHON' || !h.hackathonType)
      .slice(0, 5)
      .map((h, i) => {
        const { label: valueLabel, value } = formatPrize(h);
        return {
          kind: 'opportunity' as const,
          id: h.id,
          title: h.name,
          host: h.organizationName ?? h.owner.firstName ?? 'OppSkills',
          registerBy: fmtDeadline(h.registrationDeadline),
          tagLabel: 'Hackathon',
          modeLabel: hackathonModeLabel(h),
          valueLabel,
          value,
          tone: cycleTone(i),
          imageUrl: h.bannerImageUrl || undefined,
        };
      });

    // ── Competition listings (non-coding-hackathon opportunity items) ──────────
    const competitionListings: DiscoverOpportunityItem[] = hackathons
      .filter((h) => h.hackathonType !== 'CODING_HACKATHON')
      .slice(0, 5)
      .map((h, i) => {
        const { label: valueLabel, value } = formatPrize(h);
        return {
          kind: 'opportunity' as const,
          id: h.id,
          title: h.name,
          host: h.organizationName ?? h.owner.firstName ?? 'OppSkills',
          registerBy: fmtDeadline(h.registrationDeadline),
          tagLabel: 'Competition',
          modeLabel: hackathonModeLabel(h),
          valueLabel,
          value,
          tone: cycleTone(i + 2),
          imageUrl: h.bannerImageUrl || undefined,
        };
      });

    // ── Feature events listing ─────────────────────────────────────────────────
    const eventFeatureListings: DiscoverFeatureEventItem[] = events
      .slice(0, 5)
      .map((e, i) => ({
        kind: 'event-feature' as const,
        id: e.id,
        title: e.name,
        timing: fmtEventTiming(e.startDate),
        venue: e.locationType === 'VIRTUAL' ? 'Online' : (e.locationCity ?? 'Offline'),
        attendees: e.registrationCount,
        registerBy: fmtDeadline(e.registrationDeadline),
        entryFee: formatEventFee(e),
        tone: cycleTone(i + 1),
        imageUrl: e.bannerImageUrl || undefined,
      }));

    return {
      categories: CATEGORIES,
      defaultTopListings,
      defaultRecentListings,
      hackathonListings,
      competitionListings,
      eventCommunityListings: [], // Communities endpoint not yet implemented
      eventFeatureListings,
    };
  }
}
