import { Image, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../shared/ui';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useOrganizerStats } from '../hooks/useOrganizerStats';
import { useOrganizerTrends } from '../hooks/useOrganizerTrends';
import { useOrganizerTopListings } from '../hooks/useOrganizerTopListings';

const STAT_CARDS = [
  {
    key: 'candidates',
    label: 'Total Candidates',
    value: '12,300',
    subLabel: 'Registered last month',
    badge: '1,200',
    dark: true,
  },
  {
    key: 'teams',
    label: 'Team Registrations',
    value: '90',
    subLabel: 'Registered last month',
    badge: '10',
    dark: false,
  },
  {
    key: 'opportunities',
    label: 'Active Opportunities',
    value: '12',
    subLabel: 'Newly launched',
    badge: '4',
    dark: false,
  },
  {
    key: 'festivals',
    label: 'Festivals Listed',
    value: '12',
    subLabel: 'Last 12 months',
    badge: '4',
    dark: false,
  },
] as const;

const MONTHS = ['July', 'Aug.', 'Sept.', 'Oct.', 'Nov', 'Dec.', 'Jan'];

const LINE_DATA = {
  male: [100, 200, 100, 230, 300, 400, 150],
  female: [40, 80, 60, 93, 105, 140, 56],
  total: [140, 280, 160, 323, 405, 540, 206],
};

const LINE_COLORS = {
  male: '#8979FF',
  female: '#FF928A',
  total: '#3CC3DF',
};


const VERTICAL_BAR_DATA = [
  { label: 'Engg.', value: 190, pct: 95 },
  { label: 'Management', value: 50, pct: 25 },
  { label: 'Corporate', value: 20, pct: 10 },
  { label: 'Other', value: 40, pct: 20 },
];

const LISTINGS = [
  {
    key: 'l1',
    name: 'HackNoC 2025',
    details: 'Hackathon · Apr 20 – Apr 22',
    statA: { label: 'Teams', value: '42' },
    statB: { label: 'Members', value: '98' },
  },
  {
    key: 'l2',
    name: 'Designathon',
    details: 'Competition · May 5 – May 6',
    statA: { label: 'Teams', value: '18' },
    statB: { label: 'Members', value: '36' },
  },
  {
    key: 'l3',
    name: 'E-Summit 2025',
    details: 'Festival · Jun 10 – Jun 12',
    statA: { label: 'Teams', value: '30' },
    statB: { label: 'Members', value: '72' },
  },
];

const UPDATES = [
  {
    key: 'u1',
    name: 'HackNoC 2025',
    details: 'Round 2 submissions closed. Evaluation in progress.',
    statusLabel: 'Evaluation',
    statusStage: 'Round 2',
  },
  {
    key: 'u2',
    name: 'Designathon',
    details: 'Shortlisted teams notified. Awaiting confirmations.',
    statusLabel: 'Evaluation',
    statusStage: 'Round 1',
  },
  {
    key: 'u3',
    name: 'Code Rush',
    details: 'Registration deadline extended by 3 days.',
    statusLabel: 'Evaluation',
    statusStage: 'Round 1',
  },
  {
    key: 'u4',
    name: 'E-Summit 2025',
    details: 'Speaker lineup confirmed. Venue lock pending.',
    statusLabel: 'Evaluation',
    statusStage: 'Finals',
  },
];

function StatCard({
  label,
  value,
  subLabel,
  badge,
  dark,
}: {
  readonly label: string;
  readonly value: string;
  readonly subLabel: string;
  readonly badge: string;
  readonly dark: boolean;
}) {
  return (
    <View style={[s.statCard, dark ? s.statCardDark : s.statCardLight]}>
      <AppText style={[s.statLabel, dark ? s.textLight : s.textDark]} variant="body">
        {label}
      </AppText>
      <AppText style={[s.statValue, dark ? s.textLight : s.textDarkStrong]} variant="displayH1">
        {value}
      </AppText>
      <View style={s.statFooter}>
        <AppText style={[s.statSubLabel, dark ? s.textLightSoft : s.textMuted]} variant="caption">
          {subLabel}
        </AppText>
        <View style={[s.statBadge, dark ? s.statBadgeDark : s.statBadgePurple]}>
          <AppText style={s.statBadgeText} variant="micro">
            {badge}
          </AppText>
        </View>
      </View>
    </View>
  );
}

function LineChart({ trends }: { readonly trends?: Record<string, { events: number; hackathon: number }> | undefined }) {
  const chartH = 120;
  
  // Prepare data
  let lineData = LINE_DATA;
  let labels = MONTHS;
  
  if (trends && Object.keys(trends).length > 0) {
    const dates = Object.keys(trends).sort((a, b) => {
      // dates are dd-mm-yyyy
      const [d1 = 0, m1 = 0, y1 = 0] = a.split('-').map(Number);
      const [d2 = 0, m2 = 0, y2 = 0] = b.split('-').map(Number);
      if (y1 !== y2) return y1 - y2;
      if (m1 !== m2) return m1 - m2;
      return d1 - d2;
    });
    
    const events = dates.map(d => trends[d]?.events ?? 0);
    const hackathons = dates.map(d => trends[d]?.hackathon ?? 0);
    const total = dates.map(d => (trends[d]?.events ?? 0) + (trends[d]?.hackathon ?? 0));
    
    lineData = {
      female: events, // reusing female color for events
      male: hackathons, // reusing male color for hackathons
      total,
    };
    labels = dates.map(d => d.substring(0, 5)); // dd-mm
  }

  const maxVal = Math.max(...Object.values(lineData).flat(), 10);
  const toPercent = (v: number) => (1 - v / maxVal) * 100;

  return (
    <View style={s.chartCard}>
      <AppText style={s.chartTitle} variant="title">
        Registrations Trend
      </AppText>
      <View style={s.legend}>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: LINE_COLORS.female }]} />
          <AppText style={s.legendLabel} variant="micro">Events</AppText>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: LINE_COLORS.male }]} />
          <AppText style={s.legendLabel} variant="micro">Hackathons</AppText>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: LINE_COLORS.total }]} />
          <AppText style={s.legendLabel} variant="micro">Total</AppText>
        </View>
      </View>

      <View style={[s.chartArea, { height: chartH }]}>
        {[0.25, 0.5, 0.75].map((frac) => (
          <View
            key={frac}
            style={[s.gridLine, { top: `${frac * 100}%` as unknown as number }]}
          />
        ))}
        {(['total', 'female', 'male'] as const).map((key) =>
          lineData[key].map((val, i) => {
            if (i === lineData[key].length - 1) return null;
            const nextVal = lineData[key][i + 1];
            if (nextVal === undefined) return null;
            const segmentW = 100 / (lineData[key].length - 1);
            const x1 = i * segmentW;
            const y1 = toPercent(val);
            const y2 = toPercent(nextVal);
            const dx = segmentW;
            const dy = y2 - y1;
            const len = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            return (
              <View
                key={`${key}-${i}`}
                style={{
                  backgroundColor: LINE_COLORS[key],
                  height: 1.5,
                  left: `${x1}%` as unknown as number,
                  position: 'absolute',
                  top: `${y1}%` as unknown as number,
                  transform: [{ rotate: `${angle}deg` }],
                  transformOrigin: '0 50%',
                  width: `${len}%` as unknown as number,
                }}
              />
            );
          }),
        )}
        {(['total', 'female', 'male'] as const).map((key) =>
          lineData[key].map((val, i) => {
            const segmentW = 100 / (lineData[key].length - 1);
            return (
              <View
                key={`dot-${key}-${i}`}
                style={[
                  s.chartDot,
                  {
                    borderColor: LINE_COLORS[key],
                    left: `${i * segmentW}%` as unknown as number,
                    top: `${toPercent(val)}%` as unknown as number,
                  },
                ]}
              />
            );
          }),
        )}
      </View>

      <View style={s.xAxis}>
        {labels.map((m, i) => (
          <AppText key={`${m}-${i}`} style={s.xLabel} variant="micro">
            {m}
          </AppText>
        ))}
      </View>
    </View>
  );
}


