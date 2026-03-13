import { StyleSheet, View } from 'react-native';

import { lightTheme } from '../../../../shared/theme';
import { AppText, FlowScreenTemplate, InputField, SearchInput } from '../../../../shared/ui';

interface IntroScreenProps {
  readonly onStart: () => void;
  readonly onReturningUser: () => void;
}

export function IntroScreen({ onStart, onReturningUser }: IntroScreenProps) {
  return (
    <FlowScreenTemplate
      actions={[
        { label: 'Start onboarding', onPress: onStart },
        { label: 'I already have an account', onPress: onReturningUser, tone: 'outline' },
      ]}
      routeLabel="Phase 3 / Intro"
      showFooter={false}
      subtitle="First-time users begin from here. Returning users can jump directly to the sign-in entry route."
      title="OppSkills Intro"
    />
  );
}

interface OnboardingScreenProps {
  readonly onNext: () => void;
  readonly onSkip: () => void;
}

export function OnboardingSevenScreen({ onNext, onSkip }: OnboardingScreenProps) {
  return (
    <FlowScreenTemplate
      actions={[
        { label: 'Next', onPress: onNext },
        { label: 'Skip to sign in', onPress: onSkip, tone: 'outline' },
      ]}
      routeLabel="Onboarding 7"
      subtitle="Find opportunities across campuses in a single feed."
      title="Find What is Happening on Campus"
    />
  );
}

export function OnboardingEightScreen({ onNext, onSkip }: OnboardingScreenProps) {
  return (
    <FlowScreenTemplate
      actions={[
        { label: 'Next', onPress: onNext },
        { label: 'Skip to sign in', onPress: onSkip, tone: 'outline' },
      ]}
      routeLabel="Onboarding 8"
      subtitle="Stay updated with events, competitions, and communities that match your interests."
      title="Stay Updated with What Matters"
    />
  );
}

interface OnboardingNineScreenProps {
  readonly onGetStarted: () => void;
  readonly onSignIn: () => void;
}

export function OnboardingNineScreen({ onGetStarted, onSignIn }: OnboardingNineScreenProps) {
  return (
    <FlowScreenTemplate
      actions={[
        { label: 'Get started', onPress: onGetStarted },
        { label: 'Already have an account? Sign in', onPress: onSignIn, tone: 'outline' },
      ]}
      routeLabel="Onboarding 9"
      subtitle="Complete onboarding and move into the auth journey."
      title="Turn Opportunities into Experience"
    />
  );
}

interface AuthStepScreenProps {
  readonly title: string;
  readonly subtitle: string;
  readonly routeLabel: string;
  readonly ctaLabel: string;
  readonly onContinue: () => void;
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
    </FlowScreenTemplate>
  );
}

interface SignUpScreenProps {
  readonly onContinue: () => void;
  readonly onSignIn: () => void;
}

export function SignUpScreen({ onContinue, onSignIn }: SignUpScreenProps) {
  return (
    <AuthStepScreen
      ctaLabel="Continue"
      onContinue={onContinue}
      onSecondary={onSignIn}
      routeLabel="Auth / Sign Up"
      secondaryLabel="Already have an account? Sign in"
      subtitle="Mock-driven sign-up entry for Phase 3 navigation coverage."
      title="Sign Up"
    >
      <InputField label="Email" placeholder="Email address" value="" />
    </AuthStepScreen>
  );
}

interface VerifyIdentityScreenProps {
  readonly onContinue: () => void;
  readonly filled?: boolean;
}

