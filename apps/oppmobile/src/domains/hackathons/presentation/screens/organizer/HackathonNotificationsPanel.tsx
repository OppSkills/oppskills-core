import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '../../../../../shared/ui';
import { useAppSession } from '../../../../../shared/auth/useAppSession';
import {
  useHackathonCampaigns,
  useScheduleNotification,
  useCancelCampaign,
  useSendBulkEmail,
  type NotificationCampaign,
} from '../../../../../shared/hooks/useNotificationsHooks';

interface HackathonNotificationsPanelProps {
  readonly hackathonId: string;
  readonly hackathonTitle: string;
}

type PanelTab = 'send' | 'history';
type ScheduleMode = 'IMMEDIATELY' | 'CUSTOM';

export function HackathonNotificationsPanel({ hackathonId, hackathonTitle }: HackathonNotificationsPanelProps) {
  const session = useAppSession();
  const [tab, setTab] = useState<PanelTab>('send');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('IMMEDIATELY');
  const [scheduledAt, setScheduledAt] = useState('');

  const { data: campaigns, isLoading: campaignsLoading } = useHackathonCampaigns(hackathonId);
  const { mutateAsync: scheduleNotif, isPending: isSendingNotif } = useScheduleNotification('hackathon', hackathonId);
  const { mutateAsync: cancelCampaign } = useCancelCampaign('hackathon', hackathonId);
  const { mutateAsync: sendBulkEmail, isPending: isSendingEmail } = useSendBulkEmail('hackathon', hackathonId);

  const displayName = `${session.firstName ?? ''} ${session.lastName ?? ''}`.trim() || 'Organizer';
  const displayEmail = session.userEmail ?? '';

  async function handleSendNotification() {
    if (!subject.trim() && !body.trim()) {
      Alert.alert('Empty message', 'Please enter a subject or body before sending.');
      return;
    }
    try {
      const content = subject.trim() ? `${subject.trim()}\n\n${body.trim()}` : body.trim();
      await scheduleNotif({
        content,
        scheduleType: scheduleMode,
        ...(scheduleMode === 'CUSTOM' && scheduledAt ? { scheduledAt } : {}),
      });
      Alert.alert('Success', 'Notification scheduled successfully!');
      setSubject('');
      setBody('');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to schedule notification. Please try again.');
    }
  }

  async function handleSendEmail() {
    if (!body.trim()) {
      Alert.alert('Empty message', 'Please enter a message body before sending.');
      return;
    }
    try {
      const htmlBody = `<h2>${subject}</h2><p>${body.replace(/\n/g, '<br/>')}</p>`;
      await sendBulkEmail(htmlBody);
      Alert.alert('Success', 'Bulk email queued successfully! Participants will receive it shortly.');
      setSubject('');
      setBody('');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to send email. Please try again.');
    }
  }

  async function handleCancel(campaignId: string) {
    Alert.alert('Cancel Campaign', 'Are you sure you want to cancel this notification?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelCampaign(campaignId);
          } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Could not cancel campaign. Please try again.');
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <Pressable
          onPress={() => setTab('send')}
          style={[styles.tabBtn, tab === 'send' && styles.tabBtnActive]}
        >
          <AppText style={[styles.tabText, tab === 'send' && styles.tabTextActive]}>✉️ Compose</AppText>
        </Pressable>
        <Pressable
          onPress={() => setTab('history')}
          style={[styles.tabBtn, tab === 'history' && styles.tabBtnActive]}
        >
          <AppText style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
            📋 History{campaigns?.length ? ` (${campaigns.length})` : ''}
          </AppText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'send' ? (
          <>
            <AppText style={styles.pageDescription}>
              Send announcements or emails to all participants of "{hackathonTitle}"
            </AppText>

            {/* Subject */}
            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>Subject</AppText>
              <View style={styles.inputContainer}>
                <TextInput
                  onChangeText={setSubject}
                  placeholder="Announcement subject..."
                  placeholderTextColor="#9C8DAA"
                  style={styles.textInput}
                  value={subject}
                />
              </View>
            </View>

            {/* Body */}
            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>Message</AppText>
              <View style={styles.bodyContainer}>
                <TextInput
                  multiline
                  onChangeText={setBody}
                  placeholder="Write your message here..."
                  placeholderTextColor="#9C8DAA"
                  style={styles.bodyInput}
                  textAlignVertical="top"
                  value={body}
                />
              </View>
            </View>

            {/* Schedule mode */}
            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>When to send</AppText>
              <View style={styles.pillRow}>
                <Pressable
                  onPress={() => setScheduleMode('IMMEDIATELY')}
                  style={[styles.pill, scheduleMode === 'IMMEDIATELY' && styles.pillActive]}
                >
                  <AppText style={[styles.pillText, scheduleMode === 'IMMEDIATELY' && styles.pillTextActive]}>
                    Immediately
                  </AppText>
                </Pressable>
                <Pressable
                  onPress={() => setScheduleMode('CUSTOM')}
                  style={[styles.pill, scheduleMode === 'CUSTOM' && styles.pillActive]}
                >
                  <AppText style={[styles.pillText, scheduleMode === 'CUSTOM' && styles.pillTextActive]}>
                    Schedule
                  </AppText>
                </Pressable>
              </View>
              {scheduleMode === 'CUSTOM' && (
                <View style={[styles.inputContainer, { marginTop: 10 }]}>
                  <TextInput
                    onChangeText={setScheduledAt}
                    placeholder="ISO date e.g. 2026-06-20T09:00:00.000Z"
                    placeholderTextColor="#9C8DAA"
                    style={styles.textInput}
                    value={scheduledAt}
                  />
                </View>
              )}
              {scheduleMode === 'IMMEDIATELY' && (
                <View style={styles.successRow}>
                  <View style={styles.successDot} />
                  <AppText style={styles.successText}>Will be sent immediately to all participants</AppText>
                </View>
              )}
            </View>

            {/* Action buttons */}
            <View style={styles.actionRow}>
              <Pressable
                onPress={handleSendNotification}
                style={[styles.actionBtn, styles.notifBtn, isSendingNotif && { opacity: 0.6 }]}
                disabled={isSendingNotif}
              >
                {isSendingNotif ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <AppText style={styles.actionBtnText}>🔔 Send Notification</AppText>
                )}
              </Pressable>
              <Pressable
                onPress={handleSendEmail}
                style={[styles.actionBtn, styles.emailBtn, isSendingEmail && { opacity: 0.6 }]}
                disabled={isSendingEmail}
              >
                {isSendingEmail ? (
                  <ActivityIndicator color="#42007A" size="small" />
                ) : (
                  <AppText style={[styles.actionBtnText, { color: '#42007A' }]}>✉️ Send Email</AppText>
                )}
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <AppText style={styles.pageDescription}>Past notification campaigns for "{hackathonTitle}"</AppText>
            {campaignsLoading ? (
              <ActivityIndicator color="#42007A" style={{ marginTop: 40 }} />
            ) : !campaigns || campaigns.length === 0 ? (
              <View style={styles.emptyState}>
                <AppText style={styles.emptyIcon}>📭</AppText>
                <AppText style={styles.emptyText}>No campaigns sent yet.</AppText>
                <AppText style={styles.emptySubText}>Switch to Compose to send your first announcement.</AppText>
              </View>
            ) : (
              campaigns.map((c) => (
                <CampaignCard key={c.id} campaign={c} onCancel={() => handleCancel(c.id)} />
              ))
            )}
          </>
        )}
        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Sticky footer */}
      <View style={styles.footer}>
        <View style={styles.footerUserRow}>
          <View style={styles.footerAvatarPlaceholder}>
            <AppText style={styles.footerAvatarText}>{displayName.charAt(0).toUpperCase()}</AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText style={styles.footerUserName} numberOfLines={1}>{displayName}</AppText>
            <AppText style={styles.footerUserEmail} numberOfLines={1}>{displayEmail}</AppText>
          </View>
        </View>
      </View>
    </View>
  );
}

