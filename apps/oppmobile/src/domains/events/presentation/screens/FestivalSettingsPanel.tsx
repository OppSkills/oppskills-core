import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '../../../../shared/ui';
import { type LiveEvent } from './OrganizerCreateEventScreen';

interface FestivalSettingsPanelProps {
  readonly event: LiveEvent;
}

export function FestivalSettingsPanel({ event }: FestivalSettingsPanelProps) {
  const [pauseRegistrations, setPauseRegistrations] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Status Overview */}
      <View style={styles.card}>
        <AppText style={styles.cardTitle}>Status Overview</AppText>
        <AppText style={styles.cardSubtitle}>Current lifecycle and approval status of your event</AppText>
        <View style={styles.divider} />
        <View style={styles.statusRow}>
          <AppText style={styles.statusLabel}>Lifecycle:</AppText>
          <View style={styles.publishedBadge}>
            <AppText style={styles.publishedBadgeText}>Published</AppText>
          </View>
          <AppText style={[styles.statusLabel, { marginLeft: 16 }]}>Approval:</AppText>
          <View style={styles.approvedBadge}>
            <View style={styles.approvedCheck} />
            <AppText style={styles.approvedBadgeText}>Approved</AppText>
          </View>
        </View>
        <View style={styles.liveBanner}>
          <View style={styles.liveBannerCheck} />
          <AppText style={styles.liveBannerText}>Your event is live and visible to the public!</AppText>
        </View>
      </View>

      {/* Publishing & Approval */}
      <View style={styles.card}>
        <AppText style={styles.cardTitle}>Publishing &amp; Approval</AppText>
        <AppText style={styles.cardSubtitle}>Control visibility and re-submit for review if rejected.</AppText>
        <View style={styles.divider} />
        <AppText style={styles.cardBodyText}>Your event is live and accepting registrations.</AppText>
      </View>

      {/* Registration Control */}
      <View style={styles.card}>
        <AppText style={styles.cardTitle}>Registration Control</AppText>
        <AppText style={styles.cardSubtitle}>Pause registrations while keeping the event publicly visible</AppText>
        <View style={styles.divider} />
        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <AppText style={styles.toggleLabel}>Pause Registrations</AppText>
            <AppText style={styles.toggleDesc}>
              {pauseRegistrations ? 'Registrations are currently paused' : 'Registrations are currently open'}
            </AppText>
          </View>
          <Switch
            onValueChange={setPauseRegistrations}
            thumbColor="#FFFFFF"
            trackColor={{ false: '#E8E6E8', true: '#22C55E' }}
            value={pauseRegistrations}
          />
        </View>
        {pauseRegistrations && (
          <View style={styles.warningBanner}>
            <AppText style={styles.warningIcon}>⏸</AppText>
            <AppText style={styles.warningText}>New registrations are blocked. Toggle off to resume.</AppText>
          </View>
        )}
      </View>

      {/* Event Actions */}
      <View style={styles.card}>
        <AppText style={styles.cardTitle}>Event Actions</AppText>
        <AppText style={styles.cardSubtitle}>Change the lifecycle status of your event</AppText>
        <View style={styles.divider} />
        <View style={styles.actionsRow}>
          <Pressable style={styles.actionBtnOutline}>
            <AppText style={styles.actionBtnOutlineText}>↩ Move to Draft</AppText>
          </Pressable>
          <Pressable style={styles.actionBtnGreen}>
            <AppText style={styles.actionBtnGreenText}>▷ Start Event (Go Live)</AppText>
          </Pressable>
          <Pressable style={styles.actionBtnOrange}>
            <AppText style={styles.actionBtnOrangeText}>⊘ Cancel Event</AppText>
          </Pressable>
        </View>
      </View>

      {/* Danger Zone */}
      <View style={styles.card}>
        <AppText style={styles.cardTitle}>Danger Zone</AppText>
        <AppText style={styles.cardSubtitle}>Irreversible actions. Please be extremely careful.</AppText>
        <View style={styles.divider} />
        <Pressable style={styles.deleteButton}>
          <View style={styles.trashIcon}>
            <View style={styles.trashLid} />
            <View style={styles.trashBody} />
          </View>
          <AppText style={styles.deleteButtonText}>Delete Event</AppText>
        </Pressable>
        <AppText style={styles.deleteWarning}>
          Deleting this event will permanently remove all associated records and data.
        </AppText>
      </View>

      {/* Quick Links */}
      <View style={styles.card}>
        <AppText style={styles.cardTitle}>Quick Links</AppText>
        <AppText style={styles.cardSubtitle}>Useful links for managing your event</AppText>
        <View style={styles.divider} />
        <View style={styles.quickLinksRow}>
          {['Edit Details', 'Manage Team', 'View Registrations', 'View Public Page'].map((link, i) => (
            <View key={link} style={styles.quickLinkItem}>
              {i > 0 && <View style={styles.quickLinkDot} />}
              <Pressable>
                <AppText style={styles.quickLinkText}>{link}</AppText>
              </Pressable>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
    padding: 16,
    paddingBottom: 48,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E6E8',
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  cardTitle: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 17,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#8359D5',
    fontFamily: 'Urbanist',
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    backgroundColor: '#E8E6E8',
    height: 1,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusLabel: {
    color: '#7C737E',
    fontFamily: 'Urbanist',
    fontSize: 14,
  },
  publishedBadge: {
    backgroundColor: '#2563EB',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  publishedBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '600',
  },
  approvedBadge: {
    alignItems: 'center',
    borderColor: '#22C55E',
    borderRadius: 100,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  approvedCheck: {
    borderBottomColor: '#22C55E',
    borderBottomWidth: 1.5,
    borderRightColor: '#22C55E',
    borderRightWidth: 1.5,
    height: 8,
    transform: [{ rotate: '45deg' }],
    width: 4,
  },
  approvedBadgeText: {
    color: '#22C55E',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '600',
  },
  liveBanner: {
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 12,
  },
  liveBannerCheck: {
    borderBottomColor: '#22C55E',
    borderBottomWidth: 2,
    borderRightColor: '#22C55E',
    borderRightWidth: 2,
    flexShrink: 0,
    height: 10,
    transform: [{ rotate: '45deg' }],
    width: 5,
  },
  liveBannerText: {
    color: '#15803D',
    fontFamily: 'Urbanist',
    fontSize: 14,
  },
  cardBodyText: {
    color: '#7C737E',
    fontFamily: 'Urbanist',
    fontSize: 14,
    lineHeight: 20,
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
    gap: 2,
    marginRight: 12,
  },
  toggleLabel: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 15,
    fontWeight: '700',
  },
  toggleDesc: {
    color: '#7C737E',
    fontFamily: 'Urbanist',
    fontSize: 13,
  },
  warningBanner: {
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 12,
  },
  warningIcon: {
    fontSize: 14,
  },
  warningText: {
    color: '#B45309',
    flex: 1,
    fontFamily: 'Urbanist',
    fontSize: 13,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionBtnOutline: {
    borderColor: '#D1D5DB',
    borderRadius: 100,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionBtnOutlineText: {
    color: '#374151',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '600',
  },
  actionBtnGreen: {
    borderColor: '#22C55E',
    borderRadius: 100,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionBtnGreenText: {
    color: '#16A34A',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '600',
  },
  actionBtnOrange: {
    borderColor: '#FCD34D',
    borderRadius: 100,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionBtnOrangeText: {
    color: '#D97706',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EF4444',
    borderRadius: 100,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  trashIcon: {
    alignItems: 'center',
    height: 16,
    justifyContent: 'flex-end',
    position: 'relative',
    width: 12,
  },
  trashLid: {
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    height: 2,
    position: 'absolute',
    top: 0,
    width: 12,
  },
  trashBody: {
    borderColor: '#FFFFFF',
    borderRadius: 2,
    borderWidth: 1.5,
    bottom: 0,
    height: 10,
    position: 'absolute',
    width: 9,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteWarning: {
    color: '#9CA3AF',
    fontFamily: 'Urbanist',
    fontSize: 12,
    lineHeight: 18,
  },
  quickLinksRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  quickLinkItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  quickLinkDot: {
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    height: 4,
    width: 4,
  },
  quickLinkText: {
    color: '#6366F1',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '500',
  },
});
