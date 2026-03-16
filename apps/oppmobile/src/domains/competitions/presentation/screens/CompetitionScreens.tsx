import { useState } from 'react';

import { useDiscoverFeed } from '../../../discover/presentation/hooks/useDiscoverFeed';
import { useCompetitionDetail } from '../hooks/useCompetitionDetail';
import type { DiscoverCategoryId } from '../../../../shared/types/discover';
import { DiscoverScaffold, DiscoverVariantList, OpportunityDetailScreen } from '../../../../shared/ui';

interface DiscoverCompetitionsScreenProps {
  readonly onOpenCompetitionPage: () => void;
  readonly onSearchResults: () => void;
}

export function DiscoverCompetitionsScreen({
  onOpenCompetitionPage,
  onSearchResults,
}: DiscoverCompetitionsScreenProps) {
  const { data: discoverFeed } = useDiscoverFeed();
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  const toggleBookmark = (itemId: string) => {
    setBookmarkedIds((current) =>
      current.includes(itemId) ? current.filter((value) => value !== itemId) : [...current, itemId],
    );
  };

  const handleCategorySelect = (categoryId: DiscoverCategoryId) => {
    if (categoryId === 'competitions') {
      return;
    }

    onSearchResults();
  };

  return (
    <DiscoverScaffold
      activeCategoryId="competitions"
      categories={discoverFeed?.categories ?? []}
      onSearchPress={onSearchResults}
      onSelectCategory={handleCategorySelect}
      title="Competitions"
    >
      <DiscoverVariantList
        bookmarkedIds={bookmarkedIds}
        items={discoverFeed?.competitionListings ?? []}
        onOpenItem={onOpenCompetitionPage}
        onToggleBookmark={toggleBookmark}
      />
    </DiscoverScaffold>
  );
}

interface CompetitionPageScreenProps {
  readonly onBackToDiscover: () => void;
}

export function CompetitionPageScreen({ onBackToDiscover }: CompetitionPageScreenProps) {
  const { data: detail } = useCompetitionDetail();

  if (!detail) {
    return null;
  }

  return <OpportunityDetailScreen detail={detail} onBack={onBackToDiscover} />;
}
