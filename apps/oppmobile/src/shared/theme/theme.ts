import type { AppTheme, ThemeColors, ThemeRadius, ThemeSpacing, ThemeTypography } from './contracts';

const spacing: ThemeSpacing = {
  0: 0,
  2: 2,
  4: 4,
  6: 6,
  8: 8,
  10: 10,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  28: 28,
  32: 32,
  40: 40,
};

const radius: ThemeRadius = {
  none: 0,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999,
};

const typography: ThemeTypography = {
  displayH1: {
    fontFamily: 'Aeonik Pro',
    fallbackFontFamily: 'System',
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '500',
  },
  displayH2: {
    fontFamily: 'Aeonik Pro',
    fallbackFontFamily: 'System',
    fontSize: 28,
    lineHeight: 35,
    fontWeight: '500',
  },
  sectionHeading: {
    fontFamily: 'Aeonik Pro',
    fallbackFontFamily: 'System',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '500',
  },
  title: {
    fontFamily: 'Urbanist',
    fallbackFontFamily: 'System',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
  },
  body: {
    fontFamily: 'Urbanist',
    fallbackFontFamily: 'System',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodyStrong: {
    fontFamily: 'Urbanist',
    fallbackFontFamily: 'System',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  label: {
    fontFamily: 'Urbanist',
    fallbackFontFamily: 'System',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  caption: {
    fontFamily: 'Urbanist',
    fallbackFontFamily: 'System',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  micro: {
    fontFamily: 'Urbanist',
    fallbackFontFamily: 'System',
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500',
  },
  statusTime: {
    fontFamily: 'Inter',
    fallbackFontFamily: 'System',
    fontSize: 16,
    lineHeight: 19,
    fontWeight: '400',
  },
};

const lightColors: ThemeColors = {
  brandPrimary: '#8359D5',
  brandPrimaryStrong: '#42007A',
  brandPrimarySoft: '#E2D3FF',
  brandSecondary: '#423072',
  backgroundPrimary: '#FAFAFA',
  backgroundSecondary: '#F3EEFF',
  surfacePrimary: '#FFFFFF',
  surfaceMuted: '#F2F2F3',
  surfaceBorder: '#C3BFC4',
  textPrimary: '#100013',
  textSecondary: '#59575B',
  textMuted: '#7A7881',
  textInverse: '#FFFFFF',
  success: '#009826',
  warning: '#F59E0B',
  danger: '#EA4335',
  infoTint: '#D9E2F8',
  divider: '#E1DEE8',
  focusRing: '#AC89F2',
  shadow: 'rgba(23, 11, 45, 0.08)',
};

const darkColors: ThemeColors = {
  brandPrimary: '#9A7DE2',
  brandPrimaryStrong: '#6C44C2',
  brandPrimarySoft: '#37295A',
  brandSecondary: '#8F72D1',
  backgroundPrimary: '#131118',
  backgroundSecondary: '#1A1622',
  surfacePrimary: '#211C2D',
  surfaceMuted: '#2A2338',
  surfaceBorder: '#3D3452',
  textPrimary: '#F7F4FF',
  textSecondary: '#D6CFE4',
  textMuted: '#AFA6C4',
  textInverse: '#0C0A10',
  success: '#4FD37B',
  warning: '#F8B84E',
  danger: '#F4796E',
  infoTint: '#2A3A58',
  divider: '#332B45',
  focusRing: '#B79CFF',
  shadow: 'rgba(0, 0, 0, 0.35)',
};

function createTheme(mode: AppTheme['mode'], colors: ThemeColors): AppTheme {
  return {
    mode,
    colors,
    spacing,
    radius,
    typography,
    elevation: {
      softShadow: {
        elevation: 3,
        shadowColor: colors.shadow,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 1,
        shadowRadius: 8,
      },
    },
  };
}

export const lightTheme = createTheme('light', lightColors);

export const darkTheme = createTheme('dark', darkColors);

export const themeRegistry: Record<AppTheme['mode'], AppTheme> = {
  light: lightTheme,
  dark: darkTheme,
};