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

export type EligibilityKey = 'everyone' | 'school' | 'college' | 'freshers' | 'professionals';
export type PassSendingMode = 'immediate' | 'after-approval';

export interface EventPrize {
  readonly id: string;
  readonly title: string;
  readonly amount: string;
}

export interface EventContact {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly email: string;
}

export interface LiveEvent {
  readonly id: string;
  readonly title: string;
  readonly candidates: number;
  readonly startDate: string;
  readonly startTime: string;
  readonly organizerName: string;
  readonly locationMode: LocationMode;
  readonly locationValue: string;
  readonly description: string;
  readonly maxAttendees: string;
  readonly ticketType: TicketType;
  // Registration Settings
  readonly eligibleCandidates?: readonly EligibilityKey[];
  readonly registrationDeadlineDate?: string;
  readonly registrationDeadlineTime?: string;
  // Prizes
  readonly prizeDescription?: string;
  readonly participationCertificate?: boolean;
  readonly prizes?: readonly EventPrize[];
  // Additional Info
  readonly contacts?: readonly EventContact[];
  // Pass Settings
  readonly passSendingMode?: PassSendingMode;
  readonly restrictToColleges?: boolean;
}

type ActiveModal =
  | 'date'
  | 'location'
  | 'time'
  | 'description'
  | 'attendees'
  | 'organizer'
  | 'ticketing'
  | null;

// Which fields are required and their display labels
const REQUIRED: Array<{ key: string; label: string }> = [
  { key: 'eventName', label: 'Event Name' },
  { key: 'eventDate', label: 'Event Date' },
  { key: 'locationValue', label: 'Event Location' },
  { key: 'description', label: 'Description' },
  { key: 'organizerName', label: 'Organization Name' },
];

export interface OrganizerCreateEventScreenProps {
  readonly onBack: () => void;
  readonly onHostEvent: (event: LiveEvent) => void;
}

