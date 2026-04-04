import { useMemo, useState } from 'react';
import {
  ImageBackground,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import competitionHeroImage from '../../../assets/Business challenge-amico 1.png';
import hackathonHeroImage from '../../../assets/Organizing projects-amico 1.png';
import genericHeroImage from '../../../assets/Track and field-amico 1.png';
import type {
  OpportunityDetailModel,
  OpportunityDetailTabId,
  OpportunityPrizeCard,
  OpportunityRoundCard,
} from '../types/opportunityDetail';
import { lightTheme } from '../theme';
import { AppText } from './AppText';
import { FooterSignatureBlock } from './FooterSignatureBlock';

interface OpportunityDetailScreenProps {
  readonly detail: OpportunityDetailModel;
  readonly onBack: () => void;
}

const detailTabs: readonly { id: OpportunityDetailTabId; label: string }[] = [
  { id: 'rounds', label: 'Rounds Timeline' },
  { id: 'details', label: 'Details' },
  { id: 'prizes', label: 'Prizes' },
  { id: 'contact', label: 'Contact Info' },
];

export function OpportunityDetailScreen({ detail, onBack }: OpportunityDetailScreenProps) {
  const [activeChip, setActiveChip] = useState<OpportunityDetailTabId>('rounds');

  const heroImage = useMemo(() => selectHeroImage(detail), [detail]);
  const eventDate = useMemo(
    () => detail.keyInfo.find((item) => item.id === 'event-date')?.value ?? detail.registrationDeadline,
    [detail.keyInfo, detail.registrationDeadline],
  );
  const eventTime = useMemo(
    () => detail.keyInfo.find((item) => item.id === 'event-time')?.value ?? 'Time will be announced',
    [detail.keyInfo],
  );
  const locationTitle = useMemo(
    () =>
      detail.keyInfo.find((item) => item.id === 'location-name')?.value ??
      detail.keyInfo.find((item) => item.id === 'location')?.value ??
      detail.contact.venue,
    [detail.contact.venue, detail.keyInfo],
  );
  const locationSubtitle = useMemo(
    () => detail.keyInfo.find((item) => item.id === 'location-detail')?.value ?? 'Location',
    [detail.keyInfo],
  );
  const teamSizeValue = useMemo(
    () => detail.keyInfo.find((item) => item.id === 'team-size')?.value ?? '1 to 3 members',
    [detail.keyInfo],
  );
  const secondStatValue = useMemo(
    () =>
      detail.keyInfo.find((item) => item.id === 'impressions')?.value ??
      detail.keyInfo.find((item) => item.id === 'duration')?.value ??
      detail.modeLabel,
    [detail.keyInfo, detail.modeLabel],
  );
  const secondStatLabel = useMemo(
    () =>
      detail.keyInfo.some((item) => item.id === 'impressions')
        ? 'Impressions'
        : detail.keyInfo.some((item) => item.id === 'duration')
          ? 'Duration'
          : 'Mode',
    [detail.keyInfo],
  );
  const thirdStatValue = useMemo(
    () =>
      detail.keyInfo.find((item) => item.id === 'registration-window')?.value ??
      detail.keyInfo.find((item) => item.id === 'entry-fee')?.value ??
      detail.registrationDeadline,
    [detail.keyInfo, detail.registrationDeadline],
  );
  const thirdStatLabel = useMemo(
    () =>
      detail.keyInfo.some((item) => item.id === 'registration-window')
        ? 'Registration Deadline'
        : detail.keyInfo.some((item) => item.id === 'entry-fee')
          ? 'Entry Fee'
          : 'Registration',
    [detail.keyInfo],
  );
  const dateBadge = useMemo(() => extractDateBadge(eventDate), [eventDate]);
  const aboutHeading = useMemo(
    () => detail.aboutHeading ?? `About ${detail.heroLabel || 'Opportunity'}`,
    [detail.aboutHeading, detail.heroLabel],
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.topBar} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ImageBackground imageStyle={styles.heroImageStyle} source={heroImage} style={styles.heroImage}>
          <Pressable onPress={onBack} style={styles.backButton}>
            <AppText colorToken="textPrimary" style={styles.backLabel} variant="bodyStrong">
              {'<'}
            </AppText>
          </Pressable>
        </ImageBackground>

        <View style={styles.mainContainer}>
          <View style={styles.featuredChip}>
            <AppText colorToken="textMuted" style={styles.featuredPrefix} variant="caption">
              Featured in
            </AppText>
            <AppText colorToken="textPrimary" style={styles.featuredValue} variant="caption">
              {detail.hostName}
            </AppText>
          </View>

          <AppText style={styles.pageTitle} variant="displayH2">
            {detail.heroTitle}
          </AppText>

          <View style={styles.registrationCard}>
            <AppText colorToken="textSecondary" style={styles.welcomeText} variant="label">
              Welcome! to join event please register below.
            </AppText>

            <View style={styles.infoList}>
              <DetailInfoRow
                day={dateBadge.day}
                month={dateBadge.month}
                subtitle={eventTime}
                title={eventDate}
              />
              <DetailInfoRow iconLabel="L" subtitle={locationSubtitle} title={locationTitle} />
            </View>

            <View style={styles.quickStatsRow}>
              <MiniStatCard label={teamSizeValue} subtitle="Team Size" />
              <MiniStatCard label={secondStatValue} subtitle={secondStatLabel} />
              <MiniStatCard label={thirdStatValue} subtitle={thirdStatLabel} />
            </View>
          </View>
        </View>

        <View style={styles.participantPanel}>
          <View style={styles.participantRow}>
            <View style={styles.participantAvatar}>
              <AppText colorToken="textInverse" style={styles.participantInitials} variant="label">
                {getInitials(detail.contact.organizerName)}
              </AppText>
            </View>
            <View style={styles.participantMeta}>
              <AppText colorToken="textSecondary" style={styles.participantName} variant="label">
                {detail.contact.organizerName}
              </AppText>
              <AppText colorToken="textSecondary" numberOfLines={1} style={styles.participantEmail} variant="label">
                {detail.contact.email}
              </AppText>
            </View>
          </View>

          <Pressable style={styles.ctaButton}>
            <AppText colorToken="textInverse" style={styles.ctaLabel} variant="bodyStrong">
              {detail.ctaLabel}
            </AppText>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.tabRow}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroller}
        >
          {detailTabs.map((tab) => {
            const isActive = tab.id === activeChip;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveChip(tab.id)}
                style={[styles.tabChip, isActive ? styles.tabChipActive : null]}
              >
                <AppText colorToken={isActive ? 'textInverse' : 'textMuted'} variant="label">
                  {tab.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sectionWrap}>
          <AppText style={styles.sectionHeading} variant="sectionHeading">
            Rounds Timeline
          </AppText>
          <RoundsTimeline rounds={detail.rounds} />
        </View>

        <View style={styles.sectionWrap}>
          <AppText style={styles.sectionHeading} variant="sectionHeading">
            {aboutHeading}
          </AppText>

          <View style={styles.aboutCard}>
            {detail.aboutParagraphs.map((paragraph) => (
              <AppText colorToken="textSecondary" key={paragraph} style={styles.aboutParagraph} variant="label">
                {paragraph}
              </AppText>
            ))}

            <AppText style={styles.aboutSubHeading} variant="bodyStrong">
              Eligibility
            </AppText>
            {detail.eligibility.map((item) => (
              <BulletText key={item} text={item} />
            ))}

            <AppText style={styles.aboutSubHeading} variant="bodyStrong">
              Rules and Guidelines
            </AppText>
            {detail.rules.map((item) => (
              <BulletText key={item} text={item} />
            ))}
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <AppText style={styles.sectionHeading} variant="sectionHeading">
            Contact Information
          </AppText>

          <View style={styles.contactStack}>
            <ContactCard
              initials={getInitials(detail.contact.organizerName)}
              name={detail.contact.organizerName}
              primary={detail.contact.phoneNumber}
              secondary={detail.contact.email}
            />
            <ContactCard
              initials="VD"
              name="Venue Desk"
              primary={detail.contact.venue}
              secondary={`Mode: ${detail.modeLabel}`}
            />
          </View>
        </View>

        <View style={styles.sectionWrap}>
          <AppText style={styles.sectionHeading} variant="sectionHeading">
            Prizes
          </AppText>

          <View style={styles.prizeStack}>
            {detail.prizes.map((prize) => (
              <PrizeCard key={prize.id} prize={prize} />
            ))}
          </View>
        </View>

        <FooterSignatureBlock compact />
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailInfoRow({
  title,
  subtitle,
  iconLabel,
  month,
  day,
}: {
  readonly title: string;
  readonly subtitle: string;
  readonly iconLabel?: string;
  readonly month?: string;
  readonly day?: string;
}) {
  const hasDateBadge = Boolean(month && day);

  return (
    <View style={styles.infoRow}>
      {hasDateBadge ? (
        <View style={styles.calendarBadge}>
          <View style={styles.calendarMonthStrip}>
            <AppText colorToken="textSecondary" style={styles.calendarMonth} variant="micro">
              {month}
            </AppText>
          </View>
          <View style={styles.calendarDayWrap}>
            <AppText colorToken="textPrimary" style={styles.calendarDay} variant="label">
              {day}
            </AppText>
          </View>
        </View>
      ) : (
        <View style={styles.iconBadge}>
          <AppText colorToken="textPrimary" style={styles.iconBadgeLabel} variant="bodyStrong">
            {iconLabel ?? 'I'}
          </AppText>
        </View>
      )}

      <View style={styles.infoTextBlock}>
        <AppText colorToken="textPrimary" style={styles.infoTitle} variant="label">
          {title}
        </AppText>
        <AppText colorToken="textMuted" style={styles.infoSubtitle} variant="caption">
          {subtitle}
        </AppText>
      </View>
    </View>
  );
}

function MiniStatCard({ label, subtitle }: { readonly label: string; readonly subtitle: string }) {
  return (
    <View style={styles.quickStatCard}>
      <AppText colorToken="textPrimary" style={styles.quickStatLabel} variant="label">
        {label}
      </AppText>
      <AppText colorToken="textMuted" style={styles.quickStatSubtitle} variant="caption">
        {subtitle}
      </AppText>
    </View>
  );
}

function RoundsTimeline({ rounds }: { readonly rounds: readonly OpportunityRoundCard[] }) {
  return (
    <View style={styles.timelineStack}>
      {rounds.map((round, index) => (
        <TimelineRoundCard key={round.id} round={round} showConnector={index < rounds.length - 1} />
      ))}
    </View>
  );
}

function TimelineRoundCard({
  round,
  showConnector,
}: {
  readonly round: OpportunityRoundCard;
  readonly showConnector: boolean;
}) {
  const timelineParts = splitRoundTimeline(round.timeline);

  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineTrackColumn}>
        <View style={styles.timelineDotOuter}>
          <View style={styles.timelineDotInner} />
        </View>
        {showConnector ? <View style={styles.timelineConnector} /> : <View style={styles.timelineConnectorSpacer} />}
      </View>

      <View style={styles.roundCard}>
        <View style={styles.roundTagChip}>
          <AppText colorToken="brandPrimaryStrong" style={styles.roundTagLabel} variant="caption">
            {round.stageLabel}
          </AppText>
        </View>

        <AppText style={styles.roundTitle} variant="label">
          {round.title}
        </AppText>

        <AppText colorToken="textSecondary" style={styles.roundDescription} variant="caption">
          {round.checkpoints[0] ?? 'Round details will be updated shortly.'}
        </AppText>

        <RoundDateLine label={`Start: ${timelineParts.start}`} />
        <RoundDateLine label={`End: ${timelineParts.end}`} />
      </View>
    </View>
  );
}

