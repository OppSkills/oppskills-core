export const domainKeys = {
  authOnboarding: 'auth-onboarding',
  hackathons: 'hackathons',
  competitions: 'competitions',
  events: 'events',
  communities: 'communities',
  applied: 'applied',
  search: 'search',
  users: 'users',
  userAccounts: 'user-accounts',
  media: 'media',
  colleges: 'colleges',
} as const;

export type DomainKey = (typeof domainKeys)[keyof typeof domainKeys];

export const opportunityTags = {
  hackathon: 'hackathon',
  competition: 'competition',
  event: 'event',
  community: 'community',
} as const;

export type OpportunityTag = (typeof opportunityTags)[keyof typeof opportunityTags];

export const deliveryStatuses = {
  notStarted: 'not-started',
  inProgress: 'in-progress',
  readyForReview: 'ready-for-review',
  approved: 'approved',
} as const;

export type DeliveryStatus = (typeof deliveryStatuses)[keyof typeof deliveryStatuses];
