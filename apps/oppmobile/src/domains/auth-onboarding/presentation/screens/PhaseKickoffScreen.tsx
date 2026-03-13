import { StyleSheet, View } from 'react-native';

import { mockScreenStatus } from '../../data/mockScreenStatus';
import { lightTheme } from '../../../../shared/theme';
import { formatDateLabel } from '../../../../shared/utils/formatDate';
import { AppText, FooterSignatureBlock, ScreenContainer, TopBar } from '../../../../shared/ui';

const todayLabel = formatDateLabel(new Date('2026-03-13T00:00:00.000Z'));

export function PhaseKickoffScreen() {
  return (
    <ScreenContainer>
      <TopBar />

      <View style={styles.heroCard}>
        <AppText colorToken="brandPrimaryStrong" style={styles.eyebrow} variant="caption">
          OppSkills Mobile
        </AppText>
        <AppText style={styles.title} variant="displayH1">
          Phase 0 started. Foundation is now in place.
        </AppText>
        <AppText colorToken="textSecondary" style={styles.subtitle} variant="body">
          The Expo starter has been replaced with a feature-based React Native app shell inside
          apps/oppmobile.
        </AppText>
        <AppText colorToken="textMuted" style={styles.meta} variant="caption">
          Kickoff date: {todayLabel}
        </AppText>
      </View>

      <View style={styles.section}>
        <AppText style={styles.sectionTitle} variant="title">
          Current foundation
        </AppText>
        <AppText colorToken="textSecondary" style={styles.bullet} variant="body">
          1. src architecture grouped by app, shared, and domains.
        </AppText>
        <AppText colorToken="textSecondary" style={styles.bullet} variant="body">
          2. Safe area, theme, and query providers wired at the root.
        </AppText>
        <AppText colorToken="textSecondary" style={styles.bullet} variant="body">
          3. Shared tokens, routes, dimensions, and formatting helpers added.
        </AppText>
        <AppText colorToken="textSecondary" style={styles.bullet} variant="body">
          4. Phase 0 delivery documents added for scope and tracking.
        </AppText>
      </View>

      <View style={styles.section}>
        <AppText style={styles.sectionTitle} variant="title">
          Initial delivery register
        </AppText>
        {mockScreenStatus.map((item) => (
          <View key={item.name} style={styles.statusRow}>
            <View style={styles.statusCopy}>
              <AppText style={styles.statusName} variant="bodyStrong">
                {item.name}
              </AppText>
              <AppText colorToken="textMuted" style={styles.statusDomain} variant="caption">
                {item.domain}
              </AppText>
            </View>
            <View style={styles.badge}>
              <AppText colorToken="brandPrimaryStrong" style={styles.badgeText} variant="caption">
                {item.status}
              </AppText>
            </View>
          </View>
        ))}
      </View>

      <FooterSignatureBlock />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: lightTheme.colors.brandPrimarySoft,
    borderRadius: lightTheme.radius.pill,
    paddingHorizontal: lightTheme.spacing[12],
    paddingVertical: lightTheme.spacing[8],
  },
  badgeText: {
    textTransform: 'capitalize',
  },
  bullet: {
    marginTop: lightTheme.spacing[8],
  },
  eyebrow: {
    marginBottom: lightTheme.spacing[8],
    textTransform: 'uppercase',
  },
  heroCard: {
    backgroundColor: lightTheme.colors.surfaceMuted,
    borderColor: lightTheme.colors.surfaceBorder,
    borderRadius: lightTheme.radius.lg,
    borderWidth: 1,
    marginBottom: lightTheme.spacing[24],
    padding: lightTheme.spacing[20],
  },
  meta: {
    marginTop: lightTheme.spacing[12],
  },
  section: {
    marginBottom: lightTheme.spacing[24],
  },
  sectionTitle: {
    marginBottom: lightTheme.spacing[12],
  },
  statusCopy: {
    flex: 1,
    paddingRight: lightTheme.spacing[12],
  },
  statusDomain: {
    marginTop: lightTheme.spacing[4],
  },
  statusName: {},
  statusRow: {
    alignItems: 'center',
    backgroundColor: lightTheme.colors.surfacePrimary,
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: lightTheme.spacing[12],
    padding: lightTheme.spacing[16],
  },
  subtitle: {
    marginTop: lightTheme.spacing[8],
  },
  title: {},
});