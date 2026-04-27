import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../../../../shared/ui';

type RegistrantStatus = 'approved' | 'rejected' | 'pending';

interface Registrant {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly college: string;
  readonly eventType: string;
  readonly status: RegistrantStatus;
}

const MOCK_REGISTRANTS: readonly Registrant[] = [
  { id: '1', name: 'Maya Patel', email: 'maya.patel@designhub.com', college: 'Design Institute of India', eventType: 'Hackathon', status: 'approved' },
  { id: '2', name: 'Arjun Singh', email: 'arjun.singh@iitb.ac.in', college: 'IIT Bombay', eventType: 'Hackathon', status: 'approved' },
  { id: '3', name: 'Priya Sharma', email: 'priya.sharma@bits.edu', college: 'BITS Pilani', eventType: 'Hackathon', status: 'rejected' },
  { id: '4', name: 'Rohan Mehta', email: 'rohan.mehta@nit.ac.in', college: 'NIT Trichy', eventType: 'Hackathon', status: 'approved' },
  { id: '5', name: 'Sneha Kapoor', email: 'sneha.kapoor@vit.ac.in', college: 'VIT Vellore', eventType: 'Hackathon', status: 'pending' },
];

const STATUS_CONFIG: Record<RegistrantStatus, { bg: string; text: string; label: string }> = {
  approved: { bg: '#B7FCC7', text: '#0A9952', label: 'Approved' },
  rejected: { bg: '#FFCECB', text: '#E92215', label: 'Rejected' },
  pending: { bg: '#FFEF99', text: '#8E7700', label: 'Pending' },
};

export interface EventRegistrationsPanelProps {
  readonly onOpenSidebar: () => void;
}

