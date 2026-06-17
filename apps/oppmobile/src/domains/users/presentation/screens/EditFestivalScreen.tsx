import * as ImagePicker from 'expo-image-picker';
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

import subtractPlaceholder from '../../../../assets/Subtract.png';
import { AppText, RegistrationSettingsPanel } from '../../../../shared/ui';
import { type LiveFestival } from './FestivalDetailScreen';
import {
  DatePickerModal,
  DescriptionModal,
  LocationModal,
  TimePickerModal,
  type LocationMode,
  type TimeValue,
} from './FestivalFormModals';

type EditTab =
  | 'preview'
  | 'basic-details'
  | 'registration-settings'
  | 'prizes'
  | 'additional-info'
  | 'pass-settings';

const EDIT_TABS: { key: EditTab; label: string }[] = [
  { key: 'preview', label: 'Preview' },
  { key: 'basic-details', label: 'Basic Details' },
  { key: 'registration-settings', label: 'Registration Settings' },
  { key: 'prizes', label: 'Prizes' },
  { key: 'additional-info', label: 'Additional Info' },
  { key: 'pass-settings', label: 'Pass Settings' },
];

type EligibilityKey = 'everyone' | 'school' | 'college' | 'freshers' | 'professionals';
type PassSendingMode = 'immediate' | 'after-approval';

interface FestivalContact {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly email: string;
}

interface FestivalPrize {
  readonly id: string;
  readonly title: string;
  readonly amount: string;
}

const ELIGIBILITY_OPTIONS: { key: EligibilityKey; label: string; sub: string }[] = [
  { key: 'everyone', label: 'Everyone can apply', sub: 'All Applicants' },
  { key: 'school', label: 'School students', sub: 'Up to grade 12' },
  { key: 'college', label: 'College students', sub: 'UG / PG Students' },
  { key: 'freshers', label: 'Freshers', sub: '0-1 Year Experience' },
  { key: 'professionals', label: 'Professionals', sub: '1+ Year Experience' },
];

