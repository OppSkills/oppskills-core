import { useEffect, useMemo, useState } from 'react';
import { useSignIn, useSignUp, useUser } from '@clerk/clerk-expo';
import { Image, type ImageSourcePropType, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../../../shared/ui';
import onboardingCampusImage from '../../../../../assets/college campus-amico 1.png';
import onboardingExperienceImage from '../../../../../assets/Learning-amico 1.png';
import onboardingUpdatesImage from '../../../../../assets/Status update-amico 1.png';
import introLogoImage from '../../../../../assets/OppSkill_Logo_UP_6 1.png';
import { styles } from './OnboardingAuthScreens.styles';

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
  const isHeroLayout = variant === 'campus' || variant === 'updates' || variant === 'experience';

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.onboardingSafeArea}>
      <View style={[styles.onboardingRoot, isHeroLayout ? styles.onboardingRootCampus : null]}>
        {isHeroLayout ? (
          <View style={[styles.onboardingTopRow, styles.onboardingTopRowCampus]}>
            <Pressable hitSlop={10} onPress={onSkip}>
              <AppText colorToken="textMuted" variant="caption">
                Skip
              </AppText>
            </Pressable>
          </View>
        ) : (
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
        )}

        <View style={[styles.onboardingMainContent, isHeroLayout ? styles.onboardingMainContentCampus : null]}>
          <AppText style={[styles.onboardingTitle, isHeroLayout ? styles.onboardingTitleCampus : null]} variant="displayH2">
            {title}
          </AppText>

          <OnboardingIllustration
            imageSource={
              variant === 'campus'
                ? onboardingCampusImage
                : variant === 'updates'
                  ? onboardingUpdatesImage
                  : variant === 'experience'
                    ? onboardingExperienceImage
                  : undefined
            }
            style={isHeroLayout ? styles.artBoardCampus : undefined}
            variant={variant}
          />

          <AppText
            colorToken="textSecondary"
            style={[styles.onboardingBody, isHeroLayout ? styles.onboardingBodyCampus : null]}
            variant="body"
          >
            {body}
          </AppText>

          {isHeroLayout ? null : (
            <View style={styles.paginationRow}>
              {[1, 2, 3].map((dotStep) => (
                <View
                  key={dotStep}
                  style={[styles.paginationDot, dotStep === step ? styles.paginationDotActive : null]}
                />
              ))}
            </View>
          )}
        </View>

        <View style={[styles.onboardingActions, isHeroLayout ? styles.onboardingActionsCampus : null]}>
          {isHeroLayout ? null : (
            <Pressable hitSlop={10} onPress={onSkip}>
              <AppText colorToken="brandPrimaryStrong" style={styles.skipToSignInText} variant="label">
                Skip to sign in
              </AppText>
            </Pressable>
          )}
          <Pressable onPress={onNext} style={[styles.primaryCtaButton, isHeroLayout ? styles.primaryCtaButtonCampus : null]}>
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
  readonly style?: object | undefined;
  readonly imageSource?: ImageSourcePropType | undefined;
}

