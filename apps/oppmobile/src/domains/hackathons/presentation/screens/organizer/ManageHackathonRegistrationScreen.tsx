import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../../../../../shared/ui';

interface Registrant {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly college: string;
  readonly regStatus: 'completed' | 'pending' | 'rejected';
  readonly passSent: boolean;
}

const MOCK_REGISTRANTS: readonly Registrant[] = [
  {
    id: '1',
    name: '4154arpit Mehral',
    email: '4154arpitmehrl@gmail.com',
    college: 'Trinity Institute of Innovations in Professional Studies',
    regStatus: 'completed',
    passSent: true,
  },
  {
    id: '2',
    name: 'Maya Patel',
    email: 'maya.patel@designhub.com',
    college: 'Design Institute of India',
    regStatus: 'completed',
    passSent: false,
  },
  {
    id: '3',
    name: 'Arjun Singh',
    email: 'arjun.singh@iitb.ac.in',
    college: 'IIT Bombay',
    regStatus: 'pending',
    passSent: false,
  },
];

const REG_STATUS_CONFIG = {
  completed: { bg: '#EDE9F5', text: '#6949AA', label: 'Completed' },
  pending: { bg: '#FFEF99', text: '#8E7700', label: 'Pending' },
  rejected: { bg: '#FFCECB', text: '#E92215', label: 'Rejected' },
};

const COL_SERIAL = 44;
const COL_PARTICIPANT = 220;
const COL_REG_STATUS = 110;
const COL_PASS_STATUS = 110;
const COL_ACTIONS = 110;
const TABLE_WIDTH = COL_SERIAL + COL_PARTICIPANT + COL_REG_STATUS + COL_PASS_STATUS + COL_ACTIONS;

