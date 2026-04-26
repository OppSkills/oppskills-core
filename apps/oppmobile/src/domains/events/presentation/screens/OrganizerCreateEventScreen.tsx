import { useState } from 'react';
import { Image, Pressable, ScrollView, TextInput, View } from 'react-native';

import subtractPlaceholder from '../../../../../assets/Subtract.png';
import { AppText } from '../../../../shared/ui';
import {
  AttendeesModal,
  DatePickerModal,
  DescriptionModal,
  LocationModal,
  OrganizerNameModal,
  TicketingModal,
  TimePickerModal,
  type LocationMode,
  type TicketType,
  type TimeValue,
} from './EventFormModals';
import { styles } from './OrganizerCreateEventScreen.styles';

type ActiveModal =
  | 'date'
  | 'location'
  | 'time'
  | 'description'
  | 'attendees'
  | 'organizer'
  | 'ticketing'
  | null;

export interface OrganizerCreateEventScreenProps {
  readonly onBack: () => void;
}

export function OrganizerCreateEventScreen({ onBack }: OrganizerCreateEventScreenProps) {
  const [eventName, setEventName] = useState('');
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  // Field state
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [locationMode, setLocationMode] = useState<LocationMode>('online');
  const [locationValue, setLocationValue] = useState('');
  const [eventTime, setEventTime] = useState<TimeValue>({ hour: '10', minute: '00', period: 'AM' });
  const [description, setDescription] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [ticketType, setTicketType] = useState<TicketType>('free');

  const formattedDate = eventDate
    ? `${eventDate.getDate()} ${MONTHS[eventDate.getMonth()]} ${String(eventDate.getFullYear()).slice(2)}`
    : null;

  const formattedTime = `${eventTime.hour}:${eventTime.minute} ${eventTime.period}`;

  const locationLabel = locationValue.trim()
    ? locationValue
    : locationMode === 'online'
    ? 'Add Event Location'
    : 'Add Event Location';

  const locationSubtitle = locationValue.trim()
    ? locationMode === 'online' ? 'Online' : 'Offline'
    : 'Offline location or virtual link';

  return (
    <View style={styles.screen}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <View style={styles.backChevron} />
        </Pressable>
        <AppText style={styles.topBarTitle}>Event Details</AppText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <AppText style={styles.sectionLabel}>Banner</AppText>
        <Pressable style={styles.bannerContainer}>
          <Image resizeMode="cover" source={subtractPlaceholder} style={styles.bannerImage} />
          <View style={styles.bannerOverlay}>
            <View style={styles.changeBannerBtn}>
              <AppText style={styles.changeBannerText}>Change Banner</AppText>
            </View>
          </View>
        </Pressable>

        {/* Preview card */}
        <AppText style={styles.sectionLabel}>How your card will look</AppText>
        <View style={styles.previewCard}>
          <Image resizeMode="cover" source={subtractPlaceholder} style={styles.previewCardBanner} />
          <View style={styles.previewCardBody}>
            <View style={styles.previewBadgeRow}>
              <View style={styles.previewBadge}>
                <AppText style={styles.previewBadgeText}>EVENT</AppText>
              </View>
            </View>
            <AppText style={styles.previewTitle}>{eventName.trim() || 'Event Name'}</AppText>
            <AppText style={styles.previewSubtitle}>{organizerName.trim() || 'OppSkills'}</AppText>
            <View style={styles.previewFooterRow}>
              <View style={styles.previewAvatarStack}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={styles.previewAvatar} />
                ))}
              </View>
              <AppText style={styles.previewMeta}>
                {formattedDate ? `Register by ${formattedDate}` : 'Register by —'}
              </AppText>
              <View style={styles.previewPill}>
                <AppText style={styles.previewPillText}>
                  {ticketType === 'free' ? 'Free' : 'Paid'} • {locationMode === 'online' ? 'Online' : 'Offline'}
                </AppText>
              </View>
            </View>
          </View>
        </View>

        {/* Event type */}
        <AppText style={styles.sectionLabel}>Event Type</AppText>
        <Pressable style={styles.typeSelector}>
          <AppText style={styles.typeSelectorText}>Individual Event</AppText>
          <View style={styles.chevronDown} />
        </Pressable>

        {/* Event name */}
        <TextInput
          onChangeText={setEventName}
          placeholder="Event Name"
          placeholderTextColor="#D1CCD7"
          style={styles.eventNameInput}
          value={eventName}
        />

        {/* Details form cards */}
        <AppText style={styles.sectionLabel}>Details</AppText>
        <View>
          <FormCard
            isFirst
            chevron
            iconSlot={<CalendarIcon />}
            onPress={() => setActiveModal('date')}
            subtitle="Event Date"
            title={formattedDate ?? 'Select Date'}
          />
          <FormCard
            chevron
            iconSlot={<LocationIcon />}
            onPress={() => setActiveModal('location')}
            subtitle={locationSubtitle}
            title={locationLabel}
          />
          <FormCard
            chevron
            iconSlot={<ClockIcon />}
            onPress={() => setActiveModal('time')}
            subtitle="Event Time"
            title={formattedTime}
          />
          <FormCard
            chevron
            iconSlot={<TextIcon />}
            onPress={() => setActiveModal('description')}
            subtitle={description.trim() ? description.slice(0, 40) + (description.length > 40 ? '…' : '') : 'About this event'}
            title="Add Description"
          />
          <FormCard
            chevron
            iconSlot={<PeopleIcon />}
            onPress={() => setActiveModal('attendees')}
            subtitle="Max Attendees"
            title={maxAttendees.trim() ? `${maxAttendees} Users` : 'Unlimited Users'}
          />
          <FormCard
            isLast
            chevron
            iconSlot={<BuildingIcon />}
            onPress={() => setActiveModal('organizer')}
            subtitle="Who is organizing?"
            title={organizerName.trim() || 'Organization Name'}
          />
        </View>

        {/* Ticketing */}
        <AppText style={styles.sectionLabel}>Ticketing</AppText>
        <View>
          <FormCard
            isFirst
            isLast
            chevron
            iconSlot={<TagIcon />}
            onPress={() => setActiveModal('ticketing')}
            subtitle={ticketType === 'free' ? 'No registration fee' : 'Paid entry'}
            title={ticketType === 'free' ? 'Free Event' : 'Paid Event'}
          />
        </View>

        {/* Submit */}
        <Pressable style={styles.submitButton}>
          <AppText style={styles.submitButtonText}>List Event</AppText>
        </Pressable>
      </ScrollView>

      {/* Modals */}
      <DatePickerModal
        label="Select date"
        onClose={() => setActiveModal(null)}
        onConfirm={(d) => setEventDate(d)}
        value={eventDate}
        visible={activeModal === 'date'}
      />
      <LocationModal
        mode={locationMode}
        onClose={() => setActiveModal(null)}
        onConfirm={(m, v) => { setLocationMode(m); setLocationValue(v); }}
        value={locationValue}
        visible={activeModal === 'location'}
      />
      <TimePickerModal
        onClose={() => setActiveModal(null)}
        onConfirm={(t) => setEventTime(t)}
        value={eventTime}
        visible={activeModal === 'time'}
      />
      <DescriptionModal
        onClose={() => setActiveModal(null)}
        onConfirm={(v) => setDescription(v)}
        value={description}
        visible={activeModal === 'description'}
      />
      <AttendeesModal
        onClose={() => setActiveModal(null)}
        onConfirm={(v) => setMaxAttendees(v)}
        value={maxAttendees}
        visible={activeModal === 'attendees'}
      />
      <OrganizerNameModal
        onClose={() => setActiveModal(null)}
        onConfirm={(v) => setOrganizerName(v)}
        value={organizerName}
        visible={activeModal === 'organizer'}
      />
      <TicketingModal
        onClose={() => setActiveModal(null)}
        onConfirm={(v) => setTicketType(v)}
        value={ticketType}
        visible={activeModal === 'ticketing'}
      />
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface FormCardProps {
  readonly iconSlot: React.ReactNode;
  readonly title: string;
  readonly subtitle: string;
  readonly chevron?: boolean;
  readonly isFirst?: boolean;
  readonly isLast?: boolean;
  readonly onPress?: () => void;
}

