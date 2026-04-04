import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [activeTabId, setActiveTabId] = useState<OpportunityDetailTabId>('rounds');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const visibleTab = useMemo(
    () => detailTabs.find((tab) => tab.id === activeTabId) ?? detailTabs[0],
    [activeTabId],
  );

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <AppText colorToken="textMuted" variant="caption">
            {detail.routeLabel}
          </AppText>
          <Pressable onPress={onBack} style={styles.backChip}>
            <AppText colorToken="brandPrimaryStrong" variant="caption">
              {'<'} Back
            </AppText>
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroRibbon} />
          <View style={styles.heroGlow} />

          <View style={styles.heroBadge}>
            <AppText colorToken="brandPrimaryStrong" variant="micro">
              {detail.heroLabel}
            </AppText>
          </View>

          <AppText colorToken="textInverse" style={styles.heroTitle} variant="displayH2">
            {detail.heroTitle}
          </AppText>

          <AppText colorToken="textInverse" style={styles.heroSubtitle} variant="label">
            {detail.hostName}
          </AppText>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.modeChip}>
            <AppText colorToken="brandPrimaryStrong" variant="caption">
              {detail.modeLabel}
            </AppText>
          </View>
          <AppText colorToken="textMuted" variant="caption">
            Register by {detail.registrationDeadline}
          </AppText>
        </View>

        <View style={styles.keyInfoGrid}>
          {detail.keyInfo.map((item) => (
            <View key={item.id} style={styles.keyInfoCard}>
              <AppText colorToken="textMuted" variant="caption">
                {item.label}
              </AppText>
              <AppText style={styles.keyInfoValue} variant="bodyStrong">
                {item.value}
              </AppText>
            </View>
          ))}
        </View>

        <Pressable
          disabled={isSubmitting}
          onPress={() => {
            setIsSubmitting(true);
            setTimeout(() => {
              setIsSubmitting(false);
            }, 460);
          }}
          style={styles.ctaButton}
        >
          {isSubmitting ? (
            <ActivityIndicator color={lightTheme.colors.textInverse} size="small" />
          ) : (
            <AppText colorToken="textInverse" style={styles.ctaLabel} variant="bodyStrong">
              {detail.ctaLabel}
            </AppText>
          )}
        </Pressable>

        <ScrollView
          contentContainerStyle={styles.tabRow}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroller}
        >
          {detailTabs.map((tab) => {
            const selected = tab.id === activeTabId;

            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTabId(tab.id)}
                style={[styles.tabChip, selected ? styles.tabChipActive : null]}
              >
                <AppText colorToken={selected ? 'textInverse' : 'textSecondary'} variant="caption">
                  {tab.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        <AppText style={styles.sectionTitle} variant="title">
          {visibleTab?.label}
        </AppText>

        {activeTabId === 'rounds' ? <RoundsTimeline rounds={detail.rounds} /> : null}

        {activeTabId === 'details' ? (
          <DetailsSection
            aboutParagraphs={detail.aboutParagraphs}
            eligibility={detail.eligibility}
            rules={detail.rules}
          />
        ) : null}

        {activeTabId === 'prizes' ? <PrizeSection prizes={detail.prizes} /> : null}

        {activeTabId === 'contact' ? <ContactSection contact={detail.contact} /> : null}

        <FooterSignatureBlock compact />
      </ScrollView>
    </SafeAreaView>
  );
}

function RoundsTimeline({ rounds }: { readonly rounds: readonly OpportunityRoundCard[] }) {
  return (
    <View style={styles.stack}>
      {rounds.map((round) => (
        <View key={round.id} style={styles.roundCard}>
          <View style={styles.roundHeader}>
            <View style={styles.roundStageBadge}>
              <AppText colorToken="textInverse" variant="micro">
                {round.stageLabel}
              </AppText>
            </View>
            <AppText colorToken="textMuted" variant="caption">
              {round.timeline}
            </AppText>
          </View>

          <AppText style={styles.roundTitle} variant="bodyStrong">
            {round.title}
          </AppText>

          {round.checkpoints.map((checkpoint) => (
            <View key={checkpoint} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <AppText colorToken="textSecondary" style={styles.bulletText} variant="caption">
                {checkpoint}
              </AppText>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function DetailsSection({
  aboutParagraphs,
  eligibility,
  rules,
}: {
  readonly aboutParagraphs: readonly string[];
  readonly eligibility: readonly string[];
  readonly rules: readonly string[];
}) {
  return (
    <View style={styles.stack}>
      <View style={styles.contentCard}>
        <AppText style={styles.contentHeading} variant="bodyStrong">
          About
        </AppText>
        {aboutParagraphs.map((paragraph) => (
          <AppText colorToken="textSecondary" key={paragraph} style={styles.paragraph} variant="caption">
            {paragraph}
          </AppText>
        ))}
      </View>

      <View style={styles.contentCard}>
        <AppText style={styles.contentHeading} variant="bodyStrong">
          Eligibility
        </AppText>
        {eligibility.map((item) => (
          <View key={item} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <AppText colorToken="textSecondary" style={styles.bulletText} variant="caption">
              {item}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.contentCard}>
        <AppText style={styles.contentHeading} variant="bodyStrong">
          Rules
        </AppText>
        {rules.map((item) => (
          <View key={item} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <AppText colorToken="textSecondary" style={styles.bulletText} variant="caption">
              {item}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

function PrizeSection({ prizes }: { readonly prizes: readonly OpportunityPrizeCard[] }) {
  return (
    <View style={styles.stack}>
      {prizes.map((prize) => (
        <View key={prize.id} style={styles.prizeCard}>
          <View>
            <AppText colorToken="textMuted" variant="caption">
              {prize.rankLabel}
            </AppText>
            <AppText style={styles.prizeReward} variant="title">
              {prize.reward}
            </AppText>
            <View style={styles.prizeBonusChip}>
              <AppText colorToken="brandPrimaryStrong" variant="micro">
                {prize.bonusLabel}
              </AppText>
            </View>
          </View>

          <View style={styles.prizeIconWrap}>
            <AppText colorToken="textInverse" style={styles.prizeIconLabel} variant="title">
              {prize.rankLabel.charAt(0)}
            </AppText>
          </View>
        </View>
      ))}
    </View>
  );
}

function ContactSection({
  contact,
}: {
  readonly contact: OpportunityDetailModel['contact'];
}) {
  return (
    <View style={styles.contactCard}>
      <ContactRow label="Organizer" value={contact.organizerName} />
      <ContactRow label="Phone" value={contact.phoneNumber} />
      <ContactRow label="Email" value={contact.email} />
      <ContactRow label="Venue" value={contact.venue} />
    </View>
  );
}

function ContactRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <View style={styles.contactRow}>
      <AppText colorToken="textMuted" style={styles.contactLabel} variant="caption">
        {label}
      </AppText>
      <AppText style={styles.contactValue} variant="bodyStrong">
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  backChip: {
    borderColor: lightTheme.colors.focusRing,
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    paddingHorizontal: lightTheme.spacing[12],
    paddingVertical: lightTheme.spacing[6],
  },
  bulletDot: {
    backgroundColor: lightTheme.colors.brandPrimaryStrong,
    borderRadius: lightTheme.radius.pill,
    height: 6,
    marginTop: 6,
    width: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: lightTheme.spacing[8],
    marginTop: lightTheme.spacing[8],
  },
  bulletText: {
    flex: 1,
  },
  contactCard: {
    backgroundColor: lightTheme.colors.surfacePrimary,
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.md,
    borderWidth: 1,
    padding: lightTheme.spacing[16],
  },
  contactLabel: {
    minWidth: 72,
  },
  contactRow: {
    flexDirection: 'row',
    gap: lightTheme.spacing[12],
    marginTop: lightTheme.spacing[10],
  },
  contactValue: {
    flex: 1,
  },
  contentCard: {
    backgroundColor: lightTheme.colors.surfacePrimary,
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.md,
    borderWidth: 1,
    padding: lightTheme.spacing[16],
  },
  contentHeading: {
    marginBottom: lightTheme.spacing[8],
  },
  ctaButton: {
    alignItems: 'center',
    backgroundColor: lightTheme.colors.brandPrimaryStrong,
    borderRadius: lightTheme.radius.pill,
    marginTop: lightTheme.spacing[16],
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: lightTheme.spacing[16],
  },
  ctaLabel: {
    textAlign: 'center',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: lightTheme.spacing[12],
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: lightTheme.colors.surfacePrimary,
    borderRadius: lightTheme.radius.pill,
    marginBottom: lightTheme.spacing[12],
    paddingHorizontal: lightTheme.spacing[10],
    paddingVertical: lightTheme.spacing[6],
  },
  heroCard: {
    backgroundColor: lightTheme.colors.brandSecondary,
    borderRadius: lightTheme.radius.lg,
    marginTop: lightTheme.spacing[4],
    overflow: 'hidden',
    padding: lightTheme.spacing[16],
    position: 'relative',
  },
  heroGlow: {
    backgroundColor: '#6DDACD',
    borderRadius: 90,
    height: 180,
    opacity: 0.22,
    position: 'absolute',
    right: -34,
    top: 14,
    width: 180,
  },
  heroRibbon: {
    backgroundColor: '#AC89F2',
    height: 4,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  heroSubtitle: {
    marginTop: lightTheme.spacing[8],
  },
  heroTitle: {
    maxWidth: '78%',
  },
  keyInfoCard: {
    backgroundColor: lightTheme.colors.surfacePrimary,
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.sm,
    borderWidth: 1,
    minHeight: 74,
    padding: lightTheme.spacing[10],
    width: '48.5%',
  },
  keyInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: lightTheme.spacing[8],
    marginTop: lightTheme.spacing[12],
  },
  keyInfoValue: {
    marginTop: lightTheme.spacing[4],
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: lightTheme.spacing[12],
  },
  modeChip: {
    backgroundColor: lightTheme.colors.brandPrimarySoft,
    borderRadius: lightTheme.radius.pill,
    paddingHorizontal: lightTheme.spacing[10],
    paddingVertical: lightTheme.spacing[6],
  },
  paragraph: {
    marginTop: lightTheme.spacing[8],
  },
  prizeBonusChip: {
    alignSelf: 'flex-start',
    backgroundColor: lightTheme.colors.brandPrimarySoft,
    borderRadius: lightTheme.radius.pill,
    marginTop: lightTheme.spacing[8],
    paddingHorizontal: lightTheme.spacing[10],
    paddingVertical: lightTheme.spacing[4],
  },
  prizeCard: {
    alignItems: 'center',
    backgroundColor: lightTheme.colors.surfacePrimary,
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: lightTheme.spacing[16],
  },
  prizeIconLabel: {
    marginTop: -2,
  },
  prizeIconWrap: {
    alignItems: 'center',
    backgroundColor: lightTheme.colors.warning,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  prizeReward: {
    marginTop: lightTheme.spacing[4],
  },
  roundCard: {
    backgroundColor: lightTheme.colors.surfacePrimary,
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.md,
    borderWidth: 1,
    padding: lightTheme.spacing[12],
  },
  roundHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: lightTheme.spacing[8],
  },
  roundStageBadge: {
    backgroundColor: lightTheme.colors.brandPrimaryStrong,
    borderRadius: lightTheme.radius.pill,
    paddingHorizontal: lightTheme.spacing[10],
    paddingVertical: lightTheme.spacing[4],
  },
  roundTitle: {
    marginBottom: lightTheme.spacing[4],
  },
  safeArea: {
    backgroundColor: lightTheme.colors.backgroundPrimary,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: lightTheme.spacing[40],
    paddingHorizontal: lightTheme.spacing[20],
    paddingTop: lightTheme.spacing[8],
  },
  sectionTitle: {
    marginBottom: lightTheme.spacing[12],
    marginTop: lightTheme.spacing[12],
  },
  stack: {
    gap: lightTheme.spacing[12],
  },
  tabChip: {
    alignItems: 'center',
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: lightTheme.spacing[12],
  },
  tabChipActive: {
    backgroundColor: lightTheme.colors.brandPrimaryStrong,
    borderColor: lightTheme.colors.brandPrimaryStrong,
  },
  tabRow: {
    alignItems: 'center',
    gap: lightTheme.spacing[8],
    paddingRight: lightTheme.spacing[12],
  },
  tabScroller: {
    marginTop: lightTheme.spacing[16],
  },
});