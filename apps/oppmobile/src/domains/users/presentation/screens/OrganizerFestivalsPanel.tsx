import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import subtractPlaceholder from '../../../../../assets/Subtract.png';
import { AppText } from '../../../../shared/ui';
import { apiClient } from '../../../../shared/api/apiClient';
import { OrganizerCreateFestivalScreen, type LiveFestivalCreated } from './OrganizerCreateFestivalScreen';
import { type LiveFestival } from './FestivalDetailScreen';
import { styles } from './OrganizerFestivalsPanel.styles';

const COL_SERIAL = 50;
const COL_OPPORTUNITY = 300;
const COL_CANDIDATES = 90;
const COL_STATUS = 120;
const COL_DATE = 105;
const COL_REGISTRATIONS = 130;

const tableWidth =
  COL_SERIAL + COL_OPPORTUNITY + COL_CANDIDATES + COL_STATUS + COL_DATE + COL_DATE + COL_REGISTRATIONS;


interface OrganizerFestivalItem {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly status: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly posterImageUrl: string | null;
  readonly locationType: string | null;
  readonly locationCity: string | null;
  readonly organizationName: string | null;
  readonly organizationLogoUrl: string | null;
  readonly hackathons: readonly { id: string; slug: string; name: string }[];
  readonly events: readonly { id: string; slug: string; name: string }[];
}

interface OrganizerFestivalsPanelProps {
  readonly onSelectFestival: (festival: LiveFestival) => void;
}

export function OrganizerFestivalsPanel({ onSelectFestival }: OrganizerFestivalsPanelProps) {
  const [regsOpen, setRegsOpen] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data: backendFestivals = [], isLoading } = useQuery<OrganizerFestivalItem[]>({
    queryKey: ['organizer', 'festivals'],
    queryFn: () => apiClient.getAuth<OrganizerFestivalItem[]>('/festivals/my'),
    staleTime: 1000 * 60 * 2,
  });

  function formatDateValue(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function formatTimeValue(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '00:00';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  function mapOrganizerFestival(festival: OrganizerFestivalItem): LiveFestivalCreated {
    return {
      id: festival.id,
      title: festival.name,
      typeLabel: 'FESTIVAL',
      statusLabel: 'In Progress',
      candidatesLabel: `${festival.events.length + festival.hackathons.length} Candidates`,
      eventsLabel: `${festival.events.length} Events`,
      competitionsLabel: `${festival.hackathons.length} Competitions`,
      eligibleCandidates: ['everyone'],
      imageUrl: festival.posterImageUrl,
    };
  }

  const mergedFestivals = backendFestivals.map(mapOrganizerFestival);

  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: (newFestival: any) => apiClient.post('/festivals', newFestival),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['organizer', 'festivals'] });
      setShowCreate(false);
    },
    onError: (error) => {
      console.error('Failed to create festival', error);
      setShowCreate(false);
    }
  });

  function parseLocalString(dateStr: string): Date {
    const MONTHS: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    const parts = dateStr.split(' ');
    const day = parseInt(parts[0] ?? '1', 10);
    const month = parts[1] ? (MONTHS[parts[1]] ?? 0) : 0;
    const year = parts[2] ? 2000 + parseInt(parts[2], 10) : new Date().getFullYear();
    const d = new Date(year, month, isNaN(day) ? 1 : day);
    return d;
  }

  function handleHostFestival(festival: LiveFestivalCreated) {
    const payload = {
      name: festival.title,
      description: 'New Festival',
      location: {
        type: 'VIRTUAL',
        virtualLink: '',
        address: '',
      },
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      organizationName: 'Organizer',
    };
    createMutation.mutate(payload);
  }

  function handleToggleRegs(id: string) {
    setRegsOpen({ ...regsOpen, [id]: !regsOpen[id] });
  }

  if (isLoading && mergedFestivals.length === 0) {
    return <LoadingState />;
  }

  if (showCreate) {
    return (
      <OrganizerCreateFestivalScreen
        onBack={() => setShowCreate(false)}
        onHostFestival={handleHostFestival}
      />
    );
  }

  const filtered = searchQuery.trim()
    ? mergedFestivals.filter((f) => f.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : mergedFestivals;

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <AppText style={styles.festivalsTitle}>Festivals ({mergedFestivals.length})</AppText>
        <View style={styles.topBarRight}>
          <View style={styles.searchBar}>
            <View style={styles.searchSymbolWrap}>
              <View style={styles.searchSymbolCircle} />
              <View style={styles.searchSymbolHandle} />
            </View>
            <TextInput
              onChangeText={setSearchQuery}
              placeholder="Search festivals"
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

      <ScrollView contentContainerStyle={styles.tableScrollContent} showsVerticalScrollIndicator={false} style={styles.tableScrollOuter}>
        {mergedFestivals.length === 0 ? (
          <EmptyState onHost={() => setShowCreate(true)} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ width: tableWidth }}>
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

              {filtered.map((item, index) => {
                const isOpen = !!regsOpen[item.id];
                const liveFestival: LiveFestival = {
                  id: item.id,
                  title: item.title,
                  typeLabel: item.typeLabel,
                  statusLabel: item.statusLabel,
                  candidatesLabel: item.candidatesLabel,
                  eventsLabel: item.eventsLabel,
                  competitionsLabel: item.competitionsLabel,
                  imageUrl: item.imageUrl ?? null,
                };
                return (
                  <Pressable key={item.id} onPress={() => onSelectFestival(liveFestival)} style={styles.row}>
                    <View style={[styles.td, { width: COL_SERIAL }]}>
                      <AppText style={styles.serialText}>{index + 1}</AppText>
                    </View>
                    <View style={[styles.td, { width: COL_OPPORTUNITY, alignItems: 'flex-start' }]}>
                      <View style={styles.opportunityCell}>
                        <Image resizeMode="cover" source={item.imageUrl ? { uri: item.imageUrl } : subtractPlaceholder} style={styles.thumbnail} />
                        <View style={styles.opportunityInfo}>
                          <AppText numberOfLines={2} style={styles.opportunityTitle}>{item.title}</AppText>
                          <AppText style={styles.festivalBadge}>FESTIVAL</AppText>
                        </View>
                      </View>
                    </View>
                    <View style={[styles.td, { width: COL_CANDIDATES }]}>
                      <AppText style={styles.candidatesText}>{item.candidatesLabel}</AppText>
                    </View>
                    <View style={[styles.td, { width: COL_STATUS }]}>
                      <View style={styles.statusChip}>
                        <AppText style={styles.statusChipText}>{item.statusLabel}</AppText>
                      </View>
                    </View>
                    <View style={[styles.td, { width: COL_DATE }]}>
                      <View style={styles.dateBlock}>
                        <AppText style={styles.dateText}>TBD</AppText>
                        <AppText style={styles.timeText}>--:--</AppText>
                      </View>
                    </View>
                    <View style={[styles.td, { width: COL_DATE }]}>
                      <View style={styles.dateBlock}>
                        <AppText style={styles.dateText}>TBD</AppText>
                        <AppText style={styles.timeText}>--:--</AppText>
                      </View>
                    </View>
                    <View style={[styles.td, styles.tdLast, { width: COL_REGISTRATIONS }]}>
                      <Pressable onPress={() => handleToggleRegs(item.id)} style={styles.registrationsCell}>
                        <View style={[styles.toggleTrack, { backgroundColor: isOpen ? '#6366F1' : '#C3BFC4' }]}>
                          <View style={[styles.toggleThumb, { alignSelf: isOpen ? 'flex-end' : 'flex-start' }]} />
                        </View>
                        <AppText style={[styles.closedText, { color: isOpen ? '#6366F1' : '#7C737E' }]}>
                          {isOpen ? 'Open' : 'Closed'}
                        </AppText>
                      </Pressable>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}
      </ScrollView>
    </View>
  );
}

function LoadingState() {
  return (
    <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 80 }}>
      <ActivityIndicator size="large" color="#6366F1" style={{ marginBottom: 24 }} />
      <AppText style={{ color: '#100013', fontFamily: 'Aeonik Pro', fontSize: 18, fontWeight: '600', lineHeight: 24, textAlign: 'center' }}>
        Loading your festivals...
      </AppText>
    </View>
  );
}

