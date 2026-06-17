import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import subtractPlaceholder from '../../../../../../assets/Subtract.png';
import { AppText, RegistrationSettingsPanel, type RegistrationQuestion } from '../../../../../shared/ui';
import { apiClient } from '../../../../../shared/api/apiClient';
import {
  type EligibilityKey,
  type HackathonContact,
  type HackathonAttachment,
  type HackathonPrize,
  type HackathonRound,
  type LiveHackathon,
  type PassSendingMode,
} from './OrganizerCreateHackathonScreen';
import {
  DatePickerModal,
  DescriptionModal,
  LocationModal,
  TimePickerModal,
  type LocationMode,
  type TimeValue,
} from './HackathonFormModals';

type EditTab =
  | 'preview'
  | 'basic-details'
  | 'registration-settings'
  | 'rounds'
  | 'prizes'
  | 'additional-info'
  | 'pass-settings';



const EDIT_TABS: { key: EditTab; label: string }[] = [
  { key: 'preview', label: 'Preview' },
  { key: 'basic-details', label: 'Basic Details' },
  { key: 'registration-settings', label: 'Registration Settings' },
  { key: 'rounds', label: 'Rounds' },
  { key: 'prizes', label: 'Prizes' },
  { key: 'additional-info', label: 'Additional Info' },
];

const ELIGIBILITY_OPTIONS: { key: EligibilityKey; label: string; sub: string }[] = [
  { key: 'everyone', label: 'Everyone can apply', sub: 'All Applicants' },
  { key: 'school', label: 'School students', sub: 'Up to grade 12' },
  { key: 'college', label: 'College students', sub: 'UG / PG Students' },
  { key: 'freshers', label: 'Freshers', sub: '0-1 Year Experience' },
  { key: 'professionals', label: 'Professionals', sub: '1+ Year Experience' },
];

interface EditHackathonScreenProps {
  readonly hackathon: LiveHackathon;
  readonly mode?: 'edit' | 'create';
  readonly isCreating?: boolean;
  readonly onUpdateHackathon?: (hackathon: LiveHackathon) => void;
  readonly onCreateHackathon?: (hackathon: LiveHackathon) => void;
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

/** Converts "4 Jun 26" style date strings to ISO. Falls back to now+offsetDays. */
function parseDateStrToISO(dateStr: string, offsetDays = 0): string {
  const MONTHS: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const parts = (dateStr ?? '').trim().split(' ');
  if (parts.length >= 3 && parts[1] && MONTHS[parts[1]] !== undefined) {
    const day = parseInt(parts[0] ?? '1', 10);
    const month = MONTHS[parts[1]] ?? 0;
    const rawYear = parseInt(parts[2] ?? '0', 10);
    const year = rawYear < 100 ? 2000 + rawYear : rawYear;
    const d = new Date(year, month, isNaN(day) ? 1 : day);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  const fallback = new Date();
  fallback.setDate(fallback.getDate() + offsetDays);
  return fallback.toISOString();
}

/** Maps local LiveHackathon rounds to the backend RoundDto shape. */
function mapRoundsToDto(rounds: readonly HackathonRound[]) {
  return rounds.map((r, index) => ({
    name: r.title || `Round ${index + 1}`,
    description: r.description || undefined,
    startsAt: parseDateStrToISO(r.startDate, index),
    endsAt: parseDateStrToISO(r.endDate, index + 1),
    order: index,
    roundType: (r.type ? r.type.toUpperCase() : 'ONLINE') as 'ONLINE' | 'OFFLINE' | 'PRESENTATION',
    submissionConfig: r.submissionsEnabled ? { requiresFileUpload: true } : undefined,
  }));
}

export function EditHackathonScreen({ hackathon, mode = 'edit', isCreating = false, onUpdateHackathon, onCreateHackathon }: EditHackathonScreenProps) {
  const [activeTab, setActiveTab] = useState<EditTab>('preview');
  const [savedTime, setSavedTime] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (updatedHackathon: LiveHackathon) => {
      if (!updatedHackathon.id) return Promise.resolve(null);
      const MONTHS: Record<string, number> = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
      };
      const parseDate = (str: string): string => {
        const parts = (str ?? '').trim().split(' ');
        if (parts.length >= 3 && parts[1] && MONTHS[parts[1]] !== undefined) {
          const day = parseInt(parts[0] ?? '1', 10);
          const month = MONTHS[parts[1]] ?? 0;
          const rawYear = parseInt(parts[2] ?? '0', 10);
          const year = rawYear < 100 ? 2000 + rawYear : rawYear;
          const d = new Date(year, month, isNaN(day) ? 1 : day);
          if (!isNaN(d.getTime())) return d.toISOString();
        }
        return new Date().toISOString();
      };
      return apiClient.put(`/hackathons/${updatedHackathon.id}`, {
        name: updatedHackathon.title,
        description: updatedHackathon.description,
        startDate: parseDate(updatedHackathon.startDate),
        endDate: parseDate(updatedHackathon.startDate), // same-day default
        registrationStartDate: updatedHackathon.registrationStartDate ? parseDate(updatedHackathon.registrationStartDate) : undefined,
        registrationDeadline: updatedHackathon.registrationDeadlineDate ? parseDate(updatedHackathon.registrationDeadlineDate) : undefined,
        mode: updatedHackathon.locationMode === 'online' ? 'ONLINE' : 'OFFLINE',
        organizationName: updatedHackathon.organizerName || undefined,
        bannerImageUrl: updatedHackathon.imageUrl || undefined,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['organizer', 'hackathons'] });
    },
  });

  const updateRoundsMutation = useMutation({
    mutationFn: ({ hackathonId, rounds }: { hackathonId: string; rounds: readonly HackathonRound[] }) => {
      return apiClient.put(`/hackathons/${hackathonId}/rounds`, {
        rounds: mapRoundsToDto(rounds),
      });
    },
  });

  const updateAdditionalInfoMutation = useMutation({
    mutationFn: ({ hackathonId, contacts, attachments }: { hackathonId: string; contacts: readonly HackathonContact[]; attachments: readonly HackathonAttachment[] }) => {
      return apiClient.put(`/hackathons/${hackathonId}/additional-info`, {
        contactPersons: contacts.map((c) => ({
          name: c.name,
          phone: c.phone || undefined,
          email: c.email || undefined,
        })),
        attachments: attachments.map((a) => ({
          fileName: a.name,
          fileUrl: a.url,
          fileType: 'document',
        })),
      });
    },
  });

  function handleSave(updatedHackathon: LiveHackathon) {
    if (onUpdateHackathon) onUpdateHackathon(updatedHackathon);
    setSavedTime(formatCurrentTime());
    if (mode === 'edit' && updatedHackathon.id) {
      updateMutation.mutate(updatedHackathon);
    }
  }

  function handleSaveRounds(hackathonId: string, rounds: readonly HackathonRound[], updatedHackathon: LiveHackathon) {
    if (onUpdateHackathon) onUpdateHackathon(updatedHackathon);
    setSavedTime(formatCurrentTime());
    if (hackathonId) {
      updateRoundsMutation.mutate({ hackathonId, rounds });
    }
  }

  function handleSaveAdditionalInfo(hackathonId: string, updatedHackathon: LiveHackathon) {
    if (onUpdateHackathon) onUpdateHackathon(updatedHackathon);
    setSavedTime(formatCurrentTime());
    if (hackathonId) {
      updateAdditionalInfoMutation.mutate({
        hackathonId,
        contacts: updatedHackathon.contacts ?? [],
        attachments: updatedHackathon.attachments ?? [],
      });
    }
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

      {/* Saved status bar or Create Button */}
      {mode === 'create' ? (
        <View style={styles.savedBar}>
          <AppText style={styles.unsavedText}>{isCreating ? 'Creating…' : 'Draft Hackathon'}</AppText>
          <Pressable
            disabled={isCreating}
            onPress={() => !isCreating && onCreateHackathon && onCreateHackathon(hackathon)}
            style={{ backgroundColor: isCreating ? '#7C5BA0' : '#392160', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: isCreating ? 0.7 : 1 }}
          >
            {isCreating && <ActivityIndicator color="#fff" size="small" />}
            <AppText style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
              {isCreating ? 'Creating…' : 'Host Hackathon'}
            </AppText>
          </Pressable>
        </View>
      ) : (
        <View style={styles.savedBar}>
          <AppText style={savedTime !== null ? styles.savedText : styles.unsavedText}>
            {updateMutation.isPending ? 'Saving…' : savedTime !== null ? 'Saved' : 'Unsaved'}
          </AppText>
          {savedTime !== null && !updateMutation.isPending && (
            <AppText style={styles.lastSavedText}>Last saved: {savedTime}</AppText>
          )}
        </View>
      )}

      {activeTab === 'preview' ? (
        <PreviewContent hackathon={hackathon} />
      ) : activeTab === 'basic-details' ? (
        <BasicDetailsContent hackathon={hackathon} isSaving={updateMutation.isPending} onSave={handleSave} />
      ) : activeTab === 'registration-settings' ? (
        <RegistrationSettingsContent hackathon={hackathon} onSave={handleSave} />
      ) : activeTab === 'rounds' ? (
        <RoundsContent
          hackathon={hackathon}
          hackathonId={hackathon.id}
          isSavingRounds={updateRoundsMutation.isPending}
          onSave={(updated) => handleSaveRounds(hackathon.id, updated.rounds ?? [], updated)}
        />
      ) : activeTab === 'prizes' ? (
        <PrizesContent hackathon={hackathon} onSave={handleSave} />
      ) : activeTab === 'additional-info' ? (
        <AdditionalInfoContent hackathon={hackathon} onSave={(updated) => handleSaveAdditionalInfo(hackathon.id, updated)} />
      ) : null}
    </View>
  );
}

