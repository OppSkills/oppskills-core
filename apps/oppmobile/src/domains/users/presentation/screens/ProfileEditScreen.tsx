import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMockSession } from '../../../user-accounts/presentation/providers/MockSessionProvider';
import { AppText } from '../../../../shared/ui';
import { styles } from './ProfileEditScreen.styles';

interface ProfileEditScreenProps {
  readonly onBack: () => void;
}

type FieldAccessory = 'chevron' | 'none' | 'verified';

interface ProfileFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly accessory?: FieldAccessory;
  readonly containerStyle?: StyleProp<ViewStyle>;
  readonly editable?: boolean;
}

const FALLBACK_PROFILE = {
  email: 'rohanvats12@gmail.com',
  fullName: 'Someone sharma',
  phoneNumber: '9999999999',
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

function ProfileField({
  label,
  value,
  onChangeText,
  accessory = 'none',
  containerStyle,
  editable = true,
}: ProfileFieldProps) {
  const isEditable = editable && accessory !== 'chevron';

  return (
    <View style={[styles.fieldBlock, containerStyle]}>
      <AppText style={styles.fieldLabel} variant="micro">
        {label}
      </AppText>

      <View style={styles.fieldContainer}>
        <TextInput
          editable={isEditable}
          onChangeText={onChangeText}
          placeholder={label}
          placeholderTextColor="#A099A1"
          showSoftInputOnFocus={isEditable}
          style={styles.fieldInput}
          value={value}
        />

        {accessory === 'verified' ? (
          <View style={styles.verifiedWrap}>
            <View style={styles.verifiedCheck} />
          </View>
        ) : null}

        {accessory === 'chevron' ? (
          <View style={styles.chevronWrap}>
            <View style={styles.chevron} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function ProfileEditScreen({ onBack }: ProfileEditScreenProps) {
  const session = useMockSession();

  const [email, setEmail] = useState(session.mockProfile?.email ?? FALLBACK_PROFILE.email);
  const [fullName, setFullName] = useState(session.mockProfile?.fullName ?? FALLBACK_PROFILE.fullName);
  const [phoneNumber, setPhoneNumber] = useState(
    formatPhoneLabel(session.mockProfile?.phoneNumber ?? FALLBACK_PROFILE.phoneNumber),
  );
  const [course, setCourse] = useState(session.mockProfile?.course ?? 'B.Tech');
  const [specialization, setSpecialization] = useState(session.mockProfile?.specialization ?? 'Computer Science');
  const [college, setCollege] = useState(session.mockProfile?.college ?? 'OppSkills University');
  const [startYear, setStartYear] = useState(session.mockProfile?.startYear ?? '2022');
  const [endYear, setEndYear] = useState(session.mockProfile?.endYear ?? '2026');
  const [gender, setGender] = useState(session.mockProfile?.gender ?? 'Rather not to say');
  const [rollNumber, setRollNumber] = useState(session.mockProfile?.rollNumber ?? 'OS-001');
  const [skills, setSkills] = useState((session.mockProfile?.skills ?? ['Frontend']).join(', '));
  const [preferredRole, setPreferredRole] = useState('Software Engineer');
  const [bio, setBio] = useState('Building projects and looking for impactful opportunities.');

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator>
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

        <View style={styles.avatarWrap}>
          <Pressable accessibilityLabel="Edit profile picture" style={styles.avatarEditBadge}>
            <View style={styles.avatarEditPen} />
          </Pressable>

          <View style={styles.avatarCircle}>
            <AppText style={styles.avatarInitials} variant="title">
              {initialsFromName(fullName)}
            </AppText>
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <ProfileField label="Email address *" onChangeText={setEmail} value={email} />
          <ProfileField label="Full name *" onChangeText={setFullName} value={fullName} />
          <ProfileField accessory="verified" label="Phone number *" onChangeText={setPhoneNumber} value={phoneNumber} />
          <ProfileField accessory="chevron" editable={false} label="Course *" onChangeText={setCourse} value={course} />
          <ProfileField
            accessory="chevron"
            editable={false}
            label="Specialization *"
            onChangeText={setSpecialization}
            value={specialization}
          />
        </View>

        <View style={styles.sectionWrapBottom}>
          <ProfileField label="College/University name *" onChangeText={setCollege} value={college} />

          <View style={styles.dualRow}>
            <ProfileField
              accessory="chevron"
              containerStyle={styles.halfField}
              editable={false}
              label="Start year *"
              onChangeText={setStartYear}
              value={startYear}
            />
            <ProfileField
              accessory="chevron"
              containerStyle={styles.halfField}
              editable={false}
              label="End year *"
              onChangeText={setEndYear}
              value={endYear}
            />
          </View>

          <View style={styles.dualRow}>
            <ProfileField
              accessory="chevron"
              containerStyle={styles.halfField}
              editable={false}
              label="Gender *"
              onChangeText={setGender}
              value={gender}
            />
            <ProfileField containerStyle={styles.halfField} label="Roll number *" onChangeText={setRollNumber} value={rollNumber} />
          </View>

          <ProfileField accessory="chevron" editable={false} label="Skills *" onChangeText={setSkills} value={skills} />
          <ProfileField
            accessory="chevron"
            editable={false}
            label="Preferred role *"
            onChangeText={setPreferredRole}
            value={preferredRole}
          />
        </View>

        <View style={styles.lastFieldWrap}>
          <ProfileField label="Bio *" onChangeText={setBio} value={bio} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}