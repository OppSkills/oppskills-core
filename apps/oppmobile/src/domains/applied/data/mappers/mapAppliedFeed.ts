import type { AppliedFeedEntity } from '../../domain/entities/AppliedFeed';
import { appliedCardItems, appliedFilters, appliedTimelineStages } from '../mockApplied';

export function mapAppliedFeed(): AppliedFeedEntity {
  return {
    filters: [...appliedFilters],
    timelineStages: [...appliedTimelineStages],
    cards: [...appliedCardItems],
  };
}