function RoundDateLine({ label }: { readonly label: string }) {
  return (
    <View style={styles.roundDateLine}>
      <View style={styles.roundDateIcon}>
        <AppText colorToken="textSecondary" style={styles.roundDateIconLabel} variant="micro">
          D
        </AppText>
      </View>
      <AppText colorToken="textSecondary" style={styles.roundDateText} variant="caption">
        {label}
      </AppText>
    </View>
  );
}

function BulletText({ text }: { readonly text: string }) {
  return (
    <View style={styles.bulletRow}>
      <View style={styles.bulletDot} />
      <AppText colorToken="textSecondary" style={styles.bulletText} variant="caption">
        {text}
      </AppText>
    </View>
  );
}

function ContactCard({
  initials,
  name,
  primary,
  secondary,
}: {
  readonly initials: string;
  readonly name: string;
  readonly primary: string;
  readonly secondary: string;
}) {
  return (
    <View style={styles.contactCard}>
      <View style={styles.contactAvatar}>
        <AppText colorToken="textInverse" style={styles.contactInitials} variant="label">
          {initials}
        </AppText>
      </View>

      <View style={styles.contactDetails}>
        <AppText style={styles.contactName} variant="bodyStrong">
          {name}
        </AppText>
        <AppText colorToken="textSecondary" style={styles.contactMeta} variant="caption">
          {primary}
        </AppText>
        <AppText colorToken="textSecondary" style={styles.contactMeta} variant="caption">
          {secondary}
        </AppText>
      </View>
    </View>
  );
}

