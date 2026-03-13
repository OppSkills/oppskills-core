import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  IntroScreen,
  OnboardingEightScreen,
  OnboardingNineScreen,
  OnboardingSevenScreen,
  ProfileSetupEducationScreen,
  ProfileSetupPersonalScreen,
  ProfileSetupSkillsScreen,
  SignInScreen,
  SignUpScreen,
  VerifyIdentityScreen,
} from '../../domains/auth-onboarding/presentation/screens/OnboardingAuthScreens';
import { AppliedScreen } from '../../domains/applied/presentation/screens/AppliedScreen';
import {
  CompetitionPageScreen,
  DiscoverCompetitionsScreen,
} from '../../domains/competitions/presentation/screens/CompetitionScreens';
import { DiscoverPageScreen } from '../../domains/communities/presentation/screens/DiscoverScreens';
import {
  DiscoverEventsPrimaryScreen,
  DiscoverEventsSecondaryScreen,
} from '../../domains/events/presentation/screens/EventScreens';
import {
  DiscoverHackathonsScreen,
  HackathonPageScreen,
} from '../../domains/hackathons/presentation/screens/HackathonScreens';
import {
  SearchPagePopularScreen,
  SearchPageRecentScreen,
  SearchPageResultsScreen,
  SearchPageTypingScreen,
} from '../../domains/search/presentation/screens/SearchScreens';
import { useMockSession } from '../../domains/user-accounts/presentation/providers/MockSessionProvider';
import { HomePageScreen } from '../../domains/users/presentation/screens/HomePageScreen';
import { appRoutes } from '../../shared/constants/routes';
import { lightTheme } from '../../shared/theme';
import type {
  AppliedStackParamList,
  AuthStackParamList,
  DiscoverStackParamList,
  HomeStackParamList,
  MainTabParamList,
  OnboardingStackParamList,
} from './types';

const OnboardingStack = createNativeStackNavigator<OnboardingStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const DiscoverStack = createNativeStackNavigator<DiscoverStackParamList>();
const AppliedStack = createNativeStackNavigator<AppliedStackParamList>();
const MainTabs = createBottomTabNavigator<MainTabParamList>();

function OnboardingNavigator() {
  const session = useMockSession();

  return (
    <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
      <OnboardingStack.Screen name={appRoutes.intro}>
        {({ navigation }) => (
          <IntroScreen
            onReturningUser={session.continueAsReturningUser}
            onStart={() => navigation.navigate(appRoutes.onboarding7)}
          />
        )}
      </OnboardingStack.Screen>
      <OnboardingStack.Screen name={appRoutes.onboarding7}>
        {({ navigation }) => (
          <OnboardingSevenScreen
            onNext={() => navigation.navigate(appRoutes.onboarding8)}
            onSkip={session.continueAsReturningUser}
          />
        )}
      </OnboardingStack.Screen>
      <OnboardingStack.Screen name={appRoutes.onboarding8}>
        {({ navigation }) => (
          <OnboardingEightScreen
            onNext={() => navigation.navigate(appRoutes.onboarding9)}
            onSkip={session.continueAsReturningUser}
          />
        )}
      </OnboardingStack.Screen>
      <OnboardingStack.Screen name={appRoutes.onboarding9}>
        {() => (
          <OnboardingNineScreen
            onGetStarted={session.completeOnboarding}
            onSignIn={session.continueAsReturningUser}
          />
        )}
      </OnboardingStack.Screen>
    </OnboardingStack.Navigator>
  );
}

