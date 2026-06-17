import type { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from './ThemeProvider';
import { ClerkProvider } from '../../shared/auth/ClerkProvider';
import { appQueryClient } from '../../shared/query/queryClient';

import { GestureHandlerRootView } from 'react-native-gesture-handler';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProvider>
        <SafeAreaProvider>
          <QueryClientProvider client={appQueryClient}>
            <ThemeProvider>{children}</ThemeProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}