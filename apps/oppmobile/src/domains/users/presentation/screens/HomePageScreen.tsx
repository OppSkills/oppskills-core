import { useEffect, useMemo, useState } from 'react';
import { Image, ImageBackground, Modal, Pressable, ScrollView, SectionList, StyleSheet, View } from 'react-native';
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
import Svg, { Path } from 'react-native-svg';
import { AppText, FooterSignatureBlock, OrganizerSidebarDrawer } from '../../../../shared/ui';
import { styles } from './HomePageScreen.styles';

interface HomePageScreenProps {
  readonly onOpenCompetition: () => void;
  readonly onOpenEvent: () => void;
  readonly onOpenHackathon: () => void;
  readonly onOpenProfile: () => void;
  readonly onOpenOrganizerDashboard: () => void;
}

export function HomePageScreen({
  onOpenCompetition,
  onOpenEvent,
  onOpenHackathon,
  onOpenProfile,
  onOpenOrganizerDashboard,
}: HomePageScreenProps) {
  const [homeSidebarOpen, setHomeSidebarOpen] = useState(false);
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

              <View style={styles.headerActions}>
                <View style={styles.headerSearchIcon}>
                  <View style={styles.headerSearchCircle} />
                  <View style={styles.headerSearchHandle} />
                </View>

                <Pressable
                  accessibilityLabel="Open organizer sidebar"
                  hitSlop={8}
                  onPress={() => setHomeSidebarOpen(true)}
                  style={styles.headerMenuButton}
                >
                  <View style={styles.headerMenuLine} />
                  <View style={styles.headerMenuLine} />
                  <View style={styles.headerMenuLine} />
                </Pressable>
              </View>
            </View>

            <SectionTitle
              subtitle="That Move You Forward"
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
            <MiniSectionTitle title="Top Communities" />
            <CommunityRow items={homeFeed?.topCommunities ?? []} />
            <MiniSectionTitle title="Near You" />
            <CommunityRow items={homeFeed?.nearbyCommunities ?? []} />
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

      <OrganizerSidebarDrawer
        activeItemKey="organizer-dashboard"
        items={[{ icon: 'dashboard', key: 'organizer-dashboard', label: 'Organizer Dashboard' }]}
        onClose={() => setHomeSidebarOpen(false)}
        onSelect={() => {
          setHomeSidebarOpen(false);
          onOpenOrganizerDashboard();
        }}
        visible={homeSidebarOpen}
      />

      {/* Home Sidebar */}
      <Modal
        animationType="slide"
        transparent
        visible={false}
        onRequestClose={() => setHomeSidebarOpen(false)}
      >
        <Pressable style={homeSidebarStyles.overlay} onPress={() => setHomeSidebarOpen(false)}>
          <Pressable style={homeSidebarStyles.sidebar} onPress={() => {}}>
            <View style={homeSidebarStyles.sidebarLogo}>
              <AppText variant="bodyStrong">OppSkills</AppText>
            </View>
            <View style={homeSidebarStyles.menuContainer}>
              <Pressable
                style={homeSidebarStyles.menuItem}
                onPress={() => {
                  setHomeSidebarOpen(false);
                  onOpenOrganizerDashboard();
                }}
              >
                <AppText style={homeSidebarStyles.menuIcon}>📊</AppText>
                <AppText variant="label" style={homeSidebarStyles.menuLabel}>
                  Organizer Dashboard
                </AppText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const homeSidebarStyles = StyleSheet.create({
  hamburger: {
    position: 'absolute',
    top: 16,
    left: 20,
    zIndex: 10,
    gap: 4,
    paddingVertical: 4,
  },
  menuLine: {
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#584D5A',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    flexDirection: 'row',
  },
  sidebar: {
    width: 299,
    height: '100%',
    backgroundColor: '#FAFAFA',
    paddingTop: 54,
    borderRightWidth: 1,
    borderRightColor: '#E8E6E8',
  },
  sidebarLogo: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E6E8',
    marginBottom: 8,
  },
  menuContainer: {
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    height: 48,
  },
  menuIcon: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
  },
  menuLabel: {
    color: '#584D5A',
    fontSize: 16,
  },
});

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
      <AppText style={styles.heroSubtitle} variant="sectionHeading">
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

          <Image
            resizeMode="contain"
            source={communityDecorImage}
            style={styles.communityCardDecorImage}
          />
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
              <Svg width={10.08} height={10.08} viewBox="0 0 9 10" fill="none">
                <Path fillRule="evenodd" clipRule="evenodd" d="M4.23701 0C2.43876 0 0.981002 1.45776 0.981002 3.256V3.55182C0.981002 3.84461 0.894334 4.13086 0.73192 4.37448L0.249357 5.09833C-0.310715 5.93843 0.116853 7.08035 1.09096 7.34602C1.40842 7.4326 1.72855 7.50583 2.05054 7.56572L2.05134 7.56788C2.37442 8.42993 3.23791 9.03278 4.23698 9.03278C5.23604 9.03278 6.09954 8.42993 6.42262 7.56788L6.42341 7.56574C6.74542 7.50584 7.06558 7.4326 7.38305 7.34602C8.35716 7.08035 8.78473 5.93844 8.22465 5.09833L7.74209 4.37448C7.57968 4.13086 7.49301 3.84461 7.49301 3.55182V3.256C7.49301 1.45776 6.03525 0 4.23701 0ZM5.65553 7.68289C4.7132 7.79548 3.76075 7.79548 2.81842 7.68289C3.11711 8.11206 3.63663 8.40259 4.23698 8.40259C4.83732 8.40259 5.35684 8.11206 5.65553 7.68289ZM1.6112 3.256C1.6112 1.80581 2.78681 0.630194 4.23701 0.630194C5.6872 0.630194 6.86281 1.80581 6.86281 3.256V3.55182C6.86281 3.96903 6.98631 4.37691 7.21774 4.72405L7.7003 5.44789C8.02177 5.9301 7.77636 6.58554 7.21723 6.73803C5.26605 7.27017 3.20796 7.27017 1.25678 6.73803C0.697656 6.58554 0.452239 5.9301 0.773711 5.44789L1.25627 4.72405C1.4877 4.37691 1.6112 3.96903 1.6112 3.55182V3.256Z" fill="#FAFAFA" />
              </Svg>
              <AppText style={styles.upcomingTrackNotifyLabel} variant="micro">
                Be First to Try
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
