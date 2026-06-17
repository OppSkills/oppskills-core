import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../shared/ui';

interface FestivalOpportunity {
  id: string;
  title: string;
  type: string;
  candidates: string;
  startDate: string;
  startTime: string;
  deadlineDate: string;
  deadlineTime: string;
  isOpen: boolean;
}

const mockOpportunities: FestivalOpportunity[] = [
  {
    id: '1',
    title: 'Sustainable Gardening Webinar',
    type: 'Webinar',
    candidates: '1,120',
    startDate: '20 Feb 26',
    startTime: '11:00 AM IST',
    deadlineDate: '18 Feb 26',
    deadlineTime: '06:00 PM IST',
    isOpen: true,
  },
  {
    id: '2',
    title: 'Hydroponics Basics Course',
    type: 'Course',
    candidates: '3,150',
    startDate: '05 Mar 26',
    startTime: '10:00 AM IST',
    deadlineDate: '28 Feb 26',
    deadlineTime: '11:59 PM IST',
    isOpen: false,
  },
  {
    id: '3',
    title: 'Composting and Waste Management Seminar',
    type: 'Seminar',
    candidates: '980',
    startDate: '12 Jan 26',
    startTime: '03:30 PM IST',
    deadlineDate: '08 Jan 26',
    deadlineTime: '05:00 PM IST',
    isOpen: true,
  },
  {
    id: '4',
    title: 'Vertical Farming Innovations',
    type: 'Workshop',
    candidates: '2,800',
    startDate: '22 Mar 26',
    startTime: '09:00 AM IST',
    deadlineDate: '18 Mar 26',
    deadlineTime: '05:00 PM IST',
    isOpen: false,
  },
];

interface FestivalManageRegistrationScreenProps {
  readonly slug: string;
}