function OnboardingIllustration({ variant, style, imageSource }: OnboardingIllustrationProps) {
  if (imageSource) {
    return <Image resizeMode="contain" source={imageSource} style={[styles.artBoard, style]} />;
  }

  return (
    <View style={[styles.artBoard, style]}>
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

interface SignUpScreenProps {
  readonly initialEmail?: string;
  readonly onContinue: (email: string) => void;
  readonly onGoogleContinue: () => void;
  readonly onSignIn: () => void;
}

export function SignUpScreen({ initialEmail = '', onContinue, onGoogleContinue, onSignIn }: SignUpScreenProps) {
  const [email, setEmail] = useState(initialEmail);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isLoaded, signUp } = useSignUp();

  const submit = async () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setErrorMessage('Email is required to continue.');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setErrorMessage('Enter a valid email address.');
      return;
    }

    if (!isLoaded || !signUp) {
      setErrorMessage('Auth is not ready yet.');
      return;
    }

    setErrorMessage(undefined);
    setIsSubmitting(true);
    try {
      await signUp.create({ emailAddress: normalizedEmail });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setIsSubmitting(false);
      onContinue(normalizedEmail);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.errors?.[0]?.message || 'Sign up failed. Please try again.');
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.signUpSafeArea}>
      <View style={styles.signUpRoot}>
        <View style={styles.signUpContent}>
          <View style={styles.signUpMetaRow}>
            <AppText style={styles.signUpStepText} variant="bodyStrong">
              Step 1 of 4
            </AppText>
            <Pressable hitSlop={10} onPress={onSignIn}>
              <AppText colorToken="textMuted" style={styles.signUpSkipText} variant="bodyStrong">
                Skip
              </AppText>
            </Pressable>
          </View>

          <AppText style={styles.signUpHeading} variant="displayH1">
            Sign Up
          </AppText>
          <AppText colorToken="textMuted" style={styles.signUpSubHeading} variant="body">
            Register now to take part in all the events
          </AppText>

          <Pressable onPress={onGoogleContinue} style={styles.signUpGoogleButton}>
            <View style={styles.googleGlyph}>
              <View style={styles.googleGlyphRing} />
              <View style={styles.googleGlyphCutout} />
              <View style={styles.googleGlyphBar} />
            </View>
            <AppText colorToken="brandSecondary" style={styles.signUpGoogleText} variant="bodyStrong">
              Continue with Google
            </AppText>
          </Pressable>

          <View style={styles.signUpDividerRow}>
            <View style={styles.signUpDividerLine} />
            <View style={styles.signUpOrChip}>
              <AppText style={styles.signUpOrText} variant="body">
                Or
              </AppText>
            </View>
          </View>

          <View style={styles.signUpInputWrap}>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Email address *"
              placeholderTextColor="#7C737E"
              style={styles.signUpInput}
              value={email}
            />
          </View>

          {errorMessage ? (
            <AppText colorToken="danger" style={styles.signUpErrorText} variant="caption">
              {errorMessage}
            </AppText>
          ) : null}
        </View>

        <View style={styles.signUpBottomActions}>
          <Pressable disabled={isSubmitting} onPress={submit} style={styles.signUpNextButton}>
            <ArrowIcon color="#FFFFFF" direction="left" />
            <AppText colorToken="textInverse" style={styles.signUpNextText} variant="bodyStrong">
              {isSubmitting ? 'Loading...' : 'Next'}
            </AppText>
            <ArrowIcon color="#FFFFFF" direction="right" />
          </Pressable>

          <Pressable hitSlop={10} onPress={onSignIn} style={styles.signUpSignInButton}>
            <AppText colorToken="brandSecondary" style={styles.signUpSignInText} variant="bodyStrong">
              Already have an account? Sign in
            </AppText>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

interface ArrowIconProps {
  readonly color: string;
  readonly direction: 'left' | 'right';
}

function ArrowIcon({ color, direction }: ArrowIconProps) {
  return (
    <View
      style={[
        styles.arrowIcon,
        {
          borderBottomColor: color,
          borderLeftColor: color,
          transform: [{ rotate: direction === 'right' ? '-135deg' : '45deg' }],
        },
      ]}
    />
  );
}

interface VerifyIdentityScreenProps {
  readonly email: string;
  readonly initialOtp?: string;
  readonly onContinue: (otp: string) => void;
  readonly onSkip?: () => void;
  readonly filled?: boolean;
}

