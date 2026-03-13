import type { TextStyle, ViewStyle } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  readonly brandPrimary: string;
  readonly brandPrimaryStrong: string;
  readonly brandPrimarySoft: string;
  readonly brandSecondary: string;
  readonly backgroundPrimary: string;
  readonly backgroundSecondary: string;
  readonly surfacePrimary: string;
  readonly surfaceMuted: string;
  readonly surfaceBorder: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textMuted: string;
  readonly textInverse: string;
  readonly success: string;
  readonly warning: string;
  readonly danger: string;
  readonly infoTint: string;
  readonly divider: string;
  readonly focusRing: string;
  readonly shadow: string;
}

export interface ThemeSpacing {
  readonly 0: number;
  readonly 2: number;
  readonly 4: number;
  readonly 6: number;
  readonly 8: number;
  readonly 10: number;
  readonly 12: number;
  readonly 16: number;
  readonly 20: number;
  readonly 24: number;
  readonly 28: number;
  readonly 32: number;
  readonly 40: number;
}

export interface ThemeRadius {
  readonly none: number;
  readonly xs: number;
  readonly sm: number;
  readonly md: number;
  readonly lg: number;
  readonly xl: number;
  readonly pill: number;
}

export interface TypographyToken {
  readonly fontFamily: string;
  readonly fallbackFontFamily: string;
  readonly fontSize: number;
  readonly lineHeight: number;
  readonly fontWeight: TextStyle['fontWeight'];
  readonly letterSpacing?: number;
}

export interface ThemeTypography {
  readonly displayH1: TypographyToken;
  readonly displayH2: TypographyToken;
  readonly sectionHeading: TypographyToken;
  readonly title: TypographyToken;
  readonly body: TypographyToken;
  readonly bodyStrong: TypographyToken;
  readonly label: TypographyToken;
  readonly caption: TypographyToken;
  readonly micro: TypographyToken;
  readonly statusTime: TypographyToken;
}

export interface ThemeElevation {
  readonly softShadow: ViewStyle;
}

export interface AppTheme {
  readonly mode: ThemeMode;
  readonly colors: ThemeColors;
  readonly spacing: ThemeSpacing;
  readonly radius: ThemeRadius;
  readonly typography: ThemeTypography;
  readonly elevation: ThemeElevation;
}