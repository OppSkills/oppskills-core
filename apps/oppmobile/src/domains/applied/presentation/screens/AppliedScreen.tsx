import { Feather } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ImageBackground, Pressable, ScrollView, StyleSheet, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  type AppliedCardItemEntity,
  type AppliedFilterIdEntity,
  type AppliedTimelineStageEntity,
} from '../../domain/entities/AppliedFeed';
import appliedCardThumbnailImage from '../../../../../assets/Frame 455.png';
import { useAppliedFeed } from '../hooks/useAppliedFeed';
import { useCurrentUser } from '../../../users/presentation/hooks/useCurrentUser';
import { lightTheme } from '../../../../shared/theme';
import { AppText, FooterSignatureBlock } from '../../../../shared/ui';

interface AppliedScreenProps {
  readonly onOpenCompetition: (id: string) => void;
  readonly onOpenHackathon: (id: string) => void;
  readonly onOpenEvent: (id: string) => void;
  readonly onSignOut: () => void;
  readonly onBackToProfile?: () => void;
  readonly variant?: 'default' | 'achievements' | 'registrations';
}

type AchievementCardItem = AppliedCardItemEntity & {
  readonly position: string;
};

export function AppliedScreen({
  onBackToProfile,
  onOpenCompetition,
  onOpenHackathon,
  onOpenEvent,
  onSignOut,
  variant = 'default',
}: AppliedScreenProps) {
  const { data: appliedFeed, isError, isLoading, refetch } = useAppliedFeed();
  const { data: currentUser } = useCurrentUser();
  const [activeFilterId, setActiveFilterId] = useState<AppliedFilterIdEntity>('all');
  const [submittingCardId, setSubmittingCardId] = useState<string | undefined>();
  const appliedFilters = appliedFeed?.filters ?? [];
  const appliedTimelineStages = appliedFeed?.timelineStages ?? [];
  const appliedCardItems = useMemo(() => appliedFeed?.cards ?? [], [appliedFeed]);

  const filteredItems = useMemo(
    () =>
      activeFilterId === 'all'
        ? appliedCardItems
        : appliedCardItems.filter((item) => item.category === activeFilterId),
    [activeFilterId, appliedCardItems],
  );
  const achievementItems = useMemo<readonly AchievementCardItem[]>(
    () => [
      { ...appliedCardItems[0], position: '2nd Place' },
      { ...appliedCardItems[0], id: 'achievement-2', position: 'Top 25 Teams' },
      { ...appliedCardItems[0], id: 'achievement-3', position: 'Top 25 Teams' },
    ].filter((item): item is AchievementCardItem => Boolean(item?.id)),
    [appliedCardItems],
  );
  const filteredAchievementItems = useMemo(
    () =>
      activeFilterId === 'all'
        ? achievementItems
        : achievementItems.filter((item) => item.category === activeFilterId),
    [achievementItems, activeFilterId],
  );

  const handleCompleteNow = (item: AppliedCardItemEntity) => {
    setSubmittingCardId(item.id);

    setTimeout(() => {
      setSubmittingCardId(undefined);
      if (item.category === 'hackathons') {
        onOpenHackathon(item.id);
        return;
      }
      if (item.category === 'events') {
        onOpenEvent(item.id);
        return;
      }

      onOpenCompetition(item.id);
    }, 420);
  };

  if (variant === 'achievements') {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.achievementsScrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.achievementsHeaderRow}>
            <Pressable accessibilityLabel="Go back" hitSlop={8} onPress={onBackToProfile} style={styles.backButton}>
              <Feather color="#271B40" name="arrow-left" size={24} />
            </Pressable>
            <AppText style={styles.achievementsHeaderTitle} variant="title">
              My Profile
            </AppText>
          </View>

          <ScrollView
            contentContainerStyle={styles.filterRow}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.achievementsFilterScroll}
          >
            {appliedFilters.map((filter) => {
              const active = filter.id === activeFilterId;

              return (
                <Pressable
                  key={filter.id}
                  onPress={() => setActiveFilterId(filter.id)}
                  style={[styles.achievementFilterChip, active ? styles.achievementFilterChipActive : null]}
                >
                  <AppText colorToken={active ? 'textInverse' : 'brandPrimaryStrong'} variant="body">
                    {filter.label}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>

          <AppText style={styles.achievementsSectionTitle} variant="sectionHeading">
            Applied
          </AppText>

          {isLoading ? (
            <AppliedLoadingState />
          ) : isError ? (
            <AppliedErrorState
              onRetry={() => {
                void refetch();
              }}
            />
          ) : filteredAchievementItems.length === 0 ? (
            <AppliedEmptyState />
          ) : (
            <View style={styles.achievementCardsStack}>
              {filteredAchievementItems.map((item, index) => (
                <AchievementCard key={item.id} item={item} showBottomDivider={index < filteredAchievementItems.length - 1} />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={variant === 'registrations' ? styles.achievementsScrollContent : styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {variant === 'registrations' ? (
          <View style={styles.achievementsHeaderRow}>
            <Pressable accessibilityLabel="Go back" hitSlop={8} onPress={onBackToProfile} style={styles.backButton}>
              <Feather color="#271B40" name="arrow-left" size={24} />
            </Pressable>
            <AppText style={styles.achievementsHeaderTitle} variant="title">
              My Profile
            </AppText>
          </View>
        ) : (
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.avatar}>
                {currentUser?.imageUrl ? (
                  <Image source={{ uri: currentUser.imageUrl }} style={{ width: '100%', height: '100%', borderRadius: 999 }} />
                ) : (
                  <AppText colorToken="textInverse" style={styles.avatarLabel} variant="caption">
                    {currentUser?.firstName?.[0] || 'U'}{currentUser?.lastName?.[0] || ''}
                  </AppText>
                )}
              </View>

              <View style={styles.profileMeta}>
                <AppText style={styles.profileTitle} variant="title">
                  Hello, {currentUser?.firstName || 'User'} {currentUser?.lastName || ''}
                </AppText>
                <AppText colorToken="textMuted" numberOfLines={1} variant="caption">
                  {currentUser?.onboardingProfile?.collegeId || 'OppSkills User'}
                </AppText>
              </View>
            </View>

            <Pressable onPress={onSignOut} style={styles.signOutChip}>
              <AppText colorToken="brandPrimaryStrong" variant="caption">
                Sign out
              </AppText>
            </Pressable>
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.filterRow}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={variant === 'registrations' ? styles.achievementsFilterScroll : styles.filterScroll}
        >
          {appliedFilters.map((filter) => {
            const active = filter.id === activeFilterId;

            return (
              <Pressable
                key={filter.id}
                onPress={() => setActiveFilterId(filter.id)}
                style={[
                  variant === 'registrations' ? styles.achievementFilterChip : styles.filterChip,
                  active ? (variant === 'registrations' ? styles.achievementFilterChipActive : styles.filterChipActive) : null,
                ]}
              >
                <AppText colorToken={active ? 'textInverse' : 'brandPrimaryStrong'} variant={variant === 'registrations' ? 'body' : 'bodyStrong'}>
                  {filter.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        <AppText style={variant === 'registrations' ? styles.achievementsSectionTitle : styles.screenTitle} variant="sectionHeading">
          Applied
        </AppText>

        {isLoading ? (
          <AppliedLoadingState />
        ) : isError ? (
          <AppliedErrorState
            onRetry={() => {
              void refetch();
            }}
          />
        ) : filteredItems.length === 0 ? (
          <AppliedEmptyState />
        ) : (
          <View style={styles.cardsStack}>
            {filteredItems.map((item, index) => (
              <AppliedCard
                key={item.id}
                isSubmitting={submittingCardId === item.id}
                item={item}
                onCompleteNow={handleCompleteNow}
                onOpenCompetition={onOpenCompetition}
                onOpenHackathon={onOpenHackathon}
                onOpenEvent={onOpenEvent}
                timelineStages={appliedTimelineStages}
                showBottomDivider={index < filteredItems.length - 1}
              />
            ))}
          </View>
        )}

        <FooterSignatureBlock compact />
      </ScrollView>
    </SafeAreaView>
  );
}

function AchievementCard({
  item,
  showBottomDivider,
}: {
  readonly item: AchievementCardItem;
  readonly showBottomDivider: boolean;
}) {
  return (
    <View style={[styles.achievementCard, showBottomDivider ? styles.achievementCardDivider : null]}>
      <View style={styles.cardHeader}>
        <ImageBackground imageStyle={styles.heroThumbImage} source={appliedCardThumbnailImage} style={styles.achievementThumb}>
          <AppText colorToken="textInverse" numberOfLines={2} style={styles.heroThumbLabel} variant="micro">
            GULLY CRICKET TOURNAMENT
          </AppText>
        </ImageBackground>

        <View style={styles.achievementMeta}>
          <AppText numberOfLines={2} style={styles.achievementTitle} variant="bodyStrong">
            {item.title}
          </AppText>
          <AppText colorToken="textMuted" numberOfLines={1} style={styles.achievementHost} variant="micro">
            {item.host}
          </AppText>
          <View style={styles.achievementTagPill}>
            <AppText colorToken="brandSecondary" style={styles.achievementTagText} variant="micro">
              {item.tagLabel}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.achievementInfoList}>
        <AchievementInfoRow label="Registered On" value={item.registeredOn} />
        <AchievementInfoRow label="By" value={`You (${item.applicantEmail})`} />
        <AchievementInfoRow accentValue label="Team Name" value={item.teamName} />
        <AchievementInfoRow label="Position" value={item.position} />
        <Pressable style={styles.downloadLink}>
          <AppText colorToken="brandPrimary" style={styles.downloadLinkText} variant="body">
            Download E-Certificates
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function AchievementInfoRow({
  accentValue = false,
  label,
  value,
}: {
  readonly accentValue?: boolean;
  readonly label: string;
  readonly value: string;
}) {
  return (
    <View style={styles.achievementInfoRow}>
      <AppText colorToken="textSecondary" style={styles.achievementInfoLabel} variant="caption">
        {label}:
      </AppText>
      <AppText
        colorToken={accentValue ? 'brandPrimary' : 'textMuted'}
        style={styles.achievementInfoValue}
        variant="caption"
      >
        {value}
      </AppText>
    </View>
  );
}

interface AppliedCardProps {
  readonly item: AppliedCardItemEntity;
  readonly onOpenCompetition: (id: string) => void;
  readonly onOpenHackathon: (id: string) => void;
  readonly onOpenEvent: (id: string) => void;
  readonly timelineStages: readonly AppliedTimelineStageEntity[];
  readonly showBottomDivider: boolean;
  readonly isSubmitting: boolean;
  readonly onCompleteNow: (item: AppliedCardItemEntity) => void;
}

function AppliedCard({
  item,
  onOpenCompetition,
  onOpenHackathon,
  onOpenEvent,
  timelineStages,
  showBottomDivider,
  isSubmitting,
  onCompleteNow,
}: AppliedCardProps) {
  const completionStageIndex = timelineStages.findIndex(
    (stage) => stage.id === item.timelineCompleteThroughStageId,
  );
  let openPrimaryDetail = () => onOpenCompetition(item.id);
  if (item.category === 'hackathons') {
    openPrimaryDetail = () => onOpenHackathon(item.id);
  } else if (item.category === 'events') {
    openPrimaryDetail = () => onOpenEvent(item.id);
  }

  return (
    <View style={[styles.cardWrap, showBottomDivider ? styles.cardDivider : null]}>
      <Pressable onPress={openPrimaryDetail} style={styles.cardHeader}>
        <ImageBackground imageStyle={styles.heroThumbImage} source={appliedCardThumbnailImage} style={styles.heroThumb}>
          <AppText colorToken="textInverse" numberOfLines={2} style={styles.heroThumbLabel} variant="micro">
            GULLY CRICKET TOURNAMENT
          </AppText>
        </ImageBackground>

        <View style={styles.cardMeta}>
          <AppText numberOfLines={2} style={styles.cardTitle} variant="title">
            {item.title}
          </AppText>
          <AppText colorToken="textMuted" numberOfLines={1} style={styles.cardHost} variant="caption">
            {item.host}
          </AppText>

          <View style={styles.kindPill}>
            <AppText colorToken="brandPrimaryStrong" variant="micro">
              {item.tagLabel}
            </AppText>
          </View>
        </View>
      </Pressable>

      <View style={styles.infoList}>
        <InfoRow label="Registered On" value={item.registeredOn} />
        <InfoRow label="By" value={item.applicantEmail} />
        <InfoRow label="Team Name" strongValue value={item.teamName} />
      </View>

      <View style={styles.timelineRow}>
        {timelineStages.map((stage, index) => {
          const done = index <= completionStageIndex;
          const showConnector = index < timelineStages.length - 1;
          const connectorDone = index + 1 <= completionStageIndex;

          return (
            <View key={stage.id} style={styles.timelineStageWrap}>
              <View style={styles.timelineNodeRow}>
                <View style={[styles.timelineNode, done ? styles.timelineNodeDone : styles.timelineNodePending]}>
                  <AppText
                    colorToken={done ? 'textInverse' : 'brandPrimaryStrong'}
                    style={styles.timelineNodeLabel}
                    variant="micro"
                  >
                    {stage.label.charAt(0)}
                  </AppText>
                </View>
                {showConnector ? (
                  <View
                    style={[styles.timelineConnector, connectorDone ? styles.timelineConnectorDone : null]}
                  />
                ) : null}
              </View>

              <AppText colorToken="textSecondary" numberOfLines={1} style={styles.timelineStageLabel} variant="micro">
                {stage.label}
              </AppText>
            </View>
          );
        })}
      </View>

      <View style={styles.actionRow}>
        <View style={styles.inlineActions}>
          <Pressable onPress={() => onOpenCompetition(item.id)} style={styles.inlineActionChip}>
            <AppText colorToken="brandPrimaryStrong" variant="bodyStrong">
              Invite Team
            </AppText>
          </Pressable>

          <Pressable onPress={() => onOpenCompetition(item.id)} style={styles.inlineActionChip}>
            <AppText colorToken="brandPrimaryStrong" variant="bodyStrong">
              Share
            </AppText>
          </Pressable>
        </View>

        {item.actionState.type === 'complete-now' ? (
          <Pressable disabled={isSubmitting} onPress={() => onCompleteNow(item)} style={styles.ctaPill}>
            {isSubmitting ? (
              <ActivityIndicator color={lightTheme.colors.brandPrimaryStrong} size="small" />
            ) : (
              <AppText colorToken="brandPrimaryStrong" variant="bodyStrong">
                {item.actionState.label} {'>'}
              </AppText>
            )}
          </Pressable>
        ) : (
          <View style={styles.registrationCompleteWrap}>
            <View style={styles.registrationDot} />
            <AppText colorToken="brandPrimaryStrong" style={styles.registrationCompleteText} variant="bodyStrong">
              {item.actionState.label}
            </AppText>
          </View>
        )}
      </View>
    </View>
  );
}

function AppliedLoadingState() {
  return (
    <View style={styles.cardsStack}>
      <AppliedSkeletonCard />
      <AppliedSkeletonCard />
    </View>
  );
}

function AppliedSkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonThumb} />
        <View style={styles.skeletonMeta}>
          <View style={[styles.skeletonBar, styles.skeletonWide]} />
          <View style={[styles.skeletonBar, styles.skeletonMedium]} />
          <View style={[styles.skeletonBar, styles.skeletonShort]} />
        </View>
      </View>
      <View style={[styles.skeletonBar, styles.skeletonWide]} />
      <View style={[styles.skeletonBar, styles.skeletonMedium]} />
    </View>
  );
}

function AppliedEmptyState() {
  return (
    <View style={styles.stateCard}>
      <AppText colorToken="textSecondary" variant="caption">
        No applied records found for this filter.
      </AppText>
    </View>
  );
}

function AppliedErrorState({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <View style={styles.stateCard}>
      <AppText colorToken="textSecondary" variant="caption">
        Unable to load your applied records right now.
      </AppText>
      <Pressable onPress={onRetry} style={styles.stateRetryButton}>
        <AppText colorToken="brandPrimaryStrong" variant="caption">
          Retry
        </AppText>
      </Pressable>
    </View>
  );
}

function InfoRow({
  label,
  value,
  strongValue = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly strongValue?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <AppText colorToken="textSecondary" style={styles.infoLabel} variant="body">
        {label}:
      </AppText>
      <AppText colorToken={strongValue ? 'brandPrimaryStrong' : 'textSecondary'} style={styles.infoValue} variant="body">
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  achievementCard: {
    gap: lightTheme.spacing[12],
    paddingTop: lightTheme.spacing[4],
  },
  achievementCardDivider: {
    borderBottomColor: '#E8E6E8',
    borderBottomWidth: 1,
    paddingBottom: lightTheme.spacing[20],
  },
  achievementCardsStack: {
    gap: lightTheme.spacing[20],
  },
  achievementFilterChip: {
    alignItems: 'center',
    borderColor: '#C9B1FF',
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: lightTheme.spacing[16],
  },
  achievementFilterChipActive: {
    backgroundColor: lightTheme.colors.brandPrimaryStrong,
    borderColor: lightTheme.colors.brandPrimaryStrong,
  },
  achievementHost: {
    fontSize: 10,
    lineHeight: 15,
    marginTop: 2,
  },
  achievementInfoLabel: {
    color: '#584D5A',
    minWidth: 78,
  },
  achievementInfoList: {
    gap: 4,
    width: 183,
  },
  achievementInfoRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
  achievementInfoValue: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  achievementMeta: {
    flex: 1,
    gap: 4,
    maxWidth: 214,
  },
  achievementTagPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E2D3FF',
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 15,
    paddingHorizontal: 6,
  },
  achievementTagText: {
    fontSize: 10,
    lineHeight: 15,
  },
  achievementThumb: {
    alignItems: 'flex-start',
    borderRadius: 8.38,
    height: 74,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    padding: lightTheme.spacing[8],
    width: 127,
  },
  achievementTitle: {
    fontSize: 16,
    lineHeight: 19,
  },
  achievementsFilterScroll: {
    marginHorizontal: -20,
    marginTop: lightTheme.spacing[20],
    paddingHorizontal: lightTheme.spacing[20],
  },
  achievementsHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: lightTheme.spacing[16],
  },
  achievementsHeaderTitle: {
    color: '#100013',
    fontSize: 32 / 2,
    lineHeight: 20,
  },
  achievementsScrollContent: {
    paddingBottom: 140,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  achievementsSectionTitle: {
    marginBottom: lightTheme.spacing[20],
    marginTop: 28,
  },
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: lightTheme.spacing[16],
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: lightTheme.colors.brandPrimary,
    borderRadius: lightTheme.radius.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  avatarLabel: {
    letterSpacing: 0.4,
  },
  cardDivider: {
    borderBottomColor: lightTheme.colors.divider,
    borderBottomWidth: 1,
    paddingBottom: lightTheme.spacing[16],
  },
  cardHeader: {
    flexDirection: 'row',
    gap: lightTheme.spacing[12],
  },
  cardHost: {
    marginTop: lightTheme.spacing[4],
  },
  cardMeta: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  cardWrap: {
    paddingTop: lightTheme.spacing[8],
  },
  backButton: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  downloadLink: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  downloadLinkText: {
    fontSize: 12,
    lineHeight: 18,
  },
  cardsStack: {
    gap: lightTheme.spacing[16],
  },
  ctaPill: {
    borderColor: lightTheme.colors.focusRing,
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: lightTheme.spacing[16],
  },
  filterChip: {
    alignItems: 'center',
    borderColor: lightTheme.colors.focusRing,
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: lightTheme.spacing[16],
  },
  filterChipActive: {
    backgroundColor: lightTheme.colors.brandPrimaryStrong,
    borderColor: lightTheme.colors.brandPrimaryStrong,
  },
  filterRow: {
    alignItems: 'center',
    gap: lightTheme.spacing[12],
    paddingRight: lightTheme.spacing[20],
  },
  filterScroll: {
    marginBottom: lightTheme.spacing[20],
    marginHorizontal: -20,
    paddingHorizontal: lightTheme.spacing[20],
  },
  headerLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: lightTheme.spacing[10],
    marginRight: lightTheme.spacing[10],
  },
  headerRow: {
    alignItems: 'center',
    borderBottomColor: lightTheme.colors.divider,
    borderBottomWidth: 1,
    flexDirection: 'row',
    marginBottom: lightTheme.spacing[20],
    paddingBottom: lightTheme.spacing[12],
  },
  heroThumb: {
    alignItems: 'flex-start',
    borderRadius: lightTheme.radius.sm,
    height: 72,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    padding: lightTheme.spacing[8],
    width: 126,
  },
  heroThumbImage: {
    borderRadius: lightTheme.radius.sm,
  },
  heroThumbLabel: {
    letterSpacing: 0.4,
    lineHeight: 12,
  },
  infoLabel: {
    minWidth: 98,
  },
  infoList: {
    marginTop: lightTheme.spacing[12],
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: lightTheme.spacing[4],
  },
  infoValue: {
    flex: 1,
  },
  inlineActionChip: {
    minHeight: 40,
    justifyContent: 'center',
    paddingVertical: lightTheme.spacing[4],
  },
  inlineActions: {
    flexDirection: 'row',
    gap: lightTheme.spacing[16],
  },
  kindPill: {
    alignSelf: 'flex-start',
    backgroundColor: lightTheme.colors.brandPrimarySoft,
    borderRadius: lightTheme.radius.pill,
    marginTop: lightTheme.spacing[6],
    paddingHorizontal: lightTheme.spacing[8],
    paddingVertical: lightTheme.spacing[4],
  },
  profileMeta: {
    flex: 1,
  },
  profileTitle: {
    fontSize: 30 / 2,
    lineHeight: 20,
  },
  registrationCompleteText: {
    fontSize: lightTheme.typography.label.fontSize,
  },
  registrationCompleteWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 44,
  },
  registrationDot: {
    backgroundColor: lightTheme.colors.brandPrimaryStrong,
    borderRadius: lightTheme.radius.pill,
    height: 8,
    marginRight: lightTheme.spacing[6],
    width: 8,
  },
  safeArea: {
    backgroundColor: lightTheme.colors.backgroundPrimary,
    flex: 1,
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
    padding: lightTheme.spacing[12],
  },
  skeletonHeader: {
    flexDirection: 'row',
  },
  skeletonMedium: {
    width: '62%',
  },
  skeletonMeta: {
    flex: 1,
  },
  skeletonShort: {
    width: '40%',
  },
  skeletonThumb: {
    backgroundColor: lightTheme.colors.surfaceMuted,
    borderRadius: lightTheme.radius.sm,
    height: 72,
    marginRight: lightTheme.spacing[10],
    width: 126,
  },
  skeletonWide: {
    width: '86%',
  },
  screenTitle: {
    marginBottom: lightTheme.spacing[10],
  },
  scrollContent: {
    paddingBottom: lightTheme.spacing[40],
    paddingHorizontal: lightTheme.spacing[20],
    paddingTop: lightTheme.spacing[8],
  },
  signOutChip: {
    borderColor: lightTheme.colors.focusRing,
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: lightTheme.spacing[12],
  },
  stateCard: {
    alignItems: 'center',
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    padding: lightTheme.spacing[20],
  },
  stateRetryButton: {
    borderColor: lightTheme.colors.focusRing,
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: lightTheme.spacing[12],
    minHeight: 40,
    paddingHorizontal: lightTheme.spacing[16],
  },
  timelineConnector: {
    backgroundColor: lightTheme.colors.divider,
    flex: 1,
    height: 1,
    marginHorizontal: lightTheme.spacing[4],
  },
  timelineConnectorDone: {
    backgroundColor: lightTheme.colors.focusRing,
  },
  timelineNode: {
    alignItems: 'center',
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  timelineNodeDone: {
    backgroundColor: lightTheme.colors.brandPrimary,
    borderColor: lightTheme.colors.brandPrimary,
  },
  timelineNodeLabel: {
    fontSize: 9,
    lineHeight: 12,
  },
  timelineNodePending: {
    borderColor: lightTheme.colors.focusRing,
  },
  timelineNodeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  timelineRow: {
    flexDirection: 'row',
    marginTop: lightTheme.spacing[12],
  },
  timelineStageLabel: {
    marginTop: lightTheme.spacing[6],
    textAlign: 'left',
  },
  timelineStageWrap: {
    flex: 1,
  },
});
