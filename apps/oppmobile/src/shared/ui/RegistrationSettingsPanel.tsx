import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from './AppText';

export type EligibilityKey = 'everyone' | 'school' | 'college' | 'freshers' | 'professionals';
export type QuestionType = 'Text' | 'Option' | 'Link' | 'Number' | 'Attachments' | 'Terms & Conditions';

export interface RegistrationQuestion {
  id: string;
  type: QuestionType;
  question: string;
  required: boolean;
  responseLength?: 'Short Answer' | 'Long Answer';
  options?: string[];
  selectionType?: 'Single Select' | 'Multi Select';
}

const ELIGIBILITY_OPTIONS: { key: EligibilityKey; label: string; sub: string }[] = [
  { key: 'everyone', label: 'Everyone can apply', sub: 'All applicants' },
  { key: 'school', label: 'School students', sub: 'Up to grade 12' },
  { key: 'college', label: 'College students', sub: 'UG / PG Students' },
  { key: 'freshers', label: 'Freshers', sub: '0-1 Year Experience' },
  { key: 'professionals', label: 'Professionals', sub: '1+ Year Experience' },
];

interface RegistrationSettingsPanelProps {
  readonly eligibleCandidates: readonly EligibilityKey[];
  readonly registrationStartDate?: string;
  readonly registrationStartTime?: string;
  readonly registrationDeadlineDate?: string;
  readonly registrationDeadlineTime?: string;
  readonly maxAttendees: string;
  readonly additionalQuestions?: readonly RegistrationQuestion[];
  readonly onChange: (updates: Partial<RegistrationSettingsPanelProps>) => void;
  readonly onSave?: () => void;
  readonly onPressTimelineField?: (field: 'registrationStartDate' | 'registrationStartTime' | 'registrationDeadlineDate' | 'registrationDeadlineTime') => void;
}

