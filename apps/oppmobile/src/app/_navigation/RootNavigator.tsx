import { NavigationContainer, getFocusedRouteNameFromRoute, useNavigation } from '@react-navigation/native';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
  type BottomTabNavigationProp,
} from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useOAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  type MockProfileEducationInput,
  type MockProfilePersonalInput,
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
  EventFreePageScreen,
  EventPaidPageScreen,
} from '../../domains/events/presentation/screens/EventDetailScreens';
import {
  DiscoverHackathonsScreen,
  HackathonPageScreen,
} from '../../domains/hackathons/presentation/screens/HackathonScreens';
import { HackathonRegistrationScreen } from '../../domains/hackathons/presentation/screens/HackathonRegistrationScreen';
import { useSearchSuggestions } from '../../domains/search/presentation/hooks/useSearchSuggestions';
import { useSearchResults } from '../../domains/search/presentation/hooks/useSearchResults';
import {
  searchRepository,
} from '../../domains/search/data/repositories';
import {
  SearchPagePopularScreen,
  SearchPageRecentScreen,
  SearchPageResultsScreen,
  SearchPageTypingScreen,
} from '../../domains/search/presentation/screens/SearchScreens';
import { transitionSearchFlowState, type SearchFlowState } from '../../domains/search/model/searchStateMachine';
import { useAppSession } from '../../shared/auth/useAppSession';
import { HomePageScreen } from '../../domains/users/presentation/screens/HomePageScreen';
import { OrganizerDashboardScreen } from '../../domains/users/presentation/screens/OrganizerDashboardScreen';
import { ProfileEditScreen } from '../../domains/users/presentation/screens/ProfileEditScreen';
import { ProfileScreen } from '../../domains/users/presentation/screens/ProfileScreen';
import { appRoutes } from '../../shared/constants/routes';
import { lightTheme } from '../../shared/theme';
import { AppText } from '../../shared/ui';
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
const ProfileRegistrationsStack = createNativeStackNavigator<AppliedStackParamList>();
const ProfileAchievementsStack = createNativeStackNavigator<AppliedStackParamList>();
const MainTabs = createBottomTabNavigator<MainTabParamList>();

const TAB_BAR_HORIZONTAL_MARGIN = lightTheme.spacing[16];
const TAB_BAR_BOTTOM_OFFSET = 48;

