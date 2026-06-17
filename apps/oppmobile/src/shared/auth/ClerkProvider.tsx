// src/shared/auth/ClerkProvider.tsx
// Wraps the entire app in Clerk's auth context.
// Uses expo-secure-store for persistent token cache (required by @clerk/clerk-expo).

import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import { ClerkProvider as BaseClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY as string;

if (!publishableKey) {
  throw new Error(
    '[OppSkills] EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set in your .env file.\n' +
    'Get your publishable key from dashboard.clerk.com → API Keys.',
  );
}

// SecureStore-backed token cache required by @clerk/clerk-expo v2+
const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Silently ignore — token won't persist across restarts but auth still works for session
    }
  },
};

export function ClerkProvider({ children }: PropsWithChildren) {
  // Warm up the system browser so OAuth flows open instantly on Android.
  // On iOS this is a no-op. On Android it pre-loads Chrome Custom Tabs.
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  return (
    <BaseClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      {/*
        ClerkLoaded ensures children never render before Clerk's session is resolved.
        This prevents the split-second flash of unauthenticated UI.
      */}
      <ClerkLoaded>{children}</ClerkLoaded>
    </BaseClerkProvider>
  );
}