function FormCard({ iconSlot, title, subtitle, chevron, isFirst, isLast, onPress }: FormCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.formCard,
        isFirst && styles.formCardFirst,
        isLast && styles.formCardLast,
      ]}
    >
      <View style={styles.formCardIconWrap}>{iconSlot}</View>
      <View style={styles.formCardContent}>
        <AppText style={styles.formCardTitle}>{title}</AppText>
        <AppText style={styles.formCardSubtitle}>{subtitle}</AppText>
      </View>
      {chevron && <View style={styles.formCardChevron} />}
    </Pressable>
  );
}

function CalendarIcon() {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <View style={{ backgroundColor: '#7C737E', borderRadius: 1, height: 1.5, width: 14 }} />
      <View style={{ backgroundColor: '#7C737E', borderRadius: 1, height: 1.5, width: 14 }} />
      <View style={{ backgroundColor: '#7C737E', borderRadius: 1, height: 1.5, width: 14 }} />
    </View>
  );
}

function LocationIcon() {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <View style={{ backgroundColor: '#7C737E', borderRadius: 5, height: 10, width: 10 }} />
      <View style={{ backgroundColor: '#7C737E', borderRadius: 1, height: 5, width: 2 }} />
    </View>
  );
}

function ClockIcon() {
  return (
    <View style={{ borderColor: '#7C737E', borderRadius: 8, borderWidth: 1.5, height: 16, width: 16 }} />
  );
}

function TextIcon() {
  return (
    <View style={{ alignItems: 'flex-start', gap: 3 }}>
      <View style={{ backgroundColor: '#7C737E', borderRadius: 1, height: 1.5, width: 14 }} />
      <View style={{ backgroundColor: '#7C737E', borderRadius: 1, height: 1.5, width: 10 }} />
      <View style={{ backgroundColor: '#7C737E', borderRadius: 1, height: 1.5, width: 12 }} />
    </View>
  );
}

function PeopleIcon() {
  return (
    <View style={{ alignItems: 'center', gap: 1 }}>
      <View style={{ backgroundColor: '#7C737E', borderRadius: 5, height: 8, width: 8 }} />
      <View style={{ backgroundColor: '#7C737E', borderBottomLeftRadius: 4, borderBottomRightRadius: 4, height: 6, width: 12 }} />
    </View>
  );
}

function BuildingIcon() {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
      <View style={{ backgroundColor: '#7C737E', height: 10, width: 14 }} />
      <View style={{ backgroundColor: '#7C737E', height: 3, width: 16 }} />
    </View>
  );
}

function TagIcon() {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ borderColor: '#7C737E', borderRadius: 2, borderWidth: 1.5, height: 12, width: 12 }} />
    </View>
  );
}
