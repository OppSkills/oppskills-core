import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { lightTheme } from '../../../../shared/theme';
import { AppText, FlowScreenTemplate, InputField, SearchInput } from '../../../../shared/ui';
import introLogoImage from '../../../../../assets/splash-icon.png';

type OnboardingArtVariant = 'campus' | 'updates' | 'experience';

interface IntroScreenProps {
  readonly onStart: () => void;
  readonly onReturningUser: () => void;
}

export function IntroScreen({ onStart, onReturningUser }: IntroScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onStart, 1200);

    return () => {
      clearTimeout(timer);
    };
  }, [onStart]);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.introSafeArea}>
      <Pressable onPress={onStart} style={styles.introContent}>
        <Pressable hitSlop={10} onPress={onReturningUser} style={styles.introSkipButton}>
          <AppText colorToken="textInverse" style={styles.introSkipText} variant="label">
            Skip
          </AppText>
        </Pressable>
        <Image resizeMode="contain" source={introLogoImage} style={styles.introLogo} />
      </Pressable>
    </SafeAreaView>
  );
}

interface OnboardingScreenProps {
  readonly onNext: () => void;
  readonly onSkip: () => void;
}

export function OnboardingSevenScreen({ onNext, onSkip }: OnboardingScreenProps) {
  return (
    <OnboardingScreenLayout
      body="Explore hackathons, competitions, festivals, events, and communities from colleges across the country all in one place."
      ctaLabel="Next"
      onNext={onNext}
      onSkip={onSkip}
      step={1}
      title="Find What’s Happening on Campus"
      variant="campus"
    />
  );
}

export function OnboardingEightScreen({ onNext, onSkip }: OnboardingScreenProps) {
  return (
    <OnboardingScreenLayout
      body="Get real-time updates about upcoming opportunities and events so you never miss something worth participating in."
      ctaLabel="Next"
      onNext={onNext}
      onSkip={onSkip}
      step={2}
      title="Stay Updated with What Matters"
      variant="updates"
    />
  );
}

interface OnboardingNineScreenProps {
  readonly onGetStarted: () => void;
  readonly onSignIn: () => void;
}

export function OnboardingNineScreen({ onGetStarted, onSignIn }: OnboardingNineScreenProps) {
  return (
    <OnboardingScreenLayout
      body="Join events, build connections, and gain real-world experience beyond the classroom."
      ctaLabel="Get Started"
      onNext={onGetStarted}
      onSecondary={onSignIn}
      onSkip={onSignIn}
      step={3}
      title="Turn Opportunities into Experience"
      variant="experience"
    />
  );
}

interface OnboardingScreenLayoutProps {
  readonly step: 1 | 2 | 3;
  readonly title: string;
  readonly body: string;
  readonly ctaLabel: string;
  readonly variant: OnboardingArtVariant;
  readonly onNext: () => void;
  readonly onSkip: () => void;
  readonly onSecondary?: () => void;
}