function OnboardingNavigator() {
  const session = useAppSession();

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

import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../shared/api/apiClient';

function AuthNavigator({
  startAtProfile = false,
  onBackendOnboardingComplete,
}: {
  readonly startAtProfile?: boolean;
  readonly onBackendOnboardingComplete?: () => void;
}) {
  const queryClient = useQueryClient();
  const session = useAppSession();
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState(session.userEmail ?? '');
  const [otpCode, setOtpCode] = useState('');
  const [personalInfo, setPersonalInfo] = useState<MockProfilePersonalInput>({
    fullName: [session.firstName, session.lastName].filter(Boolean).join(' ').trim(),
    password: '',
    phoneNumber: '',
  });
  const [educationInfo, setEducationInfo] = useState<MockProfileEducationInput>({
    college: '',
    course: '',
    specialization: '',
    startYear: '',
    endYear: '',
    gender: '',
    rollNumber: '',
  });
  const [skills, setSkills] = useState<readonly string[]>([]);

  const _persistedProfile = useMemo(
    () => ({
      fullName: personalInfo.fullName,
      email,
      password: personalInfo.password,
      phoneNumber: personalInfo.phoneNumber,
      college: educationInfo.college,
      course: educationInfo.course,
      specialization: educationInfo.specialization,
      startYear: educationInfo.startYear,
      endYear: educationInfo.endYear,
      gender: educationInfo.gender,
      rollNumber: educationInfo.rollNumber,
      skills,
    }),
    [educationInfo, email, personalInfo, skills],
  );

  // Real Clerk Google OAuth via useOAuth() + expo-web-browser
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const completeGoogleAuth = useCallback(async () => {
    try {
      const redirectUrl = Linking.createURL('/');
      const { createdSessionId, setActive } = await startOAuthFlow({ redirectUrl });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        // If the user isn't fully onboarded, they need to complete their profile.
        // If they ARE onboarded, this AuthNavigator will be unmounted automatically.
        navigation.navigate(appRoutes.profileSetupPersonal);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign-in failed. Please try again.';
      Alert.alert('Sign-in failed', message);
    }
  }, [startOAuthFlow]);

  return (
    <AuthStack.Navigator
      initialRouteName={startAtProfile ? appRoutes.profileSetupPersonal : appRoutes.signUp}
      screenOptions={{ headerShown: false }}
    >
      <AuthStack.Screen name={appRoutes.signUp}>
        {({ navigation }) => (
          <SignUpScreen
            initialEmail={email}
            onContinue={(capturedEmail) => {
              setEmail(capturedEmail);
              navigation.navigate(appRoutes.verifyIdentityOtpEmpty);
            }}
            onGoogleContinue={completeGoogleAuth}
            onSignIn={() => navigation.navigate(appRoutes.signIn)}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name={appRoutes.verifyIdentityOtpEmpty}>
        {({ navigation }) => (
          <VerifyIdentityScreen
            email={email}
            initialOtp={otpCode}
            onContinue={(capturedOtpCode) => {
              setOtpCode(capturedOtpCode);
              navigation.navigate(appRoutes.profileSetupPersonal);
            }}
            onSkip={() => navigation.navigate(appRoutes.signIn)}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name={appRoutes.verifyIdentityOtpFilled}>
        {({ navigation }) => (
          <VerifyIdentityScreen
            email={email}
            filled
            initialOtp={otpCode}
            onContinue={(capturedOtpCode) => {
              setOtpCode(capturedOtpCode);
              navigation.navigate(appRoutes.profileSetupPersonal);
            }}
            onSkip={() => navigation.navigate(appRoutes.signIn)}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name={appRoutes.profileSetupPersonal}>
        {({ navigation }) => (
          <ProfileSetupPersonalScreen
            initialValues={personalInfo}
            onContinue={(capturedPersonalInfo) => {
              setPersonalInfo(capturedPersonalInfo);
              navigation.navigate(appRoutes.profileSetupEducation);
            }}
            onSkip={() => navigation.navigate(appRoutes.signIn)}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name={appRoutes.profileSetupEducation}>
        {({ navigation }) => (
          <ProfileSetupEducationScreen
            initialValues={educationInfo}
            onContinue={(capturedEducationInfo) => {
              setEducationInfo(capturedEducationInfo);
              navigation.navigate(appRoutes.profileSetupSkills);
            }}
            onSkip={() => navigation.navigate(appRoutes.signIn)}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name={appRoutes.profileSetupSkills}>
        {({ navigation }) => (
          <ProfileSetupSkillsScreen
            initialSkills={skills}
            onContinue={async (selectedSkills) => {
              setSkills(selectedSkills);
              try {
                if (session.isAuthenticated) {
                  // Save profile to backend so isBackendOnboarded becomes true
                  const genderMap: Record<string, string> = {
                    'Female': 'FEMALE',
                    'Male': 'MALE',
                    'Rather not to say': 'OTHER',
                  };
                  await apiClient.put('/user-accounts/onboarding', {
                    gender: genderMap[educationInfo.gender] ?? 'MALE',
                    userCategory: 'COLLEGE_STUDENT',
                    collegeName: educationInfo.college || 'Unknown',
                    collegeSkipped: !educationInfo.college,
                    collegeCurrentYear: educationInfo.startYear || null,
                    collegePassoutYear: educationInfo.endYear ? parseInt(educationInfo.endYear, 10) : null,
                    course: educationInfo.course || null,
                    specialization: educationInfo.specialization || null,
                    rollNumber: educationInfo.rollNumber || null,
                    locationCity: 'India',
                    locationState: 'India',
                    locationCountry: 'India',
                    skills: selectedSkills,
                  });
                  // Trigger query invalidation
                  await queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
                  onBackendOnboardingComplete?.();
                } else {
                  navigation.navigate(appRoutes.signIn);
                }
              } catch (e) {
                console.error('Failed to submit onboarding', e);
                Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save profile setup.');
              }
            }}
            onSkip={() => navigation.navigate(appRoutes.signIn)}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name={appRoutes.signIn}>
        {({ navigation }) => (
          <SignInScreen
            expectedPassword={undefined}
            initialEmail={email || session.userEmail || ''}
            onContinue={({ email: signInEmail }) => {
              setEmail(signInEmail);
              // If the user isn't fully onboarded, they need to complete their profile.
              // If they ARE onboarded, this AuthNavigator will be unmounted automatically in a few ms.
              navigation.navigate(appRoutes.profileSetupPersonal);
            }}
            onGoogleContinue={completeGoogleAuth}
            onSignUp={() => navigation.navigate(appRoutes.signUp)}
          />
        )}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name={appRoutes.homeStack}>
        {({ navigation }) => {
          const tabNavigation = navigation.getParent() as BottomTabNavigationProp<MainTabParamList> | undefined;

          const openDiscoverScreen = (screen: keyof DiscoverStackParamList) => {
            tabNavigation?.navigate(appRoutes.discoverTab, { screen } as never);
          };

          return (
            <HomePageScreen
              onOpenCompetition={() => openDiscoverScreen(appRoutes.discoverCompetitions)}
              onOpenEvent={() => openDiscoverScreen(appRoutes.discoverEventsPrimary)}
              onOpenHackathon={() => openDiscoverScreen(appRoutes.discoverHackathons)}
              onOpenProfile={() => navigation.navigate(appRoutes.profilePage)}
              onOpenOrganizerDashboard={() => navigation.navigate(appRoutes.organizerDashboard)}
            />
          );
        }}
      </HomeStack.Screen>
      <HomeStack.Screen name={appRoutes.profilePage}>
        {({ navigation }) => (
          <ProfileScreen
            onBack={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
                return;
              }

              navigation.navigate(appRoutes.homeStack);
            }}
            onEdit={() => navigation.navigate(appRoutes.profileEditPage)}
          />
        )}
      </HomeStack.Screen>
      <HomeStack.Screen name={appRoutes.profileEditPage}>
        {({ navigation }) => (
          <ProfileEditScreen
            onBack={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
                return;
              }

              navigation.navigate(appRoutes.profilePage);
            }}
          />
        )}
      </HomeStack.Screen>
      <HomeStack.Screen name={appRoutes.organizerDashboard}>
        {({ navigation }) => (
          <OrganizerDashboardScreen
            onBack={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
                return;
              }
              navigation.navigate(appRoutes.homeStack);
            }}
          />
        )}
      </HomeStack.Screen>
      <HomeStack.Screen name={appRoutes.competitionPage}>
        {({ navigation, route }) => (
          <CompetitionPageScreen
            competitionId={route.params.competitionId}
            onBackToDiscover={() => navigation.navigate(appRoutes.homeStack)}
          />
        )}
      </HomeStack.Screen>
      <HomeStack.Screen name={appRoutes.hackathonPage}>
        {({ navigation, route }) => (
          <HackathonPageScreen
            hackathonId={route.params.hackathonId}
            onBackToDiscover={() => navigation.navigate(appRoutes.homeStack)}
          />
        )}
      </HomeStack.Screen>
    </HomeStack.Navigator>
  );
}

function DiscoverStackNavigator() {
  const searchCatalog = useMemo(() => searchRepository.getCatalog(), []);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFlowState, setSearchFlowState] = useState<SearchFlowState>('idle');
  const [recentQueries, setRecentQueries] = useState<string[]>(() => searchRepository.listRecentQueries());

  const { data: suggestionsData } = useSearchSuggestions(searchQuery);
  const searchSuggestions = suggestionsData ?? [];
  
  const { data: resultsData } = useSearchResults(searchQuery);
  const searchResults = resultsData ?? [];

  return (
    <DiscoverStack.Navigator screenOptions={{ headerShown: false }}>
      <DiscoverStack.Screen name={appRoutes.discoverStack}>
        {({ navigation }) => (
          <DiscoverPageScreen
            onCompetitions={() => navigation.navigate(appRoutes.discoverCompetitions)}
            onEventsPrimary={() => navigation.navigate(appRoutes.discoverEventsPrimary)}
            onEventsSecondary={() => navigation.navigate(appRoutes.discoverEventsSecondary)}
            onHackathons={() => navigation.navigate(appRoutes.discoverHackathons)}
            onSearchRecent={() => {
              setSearchFlowState((current) => transitionSearchFlowState(current, { type: 'OPEN_RECENT' }));
              navigation.navigate(appRoutes.searchRecent);
            }}
          />
        )}
      </DiscoverStack.Screen>
      <DiscoverStack.Screen name={appRoutes.discoverHackathons}>
        {({ navigation }) => (
          <DiscoverHackathonsScreen
            onOpenCompetitions={() => navigation.navigate(appRoutes.discoverCompetitions)}
            onOpenEvents={() => navigation.navigate(appRoutes.discoverEventsPrimary)}
            onOpenHackathonPage={(id) => navigation.navigate(appRoutes.hackathonPage, { hackathonId: id })}
            onSearchTyping={() => {
              setSearchFlowState((current) => transitionSearchFlowState(current, { type: 'OPEN_TYPING' }));
              navigation.navigate(appRoutes.searchTyping);
            }}
          />
        )}
      </DiscoverStack.Screen>
      <DiscoverStack.Screen name={appRoutes.discoverCompetitions}>
        {({ navigation }) => (
          <DiscoverCompetitionsScreen
            onOpenEvents={() => navigation.navigate(appRoutes.discoverEventsPrimary)}
            onOpenHackathons={() => navigation.navigate(appRoutes.discoverHackathons)}
            onOpenCompetitionPage={(id) => navigation.navigate(appRoutes.competitionPage, { competitionId: id })}
            onSearchResults={() => {
              const fallbackQuery = searchQuery.trim() || 'Hack';
              setSearchQuery(fallbackQuery);
              setRecentQueries(searchRepository.saveRecentQuery(fallbackQuery));
              setSearchFlowState((current) =>
                transitionSearchFlowState(current, { type: 'SUBMIT_QUERY', query: fallbackQuery }),
              );
              navigation.navigate(appRoutes.searchResults);
            }}
          />
        )}
      </DiscoverStack.Screen>
      <DiscoverStack.Screen name={appRoutes.discoverEventsPrimary}>
        {({ navigation }) => (
          <DiscoverEventsPrimaryScreen
            onOpenCompetitions={() => navigation.navigate(appRoutes.discoverCompetitions)}
            onOpenHackathons={() => navigation.navigate(appRoutes.discoverHackathons)}
            onOpenEventFreePage={(id) => navigation.navigate(appRoutes.eventPageFree, { eventId: id })}
            onOpenEventPaidPage={(id) => navigation.navigate(appRoutes.eventPagePaid, { eventId: id })}
            onOpenCommunities={() => {
              setSearchFlowState((current) => transitionSearchFlowState(current, { type: 'OPEN_RECENT' }));
              navigation.navigate(appRoutes.searchRecent);
            }}
            onOpenSearchRecent={() => {
              setSearchFlowState((current) => transitionSearchFlowState(current, { type: 'OPEN_RECENT' }));
              navigation.navigate(appRoutes.searchRecent);
            }}
          />
        )}
      </DiscoverStack.Screen>
      <DiscoverStack.Screen name={appRoutes.discoverEventsSecondary}>
        {({ navigation }) => (
          <DiscoverEventsSecondaryScreen
            onOpenCompetitions={() => navigation.navigate(appRoutes.discoverCompetitions)}
            onOpenHackathons={() => navigation.navigate(appRoutes.discoverHackathons)}
            onOpenEventFreePage={(id) => navigation.navigate(appRoutes.eventPageFree, { eventId: id })}
            onOpenEventPaidPage={(id) => navigation.navigate(appRoutes.eventPagePaid, { eventId: id })}
            onOpenCommunities={() => {
              setSearchFlowState((current) => transitionSearchFlowState(current, { type: 'OPEN_POPULAR' }));
              navigation.navigate(appRoutes.searchPopular);
            }}
            onOpenSearchPopular={() => {
              setSearchFlowState((current) => transitionSearchFlowState(current, { type: 'OPEN_POPULAR' }));
              navigation.navigate(appRoutes.searchPopular);
            }}
          />
        )}
      </DiscoverStack.Screen>
      <DiscoverStack.Screen name={appRoutes.searchRecent}>
        {({ navigation }) => (
          <SearchPageRecentScreen
            flowState={searchFlowState}
            query={searchQuery}
            recentQueries={recentQueries}
            onPopular={() => {
              setSearchFlowState((current) => transitionSearchFlowState(current, { type: 'OPEN_POPULAR' }));
              navigation.navigate(appRoutes.searchPopular);
            }}
            onQueryChange={(nextQuery) => {
              setSearchQuery(nextQuery);
              setSearchFlowState((current) =>
                transitionSearchFlowState(current, { type: 'TYPE_QUERY', query: nextQuery }),
              );

              if (nextQuery.trim().length > 0) {
                navigation.navigate(appRoutes.searchTyping);
              }
            }}
            onSubmitQuery={(submittedQuery) => {
              const normalizedQuery = submittedQuery.trim();

              if (!normalizedQuery) {
                return;
              }

              setSearchQuery(normalizedQuery);
              setRecentQueries(searchRepository.saveRecentQuery(normalizedQuery));
              setSearchFlowState((current) =>
                transitionSearchFlowState(current, { type: 'SUBMIT_QUERY', query: normalizedQuery }),
              );
              navigation.navigate(appRoutes.searchResults);
            }}
          />
        )}
      </DiscoverStack.Screen>
      <DiscoverStack.Screen name={appRoutes.searchPopular}>
        {({ navigation }) => (
          <SearchPagePopularScreen
            flowState={searchFlowState}
            popularQueries={searchCatalog.popularQueries}
            query={searchQuery}
            onRecent={() => {
              setSearchFlowState((current) => transitionSearchFlowState(current, { type: 'OPEN_RECENT' }));
              navigation.navigate(appRoutes.searchRecent);
            }}
            onQueryChange={(nextQuery) => {
              setSearchQuery(nextQuery);
              setSearchFlowState((current) =>
                transitionSearchFlowState(current, { type: 'TYPE_QUERY', query: nextQuery }),
              );

              if (nextQuery.trim().length > 0) {
                navigation.navigate(appRoutes.searchTyping);
              }
            }}
            onSubmitQuery={(submittedQuery) => {
              const normalizedQuery = submittedQuery.trim();

              if (!normalizedQuery) {
                return;
              }

              setSearchQuery(normalizedQuery);
              setRecentQueries(searchRepository.saveRecentQuery(normalizedQuery));
              setSearchFlowState((current) =>
                transitionSearchFlowState(current, { type: 'SUBMIT_QUERY', query: normalizedQuery }),
              );
              navigation.navigate(appRoutes.searchResults);
            }}
          />
        )}
      </DiscoverStack.Screen>
      <DiscoverStack.Screen name={appRoutes.searchTyping}>
        {({ navigation }) => (
          <SearchPageTypingScreen
            flowState={searchFlowState}
            query={searchQuery}
            suggestions={searchSuggestions}
            onPopular={() => {
              setSearchFlowState((current) => transitionSearchFlowState(current, { type: 'OPEN_POPULAR' }));
              navigation.navigate(appRoutes.searchPopular);
            }}
            onQueryChange={(nextQuery) => {
              setSearchQuery(nextQuery);
              setSearchFlowState((current) =>
                transitionSearchFlowState(current, { type: 'TYPE_QUERY', query: nextQuery }),
              );

              if (nextQuery.trim().length === 0) {
                navigation.navigate(appRoutes.searchRecent);
              }
            }}
            onSubmitQuery={(submittedQuery) => {
              const normalizedQuery = submittedQuery.trim();

              if (!normalizedQuery) {
                return;
              }

              setSearchQuery(normalizedQuery);
              setRecentQueries(searchRepository.saveRecentQuery(normalizedQuery));
              setSearchFlowState((current) =>
                transitionSearchFlowState(current, { type: 'SUBMIT_QUERY', query: normalizedQuery }),
              );
              navigation.navigate(appRoutes.searchResults);
            }}
          />
        )}
      </DiscoverStack.Screen>
      <DiscoverStack.Screen name={appRoutes.searchResults}>
        {({ navigation }) => (
          <SearchPageResultsScreen
            flowState={searchFlowState}
            query={searchQuery}
            results={searchResults}
            onCompetition={(id) => navigation.navigate(appRoutes.competitionPage, { competitionId: id })}
            onHackathon={(id) => navigation.navigate(appRoutes.hackathonPage, { hackathonId: id })}
            onQueryChange={(nextQuery) => {
              setSearchQuery(nextQuery);
              setSearchFlowState((current) =>
                transitionSearchFlowState(current, { type: 'TYPE_QUERY', query: nextQuery }),
              );

              if (nextQuery.trim().length > 0) {
                navigation.navigate(appRoutes.searchTyping);
              }
            }}
            onSubmitQuery={(submittedQuery) => {
              const normalizedQuery = submittedQuery.trim();

              if (!normalizedQuery) {
                return;
              }

              setSearchQuery(normalizedQuery);
              setRecentQueries(searchRepository.saveRecentQuery(normalizedQuery));
              setSearchFlowState((current) =>
                transitionSearchFlowState(current, { type: 'SUBMIT_QUERY', query: normalizedQuery }),
              );
            }}
          />
        )}
      </DiscoverStack.Screen>
      <DiscoverStack.Screen name={appRoutes.competitionPage}>
        {({ navigation, route }) => (
          <CompetitionPageScreen
            competitionId={route.params.competitionId}
            onBackToDiscover={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
                return;
              }

              navigation.navigate(appRoutes.discoverStack);
            }}
          />
        )}
      </DiscoverStack.Screen>
      <DiscoverStack.Screen name={appRoutes.hackathonPage}>
        {({ navigation, route }) => (
          <HackathonPageScreen
            hackathonId={route.params.hackathonId}
            onBackToDiscover={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
                return;
              }

              navigation.navigate(appRoutes.discoverStack);
            }}
            onRegisterNow={(hackathonInfo) => navigation.navigate(appRoutes.hackathonRegistration, hackathonInfo)}
          />
        )}
      </DiscoverStack.Screen>
      <DiscoverStack.Screen name={appRoutes.hackathonRegistration}>
        {({ navigation, route }) => (
          <HackathonRegistrationScreen
            hackathon={{
              id: route.params.hackathonId,
              title: route.params.title,
              bannerImageUrl: route.params.bannerImageUrl,
            }}
            onBack={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
                return;
              }

              navigation.navigate(appRoutes.hackathonPage, { hackathonId: route.params.hackathonId });
            }}
          />
        )}
      </DiscoverStack.Screen>
      <DiscoverStack.Screen name={appRoutes.eventPageFree}>
        {({ navigation, route }) => (
          <EventFreePageScreen
            eventId={route.params.eventId}
            onBackToDiscover={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
                return;
              }

              navigation.navigate(appRoutes.discoverStack);
            }}
          />
        )}
      </DiscoverStack.Screen>
      <DiscoverStack.Screen name={appRoutes.eventPagePaid}>
        {({ navigation, route }) => (
          <EventPaidPageScreen
            eventId={route.params.eventId}
            onBackToDiscover={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
                return;
              }

              navigation.navigate(appRoutes.discoverStack);
            }}
          />
        )}
      </DiscoverStack.Screen>
    </DiscoverStack.Navigator>
  );
}

