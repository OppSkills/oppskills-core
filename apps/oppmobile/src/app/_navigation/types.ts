import type { NavigatorScreenParams } from '@react-navigation/native';

import { appRoutes } from '../../shared/constants/routes';

export type OnboardingStackParamList = {
  [appRoutes.intro]: undefined;
  [appRoutes.onboarding7]: undefined;
  [appRoutes.onboarding8]: undefined;
  [appRoutes.onboarding9]: undefined;
};

export type AuthStackParamList = {
  [appRoutes.signUp]: undefined;
  [appRoutes.verifyIdentityOtpEmpty]: undefined;
  [appRoutes.verifyIdentityOtpFilled]: undefined;
  [appRoutes.profileSetupPersonal]: undefined;
  [appRoutes.profileSetupEducation]: undefined;
  [appRoutes.profileSetupSkills]: undefined;
  [appRoutes.signIn]: undefined;
};

export type HomeStackParamList = {
  [appRoutes.homeStack]: undefined;
  [appRoutes.organizerDashboard]: undefined;
  [appRoutes.profilePage]: undefined;
  [appRoutes.profileEditPage]: undefined;
  [appRoutes.competitionPage]: { competitionId: string };
  [appRoutes.hackathonPage]: { hackathonId: string };
};

export type DiscoverStackParamList = {
  [appRoutes.discoverStack]: undefined;
  [appRoutes.discoverHackathons]: undefined;
  [appRoutes.discoverCompetitions]: undefined;
  [appRoutes.discoverEventsPrimary]: undefined;
  [appRoutes.discoverEventsSecondary]: undefined;
  [appRoutes.eventPageFree]: { eventId: string };
  [appRoutes.eventPagePaid]: { eventId: string };
  [appRoutes.searchRecent]: undefined;
  [appRoutes.searchPopular]: undefined;
  [appRoutes.searchTyping]: undefined;
  [appRoutes.searchResults]: undefined;
  [appRoutes.competitionPage]: { competitionId: string };
  [appRoutes.hackathonPage]: { hackathonId: string };
  [appRoutes.hackathonRegistration]: { hackathonId: string; title?: string; bannerImageUrl?: string | null };
};

export type AppliedStackParamList = {
  [appRoutes.appliedStack]: undefined;
  [appRoutes.competitionPage]: { competitionId: string };
  [appRoutes.hackathonPage]: { hackathonId: string };
  [appRoutes.eventPageFree]: { eventId: string };
};

export type MainTabParamList = {
  [appRoutes.homeTab]: NavigatorScreenParams<HomeStackParamList>;
  [appRoutes.discoverTab]: NavigatorScreenParams<DiscoverStackParamList>;
  [appRoutes.appliedTab]: NavigatorScreenParams<AppliedStackParamList>;
};

export type RootNavigationParamList = {
  [appRoutes.onboardingStack]: NavigatorScreenParams<OnboardingStackParamList>;
  [appRoutes.authStack]: NavigatorScreenParams<AuthStackParamList>;
  [appRoutes.mainTabs]: NavigatorScreenParams<MainTabParamList>;
};
