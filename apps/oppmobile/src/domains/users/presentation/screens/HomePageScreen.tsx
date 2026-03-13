import { FlowScreenTemplate } from '../../../../shared/ui';

interface HomePageScreenProps {
  readonly onOpenCompetition: () => void;
  readonly onOpenHackathon: () => void;
  readonly onRestartOnboarding: () => void;
}

export function HomePageScreen({
  onOpenCompetition,
  onOpenHackathon,
  onRestartOnboarding,
}: HomePageScreenProps) {
  return (
    <FlowScreenTemplate
      actions={[
        { label: 'Open competition page', onPress: onOpenCompetition },
        { label: 'Open hackathon page', onPress: onOpenHackathon, tone: 'secondary' },
        { label: 'Reset to onboarding flow', onPress: onRestartOnboarding, tone: 'outline' },
      ]}
      routeLabel="Main Tab / Home"
      subtitle="Phase 3 shell: this is the Home tab entry point with links to detail pages and flow reset for QA."
      title="Home Page"
    />
  );
}
