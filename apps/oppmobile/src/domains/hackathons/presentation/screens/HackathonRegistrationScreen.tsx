import { useState } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import bannerImage from '../../../../../assets/highres_490352821 1.png';
import { useMockSession } from '../../../user-accounts/presentation/providers/MockSessionProvider';
import { useHideTabBar } from '../../../../shared/hooks/useHideTabBar';
import { lightTheme } from '../../../../shared/theme';
import { AppText } from '../../../../shared/ui';

type TeamMode = 'create' | 'join';

interface HackathonRegistrationScreenProps {
  readonly onBack: () => void;
}

export function HackathonRegistrationScreen({ onBack }: HackathonRegistrationScreenProps) {
  useHideTabBar();
  const session = useMockSession();
  const [mode, setMode] = useState<TeamMode>('create');
  const [teamName, setTeamName] = useState('');
  const [openToJoin, setOpenToJoin] = useState(true);

  const userName = session.mockProfile?.fullName ?? 'Rohit';
  const userEmail = session.preferredEmail || session.mockProfile?.email || 'user@oppskills.app';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <View style={styles.heroContainer}>
        <ImageBackground resizeMode="cover" source={bannerImage} style={styles.hero}>
          <View style={styles.backButtonWrap}>
            <Pressable hitSlop={8} onPress={onBack} style={styles.backButton}>
              <View style={styles.backArrow} />
            </Pressable>
          </View>
        </ImageBackground>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppText style={styles.heading} variant="displayH2">
          Registration Form
        </AppText>

        <View style={styles.modeRow}>
          <Pressable
            onPress={() => setMode('create')}
            style={[styles.modeButton, mode === 'create' ? styles.modeButtonActive : styles.modeButtonInactive]}
          >
            <AppText style={[styles.modeLabel, mode === 'create' ? styles.modeLabelActive : styles.modeLabelInactive]} variant="label">
              👥  Create team
            </AppText>
          </Pressable>

          <Pressable
            onPress={() => setMode('join')}
            style={[styles.modeButton, mode === 'join' ? styles.modeButtonActive : styles.modeButtonInactive]}
          >
            <AppText style={[styles.modeLabel, mode === 'join' ? styles.modeLabelActive : styles.modeLabelInactive]} variant="label">
              🤸  Join existing team
            </AppText>
          </Pressable>
        </View>

        <View style={styles.fieldGroup}>
          <AppText style={styles.fieldLabel} variant="caption">
            Team Name
          </AppText>
          <View style={styles.inputWrap}>
            <TextInput
              onChangeText={setTeamName}
              placeholder="Team Innovators"
              placeholderTextColor="#7C737E"
              style={styles.textInput}
              value={teamName}
            />
          </View>
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleTextGroup}>
            <AppText style={styles.toggleTitle} variant="body">
              Open for other teams to join
            </AppText>
            <AppText style={styles.toggleSub} variant="caption">
              All other participants can request to join your team
            </AppText>
          </View>
          <Switch
            onValueChange={setOpenToJoin}
            thumbColor="#FFFFFF"
            trackColor={{ false: '#C3BFC4', true: '#0A9952' }}
            value={openToJoin}
          />
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.participantCard}>
          <View style={styles.participantRow}>
            <View style={styles.avatarCircle}>
              <AppText colorToken="brandPrimaryStrong" style={styles.avatarText} variant="caption">
                {userName.slice(0, 2).toUpperCase()}
              </AppText>
            </View>
            <AppText style={styles.participantName} variant="label">
              {userName}
            </AppText>
            <AppText numberOfLines={1} style={styles.participantEmail} variant="body">
              {userEmail}
            </AppText>
          </View>

          <Pressable style={styles.registerButton}>
            <AppText colorToken="textInverse" style={styles.registerLabel} variant="bodyStrong">
              Register as team
            </AppText>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatarCircle: {
    alignItems: 'center',
    backgroundColor: lightTheme.colors.brandPrimarySoft,
    borderRadius: 20,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  avatarText: {
    fontSize: 10,
    lineHeight: 14,
  },
  backArrow: {
    borderBottomColor: 'transparent',
    borderBottomWidth: 7,
    borderRightColor: '#342636',
    borderRightWidth: 11,
    borderTopColor: 'transparent',
    borderTopWidth: 7,
    height: 0,
    width: 0,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 24,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  backButtonWrap: {
    left: 12,
    position: 'absolute',
    top: 10,
  },
  fieldGroup: {
    gap: 4,
    marginTop: 24,
  },
  fieldLabel: {
    color: '#584D5A',
    fontSize: 10,
    lineHeight: 15,
  },
  footer: {
    paddingBottom: lightTheme.spacing[16],
    paddingHorizontal: lightTheme.spacing[16],
    paddingTop: lightTheme.spacing[8],
  },
  heading: {
    color: '#100013',
    marginTop: 24,
  },
  hero: {
    height: 235,
    position: 'relative',
    width: '100%',
  },
  heroContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 36,
  },
  inputWrap: {
    backgroundColor: '#FAFAFA',
    borderColor: '#C3BFC4',
    borderRadius: 24,
    borderWidth: 1,
    height: 45,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modeButton: {
    alignItems: 'center',
    borderRadius: 33,
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modeButtonActive: {
    backgroundColor: '#F3EEFF',
    borderColor: '#6949AA',
    borderWidth: 1,
  },
  modeButtonInactive: {
    backgroundColor: '#F3EEFF',
  },
  modeLabel: {
    fontSize: 14,
    lineHeight: 17,
    textAlign: 'center',
  },
  modeLabelActive: {
    color: '#6949AA',
  },
  modeLabelInactive: {
    color: '#584D5A',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 24,
  },
  participantCard: {
    backgroundColor: '#F3EEFF',
    borderColor: '#6949AA',
    borderRadius: 26,
    borderWidth: 0.5,
    gap: 8,
    paddingHorizontal: 4,
    paddingBottom: 4,
    paddingTop: 8,
  },
  participantEmail: {
    color: '#584D5A',
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
  participantName: {
    color: '#584D5A',
    fontSize: 14,
    lineHeight: 17,
  },
  participantRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  registerButton: {
    alignItems: 'center',
    backgroundColor: '#423072',
    borderRadius: 100,
    height: 48,
    justifyContent: 'center',
    width: '100%',
  },
  registerLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 19,
  },
  screen: {
    backgroundColor: '#FAFAFA',
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  spacer: {
    height: 24,
  },
  textInput: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 14,
    lineHeight: 21,
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
    marginTop: 24,
  },
  toggleSub: {
    color: '#584D5A',
    fontSize: 12,
    lineHeight: 18,
  },
  toggleTextGroup: {
    flex: 1,
    gap: 6,
  },
  toggleTitle: {
    color: '#100013',
    fontSize: 16,
    lineHeight: 24,
  },
});