export function ManageHackathonRegistrationScreen() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = search.trim()
    ? MOCK_REGISTRANTS.filter(
        (r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.email.toLowerCase().includes(search.toLowerCase()),
      )
    : MOCK_REGISTRANTS;

  const totalPages = Math.max(1, Math.ceil(filtered.length / 10));

  return (
    <View style={styles.screen}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        {/* Filter pill */}
        <Pressable style={styles.filterPill}>
          <FunnelIcon />
          <AppText numberOfLines={1} style={styles.filterPillText}>
            All Registrations ({filtered.length})
          </AppText>
          <View style={styles.chevronDown} />
        </Pressable>

        {/* Search */}
        <View style={styles.searchWrap}>
          <TextInput
            onChangeText={setSearch}
            placeholder="Search"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={search}
          />
          <View style={styles.searchIconWrap}>
            <View style={styles.searchCircle} />
            <View style={styles.searchHandle} />
          </View>
        </View>

        {/* Export */}
        <Pressable style={styles.exportBtn}>
          <DownloadIcon />
          <AppText style={styles.exportText}>Export</AppText>
        </Pressable>
      </View>

      {/* Table */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.tableScroll}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ width: TABLE_WIDTH }}>
            {/* Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.th, { width: COL_SERIAL }]}>
                <AppText style={styles.thText}>S.No.</AppText>
              </View>
              <View style={[styles.th, { width: COL_PARTICIPANT }]}>
                <View style={styles.thWithIcon}>
                  <AppText style={styles.thText}>{filtered.length} Participated</AppText>
                </View>
              </View>
              <View style={[styles.th, { width: COL_REG_STATUS }]}>
                <View style={styles.thWithIcon}>
                  <AppText style={styles.thText}>Reg. Status</AppText>
                </View>
              </View>
              <View style={[styles.th, { width: COL_PASS_STATUS }]}>
                <AppText style={styles.thText}>Pass Status</AppText>
              </View>
              <View style={[styles.th, styles.thLast, { width: COL_ACTIONS }]}>
                <AppText style={styles.thText}>Actions</AppText>
              </View>
            </View>

            {/* Rows */}
            {filtered.map((item, index) => {
              const regCfg = REG_STATUS_CONFIG[item.regStatus];
              return (
                <View key={item.id} style={styles.row}>
                  <View style={[styles.td, { width: COL_SERIAL }]}>
                    <AppText style={styles.serialText}>{index + 1}</AppText>
                  </View>

                  <View style={[styles.td, { width: COL_PARTICIPANT, alignItems: 'flex-start' }]}>
                    <View style={styles.participantCell}>
                      <View style={styles.avatar}>
                        <AppText style={styles.avatarInitial}>{item.name.charAt(0).toUpperCase()}</AppText>
                      </View>
                      <View style={styles.participantInfo}>
                        <AppText numberOfLines={1} style={styles.participantName}>{item.name}</AppText>
                        <AppText numberOfLines={1} style={styles.participantEmail}>{item.email}</AppText>
                        <AppText numberOfLines={1} style={styles.participantCollege}>{item.college}</AppText>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.td, { width: COL_REG_STATUS }]}>
                    <View style={[styles.badge, { backgroundColor: regCfg.bg }]}>
                      <AppText style={[styles.badgeText, { color: regCfg.text }]}>{regCfg.label}</AppText>
                    </View>
                  </View>

                  <View style={[styles.td, { width: COL_PASS_STATUS }]}>
                    {item.passSent ? (
                      <View style={[styles.badge, { backgroundColor: '#D1FAE5' }]}>
                        <AppText style={[styles.badgeText, { color: '#059669' }]}>✓ Pass Sent</AppText>
                      </View>
                    ) : (
                      <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}>
                        <AppText style={[styles.badgeText, { color: '#D97706' }]}>Pending</AppText>
                      </View>
                    )}
                  </View>

                  <View style={[styles.td, styles.tdLast, { width: COL_ACTIONS }]}>
                    <View style={styles.actionsCell}>
                      <Pressable style={styles.viewBtn}>
                        <AppText style={styles.viewBtnText}>Send Email</AppText>
                      </Pressable>
                      <Pressable style={styles.moreBtn}>
                        <View style={styles.moreDot} />
                        <View style={styles.moreDot} />
                        <View style={styles.moreDot} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}

            {filtered.length === 0 && (
              <View style={styles.emptyRow}>
                <AppText style={styles.emptyText}>No registrants found.</AppText>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Pagination */}
        <View style={styles.pagination}>
          <Pressable
            disabled={page <= 1}
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            style={[styles.pageBtn, page <= 1 ? styles.pageBtnDisabled : null]}
          >
            <View style={styles.chevronLeft} />
          </Pressable>

          <View style={styles.pageNumActive}>
            <AppText style={styles.pageNumActiveText}>{page}</AppText>
          </View>

          <Pressable
            disabled={page >= totalPages}
            onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
            style={[styles.pageBtn, page >= totalPages ? styles.pageBtnDisabled : null]}
          >
            <View style={styles.chevronRight} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function FunnelIcon() {
  return (
    <View style={{ height: 14, width: 14, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ backgroundColor: '#8359D5', borderRadius: 1, height: 1.5, width: 12, marginBottom: 2 }} />
      <View style={{ backgroundColor: '#8359D5', borderRadius: 1, height: 1.5, width: 8, marginBottom: 2 }} />
      <View style={{ backgroundColor: '#8359D5', borderRadius: 1, height: 1.5, width: 4 }} />
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

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FAFAFA',
    flex: 1,
  },
  toolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  filterPill: {
    alignItems: 'center',
    backgroundColor: '#F3EEFF',
    borderColor: '#DDD6FE',
    borderRadius: 100,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
  },
  filterPillText: {
    color: '#6949AA',
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 110,
  },
  chevronDown: {
    borderBottomColor: '#6949AA',
    borderBottomWidth: 1.5,
    borderRightColor: '#6949AA',
    borderRightWidth: 1.5,
    height: 5,
    transform: [{ rotate: '45deg' }],
    width: 5,
  },
  searchWrap: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E6E8',
    borderRadius: 100,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    height: 36,
    paddingHorizontal: 12,
  },
  searchInput: {
    color: '#100013',
    flex: 1,
    fontFamily: 'Urbanist',
    fontSize: 13,
    paddingVertical: 0,
  },
  searchIconWrap: {
    height: 16,
    position: 'relative',
    width: 16,
  },
  searchCircle: {
    borderColor: '#9CA3AF',
    borderRadius: 5,
    borderWidth: 1.5,
    height: 10,
    left: 1,
    position: 'absolute',
    top: 1,
    width: 10,
  },
  searchHandle: {
    backgroundColor: '#9CA3AF',
    borderRadius: 1,
    bottom: 1,
    height: 1.5,
    position: 'absolute',
    right: 0,
    transform: [{ rotate: '45deg' }],
    width: 5,
  },
  exportBtn: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E6E8',
    borderRadius: 100,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    height: 36,
    paddingHorizontal: 12,
  },
  exportText: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '500',
  },
  tableScroll: {
    flex: 1,
  },
  tableHeader: {
    backgroundColor: '#1C1340',
    flexDirection: 'row',
  },
  th: {
    borderRightColor: 'rgba(255,255,255,0.2)',
    borderRightWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  thLast: {
    borderRightWidth: 0,
  },
  thText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 11,
    fontWeight: '400',
    textAlign: 'center',
  },
  thWithIcon: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
  },
  row: {
    borderBottomColor: '#E8E6E8',
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  td: {
    alignItems: 'center',
    borderRightColor: '#E8E6E8',
    borderRightWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  tdLast: {
    borderRightWidth: 0,
  },
  serialText: {
    color: '#9CA3AF',
    fontFamily: 'Urbanist',
    fontSize: 12,
    textAlign: 'center',
  },
  participantCell: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#EDE9F5',
    borderRadius: 20,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  avatarInitial: {
    color: '#6949AA',
    fontFamily: 'Aeonik Pro',
    fontSize: 14,
    fontWeight: '600',
  },
  participantInfo: {
    flex: 1,
    gap: 2,
  },
  participantName: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '600',
  },
  participantEmail: {
    color: '#7C737E',
    fontFamily: 'Urbanist',
    fontSize: 11,
    fontWeight: '400',
  },
  participantCollege: {
    color: '#7C737E',
    fontFamily: 'Urbanist',
    fontSize: 10,
    fontWeight: '400',
    marginTop: 1,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontFamily: 'Urbanist',
    fontSize: 11,
    fontWeight: '500',
  },
  actionsCell: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
  },
  viewBtn: {
    alignItems: 'center',
    borderRadius: 100,
    height: 28,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  viewBtnText: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '500',
  },
  moreBtn: {
    alignItems: 'center',
    borderRadius: 100,
    gap: 3,
    height: 28,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  moreDot: {
    backgroundColor: '#584D5A',
    borderRadius: 2,
    height: 3,
    width: 3,
  },
  emptyRow: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#9CA3AF',
    fontFamily: 'Urbanist',
    fontSize: 13,
  },
  pagination: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  pageBtn: {
    alignItems: 'center',
    backgroundColor: '#F3EEFF',
    borderColor: '#DDD6FE',
    borderRadius: 6,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  pageBtnDisabled: {
    opacity: 0.3,
  },
  pageNumActive: {
    alignItems: 'center',
    backgroundColor: '#6949AA',
    borderRadius: 6,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  pageNumActiveText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '700',
  },
  chevronLeft: {
    borderBottomColor: '#6949AA',
    borderBottomWidth: 1.5,
    borderLeftColor: '#6949AA',
    borderLeftWidth: 1.5,
    height: 7,
    transform: [{ rotate: '45deg' }],
    width: 7,
  },
  chevronRight: {
    borderRightColor: '#6949AA',
    borderRightWidth: 1.5,
    borderTopColor: '#6949AA',
    borderTopWidth: 1.5,
    height: 7,
    transform: [{ rotate: '45deg' }],
    width: 7,
  },
});
