import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  type AppliedCardItemEntity,
  type AppliedFilterIdEntity,
  type AppliedTimelineStageEntity,
} from '../../domain/entities/AppliedFeed';
import { useAppliedFeed } from '../hooks/useAppliedFeed';
import { lightTheme } from '../../../../shared/theme';
import { AppText, FooterSignatureBlock, TopBar } from '../../../../shared/ui';

interface AppliedScreenProps {
  readonly onOpenCompetition: () => void;
  readonly onOpenHackathon: () => void;
  readonly onSignOut: () => void;
}

export function AppliedScreen({ onOpenCompetition, onOpenHackathon, onSignOut }: AppliedScreenProps) {
  const { data: appliedFeed } = useAppliedFeed();
  const [activeFilterId, setActiveFilterId] = useState<AppliedFilterIdEntity>('all');
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

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <TopBar />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <AppText colorToken="textInverse" style={styles.avatarLabel} variant="caption">
                RT
              </AppText>
            </View>

            <View style={styles.profileMeta}>
              <AppText style={styles.profileTitle} variant="title">
                Hello, Rohit Tiwari
              </AppText>
              <AppText colorToken="textMuted" numberOfLines={1} variant="caption">
                Guru Jambheshwar University
              </AppText>
            </View>
          </View>

          <Pressable onPress={onSignOut} style={styles.signOutChip}>
            <AppText colorToken="brandPrimaryStrong" variant="caption">
              Sign out
            </AppText>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.filterRow}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {appliedFilters.map((filter) => {
            const active = filter.id === activeFilterId;

            return (
              <Pressable
                key={filter.id}
                onPress={() => setActiveFilterId(filter.id)}
                style={[styles.filterChip, active ? styles.filterChipActive : null]}
              >
                <AppText colorToken={active ? 'textInverse' : 'brandPrimaryStrong'} variant="bodyStrong">
                  {filter.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        <AppText style={styles.screenTitle} variant="sectionHeading">
          Applied
        </AppText>

        <View style={styles.cardsStack}>
          {filteredItems.map((item, index) => (
            <AppliedCard
              key={item.id}
              item={item}
              onOpenCompetition={onOpenCompetition}
              onOpenHackathon={onOpenHackathon}
              timelineStages={appliedTimelineStages}
              showBottomDivider={index < filteredItems.length - 1}
            />
          ))}
        </View>

        <FooterSignatureBlock compact />
      </ScrollView>
    </SafeAreaView>
  );
}

interface AppliedCardProps {
  readonly item: AppliedCardItemEntity;
  readonly onOpenCompetition: () => void;
  readonly onOpenHackathon: () => void;
  readonly timelineStages: readonly AppliedTimelineStageEntity[];
  readonly showBottomDivider: boolean;
}

function AppliedCard({
  item,
  onOpenCompetition,
  onOpenHackathon,
  timelineStages,
  showBottomDivider,
}: AppliedCardProps) {
  const completionStageIndex = timelineStages.findIndex(
    (stage) => stage.id === item.timelineCompleteThroughStageId,
  );
  const openPrimaryDetail = item.category === 'hackathons' ? onOpenHackathon : onOpenCompetition;

  return (
    <View style={[styles.cardWrap, showBottomDivider ? styles.cardDivider : null]}>
      <Pressable onPress={openPrimaryDetail} style={styles.cardHeader}>
        <View style={styles.heroThumb}>
          <AppText colorToken="textInverse" numberOfLines={2} style={styles.heroThumbLabel} variant="micro">
            GULLY CRICKET TOURNAMENT
          </AppText>
        </View>

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
          <Pressable onPress={onOpenCompetition} style={styles.inlineActionChip}>
            <AppText colorToken="brandPrimaryStrong" variant="bodyStrong">
              Invite Team
            </AppText>
          </Pressable>

          <Pressable onPress={onOpenCompetition} style={styles.inlineActionChip}>
            <AppText colorToken="brandPrimaryStrong" variant="bodyStrong">
              Share
            </AppText>
          </Pressable>
        </View>

        {item.actionState.type === 'complete-now' ? (
          <Pressable onPress={openPrimaryDetail} style={styles.ctaPill}>
            <AppText colorToken="brandPrimaryStrong" variant="bodyStrong">
              {item.actionState.label} {'>'}
            </AppText>
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
    backgroundColor: '#2A1D3C',
    borderRadius: lightTheme.radius.sm,
    height: 72,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    padding: lightTheme.spacing[8],
    width: 126,
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
  screenTitle: {
    marginBottom: lightTheme.spacing[10],
  },
  scrollContent: {
    paddingBottom: lightTheme.spacing[40],
    paddingHorizontal: lightTheme.spacing[20],
  },
  signOutChip: {
    borderColor: lightTheme.colors.focusRing,
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: lightTheme.spacing[12],
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
