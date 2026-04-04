import { StyleSheet, View } from 'react-native';

import { lightTheme } from '../theme';
import { AppText } from './AppText';

interface FooterSignatureBlockProps {
  readonly compact?: boolean;
}

export function FooterSignatureBlock({ compact = false }: FooterSignatureBlockProps) {
  return (
    <View style={[styles.wrapper, compact ? styles.compact : null]}>
      <AppText style={styles.title} variant="displayH2">
        Global Opportunities. Powered by Skills.
      </AppText>
      <AppText colorToken="textSecondary" style={styles.meta} variant="caption">
        Made with ❤️ in India
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  compact: {
    marginTop: lightTheme.spacing[20],
  },
  meta: {
    marginTop: lightTheme.spacing[12],
  },
  title: {
    fontSize: lightTheme.typography.sectionHeading.fontSize,
    lineHeight: lightTheme.typography.sectionHeading.lineHeight,
  },
  wrapper: {
    borderTopColor: lightTheme.colors.divider,
    borderTopWidth: 1,
    marginTop: lightTheme.spacing[32],
    paddingTop: lightTheme.spacing[20],
  },
});