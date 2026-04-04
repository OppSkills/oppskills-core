export type OpportunityDetailTabId = 'rounds' | 'details' | 'prizes' | 'contact';

export interface OpportunityKeyInfoItem {
  readonly id: string;
  readonly label: string;
  readonly value: string;
}

export interface OpportunityRoundCard {
  readonly id: string;
  readonly stageLabel: string;
  readonly title: string;
  readonly timeline: string;
  readonly checkpoints: readonly string[];
}

export interface OpportunityPrizeCard {
  readonly id: string;
  readonly rankLabel: string;
  readonly reward: string;
  readonly bonusLabel: string;
}

export interface OpportunityContactInfo {
  readonly organizerName: string;
  readonly phoneNumber: string;
  readonly email: string;
  readonly venue: string;
}

export interface OpportunityDetailModel {
  readonly routeLabel: string;
  readonly heroLabel: string;
  readonly heroTitle: string;
  readonly aboutHeading?: string;
  readonly hostName: string;
  readonly modeLabel: string;
  readonly registrationDeadline: string;
  readonly ctaLabel: string;
  readonly keyInfo: readonly OpportunityKeyInfoItem[];
  readonly aboutParagraphs: readonly string[];
  readonly eligibility: readonly string[];
  readonly rules: readonly string[];
  readonly rounds: readonly OpportunityRoundCard[];
  readonly prizes: readonly OpportunityPrizeCard[];
  readonly contact: OpportunityContactInfo;
}