function EmptyState({ onHost }: { readonly onHost: () => void }) {
  return (
    <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 80 }}>
      <View style={{
        alignItems: 'center',
        backgroundColor: '#F0EDF4',
        borderRadius: 48,
        height: 80,
        justifyContent: 'center',
        marginBottom: 20,
        width: 80,
      }}>
        <View style={{ gap: 5 }}>
          <View style={{ backgroundColor: '#9C8DAA', borderRadius: 2, height: 2, width: 36 }} />
          <View style={{ backgroundColor: '#9C8DAA', borderRadius: 2, height: 2, width: 28 }} />
          <View style={{ backgroundColor: '#9C8DAA', borderRadius: 2, height: 2, width: 32 }} />
        </View>
      </View>
      <AppText style={{
        color: '#100013',
        fontFamily: 'Aeonik Pro',
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 24,
        marginBottom: 8,
        textAlign: 'center',
      }}>
        No festivals yet
      </AppText>
      <AppText style={{
        color: '#7C737E',
        fontFamily: 'Urbanist',
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
        marginBottom: 24,
        textAlign: 'center',
      }}>
        Host your first festival and it will appear here once listed.
      </AppText>
      <Pressable
        onPress={onHost}
        style={{
          alignItems: 'center',
          backgroundColor: '#1C1340',
          borderRadius: 100,
          height: 44,
          justifyContent: 'center',
          paddingHorizontal: 28,
        }}
      >
        <AppText style={{ color: '#FFFFFF', fontFamily: 'Urbanist', fontSize: 15, fontWeight: '600' }}>
          Host a Festival
        </AppText>
      </Pressable>
    </View>
  );
}
