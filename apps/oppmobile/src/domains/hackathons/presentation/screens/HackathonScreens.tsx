import { useState } from 'react';

import { useDiscoverFeed } from '../../../discover/presentation/hooks/useDiscoverFeed';
import { useHackathonDetail } from '../hooks/useHackathonDetail';
import type { DiscoverCategoryId } from '../../../../shared/types/discover';
import { DiscoverScaffold, DiscoverVariantList, OpportunityDetailScreen } from '../../../../shared/ui';

interface DiscoverHackathonsScreenProps {
  readonly onOpenHackathonPage: () => void;
  readonly onSearchTyping: () => void;
}

export function DiscoverHackathonsScreen({
  onOpenHackathonPage,
  onSearchTyping,
}: DiscoverHackathonsScreenProps) {
  const { data: discoverFeed } = useDiscoverFeed();
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  const toggleBookmark = (itemId: string) => {
    setBookmarkedIds((current) =>
      current.includes(itemId) ? current.filter((value) => value !== itemId) : [...current, itemId],
    );
  };

  const handleCategorySelect = (categoryId: DiscoverCategoryId) => {
    if (categoryId === 'hackathons') {
      return;
    }

    onSearchTyping();
  };

  return (
    <DiscoverScaffold
      activeCategoryId="hackathons"
      categories={discoverFeed?.categories ?? []}
      onSearchPress={onSearchTyping}
      onSelectCategory={handleCategorySelect}
      title="Hackathons"
    >
      <DiscoverVariantList
        bookmarkedIds={bookmarkedIds}
        items={discoverFeed?.hackathonListings ?? []}
        onOpenItem={onOpenHackathonPage}
        onToggleBookmark={toggleBookmark}
      />
    </DiscoverScaffold>
  );
}

interface HackathonPageScreenProps {
  readonly onBackToDiscover: () => void;
}

export function HackathonPageScreen({ onBackToDiscover }: HackathonPageScreenProps) {
  const { data: detail } = useHackathonDetail();

  if (!detail) {
    return null;
  }

  return <OpportunityDetailScreen detail={detail} onBack={onBackToDiscover} />;
}
