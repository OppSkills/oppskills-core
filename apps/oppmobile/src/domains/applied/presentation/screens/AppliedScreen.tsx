import { FlowScreenTemplate } from '../../../../shared/ui';

interface AppliedScreenProps {
  readonly onOpenCompetition: () => void;
  readonly onOpenHackathon: () => void;
  readonly onSignOut: () => void;
}

export function AppliedScreen({ onOpenCompetition, onOpenHackathon, onSignOut }: AppliedScreenProps) {
  return (
    <FlowScreenTemplate
      actions={[
        { label: 'Inspect competition detail', onPress: onOpenCompetition },
        { label: 'Inspect hackathon detail', onPress: onOpenHackathon, tone: 'secondary' },
        { label: 'Sign out (mock)', onPress: onSignOut, tone: 'outline' },
      ]}
      routeLabel="Main Tab / Applied"
      subtitle="Applied tab shell with quick links to detail stacks and mock sign-out action."
      title="Applied"
    />
  );
}
