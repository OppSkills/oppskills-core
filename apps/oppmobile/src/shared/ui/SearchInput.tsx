import { StyleSheet, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

import { lightTheme } from '../theme';

interface SearchInputProps extends Omit<TextInputProps, 'style'> {
  readonly value: string;
  readonly onChangeText: (text: string) => void;
}

export function SearchInput({ value, onChangeText, placeholder = 'Search', ...props }: SearchInputProps) {
  return (
    <View style={styles.container}>
      <TextInput
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={lightTheme.colors.textMuted}
        style={styles.input}
        value={value}
        {...props}
      />
      <View style={styles.searchIcon}>
        <View style={styles.searchCircle} />
        <View style={styles.searchHandle} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: lightTheme.colors.backgroundPrimary,
    borderColor: lightTheme.colors.surfaceBorder,
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 48,
    paddingHorizontal: lightTheme.spacing[16],
  },
  input: {
    color: lightTheme.colors.textPrimary,
    flex: 1,
    fontFamily: lightTheme.typography.body.fontFamily,
    fontSize: lightTheme.typography.body.fontSize,
    lineHeight: lightTheme.typography.body.lineHeight,
    paddingVertical: lightTheme.spacing[10],
  },
  searchCircle: {
    borderColor: lightTheme.colors.textMuted,
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1.5,
    height: 14,
    width: 14,
  },
  searchHandle: {
    backgroundColor: lightTheme.colors.textMuted,
    borderRadius: lightTheme.radius.pill,
    height: 1.5,
    marginLeft: -1,
    marginTop: 8,
    transform: [{ rotate: '45deg' }],
    width: 6,
  },
  searchIcon: {
    alignItems: 'center',
    height: 18,
    justifyContent: 'center',
    marginLeft: lightTheme.spacing[8],
    width: 18,
  },
});