import type { PropsWithChildren } from 'react';
import { createContext, useContext } from 'react';

import { lightTheme } from '../../shared/theme';
import type { AppTheme } from '../../shared/theme';

const ThemeContext = createContext<AppTheme>(lightTheme);

export function ThemeProvider({ children }: PropsWithChildren) {
  return <ThemeContext.Provider value={lightTheme}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): AppTheme {
  return useContext(ThemeContext);
}