function OnboardingScreenLayout({
  step,
  title,
  body,
  ctaLabel,
  variant,
  onNext,
  onSkip,
  onSecondary,
}: OnboardingScreenLayoutProps) {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.onboardingSafeArea}>
      <View style={styles.onboardingRoot}>
        <View style={styles.onboardingTopRow}>
          <AppText colorToken="textMuted" variant="caption">
            Step {step} of 3
          </AppText>
          <Pressable hitSlop={10} onPress={onSkip}>
            <AppText colorToken="textMuted" variant="caption">
              Skip
            </AppText>
          </Pressable>
        </View>

        <View style={styles.onboardingMainContent}>
          <AppText style={styles.onboardingTitle} variant="displayH2">
            {title}
          </AppText>
          <AppText colorToken="textSecondary" style={styles.onboardingBody} variant="body">
            {body}
          </AppText>

          <OnboardingIllustration variant={variant} />

          <View style={styles.paginationRow}>
            {[1, 2, 3].map((dotStep) => (
              <View
                key={dotStep}
                style={[styles.paginationDot, dotStep === step ? styles.paginationDotActive : null]}
              />
            ))}
          </View>
        </View>

        <View style={styles.onboardingActions}>
          <Pressable hitSlop={10} onPress={onSkip}>
            <AppText colorToken="brandPrimaryStrong" style={styles.skipToSignInText} variant="label">
              Skip to sign in
            </AppText>
          </Pressable>
          <Pressable onPress={onNext} style={styles.primaryCtaButton}>
            <AppText colorToken="textInverse" variant="bodyStrong">
              {ctaLabel}
            </AppText>
          </Pressable>
          {onSecondary ? (
            <Pressable hitSlop={10} onPress={onSecondary}>
              <AppText colorToken="brandPrimaryStrong" style={styles.secondaryTextAction} variant="label">
                Already have an account? Sign in
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

interface OnboardingIllustrationProps {
  readonly variant: OnboardingArtVariant;
}

function OnboardingIllustration({ variant }: OnboardingIllustrationProps) {
  return (
    <View style={styles.artBoard}>
      <View style={[styles.artBackdrop, variant === 'updates' ? styles.artBackdropBlue : null]} />
      <View style={[styles.artAccentOrb, variant === 'experience' ? styles.artAccentOrbShifted : null]} />

      {variant === 'campus' ? (
        <>
          <View style={styles.campusGround} />
          <View style={styles.campusBuildingMain} />
          <View style={styles.campusBuildingWing} />
          <View style={styles.campusRoad} />
          <View style={styles.campusNodeLeft} />
          <View style={styles.campusNodeRight} />
        </>
      ) : null}

      {variant === 'updates' ? (
        <>
          <View style={styles.updatesBrowser} />
          <View style={styles.updatesBar} />
          <View style={styles.updatesLineOne} />
          <View style={styles.updatesLineTwo} />
          <View style={styles.updatesLineThree} />
          <View style={styles.updatesPencil} />
        </>
      ) : null}

      {variant === 'experience' ? (
        <>
          <View style={styles.experienceDesk} />
          <View style={styles.experienceLaptop} />
          <View style={styles.experiencePersonHead} />
          <View style={styles.experiencePersonBody} />
          <View style={styles.experienceChatBubble} />
          <View style={styles.experienceSparkOne} />
          <View style={styles.experienceSparkTwo} />
        </>
      ) : null}
    </View>
  );
}

interface AuthStepScreenProps {
  readonly title: string;
  readonly subtitle: string;
  readonly routeLabel: string;
  readonly ctaLabel: string;
  readonly onContinue: () => void;
  readonly beforeActions?: React.ReactNode;
  readonly errorMessage?: string | undefined;
  readonly secondaryLabel?: string;
  readonly onSecondary?: () => void;
  readonly children?: React.ReactNode;
}

function AuthStepScreen({
  title,
  subtitle,
  routeLabel,
  ctaLabel,
  onContinue,
  beforeActions,
  errorMessage,
  secondaryLabel,
  onSecondary,
  children,
}: AuthStepScreenProps) {
  const actions = [{ label: ctaLabel, onPress: onContinue }] as Array<{
    readonly label: string;
    readonly onPress: () => void;
    readonly tone?: 'primary' | 'secondary' | 'outline';
  }>;

  if (secondaryLabel && onSecondary) {
    actions.push({ label: secondaryLabel, onPress: onSecondary, tone: 'outline' });
  }

  return (
    <FlowScreenTemplate actions={actions} routeLabel={routeLabel} showFooter={false} subtitle={subtitle} title={title}>
      <View style={styles.formBlock}>{children}</View>
      {errorMessage ? (
        <AppText colorToken="danger" style={styles.errorText} variant="caption">
          {errorMessage}
        </AppText>
      ) : null}
      {beforeActions}
    </FlowScreenTemplate>
  );
}

interface SignUpScreenProps {
  readonly initialEmail?: string;
  readonly onContinue: (email: string) => void;
  readonly onGoogleContinue: () => void;
  readonly onSignIn: () => void;
}

export function SignUpScreen({ initialEmail = '', onContinue, onGoogleContinue, onSignIn }: SignUpScreenProps) {
  const [email, setEmail] = useState(initialEmail);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const submit = () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setErrorMessage('Email is required to continue.');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setErrorMessage('Enter a valid email address.');
      return;
    }

    setErrorMessage(undefined);
    onContinue(normalizedEmail);
  };

  return (
    <AuthStepScreen
      ctaLabel="Continue"
      errorMessage={errorMessage}
      onContinue={submit}
      onSecondary={onSignIn}
      routeLabel="Auth / Sign Up"
      secondaryLabel="Already have an account? Sign in"
      subtitle="Register now to take part in all the events."
      title="Sign Up"
      beforeActions={
        <View style={styles.socialAuthBlock}>
          <AppText colorToken="textMuted" style={styles.orText} variant="caption">
            Or
          </AppText>
          <Pressable onPress={onGoogleContinue} style={styles.googleButton}>
            <AppText colorToken="brandPrimaryStrong" variant="bodyStrong">
              Continue with Google
            </AppText>
          </Pressable>
        </View>
      }
    >
      <InputField
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        label="Email"
        onChangeText={setEmail}
        placeholder="Email address"
        value={email}
      />
    </AuthStepScreen>
  );
}

