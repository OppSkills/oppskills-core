import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

import { AppText, OrganizerSidebarDrawer, type OrganizerSidebarItem } from '../../../../shared/ui';
import { type LiveEvent } from '../../../events/presentation/screens/OrganizerCreateEventScreen';
import { EventDetailScreen } from '../../../events/presentation/screens/EventDetailScreen';
import { OrganizerDashboardHome } from './OrganizerDashboardHome';
import { OrganizerEventsPanel } from '../../../events/presentation/screens/OrganizerEventsPanel';
import { SendNotificationsPanel } from './SendNotificationsPanel';
import { TalentPipelinePanel } from './TalentPipelinePanel';
import { OrganizerFestivalsPanel } from './OrganizerFestivalsPanel';
import { FestivalDetailScreen, type LiveFestival } from './FestivalDetailScreen';
import { type LiveHackathon } from '../../../hackathons/presentation/screens/organizer/OrganizerCreateHackathonScreen';
import { OrganizerHackathonsPanel } from '../../../hackathons/presentation/screens/organizer/OrganizerHackathonsPanel';
import { HackathonDetailScreen } from '../../../hackathons/presentation/screens/organizer/HackathonDetailScreen';
import { Skeleton } from 'boneyard-js/react';
import {
  useOrganizerRegistrationsSummary,
  useOrganizerOpportunitiesSummary,
  useOrganizerPaymentsSummary,
  useOrganizerRolesSummary,
  useOrganizerNotificationsSummary,
  useOrganizerReferralsSummary,
  useOrganizerPipelineSummary,
  useOrganizerSettingsSummary,
} from '../hooks/useOrganizerSummaries';
import { styles } from './OrganizerDashboardScreen.styles';

const organizerSidebarItems = [
  { key: 'dashboard', label: 'Home', icon: 'home' },
  { key: 'hackathon', label: 'Hackathon', icon: 'hackathon' },
  { key: 'event', label: 'Event', icon: 'events' },
  { key: 'festival', label: 'Festival', icon: 'festival' },
] as const satisfies readonly OrganizerSidebarItem[];

