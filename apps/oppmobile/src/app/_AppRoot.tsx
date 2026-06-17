import { StatusBar } from 'expo-status-bar';

import { AppProviders } from './_providers/AppProviders';
import { RootNavigator } from './_navigation/RootNavigator';

export function AppRoot() {
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <RootNavigator />
    </AppProviders>
  );
}