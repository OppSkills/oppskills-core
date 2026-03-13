import { FlowScreenTemplate } from '../../../../shared/ui';

interface DiscoverCompetitionsScreenProps {
  readonly onOpenCompetitionPage: () => void;
  readonly onSearchResults: () => void;
}

export function DiscoverCompetitionsScreen({
  onOpenCompetitionPage,
  onSearchResults,
}: DiscoverCompetitionsScreenProps) {
  return (
    <FlowScreenTemplate
      actions={[
        { label: 'Open competition detail page', onPress: onOpenCompetitionPage },
        { label: 'Open search results', onPress: onSearchResults, tone: 'outline' },
      ]}
      routeLabel="Discover / Competitions"
      subtitle="Competition listing variant with links into detail and search result paths."
      title="Discover Page Competitions"
    />
  );
}

interface CompetitionPageScreenProps {
  readonly onBackToDiscover: () => void;
}

export function CompetitionPageScreen({ onBackToDiscover }: CompetitionPageScreenProps) {
  return (
    <FlowScreenTemplate
      actions={[{ label: 'Back to discover root', onPress: onBackToDiscover, tone: 'outline' }]}
      routeLabel="Detail / Competition"
      subtitle="Nested competition detail route contract under tab stacks, prepared for long-form event content."
      title="Competition Page"
    />
  );
}