function AppliedStackNavigator() {
  const session = useAppSession();

  return (
    <AppliedStack.Navigator screenOptions={{ headerShown: false }}>
      <AppliedStack.Screen name={appRoutes.appliedStack}>
        {({ navigation }) => (
          <AppliedScreen
            onOpenCompetition={(id: string) => navigation.navigate(appRoutes.competitionPage, { competitionId: id })}
            onOpenHackathon={(id: string) => navigation.navigate(appRoutes.hackathonPage, { hackathonId: id })}
            onOpenEvent={(id: string) => navigation.navigate(appRoutes.eventPageFree, { eventId: id })}
            onSignOut={session.signOut}
          />
        )}
      </AppliedStack.Screen>
      <AppliedStack.Screen name={appRoutes.eventPageFree}>
        {({ navigation, route }) => (
          <EventFreePageScreen
            eventId={route.params.eventId}
            onBackToDiscover={() => navigation.navigate(appRoutes.appliedStack)}
          />
        )}
      </AppliedStack.Screen>
      <AppliedStack.Screen name={appRoutes.competitionPage}>
        {({ navigation, route }) => (
          <CompetitionPageScreen
            competitionId={route.params.competitionId}
            onBackToDiscover={() => navigation.navigate(appRoutes.appliedStack)}
          />
        )}
      </AppliedStack.Screen>
      <AppliedStack.Screen name={appRoutes.hackathonPage}>
        {({ navigation, route }) => (
          <HackathonPageScreen
            hackathonId={route.params.hackathonId}
            onBackToDiscover={() => navigation.navigate(appRoutes.appliedStack)}
          />
        )}
      </AppliedStack.Screen>
    </AppliedStack.Navigator>
  );
}

