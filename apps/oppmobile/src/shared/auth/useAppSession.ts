// src/shared/auth/useAppSession.ts
// Drop-in replacement for useMockSession().
// Provides the same shape as MockSessionContextValue so the navigator can switch
// with a single import change per call site.
//
// Also registers the Clerk getToken fn into apiClient so every authenticated
// repository call automatically has Authorization: Bearer <token>.

import { useAuth, useUser } from '@clerk/clerk-expo';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { registerTokenGetter } from '../api/apiClient';

export interface AppSession {
  /** Whether the Clerk session has been resolved (either signed in or out). */
  readonly isLoaded: boolean;
  /** True when there is an active Clerk session. */
  readonly isAuthenticated: boolean;
  /** True when the user has seen and dismissed the onboarding slides. */
  readonly hasCompletedOnboarding: boolean;
  /** Clerk user ID — null when not signed in. */
  readonly userId: string | null;
  /** Primary email address — null when not signed in. */
  readonly userEmail: string | null;
  /** First name from Clerk — null when not available. */
  readonly firstName: string | null;
  /** Last name from Clerk — null when not available. */
  readonly lastName: string | null;
  /** Signs out the current session. */
  readonly signOut: () => Promise<void>;
  /** Returns the current session JWT — null when not signed in. */
  readonly getToken: () => Promise<string | null>;
  /**
   * Called when user taps "Get Started" on the last onboarding slide.
   * Transitions the root navigator to the Sign Up screen.
   */
  readonly completeOnboarding: () => void;
  /**
   * Called when user taps "Skip" or "Already have an account" during onboarding.
   * Transitions the root navigator to the Sign In screen.
   */
  readonly continueAsReturningUser: () => void;
}

let globalHasCompletedOnboarding = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return globalHasCompletedOnboarding;
}

function setGlobalHasCompletedOnboarding() {
  globalHasCompletedOnboarding = true;
  listeners.forEach((l) => l());
}

export function useAppSession(): AppSession {
  const { isLoaded, isSignedIn, signOut, getToken } = useAuth();
  const { user } = useUser();
  const hasCompletedOnboarding = useSyncExternalStore(subscribe, getSnapshot);

  // Register once so the API client can inject Bearer tokens automatically.
  useEffect(() => {
    registerTokenGetter(() => getToken());
  }, [getToken]);

  const completeOnboarding = useCallback(() => {
    setGlobalHasCompletedOnboarding();
  }, []);

  const continueAsReturningUser = useCallback(() => {
    setGlobalHasCompletedOnboarding();
  }, []);

  return {
    isLoaded,
    isAuthenticated: !!isSignedIn,
    hasCompletedOnboarding,
    userId: user?.id ?? null,
    userEmail: user?.primaryEmailAddress?.emailAddress ?? null,
    firstName: user?.firstName ?? null,
    lastName: user?.lastName ?? null,
    signOut: async () => { await signOut(); },
    getToken: () => getToken(),
    completeOnboarding,
    continueAsReturningUser,
  };
}
