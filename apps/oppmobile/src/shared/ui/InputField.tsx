import { StyleSheet, TextInput, View } from 'react-native';
import type { StyleProp, TextInputProps, ViewStyle } from 'react-native';

import { lightTheme } from '../theme';
import { AppText } from './AppText';

interface InputFieldProps extends TextInputProps {
  readonly label?: string;
  readonly helperText?: string;
  readonly containerStyle?: StyleProp<ViewStyle>;
}

export function InputField({ label, helperText, containerStyle, ...textInputProps }: InputFieldProps) {
  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <AppText colorToken="textMuted" style={styles.label} variant="micro">
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={lightTheme.colors.textMuted}
        style={styles.input}
        {...textInputProps}
      />
      {helperText ? (
        <AppText colorToken="textMuted" style={styles.helper} variant="caption">
          {helperText}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  helper: {
    marginTop: lightTheme.spacing[6],
  },
  input: {
    backgroundColor: lightTheme.colors.backgroundPrimary,
    borderColor: lightTheme.colors.surfaceBorder,
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    color: lightTheme.colors.textPrimary,
    fontFamily: lightTheme.typography.body.fontFamily,
    fontSize: lightTheme.typography.body.fontSize,
    lineHeight: lightTheme.typography.body.lineHeight,
    minHeight: 48,
    paddingHorizontal: lightTheme.spacing[16],
    paddingVertical: lightTheme.spacing[10],
  },
  label: {
    marginBottom: lightTheme.spacing[6],
  },
  wrapper: {
    width: '100%',
  },
});