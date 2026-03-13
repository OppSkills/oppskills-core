import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { lightTheme } from '../../../../shared/theme';
import {
  AppText,
  FooterSignatureBlock,
  InputField,
  PrimaryButton,
  ScreenContainer,
  SearchInput,
  TopBar,
} from '../../../../shared/ui';

const primitiveChecklist = [
  'Tokenized colors, spacing, radius, and typography scales',
  'ScreenContainer layout primitive with safe-area defaults',
  'TopBar status primitive for onboarding and auth flows',
  'SearchInput and InputField form primitives',
  'PrimaryButton with primary, secondary, and outline tones',
  'FooterSignatureBlock for reusable bottom sections',
] as const;

export function PhaseTwoDesignSystemScreen() {
  const [searchValue, setSearchValue] = useState('');
  const [emailValue, setEmailValue] = useState('');

  return (
    <ScreenContainer>
      <TopBar />

      <View style={styles.heroCard}>
        <AppText colorToken="brandPrimaryStrong" variant="caption">
          OppSkills Mobile
        </AppText>
        <AppText style={styles.heroTitle} variant="displayH2">
          Phase 2 design system is active
        </AppText>
        <AppText colorToken="textSecondary" style={styles.heroSubtitle} variant="body">
          This layer now provides reusable tokens and primitives for rapid screen production with
          consistent UI behavior.
        </AppText>
      </View>

      <View style={styles.section}>
        <AppText style={styles.sectionTitle} variant="title">
          Primitive readiness
        </AppText>
        {primitiveChecklist.map((item) => (
          <View key={item} style={styles.checkRow}>
            <View style={styles.checkDot} />
            <AppText colorToken="textSecondary" style={styles.checkText} variant="body">
              {item}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <AppText style={styles.sectionTitle} variant="title">
          Inputs and actions
        </AppText>
        <SearchInput onChangeText={setSearchValue} value={searchValue} />
        <InputField
          autoCapitalize="none"
          containerStyle={styles.inputSpacing}
          keyboardType="email-address"
          label="Email"
          onChangeText={setEmailValue}
          placeholder="Enter your email"
          value={emailValue}
        />
        <PrimaryButton label="Continue" style={styles.buttonSpacing} tone="primary" />
        <PrimaryButton label="Skip for now" style={styles.buttonSpacing} tone="outline" />
      </View>

      <FooterSignatureBlock />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  buttonSpacing: {
    marginTop: lightTheme.spacing[12],
  },
  checkDot: {
    backgroundColor: lightTheme.colors.brandPrimary,
    borderRadius: lightTheme.radius.pill,
    height: 7,
    marginTop: 9,
    width: 7,
  },
  checkRow: {
    flexDirection: 'row',
    marginBottom: lightTheme.spacing[12],
  },
  checkText: {
    flex: 1,
    marginLeft: lightTheme.spacing[10],
  },
  heroCard: {
    backgroundColor: lightTheme.colors.backgroundSecondary,
    borderColor: lightTheme.colors.focusRing,
    borderRadius: lightTheme.radius.lg,
    borderWidth: 1,
    marginBottom: lightTheme.spacing[24],
    padding: lightTheme.spacing[20],
  },
  heroSubtitle: {
    marginTop: lightTheme.spacing[8],
  },
  heroTitle: {
    marginTop: lightTheme.spacing[8],
  },
  inputSpacing: {
    marginTop: lightTheme.spacing[12],
  },
  section: {
    marginBottom: lightTheme.spacing[24],
  },
  sectionTitle: {
    marginBottom: lightTheme.spacing[12],
  },
});