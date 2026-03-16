export type AppliedFilterIdEntity = 'all' | 'events' | 'communities' | 'competitions' | 'hackathons';

export type AppliedTimelineStageIdEntity = 'registration' | 'team' | 'payment' | 'extended-form';

export interface AppliedTimelineStageEntity {
  readonly id: AppliedTimelineStageIdEntity;
  readonly label: string;
}

export interface AppliedFilterEntity {
  readonly id: AppliedFilterIdEntity;
  readonly label: string;
}

export interface AppliedActionStateEntity {
  readonly type: 'complete-now' | 'registration-complete';
  readonly label: string;
}

export interface AppliedCardItemEntity {
  readonly id: string;
  readonly title: string;
  readonly host: string;
  readonly tagLabel: string;
  readonly category: Exclude<AppliedFilterIdEntity, 'all'>;
  readonly registeredOn: string;
  readonly applicantEmail: string;
  readonly teamName: string;
  readonly timelineCompleteThroughStageId: AppliedTimelineStageIdEntity;
  readonly actionState: AppliedActionStateEntity;
}

export interface AppliedFeedEntity {
  readonly filters: readonly AppliedFilterEntity[];
  readonly timelineStages: readonly AppliedTimelineStageEntity[];
  readonly cards: readonly AppliedCardItemEntity[];
}
