import { useEffect, useMemo, useState } from 'react';
import { Image, ImageBackground, Pressable, ScrollView, SectionList, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import frame502 from '../../../../../assets/Frame 502.png';
import frame503 from '../../../../../assets/Frame 503.png';
import frame504 from '../../../../../assets/Frame 504.png';
import frame505 from '../../../../../assets/Frame 505.png';
import subtractHeroImage from '../../../../../assets/Subtract.png';
import masterclassHeroImage from '../../../../../assets/highres_490352821 1.png';
import communityLogoImage from '../../../../../assets/image 5.png';
import communityDecorImage from '../../../../../assets/Exclude.png';
import trustedByIith from '../../../../../assets/WhatsApp Image 2026-02-24 at 16.23.33 1.png';
import trustedByIiitd from '../../../../../assets/iiitd 1.png';
import trustedBySharda from '../../../../../assets/sharda 1.png';
import trustedByGims from '../../../../../assets/gims 1.png';
import businessChallengeIllustration from '../../../../../assets/Business challenge-amico 1.png';
import organizingProjectsIllustration from '../../../../../assets/Organizing projects-amico 1.png';
import trackAndFieldIllustration from '../../../../../assets/Track and field-amico 1.png';
import videoTutorialIllustration from '../../../../../assets/Video tutorial-amico 1.png';
import {
  type HomeCommunityItemEntity,
  type HomeEventItemEntity,
  type HomeHighlightItemEntity,
  type HomeOpportunityItemEntity,
  type HomeTrackItemEntity,
} from '../../domain/entities/HomeFeed';
import { useHomeFeed } from '../hooks/useHomeFeed';
import { AppText, FooterSignatureBlock } from '../../../../shared/ui';
import { styles } from './HomePageScreen.styles';

interface HomePageScreenProps {
  readonly onOpenCompetition: () => void;
  readonly onOpenEvent: () => void;
  readonly onOpenHackathon: () => void;
  readonly onOpenProfile: () => void;
}

export function HomePageScreen({
  onOpenCompetition,
  onOpenEvent,
  onOpenHackathon,
  onOpenProfile,
}: HomePageScreenProps) {
  const { data: homeFeed } = useHomeFeed();
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [loadingSections, setLoadingSections] = useState(true);

  useEffect(() => {
    if (activeCategoryId || !homeFeed?.categoryChips[0]?.id) {
      return;
    }

    setActiveCategoryId(homeFeed.categoryChips[0].id);
  }, [activeCategoryId, homeFeed]);

  useEffect(() => {
    const timer = setTimeout(() => setLoadingSections(false), 650);
    return () => clearTimeout(timer);
  }, []);

  const handleCategoryChipPress = (chipId: string) => {
    setActiveCategoryId(chipId);

    if (chipId === 'hackathons') {
      onOpenHackathon();
      return;
    }

    if (chipId === 'competitions') {
      onOpenCompetition();
      return;
    }

    if (chipId === 'events') {
      onOpenEvent();
    }
  };

  const sections = useMemo(
    () => [
      { id: 'hero', data: ['hero'] },
      { id: 'top-opportunities', data: ['top-opportunities'] },
      { id: 'listed-competitions', data: ['listed-competitions'] },
      { id: 'upcoming-events', data: ['upcoming-events'] },
      { id: 'active-communities', data: ['active-communities'] },
      // { id: 'how-works', data: ['how-works'] },
      // { id: 'why-choose', data: ['why-choose'] },
      { id: 'trusted-by', data: ['trusted-by'] },
      { id: 'upcoming-tracks', data: ['upcoming-tracks'] },
      { id: 'footer', data: ['footer'] },
    ],
    [],
  );

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'hero':
        return (
          <View style={styles.heroSection}>
            <View style={styles.profileRow}>
              <Pressable
                accessibilityLabel="Open profile"
                hitSlop={8}
                onPress={onOpenProfile}
                style={styles.profileInfoPressable}
              >
                <View style={styles.avatar}>
                  <AppText colorToken="textInverse" variant="label">
                    RT
                  </AppText>
                </View>
                <View style={styles.profileMeta}>
                  <AppText variant="title">Hello, Rohit Tiwari</AppText>
                  <AppText colorToken="textMuted" numberOfLines={1} variant="caption">
                    Guru Jambheshwar University
                  </AppText>
                </View>
              </Pressable>
              <View style={styles.headerSearchIcon}>
                <View style={styles.headerSearchCircle} />
                <View style={styles.headerSearchHandle} />
              </View>
            </View>

            <SectionTitle
              subtitle="Tap a category to quickly jump across opportunities."
              title="Discover Opportunities"
            />

            <View style={styles.categoryGrid}>
              {(homeFeed?.categoryChips ?? []).map((chip) => {
                const selected = chip.id === activeCategoryId;
                const categoryImageById: Record<string, ImageSourcePropType> = {
                  hackathons: frame502,
                  competitions: frame503,
                  events: frame504,
                  communities: frame505,
                };
                const categoryImage = categoryImageById[chip.id];

                if (categoryImage) {
                  return (
                    <Pressable
                      key={chip.id}
                      onPress={() => handleCategoryChipPress(chip.id)}
                      style={[styles.hackathonCategoryCard, selected ? styles.hackathonCategoryCardActive : null]}
                    >
                      <Image resizeMode="cover" source={categoryImage} style={styles.hackathonCategoryImage} />
                    </Pressable>
                  );
                }

                return (
                  <Pressable
                    key={chip.id}
                    onPress={() => handleCategoryChipPress(chip.id)}
                    style={[styles.categoryCard, selected ? styles.categoryCardActive : null]}
                  >
                    <View style={[styles.categoryIcon, selected ? styles.categoryIconActive : null]} />
                    <AppText
                      colorToken={selected ? 'brandPrimaryStrong' : 'textSecondary'}
                      style={styles.categoryText}
                      variant="caption"
                    >
                      {chip.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      case 'top-opportunities':
        return (
          <SectionBlock
            loading={loadingSections}
            subtitle="Discover the most popular opportunities students are joining right now."
            title="Top Opportunities"
          >
            <ListedCompetitionRail
              emptyLabel="No opportunities yet."
              items={homeFeed?.topOpportunities ?? []}
              onOpenCompetition={onOpenCompetition}
              onOpenEvent={onOpenEvent}
              onOpenHackathon={onOpenHackathon}
            />
            <InlineArrowAction label="View all" />
          </SectionBlock>
        );
      case 'listed-competitions':
        return (
          <SectionBlock
            loading={loadingSections}
            subtitle="Compete in curated listings with clear deadlines and prizes."
            title="Listed Competitions"
          >
            <ListedCompetitionRail
              emptyLabel="No listed competitions available."
              items={homeFeed?.listedCompetitions ?? []}
              onOpenCompetition={onOpenCompetition}
              onOpenEvent={onOpenEvent}
              onOpenHackathon={onOpenHackathon}
            />
            <InlineArrowAction label="View all" />
          </SectionBlock>
        );
      case 'upcoming-events':
        return (
          <SectionBlock
            loading={loadingSections}
            subtitle="Do not miss what is next, stay updated with upcoming events and sessions."
            title="Upcoming Events"
          >
            <EventCardRow items={homeFeed?.upcomingEvents ?? []} onOpenEvent={onOpenEvent} />
            <InlineArrowAction label="View all" />
          </SectionBlock>
        );
      case 'active-communities':
        return (
          <SectionBlock
            loading={loadingSections}
            subtitle="Communities designed for students to learn, contribute, and grow."
            title="Active Communities"
          >
            <View style={styles.communitySubsectionWrapper}>
              <MiniSectionTitle title="Top Communities" />
              <CommunityRow items={homeFeed?.topCommunities ?? []} />
              <Image
                resizeMode="contain"
                source={communityDecorImage}
                style={styles.communityDecorImageTop}
              />
            </View>
            <View style={styles.communitySubsectionWrapper}>
              <MiniSectionTitle title="Near You" />
              <CommunityRow items={homeFeed?.nearbyCommunities ?? []} />
              <Image
                resizeMode="contain"
                source={communityDecorImage}
                style={styles.communityDecorImageNear}
              />
            </View>
            <InlineArrowAction label="View all" />
          </SectionBlock>
        );
      case 'how-works':
        return (
          <SectionBlock
            loading={loadingSections}
            subtitle="A quick breakdown of how students discover and register in minutes."
            title="How OppSkills Works"
          >
            <HighlightCards items={homeFeed?.howOppskillsWorks ?? []} tone="indigo" />
          </SectionBlock>
        );
      case 'why-choose':
        return (
          <SectionBlock
            loading={loadingSections}
            subtitle="Why hustlers pick OppSkills for opportunities across campuses."
            title="Why Hustlers Choose OppSkills"
          >
            <HighlightCards items={homeFeed?.whyHustlersChooseOppskills ?? []} tone="rose" />
          </SectionBlock>
        );
      case 'trusted-by':
        return <TrustedBySection loading={loadingSections} partners={homeFeed?.trustedByPartners ?? []} />;
      case 'upcoming-tracks':
        return (
          <View style={styles.upcomingTracksSection}>
            <View style={styles.upcomingTracksSectionHead}>
              <AppText style={styles.upcomingTracksTitle} variant="sectionHeading">
                Upcoming on OppSkills
              </AppText>
              <AppText style={styles.upcomingTracksSubtitle} variant="caption">
                Oh, this platform is going somewhere
              </AppText>
            </View>

            {loadingSections ? <SectionSkeleton /> : <TrackCards items={homeFeed?.upcomingTracks ?? []} />}
          </View>
        );
      case 'footer':
        return <FooterSignatureBlock compact />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <SectionList
        contentContainerStyle={styles.listContent}
        initialNumToRender={6}
        keyExtractor={(item, index) => `${item}-${index}`}
        maxToRenderPerBatch={6}
        removeClippedSubviews
        renderItem={({ section }) => renderSection(section.id)}
        sections={sections}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        windowSize={7}
      />
    </SafeAreaView>
  );
}

interface SectionBlockProps {
  readonly title: string;
  readonly subtitle: string;
  readonly children: React.ReactNode;
  readonly loading: boolean;
  readonly actionLabel?: string;
}

function SectionBlock({ title, subtitle, children, loading, actionLabel }: SectionBlockProps) {
  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionHeadText}>
          <AppText style={styles.sectionTitle} variant="sectionHeading">
            {title}
          </AppText>
          <AppText colorToken="textSecondary" style={styles.sectionSubtitle} variant="caption">
            {subtitle}
          </AppText>
        </View>
        {actionLabel ? (
          <Pressable style={styles.sectionAction}>
            <AppText colorToken="brandPrimaryStrong" variant="caption">
              {actionLabel}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {loading ? <SectionSkeleton /> : children}
    </View>
  );
}

function SectionTitle({ title, subtitle }: { readonly title: string; readonly subtitle: string }) {
  return (
    <View style={styles.sectionTitleBlock}>
      <AppText style={styles.heroTitle} variant="sectionHeading">
        {title}
      </AppText>
      <AppText colorToken="textSecondary" variant="caption">
        {subtitle}
      </AppText>
    </View>
  );
}

function MiniSectionTitle({ title }: { readonly title: string }) {
  return (
    <AppText style={styles.miniSectionTitle} variant="title">
      {title}
    </AppText>
  );
}

function InlineArrowAction({ label }: { readonly label: string }) {
  return (
    <Pressable style={styles.inlineArrowAction}>
      <AppText colorToken="brandPrimaryStrong" style={styles.inlineArrowActionLabel} variant="label">
        {label}
      </AppText>
      <View style={styles.inlineArrowActionIcon}>
        <View style={styles.inlineArrowActionStrokeUpper} />
        <View style={styles.inlineArrowActionStrokeLower} />
      </View>
    </Pressable>
  );
}

function EventCardRow({
  items,
  onOpenEvent,
}: {
  readonly items: readonly HomeEventItemEntity[];
  readonly onOpenEvent: () => void;
}) {
  if (items.length === 0) {
    return <SectionEmptyState label="No upcoming events available." />;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.horizontalRailContent}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.horizontalRail}
    >
      {items.map((item) => (
        <Pressable key={item.id} onPress={onOpenEvent} style={styles.eventCard}>
          <ImageBackground
            imageStyle={styles.eventHeroImage}
            source={getHomeEventHeroImage(item)}
            style={styles.eventHero}
          >
            <View style={styles.eventHeroOverlay}>
              <View style={styles.eventOnlinePill}>
                <AppText colorToken="brandPrimaryStrong" variant="micro">
                  Offline
                </AppText>
              </View>
              <View style={styles.eventBookmark}>
                <View style={styles.eventBookmarkIcon} />
              </View>
            </View>
          </ImageBackground>

          <View style={styles.eventMeta}>
            <View style={styles.eventBasicDetailsRow}>
              <AppText colorToken="textSecondary" variant="micro">
                {item.venue}
              </AppText>
              <View style={styles.eventBasicDot} />
              <AppText colorToken="textSecondary" variant="micro">
                Next Date
              </AppText>
              <View style={styles.eventBasicDot} />
              <AppText colorToken="textSecondary" variant="micro">
                {item.timing}
              </AppText>
            </View>
            <AppText numberOfLines={2} style={styles.eventTitle} variant="title">
              {item.title}
            </AppText>
            <AppText colorToken="textSecondary" style={styles.eventHost} variant="micro">
              {item.venue}
            </AppText>

            <View style={styles.eventMetricsRow}>
              <Metric label="Attendees" value={`${item.attendees}`} />
              <Metric label="Register by" value={item.timing} />
              <Metric align="right" label="Entry Fee" value="Free" />
            </View>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function ListedCompetitionRail({
  items,
  onOpenCompetition,
  onOpenEvent,
  onOpenHackathon,
  emptyLabel,
}: {
  readonly items: readonly HomeOpportunityItemEntity[];
  readonly onOpenCompetition: () => void;
  readonly onOpenEvent: () => void;
  readonly onOpenHackathon: () => void;
  readonly emptyLabel: string;
}) {
  if (items.length === 0) {
    return <SectionEmptyState label={emptyLabel} />;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.horizontalRailContent}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.horizontalRail}
    >
      {items.map((item) => {
        const openAction =
          item.kind === 'Competition' ? onOpenCompetition : item.kind === 'Event' ? onOpenEvent : onOpenHackathon;

        return (
          <Pressable key={item.id} onPress={openAction} style={styles.listedCompetitionCard}>
            <ImageBackground
              imageStyle={styles.listedCompetitionHeroImage}
              source={getListedCompetitionHeroImage(item)}
              style={styles.listedCompetitionHero}
            >
              <View style={styles.listedCompetitionHeroOverlay}>
                <View style={styles.listedCompetitionModePill}>
                  <AppText colorToken="brandPrimaryStrong" variant="micro">
                    Free
                  </AppText>
                  <View style={styles.listedCompetitionModeDot} />
                  <AppText colorToken="brandPrimaryStrong" variant="micro">
                    Offline
                  </AppText>
                </View>
                <View style={styles.listedCompetitionBookmark}>
                  <View style={styles.listedCompetitionBookmarkIcon} />
                </View>
              </View>
            </ImageBackground>

            <View style={styles.listedCompetitionBody}>
              <View style={styles.listedCompetitionHeaderBlock}>
                <AppText numberOfLines={2} style={styles.listedCompetitionTitle} variant="title">
                  {item.title}
                </AppText>
                <AppText colorToken="textSecondary" variant="micro">
                  {item.host}
                </AppText>
              </View>

              <View style={styles.listedCompetitionMetrics}>
                <Metric label="Register by" value={item.registerBy} />
                <Metric label="Prizes Worth" value={item.prizeLabel} />
              </View>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function getListedCompetitionHeroImage(item: HomeOpportunityItemEntity): ImageSourcePropType {
  if (item.id === 'listed-2' || item.title.toLowerCase().includes('public speaking')) {
    return subtractHeroImage;
  }

  return masterclassHeroImage;
}

function getHomeEventHeroImage(item: HomeEventItemEntity): ImageSourcePropType {
  if (item.id === 'event-2') {
    return subtractHeroImage;
  }

  return masterclassHeroImage;
}

function CommunityRow({ items }: { readonly items: readonly HomeCommunityItemEntity[] }) {
  if (items.length === 0) {
    return <SectionEmptyState label="No communities found for this filter." />;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.communityRailContent}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.communityRail}
    >
      {items.map((item) => (
        <View key={item.id} style={styles.communityRailCard}>
          <View style={styles.communityRailHeaderRow}>
            <Image
              resizeMode="contain"
              source={communityLogoImage}
              style={styles.communityRailLogo}
            />
            <View style={styles.communityLocationPill}>
              <AppText colorToken="brandPrimaryStrong" numberOfLines={1} variant="micro">
                {item.location}
              </AppText>
            </View>
          </View>

          <View style={styles.communityRailTitleBlock}>
            <AppText numberOfLines={1} style={styles.communityRailDomain} variant="caption">
              {item.domain}
            </AppText>
            <AppText numberOfLines={1} style={styles.communityRailName} variant="title">
              {item.name}
            </AppText>
          </View>

          <View style={styles.communityRailMetaRow}>
            <View style={styles.communityRailMetricBlock}>
              <AppText colorToken="textSecondary" variant="micro">
                Members
              </AppText>
              <View style={styles.communityRailMembersRow}>
                <View style={styles.communityRailAvatarA} />
                <View style={styles.communityRailAvatarB} />
                <View style={styles.communityRailAvatarC} />
                <AppText style={styles.communityRailMemberCount} variant="label">
                  {item.members}
                </AppText>
              </View>
            </View>

            <View style={styles.communityRailMetricBlock}>
              <AppText colorToken="textSecondary" variant="micro">
                Register by
              </AppText>
              <AppText numberOfLines={1} style={styles.communityRailMetricValue} variant="label">
                {item.registerBy}
              </AppText>
            </View>
          </View>

          <Pressable style={styles.communityRailButton}>
            <AppText colorToken="brandPrimaryStrong" numberOfLines={1} style={styles.communityRailButtonLabel} variant="caption">
              Explore Now
            </AppText>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

function HighlightCards({
  items,
  tone,
}: {
  readonly items: readonly HomeHighlightItemEntity[];
  readonly tone: 'indigo' | 'rose';
}) {
  if (items.length === 0) {
    return <SectionEmptyState label="No highlights available yet." />;
  }

  const backgroundStyle = tone === 'indigo' ? styles.highlightIndigo : styles.highlightRose;

  return (
    <View style={styles.cardStack}>
      {items.map((item) => (
        <View key={item.id} style={[styles.highlightCard, backgroundStyle]}>
          <AppText style={styles.highlightTitle} variant="title">
            {item.title}
          </AppText>
          <AppText colorToken="textSecondary" variant="body">
            {item.subtitle}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function TrustedByList({ partners }: { readonly partners: readonly string[] }) {
  if (partners.length === 0) {
    return <SectionEmptyState label="Trusted institutions will appear here." />;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.trustedByPartnerRailContent}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.trustedByPartnerRail}
    >
      {partners.map((partner) => (
        (() => {
          const logoSource = getTrustedByPartnerLogo(partner);

          return (
            <View key={partner} style={styles.trustedByPartnerTile}>
              {logoSource ? (
                <Image resizeMode="cover" source={logoSource} style={styles.trustedByPartnerImage} />
              ) : (
                <AppText numberOfLines={1} style={styles.trustedByPartnerMonogram} variant="micro">
                  {getPartnerMonogram(partner)}
                </AppText>
              )}
            </View>
          );
        })()
      ))}
    </ScrollView>
  );
}

function TrustedBySection({
  partners,
  loading,
}: {
  readonly partners: readonly string[];
  readonly loading: boolean;
}) {
  return (
    <View style={styles.trustedBySection}>
      <View style={styles.trustedByTextContainer}>
        <AppText style={styles.trustedByTitle} variant="sectionHeading">
          Trusted by
        </AppText>
        <AppText style={styles.trustedBySubtitle} variant="caption">
          Top colleges already choose oppskills to conduct their events & competitions
        </AppText>
      </View>

      {loading ? <SectionSkeleton /> : <TrustedByList partners={partners} />}
    </View>
  );
}

function getPartnerMonogram(partner: string): string {
  const curatedMonograms: Record<string, string> = {
    'IIT Hyderabad': 'IITH',
    IIITD: 'IIITD',
    'Sharda University': 'SHARDA',
    'Rishihood University': 'RISHI',
    'IILM University': 'IILM',
    'GLA University': 'GLA',
  };

  const curated = curatedMonograms[partner];
  if (curated) {
    return curated;
  }

  const compact = partner
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() ?? '')
    .join('');

  return compact.slice(0, 5);
}

function getTrustedByPartnerLogo(partner: string): ImageSourcePropType | undefined {
  const trustedByLogoByPartner: Record<string, ImageSourcePropType> = {
    'IIT Hyderabad': trustedByIith,
    IIITD: trustedByIiitd,
    'Sharda University': trustedBySharda,
    'IILM University': trustedByGims,
  };

  return trustedByLogoByPartner[partner];
}

function TrackCards({ items }: { readonly items: readonly HomeTrackItemEntity[] }) {
  if (items.length === 0) {
    return <SectionEmptyState label="Tracks are being prepared for this season." />;
  }

  return (
    <View style={styles.upcomingTracksList}>
      {items.map((item, index) => (
        <View key={item.id} style={styles.upcomingTrackCard}>
          <View style={styles.upcomingTrackContent}>
            <View style={styles.upcomingTrackTextWrap}>
              <AppText numberOfLines={1} style={styles.upcomingTrackCardTitle} variant="label">
                {item.title}
              </AppText>
              <AppText numberOfLines={2} style={styles.upcomingTrackCardSubtitle} variant="micro">
                {item.subtitle}
              </AppText>
            </View>

            <Pressable style={styles.upcomingTrackNotifyButton}>
              <View style={styles.upcomingTrackNotifyBell}>
                <View style={styles.upcomingTrackNotifyBellBody} />
                <View style={styles.upcomingTrackNotifyBellTop} />
              </View>
              <AppText style={styles.upcomingTrackNotifyLabel} variant="micro">
                Notify Me
              </AppText>
            </Pressable>
          </View>

          <Image
            resizeMode="contain"
            source={getTrackIllustration(item, index)}
            style={styles.upcomingTrackImage}
          />
        </View>
      ))}
    </View>
  );
}

function getTrackIllustration(item: HomeTrackItemEntity, index: number): ImageSourcePropType {
  const normalizedTitle = item.title.toLowerCase();

  if (normalizedTitle.includes('skill') || normalizedTitle.includes('track')) {
    return trackAndFieldIllustration;
  }

  if (normalizedTitle.includes('mentor')) {
    return videoTutorialIllustration;
  }

  if (normalizedTitle.includes('national') || normalizedTitle.includes('challenge')) {
    return businessChallengeIllustration;
  }

  if (normalizedTitle.includes('creator') || normalizedTitle.includes('organizer')) {
    return organizingProjectsIllustration;
  }

  const fallbackByOrder = [
    trackAndFieldIllustration,
    videoTutorialIllustration,
    businessChallengeIllustration,
    organizingProjectsIllustration,
  ];

  return fallbackByOrder[index] ?? trackAndFieldIllustration;
}

function Metric({
  label,
  value,
  align = 'left',
}: {
  readonly label: string;
  readonly value: string;
  readonly align?: 'left' | 'right';
}) {
  return (
    <View style={[styles.metricBlock, align === 'right' ? styles.metricAlignRight : null]}>
      <AppText colorToken="textMuted" variant="micro">
        {label}
      </AppText>
      <AppText style={styles.metricValue} variant="label">
        {value}
      </AppText>
    </View>
  );
}

function SectionSkeleton() {
  return (
    <View style={styles.skeletonWrapper}>
      <View style={[styles.skeletonBar, styles.skeletonWide]} />
      <View style={[styles.skeletonBar, styles.skeletonMedium]} />
      <View style={[styles.skeletonCard, styles.skeletonTall]} />
      <View style={styles.skeletonCard} />
    </View>
  );
}

function SectionEmptyState({ label }: { readonly label: string }) {
  return (
    <View style={styles.emptyState}>
      <AppText colorToken="textSecondary" style={styles.emptyText} variant="label">
        {label}
      </AppText>
    </View>
  );
}