interface VerifyIdentityScreenProps {
  readonly email: string;
  readonly initialOtp?: string;
  readonly onContinue: (otp: string) => void;
  readonly filled?: boolean;
}

export function VerifyIdentityScreen({
  email,
  initialOtp = '',
  onContinue,
  filled = false,
}: VerifyIdentityScreenProps) {
  const [otp, setOtp] = useState(initialOtp);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const submit = () => {
    const normalizedOtp = otp.trim();

    if (!isValidOtp(normalizedOtp)) {
      setErrorMessage('Enter a valid 6-digit OTP.');
      return;
    }

    setErrorMessage(undefined);
    onContinue(normalizedOtp);
  };

  return (
    <AuthStepScreen
      ctaLabel={filled ? 'Continue to profile setup' : 'Verify code'}
      errorMessage={errorMessage}
      onContinue={submit}
      routeLabel={filled ? 'Auth / Verify OTP Filled' : 'Auth / Verify OTP Empty'}
      subtitle="We have sent an email with your code."
      title="Verify your identity"
    >
      <InputField editable={false} label="Email" value={email} />
      <InputField
        autoCapitalize="none"
        keyboardType="number-pad"
        containerStyle={styles.inputSpacing}
        label="OTP"
        onChangeText={setOtp}
        placeholder="Enter OTP"
        value={otp}
      />
    </AuthStepScreen>
  );
}

export interface MockProfilePersonalInput {
  readonly fullName: string;
  readonly password: string;
  readonly phoneNumber: string;
}

interface ProfileSetupPersonalScreenProps {
  readonly initialValues: MockProfilePersonalInput;
  readonly onContinue: (values: MockProfilePersonalInput) => void;
}

export function ProfileSetupPersonalScreen({ initialValues, onContinue }: ProfileSetupPersonalScreenProps) {
  const [fullName, setFullName] = useState(initialValues.fullName);
  const [password, setPassword] = useState(initialValues.password);
  const [phoneNumber, setPhoneNumber] = useState(initialValues.phoneNumber);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const submit = () => {
    if (!fullName.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }

    if (password.trim().length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      setErrorMessage('Enter a valid phone number.');
      return;
    }

    setErrorMessage(undefined);
    onContinue({
      fullName: fullName.trim(),
      password: password.trim(),
      phoneNumber: normalizeDigits(phoneNumber),
    });
  };

  return (
    <AuthStepScreen
      ctaLabel="Continue"
      errorMessage={errorMessage}
      onContinue={submit}
      routeLabel="Auth / Profile Personal"
      subtitle="Just a quick introduction and we are good to go."
      title="You are new here"
    >
      <InputField label="Full name" onChangeText={setFullName} placeholder="Enter full name" value={fullName} />
      <InputField
        containerStyle={styles.inputSpacing}
        label="Password"
        onChangeText={setPassword}
        placeholder="Create password"
        secureTextEntry
        value={password}
      />
      <InputField
        containerStyle={styles.inputSpacing}
        keyboardType="phone-pad"
        label="Phone number"
        onChangeText={setPhoneNumber}
        placeholder="Enter phone"
        value={phoneNumber}
      />
    </AuthStepScreen>
  );
}

