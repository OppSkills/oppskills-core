import { FlowScreenTemplate } from '../../../../shared/ui';

interface DiscoverHackathonsScreenProps {
  readonly onOpenHackathonPage: () => void;
  readonly onSearchTyping: () => void;
}

export function DiscoverHackathonsScreen({
  onOpenHackathonPage,
  onSearchTyping,
}: DiscoverHackathonsScreenProps) {
  return (
    <FlowScreenTemplate
      actions={[
        { label: 'Open hackathon detail page', onPress: onOpenHackathonPage },
        { label: 'Go to search typing screen', onPress: onSearchTyping, tone: 'outline' },
      ]}
      routeLabel="Discover / Hackathons"
      subtitle="Hackathon listing variant under discover with direct navigation to detail and search typing screens."
      title="Discover Page Hackathons"
    />
  );
}

interface HackathonPageScreenProps {
  readonly onBackToDiscover: () => void;
}

export function HackathonPageScreen({ onBackToDiscover }: HackathonPageScreenProps) {
  return (
    <FlowScreenTemplate
      actions={[{ label: 'Back to discover root', onPress: onBackToDiscover, tone: 'outline' }]}
      routeLabel="Detail / Hackathon"
      subtitle="Nested detail screen contract under tab stacks; ready for full content implementation in upcoming phases."
      title="Hackathon Page"
    />
  );
}