interface EditFestivalScreenProps {
  readonly festival: LiveFestival;
  readonly mode?: 'edit' | 'create';
  readonly onUpdateFestival?: (festival: LiveFestival) => void;
  readonly onCreateFestival?: (festival: LiveFestival) => void;
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

export function EditFestivalScreen({ festival, mode = 'edit', onUpdateFestival, onCreateFestival }: EditFestivalScreenProps) {
  const [activeTab, setActiveTab] = useState<EditTab>('preview');
  const [savedTime, setSavedTime] = useState<string | null>(null);

  function handleSave(updatedFestival: LiveFestival) {
    if (onUpdateFestival) onUpdateFestival(updatedFestival);
    setSavedTime(formatCurrentTime());
  }

  return (
    <View style={styles.screen}>
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

      {/* Saved status bar or Create Button */}
      {mode === 'create' ? (
        <View style={styles.savedBar}>
          <AppText style={styles.unsavedText}>Draft Festival</AppText>
          <Pressable
            onPress={() => onCreateFestival && onCreateFestival(festival)}
            style={{ backgroundColor: '#392160', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100 }}
          >
            <AppText style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Host Festival</AppText>
          </Pressable>
        </View>
      ) : (
        <View style={styles.savedBar}>
          <AppText style={savedTime !== null ? styles.savedText : styles.unsavedText}>
            {savedTime !== null ? 'Saved' : 'Unsaved'}
          </AppText>
          {savedTime !== null && (
            <AppText style={styles.lastSavedText}>Last saved: {savedTime}</AppText>
          )}
        </View>
      )}

      {activeTab === 'preview' ? (
        <PreviewContent festival={festival} />
      ) : activeTab === 'basic-details' ? (
        <BasicDetailsContent festival={festival} onSave={handleSave} />
      ) : activeTab === 'registration-settings' ? (
        <RegistrationSettingsPanel
          eligibleCandidates={festival.eligibleCandidates || ['everyone']}
          maxAttendees={festival.maxAttendees || ''}
          onChange={(updates) => handleSave({ ...festival, ...updates })}
          onSave={() => handleSave(festival)}
          {...(festival.additionalQuestions !== undefined ? { additionalQuestions: festival.additionalQuestions } : {})}
          {...(festival.registrationDeadlineDate !== undefined ? { registrationDeadlineDate: festival.registrationDeadlineDate } : {})}
          {...(festival.registrationDeadlineTime !== undefined ? { registrationDeadlineTime: festival.registrationDeadlineTime } : {})}
          {...(festival.registrationStartDate !== undefined ? { registrationStartDate: festival.registrationStartDate } : {})}
          {...(festival.registrationStartTime !== undefined ? { registrationStartTime: festival.registrationStartTime } : {})}
        />
      ) : activeTab === 'prizes' ? (
        <PrizesContent festival={festival} onSave={handleSave} />
      ) : activeTab === 'additional-info' ? (
        <AdditionalInfoContent festival={festival} onSave={handleSave} />
      ) : activeTab === 'pass-settings' ? (
        <PassSettingsContent festival={festival} onSave={handleSave} />
      ) : null}
    </View>
  );
}

// ─── Preview ──────────────────────────────────────────────────────────────────

function PreviewContent({ festival }: { readonly festival: LiveFestival }) {
  return (
    <ScrollView contentContainerStyle={styles.previewContent} showsVerticalScrollIndicator={false}>
      <View style={styles.eventCard}>
        <View style={styles.bannerPlaceholder}>
          <AppText style={styles.bannerPlaceholderText}>FESTIVAL BANNER</AppText>
        </View>

        <View style={styles.aboutSection}>
          <AppText style={styles.eventTitle}>{festival.title.toUpperCase()}</AppText>

          <View style={styles.infoRow}>
            <View style={styles.tagBadge}>
              <AppText style={styles.tagBadgeText}>{festival.typeLabel}</AppText>
            </View>
            <View style={styles.statusBadge}>
              <AppText style={styles.statusBadgeText}>{festival.statusLabel}</AppText>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <AppText style={styles.statValue}>{festival.candidatesLabel}</AppText>
            </View>
            <View style={styles.statItem}>
              <AppText style={styles.statValue}>{festival.eventsLabel}</AppText>
            </View>
            <View style={styles.statItem}>
              <AppText style={styles.statValue}>{festival.competitionsLabel}</AppText>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Basic Details ────────────────────────────────────────────────────────────

function BasicDetailsContent({
  festival,
  onSave,
}: {
  readonly festival: LiveFestival;
  readonly onSave: (festival: LiveFestival) => void;
}) {
  const [title, setTitle] = useState(festival.title);
  const [imageUrl, setImageUrl] = useState(festival.imageUrl ?? null);

  const [activeModal, setActiveModal] = useState<'date' | 'time' | 'location' | 'description' | null>(null);
  
  // Initialize state from festival data
  const [startDate, setStartDate] = useState(festival.startDate || '');
  const [startTime, setStartTime] = useState(festival.startTime || '');
  const [locationMode, setLocationMode] = useState<LocationMode>(festival.locationMode || 'online');
  const [locationValue, setLocationValue] = useState(festival.locationValue || '');
  const [description, setDescription] = useState(festival.description || '');

  const parsedDate = startDate ? new Date(startDate) : new Date();
  const timeValue: TimeValue = startTime
    ? {
        hour: startTime.split(':')[0] || '10',
        minute: startTime.split(':')[1]?.split(' ')[0] || '00',
        period: startTime.includes('PM') ? 'PM' : 'AM',
      }
    : { hour: '10', minute: '00', period: 'AM' };

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0 && result.assets[0]?.uri) {
      setImageUrl(result.assets[0].uri);
    }
  }

  function handleSave() {
    onSave({
      ...festival,
      title,
      imageUrl,
      startDate,
      startTime,
      locationMode,
      locationValue,
      description,
    });
  }

  return (
    <ScrollView
      contentContainerStyle={bdStyles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={bdStyles.bannerWrap}>
        {imageUrl ? (
          <Image resizeMode="cover" source={{ uri: imageUrl }} style={bdStyles.bannerPlaceholder} />
        ) : (
          <View style={bdStyles.bannerPlaceholder}>
            <AppText style={bdStyles.bannerPlaceholderText}>FESTIVAL BANNER</AppText>
          </View>
        )}
        <Pressable onPress={pickImage} style={bdStyles.changeBannerBtn}>
          <AppText style={bdStyles.changeBannerText}>{imageUrl ? 'Change Banner' : 'Add Banner'}</AppText>
        </Pressable>
      </View>

      <View style={bdStyles.fieldGroup}>
        <TextInput
          onChangeText={setTitle}
          placeholder="Festival Name"
          placeholderTextColor="#C3BFC4"
          style={bdStyles.titleInput}
          value={title}
        />
        <AppText style={bdStyles.fieldHint}>Enter the name of your festival</AppText>
      </View>

      <View style={bdStyles.divider} />

      <Pressable onPress={() => setActiveModal('date')} style={bdStyles.fieldRow}>
        <View style={bdStyles.fieldIconWrap}>
          <View style={bdStyles.calIcon} />
          <View style={bdStyles.calPage} />
        </View>
        <View style={bdStyles.fieldTextCol}>
          <AppText style={bdStyles.fieldValue}>{startDate || 'Select date'}</AppText>
          <AppText style={bdStyles.fieldLabel}>Festival Start Date</AppText>
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
          <AppText style={bdStyles.fieldLabel}>Festival Start Time</AppText>
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
            {locationValue || 'Add location'}
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
          <AppText numberOfLines={1} style={bdStyles.fieldValue}>
            {description || 'Add Description'}
          </AppText>
          <AppText style={bdStyles.fieldLabel}>Tap to add festival description</AppText>
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

function RegistrationSettingsContent({
  festival,
  onSave,
}: {
  readonly festival: LiveFestival;
  readonly onSave: (festival: LiveFestival) => void;
}) {
  const [eligibleCandidates, setEligibleCandidates] = useState<EligibilityKey[]>(['everyone']);
  const [maxAttendees, setMaxAttendees] = useState('');

  function toggleEligibility(key: EligibilityKey) {
    setEligibleCandidates((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  return (
    <ScrollView contentContainerStyle={rsStyles.content} showsVerticalScrollIndicator={false}>
      <AppText style={rsStyles.pageTitle}>Registration Settings</AppText>

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

      <View style={rsStyles.card}>
        <AppText style={rsStyles.cardTitle}>Max Number Of Attendees</AppText>
        <AppText style={rsStyles.cardSub}>Restrict registrations</AppText>
        <View style={rsStyles.cardDivider} />
        <AppText style={rsStyles.maxUsersHint}>
          Choose "No Limit" to allow unlimited registrations for this festival.
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

      <Pressable onPress={() => onSave(festival)} style={bdStyles.saveBtn}>
        <AppText style={bdStyles.saveBtnText}>Save Changes</AppText>
      </Pressable>
    </ScrollView>
  );
}

// ─── Prizes ───────────────────────────────────────────────────────────────────

function PrizesContent({
  festival,
  onSave,
}: {
  readonly festival: LiveFestival;
  readonly onSave: (festival: LiveFestival) => void;
}) {
  const [prizeDescription, setPrizeDescription] = useState('');
  const [participationCertificate, setParticipationCertificate] = useState(false);
  const [prizes, setPrizes] = useState<FestivalPrize[]>([]);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [editingPrize, setEditingPrize] = useState<FestivalPrize | null>(null);
  const descExceeds = prizeDescription.length > 100;

  function handleAddPrize(prize: FestivalPrize) {
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

      <View style={rsStyles.card}>
        <AppText style={rsStyles.cardTitle}>What Do Participants Receive?</AppText>
        <AppText style={rsStyles.cardSub}>
          Mention awards and prizes, perks and other important details for this festival.
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
          Participation Certificate will be provided?
        </AppText>
        <View style={prStyles.certRow}>
          <Pressable
            onPress={() => setParticipationCertificate(true)}
            style={[prStyles.certBtn, participationCertificate ? prStyles.certBtnActive : null]}
          >
            <AppText style={[prStyles.certBtnText, participationCertificate ? prStyles.certBtnTextActive : null]}>
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

      <View style={rsStyles.card}>
        <AppText style={rsStyles.cardTitle}>Add Prizes</AppText>
        <AppText style={rsStyles.cardSub}>
          Create prizes and seamlessly send participation or winning certificates after your festival ends.
        </AppText>
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

      <Pressable onPress={() => onSave(festival)} style={bdStyles.saveBtn}>
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
  festival,
  onSave,
}: {
  readonly festival: LiveFestival;
  readonly onSave: (festival: LiveFestival) => void;
}) {
  const [contacts, setContacts] = useState<FestivalContact[]>([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<FestivalContact | null>(null);

  function handleSaveContact(contact: FestivalContact) {
    const updatedContacts = editingContact
      ? contacts.map((c) => (c.id === contact.id ? contact : c))
      : [...contacts, contact];
    setContacts(updatedContacts);
    setEditingContact(null);
    setShowContactModal(false);
    onSave(festival);
  }

  function handleDeleteContact(id: string) {
    setContacts(contacts.filter((c) => c.id !== id));
    onSave(festival);
  }

  return (
    <ScrollView contentContainerStyle={aiStyles.content} showsVerticalScrollIndicator={false}>
      <AppText style={rsStyles.pageTitle}>Additional Info</AppText>

      <View style={rsStyles.card}>
        <View style={aiStyles.cardHeaderRow}>
          <View style={{ flex: 1 }}>
            <AppText style={rsStyles.cardTitle}>Contact Details</AppText>
            <AppText style={rsStyles.cardSub}>
              Add Contact details of key persons related to festival.
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

      <View style={rsStyles.card}>
        <View style={aiStyles.cardHeaderRow}>
          <View style={{ flex: 1 }}>
            <AppText style={rsStyles.cardTitle}>Attachments</AppText>
            <AppText style={rsStyles.cardSub}>
              Upload documents relevant to the festival (Rules, Brochure, etc.)
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
  festival,
  onSave,
}: {
  readonly festival: LiveFestival;
  readonly onSave: (festival: LiveFestival) => void;
}) {
  const [passSendingMode, setPassSendingMode] = useState<PassSendingMode>('immediate');
  const [restrictToColleges, setRestrictToColleges] = useState(false);

  return (
    <ScrollView contentContainerStyle={psStyles.content} showsVerticalScrollIndicator={false}>
      <View style={rsStyles.card}>
        <AppText style={rsStyles.cardTitle}>Festival Pass Settings</AppText>
        <AppText style={rsStyles.cardSub}>
          Configure how festival passes are sent to participants and restrict registrations by college or email domain.
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

      <Pressable onPress={() => onSave(festival)} style={bdStyles.saveBtn}>
        <AppText style={bdStyles.saveBtnText}>Save Changes</AppText>
      </Pressable>
    </ScrollView>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

interface ContactFormModalProps {
  readonly visible: boolean;
  readonly initialContact: FestivalContact | null;
  readonly onConfirm: (contact: FestivalContact) => void;
  readonly onClose: () => void;
}

function ContactFormModal({ visible, initialContact, onConfirm, onClose }: ContactFormModalProps) {
  const [name, setName] = useState(initialContact?.name ?? '');
  const [phone, setPhone] = useState(initialContact?.phone ?? '');
  const [email, setEmail] = useState(initialContact?.email ?? '');

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
            <TextInput onChangeText={setName} placeholder="Full name" placeholderTextColor="#C3BFC4" style={fmStyles.input} value={name} />
          </View>
          <View style={fmStyles.field}>
            <AppText style={fmStyles.fieldLabel}>Phone</AppText>
            <TextInput keyboardType="phone-pad" onChangeText={setPhone} placeholder="+91 00000 00000" placeholderTextColor="#C3BFC4" style={fmStyles.input} value={phone} />
          </View>
          <View style={fmStyles.field}>
            <AppText style={fmStyles.fieldLabel}>Email</AppText>
            <TextInput autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} placeholder="email@example.com" placeholderTextColor="#C3BFC4" style={fmStyles.input} value={email} />
          </View>
          <Pressable onPress={handleConfirm} style={fmStyles.confirmBtn}>
            <AppText style={fmStyles.confirmBtnText}>{initialContact ? 'Update Contact' : 'Add Contact'}</AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

interface PrizeFormModalProps {
  readonly visible: boolean;
  readonly initialPrize: FestivalPrize | null;
  readonly onConfirm: (prize: FestivalPrize) => void;
  readonly onClose: () => void;
}

function PrizeFormModal({ visible, initialPrize, onConfirm, onClose }: PrizeFormModalProps) {
  const [title, setTitle] = useState(initialPrize?.title ?? '');
  const [amount, setAmount] = useState(initialPrize?.amount ?? '');

  if (!visible) return null;

  function handleConfirm() {
    if (!title.trim()) return;
    onConfirm({ id: initialPrize?.id ?? String(Date.now()), title: title.trim(), amount: amount.trim() });
  }

  return (
    <Modal onRequestClose={onClose} transparent visible={visible}>
      <View style={fmStyles.overlay}>
        <View style={fmStyles.sheet}>
          <View style={fmStyles.header}>
            <AppText style={fmStyles.headerTitle}>{initialPrize ? 'Edit Prize' : 'Add New Prize'}</AppText>
            <Pressable hitSlop={8} onPress={onClose} style={fmStyles.closeBtn}>
              <View style={[fmStyles.closeStroke, fmStyles.closeStroke1]} />
              <View style={[fmStyles.closeStroke, fmStyles.closeStroke2]} />
            </Pressable>
          </View>
          <View style={fmStyles.field}>
            <AppText style={fmStyles.fieldLabel}>Prize Title *</AppText>
            <TextInput onChangeText={setTitle} placeholder="e.g. First Place" placeholderTextColor="#C3BFC4" style={fmStyles.input} value={title} />
          </View>
          <View style={fmStyles.field}>
            <AppText style={fmStyles.fieldLabel}>Prize Amount / Description</AppText>
            <TextInput onChangeText={setAmount} placeholder="e.g. ₹10,000 / Trophy + Certificate" placeholderTextColor="#C3BFC4" style={fmStyles.input} value={amount} />
          </View>
          <Pressable onPress={handleConfirm} style={fmStyles.confirmBtn}>
            <AppText style={fmStyles.confirmBtnText}>{initialPrize ? 'Update Prize' : 'Add Prize'}</AppText>
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { backgroundColor: '#FAFAFA', flex: 1 },
  tabBar: { backgroundColor: '#FFFFFF', borderBottomColor: '#E8E6E8', borderBottomWidth: 1, flexGrow: 0 },
  tabBarContent: { alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  tab: { alignItems: 'center', borderColor: '#E8E6E8', borderRadius: 100, borderWidth: 1.5, flexDirection: 'row', gap: 6, height: 36, justifyContent: 'center', paddingHorizontal: 14 },
  tabActive: { backgroundColor: '#F3EEFF', borderColor: '#8359D5' },
  tabLabel: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 13, fontWeight: '500' },
  tabLabelActive: { color: '#8359D5', fontWeight: '600' },
  savedBar: { alignItems: 'center', borderBottomColor: '#E8E6E8', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8 },
  savedText: { color: '#16A34A', fontFamily: 'Urbanist', fontSize: 13, fontWeight: '600' },
  unsavedText: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 13, fontWeight: '400' },
  lastSavedText: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 12 },
  previewContent: { padding: 16, paddingBottom: 40 },
  eventCard: { backgroundColor: '#FFFFFF', borderColor: '#E8E6E8', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  bannerPlaceholder: { alignItems: 'center', backgroundColor: '#14082A', height: 180, justifyContent: 'center', width: '100%' },
  bannerPlaceholderText: { color: 'rgba(255,255,255,0.4)', fontFamily: 'Aeonik Pro', fontSize: 18, fontWeight: '700', letterSpacing: 4 },
  aboutSection: { gap: 12, padding: 16 },
  eventTitle: { color: '#100013', fontFamily: 'Aeonik Pro', fontSize: 24, fontWeight: '700', lineHeight: 30 },
  infoRow: { flexDirection: 'row', gap: 8 },
  tagBadge: { backgroundColor: '#EDEDED', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  tagBadgeText: { color: '#342636', fontFamily: 'Urbanist', fontSize: 12, fontWeight: '500' },
  statusBadge: { backgroundColor: '#93D7D0', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  statusBadgeText: { color: '#007569', fontFamily: 'Urbanist', fontSize: 12, fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: 12 },
  statItem: { flex: 1 },
  statValue: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 12, fontWeight: '500' },
});

const bdStyles = StyleSheet.create({
  content: { paddingBottom: 48 },
  bannerWrap: { position: 'relative' },
  bannerPlaceholder: { alignItems: 'center', backgroundColor: '#14082A', height: 160, justifyContent: 'center', width: '100%' },
  bannerPlaceholderText: { color: 'rgba(255,255,255,0.4)', fontFamily: 'Aeonik Pro', fontSize: 16, fontWeight: '700', letterSpacing: 4 },
  changeBannerBtn: { backgroundColor: 'rgba(12,1,20,0.55)', borderRadius: 8, bottom: 12, paddingHorizontal: 14, paddingVertical: 6, position: 'absolute', right: 12 },
  changeBannerText: { color: '#FFFFFF', fontFamily: 'Urbanist', fontSize: 12, fontWeight: '600' },
  fieldGroup: { gap: 4, paddingHorizontal: 16, paddingVertical: 16 },
  titleInput: { color: '#100013', fontFamily: 'Aeonik Pro', fontSize: 24, fontWeight: '700', padding: 0 },
  fieldHint: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 12 },
  divider: { backgroundColor: '#F0EEF0', height: 1, marginHorizontal: 16 },
  fieldRow: { alignItems: 'center', flexDirection: 'row', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  fieldIconWrap: { alignItems: 'center', backgroundColor: '#F5F3FF', borderRadius: 10, flexShrink: 0, height: 44, justifyContent: 'center', position: 'relative', width: 44 },
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
  chevronRight: { borderColor: '#C3BFC4', borderRightWidth: 2, borderTopWidth: 2, flexShrink: 0, height: 10, transform: [{ rotate: '45deg' }], width: 10 },
  saveBtn: { alignItems: 'center', backgroundColor: '#42007A', borderRadius: 14, justifyContent: 'center', marginHorizontal: 16, marginTop: 28, paddingVertical: 16 },
  saveBtnText: { color: '#FFFFFF', fontFamily: 'Urbanist', fontSize: 16, fontWeight: '700' },
});

const rsStyles = StyleSheet.create({
  content: { gap: 16, padding: 16, paddingBottom: 48 },
  pageTitle: { color: '#100013', fontFamily: 'Aeonik Pro', fontSize: 24, fontWeight: '700', marginBottom: 4 },
  card: { backgroundColor: '#FFFFFF', borderColor: '#E8E6E8', borderRadius: 16, borderWidth: 1, gap: 0, overflow: 'hidden', padding: 16 },
  cardTitle: { color: '#100013', fontFamily: 'Aeonik Pro', fontSize: 18, fontWeight: '600', marginBottom: 4 },
  cardSub: { color: '#8359D5', fontFamily: 'Urbanist', fontSize: 13, lineHeight: 18, marginBottom: 12 },
  cardDivider: { backgroundColor: '#F0EEF0', height: 1, marginBottom: 16 },
  eligibilityRow: { alignItems: 'center', borderColor: '#E8E6E8', borderRadius: 12, borderWidth: 1.5, flexDirection: 'row', gap: 14, marginBottom: 10, padding: 14 },
  eligibilityRowSelected: { backgroundColor: '#F3EEFF', borderColor: '#8359D5' },
  checkbox: { alignItems: 'center', borderColor: '#C3BFC4', borderRadius: 12, borderWidth: 1.5, height: 22, justifyContent: 'center', width: 22 },
  checkboxSelected: { backgroundColor: '#8359D5', borderColor: '#8359D5' },
  checkMark: { borderBottomColor: '#FFFFFF', borderBottomWidth: 2, borderLeftColor: '#FFFFFF', borderLeftWidth: 2, height: 6, marginTop: -2, transform: [{ rotate: '-45deg' }], width: 10 },
  eligibilityText: { flex: 1, gap: 2 },
  eligibilityLabel: { color: '#100013', fontFamily: 'Urbanist', fontSize: 15, fontWeight: '600' },
  eligibilityLabelSelected: { color: '#42007A' },
  eligibilitySub: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 12 },
  maxUsersHint: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 13, lineHeight: 20, marginBottom: 12 },
  maxUsersRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  noLimitBtn: { alignItems: 'center', borderColor: '#E8E6E8', borderRadius: 100, borderWidth: 1.5, flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  noLimitBtnActive: { borderColor: '#8359D5' },
  infinityIcon: { color: '#8359D5', fontSize: 16 },
  noLimitText: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 14, fontWeight: '600' },
  noLimitTextActive: { color: '#8359D5' },
  maxInput: { borderColor: '#E8E6E8', borderRadius: 10, borderWidth: 1.5, color: '#100013', flex: 1, fontFamily: 'Urbanist', fontSize: 14, paddingHorizontal: 12, paddingVertical: 10 },
  maxInputActive: { borderColor: '#8359D5' },
});

const prStyles = StyleSheet.create({
  content: { gap: 16, padding: 16, paddingBottom: 48 },
  inputLabel: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 13, marginBottom: 8 },
  descInput: { borderColor: '#E8E6E8', borderRadius: 10, borderWidth: 1.5, color: '#100013', fontFamily: 'Urbanist', fontSize: 14, marginBottom: 6, paddingHorizontal: 14, paddingVertical: 12 },
  descInputError: { borderColor: '#EF4444' },
  errorRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginBottom: 4 },
  errorTriangle: { borderBottomColor: '#EF4444', borderBottomWidth: 8, borderLeftColor: 'transparent', borderLeftWidth: 5, borderRightColor: 'transparent', borderRightWidth: 5, height: 0, width: 0 },
  errorText: { color: '#EF4444', fontFamily: 'Urbanist', fontSize: 12 },
  certRow: { flexDirection: 'row', gap: 10 },
  certBtn: { borderColor: '#E8E6E8', borderRadius: 100, borderWidth: 1.5, paddingHorizontal: 24, paddingVertical: 8 },
  certBtnActive: { backgroundColor: '#8359D5', borderColor: '#8359D5' },
  certBtnText: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 14, fontWeight: '600' },
  certBtnTextActive: { color: '#FFFFFF' },
  addPrizeBtn: { alignItems: 'center', alignSelf: 'flex-end', borderColor: '#8359D5', borderRadius: 100, borderWidth: 1.5, flexDirection: 'row', gap: 6, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 8 },
  addPrizePlus: { color: '#8359D5', fontSize: 16, fontWeight: '700' },
  addPrizeText: { color: '#8359D5', fontFamily: 'Urbanist', fontSize: 13, fontWeight: '600' },
  prizeRow: { alignItems: 'center', backgroundColor: '#F5F3FF', borderRadius: 12, flexDirection: 'row', gap: 10, marginBottom: 8, padding: 12 },
  prizeTrophy: { alignItems: 'center', height: 32, justifyContent: 'center', width: 24 },
  trophyBody: { borderColor: '#8359D5', borderRadius: 6, borderWidth: 1.5, height: 18, width: 18 },
  trophyBase: { backgroundColor: '#8359D5', borderRadius: 2, height: 4, marginTop: -1, width: 14 },
  prizeInfo: { flex: 1, gap: 2 },
  prizeTitle: { color: '#100013', fontFamily: 'Urbanist', fontSize: 14, fontWeight: '700' },
  prizeAmount: { color: '#8359D5', fontFamily: 'Urbanist', fontSize: 12 },
  prizeAction: { paddingHorizontal: 6, paddingVertical: 4 },
  prizeActionEdit: { color: '#8359D5', fontFamily: 'Urbanist', fontSize: 13, fontWeight: '600' },
  prizeActionDelete: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 13 },
});

const aiStyles = StyleSheet.create({
  content: { gap: 16, padding: 16, paddingBottom: 48 },
  cardHeaderRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, justifyContent: 'space-between', marginBottom: 12 },
  addBtn: { borderColor: '#8359D5', borderRadius: 100, borderWidth: 1.5, flexShrink: 0, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#8359D5', fontFamily: 'Urbanist', fontSize: 12, fontWeight: '600' },
  emptyText: { color: '#C3BFC4', fontFamily: 'Urbanist', fontSize: 13, paddingVertical: 8, textAlign: 'center' },
  contactRow: { alignItems: 'center', backgroundColor: '#F5F3FF', borderRadius: 12, flexDirection: 'row', gap: 10, marginBottom: 8, padding: 12 },
  contactAvatar: { alignItems: 'center', backgroundColor: '#6949AA', borderRadius: 24, height: 44, justifyContent: 'center', width: 44 },
  contactInitial: { color: '#FFFFFF', fontFamily: 'Aeonik Pro', fontSize: 14, fontWeight: '700' },
  contactInfo: { flex: 1, gap: 1 },
  contactName: { color: '#100013', fontFamily: 'Urbanist', fontSize: 14, fontWeight: '700' },
  contactMeta: { color: '#7C737E', fontFamily: 'Urbanist', fontSize: 11 },
  actionBtn: { paddingHorizontal: 4, paddingVertical: 4 },
  actionEdit: { color: '#8359D5', fontFamily: 'Urbanist', fontSize: 13, fontWeight: '600' },
  actionDelete: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 13 },
  attachmentsEmpty: { alignItems: 'center', borderColor: '#E8E6E8', borderRadius: 10, borderStyle: 'dashed', borderWidth: 1.5, paddingVertical: 20 },
});

const psStyles = StyleSheet.create({
  content: { gap: 16, padding: 16, paddingBottom: 48 },
  sectionLabel: { color: '#100013', fontFamily: 'Urbanist', fontSize: 15, fontWeight: '700', marginBottom: 10 },
  radioRow: { alignItems: 'center', borderColor: '#E8E6E8', borderRadius: 12, borderWidth: 1.5, flexDirection: 'row', gap: 12, marginBottom: 10, padding: 14 },
  radioRowActive: { borderColor: '#8359D5' },
  radio: { alignItems: 'center', borderColor: '#C3BFC4', borderRadius: 12, borderWidth: 1.5, height: 22, justifyContent: 'center', width: 22 },
  radioSelected: { borderColor: '#8359D5' },
  radioDot: { backgroundColor: '#8359D5', borderRadius: 6, height: 12, width: 12 },
  radioLabel: { color: '#100013', flex: 1, fontFamily: 'Urbanist', fontSize: 14, fontWeight: '500' },
  checkRow: { alignItems: 'center', backgroundColor: '#F5F3FF', borderColor: '#E8E6E8', borderRadius: 12, borderWidth: 1.5, flexDirection: 'row', gap: 12, marginTop: 4, padding: 14 },
  checkRowActive: { borderColor: '#8359D5' },
  checkBox: { alignItems: 'center', borderColor: '#C3BFC4', borderRadius: 4, borderWidth: 1.5, height: 20, justifyContent: 'center', width: 20 },
  checkBoxSelected: { backgroundColor: '#8359D5', borderColor: '#8359D5' },
  checkBoxMark: { borderBottomColor: '#FFFFFF', borderBottomWidth: 2, borderLeftColor: '#FFFFFF', borderLeftWidth: 2, height: 5, marginTop: -2, transform: [{ rotate: '-45deg' }], width: 9 },
});

const fmStyles = StyleSheet.create({
  overlay: { alignItems: 'center', backgroundColor: 'rgba(12,1,20,0.4)', flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, paddingHorizontal: 20, paddingTop: 20, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  headerTitle: { color: '#100013', fontFamily: 'Aeonik Pro', fontSize: 18, fontWeight: '700' },
  closeBtn: { alignItems: 'center', height: 28, justifyContent: 'center', width: 28 },
  closeStroke: { backgroundColor: '#584D5A', borderRadius: 2, height: 2, position: 'absolute', width: 14 },
  closeStroke1: { transform: [{ rotate: '45deg' }] },
  closeStroke2: { transform: [{ rotate: '-45deg' }] },
  field: { gap: 6, marginBottom: 14 },
  fieldLabel: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 13, fontWeight: '500' },
  input: { borderColor: '#E8E6E8', borderRadius: 10, borderWidth: 1.5, color: '#100013', fontFamily: 'Urbanist', fontSize: 14, paddingHorizontal: 14, paddingVertical: 12 },
  confirmBtn: { alignItems: 'center', backgroundColor: '#42007A', borderRadius: 14, marginTop: 8, paddingVertical: 16 },
  confirmBtnText: { color: '#FFFFFF', fontFamily: 'Urbanist', fontSize: 16, fontWeight: '700' },
});