export interface MockProfileEducationInput {
  readonly college: string;
  readonly course: string;
  readonly specialization: string;
  readonly startYear: string;
  readonly endYear: string;
  readonly gender: string;
  readonly rollNumber: string;
}

interface ProfileSetupEducationScreenProps {
  readonly initialValues: MockProfileEducationInput;
  readonly onContinue: (values: MockProfileEducationInput) => void;
}

export function ProfileSetupEducationScreen({ initialValues, onContinue }: ProfileSetupEducationScreenProps) {
  const [college, setCollege] = useState(initialValues.college);
  const [course, setCourse] = useState(initialValues.course);
  const [specialization, setSpecialization] = useState(initialValues.specialization);
  const [startYear, setStartYear] = useState(initialValues.startYear);
  const [endYear, setEndYear] = useState(initialValues.endYear);
  const [gender, setGender] = useState(initialValues.gender);
  const [rollNumber, setRollNumber] = useState(initialValues.rollNumber);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const submit = () => {
    if (!college.trim() || !course.trim() || !specialization.trim()) {
      setErrorMessage('College, course, and specialization are required.');
      return;
    }

    if (!isValidYear(startYear) || !isValidYear(endYear) || Number(startYear) > Number(endYear)) {
      setErrorMessage('Enter valid start and end years.');
      return;
    }

    if (!gender.trim() || !rollNumber.trim()) {
      setErrorMessage('Gender and roll number are required.');
      return;
    }

    setErrorMessage(undefined);
    onContinue({
      college: college.trim(),
      course: course.trim(),
      specialization: specialization.trim(),
      startYear: startYear.trim(),
      endYear: endYear.trim(),
      gender: gender.trim(),
      rollNumber: rollNumber.trim(),
    });
  };

  return (
    <AuthStepScreen
      ctaLabel="Continue"
      errorMessage={errorMessage}
      onContinue={submit}
      routeLabel="Auth / Profile Education"
      subtitle="Just a quick introduction and we are good to go."
      title="Education Info"
    >
      <InputField
        label="College"
        onChangeText={setCollege}
        placeholder="College/University name"
        value={college}
      />
      <InputField containerStyle={styles.inputSpacing} label="Course" onChangeText={setCourse} placeholder="B.Tech" value={course} />
      <InputField
        containerStyle={styles.inputSpacing}
        label="Specialization"
        onChangeText={setSpecialization}
        placeholder="CSE"
        value={specialization}
      />
      <View style={styles.inlineFieldsRow}>
        <InputField
          containerStyle={styles.inlineField}
          keyboardType="number-pad"
          label="Start year"
          onChangeText={setStartYear}
          placeholder="2022"
          value={startYear}
        />
        <InputField
          containerStyle={styles.inlineField}
          keyboardType="number-pad"
          label="End year"
          onChangeText={setEndYear}
          placeholder="2026"
          value={endYear}
        />
      </View>
      <View style={styles.inlineFieldsRow}>
        <InputField
          containerStyle={styles.inlineField}
          label="Gender"
          onChangeText={setGender}
          placeholder="Male"
          value={gender}
        />
        <InputField
          containerStyle={styles.inlineField}
          label="Roll number"
          onChangeText={setRollNumber}
          placeholder="2026"
          value={rollNumber}
        />
      </View>
    </AuthStepScreen>
  );
}

interface ProfileSetupSkillsScreenProps {
  readonly initialSkills: readonly string[];
  readonly onContinue: (skills: readonly string[]) => void;
  readonly onSkip: () => void;
}

const suggestedSkills = [
  'Organizers',
  'Frontend',
  'Backend',
  'Design',
  'Data Science',
  'Content',
  'Operations',
] as const;

