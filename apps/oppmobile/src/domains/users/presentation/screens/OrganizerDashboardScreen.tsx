import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, OrganizerSidebarDrawer, type OrganizerSidebarItem } from '../../../../shared/ui';
import { OrganizerDashboardHome } from './OrganizerDashboardHome';
import { OrganizerEventsPanel } from '../../../events/presentation/screens/OrganizerEventsPanel';
import { SendNotificationsPanel } from './SendNotificationsPanel';
import { TalentPipelinePanel } from './TalentPipelinePanel';
import { styles } from './OrganizerDashboardScreen.styles';

const organizerSidebarItems = [
  { key: 'home', label: 'Home', icon: 'home' },
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
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeSectionKey, setActiveSectionKey] = useState<OrganizerSectionKey | 'event' | 'hackathon' | 'festival' | 'home'>('dashboard');

  const activeSection = activeSectionKey in organizerSections
    ? organizerSections[activeSectionKey as OrganizerSectionKey]
    : undefined;
  const showingHome = activeSectionKey === 'dashboard';
  const showingNotifications = activeSectionKey === 'send-notifications';
  const showingTalentPipeline = activeSectionKey === 'talent-pipeline';
  const showingEvents = activeSectionKey === 'event';

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
      ) : showingEvents ? (
        <OrganizerEventsPanel onOpenSidebar={() => setDrawerVisible(true)} />
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
              {activeSection.metrics.map((metric) => (
                <View key={metric.label} style={styles.metricCard}>
                  <AppText style={styles.metricLabel} variant="caption">
                    {metric.label}
                  </AppText>
                  <AppText style={styles.metricValue} variant="title">
                    {metric.value}
                  </AppText>
                </View>
              ))}
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