export function RegistrationSettingsPanel({
  eligibleCandidates,
  registrationStartDate = '',
  registrationStartTime = '',
  registrationDeadlineDate = '',
  registrationDeadlineTime = '',
  maxAttendees,
  additionalQuestions = [],
  onChange,
  onSave,
  onPressTimelineField,
}: RegistrationSettingsPanelProps) {
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<RegistrationQuestion | null>(null);

  function toggleEligibility(key: EligibilityKey) {
    const current = [...eligibleCandidates];
    if (current.includes(key)) {
      onChange({ eligibleCandidates: current.filter((k) => k !== key) });
    } else {
      current.push(key);
      onChange({ eligibleCandidates: current });
    }
  }

  function handleSaveQuestion(q: RegistrationQuestion) {
    const current = [...additionalQuestions];
    const existingIndex = current.findIndex((x) => x.id === q.id);
    if (existingIndex >= 0) {
      current[existingIndex] = q;
    } else {
      current.push(q);
    }
    onChange({ additionalQuestions: current });
    setShowQuestionModal(false);
  }

  function handleDeleteQuestion(id: string) {
    const current = additionalQuestions.filter((q) => q.id !== id);
    onChange({ additionalQuestions: current });
    setShowQuestionModal(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Who Can Register */}
      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>Who Can Register</AppText>
        <AppText style={styles.sectionSub}>Select the type(s) of eligible candidates</AppText>
        <View style={styles.cardsRow}>
          {ELIGIBILITY_OPTIONS.map((opt) => {
            const selected = eligibleCandidates.includes(opt.key);
            return (
              <Pressable
                key={opt.key}
                onPress={() => toggleEligibility(opt.key)}
                style={[styles.eligibilityCard, selected && styles.eligibilityCardSelected]}
              >
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected && <View style={styles.checkMark} />}
                </View>
                <View>
                  <AppText style={styles.eligibilityLabel}>{opt.label}</AppText>
                  <AppText style={styles.eligibilitySubLabel}>{opt.sub}</AppText>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Registration Timeline */}
      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>Registration Timeline</AppText>
        <AppText style={styles.sectionSub}>Start and end date of registration can be changed</AppText>
        
        <View style={styles.timelineRow}>
          <Pressable style={styles.timelineCard}>
            <AppText style={styles.timelineLabel}>Registration Start</AppText>
            <View style={styles.timelineValues}>
              <Pressable onPress={() => onPressTimelineField?.('registrationStartDate')}>
                <AppText style={styles.timelineText}>{registrationStartDate || 'Select Date'}</AppText>
              </Pressable>
              <View style={styles.timelineDivider} />
              <Pressable onPress={() => onPressTimelineField?.('registrationStartTime')}>
                <AppText style={styles.timelineText}>{registrationStartTime || 'Time'}</AppText>
              </Pressable>
            </View>
          </Pressable>
          <Pressable style={styles.timelineCard}>
            <AppText style={styles.timelineLabel}>Registration Deadline</AppText>
            <View style={styles.timelineValues}>
              <Pressable onPress={() => onPressTimelineField?.('registrationDeadlineDate')}>
                <AppText style={styles.timelineText}>{registrationDeadlineDate || 'Select Date'}</AppText>
              </Pressable>
              <View style={styles.timelineDivider} />
              <Pressable onPress={() => onPressTimelineField?.('registrationDeadlineTime')}>
                <AppText style={styles.timelineText}>{registrationDeadlineTime || 'Time'}</AppText>
              </Pressable>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Max Number Of User */}
      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>Max Number Of User</AppText>
        <AppText style={styles.sectionSub}>Restrict the number of teams registering for event</AppText>
        
        <View style={styles.maxUsersRow}>
          <Pressable
            onPress={() => onChange({ maxAttendees: '' })}
            style={[styles.noLimitBtn, maxAttendees === '' && styles.noLimitBtnActive]}
          >
            <AppText style={styles.infinityIcon}>∞</AppText>
            <AppText style={[styles.noLimitText, maxAttendees === '' && styles.noLimitTextActive]}>
              No Limit
            </AppText>
          </Pressable>
          <TextInput
            keyboardType="number-pad"
            onChangeText={(v) => onChange({ maxAttendees: v })}
            placeholder="Limit (e.g. 500)"
            placeholderTextColor="#9C8DAA"
            style={[styles.maxInput, maxAttendees !== '' && styles.maxInputActive]}
            value={maxAttendees}
          />
        </View>
      </View>

      {/* Basic Questions */}
      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>Basic Questions</AppText>
        <AppText style={styles.sectionSub}>Filled by all team members</AppText>
        
        {['Name', 'Email', 'Mobile Number', 'Gender', 'Current College / Organization', 'User Type'].map((q) => (
          <View key={q} style={[styles.questionCard, { opacity: 0.9 }]}>
            <View style={styles.dragHandle}>
              <View style={styles.dragLine} />
              <View style={styles.dragLine} />
              <View style={styles.dragLine} />
            </View>
            <AppText style={styles.questionText}>{q}</AppText>
            <View style={{ flex: 1 }} />
            <View style={styles.requiredPill}>
              <AppText style={styles.requiredPillText}>Required</AppText>
            </View>
            <View style={[styles.checkCircle, styles.checkCircleActive]}>
              <View style={styles.checkMarkWhite} />
            </View>
          </View>
        ))}
      </View>

      {/* Additional Questions */}
      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>Additional Questions</AppText>
        <AppText style={styles.sectionSub}>Filled by all team members</AppText>
        
        {additionalQuestions.map((q) => (
          <Pressable 
            key={q.id} 
            style={styles.questionCard}
            onPress={() => {
              setEditingQuestion(q);
              setShowQuestionModal(true);
            }}
          >
            <View style={styles.dragHandle}>
              <View style={styles.dragLine} />
              <View style={styles.dragLine} />
              <View style={styles.dragLine} />
            </View>
            <AppText style={styles.questionText}>{q.question}</AppText>
            <View style={{ flex: 1 }} />
            <View style={styles.requiredPill}>
              <AppText style={styles.requiredPillText}>{q.required ? 'Required' : 'Optional'}</AppText>
            </View>
            <View style={[styles.checkCircle, q.required && styles.checkCircleActive]}>
              {q.required && <View style={styles.checkMarkWhite} />}
            </View>
          </Pressable>
        ))}

        <Pressable
          onPress={() => {
            setEditingQuestion(null);
            setShowQuestionModal(true);
          }}
          style={styles.addQuestionBtn}
        >
          <View style={styles.addQuestionPlusWrap}>
            <AppText style={styles.addQuestionPlus}>+</AppText>
          </View>
          <AppText style={styles.addQuestionText}>Add New Question</AppText>
        </Pressable>
      </View>

      {onSave && (
        <Pressable onPress={onSave} style={styles.updateBtn}>
          <AppText style={styles.updateBtnText}>Update Event</AppText>
        </Pressable>
      )}

      {showQuestionModal && (
        <NewQuestionModal
          initialData={editingQuestion}
          onClose={() => setShowQuestionModal(false)}
          onSave={handleSaveQuestion}
          onDelete={handleDeleteQuestion}
        />
      )}
    </ScrollView>
  );
}

// ── New Question Modal ───────────────────────────────────────────────────────

function NewQuestionModal({
  initialData,
  onClose,
  onSave,
  onDelete,
}: {
  readonly initialData: RegistrationQuestion | null;
  readonly onClose: () => void;
  readonly onSave: (q: RegistrationQuestion) => void;
  readonly onDelete: (id: string) => void;
}) {
  const [type, setType] = useState<QuestionType>(initialData?.type ?? 'Text');
  const [question, setQuestion] = useState(initialData?.question ?? '');
  const [required, setRequired] = useState(initialData?.required ?? false);
  const [responseLength, setResponseLength] = useState<'Short Answer' | 'Long Answer'>(
    initialData?.responseLength ?? 'Short Answer'
  );
  const [selectionType, setSelectionType] = useState<'Single Select' | 'Multi Select'>(
    initialData?.selectionType ?? 'Single Select'
  );
  const [options, setOptions] = useState<string[]>(initialData?.options ?? []);
  const [newOptionText, setNewOptionText] = useState('');
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  const QUESTION_TYPES: QuestionType[] = [
    'Text',
    'Option',
    'Link',
    'Number',
    'Attachments',
    'Terms & Conditions',
  ];

  function handleUpdate() {
    onSave({
      id: initialData?.id ?? String(Date.now()),
      type,
      question,
      required,
      ...(type === 'Text' ? { responseLength } : {}),
      ...(type === 'Option' ? { selectionType, options } : {}),
    });
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent>
      <View style={modalStyles.overlay}>
        <Pressable onPress={onClose} style={StyleSheet.absoluteFillObject} />
        <View style={modalStyles.modal}>
          <View style={modalStyles.handle} />
          <AppText style={modalStyles.title}>New Question</AppText>

          {/* Type Dropdown */}
          <AppText style={modalStyles.label}>Question Type</AppText>
          <View style={modalStyles.dropdownContainer}>
            <Pressable
              onPress={() => setTypeDropdownOpen(!typeDropdownOpen)}
              style={[modalStyles.dropdownBtn, typeDropdownOpen && modalStyles.dropdownBtnOpen]}
            >
              <AppText style={modalStyles.dropdownValue}>{type}</AppText>
              <View style={[modalStyles.chevron, typeDropdownOpen && modalStyles.chevronUp]} />
            </Pressable>
            {typeDropdownOpen && (
              <View style={modalStyles.dropdownList}>
                {QUESTION_TYPES.map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => {
                      setType(t);
                      setTypeDropdownOpen(false);
                    }}
                    style={modalStyles.dropdownItem}
                  >
                    <AppText style={modalStyles.dropdownItemText}>{t}</AppText>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Question Input */}
          <AppText style={modalStyles.label}>Question</AppText>
          <TextInput
            onChangeText={setQuestion}
            placeholder="Type it here"
            placeholderTextColor="#C3BFC4"
            style={modalStyles.input}
            value={question}
          />

          {/* Type Specific Fields */}
          {type === 'Text' && (
            <View style={modalStyles.typeFieldsRow}>
              <AppText style={modalStyles.subLabel}>Response Length</AppText>
              <View style={modalStyles.toggleRow}>
                <Pressable
                  onPress={() => setResponseLength('Short Answer')}
                  style={[modalStyles.toggleBtn, responseLength === 'Short Answer' && modalStyles.toggleBtnActive]}
                >
                  <AppText style={[modalStyles.toggleText, responseLength === 'Short Answer' && modalStyles.toggleTextActive]}>
                    Short Answer
                  </AppText>
                </Pressable>
                <Pressable
                  onPress={() => setResponseLength('Long Answer')}
                  style={[modalStyles.toggleBtn, responseLength === 'Long Answer' && modalStyles.toggleBtnActive]}
                >
                  <AppText style={[modalStyles.toggleText, responseLength === 'Long Answer' && modalStyles.toggleTextActive]}>
                    Long Answer
                  </AppText>
                </Pressable>
              </View>
            </View>
          )}

          {type === 'Option' && (
            <View style={modalStyles.typeFieldsRow}>
              <AppText style={modalStyles.subLabel}>Options</AppText>
              <View style={modalStyles.optionsList}>
                {options.map((opt, i) => (
                  <View key={i} style={modalStyles.optionPill}>
                    <AppText style={modalStyles.optionPillText}>{opt}</AppText>
                    <Pressable 
                      onPress={() => setOptions(options.filter((_, idx) => idx !== i))}
                      style={modalStyles.optionPillClose}
                    >
                      <View style={[modalStyles.crossLine, { transform: [{ rotate: '45deg' }] }]} />
                      <View style={[modalStyles.crossLine, { transform: [{ rotate: '-45deg' }] }]} />
                    </Pressable>
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <TextInput
                  value={newOptionText}
                  onChangeText={setNewOptionText}
                  placeholder="Add an option"
                  style={[modalStyles.input, { flex: 1, marginBottom: 0, paddingVertical: 8 }]}
                  onSubmitEditing={() => {
                    if (newOptionText.trim()) {
                      setOptions([...options, newOptionText.trim()]);
                      setNewOptionText('');
                    }
                  }}
                />
                <Pressable
                  onPress={() => {
                    if (newOptionText.trim()) {
                      setOptions([...options, newOptionText.trim()]);
                      setNewOptionText('');
                    }
                  }}
                  style={{ marginLeft: 8, backgroundColor: '#392160', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 }}
                >
                  <AppText style={{ color: '#fff', fontWeight: 'bold' }}>Add</AppText>
                </Pressable>
              </View>
              <AppText style={[modalStyles.subLabel, { marginTop: 12 }]}>Selection Type</AppText>
              <View style={modalStyles.toggleRow}>
                <Pressable
                  onPress={() => setSelectionType('Single Select')}
                  style={[modalStyles.toggleBtn, selectionType === 'Single Select' && modalStyles.toggleBtnActive]}
                >
                  <AppText style={[modalStyles.toggleText, selectionType === 'Single Select' && modalStyles.toggleTextActive]}>
                    Single Select
                  </AppText>
                </Pressable>
                <Pressable
                  onPress={() => setSelectionType('Multi Select')}
                  style={[modalStyles.toggleBtn, selectionType === 'Multi Select' && modalStyles.toggleBtnActive]}
                >
                  <AppText style={[modalStyles.toggleText, selectionType === 'Multi Select' && modalStyles.toggleTextActive]}>
                    Multi Select
                  </AppText>
                </Pressable>
              </View>
            </View>
          )}

          <View style={{ flex: 1 }} />

          {/* Required Switch */}
          <View style={modalStyles.requiredRow}>
            <AppText style={modalStyles.requiredLabel}>Required</AppText>
            <Pressable
              onPress={() => setRequired(!required)}
              style={[modalStyles.switchTrack, required && modalStyles.switchTrackActive]}
            >
              <View style={[modalStyles.switchThumb, required && modalStyles.switchThumbActive]} />
            </Pressable>
          </View>

          {initialData ? (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable onPress={() => onDelete(initialData.id)} style={[modalStyles.updateBtn, { flex: 1, backgroundColor: '#FFF5F5', borderColor: '#FFEBEE' }]}>
                <AppText style={[modalStyles.updateBtnText, { color: '#E53935' }]}>Delete</AppText>
              </Pressable>
              <Pressable onPress={handleUpdate} style={[modalStyles.updateBtn, { flex: 1 }]}>
                <AppText style={modalStyles.updateBtnText}>Update</AppText>
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={handleUpdate} style={modalStyles.updateBtn}>
              <AppText style={modalStyles.updateBtnText}>Add Question</AppText>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#C3BFC4',
    borderRadius: 2,
    height: 4,
    marginBottom: 20,
    width: 40,
  },
  title: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  label: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 11,
    marginBottom: 6,
  },
  dropdownContainer: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 10,
  },
  dropdownBtn: {
    alignItems: 'center',
    borderColor: '#C3BFC4',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    height: 44,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  dropdownBtnOpen: {
    borderColor: '#8359D5',
  },
  dropdownValue: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 14,
  },
  chevron: {
    borderColor: '#584D5A',
    borderRightWidth: 1.5,
    borderTopWidth: 1.5,
    height: 8,
    transform: [{ rotate: '135deg' }],
    width: 8,
  },
  chevronUp: {
    transform: [{ rotate: '-45deg' }],
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C3BFC4',
    borderRadius: 12,
    borderWidth: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 48,
    zIndex: 20,
  },
  dropdownItem: {
    borderBottomColor: '#F3F4F6',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemText: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 14,
  },
  input: {
    borderColor: '#C3BFC4',
    borderRadius: 20,
    borderWidth: 1,
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 14,
    height: 44,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  typeFieldsRow: {
    marginBottom: 24,
  },
  subLabel: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 11,
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 100,
    flex: 1,
    height: 36,
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#8359D5',
  },
  toggleText: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  optionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    alignItems: 'center',
    backgroundColor: '#8359D5',
    borderRadius: 100,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  optionPillText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 13,
  },
  optionPillClose: {
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  crossLine: {
    backgroundColor: '#FFFFFF',
    height: 8,
    position: 'absolute',
    width: 1.5,
  },
  requiredRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 20,
  },
  requiredLabel: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 12,
  },
  switchTrack: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    padding: 2,
    width: 44,
  },
  switchTrackActive: {
    backgroundColor: '#10B981',
  },
  switchThumb: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    height: 20,
    width: 20,
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  updateBtn: {
    alignItems: 'center',
    backgroundColor: '#392160',
    borderRadius: 100,
    height: 48,
    justifyContent: 'center',
  },
  updateBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 15,
    fontWeight: '600',
  },
});

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSub: {
    color: '#7C737E',
    fontFamily: 'Urbanist',
    fontSize: 13,
    marginBottom: 16,
  },
  cardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  eligibilityCard: {
    alignItems: 'center',
    borderColor: '#E8E6E8',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    width: '100%',
  },
  eligibilityCardSelected: {
    borderColor: '#8359D5',
  },
  checkbox: {
    alignItems: 'center',
    borderColor: '#C3BFC4',
    borderRadius: 12,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkboxSelected: {
    backgroundColor: '#8359D5',
    borderColor: '#8359D5',
  },
  checkMark: {
    borderColor: '#FFFFFF',
    borderRightWidth: 2,
    borderTopWidth: 2,
    height: 10,
    transform: [{ rotate: '135deg' }],
    width: 5,
  },
  checkMarkWhite: {
    borderColor: '#FFFFFF',
    borderRightWidth: 1.5,
    borderTopWidth: 1.5,
    height: 8,
    transform: [{ rotate: '135deg' }],
    width: 4,
  },
  eligibilityLabel: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  eligibilitySubLabel: {
    color: '#7C737E',
    fontFamily: 'Urbanist',
    fontSize: 13,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineCard: {
    backgroundColor: '#FBF9FF',
    borderColor: '#E8E0F5',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    padding: 12,
  },
  timelineLabel: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 11,
    marginBottom: 12,
  },
  timelineValues: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  timelineText: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '500',
  },
  timelineDivider: {
    backgroundColor: '#C3BFC4',
    height: 12,
    width: 1,
  },
  maxUsersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  noLimitBtn: {
    alignItems: 'center',
    borderColor: '#E8E6E8',
    borderRadius: 100,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    height: 44,
    paddingHorizontal: 16,
  },
  noLimitBtnActive: {
    backgroundColor: '#FBF9FF',
    borderColor: '#8359D5',
  },
  infinityIcon: {
    color: '#584D5A',
    fontSize: 18,
  },
  noLimitText: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '500',
  },
  noLimitTextActive: {
    color: '#8359D5',
  },
  maxInput: {
    borderColor: '#E8E6E8',
    borderRadius: 100,
    borderWidth: 1,
    color: '#100013',
    flex: 1,
    fontFamily: 'Urbanist',
    fontSize: 14,
    height: 44,
    paddingHorizontal: 16,
  },
  maxInputActive: {
    borderColor: '#8359D5',
  },
  questionCard: {
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 8,
    padding: 12,
  },
  dragHandle: {
    gap: 3,
    marginRight: 12,
  },
  dragLine: {
    backgroundColor: '#9C8DAA',
    borderRadius: 1,
    height: 2,
    width: 16,
  },
  questionText: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 14,
  },
  requiredPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  requiredPillText: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 12,
  },
  checkCircle: {
    alignItems: 'center',
    borderColor: '#C3BFC4',
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    marginLeft: 12,
    width: 20,
  },
  checkCircleActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  addQuestionBtn: {
    alignItems: 'center',
    backgroundColor: '#392160',
    borderRadius: 100,
    flexDirection: 'row',
    gap: 8,
    height: 44,
    marginTop: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  addQuestionPlusWrap: {
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  addQuestionPlus: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 16,
  },
  addQuestionText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '500',
  },
  updateBtn: {
    alignItems: 'center',
    backgroundColor: '#392160',
    borderRadius: 100,
    height: 48,
    justifyContent: 'center',
    marginTop: 16,
  },
  updateBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 15,
    fontWeight: '600',
  },
});