export function EventRegistrationsPanel({ onOpenSidebar: _onOpenSidebar }: EventRegistrationsPanelProps) {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? MOCK_REGISTRANTS.filter(
        (r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.email.toLowerCase().includes(search.toLowerCase()),
      )
    : MOCK_REGISTRANTS;

  return (
    <View style={styles.screen}>
      {/* Sub-header */}
      <View style={styles.subHeader}>
        <AppText style={styles.subHeaderTitle}>Registrations</AppText>
      </View>

      {/* Search + New button */}
      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <TextInput
            onChangeText={setSearch}
            placeholder="Search registrants"
            placeholderTextColor="#7C737E"
            style={styles.searchInput}
            value={search}
          />
          <View style={styles.searchIcon}>
            <View style={styles.searchCircle} />
            <View style={styles.searchHandle} />
          </View>
        </View>
        <Pressable style={styles.newBtn}>
          <AppText style={styles.newBtnText}>New</AppText>
        </Pressable>
      </View>

      {/* Sort / Filter row */}
      <View style={styles.filterRow}>
        <Pressable style={styles.filterBtn}>
          <AppText style={styles.filterBtnText}>Sort</AppText>
        </Pressable>
        <Pressable style={styles.filterBtn}>
          <AppText style={styles.filterBtnText}>Filter</AppText>
        </Pressable>
      </View>

      {/* Registrant list */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filtered.map((item, index) => (
          <View key={item.id}>
            <RegistrantCard registrant={item} />
            {index < filtered.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
        {filtered.length === 0 && (
          <AppText style={styles.emptyText}>No registrants found.</AppText>
        )}
      </ScrollView>
    </View>
  );
}

function RegistrantCard({ registrant }: { readonly registrant: Registrant }) {
  const statusCfg = STATUS_CONFIG[registrant.status];

  return (
    <View style={styles.card}>
      {/* Avatar */}
      <View style={styles.avatar}>
        <AppText style={styles.avatarInitial}>
          {registrant.name.charAt(0)}
        </AppText>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        {/* Row 1: name + event type badge */}
        <View style={styles.cardRow}>
          <AppText style={styles.cardName}>{registrant.name}</AppText>
          <View style={[styles.eventTypeBadge, { backgroundColor: '#FFEF99' }]}>
            <AppText style={[styles.eventTypeBadgeText, { color: '#8E7700' }]}>
              {registrant.eventType}
            </AppText>
          </View>
        </View>

        {/* Row 2: email + college */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <View style={styles.mailIcon}>
              <View style={styles.mailOutline} />
              <View style={styles.mailFlap} />
            </View>
            <AppText numberOfLines={1} style={styles.metaText}>{registrant.email}</AppText>
          </View>
          <View style={styles.metaItem}>
            <View style={styles.capIcon}>
              <View style={styles.capBrim} />
              <View style={styles.capBody} />
            </View>
            <AppText numberOfLines={1} style={styles.metaText}>{registrant.college}</AppText>
          </View>
        </View>

        {/* Row 3: status chip + action button */}
        <View style={styles.cardActions}>
          <View style={[styles.statusChip, { backgroundColor: statusCfg.bg }]}>
            <AppText style={[styles.statusChipText, { color: statusCfg.text }]}>
              {statusCfg.label}
            </AppText>
          </View>
          <Pressable style={styles.actionBtn}>
            <AppText style={styles.actionBtnText}>
              {registrant.status === 'rejected' ? 'View Profile' : 'Mark Approved'}
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FAFAFA',
    flex: 1,
  },

  subHeader: {
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderBottomColor: '#E8E6E8',
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 56,
    paddingHorizontal: 20,
  },
  subHeaderTitle: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 20,
  },

  toolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderColor: '#C3BFC4',
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    height: 40,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  searchInput: {
    color: '#342636',
    flex: 1,
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
    paddingVertical: 0,
  },
  searchIcon: {
    alignItems: 'center',
    height: 20,
    justifyContent: 'center',
    position: 'relative',
    width: 20,
  },
  searchCircle: {
    borderColor: '#7C737E',
    borderRadius: 6,
    borderWidth: 1.5,
    height: 12,
    left: 2,
    position: 'absolute',
    top: 1,
    width: 12,
  },
  searchHandle: {
    backgroundColor: '#7C737E',
    borderRadius: 1,
    bottom: 2,
    height: 1.5,
    position: 'absolute',
    right: 1,
    transform: [{ rotate: '45deg' }],
    width: 6,
  },
  newBtn: {
    alignItems: 'center',
    backgroundColor: '#423072',
    borderRadius: 100,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  newBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 14,
  },

  filterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 4,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  filterBtn: {
    alignItems: 'center',
    borderRadius: 100,
    flexDirection: 'row',
    gap: 4,
    height: 28,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  filterBtnText: {
    color: '#423072',
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 14,
  },

  listContent: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },

  divider: {
    backgroundColor: '#E8E6E8',
    height: 1,
    marginVertical: 0,
  },

  card: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 16,
  },

  avatar: {
    alignItems: 'center',
    backgroundColor: '#EDE9F5',
    borderRadius: 4,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  avatarInitial: {
    color: '#42007A',
    fontFamily: 'Aeonik Pro',
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
  },

  cardInfo: {
    flex: 1,
    gap: 8,
  },

  cardRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardName: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 22,
  },
  eventTypeBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  eventTypeBadgeText: {
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  },

  metaRow: {
    gap: 6,
  },
  metaItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  metaText: {
    color: '#7C737E',
    flex: 1,
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },

  // mail icon drawn with views
  mailIcon: {
    alignItems: 'center',
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  mailOutline: {
    borderColor: '#584D5A',
    borderRadius: 3,
    borderWidth: 1.125,
    height: 12,
    position: 'absolute',
    width: 14,
  },
  mailFlap: {
    borderColor: '#584D5A',
    borderTopWidth: 1.125,
    height: 5,
    position: 'absolute',
    top: 3,
    transform: [{ rotate: '0deg' }],
    width: 10,
  },

  // cap icon drawn with views
  capIcon: {
    alignItems: 'center',
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  capBrim: {
    borderColor: '#584D5A',
    borderTopWidth: 1.125,
    height: 2,
    position: 'absolute',
    top: 7,
    width: 14,
  },
  capBody: {
    borderColor: '#584D5A',
    borderRadius: 2,
    borderWidth: 1.125,
    height: 6,
    position: 'absolute',
    top: 9,
    width: 10,
  },

  cardActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusChip: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusChipText: {
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
  },
  actionBtn: {
    alignItems: 'center',
    backgroundColor: '#423072',
    borderRadius: 100,
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 14,
  },

  emptyText: {
    color: '#7C737E',
    fontFamily: 'Urbanist',
    fontSize: 14,
    paddingVertical: 40,
    textAlign: 'center',
  },
});
