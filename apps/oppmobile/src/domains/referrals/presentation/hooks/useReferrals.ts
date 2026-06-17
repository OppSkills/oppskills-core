import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../../shared/api/apiClient';
import type {
  GenerateReferralDto,
  ReferralPerformanceDto,
  ReferredRegistrationDto,
  TrackClickDto,
} from '@oppskills/types/dist/dtos/backend';

export function useReferralPerformance() {
  return useQuery<ReferralPerformanceDto>({
    queryKey: ['referrals', 'performance'],
    queryFn: async () => {
      const response = await apiClient.request<ReferralPerformanceDto>({
        method: 'GET',
        url: '/referrals/my/performance',
      });
      return response.data;
    },
  });
}

export function useReferredUsers() {
  return useQuery<ReferredRegistrationDto[]>({
    queryKey: ['referrals', 'referred-users'],
    queryFn: async () => {
      const response = await apiClient.request<ReferredRegistrationDto[]>({
        method: 'GET',
        url: '/referrals/my/referred-users',
      });
      return response.data;
    },
  });
}

export function useGenerateReferral() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: GenerateReferralDto) => {
      const response = await apiClient.request<{
        id: string;
        code: string;
        entityType: string;
        entityId: string;
        referrerId: string;
        clicks: number;
        createdAt: string;
        updatedAt: string;
      }>({
        method: 'POST',
        url: '/referrals',
        data: dto,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
    },
  });
}

export function useTrackClick() {
  return useMutation({
    mutationFn: async (dto: TrackClickDto) => {
      const response = await apiClient.request<{ success: boolean }>({
        method: 'POST',
        url: '/referrals/public/track-click',
        data: dto,
      });
      return response.data;
    },
  });
}

export interface ReferrerDetail {
  id: string;
  name: string;
  email: string;
  link: string;
  clicks: number;
  registrations: number;
  clicksLast24: number;
  regsLast24: number;
  avatarUrl?: string;
  isOrganizer: boolean;
}

export function useEntityReferrals(entityType: string, entityId: string) {
  return useQuery<ReferrerDetail[]>({
    queryKey: ['referrals', 'entity', entityType, entityId],
    queryFn: async () => {
      const response = await apiClient.request<ReferrerDetail[]>({
        method: 'GET',
        url: `/referrals/entity/${entityType}/${entityId}`,
      });
      return response.data;
    },
    enabled: !!entityId && !!entityType,
  });
}
