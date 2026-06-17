import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../shared/api/apiClient';

export interface UserProfile {
  id: string;
  email: string;
  onboarded: boolean;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  onboardingProfile?: {
    userCategory: string;
    gender: string;
    schoolName?: string | null;
    schoolClass?: string | null;
    schoolAddress?: string | null;
    collegeId?: string | null;
    college?: { id: string; name: string } | null;
    collegeCurrentYear?: string | null;
    collegePassoutYear?: number | null;
    collegeSkipped?: boolean | null;
    course?: string | null;
    specialization?: string | null;
    rollNumber?: string | null;
    companyName?: string | null;
    jobTitle?: string | null;
    locationCity?: string | null;
    locationState?: string | null;
    locationCountry?: string | null;
    interests?: string[] | null;
    skills?: string[] | null;
    experienceLevel?: string | null;
    teamPreference?: string | null;
  } | null;
  stats?: {
    events: number;
    competitions: number;
    certificates: number;
  } | null;
}

import { useAuth } from '@clerk/clerk-expo';

export function useCurrentUser(enabled: boolean = true) {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['user', 'me', userId],
    queryFn: () => apiClient.getAuth<UserProfile>('/user-accounts/me'),
    enabled: enabled && !!userId,
  });
}