export function VerifyIdentityScreen({ onContinue, filled = false }: VerifyIdentityScreenProps) {
  return (
    <AuthStepScreen
      ctaLabel={filled ? 'Continue to profile setup' : 'Verify code'}
      onContinue={onContinue}
      routeLabel={filled ? 'Auth / Verify OTP Filled' : 'Auth / Verify OTP Empty'}
      subtitle="This step remains mock-only for now and will be replaced with backend auth flows later."
      title="Verify your identity"
    >
      <InputField label="Email" placeholder="qwer@gmail.com" value="qwer@gmail.com" />
      <InputField
        containerStyle={styles.inputSpacing}
        label="OTP"
        placeholder="Enter OTP"
        value={filled ? '525856' : ''}
      />
    </AuthStepScreen>
  );
}

interface ProfileSetupPersonalScreenProps {
  readonly onContinue: () => void;
}

export function ProfileSetupPersonalScreen({ onContinue }: ProfileSetupPersonalScreenProps) {
  return (
    <AuthStepScreen
      ctaLabel="Continue"
      onContinue={onContinue}
      routeLabel="Auth / Profile Personal"
      subtitle="Step 2 of profile setup for personal details."
      title="You are new here"
    >
      <InputField label="Full name" placeholder="Enter full name" value="" />
      <InputField containerStyle={styles.inputSpacing} label="Password" placeholder="Create password" value="" />
      <InputField containerStyle={styles.inputSpacing} label="Phone number" placeholder="Enter phone" value="" />
    </AuthStepScreen>
  );
}

interface ProfileSetupEducationScreenProps {
  readonly onContinue: () => void;
}

export function ProfileSetupEducationScreen({ onContinue }: ProfileSetupEducationScreenProps) {
  return (
    <AuthStepScreen
      ctaLabel="Continue"
      onContinue={onContinue}
      routeLabel="Auth / Profile Education"
      subtitle="Step 3 captures education metadata in local state for now."
      title="Education Info"
    >
      <InputField label="College" placeholder="College/University name" value="" />
      <InputField containerStyle={styles.inputSpacing} label="Course" placeholder="B.Tech" value="" />
      <InputField containerStyle={styles.inputSpacing} label="Specialization" placeholder="CSE" value="" />
    </AuthStepScreen>
  );
}

interface ProfileSetupSkillsScreenProps {
  readonly onContinue: () => void;
  readonly onSkip: () => void;
}

export function ProfileSetupSkillsScreen({ onContinue, onSkip }: ProfileSetupSkillsScreenProps) {
  return (
    <AuthStepScreen
      ctaLabel="Continue"
      onContinue={onContinue}
      onSecondary={onSkip}
      routeLabel="Auth / Profile Skills"
      secondaryLabel="Skip"
      subtitle="Skills are captured as mock tags and can later map to backend profiles."
      title="Skills Info"
    >
      <SearchInput onChangeText={() => {}} value="" />
      <View style={styles.chipsRow}>
        {['Organizers', 'Frontend', 'Design', 'Data Science'].map((chip) => (
          <View key={chip} style={styles.chip}>
            <AppText colorToken="brandPrimaryStrong" variant="caption">
              {chip}
            </AppText>
          </View>
        ))}
      </View>
    </AuthStepScreen>
  );
}

interface SignInScreenProps {
  readonly onContinue: () => void;
  readonly onSignUp: () => void;
}

export function SignInScreen({ onContinue, onSignUp }: SignInScreenProps) {
  return (
    <AuthStepScreen
      ctaLabel="Sign in"
      onContinue={onContinue}
      onSecondary={onSignUp}
      routeLabel="Auth / Sign In"
      secondaryLabel="Need an account? Sign up"
      subtitle="Mock sign-in transitions authenticated users into main tabs."
      title="Sign In"
    >
      <InputField label="Email" placeholder="Email address" value="" />
      <InputField containerStyle={styles.inputSpacing} label="Password" placeholder="Password" value="" />
    </AuthStepScreen>
  );
}

const styles = StyleSheet.create({
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
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: lightTheme.spacing[12],
  },
  formBlock: {
    marginTop: lightTheme.spacing[4],
  },
  inputSpacing: {
    marginTop: lightTheme.spacing[12],
  },
});