function CampaignCard({ campaign, onCancel }: { readonly campaign: NotificationCampaign; readonly onCancel: () => void }) {
  const statusColors: Record<string, { bg: string; text: string }> = {
    QUEUED: { bg: '#FEF9C3', text: '#854D0E' },
    PROCESSING: { bg: '#DBEAFE', text: '#1E40AF' },
    COMPLETED: { bg: '#DCFCE7', text: '#166534' },
    FAILED: { bg: '#FEE2E2', text: '#991B1B' },
    CANCELLED: { bg: '#F3F4F6', text: '#6B7280' },
  };
  const colors = statusColors[campaign.status] ?? { bg: '#F3F4F6', text: '#6B7280' };
  const date = campaign.createdAt ? new Date(campaign.createdAt).toLocaleString() : '';

  return (
    <View style={card.container}>
      <View style={card.headerRow}>
        <View style={[card.badge, { backgroundColor: colors.bg }]}>
          <AppText style={[card.badgeText, { color: colors.text }]}>{campaign.status}</AppText>
        </View>
        {campaign.status === 'QUEUED' && (
          <Pressable onPress={onCancel} style={card.cancelBtn}>
            <AppText style={card.cancelText}>Cancel</AppText>
          </Pressable>
        )}
      </View>
      <AppText style={card.content} numberOfLines={3}>{campaign.content}</AppText>
      <View style={card.metaRow}>
        <AppText style={card.meta}>👥 {campaign.totalRecipients} recipients</AppText>
        <AppText style={card.meta}>✅ {campaign.successCount} sent</AppText>
        {campaign.failedCount > 0 && (
          <AppText style={[card.meta, { color: '#DC2626' }]}>❌ {campaign.failedCount} failed</AppText>
        )}
      </View>
      <AppText style={card.date}>{date}</AppText>
    </View>
  );
}

