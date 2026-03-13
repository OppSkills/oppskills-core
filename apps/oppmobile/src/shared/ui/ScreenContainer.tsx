import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appDimensions } from '../constants/dimensions';
import { lightTheme } from '../theme';

interface ScreenContainerProps extends PropsWithChildren {
  readonly scrollable?: boolean;
  readonly padded?: boolean;
  readonly contentStyle?: StyleProp<ViewStyle>;
}

export function ScreenContainer({
  children,
  scrollable = true,
  padded = true,
  contentStyle,
}: ScreenContainerProps) {
  const sharedContainerStyle = [styles.contentBase, padded ? styles.paddedContent : null, contentStyle];

  if (scrollable) {
    return (
      <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
        <ScrollView contentContainerStyle={sharedContainerStyle} style={styles.fill}>
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <View style={sharedContainerStyle}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  contentBase: {
    minHeight: '100%',
    paddingBottom: lightTheme.spacing[32],
    paddingTop: lightTheme.spacing[12],
  },
  paddedContent: {
    paddingHorizontal: appDimensions.screenHorizontalPadding,
  },
  safeArea: {
    flex: 1,
    backgroundColor: lightTheme.colors.backgroundPrimary,
  },
});