import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { AppText } from '../../../../shared/ui';
import { apiClient } from '../../../../shared/api/apiClient';

interface Registrant {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly university: string;
  readonly location: string;
  readonly course: string;
  readonly gender: string | null;
  readonly status: 'Completed' | 'Incomplete' | string;
  readonly approved: boolean;
  readonly passEmailSent: boolean;
}

interface ManageRegistrationScreenProps {
  readonly slug: string;
}

export function ManageRegistrationScreen({ slug }: ManageRegistrationScreenProps) {
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useQuery<Registrant[]>({
    queryKey: ['event', 'registrations', slug],
    queryFn: () => apiClient.getAuth<Registrant[]>(`/events/by-slug/${slug}/registrations`),
    enabled: !!slug,
    staleTime: 1000 * 60 * 2,
    retry: false,
  });

  const registrations = data ?? [];
  const filtered = search.trim()
    ? registrations.filter(
        (item) =>
          item.name.toLowerCase().includes(search.toLowerCase()) ||
          item.email.toLowerCase().includes(search.toLowerCase()) ||
          item.university.toLowerCase().includes(search.toLowerCase()),
      )
    : registrations;

  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#42007A" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.errorWrap}>
        <AppText style={styles.errorText}>Unable to load registrations.</AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search and Host Row */}
      <View style={styles.topRow}>
        <View style={styles.searchWrap}>
          <TextInput
            onChangeText={setSearch}
            placeholder="Search"
            placeholderTextColor="#9C8DAA"
            style={styles.searchInput}
            value={search}
          />
          <View style={styles.searchIconWrap}>
            <View style={styles.searchCircle} />
            <View style={styles.searchHandle} />
          </View>
        </View>
        <Pressable style={styles.hostBtn}>
          <View style={styles.plusIconWrap}>
            <View style={styles.plusH} />
            <View style={styles.plusV} />
          </View>
          <AppText style={styles.hostBtnText}>Host</AppText>
        </Pressable>
      </View>

      {/* Sort and Filter Row */}
      <View style={styles.filterRow}>
        <Pressable style={styles.actionPill}>
          <SortArrowsIcon />
          <AppText style={styles.actionPillText}>Sort</AppText>
        </Pressable>
        <Pressable style={styles.actionPill}>
          <FilterFunnelIcon />
          <AppText style={styles.actionPillText}>Filter</AppText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filtered.map((item, index) => {
          // Simulate some variations for the Pass Sent badge as per the image
          // Assuming some are green (sent) and some are red (not sent, even though the image says Pass Sent on red)
          // The image has a red "Pass Sent" button on the 3rd item which has a Send Pass action
          const isSent = index !== 2; 

          return (
            <View key={item.id} style={styles.card}>
              {/* Top Row of Card */}
              <View style={styles.cardTopRow}>
                {/* Avatar */}
                <View style={styles.avatarWrap}>
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
                    <AppText numberOfLines={1} style={styles.infoText}>{item.university || 'Design Institute of India'}</AppText>
                  </View>
                </View>

                {/* Status Badge */}
                <View style={styles.completedBadge}>
                  <AppText style={styles.completedBadgeText}>Completed</AppText>
                </View>
              </View>

              {/* Bottom Row of Card */}
              <View style={styles.cardBottomRow}>
                {/* Pass Status Badge */}
                <View style={[styles.passBadge, isSent ? styles.passBadgeGreen : styles.passBadgeRed]}>
                  <AppText style={[styles.passBadgeText, isSent ? styles.passBadgeTextGreen : styles.passBadgeTextRed]}>
                    Pass Sent
                  </AppText>
                </View>

                {/* Action Button */}
                {isSent ? (
                  <Pressable style={styles.actionBtn}>
                    <CheckCircleOutlineIcon />
                    <AppText style={styles.actionBtnText}>Mark Present</AppText>
                  </Pressable>
                ) : (
                  <Pressable style={styles.actionBtn}>
                    <TicketIcon />
                    <AppText style={styles.actionBtnText}>Send Pass</AppText>
                  </Pressable>
                )}
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

// Icons
function SortArrowsIcon() {
  return (
    <View style={{ height: 12, width: 12, position: 'relative' }}>
      <View style={{ backgroundColor: '#584D5A', height: 10, width: 1.5, position: 'absolute', left: 3, top: 1 }} />
      <View style={{ borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: '#584D5A', width: 4, height: 4, position: 'absolute', left: 2, top: 1, transform: [{ rotate: '-45deg' }] }} />
      
      <View style={{ backgroundColor: '#584D5A', height: 10, width: 1.5, position: 'absolute', left: 8, top: 1 }} />
      <View style={{ borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderColor: '#584D5A', width: 4, height: 4, position: 'absolute', left: 7, top: 7, transform: [{ rotate: '-45deg' }] }} />
    </View>
  );
}

function FilterFunnelIcon() {
  return (
    <View style={{ height: 12, width: 12, alignItems: 'center' }}>
      <View style={{ borderColor: '#584D5A', borderWidth: 1.5, borderRadius: 1.5, width: 12, height: 4, marginTop: 1 }} />
      <View style={{ backgroundColor: '#584D5A', width: 1.5, height: 6 }} />
      <View style={{ backgroundColor: '#584D5A', width: 4, height: 1.5 }} />
    </View>
  );
}

function MailIcon() {
  return (
    <View style={{ height: 10, width: 12, borderColor: '#584D5A', borderWidth: 1.2, borderRadius: 2, justifyContent: 'center' }}>
      <View style={{ borderBottomWidth: 1.2, borderRightWidth: 1.2, borderColor: '#584D5A', width: 6, height: 6, alignSelf: 'center', transform: [{ rotate: '45deg' }, { translateY: -3 }] }} />
    </View>
  );
}

function CapIcon() {
  return (
    <View style={{ height: 10, width: 12, alignItems: 'center', marginTop: 2 }}>
      <View style={{ backgroundColor: '#584D5A', width: 12, height: 1.5, position: 'absolute', top: 2 }} />
      <View style={{ borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderRightWidth: 1.5, borderColor: '#584D5A', width: 8, height: 4, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, position: 'absolute', top: 3.5 }} />
      <View style={{ backgroundColor: '#584D5A', width: 3, height: 1.5, position: 'absolute', left: 0, top: 0, transform: [{ rotate: '-45deg' }] }} />
    </View>
  );
}

function CheckCircleOutlineIcon() {
  return (
    <View style={{ height: 14, width: 14, borderColor: '#E5D8FF', borderWidth: 1.2, borderRadius: 7, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ borderBottomWidth: 1.2, borderRightWidth: 1.2, borderColor: '#E5D8FF', width: 4, height: 7, transform: [{ rotate: '45deg' }, { translateY: -1 }, { translateX: -1 }] }} />
    </View>
  );
}

function TicketIcon() {
  return (
    <View style={{ height: 12, width: 16, borderColor: '#E5D8FF', borderWidth: 1.2, borderRadius: 3, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ backgroundColor: '#3A2167', width: 2, height: 4, borderRightWidth: 1.2, borderTopWidth: 1.2, borderBottomWidth: 1.2, borderColor: '#E5D8FF', borderTopRightRadius: 3, borderBottomRightRadius: 3, marginLeft: -1.2 }} />
      <View style={{ height: 10, borderLeftWidth: 1.2, borderColor: '#E5D8FF', borderStyle: 'dotted' }} />
      <View style={{ backgroundColor: '#3A2167', width: 2, height: 4, borderLeftWidth: 1.2, borderTopWidth: 1.2, borderBottomWidth: 1.2, borderColor: '#E5D8FF', borderTopLeftRadius: 3, borderBottomLeftRadius: 3, marginRight: -1.2 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAFA',
    flex: 1,
  },
  loadingWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  errorWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontFamily: 'Urbanist',
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchWrap: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E6E8',
    borderRadius: 100,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    height: 44,
    paddingHorizontal: 16,
  },
  searchInput: {
    color: '#100013',
    flex: 1,
    fontFamily: 'Urbanist',
    fontSize: 15,
  },
  searchIconWrap: {
    height: 18,
    position: 'relative',
    width: 18,
  },
  searchCircle: {
    borderColor: '#9CA3AF',
    borderRadius: 6,
    borderWidth: 1.5,
    height: 12,
    left: 1,
    position: 'absolute',
    top: 1,
    width: 12,
  },
  searchHandle: {
    backgroundColor: '#9CA3AF',
    borderRadius: 1,
    bottom: 2,
    height: 1.5,
    position: 'absolute',
    right: 0,
    transform: [{ rotate: '45deg' }],
    width: 6,
  },
  hostBtn: {
    alignItems: 'center',
    backgroundColor: '#3A2167',
    borderRadius: 100,
    flexDirection: 'row',
    gap: 6,
    height: 44,
    paddingHorizontal: 16,
  },
  plusIconWrap: {
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.5,
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  plusH: {
    backgroundColor: '#FFFFFF',
    height: 1.5,
    position: 'absolute',
    width: 8,
  },
  plusV: {
    backgroundColor: '#FFFFFF',
    height: 8,
    position: 'absolute',
    width: 1.5,
  },
  hostBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionPill: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  actionPillText: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E8E6E8',
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatarWrap: {
    alignItems: 'center',
    backgroundColor: '#9C8DAA',
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    marginRight: 12,
    width: 56,
  },
  avatarText: {
    color: '#FFFFFF',
    fontFamily: 'Aeonik Pro',
    fontSize: 24,
    fontWeight: '600',
  },
  infoCol: {
    flex: 1,
    gap: 6,
  },
  nameText: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 16,
    fontWeight: '600',
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  infoText: {
    color: '#7C737E',
    fontFamily: 'Urbanist',
    fontSize: 13,
  },
  completedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF08A',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  completedBadgeText: {
    color: '#A16207',
    fontFamily: 'Urbanist',
    fontSize: 11,
    fontWeight: '600',
  },
  cardBottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  passBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  passBadgeGreen: {
    backgroundColor: '#BBF7D0',
  },
  passBadgeRed: {
    backgroundColor: '#FECACA',
  },
  passBadgeText: {
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '500',
  },
  passBadgeTextGreen: {
    color: '#166534',
  },
  passBadgeTextRed: {
    color: '#991B1B',
  },
  actionBtn: {
    alignItems: 'center',
    backgroundColor: '#3A2167',
    borderRadius: 100,
    flexDirection: 'row',
    gap: 6,
    height: 36,
    paddingHorizontal: 16,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '500',
  },
  emptyWrap: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#7C737E',
    fontFamily: 'Urbanist',
    fontSize: 14,
  },
});
