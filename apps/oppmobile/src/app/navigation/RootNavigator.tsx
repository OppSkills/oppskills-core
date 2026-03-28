import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';

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
  DiscoverHackathonsScreen,
  HackathonPageScreen,
} from '../../domains/hackathons/presentation/screens/HackathonScreens';
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
              navigation.navigate(appRoutes.verifyIdentityOtpFilled);
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
  const session = useMockSession();

  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name={appRoutes.homeStack}>
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
            onOpenEventsSecondary={() => navigation.navigate(appRoutes.discoverEventsSecondary)}
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
            onOpenEventsPrimary={() => navigation.navigate(appRoutes.discoverEventsPrimary)}
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
          <CompetitionPageScreen onBackToDiscover={() => navigation.navigate(appRoutes.discoverStack)} />
        )}
      </DiscoverStack.Screen>
      <DiscoverStack.Screen name={appRoutes.hackathonPage}>
        {({ navigation }) => (
          <HackathonPageScreen onBackToDiscover={() => navigation.navigate(appRoutes.discoverStack)} />
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