// ─── Registration Settings Content ───────────────────────────────────────────────

function RegistrationSettingsContent({ hackathon, onSave }: { readonly hackathon: LiveHackathon; readonly onSave: (h: LiveHackathon) => void }) {
  const [activeModal, setActiveModal] = useState<'registrationStartDate' | 'registrationStartTime' | 'registrationDeadlineDate' | 'registrationDeadlineTime' | null>(null);

  const parsedStartDate = parseDateStr(hackathon.registrationStartDate || '');
  const startTimeValue = parseTimeStr(hackathon.registrationStartTime || '');
  const parsedDeadlineDate = parseDateStr(hackathon.registrationDeadlineDate || '');
  const deadlineTimeValue = parseTimeStr(hackathon.registrationDeadlineTime || '');

  return (
    <>
      <RegistrationSettingsPanel 
        eligibleCandidates={hackathon.eligibleCandidates || ['everyone']}
        maxAttendees={hackathon.maxAttendees || ''}
        onChange={(updates) => onSave({ ...hackathon, ...updates })}
        onSave={() => onSave(hackathon)}
        onPressTimelineField={setActiveModal}
        {...(hackathon.additionalQuestions !== undefined ? { additionalQuestions: hackathon.additionalQuestions } : {})}
        {...(hackathon.registrationDeadlineDate !== undefined ? { registrationDeadlineDate: hackathon.registrationDeadlineDate } : {})}
        {...(hackathon.registrationDeadlineTime !== undefined ? { registrationDeadlineTime: hackathon.registrationDeadlineTime } : {})}
        {...(hackathon.registrationStartDate !== undefined ? { registrationStartDate: hackathon.registrationStartDate } : {})}
        {...(hackathon.registrationStartTime !== undefined ? { registrationStartTime: hackathon.registrationStartTime } : {})}
      />
      
      <DatePickerModal
        onClose={() => setActiveModal(null)}
        onConfirm={(date) => {
          const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          const dateStr = `${date.getDate()} ${MONTHS[date.getMonth()]} ${String(date.getFullYear()).slice(2)}`;
          if (activeModal === 'registrationStartDate') onSave({ ...hackathon, registrationStartDate: dateStr });
          if (activeModal === 'registrationDeadlineDate') onSave({ ...hackathon, registrationDeadlineDate: dateStr });
          setActiveModal(null);
        }}
        value={activeModal === 'registrationStartDate' ? parsedStartDate : parsedDeadlineDate}
        visible={activeModal === 'registrationStartDate' || activeModal === 'registrationDeadlineDate'}
      />
      <TimePickerModal
        onClose={() => setActiveModal(null)}
        onConfirm={(t: TimeValue) => {
          const timeStr = `${t.hour}:${t.minute} ${t.period}`;
          if (activeModal === 'registrationStartTime') onSave({ ...hackathon, registrationStartTime: timeStr });
          if (activeModal === 'registrationDeadlineTime') onSave({ ...hackathon, registrationDeadlineTime: timeStr });
          setActiveModal(null);
        }}
        value={activeModal === 'registrationStartTime' ? startTimeValue : deadlineTimeValue}
        visible={activeModal === 'registrationStartTime' || activeModal === 'registrationDeadlineTime'}
      />
    </>
  );
}

// ─── Preview ─────────────────────────────────────────────────────────────────

type PreviewSubTab = 'about' | 'rounds' | 'prizes' | 'contact';