function AuthNavigator() {
  const session = useMockSession();

  return (
    <AuthStack.Navigator
      initialRouteName={session.authEntryRoute === 'sign-in' ? appRoutes.signIn : appRoutes.signUp}
      screenOptions={{ headerShown: false }}
    >
      <AuthStack.Screen name={appRoutes.signUp}>
        {({ navigation }) => (
          <SignUpScreen
            onContinue={() => navigation.navigate(appRoutes.verifyIdentityOtpEmpty)}
            onSignIn={() => navigation.navigate(appRoutes.signIn)}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name={appRoutes.verifyIdentityOtpEmpty}>
        {({ navigation }) => (
          <VerifyIdentityScreen
            onContinue={() => navigation.navigate(appRoutes.verifyIdentityOtpFilled)}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name={appRoutes.verifyIdentityOtpFilled}>
        {({ navigation }) => (
          <VerifyIdentityScreen filled onContinue={() => navigation.navigate(appRoutes.profileSetupPersonal)} />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name={appRoutes.profileSetupPersonal}>
        {({ navigation }) => (
          <ProfileSetupPersonalScreen
            onContinue={() => navigation.navigate(appRoutes.profileSetupEducation)}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name={appRoutes.profileSetupEducation}>
        {({ navigation }) => (
          <ProfileSetupEducationScreen
            onContinue={() => navigation.navigate(appRoutes.profileSetupSkills)}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name={appRoutes.profileSetupSkills}>
        {({ navigation }) => (
          <ProfileSetupSkillsScreen
            onContinue={() => navigation.navigate(appRoutes.signIn)}
            onSkip={() => navigation.navigate(appRoutes.signIn)}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name={appRoutes.signIn}>
        {({ navigation }) => (
          <SignInScreen
            onContinue={session.signIn}
            onSignUp={() => navigation.navigate(appRoutes.signUp)}
          />
        )}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

function HomeStackNavigator() {
  const session = useMockSession();

  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name={appRoutes.homeTab}>
        {({ navigation }) => (
          <HomePageScreen
            onOpenCompetition={() => navigation.navigate(appRoutes.competitionPage)}
            onOpenHackathon={() => navigation.navigate(appRoutes.hackathonPage)}
            onRestartOnboarding={session.restartOnboarding}
          />
        )}
      </HomeStack.Screen>
      <HomeStack.Screen name={appRoutes.competitionPage}>
        {({ navigation }) => (
          <CompetitionPageScreen onBackToDiscover={() => navigation.navigate(appRoutes.homeTab)} />
        )}
      </HomeStack.Screen>
      <HomeStack.Screen name={appRoutes.hackathonPage}>
        {({ navigation }) => (
          <HackathonPageScreen onBackToDiscover={() => navigation.navigate(appRoutes.homeTab)} />
        )}
      </HomeStack.Screen>
    </HomeStack.Navigator>
  );
}

function DiscoverStackNavigator() {
  return (
    <DiscoverStack.Navigator screenOptions={{ headerShown: false }}>
      <DiscoverStack.Screen name={appRoutes.discoverTab}>
        {({ navigation }) => (
          <DiscoverPageScreen
            onCompetitions={() => navigation.navigate(appRoutes.discoverCompetitions)}
            onEventsPrimary={() => navigation.navigate(appRoutes.discoverEventsPrimary)}
            onEventsSecondary={() => navigation.navigate(appRoutes.discoverEventsSecondary)}
            onHackathons={() => navigation.navigate(appRoutes.discoverHackathons)}
            onSearchRecent={() => navigation.navigate(appRoutes.searchRecent)}
          />
        )}
      </DiscoverStack.Screen>
      <DiscoverStack.Screen name={appRoutes.discoverHackathons}>
        {({ navigation }) => (
          <DiscoverHackathonsScreen
            onOpenHackathonPage={() => navigation.navigate(appRoutes.hackathonPage)}
            onSearchTyping={() => navigation.navigate(appRoutes.searchTyping)}
          />
        )}
      </DiscoverStack.Screen>
      <DiscoverStack.Screen name={appRoutes.discoverCompetitions}>
        {({ navigation }) => (
          <DiscoverCompetitionsScreen
            onOpenCompetitionPage={() => navigation.navigate(appRoutes.competitionPage)}
            onSearchResults={() => navigation.navigate(appRoutes.searchResults)}
          />
        )}
      </DiscoverStack.Screen>
      <DiscoverStack.Screen name={appRoutes.discoverEventsPrimary}>
        {({ navigation }) => (
          <DiscoverEventsPrimaryScreen
            onOpenEventsSecondary={() => navigation.navigate(appRoutes.discoverEventsSecondary)}
            onOpenSearchRecent={() => navigation.navigate(appRoutes.searchRecent)}
          />
        )}
      </DiscoverStack.Screen>
      <DiscoverStack.Screen name={appRoutes.discoverEventsSecondary}>
        {({ navigation }) => (
          <DiscoverEventsSecondaryScreen
            onOpenEventsPrimary={() => navigation.navigate(appRoutes.discoverEventsPrimary)}
            onOpenSearchPopular={() => navigation.navigate(appRoutes.searchPopular)}
          />
        )}
      </DiscoverStack.Screen>
      <DiscoverStack.Screen name={appRoutes.searchRecent}>
        {({ navigation }) => (
          <SearchPageRecentScreen
            onPopular={() => navigation.navigate(appRoutes.searchPopular)}
            onTyping={() => navigation.navigate(appRoutes.searchTyping)}
          />
        )}
      </DiscoverStack.Screen>
      <DiscoverStack.Screen name={appRoutes.searchPopular}>
        {({ navigation }) => (
          <SearchPagePopularScreen
            onRecent={() => navigation.navigate(appRoutes.searchRecent)}
            onTyping={() => navigation.navigate(appRoutes.searchTyping)}
          />
        )}
      </DiscoverStack.Screen>
      <DiscoverStack.Screen name={appRoutes.searchTyping}>
        {({ navigation }) => (
          <SearchPageTypingScreen
            onPopular={() => navigation.navigate(appRoutes.searchPopular)}
            onResults={() => navigation.navigate(appRoutes.searchResults)}
          />
        )}
      </DiscoverStack.Screen>
      <DiscoverStack.Screen name={appRoutes.searchResults}>
        {({ navigation }) => (
          <SearchPageResultsScreen
            onCompetition={() => navigation.navigate(appRoutes.competitionPage)}
            onHackathon={() => navigation.navigate(appRoutes.hackathonPage)}
          />
        )}
      </DiscoverStack.Screen>
      <DiscoverStack.Screen name={appRoutes.competitionPage}>
        {({ navigation }) => (
          <CompetitionPageScreen onBackToDiscover={() => navigation.navigate(appRoutes.discoverTab)} />
        )}
      </DiscoverStack.Screen>
      <DiscoverStack.Screen name={appRoutes.hackathonPage}>
        {({ navigation }) => (
          <HackathonPageScreen onBackToDiscover={() => navigation.navigate(appRoutes.discoverTab)} />
        )}
      </DiscoverStack.Screen>
    </DiscoverStack.Navigator>
  );
}

function AppliedStackNavigator() {
  const session = useMockSession();

  return (
    <AppliedStack.Navigator screenOptions={{ headerShown: false }}>
      <AppliedStack.Screen name={appRoutes.appliedTab}>
        {({ navigation }) => (
          <AppliedScreen
            onOpenCompetition={() => navigation.navigate(appRoutes.competitionPage)}
            onOpenHackathon={() => navigation.navigate(appRoutes.hackathonPage)}
            onSignOut={session.signOut}
          />
        )}
      </AppliedStack.Screen>
      <AppliedStack.Screen name={appRoutes.competitionPage}>
        {({ navigation }) => (
          <CompetitionPageScreen onBackToDiscover={() => navigation.navigate(appRoutes.appliedTab)} />
        )}
      </AppliedStack.Screen>
      <AppliedStack.Screen name={appRoutes.hackathonPage}>
        {({ navigation }) => (
          <HackathonPageScreen onBackToDiscover={() => navigation.navigate(appRoutes.appliedTab)} />
        )}
      </AppliedStack.Screen>
    </AppliedStack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <MainTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: lightTheme.colors.brandPrimaryStrong,
        tabBarInactiveTintColor: lightTheme.colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: lightTheme.typography.caption.fontFamily,
          fontSize: lightTheme.typography.caption.fontSize,
          fontWeight: lightTheme.typography.caption.fontWeight,
        },
      }}
    >
      <MainTabs.Screen component={HomeStackNavigator} name={appRoutes.homeTab} options={{ title: 'Home' }} />
      <MainTabs.Screen
        component={DiscoverStackNavigator}
        name={appRoutes.discoverTab}
        options={{ title: 'Discover' }}
      />
      <MainTabs.Screen component={AppliedStackNavigator} name={appRoutes.appliedTab} options={{ title: 'Applied' }} />
    </MainTabs.Navigator>
  );
}

export function RootNavigator() {
  const session = useMockSession();

  return (
    <NavigationContainer>
      {!session.hasSeenOnboarding ? <OnboardingNavigator /> : null}
      {session.hasSeenOnboarding && !session.isAuthenticated ? <AuthNavigator /> : null}
      {session.hasSeenOnboarding && session.isAuthenticated ? <MainTabNavigator /> : null}
    </NavigationContainer>
  );
}