export function OrganizerCreateEventScreen({ onBack, onHostEvent }: OrganizerCreateEventScreenProps) {
  const [eventName, setEventName] = useState('');
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

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

  function validate() {
    const values: Record<string, string | null> = {
      eventName: eventName.trim() || null,
      eventDate: eventDate ? 'ok' : null,
      locationValue: locationValue.trim() || null,
      description: description.trim() || null,
      organizerName: organizerName.trim() || null,
    };

    const newErrors: Record<string, string> = {};
    for (const { key, label } of REQUIRED) {
      if (!values[key]) newErrors[key] = `${label} is required`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleListEvent() {
    setSubmitted(true);
    if (!validate()) return;

    const event: LiveEvent = {
      id: String(Date.now()),
      title: eventName.trim(),
      candidates: 0,
      startDate: formattedDate!,
      startTime: formattedTime,
      organizerName: organizerName.trim(),
      locationMode,
      locationValue: locationValue.trim(),
      description: description.trim(),
      maxAttendees: maxAttendees.trim(),
      ticketType,
    };
    onHostEvent(event);
  }

  function fieldError(key: string) {
    return submitted && errors[key] ? errors[key] : null;
  }

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
                {formattedDate ? `By ${formattedDate}` : 'Register by —'}
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
          onChangeText={(v) => {
            setEventName(v);
            if (submitted && v.trim()) setErrors((p) => { const n = { ...p }; delete n.eventName; return n; });
          }}
          placeholder="Event Name"
          placeholderTextColor="#D1CCD7"
          style={[styles.eventNameInput, fieldError('eventName') ? { borderBottomColor: '#EF4444', borderBottomWidth: 1 } : undefined]}
          value={eventName}
        />
        {fieldError('eventName') && <AppText style={errorStyle}>{fieldError('eventName')}</AppText>}

        {/* Details form cards */}
        <AppText style={styles.sectionLabel}>Details</AppText>
        <View>
          <FormCard
            isFirst
            chevron
            error={fieldError('eventDate')}
            iconSlot={<CalendarIcon />}
            onPress={() => setActiveModal('date')}
            subtitle="Event Date"
            title={formattedDate ?? 'Select Date'}
            valueSet={!!eventDate}
          />
          <FormCard
            chevron
            error={fieldError('locationValue')}
            iconSlot={<LocationIcon />}
            onPress={() => setActiveModal('location')}
            subtitle={locationValue.trim() ? (locationMode === 'online' ? 'Online' : 'Offline') : 'Offline location or virtual link'}
            title={locationValue.trim() || 'Add Event Location'}
            valueSet={!!locationValue.trim()}
          />
          <FormCard
            chevron
            iconSlot={<ClockIcon />}
            onPress={() => setActiveModal('time')}
            subtitle="Event Time"
            title={formattedTime}
            valueSet
          />
          <FormCard
            chevron
            error={fieldError('description')}
            iconSlot={<TextIcon />}
            onPress={() => setActiveModal('description')}
            subtitle={description.trim() ? description.slice(0, 40) + (description.length > 40 ? '…' : '') : 'About this event'}
            title="Add Description"
            valueSet={!!description.trim()}
          />
          <FormCard
            chevron
            iconSlot={<PeopleIcon />}
            onPress={() => setActiveModal('attendees')}
            subtitle="Max Attendees"
            title={maxAttendees.trim() ? `${maxAttendees} Users` : 'Unlimited Users'}
            valueSet
          />
          <FormCard
            isLast
            chevron
            error={fieldError('organizerName')}
            iconSlot={<BuildingIcon />}
            onPress={() => setActiveModal('organizer')}
            subtitle="Who is organizing?"
            title={organizerName.trim() || 'Organization Name'}
            valueSet={!!organizerName.trim()}
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
            valueSet
          />
        </View>

        {/* Submit */}
        {submitted && Object.keys(errors).length > 0 && (
          <View style={validationBannerStyle}>
            <AppText style={validationBannerText}>
              Please fill in all required fields before listing.
            </AppText>
          </View>
        )}

        <Pressable onPress={handleListEvent} style={styles.submitButton}>
          <AppText style={styles.submitButtonText}>List Event</AppText>
        </Pressable>
      </ScrollView>

      {/* Modals */}
      <DatePickerModal
        label="Select event date"
        onClose={() => setActiveModal(null)}
        onConfirm={(d) => {
          setEventDate(d);
          if (submitted) setErrors((p) => { const n = { ...p }; delete n.eventDate; return n; });
        }}
        value={eventDate}
        visible={activeModal === 'date'}
      />
      <LocationModal
        mode={locationMode}
        onClose={() => setActiveModal(null)}
        onConfirm={(m, v) => {
          setLocationMode(m);
          setLocationValue(v);
          if (submitted && v.trim()) setErrors((p) => { const n = { ...p }; delete n.locationValue; return n; });
        }}
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
        onConfirm={(v) => {
          setDescription(v);
          if (submitted && v.trim()) setErrors((p) => { const n = { ...p }; delete n.description; return n; });
        }}
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
        onConfirm={(v) => {
          setOrganizerName(v);
          if (submitted && v.trim()) setErrors((p) => { const n = { ...p }; delete n.organizerName; return n; });
        }}
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

// ── Inline styles (one-off, no stylesheet needed) ─────────────────────────────

const errorStyle = {
  color: '#EF4444',
  fontFamily: 'Urbanist',
  fontSize: 11,
  lineHeight: 16,
  marginBottom: 4,
  marginTop: 2,
} as const;

const validationBannerStyle = {
  backgroundColor: '#FEF2F2',
  borderColor: '#FECACA',
  borderRadius: 8,
  borderWidth: 1,
  marginTop: 16,
  paddingHorizontal: 14,
  paddingVertical: 10,
} as const;

const validationBannerText = {
  color: '#EF4444',
  fontFamily: 'Urbanist',
  fontSize: 13,
  fontWeight: '500' as const,
  lineHeight: 18,
};

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
  readonly valueSet?: boolean;
  readonly error?: string | null;
}

function FormCard({ iconSlot, title, subtitle, chevron, isFirst, isLast, onPress, valueSet, error }: FormCardProps) {
  return (
    <>
      <Pressable
        onPress={onPress}
        style={[
          styles.formCard,
          isFirst && styles.formCardFirst,
          isLast && styles.formCardLast,
          error ? { borderLeftColor: '#EF4444', borderLeftWidth: 3 } : undefined,
        ]}
      >
        <View style={[styles.formCardIconWrap, valueSet && { backgroundColor: '#EDE9F5' }]}>
          {iconSlot}
        </View>
        <View style={styles.formCardContent}>
          <AppText style={[styles.formCardTitle, valueSet && { color: '#1C1340' }]}>{title}</AppText>
          <AppText style={styles.formCardSubtitle}>{subtitle}</AppText>
        </View>
        {chevron && <View style={styles.formCardChevron} />}
      </Pressable>
      {error && <AppText style={{ ...errorStyle, marginHorizontal: 4, marginBottom: 0 }}>{error}</AppText>}
    </>
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
