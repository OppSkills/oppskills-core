import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/apiClient';

export interface NotificationCampaign {
  readonly id: string;
  readonly content: string;
  readonly scheduleType: 'IMMEDIATELY' | 'CUSTOM';
  readonly scheduledAt: string | null;
  readonly status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  readonly totalRecipients: number;
  readonly successCount: number;
  readonly failedCount: number;
  readonly completedAt: string | null;
  readonly createdAt: string;
}

export function useHackathonCampaigns(hackathonId: string) {
  return useQuery<NotificationCampaign[]>({
    queryKey: ['notif-campaigns', 'hackathon', hackathonId],
    queryFn: () => apiClient.getAuth<NotificationCampaign[]>(`/notification/hackathon/${hackathonId}`),
    enabled: !!hackathonId,
    staleTime: 1000 * 30,
  });
}

export function useEventCampaigns(eventId: string) {
  return useQuery<NotificationCampaign[]>({
    queryKey: ['notif-campaigns', 'event', eventId],
    queryFn: () => apiClient.getAuth<NotificationCampaign[]>(`/notification/event/${eventId}`),
    enabled: !!eventId,
    staleTime: 1000 * 30,
  });
}

export function useScheduleNotification(entityType: 'hackathon' | 'event', entityId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      content: string;
      scheduleType: 'IMMEDIATELY' | 'CUSTOM';
      scheduledAt?: string;
    }) =>
      apiClient.post('/notification/schedule', {
        ...(entityType === 'hackathon' ? { hackathonId: entityId } : { eventId: entityId }),
        ...payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notif-campaigns', entityType, entityId] });
    },
  });
}

export function useCancelCampaign(entityType: 'hackathon' | 'event', entityId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (campaignId: string) => apiClient.delete(`/notification/${campaignId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notif-campaigns', entityType, entityId] });
    },
  });
}

export function useSendBulkEmail(entityType: 'hackathon' | 'event', entityId: string) {
  return useMutation({
    mutationFn: (htmlBody: string) =>
      apiClient.post('/email/bulk', {
        ...(entityType === 'hackathon' ? { hackathonId: entityId } : { eventId: entityId }),
        htmlBody,
      }),
  });
}
