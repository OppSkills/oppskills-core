// src/domains/applied/data/repositories/ApiAppliedFeedRepository.ts
// Fetches the current user's event registrations from GET /events/my (authenticated).
// The backend event service's listMyEvents returns a sanitized, lightweight shape.
// Maps to AppliedFeedEntity for the Applied/Registrations screen.

import { apiClient } from '../../../../shared/api/apiClient';
import type { AppliedFeedEntity, AppliedCardItemEntity } from '../../domain/entities/AppliedFeed';
import type { AppliedFeedRepository } from '../../domain/repositories/AppliedFeedRepository';

// ─── Backend Response (from event.service.ts listMyEvents) ───────────────────
interface MyEventItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  approvalStatus: string | null;
  startDate: string;
  endDate: string;
  registrationCount: number;
  maxUsers: number | null;
  registrationDeadline: string | null;
  isRegistrationPaused: boolean;
  role?: 'OWNER' | 'MANAGER';
}

// ─── Static filters and timeline stages ──────────────────────────────────────
// These are UI constants — always the same regardless of API data.
const FILTERS = [
  { id: 'all' as const, label: 'All' },
  { id: 'events' as const, label: 'Events' },
  { id: 'communities' as const, label: 'Communities' },
  { id: 'competitions' as const, label: 'Competitions' },
  { id: 'hackathons' as const, label: 'Hackathons' },
];

const TIMELINE_STAGES = [
  { id: 'registration' as const, label: 'Registration' },
  { id: 'team' as const, label: 'Team' },
  { id: 'payment' as const, label: 'Payment' },
  { id: 'extended-form' as const, label: 'Extended Form' },
];

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapMyEventToCard(event: MyEventItem, _index: number): AppliedCardItemEntity {
  const date = new Date(event.startDate);
  const registeredOn = date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const isComplete =
    event.status === 'COMPLETED' || event.status === 'ONGOING';

  return {
    id: event.id,
    title: event.name,
    host: 'OppSkills Events',
    tagLabel: 'Event',
    category: 'events' as const,
    registeredOn,
    applicantEmail: '',
    teamName: 'Solo',
    // Mark registration as complete through 'team' stage if event is active
    timelineCompleteThroughStageId: isComplete ? 'team' : 'registration',
    actionState: {
      type: isComplete ? 'registration-complete' : 'complete-now',
      label: isComplete ? 'Registration Complete' : 'Complete Now',
    },
  };
}

export class ApiAppliedFeedRepository implements AppliedFeedRepository {
  async getFeed(): Promise<AppliedFeedEntity> {
    const myEvents = await apiClient.getAuth<MyEventItem[]>('/events/my');

    const cards = myEvents.map(mapMyEventToCard);

    // Update the 'All' filter label to show actual count
    const filters = FILTERS.map((f) =>
      f.id === 'all' ? { ...f, label: `All (${cards.length})` } : f,
    );

    return {
      filters,
      timelineStages: TIMELINE_STAGES,
      cards,
    };
  }
}
