// src/domains/events/data/repositories/ApiEventDetailRepository.ts
// Fetches event detail from GET /events/public/:id (no auth required).
// Response shape inferred from event.service.ts getPublicEventBySlug Prisma select.

import { apiClient } from '../../../../shared/api/apiClient';
import type { EventDetailRepository } from '../../domain/repositories/EventDetailRepository';
import type { OpportunityDetailModel } from '../../../../shared/types/opportunityDetail';

// ─── Backend Response Shape (from event.service.ts Prisma select) ─────────────
export interface PublicEventResponse {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  bannerImageUrl: string | null;
  startDate: string;
  endDate: string;
  status: string;
  approvalStatus: string | null;
  locationType: string | null;
  locationCity: string | null;
  locationAddress: string | null;
  locationVirtualLink: string | null;
  isFree: boolean;
  entryFeeAmount: number | null;
  currency: string;
  visibility: string;
  eventType: string | null;
  registrationCount: number;
  maxUsers: number | null;
  registrationDeadline: string | null;
  isRegistrationPaused: boolean;
  organizationName: string | null;
  organizationLogoUrl: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  attendeeEligibility: string[];
  createdAt: string;
  owner: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
    email?: string; // Included in getPublicEventBySlug but not list
  };
  festival: { id: string; name: string; slug: string } | null;
  attachments: Array<{
    id: string;
    storageKey?: string;
    publicUrl: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  }>;
  registrationForm: {
    id: string;
    externalFormLink: string | null;
    fields: Array<{
      id: string;
      label: string;
      type: string;
      required: boolean;
      order: number;
      options: string[];
    }>;
  } | null;
  prizeBreakdown: Array<{
    id: string;
    position: number;
    amount: number;
    description: string | null;
  }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'TBA';
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatEventFee(e: PublicEventResponse): string {
  if (e.isFree) return 'Free';
  if (e.entryFeeAmount) {
    const sym = e.currency === 'INR' ? '₹' : e.currency;
    return `${sym} ${e.entryFeeAmount}`;
  }
  return 'Paid';
}

function mapToDetail(e: PublicEventResponse): OpportunityDetailModel {
  const modeLabel = e.locationType === 'VIRTUAL' ? 'Online' : 'Offline';
  const locationDisplay = [e.locationCity, e.locationAddress].filter(Boolean).join(', ');

  return {
    routeLabel: 'Detail / Event',
    heroLabel: 'Event',
    heroTitle: e.name,
    aboutHeading: 'About Event',
    hostName: e.organizationName ?? e.owner.firstName ?? 'OppSkills',
    modeLabel,
    registrationDeadline: e.registrationDeadline
      ? formatDate(e.registrationDeadline)
      : 'No deadline',
    ctaLabel: e.isFree ? 'Register Free' : 'Buy Ticket',

    keyInfo: [
      { id: 'event-date', label: 'Event Date', value: formatDate(e.startDate) },
      { id: 'end-date', label: 'Event End Date', value: formatDate(e.endDate) },
      { id: 'location', label: 'Location', value: locationDisplay || modeLabel },
      { id: 'entry-fee', label: 'Entry Fee', value: formatEventFee(e) },
      { id: 'registrations', label: 'Registrations', value: String(e.registrationCount) },
      ...(e.maxUsers ? [{ id: 'capacity', label: 'Capacity', value: String(e.maxUsers) }] : []),
    ],

    aboutParagraphs: e.description
      ? e.description.split('\n').filter((p) => p.trim().length > 0)
      : ['No description provided.'],

    eligibility: e.attendeeEligibility.length > 0
      ? e.attendeeEligibility.map((el) =>
          el.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
        )
      : ['Open to all participants.'],

    rules: [],
    rounds: [],

    prizes: e.prizeBreakdown.map((p, i) => {
      const rankMap = ['Winner', '1st Runner Up', '2nd Runner Up'];
      return {
        id: p.id,
        rankLabel: rankMap[i] ?? `${p.position}th Place`,
        reward: `₹ ${p.amount.toLocaleString('en-IN')}`,
        bonusLabel: p.description ?? 'Certificate',
      };
    }),

    contact: {
      organizerName: e.contactName ?? e.owner.firstName ?? 'Organizer',
      phoneNumber: e.contactPhone ?? '',
      email: e.contactEmail ?? e.owner.email ?? '',
      venue: locationDisplay || (e.locationVirtualLink ? 'Online Event' : modeLabel),
    },
  };
}

// ─── Repository ───────────────────────────────────────────────────────────────

export class ApiEventDetailRepository implements EventDetailRepository {
  async getDetail(id: string): Promise<OpportunityDetailModel> {
    const response = await apiClient.get<PublicEventResponse>(`/events/public/${id}`);
    return mapToDetail(response);
  }
}
