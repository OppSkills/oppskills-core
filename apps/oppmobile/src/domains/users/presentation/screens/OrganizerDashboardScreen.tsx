import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, OrganizerSidebarDrawer, type OrganizerSidebarItem } from '../../../../shared/ui';
import { styles } from './OrganizerDashboardScreen.styles';

const organizerSidebarItems = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'launchpad', label: 'All Opportunities', icon: 'launchpad' },
  { key: 'events', label: 'Festivals', icon: 'events' },
  { key: 'participants', label: 'Talent Pipeline', icon: 'participants' },
  { key: 'organizer-id', label: 'Manage Roles', icon: 'organizer-id' },
  { key: 'notifications', label: 'Send Notifications', icon: 'notifications' },
] as const satisfies readonly OrganizerSidebarItem[];

const organizerSections = {
  home: {
    badge: 'Dashboard Home',
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
  launchpad: {
    badge: 'All Opportunities',
    body:
      'Start new competitions, hackathons, and campus campaigns from a single launch flow built for organizers.',
    cards: [
      {
        description: 'Draft the opportunity basics, add visibility rules, and prep launch messaging.',
        title: 'Create a new listing',
      },
      {
        description: 'Reuse your strongest past templates so every new opportunity ships faster.',
        title: 'Saved launch templates',
      },
    ],
    metrics: [
      { label: 'Drafts in progress', value: '06' },
      { label: 'Ready to publish', value: '03' },
      { label: 'Avg. setup time', value: '12m' },
    ],
    title: 'Launch opportunities faster',
  },
  events: {
    badge: 'Festivals',
    body:
      'Manage timelines, venue readiness, and speaker checkpoints without leaving the organizer workspace.',
    cards: [
      {
        description: 'Keep event-day sequences visible so volunteers and leads stay aligned.',
        title: 'Run-of-show planning',
      },
      {
        description: 'Monitor logistics, reminders, and last-minute updates before gates open.',
        title: 'Operations checklist',
      },
    ],
    metrics: [
      { label: 'Upcoming events', value: '08' },
      { label: 'Venue locks', value: '05' },
      { label: 'Reminder batches', value: '17' },
    ],
    title: 'Event operations workspace',
  },
  participants: {
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
  'organizer-id': {
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
  notifications: {
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
} as const;

const defaultOrganizerSectionKey = organizerSidebarItems[0]?.key;

if (!defaultOrganizerSectionKey) {
  throw new Error('Organizer dashboard sections are not configured.');
}

type OrganizerSectionKey = keyof typeof organizerSections;

interface OrganizerDashboardScreenProps {
  readonly onBack: () => void;
}

export function OrganizerDashboardScreen({ onBack }: OrganizerDashboardScreenProps) {
  const [drawerVisible, setDrawerVisible] = useState(true);
  const [activeSectionKey, setActiveSectionKey] = useState<OrganizerSectionKey>(
    defaultOrganizerSectionKey as OrganizerSectionKey,
  );

  const activeSection = organizerSections[activeSectionKey];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerActions}>
            <Pressable accessibilityLabel="Back to home" onPress={onBack} style={styles.backButton}>
              <View style={styles.backButtonTipPrimary} />
              <View style={styles.backButtonShaft} />
              <View style={styles.backButtonTipSecondary} />
            </Pressable>

            <View style={styles.headerText}>
              <AppText style={styles.title} variant="sectionHeading">
                Organizer Dashboard
              </AppText>
              <AppText style={styles.subtitle} variant="caption">
                Open the sidebar to switch between organizer tools.
              </AppText>
            </View>
          </View>

          <Pressable accessibilityLabel="Open organizer sidebar" onPress={() => setDrawerVisible(true)} style={styles.menuButton}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </Pressable>
        </View>

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