export function FestivalManageRegistrationScreen({ slug }: FestivalManageRegistrationScreenProps) {
  const [opportunities, setOpportunities] = useState(mockOpportunities);
  const [activeTab, setActiveTab] = useState('all');

  function toggleStatus(id: string) {
    setOpportunities((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, isOpen: !opt.isOpen } : opt))
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          <Pressable onPress={() => setActiveTab('all')} style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}>
            <AppText style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>All Opportunities (543)</AppText>
            <View style={styles.tabIconWrap}><CloseIcon active={activeTab === 'all'} /></View>
          </Pressable>

          <Pressable onPress={() => setActiveTab('events')} style={[styles.tabBtn, activeTab === 'events' && styles.tabBtnActive]}>
            <AppText style={[styles.tabText, activeTab === 'events' && styles.tabTextActive]}>Events (200)</AppText>
            <View style={styles.tabIconWrap}><CloseIcon active={activeTab === 'events'} /></View>
          </Pressable>

          <Pressable onPress={() => setActiveTab('competitions')} style={[styles.tabBtn, activeTab === 'competitions' && styles.tabBtnActive]}>
            <AppText style={[styles.tabText, activeTab === 'competitions' && styles.tabTextActive]}>Competitions (343)</AppText>
            <View style={styles.tabIconWrap}><CloseIcon active={activeTab === 'competitions'} /></View>
          </Pressable>
        </ScrollView>
      </View>

      {/* Cards List */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {opportunities.map((item) => (
          <View key={item.id} style={styles.card}>
            {/* Top Row: Banner and Info */}
            <View style={styles.cardTop}>
              <View style={styles.bannerWrap}>
                <View style={styles.bannerPlaceholder}>
                  <AppText style={styles.bannerText}>HACKATHON</AppText>
                </View>
              </View>
              <View style={styles.cardInfo}>
                <AppText numberOfLines={2} style={styles.titleText}>{item.title}</AppText>
                
                <View style={styles.badgesRow}>
                  <View style={styles.badgeGray}>
                    <AppText style={styles.badgeGrayText}>{item.type}</AppText>
                  </View>
                  <View style={styles.badgeGray}>
                    <UserIcon />
                    <AppText style={styles.badgeGrayText}>{item.candidates} Candidates</AppText>
                  </View>
                </View>
              </View>
            </View>

            {/* Bottom Row: Dates and Toggle */}
            <View style={styles.cardBottom}>
              <View style={styles.dateCol}>
                <AppText style={styles.dateLabel}>Starting Date</AppText>
                <AppText style={styles.dateVal}>{item.startDate}</AppText>
                <AppText style={styles.timeVal}>{item.startTime}</AppText>
              </View>

              <View style={styles.dateCol}>
                <AppText style={styles.dateLabel}>Deadline Date</AppText>
                <AppText style={styles.dateVal}>{item.deadlineDate}</AppText>
                <AppText style={styles.timeVal}>{item.deadlineTime}</AppText>
              </View>

              <View style={styles.registrationCol}>
                <AppText style={styles.dateLabel}>Registrations</AppText>
                <View style={styles.toggleRow}>
                  <Pressable onPress={() => toggleStatus(item.id)} style={[styles.toggleTrack, item.isOpen ? styles.toggleOpen : styles.toggleClosed]}>
                    <View style={[styles.toggleThumb, item.isOpen ? styles.thumbOpen : styles.thumbClosed]} />
                  </Pressable>
                  
                  {item.isOpen ? (
                    <View style={styles.statusBadgeOpen}>
                      <AppText style={styles.statusBadgeTextOpen}>Open</AppText>
                    </View>
                  ) : (
                    <View style={styles.statusBadgeClosed}>
                      <AppText style={styles.statusBadgeTextClosed}>Closed</AppText>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// Icons
function CloseIcon({ active }: { active: boolean }) {
  const color = active ? '#6949AA' : '#9C8DAA';
  return (
    <View style={{ height: 16, width: 16, borderRadius: 8, borderWidth: 1.2, borderColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', backgroundColor: color, height: 1.2, width: 8, transform: [{ rotate: '45deg' }] }} />
      <View style={{ position: 'absolute', backgroundColor: color, height: 1.2, width: 8, transform: [{ rotate: '-45deg' }] }} />
    </View>
  );
}

function UserIcon() {
  return (
    <View style={{ height: 12, width: 12, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View style={{ borderColor: '#584D5A', borderWidth: 1.2, borderRadius: 6, width: 6, height: 6, position: 'absolute', top: 0 }} />
      <View style={{ borderTopWidth: 1.2, borderLeftWidth: 1.2, borderRightWidth: 1.2, borderColor: '#584D5A', borderRadius: 4, width: 10, height: 4, marginTop: 7 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAFA',
    flex: 1,
  },
  tabsWrapper: {
    borderBottomColor: '#E8E6E8',
    borderBottomWidth: 1,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#6949AA',
  },
  tabText: {
    color: '#7C737E',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#6949AA',
    fontWeight: '600',
  },
  tabIconWrap: {
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    gap: 20,
    paddingBottom: 40,
  },
  card: {
    borderBottomColor: '#E8E6E8',
    borderBottomWidth: 1,
    paddingBottom: 20,
    gap: 16,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
  },
  bannerWrap: {
    width: 140,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  bannerPlaceholder: {
    backgroundColor: '#0F172A',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    color: '#38BDF8',
    fontFamily: 'Aeonik Pro',
    fontSize: 14,
    letterSpacing: 2,
    opacity: 0.8,
  },
  cardInfo: {
    flex: 1,
    gap: 8,
  },
  titleText: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeGray: {
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeGrayText: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 11,
    fontWeight: '500',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dateCol: {
    gap: 2,
  },
  registrationCol: {
    gap: 6,
  },
  dateLabel: {
    color: '#7C737E',
    fontFamily: 'Urbanist',
    fontSize: 11,
  },
  dateVal: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '500',
  },
  timeVal: {
    color: '#9CA3AF',
    fontFamily: 'Urbanist',
    fontSize: 11,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleTrack: {
    width: 36,
    height: 20,
    borderRadius: 10,
    padding: 2,
    justifyContent: 'center',
  },
  toggleOpen: {
    backgroundColor: '#10B981',
  },
  toggleClosed: {
    backgroundColor: '#EF4444',
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  thumbOpen: {
    alignSelf: 'flex-end',
  },
  thumbClosed: {
    alignSelf: 'flex-start',
  },
  statusBadgeOpen: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeClosed: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeTextOpen: {
    color: '#059669',
    fontFamily: 'Urbanist',
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadgeTextClosed: {
    color: '#DC2626',
    fontFamily: 'Urbanist',
    fontSize: 11,
    fontWeight: '600',
  },
});