function VerticalBarChart({ genderTrends }: { readonly genderTrends?: Record<string, { male: number; female: number }> | undefined }) {
  let vData = VERTICAL_BAR_DATA;
  let maxVal = 190;

  if (genderTrends && Object.keys(genderTrends).length > 0) {
    let totalMale = 0;
    let totalFemale = 0;
    Object.values(genderTrends).forEach((t) => {
      totalMale += t.male;
      totalFemale += t.female;
    });
    
    vData = [
      { label: 'Male', value: totalMale, pct: 0 },
      { label: 'Female', value: totalFemale, pct: 0 },
    ];
    maxVal = Math.max(totalMale, totalFemale, 10);
  }

  return (
    <View style={s.chartCard}>
      <AppText style={s.chartTitle} variant="title">
        Gender Demographics
      </AppText>

      <View style={s.vBarChartArea}>
        {vData.map((item) => (
          <View key={item.label} style={s.vBarRow}>
            <AppText style={s.vBarLabel} variant="micro">
              {item.label}
            </AppText>
            <View style={s.vBarTrack}>
              <View style={[s.vBarFill, { width: `${(item.value / maxVal) * 100}%` as unknown as number }]} />
            </View>
            <AppText style={s.vBarValue} variant="micro">
              {item.value}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

function ListingsCard({ listings }: { readonly listings?: any[] | undefined }) {
  const displayListings = listings && listings.length > 0 ? listings : LISTINGS;

  return (
    <View style={s.chartCard}>
      <AppText style={s.chartTitle} variant="title">
        Active Listings
      </AppText>
      <View style={s.listingsList}>
        {displayListings.map((item, idx) => {
          const isReal = !!item.title;
          const name = isReal ? item.title : item.name;
          const details = isReal ? `${item.type === 'EVENT' ? 'Event' : 'Hackathon'}` : item.details;
          const statALabel = isReal ? 'Registrations' : item.statA.label;
          const statAValue = isReal ? item.tregistrations : item.statA.value;
          
          return (
            <View key={isReal ? item.slug : item.key}>
              <View style={s.listingItem}>
                {isReal && item.thumbnail ? (
                  <Image source={{ uri: item.thumbnail }} style={s.listingImagePlaceholder} />
                ) : (
                  <View style={s.listingImagePlaceholder} />
                )}
                <View style={s.listingInfo}>
                  <AppText numberOfLines={1} style={s.listingName} variant="body">
                    {name}
                  </AppText>
                  <AppText style={s.listingDetails} variant="caption">
                    {details}
                  </AppText>
                  <View style={s.listingStats}>
                    <View style={s.listingStat}>
                      <AppText style={s.listingStatText} variant="micro">
                        {statALabel}
                      </AppText>
                      <AppText style={s.listingStatText} variant="micro">
                        {statAValue}
                      </AppText>
                    </View>
                    {!isReal && (
                      <View style={s.listingStat}>
                        <AppText style={s.listingStatText} variant="micro">
                          {item.statB.label}
                        </AppText>
                        <AppText style={s.listingStatText} variant="micro">
                          {item.statB.value}
                        </AppText>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              {idx < displayListings.length - 1 ? <View style={s.divider} /> : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function UpdatesCard() {
  return (
    <View style={s.chartCard}>
      <AppText style={s.chartTitle} variant="title">
        Updates
      </AppText>
      <View style={s.updatesList}>
        {UPDATES.map((item, idx) => (
          <View key={item.key}>
            <View style={s.updateItem}>
              <View style={s.updateInfo}>
                <AppText style={s.updateName} variant="body">
                  {item.name}
                </AppText>
                <AppText style={s.updateDetails} variant="caption">
                  {item.details}
                </AppText>
              </View>
              <View style={s.statusBox}>
                <View style={s.statusHeader}>
                  <AppText style={s.statusLabel} variant="micro">
                    {item.statusLabel}
                  </AppText>
                </View>
                <AppText style={s.statusStage} variant="caption">
                  {item.statusStage}
                </AppText>
              </View>
            </View>
            {idx < UPDATES.length - 1 ? <View style={s.divider} /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

interface OrganizerDashboardHomeProps {
  readonly organizerName?: string;
}

export function OrganizerDashboardHome({ organizerName = 'E-Cell NoC' }: OrganizerDashboardHomeProps) {
  const { data: currentUser } = useCurrentUser();
  const { data: organizerStats } = useOrganizerStats();
  const { data: trendsData } = useOrganizerTrends();
  const { data: topListings } = useOrganizerTopListings();

  const displayName = currentUser?.firstName || organizerName;
  const statCards = organizerStats
    ? [
        {
          key: 'candidates',
          label: 'Total Candidates',
          value: organizerStats.total_participants.toLocaleString(),
          subLabel: 'Registered across all listings',
          badge: `${organizerStats.event.total + organizerStats.hackathon.total + organizerStats.festival.total}`,
          dark: true,
        },
        {
          key: 'teams',
          label: 'Team Registrations',
          value: `${organizerStats.hackathon.total}`,
          subLabel: 'Hackathon listings',
          badge: `${organizerStats.hackathon.active} active`,
          dark: false,
        },
        {
          key: 'opportunities',
          label: 'Active Opportunities',
          value: `${organizerStats.event.active + organizerStats.hackathon.active + organizerStats.festival.active}`,
          subLabel: 'Live opportunities',
          badge: 'Live now',
          dark: false,
        },
        {
          key: 'festivals',
          label: 'Festivals Listed',
          value: `${organizerStats.festival.total}`,
          subLabel: 'Current festival listings',
          badge: `${organizerStats.festival.active} active`,
          dark: false,
        },
      ]
    : STAT_CARDS;

  return (
    <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.welcome}>
        <AppText style={s.welcomeHeading} variant="sectionHeading">
          Welcome back, {displayName}
        </AppText>
        <AppText style={s.welcomeSub} variant="body">
          Here is the summary of overall performance
        </AppText>
      </View>

      <ScrollView
        contentContainerStyle={s.statsRow}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {statCards.map(({ key, ...cardProps }) => (
          <StatCard key={key} {...cardProps} />
        ))}
      </ScrollView>

      <LineChart trends={trendsData?.registrationTrend} />
      <VerticalBarChart genderTrends={trendsData?.genderRegistrationTrend} />
      <ListingsCard listings={topListings} />
      <UpdatesCard />
    </ScrollView>
  );
}

const s = StyleSheet.create({
chartArea: {
    backgroundColor: 'transparent',
    marginBottom: 4,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  chartCard: {
    backgroundColor: '#FAFAFA',
    borderColor: '#C3BFC4',
    borderRadius: 12,
    borderWidth: 0.5,
    elevation: 2,
    marginBottom: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  chartDot: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1.4,
    height: 8,
    marginLeft: -4,
    marginTop: -4,
    position: 'absolute',
    width: 8,
  },
  chartTitle: {
    color: '#0C0114',
    marginBottom: 8,
  },
  container: {
    paddingBottom: 120,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  gridLine: {
    backgroundColor: 'rgba(0,0,26,0.1)',
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  legendDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  legendLabel: {
    color: 'rgba(0,0,0,0.7)',
  },
  statBadge: {
    borderRadius: 19,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statBadgeDark: {
    backgroundColor: '#423072',
  },
  statBadgePurple: {
    backgroundColor: '#0C0114',
  },
  statBadgeText: {
    color: '#F3EEFF',
  },
  statCard: {
    borderRadius: 8,
    gap: 10,
    height: 138,
    justifyContent: 'space-between',
    marginRight: 12,
    padding: 12,
    width: 200,
  },
  statCardDark: {
    backgroundColor: '#1A0A2E',
  },
  statCardLight: {
    backgroundColor: '#F3EEFF',
    borderColor: '#C8AEFF',
    borderWidth: 0.5,
  },
  statFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 14,
  },
  statSubLabel: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 28,
  },
  statsRow: {
    marginBottom: 20,
    paddingRight: 20,
  },
  textDark: {
    color: '#342636',
  },
  textDarkStrong: {
    color: '#0C0114',
  },
  textLight: {
    color: '#FAFAFA',
  },
  textLightSoft: {
    color: '#F3EEFF',
  },
  textMuted: {
    color: '#342636',
  },
  welcome: {
    gap: 8,
    marginBottom: 20,
  },
  welcomeHeading: {
    color: '#100013',
  },
  welcomeSub: {
    color: '#584D5A',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  xLabel: {
    color: 'rgba(0,0,0,0.7)',
    flex: 1,
    textAlign: 'center',
  },
  // vertical bar chart
  vBarChartArea: {
    gap: 14,
    marginTop: 4,
  },
  vBarRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  vBarLabel: {
    color: 'rgba(0,0,0,0.7)',
    width: 70,
  },
  vBarTrack: {
    backgroundColor: 'rgba(131,91,213,0.12)',
    borderRadius: 276,
    flex: 1,
    height: 20,
    overflow: 'hidden',
  },
  vBarFill: {
    backgroundColor: '#835BD5',
    borderRadius: 276,
    height: '100%',
  },
  vBarValue: {
    color: 'rgba(0,0,0,0.7)',
    textAlign: 'right',
    width: 28,
  },

  // listings card
  listingsList: {
    gap: 0,
  },
  listingItem: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  listingImagePlaceholder: {
    backgroundColor: '#E2D3FF',
    borderRadius: 6,
    height: 76,
    width: 100,
  },
  listingInfo: {
    flex: 1,
    gap: 6,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  listingName: {
    color: '#342636',
    fontSize: 14,
  },
  listingDetails: {
    color: '#7C737E',
  },
  listingStats: {
    flexDirection: 'row',
    gap: 8,
  },
  listingStat: {
    backgroundColor: '#E2D3FF',
    borderRadius: 2,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  listingStatText: {
    color: '#423072',
  },

  // updates card
  updatesList: {
    gap: 0,
  },
  updateItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  updateInfo: {
    flex: 1,
    gap: 4,
  },
  updateName: {
    color: '#342636',
    fontSize: 14,
  },
  updateDetails: {
    color: '#7C737E',
    lineHeight: 18,
  },
  statusBox: {
    borderColor: '#C8AEFF',
    borderRadius: 8,
    borderWidth: 0.7,
    overflow: 'hidden',
    width: 86,
  },
  statusHeader: {
    alignItems: 'center',
    backgroundColor: '#E2D3FF',
    borderBottomColor: '#C8AEFF',
    borderBottomWidth: 0.5,
    justifyContent: 'center',
    paddingVertical: 5,
  },
  statusLabel: {
    color: '#423072',
  },
  statusStage: {
    color: '#342636',
    paddingBottom: 4,
    paddingTop: 4,
    textAlign: 'center',
  },

  // shared
  divider: {
    backgroundColor: '#E8E6E8',
    height: 0.5,
    width: '100%',
  },
});