function ProfileRegistrationsStackNavigator({ onBackToHome }: { readonly onBackToHome: () => void }) {
  const session = useAppSession();

  return (
    <ProfileRegistrationsStack.Navigator initialRouteName={appRoutes.appliedStack} screenOptions={{ headerShown: false }}>
      <ProfileRegistrationsStack.Screen name={appRoutes.appliedStack}>
        {({ navigation }) => (
          <AppliedScreen
            onBackToProfile={() => {
              onBackToHome();
              navigation.navigate(appRoutes.homeTab, { screen: appRoutes.homeStack });
            }}
            onOpenCompetition={(id: string) => navigation.navigate(appRoutes.competitionPage, { competitionId: id })}
            onOpenHackathon={(id: string) => navigation.navigate(appRoutes.hackathonPage, { hackathonId: id })}
            onOpenEvent={(id: string) => navigation.navigate(appRoutes.eventPageFree, { eventId: id })}
            onSignOut={session.signOut}
            variant="registrations"
          />
        )}
      </ProfileRegistrationsStack.Screen>
      <ProfileRegistrationsStack.Screen name={appRoutes.eventPageFree}>
        {({ navigation, route }) => (
          <EventFreePageScreen
            eventId={route.params.eventId}
            onBackToDiscover={() => navigation.navigate(appRoutes.appliedStack)}
          />
        )}
      </ProfileRegistrationsStack.Screen>
      <ProfileRegistrationsStack.Screen name={appRoutes.competitionPage}>
        {({ navigation, route }) => (
          <CompetitionPageScreen
            competitionId={route.params.competitionId}
            onBackToDiscover={() => navigation.navigate(appRoutes.appliedStack)}
          />
        )}
      </ProfileRegistrationsStack.Screen>
      <ProfileRegistrationsStack.Screen name={appRoutes.hackathonPage}>
        {({ navigation, route }) => (
          <HackathonPageScreen
            hackathonId={route.params.hackathonId}
            onBackToDiscover={() => navigation.navigate(appRoutes.appliedStack)}
          />
        )}
      </ProfileRegistrationsStack.Screen>
    </ProfileRegistrationsStack.Navigator>
  );
}

