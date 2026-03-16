import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useDiscoverFeed } from '../../../discover/presentation/hooks/useDiscoverFeed';
import { lightTheme } from '../../../../shared/theme';
import type { DiscoverCategoryId } from '../../../../shared/types/discover';
import { AppText, DiscoverScaffold, DiscoverVariantList } from '../../../../shared/ui';

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
  const { data: discoverFeed } = useDiscoverFeed();
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  const toggleBookmark = (itemId: string) => {
    setBookmarkedIds((current) =>
      current.includes(itemId) ? current.filter((value) => value !== itemId) : [...current, itemId],
    );
  };

  const handleCategorySelect = (categoryId: DiscoverCategoryId) => {
    switch (categoryId) {
      case 'hackathons':
        onHackathons();
        break;
      case 'competitions':
        onCompetitions();
        break;
      case 'events':
        onEventsPrimary();
        break;
      case 'communities':
      default:
        break;
    }
  };

  return (
    <DiscoverScaffold
      activeCategoryId="communities"
      categories={discoverFeed?.categories ?? []}
      onSearchPress={onSearchRecent}
      onSelectCategory={handleCategorySelect}
      subtitle="Discover the latest opportunities and jump to targeted feeds."
      title="Top Listings"
    >
      <DiscoverVariantList
        bookmarkedIds={bookmarkedIds}
        items={discoverFeed?.defaultTopListings ?? []}
        onOpenItem={onHackathons}
        onToggleBookmark={toggleBookmark}
      />

      <View style={styles.sectionHead}>
        <AppText style={styles.sectionTitle} variant="sectionHeading">
          Recent Listings
        </AppText>
        <Pressable onPress={onEventsSecondary} style={styles.sectionAction}>
          <AppText colorToken="brandPrimaryStrong" variant="caption">
            Open event feed
          </AppText>
        </Pressable>
      </View>

      <DiscoverVariantList
        bookmarkedIds={bookmarkedIds}
        items={discoverFeed?.defaultRecentListings ?? []}
        onOpenItem={onCompetitions}
        onToggleBookmark={toggleBookmark}
      />
    </DiscoverScaffold>
  );
}

const styles = StyleSheet.create({
  sectionAction: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: lightTheme.spacing[8],
  },
  sectionHead: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: lightTheme.spacing[24],
  },
  sectionTitle: {
    fontSize: lightTheme.typography.sectionHeading.fontSize,
  },
});
