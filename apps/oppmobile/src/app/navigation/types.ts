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
  [appRoutes.homeTab]: undefined;
  [appRoutes.competitionPage]: undefined;
  [appRoutes.hackathonPage]: undefined;
};

export type DiscoverStackParamList = {
  [appRoutes.discoverTab]: undefined;
  [appRoutes.discoverHackathons]: undefined;
  [appRoutes.discoverCompetitions]: undefined;
  [appRoutes.discoverEventsPrimary]: undefined;
  [appRoutes.discoverEventsSecondary]: undefined;
  [appRoutes.searchRecent]: undefined;
  [appRoutes.searchPopular]: undefined;
  [appRoutes.searchTyping]: undefined;
  [appRoutes.searchResults]: undefined;
  [appRoutes.competitionPage]: undefined;
  [appRoutes.hackathonPage]: undefined;
};

export type AppliedStackParamList = {
  [appRoutes.appliedTab]: undefined;
  [appRoutes.competitionPage]: undefined;
  [appRoutes.hackathonPage]: undefined;
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
