import {
  Image,
  ImageBackground,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import hackathonCategoryButtonImage from '../../../../../assets/Frame 548.png';
import competitionsCategoryButtonImage from '../../../../../assets/Frame 549.png';
import eventsCategoryButtonImage from '../../../../../assets/Frame 550.png';
import communitiesCategoryButtonImage from '../../../../../assets/Frame 551.png';
import subtractHeroImage from '../../../../../assets/Subtract.png';
import { useDiscoverFeed } from '../../../discover/presentation/hooks/useDiscoverFeed';
import { useCompetitionDetail } from '../hooks/useCompetitionDetail';
import type { DiscoverCategoryId } from '../../../../shared/types/discover';
import { lightTheme } from '../../../../shared/theme';
import type { DiscoverOpportunityItem } from '../../../../shared/types/discover';
import { AppText, SearchInput } from '../../../../shared/ui';
import { OpportunityDetailScreen } from '../../../../shared/ui/OpportunityDetailScreen';

interface DiscoverCompetitionsScreenProps {
  readonly onOpenEvents: () => void;
  readonly onOpenHackathons: () => void;
  readonly onOpenCompetitionPage: () => void;
  readonly onSearchResults: () => void;
}

export function DiscoverCompetitionsScreen({
  onOpenEvents,
  onOpenHackathons,
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

    if (categoryId === 'hackathons') {
      onOpenHackathons();
      return;
    }

    if (categoryId === 'events') {
      onOpenEvents();
      return;
    }

    onSearchResults();
  };

  const competitionCards = (discoverFeed?.competitionListings ?? []).slice(0, 3);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.competitionScreen}>
      <View style={styles.frame544}>
        <View style={styles.searchHeaderRow}>
          <Pressable hitSlop={8} onPress={onSearchResults} style={styles.searchFieldWrap}>
            <View pointerEvents="none">
              <SearchInput editable={false} onChangeText={() => undefined} value="" />
            </View>
          </Pressable>
          <View style={styles.profileAvatar}>
            <AppText colorToken="textInverse" variant="caption">
              RT
            </AppText>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.frame545Content}
        showsVerticalScrollIndicator={false}
        style={styles.frame545Scroll}
      >
        <View style={styles.frame552}>
          <CategoryTile
            image={hackathonCategoryButtonImage}
            onPress={() => {
              handleCategorySelect('hackathons');
            }}
          />
          <CategoryTile image={competitionsCategoryButtonImage} />
          <CategoryTile
            image={eventsCategoryButtonImage}
            onPress={() => {
              handleCategorySelect('events');
            }}
          />
          <CategoryTile
            image={communitiesCategoryButtonImage}
            onPress={() => {
              handleCategorySelect('communities');
            }}
          />
        </View>

        <View style={styles.frame553}>
          <AppText style={styles.competitionsHeading} variant="sectionHeading">
            Competitions
          </AppText>

          {isError ? (
            <View style={styles.errorCard}>
              <AppText colorToken="textSecondary" variant="caption">
                Unable to load competitions right now.
              </AppText>
              <Pressable
                onPress={() => {
                  void refetch();
                }}
                style={styles.retryButton}
              >
                <AppText colorToken="brandPrimaryStrong" variant="caption">
                  Retry
                </AppText>
              </Pressable>
            </View>
          ) : null}

          {isLoading ? (
            <View style={styles.listStack}>
              <View style={styles.skeletonCompetitionCard} />
              <View style={styles.skeletonCompetitionCard} />
              <View style={styles.skeletonCompetitionCard} />
            </View>
          ) : (
            <View style={styles.listStack}>
              {competitionCards.map((item, index) => (
                <CompetitionCard
                  bookmarked={bookmarkedIds.includes(item.id)}
                  image={heroImageByIndex(index)}
                  item={item}
                  key={item.id}
                  onOpenCompetitionPage={onOpenCompetitionPage}
                  onToggleBookmark={toggleBookmark}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.frame536}>
          <AppText style={styles.footerTitle} variant="title">
            Global Opportunities. Powered by Skills.
          </AppText>
          <AppText colorToken="textSecondary" variant="caption">
            Made with ❤️ in India
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CategoryTile({
  image,
  onPress,
}: {
  readonly image: ImageSourcePropType;
  readonly onPress?: () => void;
}) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={styles.categoryTile}>
      <Image resizeMode="cover" source={image} style={styles.categoryTileImage} />
    </Pressable>
  );
}

function CompetitionCard({
  item,
  image,
  bookmarked,
  onToggleBookmark,
  onOpenCompetitionPage,
}: {
  readonly item: DiscoverOpportunityItem;
  readonly image: ImageSourcePropType;
  readonly bookmarked: boolean;
  readonly onToggleBookmark: (itemId: string) => void;
  readonly onOpenCompetitionPage: () => void;
}) {
  return (
    <Pressable onPress={onOpenCompetitionPage} style={styles.competitionCard}>
      <ImageBackground imageStyle={styles.competitionHeroImage} source={image} style={styles.competitionHero}>
        <View style={styles.modePill}>
          <AppText colorToken="brandPrimaryStrong" style={styles.modePillText} variant="caption">
            Free
          </AppText>
          <View style={styles.modeDot} />
          <AppText colorToken="brandPrimaryStrong" style={styles.modePillText} variant="caption">
            Offline
          </AppText>
        </View>

        <Pressable
          accessibilityLabel={`Toggle bookmark for ${item.title}`}
          onPress={() => {
            onToggleBookmark(item.id);
          }}
          style={[styles.bookmarkButton, bookmarked ? styles.bookmarkButtonActive : null]}
        >
          <AppText colorToken={bookmarked ? 'textInverse' : 'textPrimary'} variant="micro">
            {bookmarked ? 'Saved' : 'Save'}
          </AppText>
        </Pressable>
      </ImageBackground>

      <View style={styles.descriptionBlock}>
        <View style={styles.detailsBlock}>
          <AppText numberOfLines={1} style={styles.competitionTitle} variant="title">
            {item.title}
          </AppText>
          <AppText colorToken="textSecondary" style={styles.hostLabel} variant="caption">
            {item.host}
          </AppText>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.metricBlock}>
            <AppText colorToken="textMuted" style={styles.metricLabel} variant="caption">
              Register By
            </AppText>
            <AppText colorToken="textSecondary" style={styles.metricValue} variant="body">
              {item.registerBy}
            </AppText>
          </View>

          <View style={styles.metricBlock}>
            <AppText colorToken="textMuted" style={styles.metricLabel} variant="caption">
              Prizes Worth
            </AppText>
            <AppText colorToken="textSecondary" style={styles.metricValue} variant="body">
              {item.value}
            </AppText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function heroImageByIndex(_index: number): ImageSourcePropType {
  return subtractHeroImage;
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
  bookmarkButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(250, 250, 250, 0.92)',
    borderColor: '#FAFAFA',
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 28,
    minWidth: 56,
    paddingHorizontal: lightTheme.spacing[8],
    position: 'absolute',
    right: lightTheme.spacing[10],
    top: lightTheme.spacing[10],
  },
  bookmarkButtonActive: {
    backgroundColor: lightTheme.colors.brandSecondary,
    borderColor: lightTheme.colors.brandSecondary,
  },
  categoryTile: {
    borderRadius: 8,
    flex: 1,
    height: 72,
    minWidth: 0,
    overflow: 'hidden',
  },
  categoryTileImage: {
    height: '100%',
    width: '100%',
  },
  competitionCard: {
    backgroundColor: lightTheme.colors.backgroundPrimary,
    borderColor: '#C3BFC4',
    borderRadius: 12,
    borderWidth: 0.37,
    overflow: 'hidden',
    width: '100%',
  },
  competitionHero: {
    backgroundColor: '#E2D3FF',
    height: 202.83,
    justifyContent: 'flex-end',
    paddingHorizontal: lightTheme.spacing[10],
    paddingVertical: lightTheme.spacing[10],
    width: '100%',
  },
  competitionHeroImage: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    resizeMode: 'cover',
  },
  competitionScreen: {
    backgroundColor: lightTheme.colors.backgroundPrimary,
    flex: 1,
    position: 'relative',
  },
  competitionTitle: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 25,
  },
  competitionsHeading: {
    color: '#100013',
    width: '100%',
  },
  descriptionBlock: {
    gap: 8,
    paddingHorizontal: lightTheme.spacing[10],
    paddingVertical: lightTheme.spacing[12],
  },
  detailsBlock: {
    gap: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  errorCard: {
    alignItems: 'center',
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    marginTop: lightTheme.spacing[20],
    padding: lightTheme.spacing[20],
  },
  footerTitle: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 25,
  },
  frame536: {
    gap: 10,
    maxWidth: 257,
  },
  frame544: {
    backgroundColor: '#FAFAFA',
    borderBottomColor: '#A099A1',
    borderBottomWidth: 0.5,
    paddingHorizontal: lightTheme.spacing[20],
    paddingTop: lightTheme.spacing[8],
  },
  frame545Content: {
    gap: 40,
    paddingBottom: 120,
    paddingHorizontal: lightTheme.spacing[20],
    paddingTop: lightTheme.spacing[20],
  },
  frame545Scroll: {
    flex: 1,
  },
  frame552: {
    flexDirection: 'row',
    gap: lightTheme.spacing[8],
    width: '100%',
  },
  frame553: {
    gap: lightTheme.spacing[16],
    width: '100%',
  },
  hostLabel: {
    color: '#7C737E',
    fontSize: 12,
    lineHeight: 18,
  },
  listStack: {
    gap: 16,
    width: '100%',
  },
  metricBlock: {
    gap: 2,
    minWidth: 104,
  },
  metricLabel: {
    color: '#A099A1',
    fontSize: 12,
    lineHeight: 18,
  },
  metricValue: {
    color: '#584D5A',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  modeDot: {
    backgroundColor: '#6949AA',
    borderRadius: 999,
    height: 4,
    width: 4,
  },
  modePill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    bottom: 12,
    columnGap: 5,
    flexDirection: 'row',
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    position: 'absolute',
  },
  modePillText: {
    color: '#6949AA',
    fontSize: 12,
    lineHeight: 18,
  },
  profileAvatar: {
    alignItems: 'center',
    backgroundColor: lightTheme.colors.brandPrimary,
    borderRadius: 100,
    height: 32,
    justifyContent: 'center',
    marginTop: 2,
    width: 32,
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
  searchFieldWrap: {
    flex: 1,
  },
  searchHeaderRow: {
    alignItems: 'center',
    columnGap: lightTheme.spacing[12],
    flexDirection: 'row',
    paddingBottom: lightTheme.spacing[12],
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
  skeletonCompetitionCard: {
    backgroundColor: lightTheme.colors.surfacePrimary,
    borderColor: lightTheme.colors.divider,
    borderRadius: 12,
    borderWidth: 1,
    height: 323.83,
    width: '100%',
  },
  stateWrap: {
    backgroundColor: lightTheme.colors.backgroundPrimary,
    flex: 1,
    paddingHorizontal: lightTheme.spacing[20],
    paddingTop: lightTheme.spacing[20],
  },
});
