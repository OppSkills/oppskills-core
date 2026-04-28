import { NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
  type BottomTabNavigationProp,
} from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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
import { useMockSession } from '../../domains/user-accounts/presentation/providers/MockSessionProvider';
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
  const [email, setEmail] = useState(session.preferredEmail || '');
  const [otpCode, setOtpCode] = useState('');
  const [personalInfo, setPersonalInfo] = useState<MockProfilePersonalInput>({
    fullName: session.mockProfile?.fullName ?? '',
    password: session.mockProfile?.password ?? '',
    phoneNumber: session.mockProfile?.phoneNumber ?? '',
  });
  const [educationInfo, setEducationInfo] = useState<MockProfileEducationInput>({
    college: session.mockProfile?.college ?? '',
    course: session.mockProfile?.course ?? '',
    specialization: session.mockProfile?.specialization ?? '',
    startYear: session.mockProfile?.startYear ?? '',
    endYear: session.mockProfile?.endYear ?? '',
    gender: session.mockProfile?.gender ?? '',
    rollNumber: session.mockProfile?.rollNumber ?? '',
  });
  const [skills, setSkills] = useState<readonly string[]>(session.mockProfile?.skills ?? []);

  const persistedProfile = useMemo(
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

  const completeGoogleAuth = () => {
    const googleProfile = {
      fullName: 'Google User',
      email: 'google.user@oppskills.app',
      password: 'google-auth',
      phoneNumber: '9999999999',
      college: 'Google University',
      course: 'B.Tech',
      specialization: 'Computer Science',
      startYear: '2022',
      endYear: '2026',
      gender: 'Prefer not to say',
      rollNumber: 'GOOGLE-001',
      skills: ['Organizers', 'Frontend'],
    } as const;

    session.setPreferredEmail(googleProfile.email);
    session.saveMockProfile(googleProfile);
    session.signIn();
  };

  return (
    <AuthStack.Navigator
      initialRouteName={session.authEntryRoute === 'sign-in' ? appRoutes.signIn : appRoutes.signUp}
      screenOptions={{ headerShown: false }}
    >
      <AuthStack.Screen name={appRoutes.signUp}>
        {({ navigation }) => (
          <SignUpScreen
            initialEmail={email}
            onContinue={(capturedEmail) => {
              setEmail(capturedEmail);
              session.setPreferredEmail(capturedEmail);
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
            onContinue={(selectedSkills) => {
              setSkills(selectedSkills);
              session.saveMockProfile({ ...persistedProfile, skills: selectedSkills });
              navigation.navigate(appRoutes.signIn);
            }}
            onSkip={() => navigation.navigate(appRoutes.signIn)}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name={appRoutes.signIn}>
        {({ navigation }) => (
          <SignInScreen
            expectedPassword={session.mockProfile?.password}
            initialEmail={email || session.preferredEmail || session.mockProfile?.email || ''}
            onContinue={({ email: signInEmail }) => {
              session.setPreferredEmail(signInEmail);
              if (!session.mockProfile) {
                session.saveMockProfile(persistedProfile);
              }
              session.signIn();
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
            tabNavigation?.navigate(appRoutes.discoverTab, { screen });
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
        {({ navigation }) => (
          <CompetitionPageScreen onBackToDiscover={() => navigation.navigate(appRoutes.homeStack)} />
        )}
      </HomeStack.Screen>
      <HomeStack.Screen name={appRoutes.hackathonPage}>
        {({ navigation }) => (
          <HackathonPageScreen onBackToDiscover={() => navigation.navigate(appRoutes.homeStack)} />
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

  const searchSuggestions = useMemo(() => searchRepository.getSuggestions(searchQuery), [searchQuery]);
  const searchResults = useMemo(() => searchRepository.getResults(searchQuery), [searchQuery]);

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
            onOpenHackathonPage={() => navigation.navigate(appRoutes.hackathonPage)}
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
            onOpenCompetitionPage={() => navigation.navigate(appRoutes.competitionPage)}
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
            onOpenEventFreePage={() => navigation.navigate(appRoutes.eventPageFree)}
            onOpenEventPaidPage={() => navigation.navigate(appRoutes.eventPagePaid)}
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
            onOpenEventFreePage={() => navigation.navigate(appRoutes.eventPageFree)}
            onOpenEventPaidPage={() => navigation.navigate(appRoutes.eventPagePaid)}
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
            onCompetition={() => navigation.navigate(appRoutes.competitionPage)}
            onHackathon={() => navigation.navigate(appRoutes.hackathonPage)}
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
        {({ navigation }) => (
          <CompetitionPageScreen
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
        {({ navigation }) => (
          <HackathonPageScreen
            onBackToDiscover={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
                return;
              }

              navigation.navigate(appRoutes.discoverStack);
            }}
            onRegisterNow={() => navigation.navigate(appRoutes.hackathonRegistration)}
          />
        )}
      </DiscoverStack.Screen>
      <DiscoverStack.Screen name={appRoutes.hackathonRegistration}>
        {({ navigation }) => (
          <HackathonRegistrationScreen
            onBack={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
                return;
              }

              navigation.navigate(appRoutes.hackathonPage);
            }}
          />
        )}
      </DiscoverStack.Screen>
      <DiscoverStack.Screen name={appRoutes.eventPageFree}>
        {({ navigation }) => (
          <EventFreePageScreen
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
        {({ navigation }) => (
          <EventPaidPageScreen
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
  const session = useMockSession();

  return (
    <AppliedStack.Navigator screenOptions={{ headerShown: false }}>
      <AppliedStack.Screen name={appRoutes.appliedStack}>
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
          <CompetitionPageScreen onBackToDiscover={() => navigation.navigate(appRoutes.appliedStack)} />
        )}
      </AppliedStack.Screen>
      <AppliedStack.Screen name={appRoutes.hackathonPage}>
        {({ navigation }) => (
          <HackathonPageScreen onBackToDiscover={() => navigation.navigate(appRoutes.appliedStack)} />
        )}
      </AppliedStack.Screen>
    </AppliedStack.Navigator>
  );
}

function ProfileRegistrationsStackNavigator({ onBackToHome }: { readonly onBackToHome: () => void }) {
  const session = useMockSession();

  return (
    <ProfileRegistrationsStack.Navigator initialRouteName={appRoutes.appliedStack} screenOptions={{ headerShown: false }}>
      <ProfileRegistrationsStack.Screen name={appRoutes.appliedStack}>
        {({ navigation }) => (
          <AppliedScreen
            onBackToProfile={() => {
              onBackToHome();
              navigation.navigate(appRoutes.homeTab, { screen: appRoutes.homeStack });
            }}
            onOpenCompetition={() => navigation.navigate(appRoutes.competitionPage)}
            onOpenHackathon={() => navigation.navigate(appRoutes.hackathonPage)}
            onSignOut={session.signOut}
            variant="registrations"
          />
        )}
      </ProfileRegistrationsStack.Screen>
      <ProfileRegistrationsStack.Screen name={appRoutes.competitionPage}>
        {({ navigation }) => (
          <CompetitionPageScreen onBackToDiscover={() => navigation.navigate(appRoutes.appliedStack)} />
        )}
      </ProfileRegistrationsStack.Screen>
      <ProfileRegistrationsStack.Screen name={appRoutes.hackathonPage}>
        {({ navigation }) => (
          <HackathonPageScreen onBackToDiscover={() => navigation.navigate(appRoutes.appliedStack)} />
        )}
      </ProfileRegistrationsStack.Screen>
    </ProfileRegistrationsStack.Navigator>
  );
}

function ProfileAchievementsStackNavigator({ onBackToHome }: { readonly onBackToHome: () => void }) {
  const session = useMockSession();

  return (
    <ProfileAchievementsStack.Navigator initialRouteName={appRoutes.appliedStack} screenOptions={{ headerShown: false }}>
      <ProfileAchievementsStack.Screen name={appRoutes.appliedStack}>
        {({ navigation }) => (
          <AppliedScreen
            onBackToProfile={() => {
              onBackToHome();
              navigation.navigate(appRoutes.homeTab, { screen: appRoutes.homeStack });
            }}
            onOpenCompetition={() => navigation.navigate(appRoutes.competitionPage)}
            onOpenHackathon={() => navigation.navigate(appRoutes.hackathonPage)}
            onSignOut={session.signOut}
            variant="achievements"
          />
        )}
      </ProfileAchievementsStack.Screen>
      <ProfileAchievementsStack.Screen name={appRoutes.competitionPage}>
        {({ navigation }) => (
          <CompetitionPageScreen onBackToDiscover={() => navigation.navigate(appRoutes.appliedStack)} />
        )}
      </ProfileAchievementsStack.Screen>
      <ProfileAchievementsStack.Screen name={appRoutes.hackathonPage}>
        {({ navigation }) => (
          <HackathonPageScreen onBackToDiscover={() => navigation.navigate(appRoutes.appliedStack)} />
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
          <View style={tabStyles.homeGlyph}>
            <View style={tabStyles.homeRoofLeft} />
            <View style={tabStyles.homeRoofRight} />
            <View style={tabStyles.homeBody} />
          </View>
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
          <View style={tabStyles.compassGlyph}>
            <View style={tabStyles.compassRing} />
            <View style={tabStyles.compassNeedle} />
            <View style={tabStyles.compassNeedleInner} />
            <View style={tabStyles.compassCenter} />
          </View>
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
          <View style={tabStyles.cursorGlyph}>
            <View style={tabStyles.cursorTriangle} />
            <View style={tabStyles.cursorStem} />
          </View>
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
}: BottomTabBarProps & {
  readonly profileTabTarget: keyof MainTabParamList | null;
  readonly setProfileTabTarget: (target: keyof MainTabParamList | null) => void;
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
    <View style={[tabStyles.tabBar, activeStyle as object | undefined]}>
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
        const hideTabBar = focusedRouteName === appRoutes.organizerDashboard;

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
  compassCenter: {
    backgroundColor: '#271B40',
    borderRadius: 2,
    height: 4,
    left: 10,
    position: 'absolute',
    top: 10,
    width: 4,
  },
  compassGlyph: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    position: 'relative',
    width: 24,
  },
  compassNeedle: {
    backgroundColor: '#271B40',
    borderRadius: 2,
    height: 12,
    left: 11,
    position: 'absolute',
    top: 4,
    transform: [{ rotate: '35deg' }],
    width: 3,
  },
  compassNeedleInner: {
    backgroundColor: '#FBF9FD',
    borderRadius: 1.5,
    height: 6,
    left: 11.5,
    position: 'absolute',
    top: 6,
    transform: [{ rotate: '35deg' }],
    width: 2,
  },
  compassRing: {
    borderColor: '#271B40',
    borderRadius: 12,
    borderWidth: 2.5,
    height: 22,
    width: 22,
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
  cursorGlyph: {
    alignItems: 'flex-end',
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  cursorStem: {
    backgroundColor: '#271B40',
    borderRadius: 1.5,
    height: 9,
    marginRight: 1,
    marginTop: -3,
    transform: [{ rotate: '-28deg' }],
    width: 4,
  },
  cursorTriangle: {
    borderBottomColor: 'transparent',
    borderBottomWidth: 6,
    borderLeftColor: '#271B40',
    borderLeftWidth: 15,
    borderTopColor: 'transparent',
    borderTopWidth: 6,
    height: 0,
    width: 0,
  },
  homeBody: {
    backgroundColor: '#271B40',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
    height: 9,
    marginTop: -2,
    width: 16,
  },
  homeGlyph: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  homeRoofLeft: {
    borderBottomColor: '#271B40',
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderLeftWidth: 7,
    borderRightColor: 'transparent',
    borderRightWidth: 7,
    height: 0,
    marginBottom: -1,
    marginRight: 3,
    width: 0,
  },
  homeRoofRight: {
    borderBottomColor: '#271B40',
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderLeftWidth: 7,
    borderRightColor: 'transparent',
    borderRightWidth: 7,
    height: 0,
    marginBottom: -7,
    marginLeft: 3,
    transform: [{ rotate: '0deg' }],
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
