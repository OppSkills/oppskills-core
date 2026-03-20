import { Pressable, StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { useDiscoverFeed } from '../../../discover/presentation/hooks/useDiscoverFeed';
import { useCompetitionDetail } from '../hooks/useCompetitionDetail';
import type { DiscoverCategoryId } from '../../../../shared/types/discover';
import { lightTheme } from '../../../../shared/theme';
import { AppText, DiscoverScaffold, DiscoverVariantList, OpportunityDetailScreen } from '../../../../shared/ui';

interface DiscoverCompetitionsScreenProps {
  readonly onOpenCompetitionPage: () => void;
  readonly onSearchResults: () => void;
}

export function DiscoverCompetitionsScreen({
  onOpenCompetitionPage,
  onSearchResults,
}: DiscoverCompetitionsScreenProps) {
  const { data: discoverFeed, isError, isLoading, refetch } = useDiscoverFeed();
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
        errorLabel={isError ? 'Unable to load competitions right now.' : undefined}
        items={discoverFeed?.competitionListings ?? []}
        loading={isLoading}
        onOpenItem={onOpenCompetitionPage}
        onRetry={() => {
          void refetch();
        }}
        onToggleBookmark={toggleBookmark}
      />
    </DiscoverScaffold>
  );
}

interface CompetitionPageScreenProps {
  readonly onBackToDiscover: () => void;
}

export function CompetitionPageScreen({ onBackToDiscover }: CompetitionPageScreenProps) {
  const { data: detail, isError, isLoading, refetch } = useCompetitionDetail();

  if (isLoading) {
    return <DetailLoadingState />;
  }

  if (isError) {
    return (
      <DetailErrorState
        label="Unable to load competition details."
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  if (!detail) {
    return <DetailErrorState label="No competition details available yet." onRetry={onBackToDiscover} />;
  }

  return <OpportunityDetailScreen detail={detail} onBack={onBackToDiscover} />;
}

function DetailLoadingState() {
  return (
    <View style={styles.stateWrap}>
      <View style={styles.skeletonHero} />
      <View style={styles.skeletonCard}>
        <View style={[styles.skeletonBar, styles.skeletonWide]} />
        <View style={[styles.skeletonBar, styles.skeletonMedium]} />
        <View style={[styles.skeletonBar, styles.skeletonShort]} />
      </View>
    </View>
  );
}

function DetailErrorState({ label, onRetry }: { readonly label: string; readonly onRetry: () => void }) {
  return (
    <View style={styles.stateWrap}>
      <View style={styles.errorCard}>
        <AppText colorToken="textSecondary" variant="caption">
          {label}
        </AppText>
        <Pressable onPress={onRetry} style={styles.retryButton}>
          <AppText colorToken="brandPrimaryStrong" variant="caption">
            Retry
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  errorCard: {
    alignItems: 'center',
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    marginTop: lightTheme.spacing[20],
    padding: lightTheme.spacing[20],
  },
  retryButton: {
    borderColor: lightTheme.colors.focusRing,
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    marginTop: lightTheme.spacing[12],
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: lightTheme.spacing[16],
  },
  skeletonBar: {
    backgroundColor: lightTheme.colors.backgroundSecondary,
    borderRadius: lightTheme.radius.xs,
    height: 10,
    marginTop: lightTheme.spacing[8],
  },
  skeletonCard: {
    backgroundColor: lightTheme.colors.surfacePrimary,
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.md,
    borderWidth: 1,
    marginTop: lightTheme.spacing[16],
    padding: lightTheme.spacing[16],
  },
  skeletonHero: {
    backgroundColor: lightTheme.colors.surfaceMuted,
    borderRadius: lightTheme.radius.lg,
    height: 180,
    width: '100%',
  },
  skeletonMedium: {
    width: '68%',
  },
  skeletonShort: {
    width: '48%',
  },
  skeletonWide: {
    width: '90%',
  },
  stateWrap: {
    backgroundColor: lightTheme.colors.backgroundPrimary,
    flex: 1,
    paddingHorizontal: lightTheme.spacing[20],
    paddingTop: lightTheme.spacing[20],
  },
});
