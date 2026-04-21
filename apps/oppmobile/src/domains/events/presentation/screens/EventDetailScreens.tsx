import { ImageBackground, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import highResEventImage from '../../../../../assets/highres_490352821 1.png';
import { AppText } from '../../../../shared/ui';

interface EventDetailPageScreenProps {
  readonly onBackToDiscover: () => void;
}

export function EventFreePageScreen({ onBackToDiscover }: EventDetailPageScreenProps) {
  return <EventDetailTemplate isPaid={false} onBackToDiscover={onBackToDiscover} />;
}

export function EventPaidPageScreen({ onBackToDiscover }: EventDetailPageScreenProps) {
  return <EventDetailTemplate isPaid onBackToDiscover={onBackToDiscover} />;
}

function EventDetailTemplate({
  onBackToDiscover,
  isPaid,
}: {
  readonly onBackToDiscover: () => void;
  readonly isPaid: boolean;
}) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrap}>
          <ImageBackground source={highResEventImage} style={styles.heroImage} />
          <Pressable onPress={onBackToDiscover} style={styles.backButton}>
            <AppText colorToken="textSecondary" style={styles.backGlyph} variant="title">
              {'<'}
            </AppText>
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.featuredPill}>
            <AppText colorToken="textSecondary" style={styles.featuredLabel} variant="caption">
              Featured in
            </AppText>
            <AppText colorToken="textPrimary" style={styles.featuredValue} variant="caption">
              FestName
            </AppText>
          </View>

          <View style={styles.headerMetaRow}>
            <View style={styles.tagRow}>
              <TagChip label="Completed" />
              <TagChip label={isPaid ? 'Paid' : 'Free'} />
            </View>
            <Pressable style={styles.shareButton}>
              <AppText colorToken="textSecondary" variant="micro">
                Share
              </AppText>
            </Pressable>
          </View>

          <AppText style={styles.eventTitle} variant="sectionHeading">
            Silicon Valley Funding Summit at CES 2026 - VIP Access for Investors
          </AppText>

          <View style={styles.infoList}>
            <DateInfoCard
              day="5"
              heading="Monday, 5 January 2026"
              month="Jan"
              subheading="8:00 - 20:00 GMT-8"
            />
            <LocationInfoCard heading="College/University Name" subheading="City, State" />
          </View>

          <View style={styles.filterChipRow}>
            <OutlineChip label="Preview" />
            <OutlineChip label="FAQs" />
            <OutlineChip label="Venue" />
          </View>

          <View style={styles.sectionWrap}>
            <AppText style={styles.sectionTitle} variant="title">
              About Event
            </AppText>
            <AppText colorToken="textSecondary" style={styles.sectionBody} variant="body">
              Get ready for the ultimate musical experience as Karan Aujla, the global Punjabi sensation, takes over
              India with the P Pop Culture Tour! Known for chart-topping anthems, this event delivers a high-energy
              production with unforgettable live moments.
            </AppText>
            <Pressable style={styles.readMoreButton}>
              <AppText colorToken="brandPrimaryStrong" variant="caption">
                Read more
              </AppText>
            </Pressable>
          </View>

          {!isPaid ? (
            <View style={styles.freeActionWrap}>
              <View style={styles.participantBanner}>
                <AppText colorToken="textSecondary" variant="caption">
                  Participant: Rohit (tstrohittiwari@gmail.com)
                </AppText>
              </View>
              <Pressable style={styles.primaryActionButton}>
                <AppText colorToken="textInverse" style={styles.primaryActionLabel} variant="body">
                  Next
                </AppText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.paidActionWrap}>
              <View style={styles.ticketCard}>
                <AppText colorToken="textPrimary" style={styles.ticketAmount} variant="title">
                  INR 499
                </AppText>
                <AppText colorToken="textSecondary" variant="caption">
                  Includes entry pass, networking access, and event kit.
                </AppText>
              </View>
              <Pressable style={styles.primaryActionButton}>
                <AppText colorToken="textInverse" style={styles.primaryActionLabel} variant="body">
                  Pay INR 499 and Continue
                </AppText>
              </Pressable>
            </View>
          )}

          <View style={styles.sectionWrap}>
            <AppText style={styles.sectionTitle} variant="title">
              Contact Details
            </AppText>
            <View style={styles.contactList}>
              <ContactCard email="emailoftheperson@gmail.com" initials="TM" name="Owner Name" phone="+91 99999 99999" />
              <ContactCard email="emailoftheperson@gmail.com" initials="TM" name="Owner Name" phone="+91 99999 99999" />
            </View>
          </View>

          <View style={styles.sectionWrap}>
            <AppText style={styles.sectionTitle} variant="title">
              Speakers
            </AppText>
            <View style={styles.speakerCard}>
              <View style={styles.speakerImageStub} />
              <View style={styles.speakerMeta}>
                <AppText colorToken="textPrimary" style={styles.speakerName} variant="body">
                  Someone Famous
                </AppText>
                <AppText colorToken="textSecondary" variant="caption">
                  Speaker
                </AppText>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DateInfoCard({
  month,
  day,
  heading,
  subheading,
}: {
  readonly month: string;
  readonly day: string;
  readonly heading: string;
  readonly subheading: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.dateIconWrap}>
        <View style={styles.dateMonthStrip}>
          <AppText colorToken="textSecondary" style={styles.dateMonthText} variant="micro">
            {month}
          </AppText>
        </View>
        <View style={styles.dateDayWrap}>
          <AppText colorToken="textPrimary" style={styles.dateDayText} variant="body">
            {day}
          </AppText>
        </View>
      </View>
      <View style={styles.infoTextWrap}>
        <AppText colorToken="textPrimary" style={styles.infoHeading} variant="caption">
          {heading}
        </AppText>
        <AppText colorToken="textSecondary" style={styles.infoSubheading} variant="caption">
          {subheading}
        </AppText>
      </View>
    </View>
  );
}

