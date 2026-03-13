import { FlowScreenTemplate } from '../../../../shared/ui';

interface DiscoverPageScreenProps {
  readonly onHackathons: () => void;
  readonly onCompetitions: () => void;
  readonly onEventsPrimary: () => void;
  readonly onEventsSecondary: () => void;
  readonly onSearchRecent: () => void;
}

export function DiscoverPageScreen({
  onHackathons,
  onCompetitions,
  onEventsPrimary,
  onEventsSecondary,
  onSearchRecent,
}: DiscoverPageScreenProps) {
  return (
    <FlowScreenTemplate
      actions={[
        { label: 'Discover hackathons', onPress: onHackathons },
        { label: 'Discover competitions', onPress: onCompetitions, tone: 'secondary' },
        { label: 'Discover events (variant 1)', onPress: onEventsPrimary, tone: 'secondary' },
        { label: 'Discover events (variant 2)', onPress: onEventsSecondary, tone: 'secondary' },
        { label: 'Open search recent', onPress: onSearchRecent, tone: 'outline' },
      ]}
      routeLabel="Main Tab / Discover"
      subtitle="Discover tab entry with links to all discover and search route variants required by the phase matrix."
      title="Discover Page"
    />
  );
}