export function VerifyIdentityScreen({
  email,
  initialOtp = '',
  onContinue,
  onSkip,
  filled: _filled = false,
}: VerifyIdentityScreenProps) {
  const [otp, setOtp] = useState(initialOtp);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isLoaded, signUp } = useSignUp();

  const submit = async () => {
    const normalizedOtp = otp.trim();

    if (!isValidOtp(normalizedOtp)) {
      setErrorMessage('Enter a valid 6-digit OTP.');
      return;
    }

    if (!isLoaded || !signUp) {
      setErrorMessage('Auth is not ready yet.');
      return;
    }

    setErrorMessage(undefined);
    setIsSubmitting(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code: normalizedOtp });
      setIsSubmitting(false);
      // Status isn't complete yet because we need password/name next
      if (completeSignUp.status !== 'complete') {
        onContinue(normalizedOtp);
      } else {
        onContinue(normalizedOtp);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.errors?.[0]?.message || 'Invalid OTP. Please try again.');
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.verifySafeArea}>
      <View style={styles.verifyRoot}>
        <View style={styles.verifyContent}>
          <View style={styles.verifyMetaRow}>
            <AppText style={styles.verifyStepText} variant="bodyStrong">
              Step 1 of 4
            </AppText>
            {onSkip ? (
              <Pressable hitSlop={10} onPress={onSkip}>
                <AppText colorToken="textMuted" style={styles.verifySkipText} variant="bodyStrong">
                  Skip
                </AppText>
              </Pressable>
            ) : null}
          </View>

          <AppText style={styles.verifyHeading} variant="displayH1">
            Verify your identity
          </AppText>

          <AppText colorToken="textMuted" style={styles.verifySubHeading} variant="body">
            We've sent an email with your code to: {email}
          </AppText>

          <View style={styles.verifyFieldWrap}>
            <View style={[styles.verifyFieldContainer, styles.verifyFieldEmailContainer]}>
              <TextInput
                editable={false}
                placeholderTextColor="#342636"
                style={[styles.verifyFieldInput, styles.verifyFieldEmailInput]}
                value={email}
              />
              <View style={[styles.verifyFloatingChip, styles.verifyFloatingChipWide]}>
                <AppText style={styles.verifyFloatingChipText} variant="micro">
                  Email address *
                </AppText>
              </View>
            </View>

            <View style={[styles.verifyFieldContainer, styles.verifyFieldOtpContainer]}>
              <TextInput
                autoCapitalize="none"
                keyboardType="number-pad"
                onChangeText={setOtp}
                placeholder=""
                placeholderTextColor="#342636"
                style={styles.verifyFieldInput}
                value={otp}
              />
              <View style={[styles.verifyFloatingChip, styles.verifyFloatingChipNarrow]}>
                <AppText style={styles.verifyFloatingChipText} variant="micro">
                  OTP
                </AppText>
              </View>
            </View>
          </View>

          {errorMessage ? (
            <AppText colorToken="danger" style={styles.verifyErrorText} variant="caption">
              {errorMessage}
            </AppText>
          ) : null}
        </View>

        <View style={styles.verifyBottomActions}>
          <Pressable disabled={isSubmitting} onPress={submit} style={styles.verifyNextButton}>
            <ArrowIcon color="#FFFFFF" direction="left" />
            <AppText colorToken="textInverse" style={styles.verifyNextText} variant="bodyStrong">
              {isSubmitting ? 'Loading...' : 'Next'}
            </AppText>
            <ArrowIcon color="#FFFFFF" direction="right" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
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
  readonly onSkip?: () => void;
}

