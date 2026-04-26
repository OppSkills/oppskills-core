import { useState } from 'react';
import { Image, Pressable, ScrollView, TextInput, View } from 'react-native';

import subtractPlaceholder from '../../../../../assets/Subtract.png';
import { AppText } from '../../../../shared/ui';
import { OrganizerCreateEventScreen } from './OrganizerCreateEventScreen';
import { styles } from './OrganizerEventsPanel.styles';

type EventRow = {
  readonly id: string;
  readonly title: string;
  readonly candidates: number;
  readonly startDate: string;
  readonly startTime: string;
  readonly endDate: string;
  readonly endTime: string;
};

const MOCK_EVENTS: readonly EventRow[] = [
  { id: '1', title: 'TECHNOVATE', candidates: 1, startDate: '23 May 26', startTime: '10:00 AM', endDate: '23 May 26', endTime: '10:00 AM' },
  { id: '2', title: 'Pixel Quest – Photography Event', candidates: 76, startDate: '06 Apr 26', startTime: '09:00 AM', endDate: '06 Apr 26', endTime: '09:00 AM' },
  { id: '3', title: '$Y$T3M 3XP0$3D', candidates: 160, startDate: '24 Mar 26', startTime: '02:00 PM', endDate: '24 Mar 26', endTime: '02:00 PM' },
  { id: '4', title: 'Bharat Bolta Hai – 1 Minute Speech Competition', candidates: 47, startDate: '06 Apr 26', startTime: '11:00 AM', endDate: '06 Apr 26', endTime: '11:00 AM' },
  { id: '5', title: "Founder's Connect Meetup | Startup Networking & Pitching", candidates: 33, startDate: '05 Apr 26', startTime: '03:00 PM', endDate: '05 Apr 26', endTime: '03:00 PM' },
  { id: '6', title: 'From Agents to Insights', candidates: 619, startDate: '18 Apr 26', startTime: '10:00 AM', endDate: '18 Apr 26', endTime: '10:00 AM' },
  { id: '7', title: "Pitchin' 180 Seconds – Noida Edition", candidates: 126, startDate: '23 Feb 26', startTime: '10:00 AM', endDate: '23 Feb 26', endTime: '10:00 AM' },
  { id: '8', title: 'CyberChaos', candidates: 52, startDate: '24 Apr 26', startTime: '10:00 AM', endDate: '24 Apr 26', endTime: '10:00 AM' },
  { id: '9', title: 'fsda', candidates: 5, startDate: '17 Jan 26', startTime: '10:00 AM', endDate: '17 Jan 26', endTime: '10:00 AM' },
  { id: '10', title: 'TATVA-DAY 1 registration NIU', candidates: 67, startDate: '16 Jan 26', startTime: '08:30 AM', endDate: '16 Jan 26', endTime: '08:30 AM' },
];

const COL_SERIAL = 50;
const COL_OPPORTUNITY = 300;
const COL_CANDIDATES = 90;
const COL_STATUS = 120;
const COL_DATE = 105;
const COL_REGISTRATIONS = 130;

export interface OrganizerEventsPanelProps {
  readonly onOpenSidebar: () => void;
}

