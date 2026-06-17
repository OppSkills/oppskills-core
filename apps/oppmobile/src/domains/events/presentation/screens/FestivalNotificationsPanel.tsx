import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '../../../../shared/ui';

export function FestivalNotificationsPanel() {
  const [subject, setSubject] = useState('');
  const [emailBody, setEmailBody] = useState(
    'Optima, The Operations Club of IIM Ahmedabad proudly presents SimulOps – The Ultimate Operations Strategy Simulation.\n\nAbout Micro Simulation Game\n• Participants can take decisions for a virtual business unit by optimizing costs, evaluating demand scenarios and maximizing profitability.\n• Important Instructions:\nTeams must be represented solely through the Team Leader\'s account for Micro Simulation Game.',
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Page description */}
        <AppText style={styles.pageDescription}>
          Send email to participants about festivals
        </AppText>

        {/* Send to */}
        <View style={styles.fieldGroup}>
          <AppText style={styles.fieldLabel}>Send to</AppText>
          <Pressable style={styles.dropdownContainer}>
            <AppText style={styles.dropdownText}>All Participants</AppText>
            <ChevronDownIcon />
          </Pressable>
          <View style={styles.successRow}>
            <CheckCircleIcon />
            <AppText style={styles.successText}>Notifications will be sent to 2323 people</AppText>
          </View>
        </View>

        {/* Subject */}
        <View style={styles.fieldGroup}>
          <AppText style={styles.fieldLabel}>Subject</AppText>
          <View style={styles.dropdownContainer}>
            <TextInput
              onChangeText={setSubject}
              placeholder="Subject Line"
              placeholderTextColor="#9C8DAA"
              style={styles.textInput}
              value={subject}
            />
          </View>
        </View>

        {/* When to send */}
        <View style={styles.fieldGroup}>
          <AppText style={styles.fieldLabel}>When to send</AppText>
          <Pressable style={styles.dropdownContainer}>
            <AppText style={styles.dropdownText}>Immediately</AppText>
            <ChevronDownIcon />
          </Pressable>
          <View style={styles.successRow}>
            <CheckCircleIcon />
            <AppText style={styles.successText}>Notifications will be send at 9:00 AM</AppText>
          </View>
        </View>

        {/* Main Body */}
        <View style={styles.fieldGroup}>
          <AppText style={styles.fieldLabel}>Main Body</AppText>
          <View style={styles.mainBodyContainer}>
            <AppText style={styles.mainBodyHeading}>
              Everything you need to know about [Festival Name]
            </AppText>
            <TextInput
              multiline
              onChangeText={setEmailBody}
              style={styles.mainBodyInput}
              textAlignVertical="top"
              value={emailBody}
            />
          </View>
        </View>

        {/* Bottom spacer so footer doesn't cover content */}
        <View style={styles.footerSpacer} />
      </ScrollView>

      {/* Sticky footer */}
      <View style={styles.footer}>
        <View style={styles.footerUserRow}>
          <Image
            source={{ uri: 'https://i.pravatar.cc/100?img=11' }}
            style={styles.footerAvatar}
          />
          <AppText style={styles.footerUserName}>Rohit</AppText>
          <AppText style={styles.footerUserEmail}>tstrohittiwari@gmail.com</AppText>
        </View>
        <Pressable style={styles.sendButton}>
          <AppText style={styles.sendButtonText}>Send Email</AppText>
        </Pressable>
      </View>
    </View>
  );
}

function ChevronDownIcon() {
  return (
    <View style={chevron.wrap}>
      <View style={chevron.line1} />
      <View style={chevron.line2} />
    </View>
  );
}

const chevron = StyleSheet.create({
  wrap: { height: 18, justifyContent: 'center', width: 18 },
  line1: {
    backgroundColor: '#100013',
    borderRadius: 1,
    height: 1.5,
    position: 'absolute',
    right: 2,
    top: 9,
    transform: [{ rotate: '45deg' }],
    width: 9,
  },
  line2: {
    backgroundColor: '#100013',
    borderRadius: 1,
    height: 1.5,
    left: 2,
    position: 'absolute',
    top: 9,
    transform: [{ rotate: '-45deg' }],
    width: 9,
  },
});

function CheckCircleIcon() {
  return (
    <View style={check.circle}>
      {/* Checkmark built from two rectangles */}
      <View style={check.short} />
      <View style={check.long} />
    </View>
  );
}

const check = StyleSheet.create({
  circle: {
    alignItems: 'center',
    borderColor: '#22C55E',
    borderRadius: 8,
    borderWidth: 1.5,
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  short: {
    backgroundColor: '#22C55E',
    borderRadius: 1,
    height: 1.5,
    position: 'absolute',
    top: 9,
    left: 2,
    transform: [{ rotate: '45deg' }],
    width: 5,
  },
  long: {
    backgroundColor: '#22C55E',
    borderRadius: 1,
    height: 1.5,
    position: 'absolute',
    top: 7,
    left: 5,
    transform: [{ rotate: '-45deg' }],
    width: 8,
  },
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FAFAFA',
    flex: 1,
  },
  content: {
    padding: 16,
  },
  pageDescription: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },

  /* Field groups */
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 13,
    marginBottom: 8,
  },
  dropdownContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#C3BFC4',
    borderRadius: 100,
    borderWidth: 1,
    flexDirection: 'row',
    height: 48,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  dropdownText: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 15,
  },
  textInput: {
    color: '#100013',
    flex: 1,
    fontFamily: 'Urbanist',
    fontSize: 15,
    padding: 0,
  },
  successRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  successText: {
    color: '#22C55E',
    fontFamily: 'Urbanist',
    fontSize: 12,
  },

  /* Main body */
  mainBodyContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C3BFC4',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  mainBodyHeading: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
    marginBottom: 16,
  },
  mainBodyInput: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 14,
    lineHeight: 22,
    minHeight: 200,
    padding: 0,
  },
  footerSpacer: {
    height: 140,
  },

  /* Sticky footer */
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
    justifyContent: 'center',
    marginBottom: 14,
  },
  footerAvatar: {
    borderRadius: 10,
    height: 24,
    marginRight: 8,
    width: 24,
  },
  footerUserName: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  footerUserEmail: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 14,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: '#42007A',
    borderRadius: 100,
    height: 52,
    justifyContent: 'center',
    width: '100%',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 16,
    fontWeight: '600',
  },
});
