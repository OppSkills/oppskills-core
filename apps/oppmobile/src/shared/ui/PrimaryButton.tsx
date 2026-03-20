import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
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
  readonly loading?: boolean;
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
  loading = false,
  style,
}: PrimaryButtonProps) {
  const computedDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={computedDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: backgroundToneMap[tone],
          borderColor: tone === 'outline' ? lightTheme.colors.focusRing : backgroundToneMap[tone],
          opacity: computedDisabled ? 0.45 : pressed ? 0.9 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        <AppText colorToken={tone === 'outline' ? 'brandPrimaryStrong' : 'textInverse'} style={styles.symbol} variant="label">
          {'<'}
        </AppText>
        {loading ? (
          <ActivityIndicator
            color={tone === 'outline' ? lightTheme.colors.brandPrimaryStrong : lightTheme.colors.textInverse}
            size="small"
          />
        ) : (
          <AppText style={{ color: textToneMap[tone] }} variant="bodyStrong">
            {label}
          </AppText>
        )}
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