function LocationInfoCard({ heading, subheading }: { readonly heading: string; readonly subheading: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.locationIconWrap}>
        <View style={styles.locationPin} />
      </View>
      <View style={styles.infoTextWrap}>
        <AppText colorToken="textPrimary" style={styles.infoHeading} variant="caption">
          {heading}
        </AppText>
        <AppText colorToken="textSecondary" style={styles.infoSubheading} variant="caption">
          {subheading}
        </AppText>
      </View>
    </View>
  );
}

function TagChip({ label }: { readonly label: string }) {
  return (
    <View style={styles.tagChip}>
      <AppText colorToken="brandPrimaryStrong" style={styles.tagChipText} variant="micro">
        {label}
      </AppText>
    </View>
  );
}

function OutlineChip({ label }: { readonly label: string }) {
  return (
    <View style={styles.outlineChip}>
      <AppText colorToken="textSecondary" style={styles.outlineChipText} variant="caption">
        {label}
      </AppText>
    </View>
  );
}

function ContactCard({
  initials,
  name,
  phone,
  email,
}: {
  readonly initials: string;
  readonly name: string;
  readonly phone: string;
  readonly email: string;
}) {
  return (
    <View style={styles.contactCard}>
      <View style={styles.contactAvatar}>
        <AppText colorToken="textInverse" style={styles.contactInitials} variant="body">
          {initials}
        </AppText>
      </View>
      <View style={styles.contactDetails}>
        <AppText colorToken="textPrimary" style={styles.contactName} variant="body">
          {name}
        </AppText>
        <AppText colorToken="textSecondary" style={styles.contactInfo} variant="micro">
          {phone}
        </AppText>
        <AppText colorToken="textSecondary" style={styles.contactInfo} variant="micro">
          {email}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 24,
    height: 32,
    justifyContent: 'center',
    left: 12,
    position: 'absolute',
    top: 12,
    width: 32,
  },
  backGlyph: {
    fontSize: 18,
    lineHeight: 20,
  },
  contactAvatar: {
    alignItems: 'center',
    backgroundColor: '#271B40',
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  contactCard: {
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderColor: '#835BD5',
    borderRadius: 12,
    borderWidth: 0.5,
    flexDirection: 'row',
    gap: 16,
    minHeight: 85,
    padding: 12,
  },
  contactDetails: {
    flex: 1,
    gap: 2,
  },
  contactInfo: {
    fontSize: 12,
    lineHeight: 18,
  },
  contactInitials: {
    fontSize: 16,
    lineHeight: 24,
  },
  contactList: {
    gap: 12,
  },
  contactName: {
    fontSize: 16,
    lineHeight: 19,
    marginBottom: 2,
  },
  content: {
    gap: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  dateDayText: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  dateDayWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  dateIconWrap: {
    backgroundColor: '#FAFAFA',
    borderColor: '#C3BFC4',
    borderRadius: 8,
    borderWidth: 0.25,
    height: 44,
    overflow: 'hidden',
    width: 44,
  },
  dateMonthStrip: {
    alignItems: 'center',
    backgroundColor: '#EDEDED',
    height: 18,
    justifyContent: 'center',
  },
  dateMonthText: {
    fontSize: 12,
    lineHeight: 18,
  },
  eventTitle: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 28,
    fontWeight: '500',
    lineHeight: 35,
  },
  featuredLabel: {
    color: '#7C737E',
    fontSize: 14,
    lineHeight: 21,
  },
  featuredPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EDEDED',
    borderRadius: 8,
    columnGap: 4,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  featuredValue: {
    color: '#342636',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
  },
  filterChipRow: {
    flexDirection: 'row',
    gap: 12,
  },
  freeActionWrap: {
    gap: 8,
  },
  headerMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroImage: {
    height: 234.48,
    width: '100%',
  },
  heroWrap: {
    overflow: 'hidden',
    position: 'relative',
  },
  infoHeading: {
    color: '#342636',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 17,
  },
  infoList: {
    gap: 12,
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  infoSubheading: {
    color: '#7C737E',
    fontSize: 12,
    lineHeight: 18,
  },
  infoTextWrap: {
    flex: 1,
    gap: 2,
  },
  locationIconWrap: {
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderColor: '#C3BFC4',
    borderRadius: 8,
    borderWidth: 0.25,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  locationPin: {
    backgroundColor: '#342636',
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  outlineChip: {
    borderColor: '#C3BFC4',
    borderRadius: 41,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  outlineChipText: {
    color: '#7C737E',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
  },
  paidActionWrap: {
    gap: 12,
  },
  participantBanner: {
    alignItems: 'center',
    backgroundColor: '#F3EEFF',
    borderColor: '#6949AA',
    borderRadius: 26,
    borderWidth: 0.5,
    minHeight: 56,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  primaryActionButton: {
    alignItems: 'center',
    backgroundColor: '#423072',
    borderRadius: 100,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  primaryActionLabel: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 19,
  },
  readMoreButton: {
    alignSelf: 'flex-start',
    borderRadius: 37,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  screen: {
    backgroundColor: '#FAFAFA',
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  sectionBody: {
    color: '#584D5A',
    fontSize: 14,
    lineHeight: 21,
  },
  sectionTitle: {
    color: '#342636',
    fontFamily: 'Aeonik Pro',
    fontSize: 24,
    fontWeight: '500',
    lineHeight: 30,
  },
  sectionWrap: {
    gap: 16,
  },
  shareButton: {
    alignItems: 'center',
    backgroundColor: '#EDEDED',
    borderRadius: 27,
    height: 32,
    justifyContent: 'center',
    width: 74,
  },
  speakerCard: {
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderColor: '#C3BFC4',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 16,
    minHeight: 134,
    overflow: 'hidden',
  },
  speakerImageStub: {
    backgroundColor: '#EDEDED',
    height: 134,
    width: 120,
  },
  speakerMeta: {
    flex: 1,
    gap: 8,
    paddingRight: 12,
  },
  speakerName: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 25,
  },
  tagChip: {
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagChipText: {
    color: '#423072',
    fontSize: 12,
    lineHeight: 18,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 12,
  },
  ticketAmount: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 28,
    fontWeight: '500',
    lineHeight: 35,
  },
  ticketCard: {
    backgroundColor: '#F9F7FF',
    borderColor: '#CDB5FF',
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
});