function PreviewContent({ hackathon }: { readonly hackathon: LiveHackathon }) {
  const [subTab, setSubTab] = useState<PreviewSubTab>('about');

  const hasPrizes = hackathon.prizes && hackathon.prizes.length > 0;
  const hasContact = hackathon.contacts && hackathon.contacts.length > 0;

  return (
    <View style={previewStyles.container}>
      <ScrollView contentContainerStyle={previewStyles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cover Banner */}
        <View style={previewStyles.bannerWrap}>
          <Image resizeMode="cover" source={hackathon.imageUrl ? { uri: hackathon.imageUrl } : subtractPlaceholder} style={previewStyles.bannerImage} />
          {/* Overlays can go here if needed later */}
        </View>

        <View style={previewStyles.contentWrap}>
          {/* Tags & Share */}
          <View style={previewStyles.metaRow}>
            <View style={previewStyles.tagsWrap}>
              <AppText style={previewStyles.tagText}>Workshop</AppText>
              <AppText style={previewStyles.tagText}>Funding</AppText>
            </View>
            <View style={previewStyles.shareCircle}>
              <View style={previewStyles.shareIcon} />
            </View>
          </View>

          {/* Title */}
          <AppText style={previewStyles.title}>{hackathon.title}</AppText>

          {/* Schedule & Location */}
          <View style={previewStyles.infoRow}>
            <View style={previewStyles.infoIconBox}>
              <AppText style={previewStyles.calMonth}>{getMonthAbbr(hackathon.startDate) || 'Jan'}</AppText>
              <AppText style={previewStyles.calDay}>{getDay(hackathon.startDate) || '1'}</AppText>
            </View>
            <View style={previewStyles.infoCol}>
              <AppText style={previewStyles.infoMain}>{getFullDate(hackathon.startDate) || 'Date TBD'}</AppText>
              <AppText style={previewStyles.infoSub}>{hackathon.startTime || 'Time TBD'}</AppText>
            </View>
          </View>

          <View style={previewStyles.infoRow}>
            <View style={previewStyles.infoIconBox}>
              <View style={previewStyles.pinHead} />
              <View style={previewStyles.pinTail} />
            </View>
            <View style={previewStyles.infoCol}>
              <AppText style={previewStyles.infoMain}>
                {hackathon.locationValue || (hackathon.locationMode === 'online' ? 'Online Event' : 'Location Name')}
              </AppText>
              <AppText style={previewStyles.infoSub}>City, State</AppText>
            </View>
          </View>

          {/* Dynamic Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={previewStyles.tabsScroll} contentContainerStyle={previewStyles.tabsContent}>
            <Pressable onPress={() => setSubTab('about')} style={[previewStyles.tabBtn, subTab === 'about' && previewStyles.tabBtnActive]}>
              <AppText style={[previewStyles.tabText, subTab === 'about' && previewStyles.tabTextActive]}>About Event</AppText>
            </Pressable>
            <Pressable onPress={() => setSubTab('rounds')} style={[previewStyles.tabBtn, subTab === 'rounds' && previewStyles.tabBtnActive]}>
              <AppText style={[previewStyles.tabText, subTab === 'rounds' && previewStyles.tabTextActive]}>Rounds</AppText>
            </Pressable>
            {hasPrizes && (
              <Pressable onPress={() => setSubTab('prizes')} style={[previewStyles.tabBtn, subTab === 'prizes' && previewStyles.tabBtnActive]}>
                <AppText style={[previewStyles.tabText, subTab === 'prizes' && previewStyles.tabTextActive]}>Prizes</AppText>
              </Pressable>
            )}
            <Pressable onPress={() => setSubTab('contact')} style={[previewStyles.tabBtn, subTab === 'contact' && previewStyles.tabBtnActive]}>
              <AppText style={[previewStyles.tabText, subTab === 'contact' && previewStyles.tabTextActive]}>Contact Details</AppText>
            </Pressable>
          </ScrollView>

          {/* Tab Content */}
          <View style={previewStyles.sectionContent}>
            {subTab === 'about' && <AboutSection hackathon={hackathon} />}
            {subTab === 'rounds' && <RoundsSection hackathon={hackathon} />}
            {subTab === 'prizes' && <PrizesSection hackathon={hackathon} />}
            {subTab === 'contact' && <ContactSection hackathon={hackathon} />}
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

function AboutSection({ hackathon }: { readonly hackathon: LiveHackathon }) {
  return (
    <View>
      <AppText style={previewStyles.sectionTitle}>About Event</AppText>
      <AppText style={previewStyles.descText}>
        {hackathon.description || 'No description provided.'}
      </AppText>

      <AppText style={[previewStyles.sectionTitle, { marginTop: 24, fontSize: 16 }]}>Registration Details</AppText>
      <View style={previewStyles.contactCard}>
        <View style={previewStyles.contactInfo}>
          <AppText style={previewStyles.contactName}>Registration Start</AppText>
          <AppText style={previewStyles.contactMeta}>
            {hackathon.registrationStartDate || 'TBD'} {hackathon.registrationStartTime ? `at ${hackathon.registrationStartTime}` : ''}
          </AppText>
        </View>
      </View>
      <View style={previewStyles.contactCard}>
        <View style={previewStyles.contactInfo}>
          <AppText style={previewStyles.contactName}>Registration Deadline</AppText>
          <AppText style={previewStyles.contactMeta}>
            {hackathon.registrationDeadlineDate || 'TBD'} {hackathon.registrationDeadlineTime ? `at ${hackathon.registrationDeadlineTime}` : ''}
          </AppText>
        </View>
      </View>
      <View style={previewStyles.contactCard}>
        <View style={previewStyles.contactInfo}>
          <AppText style={previewStyles.contactName}>Max Attendees</AppText>
          <AppText style={previewStyles.contactMeta}>{hackathon.maxAttendees || 'No Limit'}</AppText>
        </View>
      </View>
    </View>
  );
}

function RoundsSection({ hackathon }: { readonly hackathon: LiveHackathon }) {
  const rounds = hackathon.rounds ?? [];
  if (rounds.length === 0) {
    return (
      <View>
        <AppText style={previewStyles.sectionTitle}>Rounds</AppText>
        <AppText style={previewStyles.emptyText}>No rounds defined yet. Add rounds in the Rounds tab.</AppText>
      </View>
    );
  }
  return (
    <View>
      <AppText style={previewStyles.sectionTitle}>Rounds</AppText>
      {rounds.map((round, idx) => (
        <View key={round.id} style={[previewStyles.contactCard, { marginBottom: 10 }]}>
          <View style={[previewStyles.contactAvatar, { backgroundColor: '#F3EEFF' }]}>
            <AppText style={[previewStyles.contactInitial, { color: '#6949AA' }]}>{idx + 1}</AppText>
          </View>
          <View style={previewStyles.contactInfo}>
            <AppText style={previewStyles.contactName}>{round.title || `Round ${idx + 1}`}</AppText>
            {round.startDate ? (
              <AppText style={previewStyles.contactMeta}>{round.startDate} – {round.endDate || '?'}</AppText>
            ) : null}
            {round.description ? (
              <AppText numberOfLines={2} style={previewStyles.contactMeta}>{round.description}</AppText>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}

function PrizesSection({ hackathon }: { readonly hackathon: LiveHackathon }) {
  return (
    <View>
      <AppText style={previewStyles.sectionTitle}>Prizes</AppText>
      {hackathon.prizes?.map((prize) => (
        <View key={prize.id} style={previewStyles.contactCard}>
          <View style={[previewStyles.contactAvatar, { backgroundColor: '#F3EEFF' }]}>
            <AppText style={[previewStyles.contactInitial, { color: '#6949AA' }]}>P</AppText>
          </View>
          <View style={previewStyles.contactInfo}>
            <AppText style={previewStyles.contactName}>{prize.title}</AppText>
            <AppText style={previewStyles.contactMeta}>{prize.amount}</AppText>
          </View>
        </View>
      ))}
    </View>
  );
}

function ContactSection({ hackathon }: { readonly hackathon: LiveHackathon }) {
  const contacts = hackathon.contacts ?? [];
  const attachments = hackathon.attachments ?? [];
  return (
    <View>
      <AppText style={previewStyles.sectionTitle}>Contact Details</AppText>
      {contacts.length === 0 ? (
        <AppText style={previewStyles.emptyText}>No contacts added yet.</AppText>
      ) : (
        contacts.map((contact) => (
          <View key={contact.id} style={previewStyles.contactCard}>
            <View style={previewStyles.contactAvatar}>
              <AppText style={previewStyles.contactInitial}>{contact.name.charAt(0).toUpperCase()}</AppText>
            </View>
            <View style={previewStyles.contactInfo}>
              <AppText style={previewStyles.contactName}>{contact.name}</AppText>
              <AppText style={previewStyles.contactMeta}>{contact.phone}</AppText>
              <AppText style={previewStyles.contactMeta}>{contact.email}</AppText>
            </View>
          </View>
        ))
      )}

      {attachments.length > 0 && (
        <>
          <AppText style={[previewStyles.sectionTitle, { marginTop: 24 }]}>Attachments</AppText>
          {attachments.map((attachment) => (
            <View key={attachment.id} style={previewStyles.contactCard}>
              <View style={[previewStyles.contactAvatar, { backgroundColor: '#F3EEFF' }]}>
                <AppText style={[previewStyles.contactInitial, { color: '#6949AA' }]}>A</AppText>
              </View>
              <View style={previewStyles.contactInfo}>
                <AppText style={previewStyles.contactName}>{attachment.name}</AppText>
                <AppText style={previewStyles.contactMeta}>Document</AppText>
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const previewStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingBottom: 40 },
  bannerWrap: { width: '100%', height: 200, backgroundColor: '#1C1340' },
  bannerImage: { width: '100%', height: '100%' },
  contentWrap: { padding: 16 },
  
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tagsWrap: { flexDirection: 'row', gap: 12 },
  tagText: { color: '#6949AA', fontFamily: 'Urbanist', fontSize: 12, fontWeight: '600' },
  shareCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  shareIcon: { borderColor: '#584D5A', borderRadius: 2, borderWidth: 1.5, borderTopWidth: 0, borderRightWidth: 0, height: 10, width: 10, position: 'relative' },
  
  title: { color: '#100013', fontFamily: 'Aeonik Pro', fontSize: 24, fontWeight: '700', lineHeight: 30, marginBottom: 20 },
  
  infoRow: { flexDirection: 'row', gap: 14, marginBottom: 16, alignItems: 'center' },
  infoIconBox: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#FAFAFA', borderColor: '#E8E6E8', borderWidth: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  calMonth: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 10, fontWeight: '600' },
  calDay: { color: '#100013', fontFamily: 'Urbanist', fontSize: 16, fontWeight: '700' },
  pinHead: { borderColor: '#584D5A', borderRadius: 7, borderWidth: 1.5, height: 12, position: 'absolute', top: 12, width: 12 },
  pinTail: { backgroundColor: '#584D5A', borderRadius: 1, bottom: 12, height: 6, position: 'absolute', width: 2 },
  infoCol: { flex: 1, justifyContent: 'center' },
  infoMain: { color: '#100013', fontFamily: 'Urbanist', fontSize: 14, fontWeight: '600' },
  infoSub: { color: '#7C737E', fontFamily: 'Urbanist', fontSize: 12, marginTop: 2 },
  
  tabsScroll: { marginTop: 12, marginBottom: 20 },
  tabsContent: { gap: 10, paddingRight: 20 },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, borderWidth: 1, borderColor: '#E8E6E8', backgroundColor: '#FFFFFF' },
  tabBtnActive: { borderColor: '#D8B4FE', backgroundColor: '#F3EEFF' },
  tabText: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: '#6949AA', fontWeight: '600' },
  
  sectionContent: { marginTop: 4 },
  sectionTitle: { color: '#100013', fontFamily: 'Aeonik Pro', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  descText: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 13, lineHeight: 20 },
  readMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  readMoreText: { color: '#6949AA', fontFamily: 'Urbanist', fontSize: 13, fontWeight: '600' },
  readMoreChevron: { borderBottomColor: '#6949AA', borderRightColor: '#6949AA', borderBottomWidth: 1.5, borderRightWidth: 1.5, width: 6, height: 6, transform: [{ rotate: '45deg' }] },
  
  emptyText: { color: '#7C737E', fontFamily: 'Urbanist', fontSize: 13 },
  
  contactCard: { flexDirection: 'row', gap: 14, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E8E6E8', marginBottom: 12 },
  contactAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2E194D', alignItems: 'center', justifyContent: 'center' },
  contactInitial: { color: '#FFFFFF', fontFamily: 'Aeonik Pro', fontSize: 18, fontWeight: '600' },
  contactInfo: { flex: 1, justifyContent: 'center' },
  contactName: { color: '#100013', fontFamily: 'Urbanist', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  contactMeta: { color: '#7C737E', fontFamily: 'Urbanist', fontSize: 12 },
});

// ─── Basic Details ────────────────────────────────────────────────────────────

type BasicModal = 'date' | 'time' | 'location' | 'description' | null;

function BasicDetailsContent({
  hackathon,
  isSaving = false,
  onSave,
}: {
  readonly hackathon: LiveHackathon;
  readonly isSaving?: boolean;
  readonly onSave: (h: LiveHackathon) => void;
}) {
  const [title, setTitle] = useState(hackathon.title);
  const [startDate, setStartDate] = useState(hackathon.startDate);
  const [startTime, setStartTime] = useState(hackathon.startTime);
  const [locationMode, setLocationMode] = useState<LocationMode>(hackathon.locationMode);
  const [locationValue, setLocationValue] = useState(hackathon.locationValue);
  const [description, setDescription] = useState(hackathon.description);
  const [imageUrl, setImageUrl] = useState(hackathon.imageUrl ?? null);
  const [activeModal, setActiveModal] = useState<BasicModal>(null);

  const parsedDate = parseDateStr(startDate);
  const timeValue = parseTimeStr(startTime);

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
    onSave({ ...hackathon, title, startDate, startTime, locationMode, locationValue, description, imageUrl });
  }

  return (
    <ScrollView
      contentContainerStyle={bdStyles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={bdStyles.bannerWrap}>
        <Image resizeMode="cover" source={imageUrl ? { uri: imageUrl } : subtractPlaceholder} style={bdStyles.banner} />
        <Pressable onPress={pickImage} style={bdStyles.changeBannerBtn}>
          <AppText style={bdStyles.changeBannerText}>{imageUrl ? 'Change Banner' : 'Add Banner'}</AppText>
        </Pressable>
      </View>

      <View style={bdStyles.fieldGroup}>
        <TextInput
          onChangeText={setTitle}
          placeholder="Hackathon Name"
          placeholderTextColor="#C3BFC4"
          style={bdStyles.titleInput}
          value={title}
        />
        <AppText style={bdStyles.fieldHint}>Enter the name of your hackathon</AppText>
      </View>

      <View style={bdStyles.divider} />

      <Pressable onPress={() => setActiveModal('date')} style={bdStyles.fieldRow}>
        <View style={bdStyles.fieldIconWrap}>
          <View style={bdStyles.calIcon} />
          <View style={bdStyles.calPage} />
        </View>
        <View style={bdStyles.fieldTextCol}>
          <AppText style={bdStyles.fieldValue}>{startDate || 'Select date'}</AppText>
          <AppText style={bdStyles.fieldLabel}>Hackathon Date</AppText>
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
          <AppText style={bdStyles.fieldLabel}>Hackathon Time</AppText>
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
            {locationValue || (locationMode === 'online' ? 'Online Hackathon' : 'Add location')}
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
            <AppText style={bdStyles.fieldLabel}>Tap to add hackathon description</AppText>
          )}
        </View>
        <View style={bdStyles.chevronRight} />
      </Pressable>

      <View style={bdStyles.divider} />

      <Pressable disabled={isSaving} onPress={handleSave} style={[bdStyles.saveBtn, isSaving ? { opacity: 0.6 } : null]}>
        {isSaving ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <AppText style={bdStyles.saveBtnText}>Save Changes</AppText>
        )}
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

// ─── Rounds ───────────────────────────────────────────────────────────────────

function RoundsContent({
  hackathon,
  hackathonId,
  isSavingRounds = false,
  onSave,
}: {
  readonly hackathon: LiveHackathon;
  readonly hackathonId?: string;
  readonly isSavingRounds?: boolean;
  readonly onSave: (hackathon: LiveHackathon) => void;
}) {
  const rounds = hackathon.rounds ?? [];

  return (
    <ScrollView contentContainerStyle={prStyles.content} showsVerticalScrollIndicator={false}>
      <AppText style={rsStyles.pageTitle}>Rounds</AppText>
      
      <View style={rsStyles.card}>
        <AppText style={rsStyles.cardTitle}>Manage Rounds</AppText>
        <AppText style={rsStyles.cardSub}>Add and manage multiple rounds for your hackathon.</AppText>
        <View style={rsStyles.cardDivider} />
        
        <Pressable
          onPress={() => {
            const newRound: HackathonRound = {
              id: String(Date.now()),
              title: `Round ${rounds.length + 1}`,
              description: '',
              startDate: '',
              endDate: '',
            };
            onSave({ ...hackathon, rounds: [...rounds, newRound] });
          }}
          style={prStyles.addPrizeBtn}
        >
          <AppText style={prStyles.addPrizePlus}>+</AppText>
          <AppText style={prStyles.addPrizeText}>Add New Round</AppText>
        </Pressable>

        {rounds.length === 0 && (
          <View style={rdStyles.emptyRounds}>
            <AppText style={rdStyles.emptyRoundsText}>No rounds added yet. Click "Add New Round" to begin.</AppText>
          </View>
        )}

        {rounds.map((round, idx) => (
          <View key={round.id} style={rdStyles.roundSummaryRow}>
            <View style={rdStyles.roundBadgeSm}>
              <AppText style={rdStyles.roundBadgeSmText}>{idx + 1}</AppText>
            </View>
            <AppText style={rdStyles.roundSummaryTitle}>{round.title || `Round ${idx + 1}`}</AppText>
            <Pressable
              onPress={() => {
                const updatedRounds = rounds.filter((r) => r.id !== round.id);
                onSave({ ...hackathon, rounds: updatedRounds });
              }}
              style={prStyles.prizeAction}
            >
              <AppText style={prStyles.prizeActionDelete}>Remove</AppText>
            </Pressable>
          </View>
        ))}
        {isSavingRounds && (
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <ActivityIndicator color="#6949AA" size="small" />
            <AppText style={{ color: '#7C737E', fontSize: 11, marginTop: 4 }}>Saving rounds…</AppText>
          </View>
        )}
      </View>

      {rounds.map((round, idx) => (
        <RoundDetailCard
          key={round.id}
          hackathon={hackathon}
          onSave={onSave}
          round={round}
          roundIndex={idx}
          rounds={rounds}
        />
      ))}
    </ScrollView>
  );
}

interface RoundDetailCardProps {
  readonly hackathon: LiveHackathon;
  readonly onSave: (hackathon: LiveHackathon) => void;
  readonly round: HackathonRound;
  readonly roundIndex: number;
  readonly rounds: readonly HackathonRound[];
}

function RoundDetailCard({ hackathon, onSave, round, roundIndex, rounds }: RoundDetailCardProps) {
  const [title, setTitle] = useState(round.title);
  const [description, setDescription] = useState(round.description);
  const [startDate, setStartDate] = useState(round.startDate);
  const [endDate, setEndDate] = useState(round.endDate);
  const [type, setType] = useState<RoundType>(round.type ?? 'Online');
  const [submissionsEnabled, setSubmissionsEnabled] = useState(round.submissionsEnabled ?? false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  function handleSaveRound() {
    const updatedRound: HackathonRound = { ...round, title, description, startDate, endDate, type, submissionsEnabled };
    const updatedRounds = rounds.map((r) => (r.id === round.id ? updatedRound : r));
    onSave({ ...hackathon, rounds: updatedRounds });
  }

  return (
    <View style={rsStyles.card}>
      <View style={rdStyles.roundHeader}>
        <View style={rdStyles.roundBadge}>
          <AppText style={rdStyles.roundBadgeText}>{roundIndex + 1}</AppText>
        </View>
        <AppText style={rsStyles.cardTitle}>Round {roundIndex + 1}</AppText>
      </View>
      <View style={rsStyles.cardDivider} />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <AppText style={prStyles.inputLabel}>Round Title</AppText>
          <TextInput
            onChangeText={setTitle}
            placeholder="e.g. Idea Submission"
            placeholderTextColor="#C3BFC4"
            style={prStyles.descInput}
            value={title}
          />
        </View>
        <View style={{ flex: 1, zIndex: 10 }}>
          <AppText style={prStyles.inputLabel}>Round Type</AppText>
          <Pressable 
            onPress={() => setTypeDropdownOpen(!typeDropdownOpen)}
            style={[prStyles.descInput, { justifyContent: 'center' }]}
          >
            <AppText style={{ color: type ? '#100013' : '#C3BFC4', fontFamily: 'Urbanist', fontSize: 14 }}>
              {type || 'Select type'}
            </AppText>
            <View style={{ position: 'absolute', right: 12, top: 18, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 5, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#6949AA' }} />
          </Pressable>
          {typeDropdownOpen && (
            <View style={{ position: 'absolute', top: 76, left: 0, right: 0, backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#F2EBFF', elevation: 4, zIndex: 20 }}>
              {(['Online', 'Offline', 'Presentation'] as RoundType[]).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => { setType(t); setTypeDropdownOpen(false); }}
                  style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#F9F6FF' }}
                >
                  <AppText style={{ fontFamily: 'Urbanist', fontSize: 14, color: '#100013' }}>{t}</AppText>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>

      <AppText style={[prStyles.inputLabel, { marginTop: 14 }]}>Description</AppText>
      <TextInput
        multiline
        numberOfLines={3}
        onChangeText={setDescription}
        placeholder="Describe what happens in this round…"
        placeholderTextColor="#C3BFC4"
        style={[prStyles.descInput, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
        value={description}
      />

      <View style={[rdStyles.datesRow, { zIndex: -1 }]}>
        <View style={rdStyles.dateField}>
          <AppText style={prStyles.inputLabel}>Start Date</AppText>
          <TextInput
            onChangeText={setStartDate}
            placeholder="DD Mon YY"
            placeholderTextColor="#C3BFC4"
            style={prStyles.descInput}
            value={startDate}
          />
        </View>
        <View style={rdStyles.dateField}>
          <AppText style={prStyles.inputLabel}>End Date</AppText>
          <TextInput
            onChangeText={setEndDate}
            placeholder="DD Mon YY"
            placeholderTextColor="#C3BFC4"
            style={prStyles.descInput}
            value={endDate}
          />
        </View>
      </View>

      <View style={{ marginTop: 16, backgroundColor: '#FAF5FF', padding: 16, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: -1 }}>
        <View style={{ flex: 1, paddingRight: 16 }}>
          <AppText style={{ fontFamily: 'Urbanist', fontSize: 16, fontWeight: '600', color: '#100013' }}>Submissions</AppText>
          <AppText style={{ fontFamily: 'Urbanist', fontSize: 14, color: '#7C737E', marginTop: 4 }}>Enable participants to upload files for this round.</AppText>
        </View>
        <Switch
          value={submissionsEnabled}
          onValueChange={setSubmissionsEnabled}
          trackColor={{ false: '#E2E8F0', true: '#D8B4FE' }}
          thumbColor={submissionsEnabled ? '#6949AA' : '#FFFFFF'}
        />
      </View>

      <Pressable onPress={handleSaveRound} style={rdStyles.saveBtn}>
        <AppText style={rdStyles.saveBtnText}>Save Round</AppText>
      </Pressable>
    </View>
  );
}

// ─── Prizes ───────────────────────────────────────────────────────────────────

function PrizesContent({
  hackathon,
  onSave,
}: {
  readonly hackathon: LiveHackathon;
  readonly onSave: (h: LiveHackathon) => void;
}) {
  const [prizeDescription, setPrizeDescription] = useState(hackathon.prizeDescription ?? '');
  const [participationCertificate, setParticipationCertificate] = useState(hackathon.participationCertificate ?? false);
  const [prizes, setPrizes] = useState<HackathonPrize[]>(hackathon.prizes ? [...hackathon.prizes] : []);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [editingPrize, setEditingPrize] = useState<HackathonPrize | null>(null);
  const descExceeds = prizeDescription.length > 100;

  function handleSave() {
    if (descExceeds) return;
    onSave({ ...hackathon, prizeDescription, participationCertificate, prizes });
  }

  function handleAddPrize(prize: HackathonPrize) {
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
          Mention awards and prizes, perks and other important details for this hackathon.
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

      <View style={rsStyles.card}>
        <View style={prStyles.cardHeaderRow}>
          <View>
            <AppText style={rsStyles.cardTitle}>Add Prizes</AppText>
            <AppText style={rsStyles.cardSub}>
              Create prizes and seamlessly send participation or winning certificates after your hackathon ends.
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
            <Pressable onPress={() => { setEditingPrize(prize); setShowPrizeModal(true); }} style={prStyles.prizeAction}>
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
  hackathon,
  onSave,
}: {
  readonly hackathon: LiveHackathon;
  readonly onSave: (h: LiveHackathon) => void;
}) {
  const [contacts, setContacts] = useState<HackathonContact[]>(hackathon.contacts ? [...hackathon.contacts] : []);
  const [attachments, setAttachments] = useState<HackathonAttachment[]>(hackathon.attachments ? [...hackathon.attachments] : []);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<HackathonContact | null>(null);

  function handleSaveContact(contact: HackathonContact) {
    let updatedContacts: HackathonContact[];
    if (editingContact) {
      updatedContacts = contacts.map((c) => (c.id === contact.id ? contact : c));
    } else {
      updatedContacts = [...contacts, contact];
    }
    setContacts(updatedContacts);
    setEditingContact(null);
    setShowContactModal(false);
    onSave({ ...hackathon, contacts: updatedContacts, attachments });
  }

  function handleDeleteContact(id: string) {
    const updatedContacts = contacts.filter((c) => c.id !== id);
    setContacts(updatedContacts);
    onSave({ ...hackathon, contacts: updatedContacts, attachments });
  }

  async function handleAddAttachment() {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      
      const file = res.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      } as any);

      const uploadRes = await apiClient.post<{ url: string }>('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newAttachment: HackathonAttachment = {
        id: String(Date.now()),
        name: file.name,
        url: uploadRes.data.url,
      };

      const updatedAttachments = [...attachments, newAttachment];
      setAttachments(updatedAttachments);
      onSave({ ...hackathon, contacts, attachments: updatedAttachments });
    } catch (e) {
      console.error('Failed to upload attachment', e);
    }
  }

  function handleDeleteAttachment(id: string) {
    const updatedAttachments = attachments.filter((a) => a.id !== id);
    setAttachments(updatedAttachments);
    onSave({ ...hackathon, contacts, attachments: updatedAttachments });
  }

  return (
    <ScrollView contentContainerStyle={aiStyles.content} showsVerticalScrollIndicator={false}>
      <AppText style={rsStyles.pageTitle}>Additional Info</AppText>

      <View style={rsStyles.card}>
        <View style={aiStyles.cardHeaderRow}>
          <View style={{ flex: 1 }}>
            <AppText style={rsStyles.cardTitle}>Contact Details</AppText>
            <AppText style={rsStyles.cardSub}>Add contact details of key persons related to the hackathon.</AppText>
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
              <Pressable onPress={() => { setEditingContact(contact); setShowContactModal(true); }} style={aiStyles.actionBtn}>
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
            <AppText style={rsStyles.cardSub}>Upload documents relevant to the hackathon (Rules, Brochure, etc.)</AppText>
          </View>
          <Pressable onPress={handleAddAttachment} style={aiStyles.addBtn}>
            <AppText style={aiStyles.addBtnText}>+ Upload Document</AppText>
          </Pressable>
        </View>
        <View style={rsStyles.cardDivider} />
        {attachments.length === 0 ? (
          <View style={aiStyles.attachmentsEmpty}>
            <AppText style={aiStyles.emptyText}>No attachments added yet.</AppText>
          </View>
        ) : (
          attachments.map((a) => (
            <View key={a.id} style={[aiStyles.contactRow, { alignItems: 'center' }]}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                <AppText style={[aiStyles.contactName, { marginLeft: 0 }]} numberOfLines={1}>{a.name}</AppText>
              </View>
              <Pressable onPress={() => handleDeleteAttachment(a.id)} style={aiStyles.actionBtn}>
                <AppText style={aiStyles.actionDelete}>Delete</AppText>
              </Pressable>
            </View>
          ))
        )}
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



// ─── Modals ───────────────────────────────────────────────────────────────────

interface ContactFormModalProps {
  readonly visible: boolean;
  readonly initialContact: HackathonContact | null;
  readonly onConfirm: (contact: HackathonContact) => void;
  readonly onClose: () => void;
}

function ContactFormModal({ visible, initialContact, onConfirm, onClose }: ContactFormModalProps) {
  const [name, setName] = useState(initialContact?.name ?? '');
  const [phone, setPhone] = useState(initialContact?.phone ?? '');
  const [email, setEmail] = useState(initialContact?.email ?? '');

  useEffect(() => {
    if (visible) {
      setName(initialContact?.name ?? '');
      setPhone(initialContact?.phone ?? '');
      setEmail(initialContact?.email ?? '');
    } else {
      setName('');
      setPhone('');
      setEmail('');
    }
  }, [visible, initialContact]);

  if (!visible) return null;

  function handleConfirm() {
    if (!name.trim()) return;
    onConfirm({ id: initialContact?.id ?? String(Date.now()), name: name.trim(), phone: phone.trim(), email: email.trim() });
  }

  return (
    <Modal onRequestClose={onClose} transparent visible={visible}>
      <View style={fmStyles.overlay}>
        <View style={fmStyles.sheet}>
          <View style={fmStyles.header}>
            <AppText style={fmStyles.headerTitle}>{initialContact ? 'Edit Contact' : 'Add Contact'}</AppText>
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
  readonly initialPrize: HackathonPrize | null;
  readonly onConfirm: (prize: HackathonPrize) => void;
  readonly onClose: () => void;
}

function PrizeFormModal({ visible, initialPrize, onConfirm, onClose }: PrizeFormModalProps) {
  const [title, setTitle] = useState(initialPrize?.title ?? '');
  const [amount, setAmount] = useState(initialPrize?.amount ?? '');

  useEffect(() => {
    if (visible) {
      setTitle(initialPrize?.title ?? '');
      setAmount(initialPrize?.amount ?? '');
    } else {
      setTitle('');
      setAmount('');
    }
  }, [visible, initialPrize]);

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
  const day = parts[0]; const month = parts[1];
  const year = parts[2] ? `20${parts[2]}` : '';
  const FULL_MONTHS: Record<string, string> = { Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June', Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December' };
  return `${day} ${month ? (FULL_MONTHS[month] ?? month) : ''} ${year}`.trim();
}

function formatLongDate(dateStr: string): string {
  if (!dateStr) return 'Select date';
  const parts = dateStr.split(' ');
  const day = parts[0]; const month = parts[1];
  const year = parts[2] ? `20${parts[2]}` : '';
  const FULL_MONTHS: Record<string, string> = { Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June', Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December' };
  return `${day} ${FULL_MONTHS[month ?? ''] ?? month} ${year}`.trim();
}

function parseDateStr(dateStr: string): Date | null {
  if (!dateStr || dateStr === 'Date TBD' || dateStr === 'Select date') return null;
  const MONTHS: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  const parts = dateStr.split(' ');
  const day = parseInt(parts[0] ?? '1', 10);
  if (isNaN(day)) return null;
  const month = parts[1] ? (MONTHS[parts[1]] ?? 0) : 0;
  const year = parts[2] ? 2000 + parseInt(parts[2], 10) : new Date().getFullYear();
  return new Date(year, month, day);
}

function parseTimeStr(timeStr: string): TimeValue {
  if (!timeStr) return { hour: '10', minute: '00', period: 'AM' };
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return { hour: '10', minute: '00', period: 'AM' };
  return { hour: match[1] ?? '10', minute: match[2] ?? '00', period: (match[3]?.toUpperCase() ?? 'AM') as 'AM' | 'PM' };
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
  bannerImage: { height: 180, width: '100%' },
  subTabRow: { flexDirection: 'row', gap: 24, paddingHorizontal: 16, paddingTop: 12 },
  subTab: { paddingBottom: 8 },
  subTabActive: { borderBottomColor: '#8359D5', borderBottomWidth: 2 },
  subTabLabel: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 14, fontWeight: '500' },
  subTabLabelActive: { color: '#100013', fontWeight: '600' },
  subTabDivider: { backgroundColor: '#E8E6E8', height: 1 },
  aboutSection: { gap: 20, padding: 16 },
  eventTitle: { color: '#100013', fontFamily: 'Aeonik Pro', fontSize: 28, fontWeight: '700', lineHeight: 34 },
  infoRow: { alignItems: 'center', flexDirection: 'row', gap: 16 },
  calBlock: { alignItems: 'center', backgroundColor: '#F5F3FF', borderRadius: 8, height: 56, justifyContent: 'center', width: 56 },
  calMonth: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
  calDay: { color: '#100013', fontFamily: 'Aeonik Pro', fontSize: 22, fontWeight: '700', lineHeight: 26 },
  infoText: { flex: 1, gap: 2 },
  infoMain: { color: '#100013', fontFamily: 'Urbanist', fontSize: 16, fontWeight: '600' },
  infoSub: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 13 },
  locationIconWrap: { alignItems: 'center', backgroundColor: '#F5F3FF', borderRadius: 8, height: 44, justifyContent: 'center', position: 'relative', width: 44 },
  locationPinHead: { borderColor: '#8359D5', borderRadius: 8, borderWidth: 1.5, height: 14, width: 14 },
  locationPinTail: { backgroundColor: '#8359D5', borderRadius: 1, height: 7, marginTop: -2, width: 2 },
  registrationCard: { backgroundColor: '#F5F3FF', borderRadius: 12, gap: 10, padding: 16 },
  registrationTitle: { color: '#100013', fontFamily: 'Aeonik Pro', fontSize: 16, fontWeight: '600' },
  registrationDivider: { backgroundColor: '#DDD6FE', height: 1 },
  registrationPrompt: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 13 },
  ticketOption: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#8359D5', borderRadius: 10, borderWidth: 1.5, flexDirection: 'row', justifyContent: 'space-between', padding: 14 },
  ticketLabel: { color: '#100013', fontFamily: 'Urbanist', fontSize: 15, fontWeight: '600' },
  ticketCheck: { alignItems: 'center', backgroundColor: '#8359D5', borderRadius: 20, height: 28, justifyContent: 'center', width: 28 },
  ticketCheckMark: { borderBottomColor: '#FFFFFF', borderBottomWidth: 2, borderLeftColor: '#FFFFFF', borderLeftWidth: 2, height: 7, marginTop: -3, transform: [{ rotate: '-45deg' }], width: 11 },
  sectionHeading: { color: '#100013', fontFamily: 'Aeonik Pro', fontSize: 22, fontWeight: '700', lineHeight: 28 },
  descriptionText: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 14, lineHeight: 22 },
  descriptionEmpty: { color: '#C3BFC4', fontFamily: 'Urbanist', fontSize: 14 },
  contactSection: { gap: 16, padding: 16 },
  contactCard: { alignItems: 'center', backgroundColor: '#F5F3FF', borderRadius: 12, flexDirection: 'row', gap: 14, padding: 14 },
  contactAvatar: { alignItems: 'center', backgroundColor: '#6949AA', borderRadius: 24, height: 48, justifyContent: 'center', width: 48 },
  contactInitial: { color: '#FFFFFF', fontFamily: 'Aeonik Pro', fontSize: 18, fontWeight: '700' },
  contactInfo: { flex: 1, gap: 2 },
  contactName: { color: '#100013', fontFamily: 'Urbanist', fontSize: 15, fontWeight: '700' },
  contactMeta: { color: '#7C737E', fontFamily: 'Urbanist', fontSize: 12 },
  placeholder: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  placeholderText: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 15 },
});

const bdStyles = StyleSheet.create({
  content: { paddingBottom: 48 },
  bannerWrap: { position: 'relative' },
  banner: { height: 160, width: '100%' },
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
  descPreview: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 12, lineHeight: 18 },
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
  scheduleLabel: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 12, fontWeight: '500', marginBottom: 6 },
  scheduleCard: { alignItems: 'center', backgroundColor: '#EDE9FF', borderRadius: 14, flexDirection: 'row', gap: 0, paddingHorizontal: 16, paddingVertical: 14 },
  scheduleDateText: { color: '#100013', flex: 1, fontFamily: 'Urbanist', fontSize: 18, fontWeight: '700' },
  scheduleDividerV: { backgroundColor: '#C4B5FD', height: 24, marginHorizontal: 14, width: 1 },
  scheduleTimeWrap: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  scheduleTimeText: { color: '#8359D5', fontFamily: 'Urbanist', fontSize: 16, fontWeight: '600' },
  clockIcon: { borderColor: '#8359D5', borderRadius: 8, borderWidth: 1.5, height: 16, width: 16 },
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
  cardHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  inputLabel: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 13, marginBottom: 8 },
  descInput: { borderColor: '#E8E6E8', borderRadius: 10, borderWidth: 1.5, color: '#100013', fontFamily: 'Urbanist', fontSize: 14, marginBottom: 6, paddingHorizontal: 14, paddingVertical: 12 },
  descInputError: { borderColor: '#EF4444' },
  errorRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginBottom: 4 },
  errorTriangle: { borderBottomColor: '#EF4444', borderBottomWidth: 8, borderLeftColor: 'transparent', borderLeftWidth: 5, borderRightColor: 'transparent', borderRightWidth: 5, height: 0, width: 0 },
  errorText: { color: '#EF4444', fontFamily: 'Urbanist', fontSize: 12 },
  certRow: { flexDirection: 'row', gap: 10 },
  certBtn: { borderColor: '#E8E6E8', borderRadius: 100, borderWidth: 1.5, paddingHorizontal: 24, paddingVertical: 8 },
  certBtnActive: { backgroundColor: '#8359D5', borderColor: '#8359D5' },
  certBtnInactive: { borderColor: '#E8E6E8' },
  certBtnText: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 14, fontWeight: '600' },
  certBtnTextActive: { color: '#FFFFFF' },
  certBtnTextInactive: { color: '#584D5A' },
  addPrizeBtn: { alignItems: 'center', borderColor: '#8359D5', borderRadius: 100, borderWidth: 1.5, alignSelf: 'flex-end', flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 12 },
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
  emptyText: { color: '#C3BFC4', fontFamily: 'Urbanist', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
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

const rdStyles = StyleSheet.create({
  emptyRounds: { alignItems: 'center', paddingVertical: 16 },
  emptyRoundsText: { color: '#9CA3AF', fontFamily: 'Urbanist', fontSize: 13, textAlign: 'center' },
  roundSummaryRow: { alignItems: 'center', borderTopColor: '#F3F4F6', borderTopWidth: 1, flexDirection: 'row', gap: 10, paddingVertical: 10 },
  roundBadgeSm: { alignItems: 'center', backgroundColor: '#6949AA', borderRadius: 12, height: 24, justifyContent: 'center', width: 24 },
  roundBadgeSmText: { color: '#FFFFFF', fontFamily: 'Urbanist', fontSize: 11, fontWeight: '700' },
  roundSummaryTitle: { color: '#100013', flex: 1, fontFamily: 'Urbanist', fontSize: 14, fontWeight: '500' },
  roundHeader: { alignItems: 'center', flexDirection: 'row', gap: 10, marginBottom: 12 },
  roundBadge: { alignItems: 'center', backgroundColor: '#6949AA', borderRadius: 16, height: 32, justifyContent: 'center', width: 32 },
  roundBadgeText: { color: '#FFFFFF', fontFamily: 'Aeonik Pro', fontSize: 14, fontWeight: '700' },
  datesRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  dateField: { flex: 1 },
  saveBtn: { alignItems: 'center', backgroundColor: '#42007A', borderRadius: 10, marginTop: 16, paddingVertical: 14 },
  saveBtnText: { color: '#FFFFFF', fontFamily: 'Urbanist', fontSize: 14, fontWeight: '700' },
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
