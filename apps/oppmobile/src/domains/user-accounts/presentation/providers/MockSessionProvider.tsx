import type { PropsWithChildren } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

type AuthEntryRoute = 'sign-up' | 'sign-in';

interface MockSessionContextValue {
  readonly hasSeenOnboarding: boolean;
  readonly isAuthenticated: boolean;
  readonly authEntryRoute: AuthEntryRoute;
  readonly completeOnboarding: () => void;
  readonly continueAsReturningUser: () => void;
  readonly signIn: () => void;
  readonly signOut: () => void;
  readonly restartOnboarding: () => void;
}

const MockSessionContext = createContext<MockSessionContextValue | null>(null);

export function MockSessionProvider({ children }: PropsWithChildren) {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authEntryRoute, setAuthEntryRoute] = useState<AuthEntryRoute>('sign-up');

  const value = useMemo<MockSessionContextValue>(
    () => ({
      hasSeenOnboarding,
      isAuthenticated,
      authEntryRoute,
      completeOnboarding: () => {
        setHasSeenOnboarding(true);
        setAuthEntryRoute('sign-up');
      },
      continueAsReturningUser: () => {
        setHasSeenOnboarding(true);
        setAuthEntryRoute('sign-in');
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
      },
    }),
    [authEntryRoute, hasSeenOnboarding, isAuthenticated],
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
