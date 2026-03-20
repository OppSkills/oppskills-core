import { useState } from 'react';

import { useDiscoverFeed } from '../../../discover/presentation/hooks/useDiscoverFeed';
import type { DiscoverCategoryId } from '../../../../shared/types/discover';
import { DiscoverScaffold, DiscoverVariantList } from '../../../../shared/ui';

interface DiscoverEventsPrimaryScreenProps {
  readonly onOpenEventsSecondary: () => void;
  readonly onOpenSearchRecent: () => void;
}

export function DiscoverEventsPrimaryScreen({
  onOpenEventsSecondary,
  onOpenSearchRecent,
}: DiscoverEventsPrimaryScreenProps) {
  const { data: discoverFeed, isError, isLoading, refetch } = useDiscoverFeed();
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  const toggleBookmark = (itemId: string) => {
    setBookmarkedIds((current) =>
      current.includes(itemId) ? current.filter((value) => value !== itemId) : [...current, itemId],
    );
  };

  const handleCategorySelect = (categoryId: DiscoverCategoryId) => {
    if (categoryId === 'events') {
      return;
    }

    onOpenEventsSecondary();
  };

  return (
    <DiscoverScaffold
      activeCategoryId="events"
      categories={discoverFeed?.categories ?? []}
      onSearchPress={onOpenSearchRecent}
      onSelectCategory={handleCategorySelect}
      title="Events"
    >
      <DiscoverVariantList
        bookmarkedIds={bookmarkedIds}
        errorLabel={isError ? 'Unable to load event listings right now.' : undefined}
        items={discoverFeed?.eventCommunityListings ?? []}
        loading={isLoading}
        onOpenItem={onOpenEventsSecondary}
        onRetry={() => {
          void refetch();
        }}
        onToggleBookmark={toggleBookmark}
      />
    </DiscoverScaffold>
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
  const { data: discoverFeed, isError, isLoading, refetch } = useDiscoverFeed();
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  const toggleBookmark = (itemId: string) => {
    setBookmarkedIds((current) =>
      current.includes(itemId) ? current.filter((value) => value !== itemId) : [...current, itemId],
    );
  };

  const handleCategorySelect = (categoryId: DiscoverCategoryId) => {
    if (categoryId === 'events') {
      return;
    }

    onOpenEventsPrimary();
  };

  return (
    <DiscoverScaffold
      activeCategoryId="events"
      categories={discoverFeed?.categories ?? []}
      onSearchPress={onOpenSearchPopular}
      onSelectCategory={handleCategorySelect}
      title="Events"
    >
      <DiscoverVariantList
        bookmarkedIds={bookmarkedIds}
        errorLabel={isError ? 'Unable to load featured events right now.' : undefined}
        items={discoverFeed?.eventFeatureListings ?? []}
        loading={isLoading}
        onOpenItem={onOpenEventsPrimary}
        onRetry={() => {
          void refetch();
        }}
        onToggleBookmark={toggleBookmark}
      />
    </DiscoverScaffold>
  );
}