const organizerSections = {
  dashboard: {
    badge: 'Dashboard',
    body:
      'See the full health of your organizer workspace in one place, from active listings to event-day readiness.',
    cards: [
      {
        description: 'Track approvals, responses, and live traction across your latest student-facing campaigns.',
        title: 'Overview snapshot',
      },
      {
        description: 'Keep your home section focused on the activities that need attention this week.',
        title: 'Quick priorities',
      },
    ],
    metrics: [
      { label: 'Live campaigns', value: '04' },
      { label: 'Pending approvals', value: '11' },
      { label: 'This week reach', value: '2.4K' },
    ],
    title: 'Organizer command center',
  },
  'manage-registrations': {
    badge: 'Manage Registrations',
    body: 'Review and manage all registrations across your active opportunities.',
    cards: [
      { description: 'View and filter all incoming registration requests.', title: 'Registration queue' },
      { description: 'Approve, reject, or waitlist applicants in bulk.', title: 'Bulk actions' },
    ],
    metrics: [
      { label: 'Total registrations', value: '328' },
      { label: 'Pending review', value: '41' },
      { label: 'Approved', value: '287' },
    ],
    title: 'Registration management',
  },
  'edit-opportunity': {
    badge: 'Edit Opportunity',
    body: 'Update your opportunity details, visibility settings, and deadlines.',
    cards: [
      { description: 'Modify listing details, tags, and media assets.', title: 'Listing editor' },
      { description: 'Adjust registration windows and capacity limits.', title: 'Deadline controls' },
    ],
    metrics: [
      { label: 'Drafts in progress', value: '06' },
      { label: 'Ready to publish', value: '03' },
      { label: 'Avg. setup time', value: '12m' },
    ],
    title: 'Opportunity editor',
  },
  payments: {
    badge: 'Payments',
    body: 'Track revenue, payouts, and payment status across all your opportunities.',
    cards: [
      { description: 'See collected fees, pending settlements, and refund requests.', title: 'Revenue overview' },
      { description: 'Review individual transactions and export for reconciliation.', title: 'Transaction log' },
    ],
    metrics: [
      { label: 'Total collected', value: '₹84K' },
      { label: 'Pending payout', value: '₹12K' },
      { label: 'Refunds', value: '03' },
    ],
    title: 'Payments dashboard',
  },
  'manage-roles': {
    badge: 'Manage Roles',
    body:
      'Keep organizer identity details, campus proofing, and access-level checks ready for every campaign.',
    cards: [
      {
        description: 'Store the verified details that keep your organizer profile trustworthy to student users.',
        title: 'Verification profile',
      },
      {
        description: 'Review access permissions before adding new teammates or external collaborators.',
        title: 'Access controls',
      },
    ],
    metrics: [
      { label: 'Verified campuses', value: '03' },
      { label: 'Admin seats', value: '05' },
      { label: 'Renewals due', value: '01' },
    ],
    title: 'Identity and access center',
  },
  'send-notifications': {
    badge: 'Send Notifications',
    body:
      'Send alerts, reminders, and last-minute updates so participants never miss a milestone or venue change.',
    cards: [
      {
        description: 'Schedule targeted notification batches for registrations, results, and event reminders.',
        title: 'Broadcast manager',
      },
      {
        description: 'Review recent sends, delivery confidence, and follow-up opportunities.',
        title: 'Recent activity',
      },
    ],
    metrics: [
      { label: 'Queued alerts', value: '09' },
      { label: 'Sent today', value: '146' },
      { label: 'Open rate', value: '71%' },
    ],
    title: 'Notification control room',
  },
  referrals: {
    badge: 'Referrals',
    body: 'Track referral campaigns and reward students who bring in new participants.',
    cards: [
      { description: 'View active referral codes and their conversion rates.', title: 'Referral codes' },
      { description: 'See which students are driving the most referrals.', title: 'Top referrers' },
    ],
    metrics: [
      { label: 'Total referrals', value: '142' },
      { label: 'Converted', value: '89' },
      { label: 'Rewards issued', value: '74' },
    ],
    title: 'Referral program',
  },
  'talent-pipeline': {
    badge: 'Talent Pipeline',
    body:
      'Review registrations, shortlist cohorts, and keep student communication organized from the same hub.',
    cards: [
      {
        description: 'Segment registered students by campus, status, or shortlist stage in a few taps.',
        title: 'Audience management',
      },
      {
        description: 'Pull the next set of participants into review without losing context across teams.',
        title: 'Screening workflow',
      },
    ],
    metrics: [
      { label: 'Total registrations', value: '328' },
      { label: 'Shortlisted', value: '74' },
      { label: 'Waitlisted', value: '19' },
    ],
    title: 'Participant review desk',
  },
  settings: {
    badge: 'Settings',
    body: 'Configure your organizer account, integrations, and notification preferences.',
    cards: [
      { description: 'Update your organizer profile, branding, and contact details.', title: 'Account settings' },
      { description: 'Manage connected tools, webhooks, and API access.', title: 'Integrations' },
    ],
    metrics: [
      { label: 'Active integrations', value: '02' },
      { label: 'Team members', value: '07' },
      { label: 'Last updated', value: '2d ago' },
    ],
    title: 'Organizer settings',
  },
} as const;

type OrganizerSectionKey = keyof typeof organizerSections;

interface OrganizerDashboardScreenProps {
  readonly onBack: () => void;
}

