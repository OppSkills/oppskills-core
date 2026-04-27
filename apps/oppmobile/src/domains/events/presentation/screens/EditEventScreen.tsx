import { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import subtractPlaceholder from '../../../../../assets/Subtract.png';
import { AppText } from '../../../../shared/ui';
import {
  type EligibilityKey,
  type EventContact,
  type EventPrize,
  type LiveEvent,
  type PassSendingMode,
} from './OrganizerCreateEventScreen';
import {
  DatePickerModal,
  DescriptionModal,
  LocationModal,
  TimePickerModal,
  type LocationMode,
  type TimeValue,
} from './EventFormModals';

type EditTab =
  | 'preview'
  | 'basic-details'
  | 'registration-settings'
  | 'prizes'
  | 'additional-info'
  | 'pass-settings';

type PreviewSubTab = 'about' | 'contact';

const EDIT_TABS: { key: EditTab; label: string }[] = [
  { key: 'preview', label: 'Preview' },
  { key: 'basic-details', label: 'Basic Details' },
  { key: 'registration-settings', label: 'Registration Settings' },
  { key: 'prizes', label: 'Prizes' },
  { key: 'additional-info', label: 'Additional Info' },
  { key: 'pass-settings', label: 'Pass Settings' },
];

const ELIGIBILITY_OPTIONS: { key: EligibilityKey; label: string; sub: string }[] = [
  { key: 'everyone', label: 'Everyone can apply', sub: 'All Applicants' },
  { key: 'school', label: 'School students', sub: 'Up to grade 12' },
  { key: 'college', label: 'College students', sub: 'UG / PG Students' },
  { key: 'freshers', label: 'Freshers', sub: '0-1 Year Experience' },
  { key: 'professionals', label: 'Professionals', sub: '1+ Year Experience' },
];

interface EditEventScreenProps {
  readonly event: LiveEvent;
  readonly onUpdateEvent: (event: LiveEvent) => void;
}

function formatCurrentTime(): string {
  const now = new Date();
  const h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m}:${s} ${period}`;
}

export function EditEventScreen({ event, onUpdateEvent }: EditEventScreenProps) {
  const [activeTab, setActiveTab] = useState<EditTab>('preview');
  const [savedTime, setSavedTime] = useState<string | null>(null);

  function handleSave(updatedEvent: LiveEvent) {
    onUpdateEvent(updatedEvent);
    setSavedTime(formatCurrentTime());
  }

  return (
    <View style={styles.screen}>
      {/* Tab bar */}
      <ScrollView
        contentContainerStyle={styles.tabBarContent}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
      >
        {EDIT_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tab, isActive ? styles.tabActive : null]}
            >
              <TabIcon active={isActive} name={tab.key} />
              <AppText style={[styles.tabLabel, isActive ? styles.tabLabelActive : null]}>
                {tab.label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Saved status bar */}
      <View style={styles.savedBar}>
        <AppText style={savedTime !== null ? styles.savedText : styles.unsavedText}>
          {savedTime !== null ? 'Saved' : 'Unsaved'}
        </AppText>
        {savedTime !== null && (
          <AppText style={styles.lastSavedText}>Last saved: {savedTime}</AppText>
        )}
      </View>

      {activeTab === 'preview' ? (
        <PreviewContent event={event} />
      ) : activeTab === 'basic-details' ? (
        <BasicDetailsContent event={event} onSave={handleSave} />
      ) : activeTab === 'registration-settings' ? (
        <RegistrationSettingsContent event={event} onSave={handleSave} />
      ) : activeTab === 'prizes' ? (
        <PrizesContent event={event} onSave={handleSave} />
      ) : activeTab === 'additional-info' ? (
        <AdditionalInfoContent event={event} onSave={handleSave} />
      ) : activeTab === 'pass-settings' ? (
        <PassSettingsContent event={event} onSave={handleSave} />
      ) : null}
    </View>
  );
}

// ─── Preview ─────────────────────────────────────────────────────────────────

function PreviewContent({ event }: { readonly event: LiveEvent }) {
  const [subTab, setSubTab] = useState<PreviewSubTab>('about');

  return (
    <ScrollView contentContainerStyle={styles.previewContent} showsVerticalScrollIndicator={false}>
      <View style={styles.eventCard}>
        <Image resizeMode="cover" source={subtractPlaceholder} style={styles.bannerImage} />

        <View style={styles.subTabRow}>
          <Pressable
            onPress={() => setSubTab('about')}
            style={[styles.subTab, subTab === 'about' ? styles.subTabActive : null]}
          >
            <AppText style={[styles.subTabLabel, subTab === 'about' ? styles.subTabLabelActive : null]}>
              About Event
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => setSubTab('contact')}
            style={[styles.subTab, subTab === 'contact' ? styles.subTabActive : null]}
          >
            <AppText style={[styles.subTabLabel, subTab === 'contact' ? styles.subTabLabelActive : null]}>
              Contact Details
            </AppText>
          </Pressable>
        </View>

        <View style={styles.subTabDivider} />

        {subTab === 'about' ? <AboutSection event={event} /> : <ContactSection event={event} />}
      </View>
    </ScrollView>
  );
}

function AboutSection({ event }: { readonly event: LiveEvent }) {
  return (
    <View style={styles.aboutSection}>
      <AppText style={styles.eventTitle}>{event.title.toUpperCase()}</AppText>

      <View style={styles.infoRow}>
        <View style={styles.calBlock}>
          <AppText style={styles.calMonth}>{getMonthAbbr(event.startDate)}</AppText>
          <AppText style={styles.calDay}>{getDay(event.startDate)}</AppText>
        </View>
        <View style={styles.infoText}>
          <AppText style={styles.infoMain}>{getFullDate(event.startDate)}</AppText>
          <AppText style={styles.infoSub}>{event.startTime} Onwards</AppText>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.locationIconWrap}>
          <View style={styles.locationPinHead} />
          <View style={styles.locationPinTail} />
        </View>
        <AppText style={styles.infoMain}>
          {event.locationValue || (event.locationMode === 'online' ? 'Online Event' : 'Location TBD')}
        </AppText>
      </View>

      <View style={styles.registrationCard}>
        <AppText style={styles.registrationTitle}>Registration</AppText>
        <View style={styles.registrationDivider} />
        <AppText style={styles.registrationPrompt}>Welcome! Please choose your desired ticket type:</AppText>
        <View style={styles.ticketOption}>
          <AppText style={styles.ticketLabel}>
            {event.ticketType === 'free' ? 'Standard Ticket (Free)' : 'Standard Ticket (Paid)'}
          </AppText>
          <View style={styles.ticketCheck}>
            <View style={styles.ticketCheckMark} />
          </View>
        </View>
      </View>

      <AppText style={styles.sectionHeading}>About Event</AppText>
      {event.description ? (
        <AppText style={styles.descriptionText}>{event.description}</AppText>
      ) : (
        <AppText style={styles.descriptionEmpty}>No description added yet.</AppText>
      )}
    </View>
  );
}

function ContactSection({ event }: { readonly event: LiveEvent }) {
  const contacts = event.contacts ?? [];
  return (
    <View style={styles.contactSection}>
      <AppText style={styles.sectionHeading}>Contact Details</AppText>
      {contacts.length === 0 ? (
        <AppText style={styles.descriptionEmpty}>No contacts added yet.</AppText>
      ) : (
        contacts.map((contact) => (
          <View key={contact.id} style={styles.contactCard}>
            <View style={styles.contactAvatar}>
              <AppText style={styles.contactInitial}>{contact.name.charAt(0).toUpperCase()}</AppText>
            </View>
            <View style={styles.contactInfo}>
              <AppText style={styles.contactName}>{contact.name}</AppText>
              <AppText style={styles.contactMeta}>{contact.phone}</AppText>
              <AppText style={styles.contactMeta}>{contact.email}</AppText>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

// ─── Basic Details ────────────────────────────────────────────────────────────

type BasicModal = 'date' | 'time' | 'location' | 'description' | null;

function BasicDetailsContent({
  event,
  onSave,
}: {
  readonly event: LiveEvent;
  readonly onSave: (event: LiveEvent) => void;
}) {
  const [title, setTitle] = useState(event.title);
  const [startDate, setStartDate] = useState(event.startDate);
  const [startTime, setStartTime] = useState(event.startTime);
  const [locationMode, setLocationMode] = useState<LocationMode>(event.locationMode);
  const [locationValue, setLocationValue] = useState(event.locationValue);
  const [description, setDescription] = useState(event.description);
  const [activeModal, setActiveModal] = useState<BasicModal>(null);

  const parsedDate = parseDateStr(startDate);
  const timeValue = parseTimeStr(startTime);

  function handleSave() {
    onSave({ ...event, title, startDate, startTime, locationMode, locationValue, description });
  }

  return (
    <ScrollView
      contentContainerStyle={bdStyles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={bdStyles.bannerWrap}>
        <Image resizeMode="cover" source={subtractPlaceholder} style={bdStyles.banner} />
        <Pressable style={bdStyles.changeBannerBtn}>
          <AppText style={bdStyles.changeBannerText}>Change Banner</AppText>
        </Pressable>
      </View>

      <View style={bdStyles.fieldGroup}>
        <TextInput
          onChangeText={setTitle}
          placeholder="Event Name"
          placeholderTextColor="#C3BFC4"
          style={bdStyles.titleInput}
          value={title}
        />
        <AppText style={bdStyles.fieldHint}>Enter the name of your event</AppText>
      </View>

      <View style={bdStyles.divider} />

      <Pressable onPress={() => setActiveModal('date')} style={bdStyles.fieldRow}>
        <View style={bdStyles.fieldIconWrap}>
          <View style={bdStyles.calIcon} />
          <View style={bdStyles.calPage} />
        </View>
        <View style={bdStyles.fieldTextCol}>
          <AppText style={bdStyles.fieldValue}>{startDate || 'Select date'}</AppText>
          <AppText style={bdStyles.fieldLabel}>Event Date</AppText>
        </View>
        <View style={bdStyles.chevronRight} />
      </Pressable>

      <View style={bdStyles.divider} />

      <Pressable onPress={() => setActiveModal('time')} style={bdStyles.fieldRow}>
        <View style={bdStyles.fieldIconWrap}>
          <View style={bdStyles.clockCircle} />
          <View style={bdStyles.clockHand} />
          <View style={bdStyles.clockHandMin} />
        </View>
        <View style={bdStyles.fieldTextCol}>
          <AppText style={bdStyles.fieldValue}>{startTime || 'Select time'}</AppText>
          <AppText style={bdStyles.fieldLabel}>Event Time</AppText>
        </View>
        <View style={bdStyles.chevronRight} />
      </Pressable>

      <View style={bdStyles.divider} />

      <Pressable onPress={() => setActiveModal('location')} style={bdStyles.fieldRow}>
        <View style={bdStyles.fieldIconWrap}>
          <View style={bdStyles.pinHead} />
          <View style={bdStyles.pinTail} />
        </View>
        <View style={bdStyles.fieldTextCol}>
          <AppText numberOfLines={1} style={bdStyles.fieldValue}>
            {locationValue || (locationMode === 'online' ? 'Online Event' : 'Add location')}
          </AppText>
          <AppText style={bdStyles.fieldLabel}>Offline location or virtual link</AppText>
        </View>
        <View style={bdStyles.chevronRight} />
      </Pressable>

      <View style={bdStyles.divider} />

      <Pressable onPress={() => setActiveModal('description')} style={bdStyles.fieldRow}>
        <View style={bdStyles.fieldIconWrap}>
          <View style={bdStyles.docBody} />
          <View style={bdStyles.docLine1} />
          <View style={bdStyles.docLine2} />
          <View style={bdStyles.docLine3} />
        </View>
        <View style={bdStyles.fieldTextCol}>
          <AppText style={bdStyles.fieldValue}>
            {description ? 'Description added' : 'Add Description'}
          </AppText>
          {description ? (
            <AppText numberOfLines={2} style={bdStyles.descPreview}>{description}</AppText>
          ) : (
            <AppText style={bdStyles.fieldLabel}>Tap to add event description</AppText>
          )}
        </View>
        <View style={bdStyles.chevronRight} />
      </Pressable>

      <View style={bdStyles.divider} />

      <Pressable onPress={handleSave} style={bdStyles.saveBtn}>
        <AppText style={bdStyles.saveBtnText}>Save Changes</AppText>
      </Pressable>

      <DatePickerModal
        onClose={() => setActiveModal(null)}
        onConfirm={(date) => {
          const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          setStartDate(`${date.getDate()} ${MONTHS[date.getMonth()]} ${String(date.getFullYear()).slice(2)}`);
          setActiveModal(null);
        }}
        value={parsedDate}
        visible={activeModal === 'date'}
      />
      <TimePickerModal
        onClose={() => setActiveModal(null)}
        onConfirm={(t: TimeValue) => {
          setStartTime(`${t.hour}:${t.minute} ${t.period}`);
          setActiveModal(null);
        }}
        value={timeValue}
        visible={activeModal === 'time'}
      />
      <LocationModal
        mode={locationMode}
        onClose={() => setActiveModal(null)}
        onConfirm={(mode, val) => {
          setLocationMode(mode);
          setLocationValue(val);
          setActiveModal(null);
        }}
        value={locationValue}
        visible={activeModal === 'location'}
      />
      <DescriptionModal
        onClose={() => setActiveModal(null)}
        onConfirm={(desc) => {
          setDescription(desc);
          setActiveModal(null);
        }}
        value={description}
        visible={activeModal === 'description'}
      />
    </ScrollView>
  );
}

// ─── Registration Settings ────────────────────────────────────────────────────

type RegModal = 'reg-deadline-date' | 'reg-deadline-time' | 'event-date' | 'event-time' | null;

function RegistrationSettingsContent({
  event,
  onSave,
}: {
  readonly event: LiveEvent;
  readonly onSave: (event: LiveEvent) => void;
}) {
  const [eligibleCandidates, setEligibleCandidates] = useState<EligibilityKey[]>(
    event.eligibleCandidates ? [...event.eligibleCandidates] : ['everyone']
  );
  const [regDeadlineDate, setRegDeadlineDate] = useState(event.registrationDeadlineDate ?? '');
  const [regDeadlineTime, setRegDeadlineTime] = useState(event.registrationDeadlineTime ?? '');
  const [startDate, setStartDate] = useState(event.startDate);
  const [startTime, setStartTime] = useState(event.startTime);
  const [maxAttendees, setMaxAttendees] = useState(event.maxAttendees ?? '');
  const [activeModal, setActiveModal] = useState<RegModal>(null);

  function toggleEligibility(key: EligibilityKey) {
    setEligibleCandidates((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function handleSave() {
    onSave({
      ...event,
      eligibleCandidates,
      registrationDeadlineDate: regDeadlineDate,
      registrationDeadlineTime: regDeadlineTime,
      startDate,
      startTime,
      maxAttendees,
    });
  }

  const regDeadlineParsed = parseDateStr(regDeadlineDate);
  const regDeadlineTimeVal = parseTimeStr(regDeadlineTime);
  const eventDateParsed = parseDateStr(startDate);
  const eventTimeVal = parseTimeStr(startTime);

  return (
    <ScrollView
      contentContainerStyle={rsStyles.content}
      showsVerticalScrollIndicator={false}
    >
      <AppText style={rsStyles.pageTitle}>Registration Settings</AppText>

      {/* Who Can Register */}
      <View style={rsStyles.card}>
        <AppText style={rsStyles.cardTitle}>Who Can Register</AppText>
        <AppText style={rsStyles.cardSub}>Select the type(s) of eligible candidates</AppText>
        <View style={rsStyles.cardDivider} />
        {ELIGIBILITY_OPTIONS.map((opt) => {
          const selected = eligibleCandidates.includes(opt.key);
          return (
            <Pressable
              key={opt.key}
              onPress={() => toggleEligibility(opt.key)}
              style={[rsStyles.eligibilityRow, selected ? rsStyles.eligibilityRowSelected : null]}
            >
              <View style={[rsStyles.checkbox, selected ? rsStyles.checkboxSelected : null]}>
                {selected && <View style={rsStyles.checkMark} />}
              </View>
              <View style={rsStyles.eligibilityText}>
                <AppText style={[rsStyles.eligibilityLabel, selected ? rsStyles.eligibilityLabelSelected : null]}>
                  {opt.label}
                </AppText>
                <AppText style={rsStyles.eligibilitySub}>{opt.sub}</AppText>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Registration and Schedule */}
      <View style={rsStyles.card}>
        <AppText style={rsStyles.cardTitle}>Registration and schedule</AppText>
        <AppText style={rsStyles.cardSub}>
          Set when registration closes and when the event runs. Changes autosave.
        </AppText>
        <View style={rsStyles.cardDivider} />

        {/* Registration Deadline */}
        <AppText style={rsStyles.scheduleLabel}>Registration Deadline</AppText>
        <Pressable
          onPress={() => setActiveModal('reg-deadline-date')}
          style={rsStyles.scheduleCard}
        >
          <AppText style={rsStyles.scheduleDateText}>
            {regDeadlineDate ? formatLongDate(regDeadlineDate) : 'Select date'}
          </AppText>
          <View style={rsStyles.scheduleDividerV} />
          <Pressable onPress={() => setActiveModal('reg-deadline-time')} style={rsStyles.scheduleTimeWrap}>
            <AppText style={rsStyles.scheduleTimeText}>
              {regDeadlineTime || '06:00 PM'}
            </AppText>
            <View style={rsStyles.clockIcon} />
          </Pressable>
        </Pressable>

        {/* Event Date & Time */}
        <AppText style={[rsStyles.scheduleLabel, { marginTop: 12 }]}>Event Date & Time</AppText>
        <Pressable
          onPress={() => setActiveModal('event-date')}
          style={rsStyles.scheduleCard}
        >
          <AppText style={rsStyles.scheduleDateText}>
            {startDate ? formatLongDate(startDate) : 'Select date'}
          </AppText>
          <View style={rsStyles.scheduleDividerV} />
          <Pressable onPress={() => setActiveModal('event-time')} style={rsStyles.scheduleTimeWrap}>
            <AppText style={rsStyles.scheduleTimeText}>{startTime || '10:00 AM'}</AppText>
            <View style={rsStyles.clockIcon} />
          </Pressable>
        </Pressable>
      </View>

      {/* Max Number of Users */}
      <View style={rsStyles.card}>
        <AppText style={rsStyles.cardTitle}>Max Number Of Users</AppText>
        <AppText style={rsStyles.cardSub}>Restrict registrations</AppText>
        <View style={rsStyles.cardDivider} />
        <AppText style={rsStyles.maxUsersHint}>
          Choose "No Limit" to allow unlimited registrations for this event.
        </AppText>
        <View style={rsStyles.maxUsersRow}>
          <Pressable
            onPress={() => setMaxAttendees('')}
            style={[rsStyles.noLimitBtn, maxAttendees === '' ? rsStyles.noLimitBtnActive : null]}
          >
            <AppText style={rsStyles.infinityIcon}>∞</AppText>
            <AppText style={[rsStyles.noLimitText, maxAttendees === '' ? rsStyles.noLimitTextActive : null]}>
              No Limit
            </AppText>
          </Pressable>
          <TextInput
            keyboardType="number-pad"
            onChangeText={setMaxAttendees}
            placeholder="Set limit"
            placeholderTextColor="#C3BFC4"
            style={[rsStyles.maxInput, maxAttendees !== '' ? rsStyles.maxInputActive : null]}
            value={maxAttendees}
          />
        </View>
      </View>

      <Pressable onPress={handleSave} style={bdStyles.saveBtn}>
        <AppText style={bdStyles.saveBtnText}>Save Changes</AppText>
      </Pressable>

      {/* Date/time modals */}
      <DatePickerModal
        onClose={() => setActiveModal(null)}
        onConfirm={(date) => {
          const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          const formatted = `${date.getDate()} ${MONTHS[date.getMonth()]} ${String(date.getFullYear()).slice(2)}`;
          if (activeModal === 'reg-deadline-date') setRegDeadlineDate(formatted);
          else setStartDate(formatted);
          setActiveModal(null);
        }}
        value={activeModal === 'event-date' ? eventDateParsed : regDeadlineParsed}
        visible={activeModal === 'reg-deadline-date' || activeModal === 'event-date'}
      />
      <TimePickerModal
        onClose={() => setActiveModal(null)}
        onConfirm={(t: TimeValue) => {
          const formatted = `${t.hour}:${t.minute} ${t.period}`;
          if (activeModal === 'reg-deadline-time') setRegDeadlineTime(formatted);
          else setStartTime(formatted);
          setActiveModal(null);
        }}
        value={activeModal === 'event-time' ? eventTimeVal : regDeadlineTimeVal}
        visible={activeModal === 'reg-deadline-time' || activeModal === 'event-time'}
      />
    </ScrollView>
  );
}

// ─── Prizes ───────────────────────────────────────────────────────────────────

function PrizesContent({
  event,
  onSave,
}: {
  readonly event: LiveEvent;
  readonly onSave: (event: LiveEvent) => void;
}) {
  const [prizeDescription, setPrizeDescription] = useState(event.prizeDescription ?? '');
  const [participationCertificate, setParticipationCertificate] = useState(
    event.participationCertificate ?? false
  );
  const [prizes, setPrizes] = useState<EventPrize[]>(
    event.prizes ? [...event.prizes] : []
  );
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [editingPrize, setEditingPrize] = useState<EventPrize | null>(null);
  const descExceeds = prizeDescription.length > 100;

  function handleSave() {
    if (descExceeds) return;
    onSave({ ...event, prizeDescription, participationCertificate, prizes });
  }

  function handleAddPrize(prize: EventPrize) {
    if (editingPrize) {
      setPrizes((prev) => prev.map((p) => (p.id === prize.id ? prize : p)));
    } else {
      setPrizes((prev) => [...prev, prize]);
    }
    setEditingPrize(null);
    setShowPrizeModal(false);
  }

  function handleDeletePrize(id: string) {
    setPrizes((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <ScrollView contentContainerStyle={prStyles.content} showsVerticalScrollIndicator={false}>
      <AppText style={rsStyles.pageTitle}>Prizes</AppText>

      {/* What Do Participants Receive */}
      <View style={rsStyles.card}>
        <AppText style={rsStyles.cardTitle}>What Do Participants Receive ?</AppText>
        <AppText style={rsStyles.cardSub}>
          Mention awards and prizes, perks and other important details for this opportunity.
        </AppText>
        <View style={rsStyles.cardDivider} />

        <AppText style={prStyles.inputLabel}>One liner description about prizes</AppText>
        <TextInput
          maxLength={120}
          onChangeText={setPrizeDescription}
          placeholder="Place Holder Text"
          placeholderTextColor="#C3BFC4"
          style={[prStyles.descInput, descExceeds ? prStyles.descInputError : null]}
          value={prizeDescription}
        />
        {descExceeds && (
          <View style={prStyles.errorRow}>
            <View style={prStyles.errorTriangle} />
            <AppText style={prStyles.errorText}>Cannot exceed 100 characters</AppText>
          </View>
        )}

        <AppText style={[prStyles.inputLabel, { marginTop: 16 }]}>
          Participation Certificate will be provided ?
        </AppText>
        <View style={prStyles.certRow}>
          <Pressable
            onPress={() => setParticipationCertificate(true)}
            style={[prStyles.certBtn, participationCertificate ? prStyles.certBtnInactive : null]}
          >
            <AppText style={[prStyles.certBtnText, participationCertificate ? prStyles.certBtnTextInactive : null]}>
              Yes
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => setParticipationCertificate(false)}
            style={[prStyles.certBtn, !participationCertificate ? prStyles.certBtnActive : null]}
          >
            <AppText style={[prStyles.certBtnText, !participationCertificate ? prStyles.certBtnTextActive : null]}>
              No
            </AppText>
          </Pressable>
        </View>
      </View>

      {/* Add Prizes */}
      <View style={rsStyles.card}>
        <View style={prStyles.cardHeaderRow}>
          <View>
            <AppText style={rsStyles.cardTitle}>Add Prizes</AppText>
            <AppText style={rsStyles.cardSub}>
              Create prizes and seamlessly send participation or winning certificates after your opportunity ends.
            </AppText>
          </View>
        </View>
        <View style={rsStyles.cardDivider} />
        <Pressable
          onPress={() => { setEditingPrize(null); setShowPrizeModal(true); }}
          style={prStyles.addPrizeBtn}
        >
          <AppText style={prStyles.addPrizePlus}>+</AppText>
          <AppText style={prStyles.addPrizeText}>Add New Prize</AppText>
        </Pressable>

        {prizes.map((prize) => (
          <View key={prize.id} style={prStyles.prizeRow}>
            <View style={prStyles.prizeTrophy}>
              <View style={prStyles.trophyBody} />
              <View style={prStyles.trophyBase} />
            </View>
            <View style={prStyles.prizeInfo}>
              <AppText style={prStyles.prizeTitle}>{prize.title}</AppText>
              {prize.amount !== '' && (
                <AppText style={prStyles.prizeAmount}>{prize.amount}</AppText>
              )}
            </View>
            <Pressable
              onPress={() => { setEditingPrize(prize); setShowPrizeModal(true); }}
              style={prStyles.prizeAction}
            >
              <AppText style={prStyles.prizeActionEdit}>Edit</AppText>
            </Pressable>
            <Pressable onPress={() => handleDeletePrize(prize.id)} style={prStyles.prizeAction}>
              <AppText style={prStyles.prizeActionDelete}>Delete</AppText>
            </Pressable>
          </View>
        ))}
      </View>

      <Pressable onPress={handleSave} style={bdStyles.saveBtn}>
        <AppText style={bdStyles.saveBtnText}>Save Changes</AppText>
      </Pressable>

      <PrizeFormModal
        initialPrize={editingPrize}
        onClose={() => { setShowPrizeModal(false); setEditingPrize(null); }}
        onConfirm={handleAddPrize}
        visible={showPrizeModal}
      />
    </ScrollView>
  );
}

// ─── Additional Info ──────────────────────────────────────────────────────────

function AdditionalInfoContent({
  event,
  onSave,
}: {
  readonly event: LiveEvent;
  readonly onSave: (event: LiveEvent) => void;
}) {
  const [contacts, setContacts] = useState<EventContact[]>(
    event.contacts ? [...event.contacts] : []
  );
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<EventContact | null>(null);

  function handleSaveContact(contact: EventContact) {
    let updatedContacts: EventContact[];
    if (editingContact) {
      updatedContacts = contacts.map((c) => (c.id === contact.id ? contact : c));
    } else {
      updatedContacts = [...contacts, contact];
    }
    setContacts(updatedContacts);
    setEditingContact(null);
    setShowContactModal(false);
    onSave({ ...event, contacts: updatedContacts });
  }

  function handleDeleteContact(id: string) {
    const updatedContacts = contacts.filter((c) => c.id !== id);
    setContacts(updatedContacts);
    onSave({ ...event, contacts: updatedContacts });
  }

  return (
    <ScrollView contentContainerStyle={aiStyles.content} showsVerticalScrollIndicator={false}>
      <AppText style={rsStyles.pageTitle}>Additional Info</AppText>

      {/* Contact Details */}
      <View style={rsStyles.card}>
        <View style={aiStyles.cardHeaderRow}>
          <View style={{ flex: 1 }}>
            <AppText style={rsStyles.cardTitle}>Contact Details</AppText>
            <AppText style={rsStyles.cardSub}>
              Add Contact details of key persons related to event.
            </AppText>
          </View>
          <Pressable
            onPress={() => { setEditingContact(null); setShowContactModal(true); }}
            style={aiStyles.addBtn}
          >
            <AppText style={aiStyles.addBtnText}>+ Add Contact</AppText>
          </Pressable>
        </View>
        <View style={rsStyles.cardDivider} />

        {contacts.length === 0 ? (
          <AppText style={aiStyles.emptyText}>No contacts added yet.</AppText>
        ) : (
          contacts.map((contact) => (
            <View key={contact.id} style={aiStyles.contactRow}>
              <View style={aiStyles.contactAvatar}>
                <AppText style={aiStyles.contactInitial}>
                  {contact.name.split(' ').map((w) => w.charAt(0)).join('').slice(0, 2).toUpperCase()}
                </AppText>
              </View>
              <View style={aiStyles.contactInfo}>
                <AppText style={aiStyles.contactName}>{contact.name}</AppText>
                <AppText style={aiStyles.contactMeta}>{contact.phone}</AppText>
                <AppText style={aiStyles.contactMeta}>{contact.email}</AppText>
              </View>
              <Pressable
                onPress={() => { setEditingContact(contact); setShowContactModal(true); }}
                style={aiStyles.actionBtn}
              >
                <AppText style={aiStyles.actionEdit}>Edit</AppText>
              </Pressable>
              <Pressable onPress={() => handleDeleteContact(contact.id)} style={aiStyles.actionBtn}>
                <AppText style={aiStyles.actionDelete}>Delete</AppText>
              </Pressable>
            </View>
          ))
        )}
      </View>

      {/* Attachments */}
      <View style={rsStyles.card}>
        <View style={aiStyles.cardHeaderRow}>
          <View style={{ flex: 1 }}>
            <AppText style={rsStyles.cardTitle}>Attachments</AppText>
            <AppText style={rsStyles.cardSub}>
              Upload documents relevant to the event (Rules, Brochure, etc.)
            </AppText>
          </View>
          <Pressable style={aiStyles.addBtn}>
            <AppText style={aiStyles.addBtnText}>+ Upload Document</AppText>
          </Pressable>
        </View>
        <View style={rsStyles.cardDivider} />
        <View style={aiStyles.attachmentsEmpty}>
          <AppText style={aiStyles.emptyText}>No attachments added yet.</AppText>
        </View>
      </View>

      <ContactFormModal
        initialContact={editingContact}
        onClose={() => { setShowContactModal(false); setEditingContact(null); }}
        onConfirm={handleSaveContact}
        visible={showContactModal}
      />
    </ScrollView>
  );
}

// ─── Pass Settings ────────────────────────────────────────────────────────────

function PassSettingsContent({
  event,
  onSave,
}: {
  readonly event: LiveEvent;
  readonly onSave: (event: LiveEvent) => void;
}) {
  const [passSendingMode, setPassSendingMode] = useState<PassSendingMode>(
    event.passSendingMode ?? 'immediate'
  );
  const [restrictToColleges, setRestrictToColleges] = useState(
    event.restrictToColleges ?? false
  );

  function handleSave() {
    onSave({ ...event, passSendingMode, restrictToColleges });
  }

  return (
    <ScrollView contentContainerStyle={psStyles.content} showsVerticalScrollIndicator={false}>
      <View style={rsStyles.card}>
        <AppText style={rsStyles.cardTitle}>Event Pass Settings</AppText>
        <AppText style={rsStyles.cardSub}>
          Configure how event passes are sent to participants and restrict registrations by college or email domain.
        </AppText>
        <View style={rsStyles.cardDivider} />

        <AppText style={psStyles.sectionLabel}>Pass Sending Mode</AppText>

        <Pressable
          onPress={() => setPassSendingMode('immediate')}
          style={[psStyles.radioRow, passSendingMode === 'immediate' ? psStyles.radioRowActive : null]}
        >
          <View style={[psStyles.radio, passSendingMode === 'immediate' ? psStyles.radioSelected : null]}>
            {passSendingMode === 'immediate' && <View style={psStyles.radioDot} />}
          </View>
          <AppText style={psStyles.radioLabel}>Send pass immediately after registration</AppText>
        </Pressable>

        <Pressable
          onPress={() => setPassSendingMode('after-approval')}
          style={[psStyles.radioRow, passSendingMode === 'after-approval' ? psStyles.radioRowActive : null]}
        >
          <View style={[psStyles.radio, passSendingMode === 'after-approval' ? psStyles.radioSelected : null]}>
            {passSendingMode === 'after-approval' && <View style={psStyles.radioDot} />}
          </View>
          <AppText style={psStyles.radioLabel}>Send pass after organizer approval</AppText>
        </Pressable>

        <Pressable
          onPress={() => setRestrictToColleges((v) => !v)}
          style={[psStyles.checkRow, restrictToColleges ? psStyles.checkRowActive : null]}
        >
          <View style={[psStyles.checkBox, restrictToColleges ? psStyles.checkBoxSelected : null]}>
            {restrictToColleges && <View style={psStyles.checkBoxMark} />}
          </View>
          <AppText style={psStyles.radioLabel}>Restrict registration to specific colleges</AppText>
        </Pressable>
      </View>

      <Pressable onPress={handleSave} style={bdStyles.saveBtn}>
        <AppText style={bdStyles.saveBtnText}>Save Changes</AppText>
      </Pressable>
    </ScrollView>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

interface ContactFormModalProps {
  readonly visible: boolean;
  readonly initialContact: EventContact | null;
  readonly onConfirm: (contact: EventContact) => void;
  readonly onClose: () => void;
}

function ContactFormModal({ visible, initialContact, onConfirm, onClose }: ContactFormModalProps) {
  const [name, setName] = useState(initialContact?.name ?? '');
  const [phone, setPhone] = useState(initialContact?.phone ?? '');
  const [email, setEmail] = useState(initialContact?.email ?? '');

  // Reset when modal opens
  useState(() => {
    if (visible) {
      setName(initialContact?.name ?? '');
      setPhone(initialContact?.phone ?? '');
      setEmail(initialContact?.email ?? '');
    }
  });

  if (!visible) return null;

  function handleConfirm() {
    if (!name.trim()) return;
    onConfirm({
      id: initialContact?.id ?? String(Date.now()),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
    });
  }

  return (
    <Modal onRequestClose={onClose} transparent visible={visible}>
      <View style={fmStyles.overlay}>
        <View style={fmStyles.sheet}>
          <View style={fmStyles.header}>
            <AppText style={fmStyles.headerTitle}>
              {initialContact ? 'Edit Contact' : 'Add Contact'}
            </AppText>
            <Pressable hitSlop={8} onPress={onClose} style={fmStyles.closeBtn}>
              <View style={[fmStyles.closeStroke, fmStyles.closeStroke1]} />
              <View style={[fmStyles.closeStroke, fmStyles.closeStroke2]} />
            </Pressable>
          </View>

          <View style={fmStyles.field}>
            <AppText style={fmStyles.fieldLabel}>Name *</AppText>
            <TextInput
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor="#C3BFC4"
              style={fmStyles.input}
              value={name}
            />
          </View>
          <View style={fmStyles.field}>
            <AppText style={fmStyles.fieldLabel}>Phone</AppText>
            <TextInput
              keyboardType="phone-pad"
              onChangeText={setPhone}
              placeholder="+91 00000 00000"
              placeholderTextColor="#C3BFC4"
              style={fmStyles.input}
              value={phone}
            />
          </View>
          <View style={fmStyles.field}>
            <AppText style={fmStyles.fieldLabel}>Email</AppText>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="email@example.com"
              placeholderTextColor="#C3BFC4"
              style={fmStyles.input}
              value={email}
            />
          </View>

          <Pressable onPress={handleConfirm} style={fmStyles.confirmBtn}>
            <AppText style={fmStyles.confirmBtnText}>
              {initialContact ? 'Update Contact' : 'Add Contact'}
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

interface PrizeFormModalProps {
  readonly visible: boolean;
  readonly initialPrize: EventPrize | null;
  readonly onConfirm: (prize: EventPrize) => void;
  readonly onClose: () => void;
}

function PrizeFormModal({ visible, initialPrize, onConfirm, onClose }: PrizeFormModalProps) {
  const [title, setTitle] = useState(initialPrize?.title ?? '');
  const [amount, setAmount] = useState(initialPrize?.amount ?? '');

  if (!visible) return null;

  function handleConfirm() {
    if (!title.trim()) return;
    onConfirm({
      id: initialPrize?.id ?? String(Date.now()),
      title: title.trim(),
      amount: amount.trim(),
    });
  }

  return (
    <Modal onRequestClose={onClose} transparent visible={visible}>
      <View style={fmStyles.overlay}>
        <View style={fmStyles.sheet}>
          <View style={fmStyles.header}>
            <AppText style={fmStyles.headerTitle}>
              {initialPrize ? 'Edit Prize' : 'Add New Prize'}
            </AppText>
            <Pressable hitSlop={8} onPress={onClose} style={fmStyles.closeBtn}>
              <View style={[fmStyles.closeStroke, fmStyles.closeStroke1]} />
              <View style={[fmStyles.closeStroke, fmStyles.closeStroke2]} />
            </Pressable>
          </View>

          <View style={fmStyles.field}>
            <AppText style={fmStyles.fieldLabel}>Prize Title *</AppText>
            <TextInput
              onChangeText={setTitle}
              placeholder="e.g. First Place"
              placeholderTextColor="#C3BFC4"
              style={fmStyles.input}
              value={title}
            />
          </View>
          <View style={fmStyles.field}>
            <AppText style={fmStyles.fieldLabel}>Prize Amount / Description</AppText>
            <TextInput
              onChangeText={setAmount}
              placeholder="e.g. ₹10,000 / Trophy + Certificate"
              placeholderTextColor="#C3BFC4"
              style={fmStyles.input}
              value={amount}
            />
          </View>

          <Pressable onPress={handleConfirm} style={fmStyles.confirmBtn}>
            <AppText style={fmStyles.confirmBtnText}>
              {initialPrize ? 'Update Prize' : 'Add Prize'}
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Tab Icon ─────────────────────────────────────────────────────────────────

function TabIcon({ name, active }: { readonly name: EditTab; readonly active: boolean }) {
  const color = active ? '#8359D5' : '#584D5A';
  if (name === 'preview') {
    return (
      <View style={{ alignItems: 'center', height: 14, justifyContent: 'center', width: 14 }}>
        <View style={{ borderColor: color, borderRadius: 7, borderWidth: 1.5, height: 12, width: 12 }} />
        <View style={{ backgroundColor: color, borderRadius: 1, height: 4, left: 4, position: 'absolute', top: 5, transform: [{ rotate: '45deg' }], width: 2 }} />
      </View>
    );
  }
  if (name === 'basic-details') {
    return (
      <View style={{ alignItems: 'center', height: 14, justifyContent: 'center', width: 14 }}>
        <View style={{ backgroundColor: color, borderRadius: 1, height: 1.5, marginBottom: 2, width: 12 }} />
        <View style={{ backgroundColor: color, borderRadius: 1, height: 1.5, marginBottom: 2, width: 10 }} />
        <View style={{ backgroundColor: color, borderRadius: 1, height: 1.5, width: 8 }} />
      </View>
    );
  }
  if (name === 'registration-settings') {
    return (
      <View style={{ alignItems: 'center', height: 14, justifyContent: 'center', width: 14 }}>
        <View style={{ borderColor: color, borderRadius: 7, borderWidth: 1.5, height: 12, width: 12 }} />
        <View style={{ backgroundColor: color, borderRadius: 2, height: 4, position: 'absolute', width: 4 }} />
      </View>
    );
  }
  if (name === 'prizes') {
    return (
      <View style={{ alignItems: 'center', height: 14, justifyContent: 'center', position: 'relative', width: 14 }}>
        <View style={{ borderColor: color, borderRadius: 3, borderWidth: 1.5, height: 8, position: 'absolute', top: 4, width: 10 }} />
        <View style={{ borderColor: color, borderTopLeftRadius: 3, borderTopRightRadius: 3, borderWidth: 1.5, height: 6, position: 'absolute', top: 0, width: 8 }} />
      </View>
    );
  }
  if (name === 'additional-info') {
    return (
      <View style={{ alignItems: 'center', height: 14, justifyContent: 'center', position: 'relative', width: 14 }}>
        <View style={{ borderColor: color, borderRadius: 3, borderWidth: 1.5, height: 12, width: 10 }} />
        <View style={{ backgroundColor: color, borderRadius: 1, height: 1.5, left: 4, position: 'absolute', top: 4, width: 5 }} />
        <View style={{ backgroundColor: color, borderRadius: 1, height: 1.5, left: 4, position: 'absolute', top: 7, width: 5 }} />
        <View style={{ backgroundColor: color, borderRadius: 1, height: 1.5, left: 4, position: 'absolute', top: 10, width: 3 }} />
      </View>
    );
  }
  return (
    <View style={{ alignItems: 'center', height: 14, justifyContent: 'center', position: 'relative', width: 14 }}>
      <View style={{ borderColor: color, borderRadius: 7, borderWidth: 1.5, height: 12, width: 12 }} />
      <View style={{ borderColor: color, borderRadius: 3, borderWidth: 1.5, height: 4, position: 'absolute', width: 4 }} />
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonthAbbr(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr.split(' ')[1]?.toUpperCase() ?? '';
}

function getDay(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr.split(' ')[0] ?? '';
}

function getFullDate(dateStr: string): string {
  if (!dateStr) return 'Date TBD';
  const parts = dateStr.split(' ');
  const day = parts[0];
  const month = parts[1];
  const year = parts[2] ? `20${parts[2]}` : '';
  const FULL_MONTHS: Record<string, string> = {
    Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April',
    May: 'May', Jun: 'June', Jul: 'July', Aug: 'August',
    Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December',
  };
  const fullMonth = month ? (FULL_MONTHS[month] ?? month) : '';
  return `${day} ${fullMonth} ${year}`.trim();
}

function formatLongDate(dateStr: string): string {
  if (!dateStr) return 'Select date';
  const parts = dateStr.split(' ');
  const day = parts[0];
  const month = parts[1];
  const year = parts[2] ? `20${parts[2]}` : '';
  const FULL_MONTHS: Record<string, string> = {
    Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April',
    May: 'May', Jun: 'June', Jul: 'July', Aug: 'August',
    Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December',
  };
  return `${day} ${FULL_MONTHS[month ?? ''] ?? month} ${year}`.trim();
}

function parseDateStr(dateStr: string): Date | null {
  if (!dateStr) return null;
  const MONTHS: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const parts = dateStr.split(' ');
  const day = parseInt(parts[0] ?? '1', 10);
  const month = parts[1] ? (MONTHS[parts[1]] ?? 0) : 0;
  const year = parts[2] ? 2000 + parseInt(parts[2], 10) : new Date().getFullYear();
  return new Date(year, month, day);
}

function parseTimeStr(timeStr: string): TimeValue {
  if (!timeStr) return { hour: '10', minute: '00', period: 'AM' };
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return { hour: '10', minute: '00', period: 'AM' };
  return {
    hour: match[1] ?? '10',
    minute: match[2] ?? '00',
    period: (match[3]?.toUpperCase() ?? 'AM') as 'AM' | 'PM',
  };
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { backgroundColor: '#FAFAFA', flex: 1 },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E8E6E8',
    borderBottomWidth: 1,
    flexGrow: 0,
  },
  tabBarContent: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tab: {
    alignItems: 'center',
    borderColor: '#E8E6E8',
    borderRadius: 100,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 6,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  tabActive: { backgroundColor: '#F3EEFF', borderColor: '#8359D5' },
  tabLabel: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 13, fontWeight: '500' },
  tabLabelActive: { color: '#8359D5', fontWeight: '600' },
  savedBar: {
    alignItems: 'center',
    borderBottomColor: '#E8E6E8',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  savedText: { color: '#16A34A', fontFamily: 'Urbanist', fontSize: 13, fontWeight: '600' },
  unsavedText: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 13, fontWeight: '400' },
  lastSavedText: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 12 },
  // Preview
  previewContent: { padding: 16, paddingBottom: 40 },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E6E8',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  bannerImage: { height: 180, width: '100%' },
  subTabRow: { flexDirection: 'row', gap: 24, paddingHorizontal: 16, paddingTop: 12 },
  subTab: { paddingBottom: 8 },
  subTabActive: { borderBottomColor: '#8359D5', borderBottomWidth: 2 },
  subTabLabel: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 14, fontWeight: '500' },
  subTabLabelActive: { color: '#100013', fontWeight: '600' },
  subTabDivider: { backgroundColor: '#E8E6E8', height: 1 },
  aboutSection: { gap: 20, padding: 16 },
  eventTitle: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  infoRow: { alignItems: 'center', flexDirection: 'row', gap: 16 },
  calBlock: {
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  calMonth: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
  calDay: { color: '#100013', fontFamily: 'Aeonik Pro', fontSize: 22, fontWeight: '700', lineHeight: 26 },
  infoText: { flex: 1, gap: 2 },
  infoMain: { color: '#100013', fontFamily: 'Urbanist', fontSize: 16, fontWeight: '600' },
  infoSub: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 13 },
  locationIconWrap: {
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    position: 'relative',
    width: 44,
  },
  locationPinHead: { borderColor: '#8359D5', borderRadius: 8, borderWidth: 1.5, height: 14, width: 14 },
  locationPinTail: { backgroundColor: '#8359D5', borderRadius: 1, height: 7, marginTop: -2, width: 2 },
  registrationCard: { backgroundColor: '#F5F3FF', borderRadius: 12, gap: 10, padding: 16 },
  registrationTitle: { color: '#100013', fontFamily: 'Aeonik Pro', fontSize: 16, fontWeight: '600' },
  registrationDivider: { backgroundColor: '#DDD6FE', height: 1 },
  registrationPrompt: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 13 },
  ticketOption: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#8359D5',
    borderRadius: 10,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
  },
  ticketLabel: { color: '#100013', fontFamily: 'Urbanist', fontSize: 15, fontWeight: '600' },
  ticketCheck: {
    alignItems: 'center',
    backgroundColor: '#8359D5',
    borderRadius: 20,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  ticketCheckMark: {
    borderBottomColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderLeftColor: '#FFFFFF',
    borderLeftWidth: 2,
    height: 7,
    marginTop: -3,
    transform: [{ rotate: '-45deg' }],
    width: 11,
  },
  sectionHeading: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  descriptionText: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 14, lineHeight: 22 },
  descriptionEmpty: { color: '#C3BFC4', fontFamily: 'Urbanist', fontSize: 14 },
  contactSection: { gap: 16, padding: 16 },
  contactCard: {
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 14,
    padding: 14,
  },
  contactAvatar: {
    alignItems: 'center',
    backgroundColor: '#6949AA',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  contactInitial: { color: '#FFFFFF', fontFamily: 'Aeonik Pro', fontSize: 18, fontWeight: '700' },
  contactInfo: { flex: 1, gap: 2 },
  contactName: { color: '#100013', fontFamily: 'Urbanist', fontSize: 15, fontWeight: '700' },
  contactMeta: { color: '#7C737E', fontFamily: 'Urbanist', fontSize: 12 },
  placeholder: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  placeholderText: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 15 },
});

// Basic Details styles
const bdStyles = StyleSheet.create({
  content: { paddingBottom: 48 },
  bannerWrap: { position: 'relative' },
  banner: { height: 160, width: '100%' },
  changeBannerBtn: {
    backgroundColor: 'rgba(12,1,20,0.55)',
    borderRadius: 8,
    bottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    position: 'absolute',
    right: 12,
  },
  changeBannerText: { color: '#FFFFFF', fontFamily: 'Urbanist', fontSize: 12, fontWeight: '600' },
  fieldGroup: { gap: 4, paddingHorizontal: 16, paddingVertical: 16 },
  titleInput: { color: '#100013', fontFamily: 'Aeonik Pro', fontSize: 24, fontWeight: '700', padding: 0 },
  fieldHint: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 12 },
  divider: { backgroundColor: '#F0EEF0', height: 1, marginHorizontal: 16 },
  fieldRow: { alignItems: 'center', flexDirection: 'row', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  fieldIconWrap: {
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    flexShrink: 0,
    height: 44,
    justifyContent: 'center',
    position: 'relative',
    width: 44,
  },
  calIcon: { borderColor: '#8359D5', borderRadius: 4, borderWidth: 1.5, height: 14, width: 14 },
  calPage: { backgroundColor: '#8359D5', borderRadius: 1, height: 4, position: 'absolute', top: 12, width: 14 },
  clockCircle: { borderColor: '#8359D5', borderRadius: 8, borderWidth: 1.5, height: 14, position: 'absolute', width: 14 },
  clockHand: { backgroundColor: '#8359D5', borderRadius: 1, height: 5, position: 'absolute', top: 17, width: 1.5 },
  clockHandMin: { backgroundColor: '#8359D5', borderRadius: 1, height: 4, position: 'absolute', right: 19, top: 19, transform: [{ rotate: '60deg' }], width: 1.5 },
  pinHead: { borderColor: '#8359D5', borderRadius: 8, borderWidth: 1.5, height: 14, position: 'absolute', top: 12, width: 14 },
  pinTail: { backgroundColor: '#8359D5', borderRadius: 1, bottom: 11, height: 6, position: 'absolute', width: 2 },
  docBody: { borderColor: '#8359D5', borderRadius: 3, borderWidth: 1.5, height: 16, position: 'absolute', width: 12 },
  docLine1: { backgroundColor: '#8359D5', borderRadius: 1, height: 1.5, position: 'absolute', top: 16, width: 7 },
  docLine2: { backgroundColor: '#8359D5', borderRadius: 1, height: 1.5, position: 'absolute', top: 20, width: 7 },
  docLine3: { backgroundColor: '#8359D5', borderRadius: 1, height: 1.5, position: 'absolute', top: 24, width: 5 },
  fieldTextCol: { flex: 1, gap: 2 },
  fieldValue: { color: '#100013', fontFamily: 'Urbanist', fontSize: 15, fontWeight: '600' },
  fieldLabel: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 12 },
  descPreview: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 12, lineHeight: 18 },
  chevronRight: {
    borderColor: '#C3BFC4',
    borderRightWidth: 2,
    borderTopWidth: 2,
    flexShrink: 0,
    height: 10,
    transform: [{ rotate: '45deg' }],
    width: 10,
  },
  saveBtn: {
    alignItems: 'center',
    backgroundColor: '#42007A',
    borderRadius: 14,
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 28,
    paddingVertical: 16,
  },
  saveBtnText: { color: '#FFFFFF', fontFamily: 'Urbanist', fontSize: 16, fontWeight: '700' },
});

// Registration Settings styles
const rsStyles = StyleSheet.create({
  content: { gap: 16, padding: 16, paddingBottom: 48 },
  pageTitle: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E6E8',
    borderRadius: 16,
    borderWidth: 1,
    gap: 0,
    overflow: 'hidden',
    padding: 16,
  },
  cardTitle: { color: '#100013', fontFamily: 'Aeonik Pro', fontSize: 18, fontWeight: '600', marginBottom: 4 },
  cardSub: { color: '#8359D5', fontFamily: 'Urbanist', fontSize: 13, lineHeight: 18, marginBottom: 12 },
  cardDivider: { backgroundColor: '#F0EEF0', height: 1, marginBottom: 16 },
  eligibilityRow: {
    alignItems: 'center',
    borderColor: '#E8E6E8',
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 10,
    padding: 14,
  },
  eligibilityRowSelected: { backgroundColor: '#F3EEFF', borderColor: '#8359D5' },
  checkbox: {
    alignItems: 'center',
    borderColor: '#C3BFC4',
    borderRadius: 12,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkboxSelected: { backgroundColor: '#8359D5', borderColor: '#8359D5' },
  checkMark: {
    borderBottomColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderLeftColor: '#FFFFFF',
    borderLeftWidth: 2,
    height: 6,
    marginTop: -2,
    transform: [{ rotate: '-45deg' }],
    width: 10,
  },
  eligibilityText: { flex: 1, gap: 2 },
  eligibilityLabel: { color: '#100013', fontFamily: 'Urbanist', fontSize: 15, fontWeight: '600' },
  eligibilityLabelSelected: { color: '#42007A' },
  eligibilitySub: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 12 },
  scheduleLabel: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 12, fontWeight: '500', marginBottom: 6 },
  scheduleCard: {
    alignItems: 'center',
    backgroundColor: '#EDE9FF',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  scheduleDateText: {
    color: '#100013',
    flex: 1,
    fontFamily: 'Urbanist',
    fontSize: 18,
    fontWeight: '700',
  },
  scheduleDividerV: { backgroundColor: '#C4B5FD', height: 24, marginHorizontal: 14, width: 1 },
  scheduleTimeWrap: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  scheduleTimeText: { color: '#8359D5', fontFamily: 'Urbanist', fontSize: 16, fontWeight: '600' },
  clockIcon: {
    borderColor: '#8359D5',
    borderRadius: 8,
    borderWidth: 1.5,
    height: 16,
    width: 16,
  },
  maxUsersHint: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 13, lineHeight: 20, marginBottom: 12 },
  maxUsersRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  noLimitBtn: {
    alignItems: 'center',
    borderColor: '#E8E6E8',
    borderRadius: 100,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  noLimitBtnActive: { borderColor: '#8359D5' },
  infinityIcon: { color: '#8359D5', fontSize: 16 },
  noLimitText: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 14, fontWeight: '600' },
  noLimitTextActive: { color: '#8359D5' },
  maxInput: {
    borderColor: '#E8E6E8',
    borderRadius: 10,
    borderWidth: 1.5,
    color: '#100013',
    flex: 1,
    fontFamily: 'Urbanist',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  maxInputActive: { borderColor: '#8359D5' },
});

// Prizes styles
const prStyles = StyleSheet.create({
  content: { gap: 16, padding: 16, paddingBottom: 48 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  inputLabel: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 13, marginBottom: 8 },
  descInput: {
    borderColor: '#E8E6E8',
    borderRadius: 10,
    borderWidth: 1.5,
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 14,
    marginBottom: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  descInputError: { borderColor: '#EF4444' },
  errorRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginBottom: 4 },
  errorTriangle: {
    borderBottomColor: '#EF4444',
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderLeftWidth: 5,
    borderRightColor: 'transparent',
    borderRightWidth: 5,
    height: 0,
    width: 0,
  },
  errorText: { color: '#EF4444', fontFamily: 'Urbanist', fontSize: 12 },
  certRow: { flexDirection: 'row', gap: 10 },
  certBtn: {
    borderColor: '#E8E6E8',
    borderRadius: 100,
    borderWidth: 1.5,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  certBtnActive: { backgroundColor: '#8359D5', borderColor: '#8359D5' },
  certBtnInactive: { borderColor: '#E8E6E8' },
  certBtnText: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 14, fontWeight: '600' },
  certBtnTextActive: { color: '#FFFFFF' },
  certBtnTextInactive: { color: '#584D5A' },
  addPrizeBtn: {
    alignItems: 'center',
    borderColor: '#8359D5',
    borderRadius: 100,
    borderWidth: 1.5,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
  },
  addPrizePlus: { color: '#8359D5', fontSize: 16, fontWeight: '700' },
  addPrizeText: { color: '#8359D5', fontFamily: 'Urbanist', fontSize: 13, fontWeight: '600' },
  prizeRow: {
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
    padding: 12,
  },
  prizeTrophy: { alignItems: 'center', height: 32, justifyContent: 'center', width: 24 },
  trophyBody: {
    borderColor: '#8359D5',
    borderRadius: 6,
    borderWidth: 1.5,
    height: 18,
    width: 18,
  },
  trophyBase: {
    backgroundColor: '#8359D5',
    borderRadius: 2,
    height: 4,
    marginTop: -1,
    width: 14,
  },
  prizeInfo: { flex: 1, gap: 2 },
  prizeTitle: { color: '#100013', fontFamily: 'Urbanist', fontSize: 14, fontWeight: '700' },
  prizeAmount: { color: '#8359D5', fontFamily: 'Urbanist', fontSize: 12 },
  prizeAction: { paddingHorizontal: 6, paddingVertical: 4 },
  prizeActionEdit: { color: '#8359D5', fontFamily: 'Urbanist', fontSize: 13, fontWeight: '600' },
  prizeActionDelete: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 13 },
});

// Additional Info styles
const aiStyles = StyleSheet.create({
  content: { gap: 16, padding: 16, paddingBottom: 48 },
  cardHeaderRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addBtn: {
    borderColor: '#8359D5',
    borderRadius: 100,
    borderWidth: 1.5,
    flexShrink: 0,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: { color: '#8359D5', fontFamily: 'Urbanist', fontSize: 12, fontWeight: '600' },
  emptyText: { color: '#C3BFC4', fontFamily: 'Urbanist', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
  contactRow: {
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
    padding: 12,
  },
  contactAvatar: {
    alignItems: 'center',
    backgroundColor: '#6949AA',
    borderRadius: 24,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  contactInitial: { color: '#FFFFFF', fontFamily: 'Aeonik Pro', fontSize: 14, fontWeight: '700' },
  contactInfo: { flex: 1, gap: 1 },
  contactName: { color: '#100013', fontFamily: 'Urbanist', fontSize: 14, fontWeight: '700' },
  contactMeta: { color: '#7C737E', fontFamily: 'Urbanist', fontSize: 11 },
  actionBtn: { paddingHorizontal: 4, paddingVertical: 4 },
  actionEdit: { color: '#8359D5', fontFamily: 'Urbanist', fontSize: 13, fontWeight: '600' },
  actionDelete: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 13 },
  attachmentsEmpty: {
    alignItems: 'center',
    borderColor: '#E8E6E8',
    borderRadius: 10,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    paddingVertical: 20,
  },
});

// Pass Settings styles
const psStyles = StyleSheet.create({
  content: { gap: 16, padding: 16, paddingBottom: 48 },
  sectionLabel: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  radioRow: {
    alignItems: 'center',
    borderColor: '#E8E6E8',
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
    padding: 14,
  },
  radioRowActive: { borderColor: '#8359D5' },
  radio: {
    alignItems: 'center',
    borderColor: '#C3BFC4',
    borderRadius: 12,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  radioSelected: { borderColor: '#8359D5' },
  radioDot: { backgroundColor: '#8359D5', borderRadius: 6, height: 12, width: 12 },
  radioLabel: { color: '#100013', flex: 1, fontFamily: 'Urbanist', fontSize: 14, fontWeight: '500' },
  checkRow: {
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderColor: '#E8E6E8',
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    padding: 14,
  },
  checkRowActive: { borderColor: '#8359D5' },
  checkBox: {
    alignItems: 'center',
    borderColor: '#C3BFC4',
    borderRadius: 4,
    borderWidth: 1.5,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  checkBoxSelected: { backgroundColor: '#8359D5', borderColor: '#8359D5' },
  checkBoxMark: {
    borderBottomColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderLeftColor: '#FFFFFF',
    borderLeftWidth: 2,
    height: 5,
    marginTop: -2,
    transform: [{ rotate: '-45deg' }],
    width: 9,
  },
});

// Form modal styles
const fmStyles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(12,1,20,0.4)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 20,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: { color: '#100013', fontFamily: 'Aeonik Pro', fontSize: 18, fontWeight: '700' },
  closeBtn: { alignItems: 'center', height: 28, justifyContent: 'center', width: 28 },
  closeStroke: { backgroundColor: '#584D5A', borderRadius: 2, height: 2, position: 'absolute', width: 14 },
  closeStroke1: { transform: [{ rotate: '45deg' }] },
  closeStroke2: { transform: [{ rotate: '-45deg' }] },
  field: { gap: 6, marginBottom: 14 },
  fieldLabel: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 13, fontWeight: '500' },
  input: {
    borderColor: '#E8E6E8',
    borderRadius: 10,
    borderWidth: 1.5,
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  confirmBtn: {
    alignItems: 'center',
    backgroundColor: '#42007A',
    borderRadius: 14,
    marginTop: 8,
    paddingVertical: 16,
  },
  confirmBtnText: { color: '#FFFFFF', fontFamily: 'Urbanist', fontSize: 16, fontWeight: '700' },
});