export function OrganizerEventsPanel({ onOpenSidebar: _onOpenSidebar }: OrganizerEventsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  if (showCreate) {
    return <OrganizerCreateEventScreen onBack={() => setShowCreate(false)} />;
  }

  const filtered = searchQuery.trim()
    ? MOCK_EVENTS.filter((e) => e.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : MOCK_EVENTS;

  const tableWidth =
    COL_SERIAL + COL_OPPORTUNITY + COL_CANDIDATES + COL_STATUS + COL_DATE + COL_DATE + COL_REGISTRATIONS;

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <AppText style={styles.eventsTitle}>Events ({MOCK_EVENTS.length})</AppText>
        <View style={styles.topBarRight}>
          <View style={styles.searchBar}>
            <View style={styles.searchSymbolWrap}>
              <View style={styles.searchSymbolCircle} />
              <View style={styles.searchSymbolHandle} />
            </View>
            <TextInput
              onChangeText={setSearchQuery}
              placeholder="Search events"
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              value={searchQuery}
            />
          </View>
          <Pressable onPress={() => setShowCreate(true)} style={styles.hostButton}>
            <View style={styles.plusCircleWrap}>
              <View style={styles.plusH} />
              <View style={styles.plusV} />
            </View>
            <AppText style={styles.hostLabel}>Host</AppText>
          </Pressable>
        </View>
      </View>

      {/* vertical scroll — lets all rows be visible */}
      <ScrollView contentContainerStyle={styles.tableScrollContent} showsVerticalScrollIndicator={false} style={styles.tableScrollOuter}>
        {/* horizontal scroll — lets all columns be visible */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ width: tableWidth }}>
            {/* Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.th, { width: COL_SERIAL }]}>
                <AppText style={styles.thText}>S. No.</AppText>
              </View>
              <View style={[styles.th, { width: COL_OPPORTUNITY }]}>
                <View style={styles.thOpportunity}>
                  <AppText style={styles.thText}>Opportunity Name</AppText>
                </View>
              </View>
              <View style={[styles.th, { width: COL_CANDIDATES }]}>
                <AppText style={styles.thText}>Candidates</AppText>
              </View>
              <View style={[styles.th, { width: COL_STATUS }]}>
                <AppText style={styles.thText}>Status</AppText>
              </View>
              <View style={[styles.th, { width: COL_DATE }]}>
                <AppText style={styles.thText}>Start Date</AppText>
              </View>
              <View style={[styles.th, { width: COL_DATE }]}>
                <AppText style={styles.thText}>End Date</AppText>
              </View>
              <View style={[styles.th, styles.thLast, { width: COL_REGISTRATIONS }]}>
                <AppText style={styles.thText}>Registrations</AppText>
              </View>
            </View>

            {/* Rows */}
            {filtered.map((item, index) => (
              <Pressable key={item.id} style={styles.row}>
                <View style={[styles.td, { width: COL_SERIAL }]}>
                  <AppText style={styles.serialText}>{index + 1}</AppText>
                </View>
                <View style={[styles.td, { width: COL_OPPORTUNITY, alignItems: 'flex-start' }]}>
                  <View style={styles.opportunityCell}>
                    <Image resizeMode="cover" source={subtractPlaceholder} style={styles.thumbnail} />
                    <View style={styles.opportunityInfo}>
                      <AppText numberOfLines={2} style={styles.opportunityTitle}>{item.title}</AppText>
                      <AppText style={styles.eventBadge}>EVENT</AppText>
                    </View>
                  </View>
                </View>
                <View style={[styles.td, { width: COL_CANDIDATES }]}>
                  <AppText style={styles.candidatesText}>{item.candidates}</AppText>
                </View>
                <View style={[styles.td, { width: COL_STATUS }]}>
                  <View style={styles.statusChip}>
                    <AppText style={styles.statusChipText}>In Progress</AppText>
                  </View>
                </View>
                <View style={[styles.td, { width: COL_DATE }]}>
                  <View style={styles.dateBlock}>
                    <AppText style={styles.dateText}>{item.startDate}</AppText>
                    <AppText style={styles.timeText}>{item.startTime}</AppText>
                  </View>
                </View>
                <View style={[styles.td, { width: COL_DATE }]}>
                  <View style={styles.dateBlock}>
                    <AppText style={styles.dateText}>{item.endDate}</AppText>
                    <AppText style={styles.timeText}>{item.endTime}</AppText>
                  </View>
                </View>
                <View style={[styles.td, styles.tdLast, { width: COL_REGISTRATIONS }]}>
                  <View style={styles.registrationsCell}>
                    <View style={styles.toggleTrack}>
                      <View style={styles.toggleThumb} />
                    </View>
                    <AppText style={styles.closedText}>Closed</AppText>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
    </View>
  );
}