export function OrganizerDashboardScreen({ onBack }: OrganizerDashboardScreenProps) {
  const queryClient = useQueryClient();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeSectionKey, setActiveSectionKey] = useState<OrganizerSectionKey | 'event' | 'hackathon' | 'festival' | 'home'>('dashboard');
  const [selectedEvent, setSelectedEvent] = useState<LiveEvent | null>(null);
  const [selectedFestival, setSelectedFestival] = useState<LiveFestival | null>(null);
  const [selectedHackathon, setSelectedHackathon] = useState<LiveHackathon | null>(null);

  const regSummary = useOrganizerRegistrationsSummary(activeSectionKey === 'manage-registrations');
  const oppSummary = useOrganizerOpportunitiesSummary(activeSectionKey === 'edit-opportunity');
  const paySummary = useOrganizerPaymentsSummary(activeSectionKey === 'payments');
  const rolesSummary = useOrganizerRolesSummary(activeSectionKey === 'manage-roles');
  const notifSummary = useOrganizerNotificationsSummary(activeSectionKey === 'send-notifications');
  const refSummary = useOrganizerReferralsSummary(activeSectionKey === 'referrals');
  const pipeSummary = useOrganizerPipelineSummary(activeSectionKey === 'talent-pipeline');
  const settingsSummary = useOrganizerSettingsSummary(activeSectionKey === 'settings');

  const getSectionMetrics = (sectionKey: OrganizerSectionKey) => {
    const section = organizerSections[sectionKey];
    if (!section) return { metrics: [], isLoading: false };

    let overrideMetrics: { label: string; value: string }[] = section.metrics.map(m => ({ ...m }));
    let isLoading = false;

    switch (sectionKey) {
      case 'manage-registrations':
        isLoading = regSummary.isLoading;
        if (regSummary.data) {
          overrideMetrics = [
            { label: 'Total registrations', value: String(regSummary.data.totalRegistrations) },
            { label: 'Pending review', value: String(regSummary.data.pendingReview) },
            { label: 'Approved', value: String(regSummary.data.approved) },
          ];
        }
        break;
      case 'edit-opportunity':
        isLoading = oppSummary.isLoading;
        if (oppSummary.data) {
          overrideMetrics = [
            { label: 'Drafts in progress', value: String(oppSummary.data.draftsInProgress) },
            { label: 'Ready to publish', value: String(oppSummary.data.readyToPublish) },
            { label: 'Avg. setup time', value: oppSummary.data.avgSetupTime },
          ];
        }
        break;
      case 'payments':
        isLoading = paySummary.isLoading;
        if (paySummary.data) {
          overrideMetrics = [
            { label: 'Total collected', value: paySummary.data.totalCollected },
            { label: 'Pending payout', value: paySummary.data.pendingPayout },
            { label: 'Refunds', value: String(paySummary.data.refunds) },
          ];
        }
        break;
      case 'manage-roles':
        isLoading = rolesSummary.isLoading;
        if (rolesSummary.data) {
          overrideMetrics = [
            { label: 'Verified campuses', value: String(rolesSummary.data.verifiedCampuses) },
            { label: 'Admin seats', value: String(rolesSummary.data.adminSeats) },
            { label: 'Renewals due', value: String(rolesSummary.data.renewalsDue) },
          ];
        }
        break;
      case 'send-notifications':
        isLoading = notifSummary.isLoading;
        if (notifSummary.data) {
          overrideMetrics = [
            { label: 'Queued alerts', value: String(notifSummary.data.queuedAlerts) },
            { label: 'Sent today', value: String(notifSummary.data.sentToday) },
            { label: 'Open rate', value: notifSummary.data.openRate },
          ];
        }
        break;
      case 'referrals':
        isLoading = refSummary.isLoading;
        if (refSummary.data) {
          overrideMetrics = [
            { label: 'Total referrals', value: String(refSummary.data.totalReferrals) },
            { label: 'Converted', value: String(refSummary.data.converted) },
            { label: 'Rewards issued', value: String(refSummary.data.rewardsIssued) },
          ];
        }
        break;
      case 'talent-pipeline':
        isLoading = pipeSummary.isLoading;
        if (pipeSummary.data) {
          overrideMetrics = [
            { label: 'Total registrations', value: String(pipeSummary.data.totalRegistrations) },
            { label: 'Shortlisted', value: String(pipeSummary.data.shortlisted) },
            { label: 'Waitlisted', value: String(pipeSummary.data.waitlisted) },
          ];
        }
        break;
      case 'settings':
        isLoading = settingsSummary.isLoading;
        if (settingsSummary.data) {
          overrideMetrics = [
            { label: 'Active integrations', value: String(settingsSummary.data.activeIntegrations) },
            { label: 'Team members', value: String(settingsSummary.data.teamMembers) },
            { label: 'Last updated', value: '2d ago' },
          ];
        }
        break;
    }
    return { metrics: overrideMetrics, isLoading };
  };

  const activeSection = activeSectionKey in organizerSections
    ? organizerSections[activeSectionKey as OrganizerSectionKey]
    : undefined;
  const showingHome = activeSectionKey === 'dashboard';
  const showingNotifications = activeSectionKey === 'send-notifications';
  const showingTalentPipeline = activeSectionKey === 'talent-pipeline';
  const showingEvents = activeSectionKey === 'event';
  const showingFestivals = activeSectionKey === 'festival';
  const showingHackathons = activeSectionKey === 'hackathon';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityLabel="Open organizer sidebar" onPress={() => setDrawerVisible(true)} style={styles.topBarLeft}>
          <View style={styles.sidebarIcon}>
            <View style={styles.sidebarLine} />
            <View style={[styles.sidebarLine, styles.sidebarLineMid]} />
            <View style={styles.sidebarLine} />
          </View>
          <AppText style={styles.topBarTitle} variant="body">
            Organizer Dashboard
          </AppText>
        </Pressable>
        <View style={styles.topBarRight}>
          <Pressable accessibilityLabel="Notifications" style={styles.notifButton}>
            <View style={styles.notifBell} />
          </Pressable>
          <Pressable accessibilityLabel="Back to home" onPress={onBack} style={styles.avatarPill}>
            <View style={styles.avatarCircle} />
            <View style={styles.chevronDown} />
          </Pressable>
        </View>
      </View>

      {showingHome ? (
        <OrganizerDashboardHome />
      ) : showingHackathons && selectedHackathon !== null ? (
        <HackathonDetailScreen
          hackathon={selectedHackathon}
          onBack={() => setSelectedHackathon(null)}
          onOpenMainSidebar={() => setDrawerVisible(true)}
          onUpdateHackathon={(updated) => {
            void queryClient.invalidateQueries({ queryKey: ['organizer', 'hackathons'] });
            setSelectedHackathon(updated);
          }}
        />
      ) : showingHackathons ? (
        <OrganizerHackathonsPanel onSelectHackathon={(h) => setSelectedHackathon(h)} />
      ) : showingEvents && selectedEvent !== null ? (
        <EventDetailScreen
          event={selectedEvent}
          onBack={() => setSelectedEvent(null)}
          onOpenMainSidebar={() => setDrawerVisible(true)}
          onUpdateEvent={(updated) => {
            void queryClient.invalidateQueries({ queryKey: ['organizer', 'events'] });
            setSelectedEvent(updated);
          }}
        />
      ) : showingEvents ? (
        <OrganizerEventsPanel onSelectEvent={(e) => setSelectedEvent(e)} />
      ) : showingFestivals && selectedFestival !== null ? (
        <FestivalDetailScreen
          festival={selectedFestival}
          onBack={() => setSelectedFestival(null)}
          onOpenMainSidebar={() => setDrawerVisible(true)}
          onUpdateFestival={(updated) => {
            void queryClient.invalidateQueries({ queryKey: ['organizer', 'festivals'] });
            setSelectedFestival(updated);
          }}
        />
      ) : showingFestivals ? (
        <OrganizerFestivalsPanel onSelectFestival={(f) => setSelectedFestival(f)} />
      ) : showingNotifications ? (
        <SendNotificationsPanel onOpenSidebar={() => setDrawerVisible(true)} />
      ) : showingTalentPipeline ? (
        <TalentPipelinePanel onOpenSidebar={() => setDrawerVisible(true)} />
      ) : activeSection ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionCard}>
            <View style={styles.badge}>
              <AppText style={styles.badgeLabel} variant="caption">
                {activeSection.badge}
              </AppText>
            </View>

            <AppText style={styles.sectionTitle} variant="sectionHeading">
              {activeSection.title}
            </AppText>
            <AppText style={styles.sectionBody} variant="body">
              {activeSection.body}
            </AppText>

            <View style={styles.metricGrid}>
              <Skeleton name={`${activeSectionKey}-metrics`} loading={getSectionMetrics(activeSectionKey as OrganizerSectionKey).isLoading}>
                {getSectionMetrics(activeSectionKey as OrganizerSectionKey).metrics.map((metric) => (
                  <View key={metric.label} style={styles.metricCard}>
                    <AppText style={styles.metricLabel} variant="caption">
                      {metric.label}
                    </AppText>
                    <AppText style={styles.metricValue} variant="title">
                      {metric.value}
                    </AppText>
                  </View>
                ))}
              </Skeleton>
            </View>
          </View>

          <View style={styles.cardList}>
            {activeSection.cards.map((card, index) => (
              <View key={card.title} style={styles.card}>
                <View style={styles.cardHeader}>
                  <AppText style={styles.cardIndex} variant="caption">
                    0{index + 1}
                  </AppText>
                  <AppText colorToken="brandPrimaryStrong" variant="caption">
                    Active
                  </AppText>
                </View>

                <AppText style={styles.cardTitle} variant="title">
                  {card.title}
                </AppText>
                <AppText style={styles.cardDescription} variant="body">
                  {card.description}
                </AppText>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : null}

      <OrganizerSidebarDrawer
        activeItemKey={activeSectionKey}
        items={organizerSidebarItems}
        onClose={() => setDrawerVisible(false)}
        onSelect={(key) => {
          setActiveSectionKey(key as OrganizerSectionKey);
          setDrawerVisible(false);
        }}
        visible={drawerVisible}
      />
    </SafeAreaView>
  );
}