function ProfileAchievementsStackNavigator({ onBackToHome }: { readonly onBackToHome: () => void }) {
  const session = useAppSession();

  return (
    <ProfileAchievementsStack.Navigator initialRouteName={appRoutes.appliedStack} screenOptions={{ headerShown: false }}>
      <ProfileAchievementsStack.Screen name={appRoutes.appliedStack}>
        {({ navigation }) => (
          <AppliedScreen
            onBackToProfile={() => {
              onBackToHome();
              navigation.navigate(appRoutes.homeTab, { screen: appRoutes.homeStack });
            }}
            onOpenCompetition={(id: string) => navigation.navigate(appRoutes.competitionPage, { competitionId: id })}
            onOpenHackathon={(id: string) => navigation.navigate(appRoutes.hackathonPage, { hackathonId: id })}
            onOpenEvent={(id: string) => navigation.navigate(appRoutes.eventPageFree, { eventId: id })}
            onSignOut={session.signOut}
            variant="achievements"
          />
        )}
      </ProfileAchievementsStack.Screen>
      <ProfileAchievementsStack.Screen name={appRoutes.eventPageFree}>
        {({ navigation, route }) => (
          <EventFreePageScreen
            eventId={route.params.eventId}
            onBackToDiscover={() => navigation.navigate(appRoutes.appliedStack)}
          />
        )}
      </ProfileAchievementsStack.Screen>
      <ProfileAchievementsStack.Screen name={appRoutes.competitionPage}>
        {({ navigation, route }) => (
          <CompetitionPageScreen
            competitionId={route.params.competitionId}
            onBackToDiscover={() => navigation.navigate(appRoutes.appliedStack)}
          />
        )}
      </ProfileAchievementsStack.Screen>
      <ProfileAchievementsStack.Screen name={appRoutes.hackathonPage}>
        {({ navigation, route }) => (
          <HackathonPageScreen
            hackathonId={route.params.hackathonId}
            onBackToDiscover={() => navigation.navigate(appRoutes.appliedStack)}
          />
        )}
      </ProfileAchievementsStack.Screen>
    </ProfileAchievementsStack.Navigator>
  );
}

