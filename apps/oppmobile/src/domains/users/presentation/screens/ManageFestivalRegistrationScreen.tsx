import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { AppText } from '../../../../shared/ui';
import { apiClient } from '../../../../shared/api/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FestivalRegistrationItem {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly university?: string;
  readonly type: 'Event' | 'Hackathon';
  readonly passSent: boolean;
  readonly markedPresent: boolean;
}

interface FestivalDetailResponse {
  readonly id: string;
  readonly name: string;
  readonly events: readonly {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
  }[];
  readonly hackathons: readonly {
    readonly id: string;
    readonly name: string;
    readonly slug: string;
  }[];
}

interface ManageFestivalRegistrationScreenProps {
  readonly festivalId: string;
}

// ─── Mock Registrant Data ─────────────────────────────────────────────────────

const MOCK_REGISTRANTS: readonly FestivalRegistrationItem[] = [
  { id: '1', name: 'Priya Sharma', email: 'priya.sharma@example.com', university: 'IIT Delhi', type: 'Event', passSent: true, markedPresent: false },
  { id: '2', name: 'Arjun Mehta', email: 'arjun.mehta@example.com', university: 'NIT Trichy', type: 'Hackathon', passSent: true, markedPresent: true },
  { id: '3', name: 'Sneha Gupta', email: 'sneha.gupta@example.com', university: 'BITS Pilani', type: 'Event', passSent: false, markedPresent: false },
  { id: '4', name: 'Karan Patel', email: 'karan.patel@example.com', university: 'VIT Vellore', type: 'Hackathon', passSent: true, markedPresent: false },
  { id: '5', name: 'Divya Nair', email: 'divya.nair@example.com', university: 'IIIT Hyderabad', type: 'Event', passSent: true, markedPresent: false },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ManageFestivalRegistrationScreen({ festivalId }: ManageFestivalRegistrationScreenProps) {
  const [search, setSearch] = useState('');
  const [markedIds, setMarkedIds] = useState<Set<string>>(new Set(['2']));
  const [sentIds, setSentIds] = useState<Set<string>>(new Set(['1', '2', '4', '5']));

  const { isLoading, isError } = useQuery<FestivalDetailResponse>({
    queryKey: ['festival', 'detail', festivalId],
    queryFn: () => apiClient.getAuth<FestivalDetailResponse>(`/festivals/${festivalId}`),
    enabled: !!festivalId,
    staleTime: 1000 * 60 * 2,
    retry: false,
  });

  const registrants = MOCK_REGISTRANTS;

  const filtered = useMemo(() => {
    if (!search.trim()) return registrants;
    const q = search.toLowerCase();
    return registrants.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.university ?? '').toLowerCase().includes(q),
    );
  }, [registrants, search]);

  function handleMarkPresent(id: string) {
    setMarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleSendPass(id: string) {
    setSentIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  if (isLoading) {
    return (
      <View style={styles.centeredWrap}>
        <ActivityIndicator size="large" color="#8359D5" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centeredWrap}>
        <AppText style={styles.errorText}>Unable to load festival registrations. Please try again.</AppText>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header strip */}
      <View style={styles.headerStrip}>
        <View style={styles.statsRow}>
          <StatPill label="Total" value={String(registrants.length)} color="#6949AA" />
          <StatPill label="Pass Sent" value={String(sentIds.size)} color="#16A34A" />
          <StatPill label="Present" value={String(markedIds.size)} color="#0369A1" />
        </View>
      </View>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <SearchIcon />
          <TextInput
            onChangeText={(value) => { setSearch(value); }}
            placeholder="Search by name, email, or college…"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={search}
          />
        </View>
        <Pressable style={styles.exportBtn}>
          <DownloadIcon />
          <AppText style={styles.exportText}>Export</AppText>
        </Pressable>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        <AppText style={styles.filterLabel}>All Registrants</AppText>
        <AppText style={styles.filterCount}>{filtered.length} results</AppText>
      </View>

      {/* Registration cards */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filtered.map((item) => {
          const isSent = sentIds.has(item.id);
          const isPresent = markedIds.has(item.id);

          return (
            <View key={item.id} style={styles.card}>
              {/* Top Row */}
              <View style={styles.cardTopRow}>
                {/* Avatar */}
                <View style={[styles.avatarWrap, isPresent && styles.avatarWrapPresent]}>
                  <AppText style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</AppText>
                </View>

                {/* Info */}
                <View style={styles.infoCol}>
                  <AppText style={styles.nameText}>{item.name}</AppText>

                  <View style={styles.infoRow}>
                    <MailIcon />
                    <AppText numberOfLines={1} style={styles.infoText}>{item.email}</AppText>
                  </View>

                  <View style={styles.infoRow}>
                    <CapIcon />
                    <AppText numberOfLines={1} style={styles.infoText}>{item.university ?? 'Institution'}</AppText>
                  </View>
                </View>

                {/* Status badge */}
                <View>
                  {isPresent ? (
                    <View style={styles.presentBadge}>
                      <AppText style={styles.presentBadgeText}>Present</AppText>
                    </View>
                  ) : (
                    <View style={styles.registeredBadge}>
                      <AppText style={styles.registeredBadgeText}>Registered</AppText>
                    </View>
                  )}
                  <View style={[styles.typePill, item.type === 'Hackathon' ? styles.typePillHackathon : styles.typePillEvent]}>
                    <AppText style={[styles.typeText, item.type === 'Hackathon' ? styles.typeTextHackathon : styles.typeTextEvent]}>
                      {item.type}
                    </AppText>
                  </View>
                </View>
              </View>

              {/* Bottom Row */}
              <View style={styles.cardBottomRow}>
                {/* Pass Status Badge */}
                <View style={[styles.passBadge, isSent ? styles.passBadgeGreen : styles.passBadgeAmber]}>
                  <AppText style={[styles.passBadgeText, isSent ? styles.passBadgeTextGreen : styles.passBadgeTextAmber]}>
                    {isSent ? 'Pass Sent' : 'Pass Pending'}
                  </AppText>
                </View>

                {/* Action Button */}
                <View style={styles.actionsRow}>
                  {!isSent && (
                    <Pressable onPress={() => { handleSendPass(item.id); }} style={styles.sendPassBtn}>
                      <TicketIcon color="#FFFFFF" />
                      <AppText style={styles.sendPassBtnText}>Send Pass</AppText>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => { handleMarkPresent(item.id); }}
                    style={[styles.actionBtn, isPresent && styles.actionBtnPresent]}
                  >
                    <CheckCircleIcon active={isPresent} />
                    <AppText style={[styles.actionBtnText, isPresent && styles.actionBtnTextPresent]}>
                      {isPresent ? 'Marked Present' : 'Mark Present'}
                    </AppText>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.emptyWrap}>
            <AppText style={styles.emptyText}>No registrations found.</AppText>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({ label, value, color }: { readonly label: string; readonly value: string; readonly color: string }) {
  return (
    <View style={styles.statPill}>
      <AppText style={[styles.statValue, { color }]}>{value}</AppText>
      <AppText style={styles.statLabel}>{label}</AppText>
    </View>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <View style={{ height: 16, position: 'relative', width: 16, marginRight: 8 }}>
      <View style={{ borderColor: '#9CA3AF', borderRadius: 5, borderWidth: 1.5, height: 10, left: 1, position: 'absolute', top: 1, width: 10 }} />
      <View style={{ backgroundColor: '#9CA3AF', borderRadius: 1, bottom: 1, height: 1.5, position: 'absolute', right: 0, transform: [{ rotate: '45deg' }], width: 5 }} />
    </View>
  );
}

function MailIcon() {
  return (
    <View style={{ height: 10, width: 12, borderColor: '#7C737E', borderWidth: 1.2, borderRadius: 2, justifyContent: 'center', marginRight: 4 }}>
      <View style={{ borderBottomWidth: 1.2, borderRightWidth: 1.2, borderColor: '#7C737E', width: 6, height: 6, alignSelf: 'center', transform: [{ rotate: '45deg' }, { translateY: -3 }] }} />
    </View>
  );
}

function CapIcon() {
  return (
    <View style={{ height: 10, width: 13, position: 'relative', marginRight: 4 }}>
      <View style={{ backgroundColor: '#7C737E', height: 1.5, left: 0, position: 'absolute', top: 4, width: 13 }} />
      <View style={{ backgroundColor: '#7C737E', borderRadius: 1, height: 5, left: 5, position: 'absolute', top: 5, width: 1.5 }} />
    </View>
  );
}

function CheckCircleIcon({ active }: { readonly active: boolean }) {
  return (
    <View style={{ height: 14, width: 14, borderRadius: 7, borderWidth: 1.5, borderColor: active ? '#FFFFFF' : '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
      {active && (
        <View style={{ borderBottomColor: '#FFFFFF', borderBottomWidth: 1.5, borderRightColor: '#FFFFFF', borderRightWidth: 1.5, height: 7, transform: [{ rotate: '45deg' }, { translateY: -1 }], width: 4 }} />
      )}
    </View>
  );
}

function TicketIcon({ color }: { readonly color: string }) {
  return (
    <View style={{ height: 12, width: 16, position: 'relative' }}>
      <View style={{ borderColor: color, borderRadius: 2, borderWidth: 1.5, height: 12, left: 0, position: 'absolute', top: 0, width: 16 }} />
      <View style={{ backgroundColor: color, height: 12, left: 5, position: 'absolute', top: 0, width: 1.5 }} />
      <View style={{ backgroundColor: color, height: 12, left: 9, position: 'absolute', top: 0, width: 1.5 }} />
    </View>
  );
}

function DownloadIcon() {
  return (
    <View style={{ height: 14, width: 14, position: 'relative', alignItems: 'center' }}>
      <View style={{ backgroundColor: '#584D5A', borderRadius: 1, height: 7, position: 'absolute', top: 0, width: 1.5 }} />
      <View style={{ borderColor: '#584D5A', borderBottomWidth: 1.5, borderLeftWidth: 1.5, height: 4, position: 'absolute', top: 5, transform: [{ rotate: '-45deg' }], width: 4 }} />
      <View style={{ backgroundColor: '#584D5A', borderRadius: 1, bottom: 0, height: 1.5, position: 'absolute', width: 12 }} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FAFAFA',
    flex: 1,
  },
  centeredWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: '#7C737E',
    fontFamily: 'Urbanist',
    fontSize: 14,
    textAlign: 'center',
  },

  // Header strip
  headerStrip: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E8E6E8',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statPill: {
    alignItems: 'center',
    backgroundColor: '#F3EEFF',
    borderRadius: 10,
    flex: 1,
    paddingVertical: 8,
  },
  statValue: {
    fontFamily: 'Aeonik Pro',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  statLabel: {
    color: '#7C737E',
    fontFamily: 'Urbanist',
    fontSize: 11,
    fontWeight: '400',
    marginTop: 2,
  },

  // Toolbar
  toolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchWrap: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E6E8',
    borderRadius: 100,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    height: 40,
    paddingHorizontal: 14,
  },
  searchInput: {
    color: '#100013',
    flex: 1,
    fontFamily: 'Urbanist',
    fontSize: 13,
    paddingVertical: 0,
  },
  exportBtn: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E6E8',
    borderRadius: 100,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    height: 40,
    paddingHorizontal: 14,
  },
  exportText: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '500',
  },

  // Filter row
  filterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  filterLabel: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '600',
  },
  filterCount: {
    color: '#7C737E',
    fontFamily: 'Urbanist',
    fontSize: 12,
  },

  // Card list
  listContent: {
    gap: 12,
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E6E8',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 12,
  },
  avatarWrap: {
    alignItems: 'center',
    backgroundColor: '#9C8DAA',
    borderRadius: 10,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  avatarWrapPresent: {
    backgroundColor: '#16A34A',
  },
  avatarText: {
    color: '#FFFFFF',
    fontFamily: 'Aeonik Pro',
    fontSize: 22,
    fontWeight: '600',
  },
  infoCol: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  nameText: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 15,
    fontWeight: '600',
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  infoText: {
    color: '#7C737E',
    fontFamily: 'Urbanist',
    fontSize: 12,
    flex: 1,
  },

  // Status badges
  presentBadge: {
    alignSelf: 'flex-end',
    backgroundColor: '#BBF7D0',
    borderRadius: 4,
    marginBottom: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  presentBadgeText: {
    color: '#166534',
    fontFamily: 'Urbanist',
    fontSize: 11,
    fontWeight: '600',
  },
  registeredBadge: {
    alignSelf: 'flex-end',
    backgroundColor: '#FEF08A',
    borderRadius: 4,
    marginBottom: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  registeredBadgeText: {
    color: '#A16207',
    fontFamily: 'Urbanist',
    fontSize: 11,
    fontWeight: '600',
  },
  typePill: {
    alignSelf: 'flex-end',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typePillEvent: {
    backgroundColor: '#E0E7FF',
  },
  typePillHackathon: {
    backgroundColor: '#F3EEFF',
  },
  typeText: {
    fontFamily: 'Urbanist',
    fontSize: 10,
    fontWeight: '600',
  },
  typeTextEvent: {
    color: '#3730A3',
  },
  typeTextHackathon: {
    color: '#6949AA',
  },

  // Bottom row
  cardBottomRow: {
    alignItems: 'center',
    borderTopColor: '#F3F4F6',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  passBadge: {
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  passBadgeGreen: {
    backgroundColor: '#BBF7D0',
  },
  passBadgeAmber: {
    backgroundColor: '#FEF3C7',
  },
  passBadgeText: {
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '500',
  },
  passBadgeTextGreen: {
    color: '#166534',
  },
  passBadgeTextAmber: {
    color: '#92400E',
  },

  // Actions
  actionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  sendPassBtn: {
    alignItems: 'center',
    backgroundColor: '#584D5A',
    borderRadius: 100,
    flexDirection: 'row',
    gap: 6,
    height: 34,
    paddingHorizontal: 14,
  },
  sendPassBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '500',
  },
  actionBtn: {
    alignItems: 'center',
    backgroundColor: '#3A2167',
    borderRadius: 100,
    flexDirection: 'row',
    gap: 6,
    height: 34,
    paddingHorizontal: 14,
  },
  actionBtnPresent: {
    backgroundColor: '#16A34A',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '500',
  },
  actionBtnTextPresent: {
    color: '#FFFFFF',
  },

  // Empty
  emptyWrap: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#7C737E',
    fontFamily: 'Urbanist',
    fontSize: 14,
  },

  // Legacy (kept for compatibility)
  loadingWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  errorWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
});
