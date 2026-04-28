import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { AppText } from '../../../../shared/ui/AppText';

interface SendNotificationsPanelProps {
  readonly onOpenSidebar: () => void;
}

const AUDIENCE_OPTIONS = ['All Participants', 'Round 1', 'Round 2', 'Finals', 'Waitlisted'];
const CATEGORY_OPTIONS = ['Reminder', 'Result', 'Venue Change', 'Update', 'Emergency'];

export function SendNotificationsPanel({ onOpenSidebar }: SendNotificationsPanelProps) {
  const [selectedAudience, setSelectedAudience] = useState(AUDIENCE_OPTIONS[0] ?? '');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORY_OPTIONS[0] ?? '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  return (
    <View style={styles.root}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Pressable
            accessibilityLabel="Open organizer sidebar"
            onPress={onOpenSidebar}
            style={styles.sidebarButton}
          >
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </Pressable>
          <AppText style={styles.headerTitle} variant="sectionHeading">
            Send Notifications
          </AppText>
        </View>

        <View style={styles.headerRight}>
          {/* Bell icon */}
          <View style={styles.bellIconWrap}>
            <View style={styles.bellBody} />
            <View style={styles.bellTop} />
            <View style={styles.bellClapper} />
          </View>

          {/* Avatar pill */}
          <View style={styles.avatarPill}>
            <View style={styles.avatarCircle}>
              <View style={styles.avatarBg} />
            </View>
            <View style={styles.chevronDown} />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AppText style={styles.subheading} variant="body">
          Send email to participants about events
        </AppText>

        {/* Audience selector */}
        <View style={styles.fieldWrap}>
          <AppText style={styles.fieldLabel} variant="caption">
            Audience *
          </AppText>
          <View style={styles.dropdownRow}>
            <AppText style={styles.dropdownText} variant="body">
              {selectedAudience}
            </AppText>
            <View style={styles.dropdownChevron} />
          </View>
          {/* Inline options shown as chips */}
          <View style={styles.chipRow}>
            {AUDIENCE_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => setSelectedAudience(opt)}
                style={[styles.chip, selectedAudience === opt && styles.chipActive]}
              >
                <AppText
                  style={[styles.chipLabel, selectedAudience === opt && styles.chipLabelActive]}
                  variant="caption"
                >
                  {opt}
                </AppText>
              </Pressable>
            ))}
          </View>
          {selectedAudience ? (
            <View style={styles.successRow}>
              <View style={styles.successDot} />
              <AppText style={styles.successText} variant="caption">
                Audience selected
              </AppText>
            </View>
          ) : null}
        </View>

        {/* Subject */}
        <View style={styles.fieldWrap}>
          <AppText style={styles.fieldLabel} variant="caption">
            Subject *
          </AppText>
          <View style={styles.inputBorder}>
            <TextInput
              onChangeText={setSubject}
              placeholder="Enter notification subject"
              placeholderTextColor="#7C737E"
              style={styles.textInput}
              value={subject}
            />
          </View>
          {subject.length > 0 ? (
            <View style={styles.successRow}>
              <View style={styles.successDot} />
              <AppText style={styles.successText} variant="caption">
                Subject added
              </AppText>
            </View>
          ) : null}
        </View>

        {/* Category selector */}
        <View style={styles.fieldWrap}>
          <AppText style={styles.fieldLabel} variant="caption">
            Category *
          </AppText>
          <View style={styles.dropdownRow}>
            <AppText style={styles.dropdownText} variant="body">
              {selectedCategory}
            </AppText>
            <View style={styles.dropdownChevron} />
          </View>
          <View style={styles.chipRow}>
            {CATEGORY_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                onPress={() => setSelectedCategory(opt)}
                style={[styles.chip, selectedCategory === opt && styles.chipActive]}
              >
                <AppText
                  style={[styles.chipLabel, selectedCategory === opt && styles.chipLabelActive]}
                  variant="caption"
                >
                  {opt}
                </AppText>
              </Pressable>
            ))}
          </View>
          {selectedCategory ? (
            <View style={styles.successRow}>
              <View style={styles.successDot} />
              <AppText style={styles.successText} variant="caption">
                Category selected
              </AppText>
            </View>
          ) : null}
        </View>

        {/* Main body text box */}
        <View style={styles.fieldWrap}>
          <AppText style={styles.fieldLabel} variant="caption">
            Main Body
          </AppText>
          <View style={styles.textAreaBorder}>
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
              <TextInput
                multiline
                numberOfLines={8}
                onChangeText={setBody}
                placeholder="Everything you need to know about your event..."
                placeholderTextColor="#7C737E"
                style={styles.textArea}
                textAlignVertical="top"
                value={body}
              />
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      {/* Sticky send button */}
      <View style={styles.stickyFooter}>
        <View style={styles.participantRow}>
          <View style={styles.participantAvatar} />
          <AppText style={styles.participantName} variant="label">
            Rohit
          </AppText>
          <AppText style={styles.participantEmail} variant="body">
            tstrohittiwari@gmail.com
          </AppText>
        </View>
        <Pressable style={styles.sendButton}>
          <AppText style={styles.sendButtonLabel} variant="label">
            Send Now
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#FAFAFA',
    flex: 1,
  },

  /* Header */
  headerBar: {
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderBottomColor: '#E8E6E8',
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 56,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  headerTitle: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 20,
  },
  headerRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  sidebarButton: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  menuLine: {
    backgroundColor: '#342636',
    borderRadius: 2,
    height: 2,
    marginVertical: 2,
    width: 16,
  },

  /* Bell icon (drawn) */
  bellIconWrap: {
    height: 24,
    position: 'relative',
    width: 24,
  },
  bellBody: {
    borderColor: '#342636',
    borderRadius: 5,
    borderWidth: 1.5,
    height: 13,
    left: 5,
    position: 'absolute',
    top: 7,
    width: 14,
  },
  bellTop: {
    borderColor: '#342636',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderWidth: 1.5,
    height: 5,
    left: 9,
    position: 'absolute',
    top: 4,
    width: 6,
  },
  bellClapper: {
    backgroundColor: '#342636',
    borderRadius: 2,
    height: 3,
    left: 11,
    position: 'absolute',
    top: 20,
    width: 3,
  },

  /* Avatar pill */
  avatarPill: {
    alignItems: 'center',
    backgroundColor: '#E8E6E8',
    borderRadius: 95,
    flexDirection: 'row',
    height: 40,
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    width: 64,
  },
  avatarCircle: {
    borderRadius: 67,
    height: 32,
    overflow: 'hidden',
    width: 32,
  },
  avatarBg: {
    backgroundColor: '#1D2633',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  chevronDown: {
    borderBottomColor: '#1C274C',
    borderBottomWidth: 0,
    borderLeftColor: 'transparent',
    borderLeftWidth: 4,
    borderRightColor: 'transparent',
    borderRightWidth: 4,
    borderTopColor: '#1C274C',
    borderTopWidth: 5,
    height: 0,
    width: 0,
  },

  /* Scroll content */
  scrollContent: {
    gap: 20,
    paddingBottom: 120,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  subheading: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },

  /* Fields */
  fieldWrap: {
    gap: 4,
  },
  fieldLabel: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 15,
  },
  dropdownRow: {
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderColor: '#C3BFC4',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownText: {
    color: '#7C737E',
    flex: 1,
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
  },
  dropdownChevron: {
    borderLeftColor: 'transparent',
    borderLeftWidth: 4,
    borderRightColor: 'transparent',
    borderRightWidth: 4,
    borderTopColor: '#7C737E',
    borderTopWidth: 5,
    height: 0,
    width: 0,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    borderColor: '#C3BFC4',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipActive: {
    backgroundColor: '#F3EEFF',
    borderColor: '#8359D5',
  },
  chipLabel: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '400',
  },
  chipLabelActive: {
    color: '#42007A',
  },
  inputBorder: {
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderColor: '#C3BFC4',
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    color: '#100013',
    flex: 1,
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
    padding: 0,
  },

  /* Text area */
  textAreaBorder: {
    backgroundColor: '#FAFAFA',
    borderColor: '#C3BFC4',
    borderRadius: 8,
    borderWidth: 1,
    height: 352,
    padding: 12,
  },
  textArea: {
    color: '#342636',
    fontFamily: 'Aeonik Pro',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 25,
    minHeight: 328,
    padding: 0,
  },

  /* Success feedback */
  successRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  successDot: {
    backgroundColor: '#009826',
    borderRadius: 9,
    height: 18,
    width: 18,
  },
  successText: {
    color: '#009826',
    fontFamily: 'Urbanist',
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 15,
  },

  /* Sticky footer */
  stickyFooter: {
    alignItems: 'center',
    backgroundColor: '#F3EEFF',
    borderColor: '#6949AA',
    borderRadius: 26,
    borderWidth: 0.5,
    bottom: 12,
    gap: 8,
    left: 20,
    paddingBottom: 4,
    paddingHorizontal: 4,
    paddingTop: 8,
    position: 'absolute',
    right: 20,
  },
  participantRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    height: 24,
  },
  participantAvatar: {
    backgroundColor: '#1D2633',
    borderRadius: 20,
    height: 24,
    width: 24,
  },
  participantName: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 17,
  },
  participantEmail: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
  },
  sendButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: '#423072',
    borderRadius: 100,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sendButtonLabel: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 19,
    textAlign: 'center',
  },
});