function MainTabIcon({
  focused,
  profileMode,
  routeName,
}: {
  readonly focused: boolean;
  readonly profileMode: boolean;
  readonly routeName: string;
}) {
  const label = profileMode
    ? routeName === appRoutes.homeTab
      ? 'Profile'
      : routeName === appRoutes.discoverTab
        ? 'Registerations'
        : 'Achievements'
    : routeName === appRoutes.homeTab
      ? 'Home'
      : routeName === appRoutes.discoverTab
        ? 'Discover'
        : 'Applied';

  return (
    <View style={[tabStyles.tabItem, focused ? tabStyles.tabItemActive : null]}>
      <View style={tabStyles.iconWrap}>
        {routeName === appRoutes.homeTab && profileMode ? (
          <View style={tabStyles.profileGlyph}>
            <View style={tabStyles.profileGlyphHead} />
            <View style={tabStyles.profileGlyphBody} />
          </View>
        ) : null}

        {routeName === appRoutes.homeTab && !profileMode ? (
          <Svg width={24} height={24} viewBox="0 0 32 32" fill="none">
            <Path fillRule="evenodd" clipRule="evenodd" d="M17.4747 29.3334H14.5252C9.92979 29.3334 7.63208 29.3334 6.06533 27.9843C4.49858 26.6352 4.17363 24.377 3.52374 19.8604L3.15206 17.2772C2.64613 13.7612 2.39317 12.0031 3.11378 10.5C3.8344 8.99688 5.36821 8.0832 8.43584 6.25583L10.2823 5.15591C13.068 3.49647 14.4609 2.66675 16 2.66675C17.539 2.66675 18.9319 3.49647 21.7176 5.15591L23.5641 6.25583C26.6317 8.0832 28.1655 8.99688 28.8861 10.5C29.6068 12.0031 29.3538 13.7612 28.8479 17.2772L28.4762 19.8604C27.8263 24.377 27.5013 26.6352 25.9346 27.9843C24.3678 29.3334 22.0701 29.3334 17.4747 29.3334Z" fill="#271B40" />
            <Path d="M11 24C11 23.4477 11.4477 23 12 23H20C20.5523 23 21 23.4477 21 24C21 24.5523 20.5523 25 20 25H12C11.4477 25 11 24.5523 11 24Z" fill="#AC89F2" />
          </Svg>
        ) : null}

        {routeName === appRoutes.discoverTab && profileMode ? (
          <View style={tabStyles.calendarGlyph}>
            <View style={tabStyles.calendarBody} />
            <View style={tabStyles.calendarHeader} />
            <View style={tabStyles.calendarBinderLeft} />
            <View style={tabStyles.calendarBinderRight} />
            <View style={tabStyles.calendarDotRowTop}>
              <View style={tabStyles.calendarDot} />
              <View style={tabStyles.calendarDot} />
            </View>
            <View style={tabStyles.calendarDotRowBottom}>
              <View style={tabStyles.calendarDot} />
              <View style={tabStyles.calendarDot} />
            </View>
          </View>
        ) : null}

        {routeName === appRoutes.discoverTab && !profileMode ? (
          <Svg width={24} height={24} viewBox="0 0 32 32" fill="none">
            <Path fillRule="evenodd" clipRule="evenodd" d="M19.7197 25.2995C11.3299 28.6554 7.13505 30.3334 4.739 28.7052C4.17089 28.3191 3.6809 27.8291 3.29485 27.261C1.66664 24.865 3.3446 20.6701 6.70052 12.2803C7.41633 10.4908 7.77423 9.59601 8.38979 8.89406C8.54666 8.71519 8.71506 8.54678 8.89394 8.38992C9.59589 7.77435 10.4907 7.41645 12.2802 6.70064C20.67 3.34472 24.8649 1.66676 27.2609 3.29497C27.829 3.68102 28.319 4.17101 28.7051 4.73912C30.3333 7.13518 28.6553 11.3301 25.2994 19.7199C24.5836 21.5094 24.2257 22.4042 23.6101 23.1061C23.4533 23.285 23.2849 23.4534 23.106 23.6102C22.404 24.2258 21.5092 24.5837 19.7197 25.2995Z" fill="#271B40" />
            <Path d="M16 11C13.2386 11 11 13.2386 11 16C11 18.7614 13.2386 21 16 21C18.7614 21 21 18.7614 21 16C21 13.2386 18.7614 11 16 11Z" fill="#AC89F2" />
          </Svg>
        ) : null}

        {routeName === appRoutes.appliedTab && profileMode ? (
          <View style={tabStyles.achievementsGlyph}>
            <View style={tabStyles.crownProngsRow}>
              <View style={tabStyles.crownProngShort} />
              <View style={tabStyles.crownProngTall} />
              <View style={tabStyles.crownProngShort} />
            </View>
            <View style={tabStyles.crownBase} />
          </View>
        ) : null}

        {routeName === appRoutes.appliedTab && !profileMode ? (
          <Svg width={24} height={24} viewBox="0 0 32 32" fill="none">
            <Path fillRule="evenodd" clipRule="evenodd" d="M15.2445 21.9523L16.8481 20.3487L20.3488 16.848L21.9523 15.2445C23.594 13.6028 24.4148 12.782 24.221 11.8998C24.0272 11.0175 22.938 10.6163 20.7595 9.81365L13.4939 7.13686C9.14806 5.53575 6.97512 4.73519 5.85519 5.85513C4.73525 6.97506 5.53581 9.148 7.13692 13.4939L9.81371 20.7594C10.6163 22.9379 11.0176 24.0272 11.8998 24.2209C12.7821 24.4147 13.6029 23.5939 15.2445 21.9523Z" fill="#271B40" />
            <Path d="M16.8477 20.3491L22.0987 25.6002C22.6424 26.1439 22.9143 26.4157 23.2176 26.5414C23.6219 26.7088 24.0762 26.7088 24.4806 26.5414C24.7839 26.4157 25.0557 26.1439 25.5994 25.6002C26.1431 25.0565 26.415 24.7846 26.5406 24.4813C26.7081 24.077 26.7081 23.6226 26.5406 23.2183C26.415 22.915 26.1431 22.6432 25.5994 22.0995L20.3484 16.8484L16.8477 20.3491Z" fill="#AC89F2" />
          </Svg>
        ) : null}
      </View>

      <AppText colorToken="textSecondary" numberOfLines={1} style={tabStyles.tabLabel} variant="caption">
        {label}
      </AppText>
    </View>
  );
}

