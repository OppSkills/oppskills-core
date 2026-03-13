import { FlowScreenTemplate } from '../../../../shared/ui';

interface DiscoverEventsPrimaryScreenProps {
  readonly onOpenEventsSecondary: () => void;
  readonly onOpenSearchRecent: () => void;
}

export function DiscoverEventsPrimaryScreen({
  onOpenEventsSecondary,
  onOpenSearchRecent,
}: DiscoverEventsPrimaryScreenProps) {
  return (
    <FlowScreenTemplate
      actions={[
        { label: 'Switch to events variant 2', onPress: onOpenEventsSecondary },
        { label: 'Open search recent', onPress: onOpenSearchRecent, tone: 'outline' },
      ]}
      routeLabel="Discover / Events V1"
      subtitle="First events layout variant in discover flow."
      title="Discover Page Events"
    />
  );
}

interface DiscoverEventsSecondaryScreenProps {
  readonly onOpenEventsPrimary: () => void;
  readonly onOpenSearchPopular: () => void;
}

export function DiscoverEventsSecondaryScreen({
  onOpenEventsPrimary,
  onOpenSearchPopular,
}: DiscoverEventsSecondaryScreenProps) {
  return (
    <FlowScreenTemplate
      actions={[
        { label: 'Switch to events variant 1', onPress: onOpenEventsPrimary },
        { label: 'Open search popular', onPress: onOpenSearchPopular, tone: 'outline' },
      ]}
      routeLabel="Discover / Events V2"
      subtitle="Second events layout variant in discover flow."
      title="Discover Page Events (Alt)"
    />
  );
}
