import { opportunityTags } from '../constants/semantic';
import type { OpportunityTag } from '../constants/semantic';

const tagLabels: Record<OpportunityTag, string> = {
  [opportunityTags.hackathon]: 'Hackathon',
  [opportunityTags.competition]: 'Competition',
  [opportunityTags.event]: 'Event',
  [opportunityTags.community]: 'Community',
};

export function mapOpportunityTag(tag: OpportunityTag): string {
  return tagLabels[tag];
}