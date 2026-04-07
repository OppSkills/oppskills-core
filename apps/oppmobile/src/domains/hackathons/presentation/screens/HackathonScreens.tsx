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

import { useDiscoverFeed } from '../../../discover/presentation/hooks/useDiscoverFeed';
import { useHackathonDetail } from '../hooks/useHackathonDetail';
import type { DiscoverCategoryId } from '../../../../shared/types/discover';
import { lightTheme } from '../../../../shared/theme';
import type { DiscoverOpportunityItem } from '../../../../shared/types/discover';
import { AppText, SearchInput } from '../../../../shared/ui';
import { OpportunityDetailScreen } from '../../../../shared/ui/OpportunityDetailScreen';

import frame548 from '../../../../../assets/Frame 548.png';
import frame549 from '../../../../../assets/Frame 549.png';
import frame550 from '../../../../../assets/Frame 550.png';
import frame551 from '../../../../../assets/Frame 551.png';
import subtractHeroImage from '../../../../../assets/Subtract.png';

interface DiscoverHackathonsScreenProps {
  readonly onOpenCompetitions: () => void;
  readonly onOpenEvents: () => void;
  readonly onOpenHackathonPage: () => void;
  readonly onSearchTyping: () => void;
}

export function DiscoverHackathonsScreen({
  onOpenCompetitions,
  onOpenEvents,
  onOpenHackathonPage,
  onSearchTyping,
}: DiscoverHackathonsScreenProps) {
  const { data: discoverFeed, isError, isLoading, refetch } = useDiscoverFeed();
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

    if (categoryId === 'competitions') {
      onOpenCompetitions();
      return;
    }

    if (categoryId === 'events') {
      onOpenEvents();
      return;
    }

    onSearchTyping();
  };

  const hackathonCards = (discoverFeed?.hackathonListings ?? []).slice(0, 2);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.hackathonScreen}>
      <View style={styles.frame544}>
        <View style={styles.searchHeaderRow}>
          <Pressable hitSlop={8} onPress={onSearchTyping} style={styles.searchFieldWrap}>
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
          <CategoryTile image={frame548} selected />
          <CategoryTile
            image={frame549}
            onPress={() => {
              handleCategorySelect('competitions');
            }}
          />
          <CategoryTile
            image={frame550}
            onPress={() => {
              handleCategorySelect('events');
            }}
          />
          <CategoryTile
            image={frame551}
            onPress={() => {
              handleCategorySelect('communities');
            }}
          />
        </View>

        <View style={styles.frame553}>
          <AppText style={styles.hackathonsHeading} variant="sectionHeading">
            Hackathons
          </AppText>

          {isError ? (
            <View style={styles.errorCard}>
              <AppText colorToken="textSecondary" variant="caption">
                Unable to load hackathons right now.
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
              <View style={styles.skeletonHackathonCard} />
              <View style={styles.skeletonHackathonCard} />
            </View>
          ) : (
            <View style={styles.listStack}>
              {hackathonCards.map((item, index) => (
                <HackathonCard
                  bookmarked={bookmarkedIds.includes(item.id)}
                  image={heroImageByIndex(index)}
                  item={item}
                  key={item.id}
                  onOpenHackathonPage={onOpenHackathonPage}
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
  selected = false,
}: {
  readonly image: ImageSourcePropType;
  readonly onPress?: () => void;
  readonly selected?: boolean;
}) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={[styles.categoryTile, selected ? styles.categoryTileActive : null]}>
      <Image resizeMode="cover" source={image} style={styles.categoryTileImage} />
    </Pressable>
  );
}

function HackathonCard({
  item,
  image,
  bookmarked,
  onToggleBookmark,
  onOpenHackathonPage,
}: {
  readonly item: DiscoverOpportunityItem;
  readonly image: ImageSourcePropType;
  readonly bookmarked: boolean;
  readonly onToggleBookmark: (itemId: string) => void;
  readonly onOpenHackathonPage: () => void;
}) {
  return (
    <Pressable onPress={onOpenHackathonPage} style={styles.hackathonCard}>
      <ImageBackground imageStyle={styles.hackathonHeroImage} source={image} style={styles.hackathonHero}>
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
          <AppText numberOfLines={1} style={styles.hackathonTitle} variant="title">
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

interface HackathonPageScreenProps {
  readonly onBackToDiscover: () => void;
}

export function HackathonPageScreen({ onBackToDiscover }: HackathonPageScreenProps) {
  const { data: detail, isError, isLoading, refetch } = useHackathonDetail();

  if (isLoading) {
    return <DetailLoadingState />;
  }

  if (isError) {
    return (
      <DetailErrorState
        label="Unable to load hackathon details."
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  if (!detail) {
    return <DetailErrorState label="No hackathon details available yet." onRetry={onBackToDiscover} />;
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
    backgroundColor: '#F3EEFF',
    borderColor: '#E2D3FF',
    borderRadius: 8,
    borderWidth: 0.5,
    flex: 1,
    height: 72,
    overflow: 'hidden',
    minWidth: 0,
  },
  categoryTileActive: {
    borderColor: '#CDB5FF',
    borderWidth: 1,
  },
  categoryTileImage: {
    height: 72,
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
    gap: 8,
    width: '100%',
  },
  frame553: {
    gap: 16,
    width: '100%',
  },
  hackathonCard: {
    backgroundColor: '#FAFAFA',
    borderColor: '#C3BFC4',
    borderRadius: 12,
    borderWidth: 0.37,
    overflow: 'hidden',
    width: '100%',
  },
  hackathonHero: {
    height: 214.76,
    width: '100%',
  },
  hackathonHeroImage: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    resizeMode: 'cover',
  },
  hackathonScreen: {
    backgroundColor: '#FAFAFA',
    flex: 1,
    position: 'relative',
  },
  hackathonTitle: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 25,
  },
  hackathonsHeading: {
    color: '#100013',
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
    width: '48%',
  },
  metricLabel: {
    color: '#A099A1',
    fontSize: 12,
    lineHeight: 18,
  },
  metricValue: {
    color: '#584D5A',
    fontSize: 16,
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
    backgroundColor: '#423072',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
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
  skeletonBar: {
    backgroundColor: lightTheme.colors.backgroundSecondary,
    borderRadius: lightTheme.radius.xs,
    height: 10,
    marginTop: lightTheme.spacing[8],
  },
  skeletonHackathonCard: {
    backgroundColor: lightTheme.colors.surfacePrimary,
    borderColor: lightTheme.colors.divider,
    borderRadius: 12,
    borderWidth: 1,
    height: 323.83,
    width: '100%',
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
  searchFieldWrap: {
    flex: 1,
  },
  searchHeaderRow: {
    alignItems: 'center',
    columnGap: 12,
    flexDirection: 'row',
    height: 56,
    paddingBottom: 6,
  },
});
