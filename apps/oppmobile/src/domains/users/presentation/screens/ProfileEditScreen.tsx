import { Feather } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { Pressable, ScrollView, TextInput, View, ActivityIndicator } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAppSession } from '../../../../shared/auth/useAppSession';
import { apiClient } from '../../../../shared/api/apiClient';
import { useCurrentUser } from '../hooks/useCurrentUser';
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

// We no longer use a fallback profile to avoid showing fake data.
function formatPhoneLabel(rawPhone?: string | null): string {
  if (!rawPhone) return '';
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
  const session = useAppSession();
  const { data: currentUser, isLoading } = useCurrentUser();

  const queryClient = useQueryClient();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [course, setCourse] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [college, setCollege] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [gender, setGender] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [skills, setSkills] = useState('');
  const [preferredRole, setPreferredRole] = useState('');
  const [bio, setBio] = useState('');
  const [locationCity, setLocationCity] = useState('India');
  const [locationState, setLocationState] = useState('India');
  const [locationCountry, setLocationCountry] = useState('India');

  useEffect(() => {
    if (currentUser) {
      const p = currentUser.onboardingProfile;
      setEmail(currentUser.email || session.userEmail || '');
      setFullName(`${currentUser.firstName ?? ''} ${currentUser.lastName ?? ''}`.trim());
      
      if (p) {
        if (p.gender) setGender(p.gender);
        if (p.college?.name) setCollege(p.college.name);
        else if (p.schoolName) setCollege(p.schoolName);
        else if (p.companyName) setCollege(p.companyName);

        if (p.course) setCourse(p.course);
        if (p.specialization) setSpecialization(p.specialization);
        if (p.rollNumber) setRollNumber(p.rollNumber);
        if (p.collegeCurrentYear) setStartYear(p.collegeCurrentYear);
        if (p.collegePassoutYear) setEndYear(String(p.collegePassoutYear));
        if (p.locationCity) setLocationCity(p.locationCity);
        if (p.locationState) setLocationState(p.locationState);
        if (p.locationCountry) setLocationCountry(p.locationCountry);
        if (p.skills && p.skills.length > 0) setSkills(p.skills.join(', '));
        if (p.jobTitle) setPreferredRole(p.jobTitle);
      }
    }
  }, [currentUser, session.userEmail]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const genderMap: Record<string, string> = {
        'Female': 'FEMALE', 'FEMALE': 'FEMALE',
        'Male': 'MALE', 'MALE': 'MALE',
        'Rather not to say': 'OTHER', 'OTHER': 'OTHER',
      };
      const payload = {
        gender: genderMap[gender] ?? 'OTHER',
        userCategory: 'COLLEGE_STUDENT',
        collegeName: college || null,
        collegeSkipped: !college,
        collegeCurrentYear: startYear || null,
        collegePassoutYear: endYear ? (parseInt(endYear, 10) || null) : null,
        course: course || null,
        specialization: specialization || null,
        rollNumber: rollNumber || null,
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
        jobTitle: preferredRole || null,
        locationCity: locationCity || 'India',
        locationState: locationState || 'India',
        locationCountry: locationCountry || 'India',
      };
      
      return apiClient.put('/user-accounts/onboarding', payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      onBack();
    },
    onError: (err) => {
      console.error('Failed to save profile', err);
    }
  });

  if (isLoading) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator>
        <View style={styles.headerRow}>
          <Pressable accessibilityLabel="Go back" hitSlop={8} onPress={onBack} style={styles.backButton}>
            <AppText style={styles.backButtonText} variant="title">
              {'<'}
            </AppText>
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <AppText style={styles.headerTitle} variant="title">
              My Profile
            </AppText>
          </View>

          <Pressable 
            accessibilityLabel="Save profile" 
            hitSlop={8} 
            onPress={() => saveMutation.mutate()} 
            style={[styles.saveButton, saveMutation.isPending && { opacity: 0.5 }]}
            disabled={saveMutation.isPending}
          >
            <AppText style={styles.saveButtonText} variant="bodyStrong">
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </AppText>
          </Pressable>
        </View>

        <View style={styles.avatarWrap}>
          <Pressable accessibilityLabel="Edit profile picture" style={styles.avatarEditBadge}>
            <Feather color="#584D5A" name="edit-2" size={14} />
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