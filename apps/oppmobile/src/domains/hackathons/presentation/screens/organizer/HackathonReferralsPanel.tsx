import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '../../../../../shared/ui';
import { type LiveHackathon } from './OrganizerCreateHackathonScreen';
import { useEntityReferrals, useGenerateReferral, type ReferrerDetail } from '../../../../referrals/presentation/hooks/useReferrals';

// ── Main Panel ────────────────────────────────────────────────────────────────

function makeLink(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return `www.oppskills.com/re/${result.toLowerCase()}`;
}

interface HackathonReferralsPanelProps {
  readonly hackathon: LiveHackathon;
}

export function HackathonReferralsPanel({ hackathon }: HackathonReferralsPanelProps) {
  const { data: referrersData = [], isLoading } = useEntityReferrals('HACKATHON', hackathon.id);
  const { mutate: generateReferral } = useGenerateReferral();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showParticipants, setShowParticipants] = useState<ReferrerDetail | null>(null);
  const [showReferrerDetail, setShowReferrerDetail] = useState<ReferrerDetail | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'organizer'>('all');

  function handleAddReferrer(name: string, email: string, level: string) {
    generateReferral({
      entityType: 'HACKATHON' as any,
      entityId: hackathon.id,
      referrerEmail: email,
      sendEmail: true,
    });
    setShowAddModal(false);
  }

  function handleDelete(id: string) {
    // API not yet implemented for delete
  }

  const referrers = referrersData;

  const totalParticipants = referrers.reduce((a, r) => a + r.registrations, 0);
  const totalClicks = referrers.reduce((a, r) => a + r.clicks, 0);
  const totalRegs = referrers.reduce((a, r) => a + r.registrations, 0);

  const filtered =
    activeFilter === 'organizer' ? referrers.filter((r) => r.isOrganizer) : referrers;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Page title */}
        <AppText style={styles.eventTitle}>{hackathon.title}</AppText>
        <AppText style={styles.subtitle}>View all the Referral details about Event</AppText>

        {/* Stats cards – horizontal scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
          {/* Dark card */}
          <View style={styles.darkCard}>
            <AppText style={styles.darkCardLabel}>Referred Participants</AppText>
            <AppText style={styles.darkCardValue}>{totalParticipants}</AppText>
            <View style={styles.darkCardFooter}>
              <AppText style={styles.darkCardFooterLabel}>Total Registrations</AppText>
              <View style={styles.darkCardBadge}>
                <AppText style={styles.darkCardBadgeText}>{totalRegs}</AppText>
              </View>
            </View>
          </View>

          {/* Light card */}
          <View style={styles.lightCard}>
            <AppText style={styles.lightCardLabel}>Referral Impressions</AppText>
            <AppText style={styles.lightCardValue}>{totalClicks.toLocaleString()}</AppText>
            <AppText style={styles.lightCardSub}>Total Impressions</AppText>
          </View>
        </ScrollView>

        <View style={styles.divider} />

        {/* Add Referrer button */}
        <Pressable onPress={() => setShowAddModal(true)} style={styles.addBtn}>
          <View style={styles.addPlusCircle}>
            <View style={styles.plusH} />
            <View style={styles.plusV} />
          </View>
          <AppText style={styles.addBtnText}>Add Referrer</AppText>
        </Pressable>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          <Pressable onPress={() => setActiveFilter('all')} style={styles.filterTab}>
            <AppText
              style={[styles.filterTabText, activeFilter === 'all' && styles.filterTabTextActive]}
            >
              All Referrers ({referrers.length})
            </AppText>
            {activeFilter === 'all' && <View style={styles.filterUnderline} />}
            <View style={styles.filterClose}>
              <View style={styles.filterX1} />
              <View style={styles.filterX2} />
            </View>
          </Pressable>

          <Pressable onPress={() => setActiveFilter('organizer')} style={styles.filterTab}>
            <AppText
              style={[
                styles.filterTabText,
                activeFilter === 'organizer' && styles.filterTabTextActive,
              ]}
            >
              Organizer Referrers ({referrers.filter((r) => r.isOrganizer).length})
            </AppText>
            {activeFilter === 'organizer' && <View style={styles.filterUnderline} />}
            <View style={styles.filterClose}>
              <View style={styles.filterX1} />
              <View style={styles.filterX2} />
            </View>
          </Pressable>
        </View>

        {/* Referrers list or empty state */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIllustration}>
              {/* Server stack */}
              <View style={styles.serverStack}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={styles.serverBlock}>
                    <View style={styles.serverLight} />
                  </View>
                ))}
              </View>
              {/* Laptop */}
              <View style={styles.laptop}>
                <View style={styles.laptopScreen}>
                  <AppText style={styles.laptopText}>NO DATA</AppText>
                </View>
                <View style={styles.laptopBase} />
              </View>
            </View>
            <AppText style={styles.emptyTitle}>No referral links generated</AppText>
            <AppText style={styles.emptyDescription}>
              To get data about referrals first generate referral links.{'\n'}This can be generated
              by referrer.
            </AppText>
          </View>
        ) : (
          <View style={styles.referrerList}>
            {filtered.map((referrer) => (
              <ReferrerCard
                key={referrer.id}
                referrer={referrer}
                onDelete={() => handleDelete(referrer.id)}
                onViewParticipants={() => setShowParticipants(referrer)}
                onViewDetail={() => setShowReferrerDetail(referrer)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Modals ── */}
      <AddReferrerModal
        onClose={() => setShowAddModal(false)}
        onConfirm={handleAddReferrer}
        visible={showAddModal}
      />

      {showParticipants ? (
        <ParticipantDetailsModal
          onClose={() => setShowParticipants(null)}
          referrer={showParticipants}
        />
      ) : null}

      {showReferrerDetail ? (
        <ReferrerDetailModal
          onClose={() => setShowReferrerDetail(null)}
          referrer={showReferrerDetail}
        />
      ) : null}
    </View>
  );
}

function ReferrerCard({
  referrer,
  onDelete,
  onViewParticipants,
  onViewDetail,
}: {
  readonly referrer: ReferrerDetail;
  readonly onDelete: () => void;
  readonly onViewParticipants: () => void;
  readonly onViewDetail: () => void;
}) {
  return (
    <View style={styles.referrerCard}>
      {/* Top row: avatar + info + View Participants */}
      <View style={styles.referrerTopRow}>
        <Image
          source={
            referrer.avatarUrl
              ? { uri: referrer.avatarUrl }
              : { uri: `https://i.pravatar.cc/100?u=${referrer.id}` }
          }
          style={styles.referrerAvatar}
        />
        <View style={styles.referrerInfo}>
          <View style={styles.referrerNameRow}>
            <AppText style={styles.referrerName}>{referrer.name}</AppText>
            <Pressable onPress={onViewParticipants}>
              <AppText style={styles.viewParticipantsLink}>View Participants</AppText>
            </Pressable>
          </View>
          <AppText style={styles.referrerEmail}>{referrer.email}</AppText>
          <View style={styles.referrerLinkRow}>
            <AppText numberOfLines={1} style={styles.referrerLink}>
              {referrer.link}
            </AppText>
            {/* Copy icon */}
            <Pressable style={styles.iconBtn}>
              <View style={styles.copyOuter}>
                <View style={styles.copyInner} />
              </View>
            </Pressable>
            {/* Share icon */}
            <Pressable style={styles.iconBtn} onPress={onViewDetail}>
              <View style={styles.shareBox}>
                <View style={styles.shareArrow} />
              </View>
            </Pressable>
            {/* Delete icon */}
            <Pressable style={styles.iconBtn} onPress={onDelete}>
              <TrashIcon />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Stats chips row */}
      <View style={styles.statsChipsRow}>
        <View style={styles.statsChipCol}>
          <View style={styles.clicksChip}>
            <AppText style={styles.clicksChipText}>{referrer.clicks.toLocaleString()} Clicks</AppText>
          </View>
          <View style={styles.last24Row}>
            <View style={styles.trendUp} />
            <AppText style={styles.last24Text}>{referrer.clicksLast24} in last 24 hrs</AppText>
          </View>
        </View>
        <View style={styles.statsChipCol}>
          <View style={styles.regsChip}>
            <AppText style={styles.regsChipText}>{referrer.registrations} Registrations</AppText>
          </View>
          <View style={styles.last24Row}>
            <View style={styles.trendUp} />
            <AppText style={styles.last24Text}>{referrer.regsLast24} in last 24 hrs</AppText>
          </View>
        </View>
      </View>
    </View>
  );
}

// ── Trash icon ────────────────────────────────────────────────────────────────
function TrashIcon() {
  return (
    <View style={trash.wrap}>
      <View style={trash.lid} />
      <View style={trash.body}>
        <View style={[trash.line, { left: 4 }]} />
        <View style={[trash.line, { left: 7 }]} />
        <View style={[trash.line, { left: 10 }]} />
      </View>
    </View>
  );
}
const trash = StyleSheet.create({
  wrap: { height: 18, position: 'relative', width: 14 },
  lid: { backgroundColor: '#9C8DAA', borderRadius: 1, height: 2, position: 'absolute', top: 0, width: 14 },
  body: { borderColor: '#9C8DAA', borderRadius: 2, borderWidth: 1.5, bottom: 0, height: 13, left: 1, position: 'absolute', width: 12 },
  line: { backgroundColor: '#9C8DAA', borderRadius: 1, height: 7, position: 'absolute', top: 2, width: 1.5 },
});

// ── Add Referrer Modal ────────────────────────────────────────────────────────
function AddReferrerModal({
  visible,
  onConfirm,
  onClose,
}: {
  readonly visible: boolean;
  readonly onConfirm: (name: string, email: string, level: string) => void;
  readonly onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [level, setLevel] = useState('');
  const [sendEmail, setSendEmail] = useState(true);

  function handleConfirm() {
    if (!email.trim()) return;
    onConfirm('', email.trim(), level.toLowerCase().trim());
    setEmail('');
    setLevel('');
    setSendEmail(true);
  }

  return (
    <Modal onRequestClose={onClose} transparent visible={visible} animationType="slide">
      <Pressable onPress={onClose} style={modal.overlay}>
        <Pressable style={modal.sheet} onPress={() => undefined}>
          <View style={modal.handle} />
          <AppText style={modal.title}>Add Referrer</AppText>

          <View style={modal.field}>
            <AppText style={modal.fieldLabel}>Official Email *</AppText>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Place Holder Text"
              placeholderTextColor="#A099A1"
              style={modal.input}
              value={email}
            />
          </View>

          <View style={modal.field}>
            <AppText style={modal.fieldLabel}>Referrer Level *</AppText>
            <TextInput
              onChangeText={setLevel}
              placeholder=""
              placeholderTextColor="#A099A1"
              style={modal.input}
              value={level}
            />
          </View>

          <View style={modal.toggleRow}>
            <AppText style={modal.toggleLabel}>Send Email to the Referrer</AppText>
            <Switch
              onValueChange={setSendEmail}
              thumbColor="#FFFFFF"
              trackColor={{ false: '#E8E6E8', true: '#22C55E' }}
              value={sendEmail}
            />
          </View>

          <Pressable onPress={handleConfirm} style={modal.confirmBtn}>
            <View style={modal.confirmPlusCircle}>
              <View style={modal.confirmPlusH} />
              <View style={modal.confirmPlusV} />
            </View>
            <AppText style={modal.confirmBtnText}>Add Referrer</AppText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Participant Details Modal ──────────────────────────────────────────────────
const SAMPLE_PARTICIPANTS = [
  { name: 'Maya Patel', badge: 'College Student', location: 'Mumbai, Maharashtra, India', phone: '+91 88888 77777', email: 'maya.patel@designhub.com', institution: 'Design Institute of India', avatarUrl: 'https://i.pravatar.cc/100?img=47' },
  { name: 'Maya Patel', badge: 'College Student', location: 'Mumbai, Maharashtra, India', phone: '+91 88888 77777', email: 'maya.patel@designhub.com', institution: 'Design Institute of India', avatarUrl: 'https://i.pravatar.cc/100?img=47' },
  { name: 'Maya Patel', badge: 'College Student', location: 'Mumbai, Maharashtra, India', phone: '+91 88888 77777', email: 'maya.patel@designhub.com', institution: 'Design Institute of India', avatarUrl: 'https://i.pravatar.cc/100?img=47' },
  { name: 'Maya Patel', badge: 'College Student', location: 'Mumbai, Maharashtra, India', phone: '+91 88888 77777', email: 'maya.patel@designhub.com', institution: 'Design Institute of India', avatarUrl: 'https://i.pravatar.cc/100?img=47' },
];

function ParticipantDetailsModal({
  onClose,
  referrer: _referrer,
}: {
  readonly onClose: () => void;
  readonly referrer: ReferrerDetail;
}) {
  return (
    <Modal onRequestClose={onClose} transparent visible animationType="slide">
      <Pressable onPress={onClose} style={modal.overlay}>
        <Pressable style={modal.sheet} onPress={() => undefined}>
          <View style={modal.handle} />
          <AppText style={modal.title}>Participant Details</AppText>

          <ScrollView showsVerticalScrollIndicator={false}>
            {SAMPLE_PARTICIPANTS.map((p, i) => (
              <View key={i} style={participant.row}>
                <Image source={{ uri: p.avatarUrl }} style={participant.avatar} />
                <View style={participant.info}>
                  <View style={participant.nameRow}>
                    <AppText style={participant.name}>{p.name}</AppText>
                    <View style={participant.badge}>
                      <AppText style={participant.badgeText}>{p.badge}</AppText>
                    </View>
                  </View>
                  <View style={participant.metaRow}>
                    <View style={participant.dot} />
                    <AppText style={participant.meta}>{p.location}</AppText>
                  </View>
                  <View style={participant.metaRow}>
                    <View style={participant.phoneDot} />
                    <AppText style={participant.meta}>{p.phone}</AppText>
                  </View>
                  <View style={participant.metaRow}>
                    <View style={participant.emailDot} />
                    <AppText style={participant.meta}>{p.email}</AppText>
                  </View>
                  <View style={participant.metaRow}>
                    <View style={participant.eduDot} />
                    <AppText style={participant.meta}>{p.institution}</AppText>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Referrer Detail Modal ─────────────────────────────────────────────────────
function ReferrerDetailModal({
  onClose,
  referrer,
}: {
  readonly onClose: () => void;
  readonly referrer: ReferrerDetail;
}) {
  return (
    <Modal onRequestClose={onClose} transparent visible animationType="slide">
      <Pressable onPress={onClose} style={modal.overlay}>
        <Pressable style={[modal.sheet, { paddingBottom: 32 }]} onPress={() => undefined}>
          <View style={modal.handle} />
          <AppText style={modal.title}>Referrer Details</AppText>

          {/* Referrer profile */}
          <View style={detail.profileRow}>
            <Image
              source={
                referrer.avatarUrl
                  ? { uri: referrer.avatarUrl }
                  : { uri: `https://i.pravatar.cc/100?u=${referrer.id}` }
              }
              style={detail.avatar}
            />
            <View style={detail.profileInfo}>
              <AppText style={detail.profileName}>{referrer.name}</AppText>
              {referrer.location ? (
                <View style={detail.metaRow}>
                  <View style={detail.pinDot} />
                  <AppText style={detail.metaText}>{referrer.location}</AppText>
                </View>
              ) : null}
              {referrer.phone ? (
                <View style={detail.metaRow}>
                  <View style={detail.phoneDot} />
                  <AppText style={detail.metaText}>{referrer.phone}</AppText>
                </View>
              ) : null}
              <View style={detail.metaRow}>
                <View style={detail.emailDot} />
                <AppText style={detail.metaText}>{referrer.email}</AppText>
              </View>
              {referrer.institution ? (
                <View style={detail.metaRow}>
                  <View style={detail.eduDot} />
                  <AppText style={detail.metaText}>{referrer.institution}</AppText>
                </View>
              ) : null}
            </View>
          </View>

          {/* Mini stats */}
          <View style={detail.statsRow}>
            <View style={detail.darkMiniCard}>
              <AppText style={detail.darkMiniLabel}>All Events Referrals</AppText>
              <AppText style={detail.darkMiniValue}>{referrer.registrations}</AppText>
              <View style={detail.darkMiniFooter}>
                <AppText style={detail.darkMiniFooterLabel}>Last 24 hrs</AppText>
                <View style={detail.darkMiniBadge}>
                  <AppText style={detail.darkMiniBadgeText}>{referrer.regsLast24}</AppText>
                </View>
              </View>
            </View>

            <View style={detail.lightMiniCard}>
              <AppText style={detail.lightMiniLabel}>No Of Links Generated</AppText>
              <AppText style={detail.lightMiniValue}>{referrer.clicks.toLocaleString()}</AppText>
              <AppText style={detail.lightMiniSub}>Active Links</AppText>
            </View>
          </View>

          {/* One referral link preview */}
          <View style={detail.linkCard}>
            <Image
              source={{ uri: 'https://i.pravatar.cc/60?img=3' }}
              style={detail.hackathonThumb}
            />
            <View style={detail.linkInfo}>
              <AppText style={detail.linkName}>{referrer.name}</AppText>
              <AppText style={detail.linkEmail}>{referrer.email}</AppText>
              <AppText style={detail.linkUrl}>{referrer.link}</AppText>
              <View style={detail.linkChips}>
                <View style={styles.clicksChip}>
                  <AppText style={styles.clicksChipText}>{referrer.clicks.toLocaleString()} Clicks</AppText>
                </View>
                <View style={styles.regsChip}>
                  <AppText style={styles.regsChipText}>{referrer.registrations} Registrations</AppText>
                </View>
              </View>
              <View style={detail.linkLast24}>
                <AppText style={styles.last24Text}>{referrer.clicksLast24} in last 24 hrs</AppText>
                <AppText style={styles.last24Text}>{referrer.regsLast24} in last 24 hrs</AppText>
              </View>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    gap: 16,
    padding: 16,
    paddingBottom: 48,
  },
  eventTitle: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  },
  subtitle: {
    color: '#9CA3AF',
    fontFamily: 'Urbanist',
    fontSize: 14,
    marginTop: -8,
  },
  statsRow: {
    flexDirection: 'row',
  },
  darkCard: {
    backgroundColor: '#12002A',
    borderRadius: 16,
    marginRight: 12,
    minWidth: 200,
    padding: 20,
  },
  darkCardLabel: {
    color: '#C4B5FD',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  darkCardValue: {
    color: '#FFFFFF',
    fontFamily: 'Aeonik Pro',
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 56,
  },
  darkCardFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  darkCardFooterLabel: {
    color: '#DDD6FE',
    fontFamily: 'Urbanist',
    fontSize: 13,
  },
  darkCardBadge: {
    backgroundColor: '#3D2A6E',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  darkCardBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '600',
  },
  lightCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2D3FF',
    borderRadius: 16,
    borderWidth: 1.5,
    minWidth: 160,
    padding: 20,
  },
  lightCardLabel: {
    color: '#6949AA',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  lightCardValue: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 48,
  },
  lightCardSub: {
    color: '#9C8DAA',
    fontFamily: 'Urbanist',
    fontSize: 13,
    marginTop: 4,
  },
  divider: {
    backgroundColor: '#E8E6E8',
    height: 1,
    marginVertical: 4,
  },
  addBtn: {
    alignItems: 'center',
    backgroundColor: '#3D2A6E',
    borderRadius: 100,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  addPlusCircle: {
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  plusH: {
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    height: 1.5,
    position: 'absolute',
    width: 12,
  },
  plusV: {
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    height: 12,
    position: 'absolute',
    width: 1.5,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 16,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 16,
  },
  filterTab: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 8,
    position: 'relative',
  },
  filterTabText: {
    color: '#9C8DAA',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#6949AA',
  },
  filterUnderline: {
    backgroundColor: '#6949AA',
    bottom: 0,
    height: 2,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  filterClose: {
    height: 14,
    justifyContent: 'center',
    position: 'relative',
    width: 14,
  },
  filterX1: {
    backgroundColor: '#9C8DAA',
    borderRadius: 1,
    height: 1.5,
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
    width: 10,
  },
  filterX2: {
    backgroundColor: '#9C8DAA',
    borderRadius: 1,
    height: 1.5,
    position: 'absolute',
    transform: [{ rotate: '-45deg' }],
    width: 10,
  },

  /* Empty state */
  emptyState: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 32,
  },
  emptyIllustration: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    height: 120,
    justifyContent: 'center',
    marginBottom: 24,
    width: '100%',
  },
  serverStack: {
    gap: 4,
    justifyContent: 'flex-end',
    marginRight: 12,
  },
  serverBlock: {
    backgroundColor: '#3D2A6E',
    borderRadius: 4,
    flexDirection: 'row',
    height: 24,
    justifyContent: 'flex-end',
    paddingRight: 6,
    paddingVertical: 6,
    width: 60,
  },
  serverLight: {
    backgroundColor: '#22C55E',
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  laptop: {
    alignItems: 'center',
  },
  laptopScreen: {
    alignItems: 'center',
    backgroundColor: '#E2D3FF',
    borderColor: '#6949AA',
    borderRadius: 6,
    borderWidth: 2,
    height: 70,
    justifyContent: 'center',
    width: 100,
  },
  laptopText: {
    color: '#42007A',
    fontFamily: 'Urbanist',
    fontSize: 11,
    fontWeight: '700',
  },
  laptopBase: {
    backgroundColor: '#6949AA',
    borderRadius: 2,
    height: 6,
    marginTop: 2,
    width: 110,
  },
  emptyTitle: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    color: '#9C8DAA',
    fontFamily: 'Urbanist',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },

  /* Referrer list */
  referrerList: {
    gap: 16,
  },
  referrerCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E6E8',
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  referrerTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  referrerAvatar: {
    borderRadius: 30,
    height: 52,
    width: 52,
  },
  referrerInfo: {
    flex: 1,
    gap: 4,
  },
  referrerNameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  referrerName: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 15,
    fontWeight: '700',
  },
  viewParticipantsLink: {
    color: '#6949AA',
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '500',
  },
  referrerEmail: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 12,
  },
  referrerLinkRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  referrerLink: {
    color: '#6949AA',
    flex: 1,
    fontFamily: 'Urbanist',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  iconBtn: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  copyOuter: {
    borderColor: '#9C8DAA',
    borderRadius: 3,
    borderWidth: 1.5,
    height: 14,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 14,
  },
  copyInner: {
    backgroundColor: '#FAFAFA',
    borderColor: '#9C8DAA',
    borderRadius: 2,
    borderWidth: 1.5,
    height: 11,
    left: -3,
    position: 'absolute',
    top: 3,
    width: 11,
  },
  shareBox: {
    borderColor: '#9C8DAA',
    borderRadius: 3,
    borderWidth: 1.5,
    height: 14,
    width: 14,
  },
  shareArrow: {
    borderColor: '#9C8DAA',
    borderRightWidth: 1.5,
    borderTopWidth: 1.5,
    height: 5,
    position: 'absolute',
    right: 2,
    top: -3,
    transform: [{ rotate: '45deg' }],
    width: 5,
  },
  statsChipsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statsChipCol: {
    flex: 1,
    gap: 4,
  },
  clicksChip: {
    backgroundColor: '#FEF9C3',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  clicksChipText: {
    color: '#713F12',
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '700',
  },
  regsChip: {
    backgroundColor: '#FCE7F3',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  regsChipText: {
    color: '#831843',
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '700',
  },
  last24Row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  trendUp: {
    borderBottomColor: '#22C55E',
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderLeftWidth: 4,
    borderRightColor: 'transparent',
    borderRightWidth: 4,
    height: 0,
    width: 0,
  },
  last24Text: {
    color: '#9CA3AF',
    fontFamily: 'Urbanist',
    fontSize: 11,
  },
});

// ── Modal styles ──────────────────────────────────────────────────────────────
const modal = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(12,1,20,0.45)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#EEEEF0',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 24,
    paddingTop: 16,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#C3BFC4',
    borderRadius: 4,
    height: 5,
    marginBottom: 20,
    width: 48,
  },
  title: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  field: {
    gap: 6,
    marginBottom: 16,
  },
  fieldLabel: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E6E8',
    borderRadius: 100,
    borderWidth: 1.5,
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 15,
    height: 52,
    paddingHorizontal: 20,
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  toggleLabel: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 15,
    fontWeight: '500',
  },
  confirmBtn: {
    alignItems: 'center',
    backgroundColor: '#42007A',
    borderRadius: 100,
    flexDirection: 'row',
    gap: 10,
    height: 54,
    justifyContent: 'center',
  },
  confirmPlusCircle: {
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  confirmPlusH: {
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    height: 1.5,
    position: 'absolute',
    width: 12,
  },
  confirmPlusV: {
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    height: 12,
    position: 'absolute',
    width: 1.5,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 16,
    fontWeight: '700',
  },
});

// ── Participant styles ─────────────────────────────────────────────────────────
const participant = StyleSheet.create({
  row: {
    borderBottomColor: '#F0EFF1',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 16,
  },
  avatar: {
    borderRadius: 8,
    height: 72,
    width: 72,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  name: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: '#92400E',
    fontFamily: 'Urbanist',
    fontSize: 11,
    fontWeight: '600',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    backgroundColor: '#9C8DAA',
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  phoneDot: {
    backgroundColor: '#9C8DAA',
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  emailDot: {
    backgroundColor: '#9C8DAA',
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  eduDot: {
    backgroundColor: '#9C8DAA',
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  meta: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 12,
  },
});

// ── Referrer detail styles ────────────────────────────────────────────────────
const detail = StyleSheet.create({
  profileRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  avatar: {
    borderRadius: 8,
    height: 72,
    width: 72,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  pinDot: { backgroundColor: '#9C8DAA', borderRadius: 6, height: 12, width: 12 },
  phoneDot: { backgroundColor: '#9C8DAA', borderRadius: 6, height: 12, width: 12 },
  emailDot: { backgroundColor: '#9C8DAA', borderRadius: 6, height: 12, width: 12 },
  eduDot: { backgroundColor: '#9C8DAA', borderRadius: 6, height: 12, width: 12 },
  metaText: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  darkMiniCard: {
    backgroundColor: '#12002A',
    borderRadius: 14,
    flex: 1,
    padding: 16,
  },
  darkMiniLabel: {
    color: '#C4B5FD',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  darkMiniValue: {
    color: '#FFFFFF',
    fontFamily: 'Aeonik Pro',
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 42,
  },
  darkMiniFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  darkMiniFooterLabel: {
    color: '#DDD6FE',
    fontFamily: 'Urbanist',
    fontSize: 12,
  },
  darkMiniBadge: {
    backgroundColor: '#3D2A6E',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  darkMiniBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '600',
  },
  lightMiniCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2D3FF',
    borderRadius: 14,
    borderWidth: 1.5,
    flex: 1,
    padding: 16,
  },
  lightMiniLabel: {
    color: '#6949AA',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  lightMiniValue: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
  },
  lightMiniSub: {
    color: '#9C8DAA',
    fontFamily: 'Urbanist',
    fontSize: 12,
    marginTop: 4,
  },
  linkCard: {
    flexDirection: 'row',
    gap: 12,
  },
  hackathonThumb: {
    borderRadius: 8,
    height: 64,
    width: 64,
  },
  linkInfo: {
    flex: 1,
    gap: 3,
  },
  linkName: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '700',
  },
  linkEmail: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 12,
  },
  linkUrl: {
    color: '#6949AA',
    fontFamily: 'Urbanist',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  linkChips: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  linkLast24: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 2,
  },
});