export function ProfileSetupPersonalScreen({ initialValues, onContinue, onSkip }: ProfileSetupPersonalScreenProps) {
  const [fullName, setFullName] = useState(initialValues.fullName);
  const [password, setPassword] = useState(initialValues.password);
  const [phoneNumber, setPhoneNumber] = useState(initialValues.phoneNumber);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isLoaded, signUp, setActive } = useSignUp();
  const { user } = useUser();

  const submit = async () => {
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

    if (!isLoaded || !signUp || !setActive) {
      setErrorMessage('Auth is not ready yet.');
      return;
    }

    setErrorMessage(undefined);
    setIsSubmitting(true);
    const payload = {
      fullName: fullName.trim(),
      password: password.trim(),
      phoneNumber: normalizeDigits(phoneNumber),
    };

    try {
      const [firstName, ...rest] = payload.fullName.split(' ');
      const lastName = rest.join(' ');
      
      if (user) {
        await user.update({
          firstName,
          lastName: lastName || '.',
          unsafeMetadata: { phone: payload.phoneNumber },
        });
        setIsSubmitting(false);
        onContinue(payload);
        return;
      }

      const updatedSignUp = await signUp.update({
        firstName: firstName,
        lastName: lastName || '.',
        password: payload.password,
        unsafeMetadata: {
          phone: payload.phoneNumber,
        },
      });

      setIsSubmitting(false);
      if (updatedSignUp.status === 'complete') {
        if (updatedSignUp.createdSessionId) {
          await setActive({ session: updatedSignUp.createdSessionId });
        }
        onContinue(payload);
      } else {
        const missing = updatedSignUp.missingFields?.join(', ') || '';
        const unverified = updatedSignUp.unverifiedFields?.join(', ') || '';
        setErrorMessage(`Need more info. Missing: ${missing}. Unverified: ${unverified}. Status: ${updatedSignUp.status}`);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.errors?.[0]?.message || 'Failed to update profile details.');
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.detailsSafeArea}>
      <View style={styles.detailsRoot}>
        <View style={styles.detailsContent}>
          <View style={styles.detailsMetaRow}>
            <AppText style={styles.detailsStepText} variant="bodyStrong">
              Step 2 of 4
            </AppText>
            {onSkip ? (
              <Pressable hitSlop={10} onPress={onSkip}>
                <AppText colorToken="textMuted" style={styles.detailsSkipText} variant="bodyStrong">
                  Skip
                </AppText>
              </Pressable>
            ) : null}
          </View>

          <AppText style={styles.detailsHeading} variant="displayH1">
            You are new here
          </AppText>
          <AppText colorToken="textMuted" style={styles.detailsSubHeading} variant="body">
            Just a quick introduction and we are good to go
          </AppText>

          <View style={styles.detailsFieldWrap}>
            <View style={[styles.detailsFieldContainer, styles.detailsFieldActive]}>
              <TextInput
                onChangeText={setFullName}
                placeholder="Enter full name"
                placeholderTextColor="#7C737E"
                style={styles.detailsFieldInput}
                value={fullName}
              />
              <View style={[styles.detailsFloatingChip, styles.detailsFloatingChipWide]}>
                <AppText style={styles.detailsFloatingChipText} variant="micro">
                  Full name
                </AppText>
              </View>
            </View>

            <View style={[styles.detailsFieldContainer, styles.detailsFieldActive, styles.detailsFieldSpacing]}>
              <TextInput
                onChangeText={setPassword}
                placeholder="Create password"
                placeholderTextColor="#7C737E"
                secureTextEntry={!showPassword}
                style={[styles.detailsFieldInput, styles.detailsFieldInputWithIcon]}
                value={password}
              />
              <Pressable hitSlop={8} onPress={() => setShowPassword((current) => !current)} style={styles.detailsEyeButton}>
                <View style={styles.detailsEyeOuter}>
                  <View style={styles.detailsEyeInner} />
                </View>
              </Pressable>
              <View style={[styles.detailsFloatingChip, styles.detailsFloatingChipWide]}>
                <AppText style={styles.detailsFloatingChipText} variant="micro">
                  Password
                </AppText>
              </View>
            </View>

            <View style={[styles.detailsFieldContainer, styles.detailsFieldActive, styles.detailsFieldSpacing]}>
              <TextInput
                keyboardType="phone-pad"
                onChangeText={setPhoneNumber}
                placeholder="Enter phone"
                placeholderTextColor="#7C737E"
                style={styles.detailsFieldInput}
                value={phoneNumber}
              />
              <View style={[styles.detailsFloatingChip, styles.detailsFloatingChipWide]}>
                <AppText style={styles.detailsFloatingChipText} variant="micro">
                  Phone number
                </AppText>
              </View>
            </View>
          </View>

          {errorMessage ? (
            <AppText colorToken="danger" style={styles.detailsErrorText} variant="caption">
              {errorMessage}
            </AppText>
          ) : null}
        </View>

        <View style={styles.detailsBottomActions}>
          <Pressable disabled={isSubmitting} onPress={submit} style={styles.detailsNextButton}>
            <ArrowIcon color="#FFFFFF" direction="left" />
            <AppText colorToken="textInverse" style={styles.detailsNextText} variant="bodyStrong">
              {isSubmitting ? 'Loading...' : 'Next'}
            </AppText>
            <ArrowIcon color="#FFFFFF" direction="right" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
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
  readonly onSkip?: () => void;
}