function PrizeCard({ prize }: { readonly prize: OpportunityPrizeCard }) {
  return (
    <View style={styles.prizeCard}>
      <View style={styles.prizeMetaBlock}>
        <AppText colorToken="textSecondary" style={styles.prizeRank} variant="label">
          {prize.rankLabel}
        </AppText>
        <AppText style={styles.prizeReward} variant="title">
          {prize.reward}
        </AppText>

        <View style={styles.prizeBonusChip}>
          <AppText colorToken="textSecondary" style={styles.prizeBonusLabel} variant="caption">
            {prize.bonusLabel}
          </AppText>
        </View>
      </View>

      <View style={styles.prizeOrb}>
        <AppText colorToken="textInverse" style={styles.prizeOrbLabel} variant="title">
          {rankGlyph(prize.rankLabel)}
        </AppText>
      </View>
    </View>
  );
}

function selectHeroImage(detail: OpportunityDetailModel): ImageSourcePropType {
  const tag = `${detail.heroLabel} ${detail.routeLabel}`.toLowerCase();

  if (tag.includes('competition')) {
    return competitionHeroImage;
  }

  if (tag.includes('hackathon')) {
    return hackathonHeroImage;
  }

  return genericHeroImage;
}

function splitRoundTimeline(timeline: string): { start: string; end: string } {
  const separator = ' - ';

  if (!timeline.includes(separator)) {
    return { end: timeline, start: timeline };
  }

  const [start, end] = timeline.split(separator);
  return {
    end: end?.trim() || timeline,
    start: start?.trim() || timeline,
  };
}

