import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDiscoverFeed } from '../../../discover/presentation/hooks/useDiscoverFeed';
import {
  discoverDefaultRecentListings,
  discoverDefaultTopListings,
} from '../../../../shared/constants/mockDiscover';
import type { DiscoverCompactItem } from '../../../../shared/types/discover';
import { AppText, SearchInput } from '../../../../shared/ui';

import hackathonCategoryButtonImage from '../../../../../assets/Frame 548.png';
import competitionsCategoryButtonImage from '../../../../../assets/Frame 549.png';
import eventsCategoryButtonImage from '../../../../../assets/Frame 550.png';
import communitiesCategoryButtonImage from '../../../../../assets/Frame 551.png';
import listingThumbOne from '../../../../../assets/college campus-amico 1.png';
import listingThumbTwo from '../../../../../assets/Business challenge-amico 1.png';
import listingThumbThree from '../../../../../assets/Learning-amico 1.png';

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
  const { data: discoverFeed, isError, isLoading } = useDiscoverFeed();

  const topListings = discoverFeed?.defaultTopListings ?? discoverDefaultTopListings;
  const recentListings: readonly DiscoverCompactItem[] =
    discoverFeed?.defaultRecentListings?.length === 3
      ? discoverFeed.defaultRecentListings
      : [
          ...(discoverFeed?.defaultRecentListings ?? discoverDefaultRecentListings),
          (discoverFeed?.defaultTopListings ?? discoverDefaultTopListings)[0],
        ]
          .filter((item): item is DiscoverCompactItem => Boolean(item))
          .slice(0, 3);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.searchBarContainer}>
          <Pressable hitSlop={8} onPress={onSearchRecent} style={styles.searchPressable}>
            <View pointerEvents="none">
              <SearchInput editable={false} onChangeText={() => undefined} value="" />
            </View>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.categoryRow}>
            <ImageOnlyCategoryButton image={hackathonCategoryButtonImage} onPress={onHackathons} />
            <ImageOnlyCategoryButton image={competitionsCategoryButtonImage} onPress={onCompetitions} />
            <ImageOnlyCategoryButton image={eventsCategoryButtonImage} onPress={onEventsPrimary} />
            <ImageOnlyCategoryButton image={communitiesCategoryButtonImage} onPress={() => undefined} />
          </View>

          <SectionBlock title="Top Listings">
            {isLoading ? <AppText style={styles.infoLabel}>Loading listings...</AppText> : null}
            {isError ? <AppText style={styles.infoLabel}>Unable to load discover listings right now.</AppText> : null}
            {topListings.slice(0, 3).map((item, index) => (
              <View key={item.id}>
                <ListingCard
                  item={item}
                  onPress={() => {
                    if (item.tagLabel === 'Hackathon') {
                      onHackathons();
                      return;
                    }

                    if (item.tagLabel === 'Event') {
                      onEventsPrimary();
                      return;
                    }

                    onCompetitions();
                  }}
                  thumb={index === 0 ? listingThumbOne : index === 1 ? listingThumbTwo : listingThumbThree}
                />
                {index < 2 ? <View style={styles.listDivider} /> : null}
              </View>
            ))}
          </SectionBlock>

          <SectionBlock title="Recent Listing">
            {recentListings.map((item, index) => (
              <View key={item.id}>
                <ListingCard
                  item={item}
                  onPress={() => {
                    if (item.tagLabel === 'Hackathon') {
                      onHackathons();
                      return;
                    }

                    if (item.tagLabel === 'Event') {
                      onEventsSecondary();
                      return;
                    }

                    onCompetitions();
                  }}
                  thumb={index === 0 ? listingThumbTwo : index === 1 ? listingThumbThree : listingThumbOne}
                />
                {index < recentListings.length - 1 ? <View style={styles.listDivider} /> : null}
              </View>
            ))}
          </SectionBlock>

          <View style={styles.footerBlock}>
            <AppText style={styles.footerTitle} variant="title">
              Global Opportunities. Powered by Skills.
            </AppText>
            <AppText style={styles.footerCaption} variant="caption">
              Made with ❤️ in India
            </AppText>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function SectionBlock({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  return (
    <View style={styles.sectionBlock}>
      <AppText style={styles.sectionHeading} variant="sectionHeading">
        {title}
      </AppText>
      <View style={styles.listStack}>{children}</View>
    </View>
  );
}

function ImageOnlyCategoryButton({
  image,
  onPress,
}: {
  readonly image: ImageSourcePropType;
  readonly onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.imageOnlyCategoryButton}>
      <Image resizeMode="cover" source={image} style={styles.imageOnlyCategoryImage} />
    </Pressable>
  );
}

