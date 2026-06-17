import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../shared/api/apiClient';

export interface RegistrationsSummary {
  readonly totalRegistrations: number;
  readonly pendingReview: number;
  readonly approved: number;
}
export function useOrganizerRegistrationsSummary(enabled = true) {
  return useQuery({
    queryKey: ['organizer', 'registrations-summary'],
    queryFn: () => apiClient.getAuth<RegistrationsSummary>('/analytics/organizer/registrations-summary'),
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}

export interface OpportunitiesSummary {
  readonly draftsInProgress: number;
  readonly readyToPublish: number;
  readonly avgSetupTime: string;
}
export function useOrganizerOpportunitiesSummary(enabled = true) {
  return useQuery({
    queryKey: ['organizer', 'opportunities-summary'],
    queryFn: () => apiClient.getAuth<OpportunitiesSummary>('/analytics/organizer/opportunities-summary'),
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}

export interface PaymentsSummary {
  readonly totalCollected: string;
  readonly pendingPayout: string;
  readonly refunds: number;
}
export function useOrganizerPaymentsSummary(enabled = true) {
  return useQuery({
    queryKey: ['organizer', 'payments-summary'],
    queryFn: () => apiClient.getAuth<PaymentsSummary>('/analytics/organizer/payments-summary'),
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}

export interface RolesSummary {
  readonly verifiedCampuses: number;
  readonly adminSeats: number;
  readonly renewalsDue: number;
}
export function useOrganizerRolesSummary(enabled = true) {
  return useQuery({
    queryKey: ['organizer', 'roles-summary'],
    queryFn: () => apiClient.getAuth<RolesSummary>('/analytics/organizer/roles-summary'),
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}

export interface NotificationsSummary {
  readonly queuedAlerts: number;
  readonly sentToday: number;
  readonly openRate: string;
}
export function useOrganizerNotificationsSummary(enabled = true) {
  return useQuery({
    queryKey: ['organizer', 'notifications-summary'],
    queryFn: () => apiClient.getAuth<NotificationsSummary>('/analytics/organizer/notifications-summary'),
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}

export interface ReferralsSummary {
  readonly totalReferrals: number;
  readonly converted: number;
  readonly rewardsIssued: number;
}
export function useOrganizerReferralsSummary(enabled = true) {
  return useQuery({
    queryKey: ['organizer', 'referrals-summary'],
    queryFn: () => apiClient.getAuth<ReferralsSummary>('/analytics/organizer/referrals-summary'),
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}

export interface PipelineSummary {
  readonly totalRegistrations: number;
  readonly shortlisted: number;
  readonly waitlisted: number;
}
export function useOrganizerPipelineSummary(enabled = true) {
  return useQuery({
    queryKey: ['organizer', 'pipeline-summary'],
    queryFn: () => apiClient.getAuth<PipelineSummary>('/analytics/organizer/pipeline-summary'),
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}

export interface SettingsSummary {
  readonly activeIntegrations: number;
  readonly teamMembers: number;
}
export function useOrganizerSettingsSummary(enabled = true) {
  return useQuery({
    queryKey: ['organizer', 'settings-summary'],
    queryFn: () => apiClient.getAuth<SettingsSummary>('/analytics/organizer/settings-summary'),
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}
