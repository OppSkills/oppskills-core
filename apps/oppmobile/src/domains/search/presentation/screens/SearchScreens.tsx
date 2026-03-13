import { FlowScreenTemplate } from '../../../../shared/ui';

interface SearchPageRecentScreenProps {
  readonly onPopular: () => void;
  readonly onTyping: () => void;
}

export function SearchPageRecentScreen({ onPopular, onTyping }: SearchPageRecentScreenProps) {
  return (
    <FlowScreenTemplate
      actions={[
        { label: 'Open popular searches', onPress: onPopular },
        { label: 'Jump to typing state', onPress: onTyping, tone: 'outline' },
      ]}
      routeLabel="Search / Recent"
      subtitle="Recent search state in discover search flow."
      title="Search Page Recent Searches"
    />
  );
}

interface SearchPagePopularScreenProps {
  readonly onRecent: () => void;
  readonly onTyping: () => void;
}

export function SearchPagePopularScreen({ onRecent, onTyping }: SearchPagePopularScreenProps) {
  return (
    <FlowScreenTemplate
      actions={[
        { label: 'Back to recent searches', onPress: onRecent },
        { label: 'Continue to typing state', onPress: onTyping, tone: 'outline' },
      ]}
      routeLabel="Search / Popular"
      subtitle="Popular search state for fallback suggestions."
      title="Search Page Popular Searches"
    />
  );
}

interface SearchPageTypingScreenProps {
  readonly onResults: () => void;
  readonly onPopular: () => void;
}

export function SearchPageTypingScreen({ onResults, onPopular }: SearchPageTypingScreenProps) {
  return (
    <FlowScreenTemplate
      actions={[
        { label: 'Show search results', onPress: onResults },
        { label: 'Back to popular searches', onPress: onPopular, tone: 'outline' },
      ]}
      routeLabel="Search / Typing"
      subtitle="Typing state for query refinement before showing results."
      title="Search Page Typing"
    />
  );
}

interface SearchPageResultsScreenProps {
  readonly onCompetition: () => void;
  readonly onHackathon: () => void;
}

export function SearchPageResultsScreen({ onCompetition, onHackathon }: SearchPageResultsScreenProps) {
  return (
    <FlowScreenTemplate
      actions={[
        { label: 'Open competition detail', onPress: onCompetition },
        { label: 'Open hackathon detail', onPress: onHackathon, tone: 'secondary' },
      ]}
      routeLabel="Search / Results"
      subtitle="Results state routes users into detailed competition and hackathon pages."
      title="Search Page Results"
    />
  );
}