function MainTabBar({
  descriptors,
  navigation,
  profileTabTarget,
  setProfileTabTarget,
  state,
  bottomOffset,
  horizontalInset,
}: BottomTabBarProps & {
  readonly profileTabTarget: keyof MainTabParamList | null;
  readonly setProfileTabTarget: (target: keyof MainTabParamList | null) => void;
  readonly bottomOffset: number;
  readonly horizontalInset: number;
}) {
  const activeRoute = state.routes[state.index] ?? state.routes[0];

  if (!activeRoute) {
    return null;
  }

  const activeNestedRouteName = getFocusedRouteNameFromRoute(activeRoute) ?? appRoutes.homeStack;
  const isProfilePageActive = activeRoute.name === appRoutes.homeTab && activeNestedRouteName === appRoutes.profilePage;
  const profileMode =
    isProfilePageActive ||
    ((activeRoute.name === appRoutes.discoverTab || activeRoute.name === appRoutes.appliedTab) && profileTabTarget !== null);
  const activeStyle = descriptors[activeRoute.key]?.options.tabBarStyle;

  return (
    <View style={[tabStyles.tabBar, { bottom: bottomOffset, left: horizontalInset, right: horizontalInset }, activeStyle as object | undefined]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;

        const handlePress = () => {
          if (profileMode && route.name === appRoutes.homeTab) {
            setProfileTabTarget(appRoutes.homeTab);
            navigation.navigate(appRoutes.homeTab, { screen: appRoutes.profilePage });
            return;
          }

          if (profileMode && route.name === appRoutes.discoverTab) {
            setProfileTabTarget(appRoutes.discoverTab);
            navigation.navigate(appRoutes.discoverTab, { screen: appRoutes.appliedStack } as never);
            return;
          }

          if (profileMode && route.name === appRoutes.appliedTab) {
            setProfileTabTarget(appRoutes.appliedTab);
            navigation.navigate(appRoutes.appliedTab, { screen: appRoutes.appliedStack });
            return;
          }

          setProfileTabTarget(null);

          const event = navigation.emit({
            canPreventDefault: true,
            target: route.key,
            type: 'tabPress',
          });

          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable key={route.key} onPress={handlePress} style={tabStyles.tabBarItem}>
            <MainTabIcon focused={focused} profileMode={profileMode} routeName={route.name} />
          </Pressable>
        );
      })}
    </View>
  );
}

function MainTabNavigator() {
  const [profileTabTarget, setProfileTabTarget] = useState<keyof MainTabParamList | null>(null);
  const insets = useSafeAreaInsets();
  const horizontalInset = TAB_BAR_HORIZONTAL_MARGIN + Math.max(insets.left, insets.right);
  const bottomOffset = Math.max(TAB_BAR_BOTTOM_OFFSET, insets.bottom + lightTheme.spacing[12]);

  return (
    <MainTabs.Navigator
      tabBar={(props) => {
        const activeRoute = props.state.routes[props.state.index] ?? props.state.routes[0];
        const activeNestedRouteName = activeRoute ? getFocusedRouteNameFromRoute(activeRoute) ?? appRoutes.homeStack : appRoutes.homeStack;
        const isProfilePageActive =
          activeRoute?.name === appRoutes.homeTab && activeNestedRouteName === appRoutes.profilePage;

        const profileMode =
          isProfilePageActive ||
          ((activeRoute?.name === appRoutes.discoverTab || activeRoute?.name === appRoutes.appliedTab) && profileTabTarget !== null);

        return (
          <MainTabBar
            {...props}
            bottomOffset={bottomOffset}
            horizontalInset={horizontalInset}
            profileTabTarget={profileTabTarget}
            setProfileTabTarget={setProfileTabTarget}
            state={{
              ...props.state,
              index:
                profileMode && profileTabTarget
                  ? props.state.routes.findIndex((route) => route.name === profileTabTarget)
                  : props.state.index,
            }}
          />
        );
      }}
      screenOptions={({ route }) => {
        const focusedRouteName = getFocusedRouteNameFromRoute(route);
        const showTabBarScreens: string[] = [
          appRoutes.homeStack,
          appRoutes.discoverStack,
          appRoutes.appliedStack,
          appRoutes.profilePage,
        ];
        const hideTabBar = focusedRouteName !== undefined && !showTabBarScreens.includes(focusedRouteName as string);

        return {
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarShowLabel: false,
          tabBarStyle: hideTabBar
            ? { display: 'none' }
            : [tabStyles.tabBar, { bottom: bottomOffset, left: horizontalInset, right: horizontalInset }],
        };
      }}
    >
      <MainTabs.Screen component={HomeStackNavigator} name={appRoutes.homeTab} options={{ title: 'Home' }} />
      <MainTabs.Screen
        name={appRoutes.discoverTab}
        options={{ popToTopOnBlur: true, title: 'Discover' }}
      >
        {() =>
          profileTabTarget === appRoutes.discoverTab ? (
            <ProfileRegistrationsStackNavigator
              key="profile-registrations"
              onBackToHome={() => setProfileTabTarget(null)}
            />
          ) : (
            <DiscoverStackNavigator key="default-discover" />
          )
        }
      </MainTabs.Screen>
      <MainTabs.Screen name={appRoutes.appliedTab} options={{ title: 'Applied' }}>
        {() =>
          profileTabTarget === appRoutes.appliedTab ? (
            <ProfileAchievementsStackNavigator onBackToHome={() => setProfileTabTarget(null)} />
          ) : (
            <AppliedStackNavigator />
          )
        }
      </MainTabs.Screen>
    </MainTabs.Navigator>
  );
}