function extractDateBadge(registrationDeadline: string): { day: string; month: string } {
  const dayMatch = registrationDeadline.match(/\b([0-3]?\d)(?:st|nd|rd|th)?\b/i);
  const monthMatch = registrationDeadline.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i,
  );

  return {
    day: dayMatch?.[1] ?? '--',
    month: (monthMatch?.[1] ?? '---').slice(0, 3).toUpperCase(),
  };
}

function rankGlyph(rankLabel: string): string {
  const normalized = rankLabel.toLowerCase();

  if (normalized.includes('winner')) {
    return 'W';
  }

  if (normalized.includes('1st')) {
    return '1';
  }

  if (normalized.includes('2nd')) {
    return '2';
  }

  return rankLabel.charAt(0).toUpperCase() || 'P';
}

function getInitials(name: string): string {
  const words = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '');

  return words.join('') || 'OP';
}

const styles = StyleSheet.create({
  aboutCard: {
    gap: lightTheme.spacing[8],
    paddingBottom: lightTheme.spacing[8],
  },
  aboutParagraph: {
    fontSize: 14,
    lineHeight: 21,
  },
  aboutSubHeading: {
    color: '#342636',
    marginTop: lightTheme.spacing[12],
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 24,
    height: 32,
    justifyContent: 'center',
    left: 13,
    position: 'absolute',
    top: 11,
    width: 32,
  },
  backLabel: {
    color: '#342636',
    fontSize: 18,
    lineHeight: 20,
    marginTop: -2,
  },
  bulletDot: {
    backgroundColor: '#AC89F2',
    borderRadius: lightTheme.radius.pill,
    height: 6,
    marginTop: 5,
    width: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: lightTheme.spacing[8],
  },
  bulletText: {
    flex: 1,
    lineHeight: 18,
  },
  calendarBadge: {
    backgroundColor: '#FAFAFA',
    borderColor: '#C3BFC4',
    borderRadius: 8,
    borderWidth: 0.25,
    height: 44,
    overflow: 'hidden',
    width: 44,
  },
  calendarDay: {
    fontSize: 14,
    lineHeight: 21,
  },
  calendarDayWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  calendarMonth: {
    fontSize: 10,
    lineHeight: 15,
  },
  calendarMonthStrip: {
    alignItems: 'center',
    backgroundColor: '#EDEDED',
    justifyContent: 'center',
    minHeight: 15,
  },
  contactAvatar: {
    alignItems: 'center',
    backgroundColor: '#271B40',
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  contactCard: {
    alignItems: 'center',
    backgroundColor: '#F3EEFF',
    borderColor: '#835BD5',
    borderRadius: 12,
    borderWidth: 0.5,
    flexDirection: 'row',
    gap: lightTheme.spacing[16],
    minHeight: 85,
    padding: lightTheme.spacing[12],
  },
  contactDetails: {
    flex: 1,
    gap: 2,
  },
  contactInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  contactMeta: {
    color: '#584D5A',
    lineHeight: 18,
  },
  contactName: {
    color: '#100013',
    fontSize: 16,
    lineHeight: 19,
  },
  contactStack: {
    gap: lightTheme.spacing[12],
  },
  ctaButton: {
    alignItems: 'center',
    backgroundColor: '#423072',
    borderRadius: 100,
    height: 48,
    justifyContent: 'center',
    width: '100%',
  },
  ctaLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 19,
  },
  featuredChip: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EDEDED',
    borderRadius: 8,
    flexDirection: 'row',
    gap: lightTheme.spacing[4],
    minHeight: 26,
    paddingHorizontal: lightTheme.spacing[12],
    paddingVertical: lightTheme.spacing[4],
  },
  featuredPrefix: {
    color: '#7C737E',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  },
  featuredValue: {
    color: '#342636',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 14,
  },
  heroImage: {
    backgroundColor: '#F2F2F3',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    height: 234,
    overflow: 'hidden',
    width: '100%',
  },
  heroImageStyle: {
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  iconBadge: {
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderColor: '#C3BFC4',
    borderRadius: 8,
    borderWidth: 0.25,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  iconBadgeLabel: {
    color: '#342636',
    fontSize: 13,
    lineHeight: 17,
  },
  infoList: {
    gap: lightTheme.spacing[12],
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: lightTheme.spacing[12],
  },
  infoSubtitle: {
    color: '#7C737E',
    lineHeight: 18,
  },
  infoTextBlock: {
    flex: 1,
    gap: 2,
  },
  infoTitle: {
    color: '#342636',
    lineHeight: 17,
  },
  mainContainer: {
    gap: lightTheme.spacing[16],
    paddingHorizontal: lightTheme.spacing[20],
    paddingTop: lightTheme.spacing[20],
  },
  pageTitle: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 28,
    lineHeight: 35,
  },
  participantAvatar: {
    alignItems: 'center',
    backgroundColor: '#271B40',
    borderRadius: 20,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  participantEmail: {
    color: '#584D5A',
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
  participantInitials: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 14,
  },
  participantMeta: {
    flex: 1,
    flexDirection: 'row',
    gap: lightTheme.spacing[8],
  },
  participantName: {
    color: '#584D5A',
    fontSize: 14,
    lineHeight: 17,
  },
  participantPanel: {
    backgroundColor: '#F3EEFF',
    borderColor: '#6949AA',
    borderRadius: 26,
    borderWidth: 0.5,
    gap: lightTheme.spacing[8],
    marginHorizontal: lightTheme.spacing[16],
    marginTop: lightTheme.spacing[12],
    paddingBottom: lightTheme.spacing[4],
    paddingHorizontal: lightTheme.spacing[4],
    paddingTop: lightTheme.spacing[8],
  },
  participantRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: lightTheme.spacing[8],
    paddingHorizontal: lightTheme.spacing[8],
  },
  prizeBonusChip: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F3EEFF',
    borderColor: '#E2D3FF',
    borderRadius: 22,
    borderWidth: 0.25,
    marginTop: lightTheme.spacing[8],
    minHeight: 26,
    justifyContent: 'center',
    paddingHorizontal: lightTheme.spacing[8],
  },
  prizeBonusLabel: {
    color: '#584D5A',
    lineHeight: 18,
  },
  prizeCard: {
    backgroundColor: '#FAFAFA',
    borderColor: '#C3BFC4',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 140,
    paddingHorizontal: lightTheme.spacing[12],
    paddingVertical: lightTheme.spacing[12],
  },
  prizeMetaBlock: {
    flex: 1,
    justifyContent: 'space-between',
    paddingRight: lightTheme.spacing[8],
  },
  prizeOrb: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#0C0114',
    borderRadius: lightTheme.radius.pill,
    height: 74,
    justifyContent: 'center',
    width: 74,
  },
  prizeOrbLabel: {
    color: '#FFFFFF',
    fontFamily: 'Aeonik Pro',
    fontSize: 24,
    lineHeight: 30,
  },
  prizeRank: {
    color: '#584D5A',
    fontSize: 14,
    lineHeight: 21,
  },
  prizeReward: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 20,
    lineHeight: 25,
  },
  prizeStack: {
    gap: lightTheme.spacing[12],
  },
  quickStatCard: {
    flex: 1,
    minWidth: 0,
  },
  quickStatLabel: {
    color: '#342636',
    fontSize: 14,
    lineHeight: 17,
  },
  quickStatSubtitle: {
    color: '#7C737E',
    lineHeight: 18,
    marginTop: 2,
  },
  quickStatsRow: {
    borderTopColor: '#E1DEE8',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: lightTheme.spacing[12],
    paddingTop: lightTheme.spacing[12],
  },
  registrationCard: {
    backgroundColor: '#FAFAFA',
    borderColor: '#C3BFC4',
    borderRadius: 16,
    borderWidth: 0.5,
    gap: lightTheme.spacing[16],
    padding: lightTheme.spacing[16],
  },
  roundCard: {
    borderColor: '#C3BFC4',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: lightTheme.spacing[8],
    padding: lightTheme.spacing[12],
  },
  roundDateIcon: {
    alignItems: 'center',
    borderColor: '#584D5A',
    borderRadius: 3,
    borderWidth: 1,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  roundDateIconLabel: {
    color: '#584D5A',
    fontSize: 8,
    lineHeight: 10,
  },
  roundDateLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: lightTheme.spacing[8],
  },
  roundDateText: {
    color: '#584D5A',
    lineHeight: 18,
  },
  roundDescription: {
    color: '#584D5A',
    lineHeight: 18,
    marginBottom: 2,
  },
  roundTagChip: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F3EEFF',
    borderRadius: 4,
    minHeight: 22,
    justifyContent: 'center',
    paddingHorizontal: lightTheme.spacing[8],
  },
  roundTagLabel: {
    color: '#423072',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  },
  roundTitle: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 20,
  },
  safeArea: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  scrollContent: {
    paddingBottom: lightTheme.spacing[40],
  },
  sectionHeading: {
    color: '#342636',
    fontFamily: 'Aeonik Pro',
    fontSize: 24,
    lineHeight: 30,
  },
  sectionWrap: {
    gap: lightTheme.spacing[16],
    paddingHorizontal: lightTheme.spacing[20],
    paddingTop: lightTheme.spacing[20],
  },
  tabChip: {
    alignItems: 'center',
    borderColor: '#C3BFC4',
    borderRadius: 41,
    borderWidth: 0.5,
    justifyContent: 'center',
    minHeight: 37,
    paddingHorizontal: lightTheme.spacing[12],
  },
  tabChipActive: {
    backgroundColor: '#423072',
    borderColor: '#423072',
  },
  tabRow: {
    alignItems: 'center',
    gap: lightTheme.spacing[12],
    paddingHorizontal: lightTheme.spacing[20],
    paddingRight: lightTheme.spacing[24],
  },
  tabScroller: {
    marginTop: lightTheme.spacing[16],
  },
  timelineConnector: {
    backgroundColor: '#E2D3FF',
    flex: 1,
    marginTop: 2,
    width: 2,
  },
  timelineConnectorSpacer: {
    flex: 1,
    marginTop: 2,
    width: 2,
  },
  timelineDotInner: {
    backgroundColor: '#AC89F2',
    borderRadius: lightTheme.radius.pill,
    height: 6,
    width: 6,
  },
  timelineDotOuter: {
    alignItems: 'center',
    borderColor: '#6949AA',
    borderRadius: lightTheme.radius.pill,
    borderWidth: 0.5,
    height: 10,
    justifyContent: 'center',
    width: 10,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: lightTheme.spacing[8],
  },
  timelineStack: {
    gap: lightTheme.spacing[20],
  },
  timelineTrackColumn: {
    alignItems: 'center',
    width: 12,
  },
  topBar: {
    backgroundColor: '#F2F2F3',
    height: 6,
    width: '100%',
  },
  welcomeText: {
    color: '#584D5A',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
  },
});
