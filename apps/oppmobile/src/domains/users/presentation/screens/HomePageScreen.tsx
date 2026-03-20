import { useEffect, useMemo, useState } from 'react';
import { Pressable, SectionList, View } from 'react-native';

import {
  type HomeCommunityItemEntity,
  type HomeEventItemEntity,
  type HomeHighlightItemEntity,
  type HomeOpportunityItemEntity,
  type HomeTrackItemEntity,
} from '../../domain/entities/HomeFeed';
import { useHomeFeed } from '../hooks/useHomeFeed';
import { AppText, FooterSignatureBlock, SearchInput, TopBar } from '../../../../shared/ui';
import { styles } from './HomePageScreen.styles';

interface HomePageScreenProps {
  readonly onOpenCompetition: () => void;
  readonly onOpenHackathon: () => void;
  readonly onRestartOnboarding: () => void;
}

export function HomePageScreen({
  onOpenCompetition,
  onOpenHackathon,
  onRestartOnboarding,
}: HomePageScreenProps) {
  const { data: homeFeed } = useHomeFeed();
  const [query, setQuery] = useState('');
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

  const sections = useMemo(
    () => [
      { id: 'hero', data: ['hero'] },
      { id: 'top-opportunities', data: ['top-opportunities'] },
      { id: 'listed-competitions', data: ['listed-competitions'] },
      { id: 'upcoming-events', data: ['upcoming-events'] },
      { id: 'active-communities', data: ['active-communities'] },
      { id: 'how-works', data: ['how-works'] },
      { id: 'why-choose', data: ['why-choose'] },
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
              <Pressable onPress={onRestartOnboarding} style={styles.resetChip}>
                <AppText colorToken="brandPrimaryStrong" variant="caption">
                  Reset
                </AppText>
              </Pressable>
            </View>

            <SearchInput
              autoCapitalize="none"
              onChangeText={setQuery}
              placeholder="Search opportunities"
              returnKeyType="search"
              value={query}
            />

            <SectionTitle
              subtitle="Tap a category to quickly jump across opportunities."
              title="Discover Opportunities"
            />

            <View style={styles.categoryGrid}>
              {(homeFeed?.categoryChips ?? []).map((chip) => {
                const selected = chip.id === activeCategoryId;

                return (
                  <Pressable
                    key={chip.id}
                    onPress={() => setActiveCategoryId(chip.id)}
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
            actionLabel="View all"
            loading={loadingSections}
            subtitle="Discover the most popular opportunities students are joining right now."
            title="Top Opportunities"
          >
            <OpportunityList
              emptyLabel="No opportunities yet."
              items={homeFeed?.topOpportunities ?? []}
              onOpenCompetition={onOpenCompetition}
              onOpenHackathon={onOpenHackathon}
            />
          </SectionBlock>
        );
      case 'listed-competitions':
        return (
          <SectionBlock
            actionLabel="View all"
            loading={loadingSections}
            subtitle="Compete in curated listings with clear deadlines and prizes."
            title="Listed Competitions"
          >
            <OpportunityList
              emptyLabel="No listed competitions available."
              items={homeFeed?.listedCompetitions ?? []}
              onOpenCompetition={onOpenCompetition}
              onOpenHackathon={onOpenHackathon}
            />
          </SectionBlock>
        );
      case 'upcoming-events':
        return (
          <SectionBlock
            actionLabel="View all"
            loading={loadingSections}
            subtitle="Do not miss what is next, stay updated with upcoming events and sessions."
            title="Upcoming Events"
          >
            <EventCardRow items={homeFeed?.upcomingEvents ?? []} />
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
        return (
          <SectionBlock
            loading={loadingSections}
            subtitle="Top colleges already choose OppSkills to conduct opportunities and events."
            title="Trusted By"
          >
            <TrustedByList partners={homeFeed?.trustedByPartners ?? []} />
          </SectionBlock>
        );
      case 'upcoming-tracks':
        return (
          <SectionBlock
            loading={loadingSections}
            subtitle="On this platform, ongoing opportunities evolve into skill tracks."
            title="Upcoming on OppSkills"
          >
            <TrackCards items={homeFeed?.upcomingTracks ?? []} />
          </SectionBlock>
        );
      case 'footer':
        return <FooterSignatureBlock compact />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.screen}>
      <TopBar />
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
    </View>
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

function OpportunityList({
  items,
  onOpenCompetition,
  onOpenHackathon,
  emptyLabel,
}: {
  readonly items: readonly HomeOpportunityItemEntity[];
  readonly onOpenCompetition: () => void;
  readonly onOpenHackathon: () => void;
  readonly emptyLabel: string;
}) {
  if (items.length === 0) {
    return <SectionEmptyState label={emptyLabel} />;
  }

  return (
    <View style={styles.cardStack}>
      {items.map((item) => {
        const openAction = item.kind === 'Competition' ? onOpenCompetition : onOpenHackathon;

        return (
          <Pressable key={item.id} onPress={openAction} style={styles.opportunityCard}>
            <View style={styles.opportunityThumb} />
            <View style={styles.opportunityMeta}>
              <AppText numberOfLines={2} style={styles.opportunityTitle} variant="title">
                {item.title}
              </AppText>
              <AppText colorToken="textMuted" style={styles.opportunityHost} variant="caption">
                {item.host}
              </AppText>
              <View style={styles.kindChip}>
                <AppText colorToken="brandPrimaryStrong" variant="micro">
                  {item.kind}
                </AppText>
              </View>
              <View style={styles.metricRow}>
                <Metric label="Event Date" value={item.eventDate} />
                <Metric label="Register by" value={item.registerBy} />
                <Metric align="right" label="Prizes" value={item.prizeLabel} />
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function EventCardRow({ items }: { readonly items: readonly HomeEventItemEntity[] }) {
  if (items.length === 0) {
    return <SectionEmptyState label="No upcoming events available." />;
  }

  return (
    <View style={styles.cardStack}>
      {items.map((item) => (
        <View key={item.id} style={styles.eventCard}>
          <View style={styles.eventHero}>
            <View style={styles.eventVenuePill}>
              <AppText colorToken="brandPrimaryStrong" variant="micro">
                {item.venue}
              </AppText>
            </View>
          </View>

          <View style={styles.eventMeta}>
            <AppText colorToken="textMuted" variant="caption">
              {item.timing}
            </AppText>
            <AppText style={styles.eventTitle} variant="title">
              {item.title}
            </AppText>

            <View style={styles.metricRow}>
              <Metric label="Attendees" value={`${item.attendees}`} />
              <Metric label="Register by" value="20 Dec 2024" />
              <Metric align="right" label="Entry Fee" value="Free" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function CommunityRow({ items }: { readonly items: readonly HomeCommunityItemEntity[] }) {
  if (items.length === 0) {
    return <SectionEmptyState label="No communities found for this filter." />;
  }

  return (
    <View style={styles.communityRow}>
      {items.map((item) => (
        <View key={item.id} style={styles.communityCard}>
          <View style={styles.communityHeader}>
            <View style={styles.communityGlyph} />
            <View style={styles.locationPill}>
              <AppText colorToken="brandPrimaryStrong" numberOfLines={1} variant="micro">
                {item.location}
              </AppText>
            </View>
          </View>

          <AppText colorToken="textMuted" variant="caption">
            {item.domain}
          </AppText>
          <AppText numberOfLines={1} style={styles.communityName} variant="title">
            {item.name}
          </AppText>

          <View style={styles.communityMetaRow}>
            <Metric label="Members" value={`${item.members}`} />
            <Metric align="right" label="Register by" value={item.registerBy} />
          </View>

          <Pressable style={styles.communityButton}>
            <AppText colorToken="brandPrimaryStrong" variant="caption">
              Explore Now
            </AppText>
          </Pressable>
        </View>
      ))}
    </View>
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
    <View style={styles.partnerRow}>
      {partners.map((partner) => (
        <View key={partner} style={styles.partnerChip}>
          <AppText numberOfLines={1} style={styles.partnerText} variant="caption">
            {partner}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function TrackCards({ items }: { readonly items: readonly HomeTrackItemEntity[] }) {
  if (items.length === 0) {
    return <SectionEmptyState label="Tracks are being prepared for this season." />;
  }

  return (
    <View style={styles.cardStack}>
      {items.map((item) => (
        <View key={item.id} style={styles.trackCard}>
          <View style={styles.trackBadge}>
            <AppText colorToken="textInverse" variant="micro">
              New Track
            </AppText>
          </View>
          <AppText style={styles.trackTitle} variant="title">
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
