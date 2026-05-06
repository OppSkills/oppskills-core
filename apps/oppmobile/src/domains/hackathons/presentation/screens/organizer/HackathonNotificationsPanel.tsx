import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../../../../../shared/ui';

export function HackathonNotificationsPanel() {
  const [emailBody, setEmailBody] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Broadcast mode banner */}
      <View style={styles.broadcastBanner}>
        <View style={styles.bannerIconWrap}>
          <View style={styles.bannerTriangle} />
          <View style={styles.bannerExclaim} />
        </View>
        <View style={styles.bannerTextWrap}>
          <AppText style={styles.bannerTitle}>Broadcast Mode</AppText>
          <AppText style={styles.bannerBody}>
            Your message will be sent to <AppText style={styles.bannerBold}>ALL</AppText> registered attendees and participants of this event.
          </AppText>
        </View>
      </View>

      {/* Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.bellIconWrap}>
          <View style={styles.bellBody} />
          <View style={styles.bellTop} />
          <View style={styles.bellClapper} />
        </View>
        <AppText style={styles.sectionTitle}>Send Broadcast Notification</AppText>
      </View>

      <AppText style={styles.sectionSubtitle}>
        Compose your email update below. This will be sent as a direct email to all users associated with this event.
      </AppText>

      <View style={styles.divider} />

      {/* Email body */}
      <AppText style={styles.fieldLabel}>Email Body</AppText>
      <View style={styles.textAreaWrap}>
        <TextInput
          multiline
          onChangeText={setEmailBody}
          placeholder="Write your message here..."
          placeholderTextColor="#B0AAB3"
          style={styles.textArea}
          textAlignVertical="top"
          value={emailBody}
        />
      </View>

      {/* Send button */}
      <Pressable style={styles.sendButton}>
        <View style={styles.sendIcon}>
          <View style={styles.sendArrow} />
        </View>
        <AppText style={styles.sendButtonText}>Send Broadcast to All Users</AppText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    padding: 16,
    paddingBottom: 48,
  },
  broadcastBanner: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  bannerIconWrap: {
    alignItems: 'center',
    flexShrink: 0,
    height: 22,
    justifyContent: 'center',
    marginTop: 2,
    position: 'relative',
    width: 18,
  },
  bannerTriangle: {
    borderBottomColor: '#6366F1',
    borderBottomWidth: 18,
    borderLeftColor: 'transparent',
    borderLeftWidth: 9,
    borderRightColor: 'transparent',
    borderRightWidth: 9,
    height: 0,
    width: 0,
  },
  bannerExclaim: {
    backgroundColor: '#6366F1',
    borderRadius: 1,
    height: 7,
    position: 'absolute',
    top: 4,
    width: 2,
  },
  bannerTextWrap: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    color: '#4338CA',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '700',
  },
  bannerBody: {
    color: '#4338CA',
    fontFamily: 'Urbanist',
    fontSize: 13,
    lineHeight: 18,
  },
  bannerBold: {
    fontWeight: '700',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  bellIconWrap: {
    alignItems: 'center',
    backgroundColor: '#EDE9FF',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    position: 'relative',
    width: 48,
  },
  bellBody: {
    borderColor: '#8359D5',
    borderRadius: 6,
    borderWidth: 2,
    height: 16,
    left: 14,
    position: 'absolute',
    top: 14,
    width: 20,
  },
  bellTop: {
    borderColor: '#8359D5',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 2,
    height: 8,
    left: 18,
    position: 'absolute',
    top: 10,
    width: 12,
  },
  bellClapper: {
    backgroundColor: '#8359D5',
    borderRadius: 3,
    height: 5,
    left: 21,
    position: 'absolute',
    top: 29,
    width: 6,
  },
  sectionTitle: {
    color: '#100013',
    flex: 1,
    fontFamily: 'Aeonik Pro',
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 14,
    lineHeight: 22,
  },
  divider: {
    backgroundColor: '#E8E6E8',
    height: 1,
  },
  fieldLabel: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 15,
    fontWeight: '600',
  },
  textAreaWrap: {
    borderColor: '#E8E6E8',
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 180,
    overflow: 'hidden',
  },
  textArea: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 14,
    lineHeight: 22,
    minHeight: 180,
    padding: 14,
  },
  sendButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: '#42007A',
    borderRadius: 100,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  sendIcon: {
    alignItems: 'center',
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  sendArrow: {
    borderBottomColor: 'transparent',
    borderBottomWidth: 7,
    borderLeftColor: '#FFFFFF',
    borderLeftWidth: 14,
    borderTopColor: 'transparent',
    borderTopWidth: 7,
    height: 0,
    width: 0,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 15,
    fontWeight: '600',
  },
});