export function ProfileSetupSkillsScreen({ initialSkills, onContinue, onSkip }: ProfileSetupSkillsScreenProps) {
  const [query, setQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<readonly string[]>(initialSkills);

  const filteredSkills = suggestedSkills.filter((skill) => skill.toLowerCase().includes(query.trim().toLowerCase()));

  const toggleSkill = (skill: string) => {
    setSelectedSkills((currentSkills) =>
      currentSkills.includes(skill)
        ? currentSkills.filter((existingSkill) => existingSkill !== skill)
        : [...currentSkills, skill],
    );
  };

  return (
    <AuthStepScreen
      ctaLabel="Continue"
      onContinue={() => onContinue(selectedSkills)}
      onSecondary={onSkip}
      routeLabel="Auth / Profile Skills"
      secondaryLabel="Skip"
      subtitle="Skills are captured as mock tags and can later map to backend profiles."
      title="Skills Info"
    >
      <SearchInput onChangeText={setQuery} value={query} />
      <View style={styles.chipsRow}>
        {filteredSkills.map((chip) => (
          <Pressable
            key={chip}
            onPress={() => toggleSkill(chip)}
            style={[styles.chip, selectedSkills.includes(chip) ? styles.chipSelected : null]}
          >
            <AppText colorToken={selectedSkills.includes(chip) ? 'textInverse' : 'brandPrimaryStrong'} variant="caption">
              {chip}
            </AppText>
          </Pressable>
        ))}
      </View>
    </AuthStepScreen>
  );
}

interface SignInScreenProps {
  readonly initialEmail?: string;
  readonly expectedPassword?: string | undefined;
  readonly onContinue: (payload: { readonly email: string; readonly password: string }) => void;
  readonly onGoogleContinue: () => void;
  readonly onSignUp: () => void;
}

export function SignInScreen({
  initialEmail = '',
  expectedPassword,
  onContinue,
  onGoogleContinue,
  onSignUp,
}: SignInScreenProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const submit = () => {
    const normalizedEmail = email.trim();

    if (!isValidEmail(normalizedEmail)) {
      setErrorMessage('Enter a valid email address to sign in.');
      return;
    }

    if (password.trim().length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (expectedPassword && password.trim() !== expectedPassword) {
      setErrorMessage('Password does not match your mock profile setup.');
      return;
    }

    setErrorMessage(undefined);
    onContinue({ email: normalizedEmail, password: password.trim() });
  };

  return (
    <AuthStepScreen
      ctaLabel="Sign in"
      errorMessage={errorMessage}
      onContinue={submit}
      onSecondary={onSignUp}
      routeLabel="Auth / Sign In"
      secondaryLabel="Need an account? Sign up"
      subtitle="Sign in to continue your OppSkills journey."
      title="Sign In"
      beforeActions={
        <View style={styles.socialAuthBlock}>
          <AppText colorToken="textMuted" style={styles.orText} variant="caption">
            Or
          </AppText>
          <Pressable onPress={onGoogleContinue} style={styles.googleButton}>
            <AppText colorToken="brandPrimaryStrong" variant="bodyStrong">
              Continue with Google
            </AppText>
          </Pressable>
        </View>
      }
    >
      <InputField
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        label="Email"
        onChangeText={setEmail}
        placeholder="Email address"
        value={email}
      />
      <InputField
        containerStyle={styles.inputSpacing}
        label="Password"
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        value={password}
      />
    </AuthStepScreen>
  );
}

function isValidEmail(value: string): boolean {
  return /\S+@\S+\.\S+/.test(value);
}

function normalizeDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function isValidPhoneNumber(value: string): boolean {
  const normalizedDigits = normalizeDigits(value);
  return normalizedDigits.length >= 10;
}

function isValidOtp(value: string): boolean {
  return /^\d{6}$/.test(value);
}

function isValidYear(value: string): boolean {
  return /^\d{4}$/.test(value);
}

const styles = StyleSheet.create({
  artAccentOrb: {
    backgroundColor: '#E4D7FF',
    borderRadius: 70,
    height: 140,
    position: 'absolute',
    right: 12,
    top: 58,
    width: 140,
  },
  artAccentOrbShifted: {
    right: 24,
    top: 74,
  },
  artBackdrop: {
    backgroundColor: '#EEE8FB',
    borderRadius: lightTheme.radius.xl,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 46,
  },
  artBackdropBlue: {
    backgroundColor: '#E8EDFF',
  },
  artBoard: {
    alignSelf: 'center',
    height: 300,
    marginTop: lightTheme.spacing[12],
    width: '100%',
  },
  campusBuildingMain: {
    backgroundColor: lightTheme.colors.surfacePrimary,
    borderColor: '#D0C6E8',
    borderRadius: lightTheme.radius.md,
    borderWidth: 1,
    height: 120,
    left: 40,
    position: 'absolute',
    top: 90,
    width: 140,
  },
  campusBuildingWing: {
    backgroundColor: '#D7CBF4',
    borderRadius: lightTheme.radius.md,
    height: 92,
    left: 150,
    position: 'absolute',
    top: 120,
    width: 120,
  },
  campusGround: {
    backgroundColor: '#D8CCF8',
    borderRadius: 999,
    bottom: 30,
    height: 88,
    left: 30,
    position: 'absolute',
    width: 260,
  },
  campusNodeLeft: {
    backgroundColor: lightTheme.colors.brandPrimary,
    borderRadius: 10,
    height: 20,
    left: 30,
    position: 'absolute',
    top: 220,
    width: 20,
  },
  campusNodeRight: {
    backgroundColor: lightTheme.colors.brandPrimary,
    borderRadius: 10,
    height: 20,
    left: 262,
    position: 'absolute',
    top: 186,
    width: 20,
  },
  campusRoad: {
    backgroundColor: '#A78ADA',
    borderRadius: lightTheme.radius.xs,
    height: 52,
    left: 90,
    position: 'absolute',
    top: 182,
    transform: [{ rotate: '-22deg' }],
    width: 120,
  },
  chip: {
    backgroundColor: lightTheme.colors.backgroundSecondary,
    borderColor: lightTheme.colors.focusRing,
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    marginBottom: lightTheme.spacing[8],
    marginRight: lightTheme.spacing[8],
    paddingHorizontal: lightTheme.spacing[10],
    paddingVertical: lightTheme.spacing[6],
  },
  chipSelected: {
    backgroundColor: lightTheme.colors.brandPrimaryStrong,
    borderColor: lightTheme.colors.brandPrimaryStrong,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: lightTheme.spacing[12],
  },
  errorText: {
    marginTop: lightTheme.spacing[12],
  },
  experienceChatBubble: {
    backgroundColor: '#EEE8FB',
    borderRadius: lightTheme.radius.md,
    height: 26,
    position: 'absolute',
    right: 56,
    top: 94,
    width: 44,
  },
  experienceDesk: {
    backgroundColor: '#D9CEF4',
    borderRadius: lightTheme.radius.lg,
    height: 130,
    left: 36,
    position: 'absolute',
    top: 134,
    transform: [{ rotate: '-10deg' }],
    width: 248,
  },
  experienceLaptop: {
    backgroundColor: '#A489D8',
    borderRadius: lightTheme.radius.sm,
    height: 54,
    position: 'absolute',
    right: 82,
    top: 150,
    width: 100,
  },
  experiencePersonBody: {
    backgroundColor: '#6E55B3',
    borderRadius: lightTheme.radius.lg,
    height: 76,
    position: 'absolute',
    right: 126,
    top: 118,
    width: 40,
  },
  experiencePersonHead: {
    backgroundColor: '#3A2C66',
    borderRadius: 18,
    height: 36,
    position: 'absolute',
    right: 130,
    top: 92,
    width: 36,
  },
  experienceSparkOne: {
    backgroundColor: lightTheme.colors.brandPrimary,
    borderRadius: 4,
    height: 8,
    left: 48,
    position: 'absolute',
    top: 108,
    width: 8,
  },
  experienceSparkTwo: {
    backgroundColor: lightTheme.colors.brandPrimary,
    borderRadius: 5,
    height: 10,
    left: 68,
    position: 'absolute',
    top: 82,
    width: 10,
  },
  formBlock: {
    marginTop: lightTheme.spacing[4],
  },
  inputSpacing: {
    marginTop: lightTheme.spacing[12],
  },
  inlineField: {
    flex: 1,
  },
  inlineFieldsRow: {
    columnGap: lightTheme.spacing[12],
    flexDirection: 'row',
    marginTop: lightTheme.spacing[12],
  },
  introContent: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  introLogo: {
    alignSelf: 'center',
    height: 210,
    width: 280,
  },
  introSafeArea: {
    backgroundColor: lightTheme.colors.brandPrimary,
    flex: 1,
  },
  introSkipButton: {
    position: 'absolute',
    right: 24,
    top: 10,
  },
  introSkipText: {
    opacity: 0.9,
  },
  onboardingActions: {
    alignItems: 'center',
    gap: lightTheme.spacing[10],
    marginTop: lightTheme.spacing[12],
  },
  onboardingBody: {
    marginTop: lightTheme.spacing[16],
    textAlign: 'center',
  },
  onboardingMainContent: {
    flex: 1,
    marginTop: lightTheme.spacing[20],
  },
  onboardingRoot: {
    backgroundColor: lightTheme.colors.backgroundPrimary,
    flex: 1,
    paddingHorizontal: lightTheme.spacing[20],
    paddingTop: lightTheme.spacing[4],
    paddingBottom: lightTheme.spacing[24],
  },
  onboardingSafeArea: {
    backgroundColor: lightTheme.colors.backgroundPrimary,
    flex: 1,
  },
  onboardingTitle: {
    marginTop: lightTheme.spacing[20],
    textAlign: 'center',
  },
  onboardingTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paginationDot: {
    backgroundColor: '#D8CCF8',
    borderRadius: 4,
    height: 8,
    width: 22,
  },
  paginationDotActive: {
    backgroundColor: lightTheme.colors.brandPrimaryStrong,
    width: 30,
  },
  paginationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: lightTheme.spacing[8],
    justifyContent: 'center',
    marginTop: lightTheme.spacing[16],
  },
  googleButton: {
    alignItems: 'center',
    borderColor: lightTheme.colors.focusRing,
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: lightTheme.spacing[16],
    width: '100%',
  },
  orText: {
    textAlign: 'center',
  },
  primaryCtaButton: {
    alignItems: 'center',
    backgroundColor: lightTheme.colors.brandPrimaryStrong,
    borderRadius: lightTheme.radius.pill,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: lightTheme.spacing[24],
    width: '100%',
  },
  secondaryTextAction: {
    textAlign: 'center',
  },
  skipToSignInText: {
    opacity: 0.88,
  },
  socialAuthBlock: {
    marginTop: lightTheme.spacing[12],
    rowGap: lightTheme.spacing[10],
  },
  updatesBar: {
    backgroundColor: '#AD95E1',
    borderRadius: lightTheme.radius.pill,
    height: 10,
    left: 84,
    position: 'absolute',
    top: 112,
    width: 136,
  },
  updatesBrowser: {
    backgroundColor: lightTheme.colors.surfacePrimary,
    borderColor: '#D0C6E8',
    borderRadius: lightTheme.radius.lg,
    borderWidth: 1,
    height: 178,
    left: 60,
    position: 'absolute',
    top: 82,
    width: 190,
  },
  updatesLineOne: {
    backgroundColor: '#CEC1EE',
    borderRadius: lightTheme.radius.pill,
    height: 10,
    left: 86,
    position: 'absolute',
    top: 142,
    width: 108,
  },
  updatesLineThree: {
    backgroundColor: '#CEC1EE',
    borderRadius: lightTheme.radius.pill,
    height: 10,
    left: 86,
    position: 'absolute',
    top: 202,
    width: 88,
  },
  updatesLineTwo: {
    backgroundColor: '#CEC1EE',
    borderRadius: lightTheme.radius.pill,
    height: 10,
    left: 86,
    position: 'absolute',
    top: 172,
    width: 130,
  },
  updatesPencil: {
    backgroundColor: lightTheme.colors.brandPrimaryStrong,
    borderRadius: lightTheme.radius.pill,
    height: 14,
    position: 'absolute',
    right: 56,
    top: 244,
    transform: [{ rotate: '-20deg' }],
    width: 72,
  },
});