const card = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9E0F8',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badge: {
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  cancelText: {
    color: '#DC2626',
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
  },
  meta: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 12,
  },
  date: {
    color: '#9C8DAA',
    fontFamily: 'Urbanist',
    fontSize: 11,
  },
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAFA',
    flex: 1,
  },
  tabRow: {
    borderBottomColor: '#E9E0F8',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  tabBtn: {
    borderBottomColor: 'transparent',
    borderBottomWidth: 2,
    flex: 1,
    alignItems: 'center',
    paddingBottom: 10,
  },
  tabBtnActive: {
    borderBottomColor: '#42007A',
  },
  tabText: {
    color: '#9C8DAA',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#42007A',
  },
  content: {
    padding: 16,
  },
  pageDescription: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#C3BFC4',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    height: 48,
    paddingHorizontal: 16,
  },
  textInput: {
    color: '#100013',
    flex: 1,
    fontFamily: 'Urbanist',
    fontSize: 15,
    padding: 0,
  },
  bodyContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C3BFC4',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    minHeight: 160,
  },
  bodyInput: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 14,
    lineHeight: 22,
    minHeight: 120,
    padding: 0,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    borderColor: '#C3BFC4',
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  pillActive: {
    backgroundColor: '#42007A',
    borderColor: '#42007A',
  },
  pillText: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  successRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  successDot: {
    backgroundColor: '#22C55E',
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  successText: {
    color: '#22C55E',
    fontFamily: 'Urbanist',
    fontSize: 12,
  },
  actionRow: {
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    alignItems: 'center',
    borderRadius: 100,
    height: 52,
    justifyContent: 'center',
  },
  notifBtn: {
    backgroundColor: '#42007A',
  },
  emailBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: '#42007A',
    borderWidth: 1.5,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubText: {
    color: '#9C8DAA',
    fontFamily: 'Urbanist',
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#F3EEFF',
    borderColor: '#E5D8FF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    bottom: 0,
    elevation: 8,
    left: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    position: 'absolute',
    right: 0,
    shadowColor: '#42007A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  footerUserRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  footerAvatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: '#42007A',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  footerAvatarText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '700',
  },
  footerUserName: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '600',
  },
  footerUserEmail: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 12,
  },
});
