import { useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';

import { AppText } from '../../../../../shared/ui';
import { mStyles as s } from './HackathonFormModals.styles';

// ── Shared bottom sheet wrapper ───────────────────────────────────────────────

interface SheetProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly children: React.ReactNode;
}

function Sheet({ visible, onClose, children }: SheetProps) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={{ flex: 1 }}>
        <Pressable onPress={onClose} style={s.backdrop} />
        <View style={s.sheet}>
          <View style={s.handle} />
          {children}
        </View>
      </View>
    </Modal>
  );
}

// ── Date Picker ───────────────────────────────────────────────────────────────

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDate(d: Date) {
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

interface DatePickerProps {
  readonly visible: boolean;
  readonly value: Date | null;
  readonly onConfirm: (d: Date) => void;
  readonly onClose: () => void;
  readonly label?: string;
}

export function DatePickerModal({ visible, value, onConfirm, onClose, label = 'Select date' }: DatePickerProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [pending, setPending] = useState<Date | null>(value);

  const totalDays = daysInMonth(viewYear, viewMonth);
  const startDow = firstDayOfWeek(viewYear, viewMonth);

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  function isToday(day: number) {
    return day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
  }
  function isSelected(day: number) {
    if (!pending) return false;
    return day === pending.getDate() && viewMonth === pending.getMonth() && viewYear === pending.getFullYear();
  }

  return (
    <Sheet onClose={onClose} visible={visible}>
      {/* Header */}
      <View style={s.calHeader}>
        <AppText style={s.calHeaderLabel}>{label}</AppText>
        <AppText style={s.calHeaderDate}>
          {pending ? formatDate(pending) : `${DAY_NAMES[today.getDay()]}, ${today.getDate()} ${MONTH_NAMES[viewMonth]}`}
        </AppText>
      </View>

      {/* Month navigation */}
      <View style={s.calMonthRow}>
        <Pressable onPress={prevMonth} style={s.calNavBtn}>
          <View style={[s.calNavChevron, { transform: [{ rotate: '45deg' }] }]} />
        </Pressable>
        <AppText style={s.calMonthLabel}>{MONTH_NAMES[viewMonth]} {viewYear}</AppText>
        <Pressable onPress={nextMonth} style={s.calNavBtn}>
          <View style={[s.calNavChevron, { transform: [{ rotate: '-135deg' }] }]} />
        </Pressable>
      </View>

      {/* Day headers */}
      <View style={s.calDayHeaders}>
        {DAY_LABELS.map((l, i) => (
          <View key={i} style={s.calDayHeader}>
            <AppText style={s.calDayHeaderText}>{l}</AppText>
          </View>
        ))}
      </View>

      {/* Weeks */}
      {weeks.map((week, wi) => (
        <View key={wi} style={s.calWeekRow}>
          {week.map((day, di) => (
            <Pressable
              key={di}
              onPress={() => day ? setPending(new Date(viewYear, viewMonth, day)) : undefined}
              style={s.calDayCell}
            >
              {day ? (
                <View style={[s.calDayInner, isSelected(day) && s.calDaySelected, !isSelected(day) && isToday(day) && s.calDayToday]}>
                  <AppText style={[s.calDayText, isSelected(day) && s.calDayTextSelected, !isSelected(day) && isToday(day) && s.calDayTextToday]}>
                    {day}
                  </AppText>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      ))}

      {/* Actions */}
      <View style={s.calActionsRow}>
        <Pressable onPress={() => { setPending(null); }} style={s.calTextBtn}>
          <AppText style={s.calTextBtnLabel}>Clear</AppText>
        </Pressable>
        <Pressable onPress={onClose} style={s.calTextBtn}>
          <AppText style={s.calTextBtnLabel}>Cancel</AppText>
        </Pressable>
        <Pressable
          onPress={() => { if (pending) onConfirm(pending); onClose(); }}
          style={s.calTextBtn}
        >
          <AppText style={s.calTextBtnLabel}>OK</AppText>
        </Pressable>
      </View>
    </Sheet>
  );
}

// ── Location Picker ───────────────────────────────────────────────────────────

export type LocationMode = 'online' | 'offline';

interface LocationProps {
  readonly visible: boolean;
  readonly mode: LocationMode;
  readonly value: string;
  readonly onConfirm: (mode: LocationMode, value: string) => void;
  readonly onClose: () => void;
}

export function LocationModal({ visible, mode, value, onConfirm, onClose }: LocationProps) {
  const [localMode, setLocalMode] = useState<LocationMode>(mode);
  const [localValue, setLocalValue] = useState(value);

  return (
    <Sheet onClose={onClose} visible={visible}>
      <AppText style={s.sheetTitle}>Add Hackathon Location</AppText>

      {/* Event mode chips */}
      <AppText style={s.fieldLabel}>Event Mode*</AppText>
      <View style={s.chipsRow}>
        <Pressable onPress={() => setLocalMode('online')} style={localMode === 'online' ? s.chipActive : s.chipInactive}>
          <AppText style={localMode === 'online' ? s.chipActiveText : s.chipInactiveText}>Online</AppText>
        </Pressable>
        <Pressable onPress={() => setLocalMode('offline')} style={localMode === 'offline' ? s.chipActive : s.chipInactive}>
          <AppText style={localMode === 'offline' ? s.chipActiveText : s.chipInactiveText}>Offline</AppText>
        </Pressable>
      </View>

      {/* Input */}
      <AppText style={s.fieldLabel}>{localMode === 'online' ? 'Meet Link' : 'Venue Address*'}</AppText>
      <TextInput
        onChangeText={setLocalValue}
        placeholder={localMode === 'online' ? 'Paste meeting link here' : 'Enter venue address'}
        placeholderTextColor="#7C737E"
        style={s.textField}
        value={localValue}
      />

      <Pressable onPress={() => { onConfirm(localMode, localValue); onClose(); }} style={s.confirmBtn}>
        <AppText style={s.confirmBtnText}>Confirm</AppText>
      </Pressable>
    </Sheet>
  );
}

// ── Time Picker ───────────────────────────────────────────────────────────────

export interface TimeValue {
  hour: string;
  minute: string;
  period: 'AM' | 'PM';
}

interface TimePickerProps {
  readonly visible: boolean;
  readonly value: TimeValue;
  readonly onConfirm: (t: TimeValue) => void;
  readonly onClose: () => void;
}

export function TimePickerModal({ visible, value, onConfirm, onClose }: TimePickerProps) {
  const [local, setLocal] = useState<TimeValue>(value);
  const [activeField, setActiveField] = useState<'hour' | 'minute'>('hour');

  function clampHour(v: string) {
    const n = parseInt(v, 10);
    if (isNaN(n)) return '';
    return String(Math.min(12, Math.max(1, n))).padStart(2, '0');
  }
  function clampMinute(v: string) {
    const n = parseInt(v, 10);
    if (isNaN(n)) return '';
    return String(Math.min(59, Math.max(0, n))).padStart(2, '0');
  }

  return (
    <Sheet onClose={onClose} visible={visible}>
      <AppText style={[s.sheetTitle, { marginBottom: 12 }]}>Select Time</AppText>
      <View style={s.timePicker}>
        <AppText style={s.timePickerTitle}>Enter time</AppText>

        <View style={s.timeInputRow}>
          {/* Hour */}
          <Pressable onPress={() => setActiveField('hour')} style={[s.timeInputBox, activeField === 'hour' ? s.timeInputBoxActive : s.timeInputBoxInactive]}>
            <TextInput
              keyboardType="number-pad"
              maxLength={2}
              onChangeText={(v) => setLocal((p) => ({ ...p, hour: v }))}
              onBlur={() => setLocal((p) => ({ ...p, hour: clampHour(p.hour) }))}
              onFocus={() => setActiveField('hour')}
              style={[s.timeInputText, activeField === 'hour' ? s.timeInputTextActive : s.timeInputTextInactive]}
              value={local.hour}
            />
          </Pressable>

          <AppText style={s.timeSep}>:</AppText>

          {/* Minute */}
          <Pressable onPress={() => setActiveField('minute')} style={[s.timeInputBox, activeField === 'minute' ? s.timeInputBoxActive : s.timeInputBoxInactive]}>
            <TextInput
              keyboardType="number-pad"
              maxLength={2}
              onChangeText={(v) => setLocal((p) => ({ ...p, minute: v }))}
              onBlur={() => setLocal((p) => ({ ...p, minute: clampMinute(p.minute) }))}
              onFocus={() => setActiveField('minute')}
              style={[s.timeInputText, activeField === 'minute' ? s.timeInputTextActive : s.timeInputTextInactive]}
              value={local.minute}
            />
          </Pressable>

          {/* AM / PM */}
          <View style={s.periodSelector}>
            <Pressable
              onPress={() => setLocal((p) => ({ ...p, period: 'AM' }))}
              style={[s.periodBtn, local.period === 'AM' && s.periodBtnActive]}
            >
              <AppText style={s.periodBtnText}>AM</AppText>
            </Pressable>
            <View style={s.periodDivider} />
            <Pressable
              onPress={() => setLocal((p) => ({ ...p, period: 'PM' }))}
              style={[s.periodBtn, local.period === 'PM' && s.periodBtnActive]}
            >
              <AppText style={s.periodBtnText}>PM</AppText>
            </Pressable>
          </View>
        </View>

        <View style={s.timeActionsRow}>
          <Pressable onPress={onClose} style={s.timeTextBtn}>
            <AppText style={s.timeTextBtnLabel}>Cancel</AppText>
          </Pressable>
          <Pressable
            onPress={() => { onConfirm({ ...local, hour: clampHour(local.hour), minute: clampMinute(local.minute) }); onClose(); }}
            style={s.timeTextBtn}
          >
            <AppText style={s.timeTextBtnLabel}>OK</AppText>
          </Pressable>
        </View>
      </View>
    </Sheet>
  );
}

// ── Description ───────────────────────────────────────────────────────────────

interface DescriptionProps {
  readonly visible: boolean;
  readonly value: string;
  readonly onConfirm: (v: string) => void;
  readonly onClose: () => void;
}

export function DescriptionModal({ visible, value, onConfirm, onClose }: DescriptionProps) {
  const [local, setLocal] = useState(value);

  return (
    <Sheet onClose={onClose} visible={visible}>
      <AppText style={s.sheetTitle}>Add Description</AppText>
      <AppText style={s.fieldLabel}>Main Body</AppText>
      <TextInput
        multiline
        onChangeText={setLocal}
        placeholder="Tell participants everything they need to know about this hackathon…"
        placeholderTextColor="#7C737E"
        style={s.textArea}
        value={local}
      />
      <Pressable onPress={() => { onConfirm(local); onClose(); }} style={s.confirmBtn}>
        <AppText style={s.confirmBtnText}>Confirm</AppText>
      </Pressable>
    </Sheet>
  );
}

// ── Max Attendees ─────────────────────────────────────────────────────────────

interface AttendeesProps {
  readonly visible: boolean;
  readonly value: string;
  readonly onConfirm: (v: string) => void;
  readonly onClose: () => void;
}

export function AttendeesModal({ visible, value, onConfirm, onClose }: AttendeesProps) {
  const [local, setLocal] = useState(value);

  return (
    <Sheet onClose={onClose} visible={visible}>
      <AppText style={s.sheetTitle}>Registration Limit</AppText>
      <AppText style={s.fieldLabel}>Max Participants*</AppText>
      <TextInput
        keyboardType="number-pad"
        onChangeText={setLocal}
        placeholder="e.g. 500 (leave blank for unlimited)"
        placeholderTextColor="#7C737E"
        style={s.textField}
        value={local}
      />
      <AppText style={s.fieldHint}>Leave blank to allow unlimited registrations</AppText>
      <Pressable onPress={() => { onConfirm(local); onClose(); }} style={s.confirmBtn}>
        <AppText style={s.confirmBtnText}>Confirm</AppText>
      </Pressable>
    </Sheet>
  );
}

// ── Organizer Name ────────────────────────────────────────────────────────────

interface OrganizerProps {
  readonly visible: boolean;
  readonly value: string;
  readonly onConfirm: (v: string) => void;
  readonly onClose: () => void;
}

export function OrganizerNameModal({ visible, value, onConfirm, onClose }: OrganizerProps) {
  const [local, setLocal] = useState(value);

  return (
    <Sheet onClose={onClose} visible={visible}>
      <AppText style={s.sheetTitle}>Organization</AppText>
      <AppText style={s.fieldLabel}>Organization Name*</AppText>
      <TextInput
        onChangeText={setLocal}
        placeholder="Who is organizing this hackathon?"
        placeholderTextColor="#7C737E"
        style={s.textField}
        value={local}
      />
      <Pressable onPress={() => { onConfirm(local); onClose(); }} style={s.confirmBtn}>
        <AppText style={s.confirmBtnText}>Confirm</AppText>
      </Pressable>
    </Sheet>
  );
}

// ── Ticketing ─────────────────────────────────────────────────────────────────

export type TicketType = 'free' | 'paid';

interface TicketingProps {
  readonly visible: boolean;
  readonly value: TicketType;
  readonly onConfirm: (v: TicketType) => void;
  readonly onClose: () => void;
}

export function TicketingModal({ visible, value, onConfirm, onClose }: TicketingProps) {
  const [local, setLocal] = useState<TicketType>(value);

  return (
    <Sheet onClose={onClose} visible={visible}>
      <AppText style={s.sheetTitle}>Hackathon Entry</AppText>
      <AppText style={s.fieldLabel}>Entry Type</AppText>
      <View style={[s.chipsRow, { marginTop: 4 }]}>
        <Pressable onPress={() => setLocal('free')} style={local === 'free' ? s.chipActive : s.chipInactive}>
          <AppText style={local === 'free' ? s.chipActiveText : s.chipInactiveText}>Free</AppText>
        </Pressable>
        <Pressable onPress={() => setLocal('paid')} style={local === 'paid' ? s.chipActive : s.chipInactive}>
          <AppText style={local === 'paid' ? s.chipActiveText : s.chipInactiveText}>Paid</AppText>
        </Pressable>
      </View>
      <Pressable onPress={() => { onConfirm(local); onClose(); }} style={s.confirmBtn}>
        <AppText style={s.confirmBtnText}>Confirm</AppText>
      </Pressable>
    </Sheet>
  );
}
