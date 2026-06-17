import { Feather } from '@expo/vector-icons';
import { Image, Pressable, ScrollView, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import competitionStatIcon from '../../../../../assets/Frame 192 (1).png';
import certificateStatIcon from '../../../../../assets/Frame 192 (2).png';
import eventStatIcon from '../../../../../assets/Frame 192.png';
import frame426Illustration from '../../../../../assets/Frame 426.png';
import writingRoomIllustration from '../../../../../assets/Writing room-rafiki 1.png';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useAppSession } from '../../../../shared/auth/useAppSession';
import { AppText } from '../../../../shared/ui';
import { styles } from './ProfileScreen.styles';

interface ProfileScreenProps {
  readonly onBack: () => void;
  readonly onEdit: () => void;
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
  readonly iconSource: ImageSourcePropType;
}

function StatRow({ label, value, iconSource }: StatRowProps) {
  return (
    <View style={styles.statsRow}>
      <View style={styles.statsRowLeft}>
        <View style={styles.statsTile}>
          <Image resizeMode="contain" source={iconSource} style={styles.statsIconImage} />
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

export function ProfileScreen({ onBack, onEdit }: ProfileScreenProps) {
  const session = useAppSession();
  const { data: currentUser } = useCurrentUser();
  
  const fullName = currentUser 
    ? `${currentUser.firstName ?? ''} ${currentUser.lastName ?? ''}`.trim() || 'User'
    : `${session.firstName ?? ''} ${session.lastName ?? ''}`.trim() || 'User';
  const email = currentUser?.email || session.userEmail || '';
  const initials = initialsFromName(fullName);
  const p = currentUser?.onboardingProfile;
  const stats = currentUser?.stats;

  const collegeName = p?.college?.name ?? p?.schoolName ?? p?.companyName ?? null;
  const skillsText = p?.skills && p.skills.length > 0 ? p.skills.join(', ') : null;
  const locationText = [p?.locationCity, p?.locationCountry].filter(Boolean).join(', ') || null;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable accessibilityLabel="Go back" hitSlop={8} onPress={onBack} style={styles.backButton}>
            <Feather color="#271B40" name="arrow-left" size={24} />
          </Pressable>
          <AppText style={styles.headerTitle} variant="title">
            My Profile
          </AppText>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {currentUser?.imageUrl ? (
              <Image source={{ uri: currentUser.imageUrl }} style={{ width: '100%', height: '100%', borderRadius: 999 }} />
            ) : (
              <AppText style={styles.avatarText} variant="title">
                {initials}
              </AppText>
            )}
          </View>

          <View style={styles.profileMeta}>
            <AppText style={styles.name} variant="bodyStrong">
              {fullName}
            </AppText>
            <View style={styles.profileMetaRow}>
              <AppText numberOfLines={1} style={styles.email} variant="caption">
                {email}
              </AppText>
            </View>
            {collegeName ? (
              <AppText numberOfLines={1} style={[styles.email, { marginTop: 2 }]} variant="caption">
                🎓 {collegeName}
              </AppText>
            ) : null}
            {locationText ? (
              <AppText numberOfLines={1} style={[styles.email, { marginTop: 2 }]} variant="caption">
                📍 {locationText}
              </AppText>
            ) : null}
            {skillsText ? (
              <AppText numberOfLines={2} style={[styles.email, { marginTop: 2 }]} variant="caption">
                🛠 {skillsText}
              </AppText>
            ) : null}
          </View>

          <Pressable accessibilityLabel="Edit profile" hitSlop={8} onPress={onEdit} style={styles.editPill}>
            <Feather color="#584D5A" name="edit-2" size={13} />
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
          <StatRow iconSource={eventStatIcon} label="Events" value={String(stats?.events ?? 0)} />
          <StatRow iconSource={competitionStatIcon} label="Competitions" value={String(stats?.competitions ?? 0)} />
          <StatRow iconSource={certificateStatIcon} label="Certificates" value={String(stats?.certificates ?? 0)} />
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
