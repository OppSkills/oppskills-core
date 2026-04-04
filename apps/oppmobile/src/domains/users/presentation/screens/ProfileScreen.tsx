import { Image, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import frame426Illustration from '../../../../../assets/Frame 426.png';
import writingRoomIllustration from '../../../../../assets/Writing room-rafiki 1.png';
import { useMockSession } from '../../../user-accounts/presentation/providers/MockSessionProvider';
import { AppText } from '../../../../shared/ui';
import { styles } from './ProfileScreen.styles';

interface ProfileScreenProps {
  readonly onBack: () => void;
}

const FALLBACK_PROFILE = {
  email: 'rohanvats12@gmail.com',
  fullName: 'Someone sharma',
  phone: '9999999999',
} as const;

function formatPhoneLabel(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');

  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }

  return rawPhone;
}

function initialsFromName(fullName: string): string {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return 'OS';
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

interface StatRowProps {
  readonly label: string;
  readonly value: string;
  readonly glyph: 'calendar' | 'stars' | 'certificate';
}

function StatRow({ label, value, glyph }: StatRowProps) {
  return (
    <View style={styles.statsRow}>
      <View style={styles.statsRowLeft}>
        <View style={styles.statsTile}>
          {glyph === 'calendar' ? <CalendarGlyph /> : null}
          {glyph === 'stars' ? <StarsGlyph /> : null}
          {glyph === 'certificate' ? <CertificateGlyph /> : null}
        </View>
        <AppText style={styles.statsRowLabel} variant="body">
          {label}
        </AppText>
      </View>
      <AppText style={styles.statsRowValue} variant="bodyStrong">
        {value}
      </AppText>
    </View>
  );
}

function CalendarGlyph() {
  return (
    <View style={styles.iconCalendarBody}>
      <View style={styles.iconCalendarDivider} />
      <View style={[styles.iconCalendarDot, { left: 4, top: 10 }]} />
      <View style={[styles.iconCalendarDot, { left: 8, top: 10 }]} />
      <View style={[styles.iconCalendarDot, { left: 12, top: 10 }]} />
    </View>
  );
}

function StarsGlyph() {
  return (
    <View style={styles.iconWrap}>
      <View style={styles.iconStarsRing} />
      <View style={[styles.iconStarsDot, { left: 9, top: 1 }]} />
      <View style={[styles.iconStarsDot, { left: 2, top: 9 }]} />
    </View>
  );
}

function CertificateGlyph() {
  return (
    <View style={styles.iconCertificateBody}>
      <View style={styles.iconCertificateLine} />
      <View style={styles.iconCertificateRibbon} />
    </View>
  );
}

export function ProfileScreen({ onBack }: ProfileScreenProps) {
  const session = useMockSession();
  const fullName = session.mockProfile?.fullName || FALLBACK_PROFILE.fullName;
  const email = session.mockProfile?.email || FALLBACK_PROFILE.email;
  const phone = formatPhoneLabel(session.mockProfile?.phoneNumber || FALLBACK_PROFILE.phone);
  const initials = initialsFromName(fullName);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable accessibilityLabel="Go back" hitSlop={8} onPress={onBack} style={styles.backButton}>
            <AppText style={styles.backButtonText} variant="title">
              {'<'}
            </AppText>
          </Pressable>
          <AppText style={styles.headerTitle} variant="title">
            My Profile
          </AppText>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <AppText style={styles.avatarText} variant="title">
              {initials}
            </AppText>
          </View>

          <View style={styles.profileMeta}>
            <AppText style={styles.name} variant="bodyStrong">
              {fullName}
            </AppText>
            <View style={styles.profileMetaRow}>
              <AppText style={styles.phone} variant="caption">
                {phone}
              </AppText>
              <View style={styles.tinyDot} />
              <AppText numberOfLines={1} style={styles.email} variant="caption">
                {email}
              </AppText>
            </View>
          </View>

          <Pressable style={styles.editPill}>
            <View style={styles.editPen} />
            <AppText style={styles.editText} variant="caption">
              Edit
            </AppText>
          </Pressable>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statsGlowLarge} />
          <View style={styles.statsGlowSmall} />
          <AppText style={styles.cardTitle} variant="title">
            Your Stats
          </AppText>
          <StatRow glyph="calendar" label="Events" value="12" />
          <StatRow glyph="stars" label="Competitions" value="8" />
          <StatRow glyph="certificate" label="Certificates" value="8" />
        </View>

        <View style={styles.sectionCard}>
          <AppText style={styles.sectionTitle} variant="title">
            Upcoming Rounds
          </AppText>
          <Image resizeMode="contain" source={writingRoomIllustration} style={styles.illustration} />
          <AppText style={styles.upcomingNote} variant="body">
            You haven't registered in any Competition, Event or Festival till now
          </AppText>
        </View>

        <View style={styles.sectionCard}>
          <AppText style={styles.sectionTitle} variant="title">
            Leaderboard
          </AppText>
          <Image resizeMode="contain" source={frame426Illustration} style={styles.illustration} />
          <AppText style={styles.leaderBoardNote} variant="body">
            We are building it. Coming soon
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
