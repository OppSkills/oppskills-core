export const appRoutes = {
  onboardingStack: 'onboarding-stack',
  authStack: 'auth-stack',
  mainTabs: 'main-tabs',
  homeStack: 'home-stack',
  discoverStack: 'discover-stack',
  appliedStack: 'applied-stack',
  intro: 'intro',
  onboarding7: 'onboarding-7',
  onboarding8: 'onboarding-8',
  onboarding9: 'onboarding-9',
  signUp: 'sign-up',
  verifyIdentityOtpEmpty: 'verify-identity-otp-empty',
  verifyIdentityOtpFilled: 'verify-identity-otp-filled',
  profileSetupPersonal: 'profile-setup-personal',
  profileSetupEducation: 'profile-setup-education',
  profileSetupSkills: 'profile-setup-skills',
  signIn: 'sign-in',
  homeTab: 'home-tab',
  discoverTab: 'discover-tab',
  appliedTab: 'applied-tab',
  discoverHackathons: 'discover-hackathons',
  discoverCompetitions: 'discover-competitions',
  discoverEventsPrimary: 'discover-events-primary',
  discoverEventsSecondary: 'discover-events-secondary',
  searchRecent: 'search-recent',
  searchPopular: 'search-popular',
  searchTyping: 'search-typing',
  searchResults: 'search-results',
  competitionPage: 'competition-page',
  hackathonPage: 'hackathon-page',
} as const;

export type AppRoute = (typeof appRoutes)[keyof typeof appRoutes];

export const onboardingFlowRoutes = [
  appRoutes.intro,
  appRoutes.onboarding7,
  appRoutes.onboarding8,
  appRoutes.onboarding9,
] as const;

export const authFlowRoutes = [
  appRoutes.signUp,
  appRoutes.verifyIdentityOtpEmpty,
  appRoutes.verifyIdentityOtpFilled,
  appRoutes.profileSetupPersonal,
  appRoutes.profileSetupEducation,
  appRoutes.profileSetupSkills,
  appRoutes.signIn,
] as const;

export const mainTabRoutes = [appRoutes.homeTab, appRoutes.discoverTab, appRoutes.appliedTab] as const;

export const discoverFlowRoutes = [
  appRoutes.discoverTab,
  appRoutes.discoverHackathons,
  appRoutes.discoverCompetitions,
  appRoutes.discoverEventsPrimary,
  appRoutes.discoverEventsSecondary,
] as const;

export const searchFlowRoutes = [
  appRoutes.searchRecent,
  appRoutes.searchPopular,
  appRoutes.searchTyping,
  appRoutes.searchResults,
] as const;

export const detailRoutes = [appRoutes.competitionPage, appRoutes.hackathonPage] as const;

export const deepLinkPrefixes = ['oppskills://', 'https://oppskills.app'] as const;