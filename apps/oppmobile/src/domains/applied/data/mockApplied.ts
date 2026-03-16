export type AppliedFilterId = 'all' | 'events' | 'communities' | 'competitions' | 'hackathons';

export type AppliedTimelineStageId = 'registration' | 'team' | 'payment' | 'extended-form';

export interface AppliedTimelineStage {
  readonly id: AppliedTimelineStageId;
  readonly label: string;
}

export interface AppliedFilter {
  readonly id: AppliedFilterId;
  readonly label: string;
}

export interface AppliedActionState {
  readonly type: 'complete-now' | 'registration-complete';
  readonly label: string;
}

export interface AppliedCardItem {
  readonly id: string;
  readonly title: string;
  readonly host: string;
  readonly tagLabel: string;
  readonly category: Exclude<AppliedFilterId, 'all'>;
  readonly registeredOn: string;
  readonly applicantEmail: string;
  readonly teamName: string;
  readonly timelineCompleteThroughStageId: AppliedTimelineStageId;
  readonly actionState: AppliedActionState;
}

export const appliedFilters: readonly AppliedFilter[] = [
  { id: 'all', label: 'All (5)' },
  { id: 'events', label: 'Events' },
  { id: 'communities', label: 'Communities' },
  { id: 'competitions', label: 'Competitions' },
  { id: 'hackathons', label: 'Hackathons' },
];

export const appliedTimelineStages: readonly AppliedTimelineStage[] = [
  { id: 'registration', label: 'Registration' },
  { id: 'team', label: 'Team' },
  { id: 'payment', label: 'Payment' },
  { id: 'extended-form', label: 'Extended Form' },
];

export const appliedCardItems: readonly AppliedCardItem[] = [
  {
    id: 'applied-1',
    title: 'Hackathon Hackathon 1.0 on 1.0',
    host: 'Kalinga Institute of Management',
    tagLabel: 'Hackathon',
    category: 'hackathons',
    registeredOn: '01 March 2026',
    applicantEmail: 'rohanvats12@gmail.com',
    teamName: 'Team Titanic',
    timelineCompleteThroughStageId: 'payment',
    actionState: {
      type: 'complete-now',
      label: 'Complete Now',
    },
  },
  {
    id: 'applied-2',
    title: 'Public Speaking Competition',
    host: 'Kalinga Institute of Management',
    tagLabel: 'Competition',
    category: 'competitions',
    registeredOn: '01 March 2026',
    applicantEmail: 'neha.verma@gmail.com',
    teamName: 'Orator Squad',
    timelineCompleteThroughStageId: 'extended-form',
    actionState: {
      type: 'registration-complete',
      label: 'Registration Complete',
    },
  },
  {
    id: 'applied-3',
    title: 'Top 15 AI Skills You Need to Know in 2026',
    host: 'OppSkills Events Network',
    tagLabel: 'Event',
    category: 'events',
    registeredOn: '28 February 2026',
    applicantEmail: 'rohanvats12@gmail.com',
    teamName: 'Solo',
    timelineCompleteThroughStageId: 'team',
    actionState: {
      type: 'complete-now',
      label: 'Complete Now',
    },
  },
  {
    id: 'applied-4',
    title: 'HSK Developers Community Challenge',
    host: 'Hisar Student Circle',
    tagLabel: 'Community',
    category: 'communities',
    registeredOn: '24 February 2026',
    applicantEmail: 'ananya.rai@gmail.com',
    teamName: 'HSK Core',
    timelineCompleteThroughStageId: 'registration',
    actionState: {
      type: 'complete-now',
      label: 'Complete Now',
    },
  },
  {
    id: 'applied-5',
    title: 'Treasure Hunt Campus Sprint',
    host: 'Kalinga Institute of Management',
    tagLabel: 'Hackathon',
    category: 'hackathons',
    registeredOn: '01 March 2026',
    applicantEmail: 'rohanvats12@gmail.com',
    teamName: 'Team Titanic',
    timelineCompleteThroughStageId: 'extended-form',
    actionState: {
      type: 'registration-complete',
      label: 'Registration Complete',
    },
  },
];