export function ProfileSetupEducationScreen({ initialValues, onContinue, onSkip }: ProfileSetupEducationScreenProps) {
  const [college, setCollege] = useState(initialValues.college);
  const [course, setCourse] = useState(initialValues.course);
  const [specialization, setSpecialization] = useState(initialValues.specialization);
  const [startYear, setStartYear] = useState(initialValues.startYear);
  const [endYear, setEndYear] = useState(initialValues.endYear);
  const [gender, setGender] = useState(initialValues.gender);
  const [rollNumber, setRollNumber] = useState(initialValues.rollNumber);
  const [activePicker, setActivePicker] = useState<null | 'startYear' | 'endYear' | 'gender'>(null);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const yearOptions = useMemo(() => {
    const latestYear = new Date().getFullYear() + 6;
    const earliestYear = latestYear - 60;
    return Array.from({ length: latestYear - earliestYear + 1 }, (_, index) => String(latestYear - index));
  }, []);

  const pickerTitle =
    activePicker === 'startYear'
      ? 'Select start year'
      : activePicker === 'endYear'
        ? 'Select end year'
        : activePicker === 'gender'
          ? 'Select gender'
          : '';

  const pickerOptions = activePicker === 'gender' ? ['Male', 'Female', 'Rather not to say'] : yearOptions;

  const pickerValue =
    activePicker === 'startYear'
      ? startYear
      : activePicker === 'endYear'
        ? endYear
        : activePicker === 'gender'
          ? gender
          : '';

  const selectPickerValue = (value: string) => {
    if (activePicker === 'startYear') {
      setStartYear(value);
    } else if (activePicker === 'endYear') {
      setEndYear(value);
    } else if (activePicker === 'gender') {
      setGender(value);
    }

    setActivePicker(null);
  };

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
    setIsSubmitting(true);
    const payload = {
      college: college.trim(),
      course: course.trim(),
      specialization: specialization.trim(),
      startYear: startYear.trim(),
      endYear: endYear.trim(),
      gender: gender.trim(),
      rollNumber: rollNumber.trim(),
    };
    setTimeout(() => {
      setIsSubmitting(false);
      onContinue(payload);
    }, 420);
  };

  return (
    <>
      <SafeAreaView edges={["top", "left", "right"]} style={styles.educationSafeArea}>
        <View style={styles.educationRoot}>
          <View style={styles.educationContent}>
          <View style={styles.educationMetaRow}>
            <AppText style={styles.educationStepText} variant="bodyStrong">
              Step 3 of 4
            </AppText>
            {onSkip ? (
              <Pressable hitSlop={10} onPress={onSkip}>
                <AppText colorToken="textMuted" style={styles.educationSkipText} variant="bodyStrong">
                  Skip
                </AppText>
              </Pressable>
            ) : null}
          </View>

          <AppText style={styles.educationHeading} variant="displayH1">
            Education Info
          </AppText>
          <AppText colorToken="textMuted" style={styles.educationSubHeading} variant="body">
            Just a quick introduction and we are good to go
          </AppText>

            <View style={styles.educationFieldWrap}>
              <FloatingField
                label="College/University name"
                onChangeText={setCollege}
                placeholder="College/University name"
                style={styles.educationFieldActive}
                value={college}
              />
              <FloatingField
                containerStyle={styles.educationFieldSpacing}
                label="Course"
                onChangeText={setCourse}
                placeholder="B.Tech"
                style={styles.educationFieldActive}
                value={course}
              />
              <FloatingField
                containerStyle={styles.educationFieldSpacing}
                label="Specialization"
                onChangeText={setSpecialization}
                placeholder="CSE"
                style={styles.educationFieldActive}
                value={specialization}
              />

              <View style={styles.educationDualRow}>
                <SelectField
                  containerStyle={styles.educationHalfField}
                  label="Start year"
                  onPress={() => setActivePicker('startYear')}
                  placeholder="2022"
                  value={startYear}
                />
                <SelectField
                  containerStyle={styles.educationHalfField}
                  label="End year"
                  onPress={() => setActivePicker('endYear')}
                  placeholder="2026"
                  value={endYear}
                />
              </View>

              <View style={styles.educationDualRowBottom}>
                <SelectField
                  containerStyle={styles.educationHalfField}
                  label="Gender"
                  onPress={() => setActivePicker('gender')}
                  placeholder="Male"
                  value={gender}
                />
                <FloatingField
                  containerStyle={styles.educationHalfField}
                  label="Roll number"
                  onChangeText={setRollNumber}
                  placeholder="2026"
                  style={styles.educationFieldActiveCompact}
                  value={rollNumber}
                />
              </View>
            </View>

          {errorMessage ? (
            <AppText colorToken="danger" style={styles.educationErrorText} variant="caption">
              {errorMessage}
            </AppText>
          ) : null}
          </View>

          <View style={styles.educationBottomActions}>
            <Pressable disabled={isSubmitting} onPress={submit} style={styles.educationNextButton}>
              <ArrowIcon color="#FFFFFF" direction="left" />
              <AppText colorToken="textInverse" style={styles.educationNextText} variant="bodyStrong">
                {isSubmitting ? 'Loading...' : 'Next'}
              </AppText>
              <ArrowIcon color="#FFFFFF" direction="right" />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <Modal animationType="slide" onRequestClose={() => setActivePicker(null)} transparent visible={Boolean(activePicker)}>
        <Pressable onPress={() => setActivePicker(null)} style={styles.educationSelectionBackdrop}>
          <Pressable onPress={() => {}} style={styles.educationSelectionSheet}>
            <View style={styles.educationSelectionHeader}>
              <AppText style={styles.educationSelectionTitle} variant="bodyStrong">
                {pickerTitle}
              </AppText>
              <Pressable hitSlop={8} onPress={() => setActivePicker(null)}>
                <AppText colorToken="brandSecondary" variant="label">
                  Done
                </AppText>
              </Pressable>
            </View>

            <ScrollView style={styles.educationSelectionList}>
              {pickerOptions.map((option) => {
                const isSelected = option === pickerValue;
                return (
                  <Pressable
                    key={option}
                    onPress={() => selectPickerValue(option)}
                    style={[styles.educationSelectionOption, isSelected ? styles.educationSelectionOptionActive : null]}
                  >
                    <AppText
                      style={[
                        styles.educationSelectionOptionText,
                        isSelected ? styles.educationSelectionOptionTextActive : null,
                      ]}
                      variant="body"
                    >
                      {option}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

interface FloatingFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly placeholder: string;
  readonly keyboardType?: 'default' | 'number-pad';
  readonly containerStyle?: object | undefined;
  readonly style?: object | undefined;
  readonly icon?: 'chevron';
}

function FloatingField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  containerStyle,
  style,
  icon,
}: FloatingFieldProps) {
  return (
    <View style={containerStyle}>
      <View style={[styles.educationFieldContainer, style]}>
        <TextInput
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#7C737E"
          style={[styles.educationFieldInput, icon ? styles.educationFieldInputWithIcon : null]}
          value={value}
        />
        {icon === 'chevron' ? (
          <View style={styles.educationChevronWrap}>
            <View style={styles.educationChevron} />
          </View>
        ) : null}
        <View style={styles.educationFloatingChip}>
          <AppText style={styles.educationFloatingChipText} variant="micro">
            {label}
          </AppText>
        </View>
      </View>
    </View>
  );
}

interface SelectFieldProps {
  readonly label: string;
  readonly value: string;
  readonly placeholder: string;
  readonly onPress: () => void;
  readonly containerStyle?: object | undefined;
}

function SelectField({ label, value, placeholder, onPress, containerStyle }: SelectFieldProps) {
  return (
    <View style={containerStyle}>
      <Pressable onPress={onPress} style={[styles.educationFieldContainer, styles.educationFieldActive]}>
        <AppText
          colorToken={value ? 'textPrimary' : 'textMuted'}
          style={[styles.educationFieldValueText, value ? null : styles.educationFieldValuePlaceholder]}
          variant="body"
        >
          {value || placeholder}
        </AppText>
        <View style={styles.educationChevronWrap}>
          <View style={styles.educationChevron} />
        </View>
        <View style={styles.educationFloatingChip}>
          <AppText style={styles.educationFloatingChipText} variant="micro">
            {label}
          </AppText>
        </View>
      </Pressable>
    </View>
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredSkills = suggestedSkills.filter((skill) => skill.toLowerCase().includes(query.trim().toLowerCase()));

  const toggleSkill = (skill: string) => {
    setSelectedSkills((currentSkills) =>
      currentSkills.includes(skill)
        ? currentSkills.filter((existingSkill) => existingSkill !== skill)
        : [...currentSkills, skill],
    );
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.skillsSafeArea}>
      <View style={styles.skillsRoot}>
        <ScrollView contentContainerStyle={styles.skillsScrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.skillsMetaRow}>
            <AppText style={styles.skillsStepText} variant="bodyStrong">
              Step 4 of 4
            </AppText>
            <Pressable hitSlop={10} onPress={onSkip}>
              <AppText colorToken="textMuted" style={styles.skillsSkipText} variant="bodyStrong">
                Skip
              </AppText>
            </Pressable>
          </View>

          <AppText style={styles.skillsHeading} variant="displayH1">
            Skills Info
          </AppText>
          <AppText colorToken="textMuted" style={styles.skillsSubHeading} variant="body">
            Pick relevant skills so we can personalize your opportunities
          </AppText>

          <View style={styles.skillsSearchWrap}>
            <View style={[styles.skillsSearchField, styles.skillsSearchFieldActive]}>
              <TextInput
                onChangeText={setQuery}
                placeholder="Search skills"
                placeholderTextColor="#7C737E"
                style={styles.skillsSearchInput}
                value={query}
              />
              <View style={styles.skillsFloatingChip}>
                <AppText style={styles.skillsFloatingChipText} variant="micro">
                  Skills
                </AppText>
              </View>
            </View>
          </View>

          <View style={styles.skillsChipsGrid}>
            {filteredSkills.map((chip) => {
              const selected = selectedSkills.includes(chip);
              return (
                <Pressable
                  key={chip}
                  onPress={() => toggleSkill(chip)}
                  style={[styles.skillsChip, selected ? styles.skillsChipSelected : null]}
                >
                  <AppText style={[styles.skillsChipText, selected ? styles.skillsChipTextSelected : null]} variant="label">
                    {chip}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <AppText colorToken="textMuted" style={styles.skillsCountText} variant="caption">
            {selectedSkills.length} selected
          </AppText>
        </ScrollView>

        <View style={styles.skillsBottomActions}>
          <Pressable
            disabled={isSubmitting}
            onPress={() => {
              setIsSubmitting(true);
              setTimeout(() => {
                setIsSubmitting(false);
                onContinue(selectedSkills);
              }, 360);
            }}
            style={styles.skillsNextButton}
          >
            <ArrowIcon color="#FFFFFF" direction="left" />
            <AppText colorToken="textInverse" style={styles.skillsNextText} variant="bodyStrong">
              {isSubmitting ? 'Loading...' : 'Next'}
            </AppText>
            <ArrowIcon color="#FFFFFF" direction="right" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
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
  onGoogleContinue,
  onSignUp,
}: SignInScreenProps) {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    const normalizedEmail = email.trim();

    if (!isValidEmail(normalizedEmail)) {
      setErrorMessage('Enter a valid email address to sign in.');
      return;
    }

    if (password.trim().length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (!isLoaded || !signIn) {
      setErrorMessage('Auth is not ready yet. Please wait a moment.');
      return;
    }

    setErrorMessage(undefined);
    setIsSubmitting(true);

    try {
      const result = await signIn.create({
        identifier: normalizedEmail,
        password: password.trim(),
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        onContinue({ email: normalizedEmail, password: password.trim() });
      } else {
        // Clerk may require additional steps (e.g. 2FA) — surface the status
        setErrorMessage(`Sign-in incomplete: ${result.status}. Please try again.`);
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ message: string }> };
      const message =
        clerkError?.errors?.[0]?.message ??
        (err instanceof Error ? err.message : 'Sign-in failed. Please check your credentials.');
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.signInSafeArea}>
      <View style={styles.signInRoot}>
        <View style={styles.signInContent}>
          <View style={styles.signInMetaRow}>
            <View />
            <Pressable hitSlop={10} onPress={onSignUp}>
              <AppText colorToken="textMuted" style={styles.signInSkipText} variant="bodyStrong">
                Skip
              </AppText>
            </Pressable>
          </View>

          <AppText style={styles.signInHeading} variant="displayH1">
            Sign In
          </AppText>
          <AppText colorToken="textMuted" style={styles.signInSubHeading} variant="body">
            Register now to take part in all the events
          </AppText>

          <Pressable onPress={onGoogleContinue} style={styles.signInGoogleButton}>
            <View style={styles.googleGlyph}>
              <View style={styles.googleGlyphRing} />
              <View style={styles.googleGlyphCutout} />
              <View style={styles.googleGlyphBar} />
            </View>
            <AppText colorToken="brandSecondary" style={styles.signInGoogleText} variant="bodyStrong">
              Continue with Google
            </AppText>
          </Pressable>

          <View style={styles.signInDividerRow}>
            <View style={styles.signInDividerLine} />
            <View style={styles.signInOrChip}>
              <AppText style={styles.signInOrText} variant="body">
                Or
              </AppText>
            </View>
          </View>

          <View style={styles.signInFieldWrap}>
            <View style={styles.signInFieldContainer}>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="Email address *"
                placeholderTextColor="#7C737E"
                style={styles.signInFieldInput}
                value={email}
              />
            </View>

            <View style={[styles.signInFieldContainer, styles.signInFieldSpacing]}>
              <TextInput
                onChangeText={setPassword}
                placeholder="Password *"
                placeholderTextColor="#7C737E"
                secureTextEntry={!showPassword}
                style={[styles.signInFieldInput, styles.signInFieldInputWithIcon]}
                value={password}
              />
              <Pressable hitSlop={8} onPress={() => setShowPassword((current) => !current)} style={styles.signInEyeButton}>
                <View style={styles.signInEyeOuter}>
                  <View style={styles.signInEyeInner} />
                </View>
              </Pressable>
            </View>
          </View>

          {errorMessage ? (
            <AppText colorToken="danger" style={styles.signInErrorText} variant="caption">
              {errorMessage}
            </AppText>
          ) : null}
        </View>

        <View style={styles.signInBottomActions}>
          <Pressable disabled={isSubmitting} onPress={submit} style={styles.signInNextButton}>
            <ArrowIcon color="#FFFFFF" direction="left" />
            <AppText colorToken="textInverse" style={styles.signInNextText} variant="bodyStrong">
              {isSubmitting ? 'Loading...' : 'Next'}
            </AppText>
            <ArrowIcon color="#FFFFFF" direction="right" />
          </Pressable>

          <Pressable hitSlop={10} onPress={onSignUp} style={styles.signInSignUpButton}>
            <AppText colorToken="brandSecondary" style={styles.signInSignUpText} variant="bodyStrong">
              Don’t have an account? Sign Up
            </AppText>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
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
