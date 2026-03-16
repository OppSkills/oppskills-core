import type { PropsWithChildren } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

type AuthEntryRoute = 'sign-up' | 'sign-in';

export interface MockAuthProfile {
  readonly fullName: string;
  readonly email: string;
  readonly password: string;
  readonly phoneNumber: string;
  readonly college: string;
  readonly course: string;
  readonly specialization: string;
  readonly startYear: string;
  readonly endYear: string;
  readonly gender: string;
  readonly rollNumber: string;
  readonly skills: readonly string[];
}

interface MockSessionContextValue {
  readonly hasSeenOnboarding: boolean;
  readonly isAuthenticated: boolean;
  readonly authEntryRoute: AuthEntryRoute;
  readonly preferredEmail: string;
  readonly mockProfile: MockAuthProfile | null;
  readonly completeOnboarding: () => void;
  readonly continueAsReturningUser: () => void;
  readonly setPreferredEmail: (email: string) => void;
  readonly saveMockProfile: (profile: MockAuthProfile) => void;
  readonly signIn: () => void;
  readonly signOut: () => void;
  readonly restartOnboarding: () => void;
}

const MockSessionContext = createContext<MockSessionContextValue | null>(null);

export function MockSessionProvider({ children }: PropsWithChildren) {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authEntryRoute, setAuthEntryRoute] = useState<AuthEntryRoute>('sign-up');
  const [preferredEmail, setPreferredEmail] = useState('');
  const [mockProfile, setMockProfile] = useState<MockAuthProfile | null>(null);

  const value = useMemo<MockSessionContextValue>(
    () => ({
      hasSeenOnboarding,
      isAuthenticated,
      authEntryRoute,
      preferredEmail,
      mockProfile,
      completeOnboarding: () => {
        setHasSeenOnboarding(true);
        setAuthEntryRoute('sign-up');
      },
      continueAsReturningUser: () => {
        setHasSeenOnboarding(true);
        setAuthEntryRoute('sign-in');
      },
      setPreferredEmail: (email: string) => {
        setPreferredEmail(email.trim());
      },
      saveMockProfile: (profile: MockAuthProfile) => {
        setMockProfile(profile);
        setPreferredEmail(profile.email.trim());
      },
      signIn: () => {
        setHasSeenOnboarding(true);
        setIsAuthenticated(true);
      },
      signOut: () => {
        setIsAuthenticated(false);
        setAuthEntryRoute('sign-in');
      },
      restartOnboarding: () => {
        setHasSeenOnboarding(false);
        setIsAuthenticated(false);
        setAuthEntryRoute('sign-up');
        setPreferredEmail('');
        setMockProfile(null);
      },
    }),
    [authEntryRoute, hasSeenOnboarding, isAuthenticated, mockProfile, preferredEmail],
  );

  return <MockSessionContext.Provider value={value}>{children}</MockSessionContext.Provider>;
}

export function useMockSession(): MockSessionContextValue {
  const context = useContext(MockSessionContext);

  if (!context) {
    throw new Error('useMockSession must be used inside MockSessionProvider');
  }

  return context;
}