function ListingCard({
  item,
  onPress,
  thumb,
}: {
  readonly item: DiscoverCompactItem;
  readonly onPress: () => void;
  readonly thumb: ImageSourcePropType;
}) {
  return (
    <Pressable onPress={onPress} style={styles.listingWrap}>
      <View style={styles.listingTop}>
        <Image resizeMode="cover" source={thumb} style={styles.listingThumb} />

        <View style={styles.detailsOne}>
          <AppText numberOfLines={2} style={styles.listingName} variant="bodyStrong">
            {item.title}
          </AppText>

          <View style={styles.metaBlock}>
            <AppText numberOfLines={1} style={styles.institute} variant="micro">
              {item.host}
            </AppText>

            <View style={styles.tagPill}>
              <AppText style={styles.tagText} variant="micro">
                {item.tagLabel}
              </AppText>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.detailsTwo}>
        <MetricBlock label="Register By" value={item.registerBy} />
        <MetricBlock label="Event Date" value={item.eventDate} />
        <MetricBlock align="right" label={item.valueLabel} value={item.value} />
      </View>
    </Pressable>
  );
}

function MetricBlock({
  label,
  value,
  align = 'left',
}: {
  readonly label: string;
  readonly value: string;
  readonly align?: 'left' | 'right';
}) {
  return (
    <View style={[styles.metricBlock, align === 'right' ? styles.metricRight : null]}>
      <AppText style={styles.metricLabel} variant="micro">
        {label}
      </AppText>
      <AppText style={styles.metricValue} variant="caption">
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  categoryCard: {
    alignItems: 'center',
    backgroundColor: '#F3EEFF',
    borderColor: '#E2D3FF',
    borderRadius: 8,
    borderWidth: 0.5,
    height: 72,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    width: 82.25,
  },
  categoryImage: {
    borderRadius: 6,
    height: 32,
    marginBottom: 9,
    width: 64,
  },
  categoryRow: {
    alignSelf: 'stretch',
    columnGap: 8,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: '100%',
  },
  categoryText: {
    color: '#100013',
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 15,
    textAlign: 'center',
  },
  detailsOne: {
    flex: 1,
    height: 76,
  },
  detailsTwo: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 34.47,
    justifyContent: 'space-between',
    marginTop: 8,
    width: '100%',
  },
  footerBlock: {
    gap: 10,
    marginBottom: 24,
    width: 257,
  },
  footerCaption: {
    color: '#584D5A',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  },
  footerTitle: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 25,
  },
  infoLabel: {
    color: '#7C737E',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  imageOnlyCategoryButton: {
    borderRadius: 8,
    flex: 1,
    height: 72,
    minWidth: 0,
    overflow: 'hidden',
  },
  imageOnlyCategoryImage: {
    height: '100%',
    width: '100%',
  },
  institute: {
    color: '#7C737E',
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 15,
  },
  listDivider: {
    borderBottomColor: '#E8E6E8',
    borderBottomWidth: 1,
    marginVertical: 12,
    width: '100%',
  },
  listStack: {
    gap: 0,
    width: '100%',
  },
  listingName: {
    color: '#100013',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 19,
    maxWidth: 187,
  },
  listingThumb: {
    borderRadius: 8.38,
    height: 74,
    marginRight: 12,
    width: 127,
  },
  listingTop: {
    flexDirection: 'row',
    width: '100%',
  },
  listingWrap: {
    borderRadius: 8,
    width: '100%',
  },
  metaBlock: {
    gap: 4,
    marginTop: 4,
  },
  metricBlock: {
    width: 94,
  },
  metricLabel: {
    color: '#A099A1',
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 15,
  },
  metricRight: {
    alignItems: 'flex-end',
  },
  metricValue: {
    color: '#584D5A',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 1.47,
  },
  screen: {
    backgroundColor: '#FAFAFA',
    flex: 1,
  },
  safeArea: {
    backgroundColor: '#FAFAFA',
    flex: 1,
  },
  scrollContent: {
    alignItems: 'stretch',
    gap: 50,
    paddingBottom: 150,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  searchBarContainer: {
    backgroundColor: '#FAFAFA',
    borderBottomColor: '#A099A1',
    borderBottomWidth: 0.5,
    height: 68,
    justifyContent: 'center',
    paddingTop: 6,
    paddingHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  searchPressable: {
    minHeight: 44,
  },
  sectionBlock: {
    alignSelf: 'stretch',
    gap: 20,
    width: '100%',
  },
  sectionHeading: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 24,
    fontWeight: '500',
    lineHeight: 30,
  },
  tagPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E2D3FF',
    borderRadius: 18,
    height: 15,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tagText: {
    color: '#423072',
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 15,
  },
});
