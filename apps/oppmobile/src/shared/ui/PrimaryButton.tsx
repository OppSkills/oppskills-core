import { Pressable, StyleSheet, View } from 'react-native';
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';

import { lightTheme } from '../theme';
import { AppText } from './AppText';

type ButtonTone = 'primary' | 'secondary' | 'outline';

interface PrimaryButtonProps {
  readonly label: string;
  readonly onPress?: (event: GestureResponderEvent) => void;
  readonly tone?: ButtonTone;
  readonly fullWidth?: boolean;
  readonly disabled?: boolean;
  readonly style?: StyleProp<ViewStyle>;
}

const backgroundToneMap = {
  primary: lightTheme.colors.brandPrimaryStrong,
  secondary: lightTheme.colors.brandSecondary,
  outline: lightTheme.colors.backgroundPrimary,
} as const;

const textToneMap = {
  primary: lightTheme.colors.textInverse,
  secondary: lightTheme.colors.textInverse,
  outline: lightTheme.colors.brandPrimaryStrong,
} as const;

export function PrimaryButton({
  label,
  onPress,
  tone = 'primary',
  fullWidth = true,
  disabled = false,
  style,
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: backgroundToneMap[tone],
          borderColor: tone === 'outline' ? lightTheme.colors.focusRing : backgroundToneMap[tone],
          opacity: disabled ? 0.45 : pressed ? 0.9 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        <AppText colorToken={tone === 'outline' ? 'brandPrimaryStrong' : 'textInverse'} style={styles.symbol} variant="label">
          {'<'}
        </AppText>
        <AppText style={{ color: textToneMap[tone] }} variant="bodyStrong">
          {label}
        </AppText>
        <AppText colorToken={tone === 'outline' ? 'brandPrimaryStrong' : 'textInverse'} style={styles.symbol} variant="label">
          {'>'}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: lightTheme.spacing[16],
    paddingVertical: lightTheme.spacing[10],
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: lightTheme.spacing[16],
    justifyContent: 'center',
  },
  symbol: {
    minWidth: 10,
    textAlign: 'center',
  },
});