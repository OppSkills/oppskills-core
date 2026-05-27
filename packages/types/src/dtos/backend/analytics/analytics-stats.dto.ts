export interface AnalyticsGeneralStatsDto {
  registrations: number; // Global total
  periodRegistrations: number; // Count for the selected date range
  views: string; // BigInt serialized as string
  impressions: string; // BigInt serialized as string
}

export interface OrganizerRegistrationsSummaryDto {
  totalRegistrations: number;
  pendingReview: number;
  approved: number;
}

export interface OrganizerOpportunitiesSummaryDto {
  draftsInProgress: number;
  readyToPublish: number;
  avgSetupTime: string;
}

export interface OrganizerPaymentsSummaryDto {
  totalCollected: number;
  pendingPayout: number;
  refunds: number;
}

export interface OrganizerRolesSummaryDto {
  verifiedCampuses: number;
  adminSeats: number;
  renewalsDue: number;
}

export interface OrganizerNotificationsSummaryDto {
  queuedAlerts: number;
  sentToday: number;
  openRate: number;
}

export interface OrganizerReferralsSummaryDto {
  totalReferrals: number;
  converted: number;
  rewardsIssued: number;
}

export interface OrganizerPipelineSummaryDto {
  totalRegistrations: number;
  shortlisted: number;
  waitlisted: number;
}

export interface OrganizerSettingsSummaryDto {
  activeIntegrations: number;
  teamMembers: number;
}