import { useCurrentUser } from '../../domains/users/presentation/hooks/useCurrentUser';

export function RootNavigator() {
  const session = useAppSession();
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser(session.isAuthenticated);
  const [backendOnboardingComplete, setBackendOnboardingComplete] = useState(false);
  const [initialRouteResolved, setInitialRouteResolved] = useState(false);

  useEffect(() => {
    if (!session.isAuthenticated) {
      setBackendOnboardingComplete(false);
    }
  }, [session.isAuthenticated]);

  useEffect(() => {
    if (session.isLoaded) {
      if (!session.isAuthenticated) {
        setInitialRouteResolved(true);
      } else if (!isUserLoading) {
        setInitialRouteResolved(true);
      }
    }
  }, [session.isLoaded, session.isAuthenticated, isUserLoading]);

  // While Clerk or the user profile is loading initially, render a splash screen to prevent navigation flash.
  // Once resolved, do NOT unmount the NavigationContainer to avoid wiping navigation state mid-onboarding.
  if (!initialRouteResolved) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAFAFA', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#6949AA" />
      </View>
    );
  }

  const isBackendOnboarded = currentUser?.onboarded ?? false;
  
  // Decide which navigator to show
  const showOnboarding = !session.isAuthenticated && !session.hasCompletedOnboarding;
  const showAuth = (!session.isAuthenticated && session.hasCompletedOnboarding) ||
    (session.isAuthenticated && !isBackendOnboarded && !backendOnboardingComplete);
  const showMain = session.isAuthenticated && (isBackendOnboarded || backendOnboardingComplete);

  return (
    <NavigationContainer>
      {showOnboarding ? <OnboardingNavigator /> : null}
      {showAuth ? (
        <AuthNavigator
          startAtProfile={session.isAuthenticated}
          onBackendOnboardingComplete={() => setBackendOnboardingComplete(true)}
        />
      ) : null}
      {showMain ? <MainTabNavigator /> : null}
    </NavigationContainer>
  );
}

const tabStyles = StyleSheet.create({
  achievementsGlyph: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'flex-end',
    width: 24,
  },
  calendarBinderLeft: {
    backgroundColor: '#271B40',
    borderRadius: 1.5,
    height: 5,
    left: 6,
    position: 'absolute',
    top: 1,
    width: 3,
  },
  calendarBinderRight: {
    backgroundColor: '#271B40',
    borderRadius: 1.5,
    height: 5,
    left: 15,
    position: 'absolute',
    top: 1,
    width: 3,
  },
  calendarBody: {
    backgroundColor: '#FBF9FD',
    borderColor: '#271B40',
    borderRadius: 5,
    borderWidth: 2,
    height: 19,
    width: 20,
  },
  calendarDot: {
    backgroundColor: '#271B40',
    borderRadius: 1.5,
    height: 3,
    width: 3,
  },
  calendarDotRowBottom: {
    flexDirection: 'row',
    gap: 3,
    left: 7,
    position: 'absolute',
    top: 13,
  },
  calendarDotRowTop: {
    flexDirection: 'row',
    gap: 3,
    left: 7,
    position: 'absolute',
    top: 9,
  },
  calendarGlyph: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    position: 'relative',
    width: 24,
  },
  calendarHeader: {
    backgroundColor: '#271B40',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    height: 5,
    left: 2,
    position: 'absolute',
    top: 4,
    width: 20,
  },
  crownBase: {
    backgroundColor: '#271B40',
    borderRadius: 1,
    height: 5,
    width: 20,
  },
  crownProngsRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 2,
  },
  crownProngShort: {
    borderBottomColor: '#271B40',
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderLeftWidth: 4,
    borderRightColor: 'transparent',
    borderRightWidth: 4,
    height: 0,
    width: 0,
  },
  crownProngTall: {
    borderBottomColor: '#271B40',
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderLeftWidth: 4,
    borderRightColor: 'transparent',
    borderRightWidth: 4,
    height: 0,
    width: 0,
  },
  iconWrap: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    width: 32,
  },
  profileGlyph: {
    alignItems: 'center',
    gap: 2,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  profileGlyphBody: {
    backgroundColor: '#271B40',
    borderRadius: 7,
    height: 7,
    width: 14,
  },
  profileGlyphHead: {
    backgroundColor: '#271B40',
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  tabBar: {
    alignItems: 'stretch',
    backgroundColor: '#FBF9FD',
    borderColor: '#DDD6E7',
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    elevation: 6,
    flexDirection: 'row',
    height: 76,
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    position: 'absolute',
    shadowColor: '#32214D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  tabBarItem: {
    flex: 1,
    height: '100%',
    marginHorizontal: 4,
    padding: 0,
  },
  tabItem: {
    alignItems: 'center',
    borderRadius: lightTheme.radius.pill,
    gap: 6,
    height: '100%',
    justifyContent: 'flex-start',
    minWidth: 72,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: '100%',
  },
  tabItemActive: {
    backgroundColor: '#E5D8FF',
  },
  tabLabel: {
    color: '#6A6171',
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 12,
    minHeight: 12,
    textAlign: 'center',
  },
});
