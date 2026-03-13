import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { lightTheme } from '../../../../shared/theme';
import { AppText, FooterSignatureBlock, ScreenContainer, TopBar } from '../../../../shared/ui';
import { usePhaseReadiness } from '../hooks/usePhaseReadiness';

const plannedDomains = [
  'auth-onboarding',
  'hackathons',
  'competitions',
  'events',
  'communities',
  'applied',
  'search',
  'users',
  'user-accounts',
  'media',
  'colleges',
] as const;

export function PhaseOneFoundationScreen() {
  const { data, isLoading } = usePhaseReadiness('phase-1');

  return (
    <ScreenContainer>
      <TopBar />

      <View style={styles.heroCard}>
        <AppText colorToken="brandPrimaryStrong" style={styles.eyebrow} variant="caption">
          OppSkills Mobile
        </AppText>
        <AppText style={styles.title} variant="displayH1">
          Phase 1 is active
        </AppText>
        <AppText colorToken="textSecondary" style={styles.subtitle} variant="body">
          Foundation setup is now focused on strict domain boundaries, reusable contracts, and
          mock-first data flow that can be swapped for backend repositories later.
        </AppText>
      </View>

      <View style={styles.section}>
        <AppText style={styles.sectionTitle} variant="title">
          Phase 1 readiness snapshot
        </AppText>
        {isLoading && <ActivityIndicator color={lightTheme.colors.brandPrimary} size="small" />}
        {data && (
          <View style={styles.readinessCard}>
            <AppText colorToken="textSecondary" style={styles.readinessLine} variant="body">
              Phase: {data.phase}
            </AppText>
            <AppText colorToken="textSecondary" style={styles.readinessLine} variant="body">
              Total screens: {data.totalScreens}
            </AppText>
            <AppText colorToken="textSecondary" style={styles.readinessLine} variant="body">
              Started: {data.startedScreens}
            </AppText>
            <AppText colorToken="textSecondary" style={styles.readinessLine} variant="body">
              Ready for review: {data.readyScreens}
            </AppText>
            <AppText colorToken="textSecondary" style={styles.readinessLine} variant="body">
              Approved: {data.approvedScreens}
            </AppText>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <AppText style={styles.sectionTitle} variant="title">
          Domain blueprint
        </AppText>
        {plannedDomains.map((domainName) => (
          <View key={domainName} style={styles.domainRow}>
            <AppText style={styles.domainName} variant="bodyStrong">
              {domainName}
            </AppText>
            <AppText colorToken="textMuted" style={styles.domainHint} variant="caption">
              presentation / domain / data
            </AppText>
          </View>
        ))}
      </View>

      <FooterSignatureBlock />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  domainHint: {
    marginTop: lightTheme.spacing[4],
  },
  domainName: {},
  domainRow: {
    backgroundColor: lightTheme.colors.surfacePrimary,
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.md,
    borderWidth: 1,
    marginBottom: lightTheme.spacing[12],
    padding: lightTheme.spacing[16],
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
  readinessCard: {
    backgroundColor: lightTheme.colors.surfacePrimary,
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.md,
    borderWidth: 1,
    marginTop: lightTheme.spacing[8],
    padding: lightTheme.spacing[16],
  },
  readinessLine: {
    marginBottom: lightTheme.spacing[4],
  },
  section: {
    marginBottom: lightTheme.spacing[24],
  },
  sectionTitle: {
    marginBottom: lightTheme.spacing[12],
  },
  subtitle: {
    marginTop: lightTheme.spacing[8],
  },
  title: {},
});
