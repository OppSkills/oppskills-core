import { useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import hackathonCategoryButtonImage from '../../../../../assets/Frame 548.png';
import competitionsCategoryButtonImage from '../../../../../assets/Frame 549.png';
import eventsCategoryButtonImage from '../../../../../assets/Frame 550.png';
import communitiesCategoryButtonImage from '../../../../../assets/Frame 551.png';
import eventHeroImage from '../../../../../assets/WhatsApp Image 2026-02-24 at 16.23.33 1.png';
import attendeeOne from '../../../../../assets/iiitd 1.png';
import attendeeTwo from '../../../../../assets/sharda 1.png';
import { useDiscoverFeed } from '../../../discover/presentation/hooks/useDiscoverFeed';
import type { DiscoverCategoryId, DiscoverFeatureEventItem } from '../../../../shared/types/discover';
import { lightTheme } from '../../../../shared/theme';
import { AppText, SearchInput, TopBar } from '../../../../shared/ui';

interface DiscoverEventsPrimaryScreenProps {
  readonly onOpenEventsSecondary: () => void;
  readonly onOpenSearchRecent: () => void;
}

export function DiscoverEventsPrimaryScreen({
  onOpenEventsSecondary,
  onOpenSearchRecent,
}: DiscoverEventsPrimaryScreenProps) {
  return (
    <DiscoverEventsTemplate
      onOpenOtherCategory={onOpenEventsSecondary}
      onOpenSearch={onOpenSearchRecent}
      onOpenVariant={onOpenEventsSecondary}
      preselectedBookmarkedIds={[]}
      retryErrorLabel="Unable to load event listings right now."
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
    <DiscoverEventsTemplate
      onOpenOtherCategory={onOpenEventsPrimary}
      onOpenSearch={onOpenSearchPopular}
      onOpenVariant={onOpenEventsPrimary}
      preselectedBookmarkedIds={['discover-event-feature-2']}
      retryErrorLabel="Unable to load featured events right now."
    />
  );
}

interface DiscoverEventsTemplateProps {
  readonly onOpenSearch: () => void;
  readonly onOpenVariant: () => void;
  readonly onOpenOtherCategory: () => void;
  readonly preselectedBookmarkedIds: readonly string[];
  readonly retryErrorLabel: string;
}

function DiscoverEventsTemplate({
  onOpenSearch,
  onOpenVariant,
  onOpenOtherCategory,
  preselectedBookmarkedIds,
  retryErrorLabel,
}: DiscoverEventsTemplateProps) {
  const { data: discoverFeed, isError, isLoading, refetch } = useDiscoverFeed();
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([...preselectedBookmarkedIds]);

  const eventCards = useMemo(
    () =>
      (discoverFeed?.eventFeatureListings ?? []).slice(0, 3).map((item, index) => ({
        item,
        showFrequency: index === 1,
      })),
    [discoverFeed?.eventFeatureListings],
  );

  const handleCategorySelect = (categoryId: DiscoverCategoryId) => {
    if (categoryId === 'events') {
      return;
    }

    onOpenOtherCategory();
  };

  const toggleBookmark = (itemId: string) => {
    setBookmarkedIds((current) =>
      current.includes(itemId) ? current.filter((value) => value !== itemId) : [...current, itemId],
    );
  };

  return (
    <View style={styles.eventsScreen}>
      <View style={styles.frame544}>
        <TopBar />
        <View style={styles.searchHeaderRow}>
          <Pressable hitSlop={8} onPress={onOpenSearch} style={styles.searchFieldWrap}>
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
          <CategoryTile
            image={competitionsCategoryButtonImage}
            onPress={() => {
              handleCategorySelect('competitions');
            }}
          />
          <CategoryTile image={eventsCategoryButtonImage} />
          <CategoryTile
            image={communitiesCategoryButtonImage}
            onPress={() => {
              handleCategorySelect('communities');
            }}
          />
        </View>

        <View style={styles.frame553}>
          <AppText style={styles.eventsHeading} variant="sectionHeading">
            Events
          </AppText>

          {isError ? (
            <View style={styles.errorCard}>
              <AppText colorToken="textSecondary" variant="caption">
                {retryErrorLabel}
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
              <View style={styles.skeletonEventCard} />
              <View style={styles.skeletonEventCard} />
              <View style={styles.skeletonEventCard} />
            </View>
          ) : (
            <View style={styles.listStack}>
              {eventCards.map(({ item, showFrequency }) => (
                <EventCard
                  bookmarked={bookmarkedIds.includes(item.id)}
                  item={item}
                  key={item.id}
                  onOpen={onOpenVariant}
                  onToggleBookmark={toggleBookmark}
                  showFrequency={showFrequency}
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
    </View>
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

function EventCard({
  item,
  bookmarked,
  showFrequency,
  onToggleBookmark,
  onOpen,
}: {
  readonly item: DiscoverFeatureEventItem;
  readonly bookmarked: boolean;
  readonly showFrequency: boolean;
  readonly onToggleBookmark: (itemId: string) => void;
  readonly onOpen: () => void;
}) {
  return (
    <Pressable onPress={onOpen} style={styles.eventCard}>
      <ImageBackground imageStyle={styles.eventHeroImage} source={eventHeroImage} style={styles.eventHero}>
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

        <View style={styles.venueTag}>
          <AppText style={styles.venueText} variant="caption">
            {item.venue}
          </AppText>
        </View>
      </ImageBackground>

      <View style={styles.descriptionBlock}>
        <View style={styles.detailsOne}>
          <View style={styles.basicDetailsRow}>
            {showFrequency ? (
              <>
                <AppText style={styles.basicMetaText} variant="caption">
                  Frequency
                </AppText>
                <View style={styles.metaDot} />
              </>
            ) : null}
            <AppText style={styles.basicMetaText} variant="caption">
              Next Date
            </AppText>
            <View style={styles.metaDot} />
            <AppText style={styles.basicMetaText} variant="caption">
              Time
            </AppText>
          </View>

          <AppText numberOfLines={2} style={styles.eventTitle} variant="title">
            {item.title}
          </AppText>
        </View>

        <View style={styles.detailsTwo}>
          <View style={styles.metricBlock}>
            <AppText style={styles.metricLabel} variant="caption">
              Attendees
            </AppText>
            <View style={styles.attendeesRow}>
              <View style={styles.attendeesIcons}>
                <Image source={attendeeOne} style={styles.attendeeImage} />
                <Image source={attendeeTwo} style={[styles.attendeeImage, styles.attendeeImageOverlap]} />
              </View>
              <AppText style={styles.metricValue} variant="body">
                {item.attendees}
              </AppText>
            </View>
          </View>

          <View style={styles.metricBlock}>
            <AppText style={styles.metricLabel} variant="caption">
              Register by
            </AppText>
            <AppText style={styles.metricValue} variant="body">
              {item.registerBy}
            </AppText>
          </View>

          <View style={[styles.metricBlock, styles.metricRight]}>
            <AppText style={styles.metricLabel} variant="caption">
              Entry fee
            </AppText>
            <AppText style={styles.metricValue} variant="body">
              {item.entryFee}
            </AppText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  attendeeImage: {
    borderColor: '#FAFAFA',
    borderRadius: 999,
    borderWidth: 1,
    height: 16,
    width: 16,
  },
  attendeeImageOverlap: {
    marginLeft: -4,
  },
  attendeesIcons: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  attendeesRow: {
    alignItems: 'center',
    columnGap: 8,
    flexDirection: 'row',
  },
  basicDetailsRow: {
    alignItems: 'center',
    columnGap: 4.34,
    flexDirection: 'row',
  },
  basicMetaText: {
    color: '#7C737E',
    fontSize: 12,
    lineHeight: 18,
  },
  bookmarkButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(250, 250, 250, 0.9)',
    borderColor: '#FAFAFA',
    borderRadius: 999,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: 10,
    top: 12,
    width: 32,
  },
  bookmarkButtonActive: {
    backgroundColor: '#271B40',
    borderColor: '#271B40',
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
  descriptionBlock: {
    gap: 8,
    height: 146,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  detailsOne: {
    gap: 2,
    height: 70,
    width: '100%',
  },
  detailsTwo: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3.26,
    justifyContent: 'space-between',
    width: '100%',
  },
  errorCard: {
    alignItems: 'center',
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    marginTop: lightTheme.spacing[8],
    padding: lightTheme.spacing[20],
  },
  eventCard: {
    backgroundColor: '#FAFAFA',
    borderColor: '#C3BFC4',
    borderRadius: 12,
    borderWidth: 0.271429,
    overflow: 'hidden',
    width: '100%',
  },
  eventHero: {
    height: 214.76,
    width: '100%',
  },
  eventHeroImage: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  eventTitle: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 25,
    marginTop: 2,
  },
  eventsHeading: {
    color: '#100013',
    width: '100%',
  },
  eventsScreen: {
    backgroundColor: '#FAFAFA',
    flex: 1,
    position: 'relative',
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
    left: 0,
    paddingHorizontal: 20,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 5,
  },
  frame545Content: {
    gap: 40,
    paddingBottom: 120,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  frame545Scroll: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 110,
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
  listStack: {
    gap: 16,
    width: '100%',
  },
  metaDot: {
    backgroundColor: '#A099A1',
    borderRadius: 999,
    height: 2.17,
    width: 2.17,
  },
  metricBlock: {
    gap: 2,
    minWidth: 55,
  },
  metricLabel: {
    color: '#A099A1',
    fontSize: 12,
    lineHeight: 18,
  },
  metricRight: {
    alignItems: 'flex-end',
  },
  metricValue: {
    color: '#584D5A',
    fontSize: 16,
    lineHeight: 24,
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
    justifyContent: 'center',
    marginTop: lightTheme.spacing[12],
    minHeight: 40,
    paddingHorizontal: lightTheme.spacing[16],
  },
  searchFieldWrap: {
    flex: 1,
  },
  searchHeaderRow: {
    alignItems: 'center',
    columnGap: 12,
    flexDirection: 'row',
    paddingBottom: 12,
  },
  skeletonEventCard: {
    backgroundColor: lightTheme.colors.surfacePrimary,
    borderColor: lightTheme.colors.divider,
    borderRadius: 12,
    borderWidth: 1,
    height: 360.76,
    width: '100%',
  },
  venueTag: {
    alignItems: 'center',
    bottom: 8,
    flexDirection: 'row',
    position: 'absolute',
    right: 10,
  },
  venueText: {
    color: '#835BD5',
    fontSize: 12,
    lineHeight: 18,
  },
});
