import type { PropsWithChildren } from 'react';
import { StyleSheet, Text } from 'react-native';
import type { StyleProp, TextStyle } from 'react-native';

import { lightTheme } from '../theme';

type TextVariant = keyof typeof lightTheme.typography;
type ColorToken = keyof typeof lightTheme.colors;

interface AppTextProps extends PropsWithChildren {
  readonly variant?: TextVariant;
  readonly colorToken?: ColorToken;
  readonly style?: StyleProp<TextStyle>;
  readonly numberOfLines?: number;
}

export function AppText({
  children,
  variant = 'body',
  colorToken = 'textPrimary',
  style,
  numberOfLines,
}: AppTextProps) {
  const token = lightTheme.typography[variant];

  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        styles.base,
        {
          color: lightTheme.colors[colorToken],
          fontFamily: token.fontFamily,
          fontSize: token.fontSize,
          fontWeight: token.fontWeight,
          letterSpacing: token.letterSpacing,
          lineHeight: token.lineHeight,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});