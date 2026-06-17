import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../../shared/ui';
import { useAppSession } from '../../../../../shared/auth/useAppSession';
import { type LiveHackathon } from './OrganizerCreateHackathonScreen';

interface HackathonDashboardScreenProps {
  readonly hackathon: LiveHackathon;
}

type PresetKey = 'today' | 'yesterday' | 'this-week' | 'this-month' | 'this-year' | 'all-time';

const PRESET_LABELS: Record<PresetKey, string> = {
  'today': 'Today',
  'yesterday': 'Yesterday',
  'this-week': 'This Week',
  'this-month': 'This Month',
  'this-year': 'This Year',
  'all-time': 'All Time',
};

export function HackathonDashboardScreen({ hackathon }: HackathonDashboardScreenProps) {
  const session = useAppSession();
  const name = `${session.firstName ?? ''} ${session.lastName ?? ''}`.trim() || 'Organizer';
  const [filterVisible, setFilterVisible] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetKey>('all-time');
  const [pendingPreset, setPendingPreset] = useState<PresetKey>('all-time');
  const [pendingDate, setPendingDate] = useState<Date | null>(null);
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  function handleApplyFilter() {
    setActivePreset(pendingPreset);
    setFilterVisible(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} style={styles.scroll}>
      <View style={styles.headerSection}>
        <AppText style={styles.welcomeText}>Welcome back, {name}</AppText>
        <AppText style={styles.subText}>
          View all the details for {hackathon.title.toUpperCase()}
        </AppText>
        <View style={styles.actionRow}>
          <Pressable onPress={() => { setPendingPreset(activePreset); setFilterVisible(true); }} style={styles.allTimePill}>
            <CalendarIcon />
            <AppText style={styles.allTimePillText}>{PRESET_LABELS[activePreset]}</AppText>
            <ChevronDownIcon />
          </Pressable>
          <Pressable style={styles.sharePill}>
            <ShareIcon />
            <AppText style={styles.sharePillText}>Share</AppText>
          </Pressable>
        </View>
      </View>

      <View style={styles.card1}>
        <View style={styles.card1Glow} />
        <AppText style={styles.card1Label}>Completed Registration</AppText>
        <AppText style={styles.card1Number}>1</AppText>
        <View style={styles.card1Bottom}>
          <AppText style={styles.card1BottomLabel}>Overall Total</AppText>
          <View style={styles.darkBadge}>
            <AppText style={styles.darkBadgeText}>1</AppText>
          </View>
        </View>
      </View>

      <MetricCard
        badge="All Time"
        bottomLabel="Overall Visibility"
        number="1,088"
        title="Total Impressions"
      />

      <MetricCard
        badge="All Time"
        bottomLabel="Total engagement"
        number="491"
        title="Total Views"
      />

      <MetricCard
        badge="All Time"
        bottomLabel="Platform Efficiency"
        number="45.1%"
        title="CTR Ratio"
      />

      <View style={styles.card}>
        <AppText style={styles.cardTitle}>QR Code</AppText>
        <View style={styles.qrContainer}>
          <QRCodeView />
          <View style={styles.downloadPill}>
            <DownloadIcon />
            <AppText style={styles.downloadText}>Download</AppText>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <AppText style={styles.cardTitle}>Registration Overview</AppText>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#8359D5' }]} />
            <AppText style={styles.legendText}>Male</AppText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#E879A0' }]} />
            <AppText style={styles.legendText}>Female</AppText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#584D5A' }]} />
            <AppText style={styles.legendText}>Others</AppText>
          </View>
        </View>
        <LineChartView />
      </View>

      <View style={styles.card}>
        <AppText style={styles.cardTitle}>Gender Diversity</AppText>
        <View style={styles.donutRow}>
          <View style={styles.donutWrap}>
            <View style={styles.donutRing}>
              <AppText style={styles.donutCenter}>1</AppText>
            </View>
          </View>
          <View style={styles.donutLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#E879A0' }]} />
              <AppText style={styles.legendText}>Female</AppText>
              <AppText style={styles.legendValue}>0</AppText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#8359D5' }]} />
              <AppText style={styles.legendText}>Male</AppText>
              <AppText style={styles.legendValue}>1</AppText>
            </View>
          </View>
        </View>
      </View>

      <TimeFilterModal
        activePreset={pendingPreset}
        calMonth={calMonth}
        onApply={handleApplyFilter}
        onCalMonthChange={setCalMonth}
        onCancel={() => setFilterVisible(false)}
        onSelectDate={setPendingDate}
        onSelectPreset={setPendingPreset}
        selectedDate={pendingDate}
        visible={filterVisible}
      />
    </ScrollView>
  );
}

// ── Time Filter Modal ────────────────────────────────────────────────────────

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'this-week', label: 'This Week' },
  { key: 'this-month', label: 'This Month' },
  { key: 'this-year', label: 'This Year' },
  { key: 'all-time', label: 'All Time' },
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface TimeFilterModalProps {
  readonly visible: boolean;
  readonly activePreset: PresetKey;
  readonly selectedDate: Date | null;
  readonly calMonth: Date;
  readonly onSelectPreset: (preset: PresetKey) => void;
  readonly onSelectDate: (date: Date) => void;
  readonly onCalMonthChange: (month: Date) => void;
  readonly onApply: () => void;
  readonly onCancel: () => void;
}

function TimeFilterModal({
  visible,
  activePreset,
  selectedDate,
  calMonth,
  onSelectPreset,
  onSelectDate,
  onCalMonthChange,
  onApply,
  onCancel,
}: TimeFilterModalProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = [31, (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month] ?? 30;
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrevMonth = [31, (prevYear % 4 === 0 && prevYear % 100 !== 0) || prevYear % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][prevMonth] ?? 30;

  const calCells: { date: Date; inMonth: boolean }[] = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calCells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calCells.push({ date: new Date(year, month, d), inMonth: true });
  }
  const remaining = 42 - calCells.length;
  for (let d = 1; d <= remaining; d++) {
    calCells.push({ date: new Date(year, month + 1, d), inMonth: false });
  }

  const weeks: { date: Date; inMonth: boolean }[][] = [];
  for (let i = 0; i < calCells.length; i += 7) {
    weeks.push(calCells.slice(i, i + 7));
  }

  function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  return (
    <Modal animationType="slide" onRequestClose={onCancel} transparent visible={visible}>
      <View style={fStyles.overlay}>
        <Pressable onPress={onCancel} style={StyleSheet.absoluteFillObject} />
        <View style={fStyles.sheet}>
          <View style={fStyles.body}>
            {/* Left: Presets */}
            <View style={fStyles.presetsCol}>
              <AppText style={fStyles.presetsHeader}>PRESETS</AppText>
              {PRESETS.map((preset) => {
                const isActive = activePreset === preset.key;
                return (
                  <Pressable
                    key={preset.key}
                    onPress={() => onSelectPreset(preset.key)}
                    style={[fStyles.presetItem, isActive ? fStyles.presetItemActive : null]}
                  >
                    <LightningIcon active={isActive} />
                    <AppText style={[fStyles.presetLabel, isActive ? fStyles.presetLabelActive : null]}>
                      {preset.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            {/* Divider */}
            <View style={fStyles.divider} />

            {/* Right: Calendar */}
            <View style={fStyles.calCol}>
              <View style={fStyles.calHeader}>
                <View style={fStyles.filterIconRow}>
                  <View style={fStyles.filterIcon}>
                    <View style={fStyles.filterLine1} />
                    <View style={fStyles.filterLine2} />
                    <View style={fStyles.filterLine3} />
                  </View>
                  <AppText style={fStyles.calHeaderTitle}>Preset Selected</AppText>
                </View>
                <View style={fStyles.calChevron} />
              </View>

              <View style={fStyles.monthNav}>
                <Pressable
                  hitSlop={8}
                  onPress={() => onCalMonthChange(new Date(year, month - 1, 1))}
                  style={fStyles.monthNavBtn}
                >
                  <View style={fStyles.navChevronLeft} />
                </Pressable>
                <AppText style={fStyles.monthLabel}>{MONTH_NAMES[month]} {year}</AppText>
                <Pressable
                  hitSlop={8}
                  onPress={() => onCalMonthChange(new Date(year, month + 1, 1))}
                  style={fStyles.monthNavBtn}
                >
                  <View style={fStyles.navChevronRight} />
                </Pressable>
              </View>

              <View style={fStyles.weekRow}>
                {WEEK_DAYS.map((d) => (
                  <AppText key={d} style={fStyles.weekDayLabel}>{d}</AppText>
                ))}
              </View>

              {weeks.map((week, wi) => (
                <View key={wi} style={fStyles.weekRow}>
                  {week.map(({ date, inMonth }, di) => {
                    const isToday = isSameDay(date, today);
                    const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
                    return (
                      <Pressable
                        key={di}
                        onPress={() => inMonth ? onSelectDate(date) : undefined}
                        style={[
                          fStyles.dayCell,
                          isToday ? fStyles.dayCellToday : null,
                          isSelected ? fStyles.dayCellSelected : null,
                        ]}
                      >
                        <AppText style={[
                          fStyles.dayText,
                          !inMonth ? fStyles.dayTextOut : null,
                          isToday ? fStyles.dayTextToday : null,
                          isSelected ? fStyles.dayTextSelected : null,
                        ]}>
                          {date.getDate()}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>

          <View style={fStyles.footer}>
            <Pressable onPress={onCancel} style={fStyles.cancelBtn}>
              <AppText style={fStyles.cancelText}>Cancel</AppText>
            </Pressable>
            <Pressable onPress={onApply} style={fStyles.applyBtn}>
              <AppText style={fStyles.applyText}>Apply Filter</AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function LightningIcon({ active }: { readonly active: boolean }) {
  const color = active ? '#8359D5' : '#C3BFC4';
  return (
    <View style={{ height: 16, width: 12, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{
        borderLeftColor: color, borderLeftWidth: 5, borderTopColor: color, borderTopWidth: 8,
        borderBottomColor: 'transparent', borderBottomWidth: 0, borderRightColor: 'transparent',
        borderRightWidth: 0, height: 0, width: 0, marginBottom: -2,
      }} />
      <View style={{
        borderRightColor: color, borderRightWidth: 5, borderBottomColor: color, borderBottomWidth: 8,
        borderTopColor: 'transparent', borderTopWidth: 0, borderLeftColor: 'transparent',
        borderLeftWidth: 0, height: 0, width: 0, marginTop: -2,
      }} />
    </View>
  );
}

const fStyles = StyleSheet.create({
  overlay: { backgroundColor: 'rgba(0,0,0,0.4)', flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  body: { flexDirection: 'row', minHeight: 420 },
  presetsCol: { backgroundColor: '#FAFAFA', paddingBottom: 16, paddingHorizontal: 16, paddingTop: 20, width: 140 },
  presetsHeader: { color: '#9C8DAA', fontFamily: 'Urbanist', fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: 12 },
  presetItem: { alignItems: 'center', borderRadius: 8, flexDirection: 'row', gap: 8, marginBottom: 4, paddingHorizontal: 10, paddingVertical: 10 },
  presetItemActive: { backgroundColor: '#F3EEFF' },
  presetLabel: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 14, fontWeight: '400' },
  presetLabelActive: { color: '#8359D5', fontWeight: '600' },
  divider: { backgroundColor: '#E8E6E8', width: 1 },
  calCol: { flex: 1, paddingBottom: 16, paddingHorizontal: 12, paddingTop: 16 },
  calHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  filterIconRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  filterIcon: { gap: 3, height: 14, justifyContent: 'center', width: 14 },
  filterLine1: { backgroundColor: '#8359D5', borderRadius: 1, height: 1.5, width: 14 },
  filterLine2: { alignSelf: 'center', backgroundColor: '#8359D5', borderRadius: 1, height: 1.5, width: 10 },
  filterLine3: { alignSelf: 'center', backgroundColor: '#8359D5', borderRadius: 1, height: 1.5, width: 6 },
  calHeaderTitle: { color: '#100013', fontFamily: 'Aeonik Pro', fontSize: 14, fontWeight: '600' },
  calChevron: { borderColor: '#584D5A', borderRightWidth: 1.5, borderTopWidth: 1.5, height: 7, transform: [{ rotate: '45deg' }], width: 7 },
  monthNav: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  monthNavBtn: { alignItems: 'center', height: 24, justifyContent: 'center', width: 24 },
  navChevronLeft: { borderBottomColor: '#584D5A', borderBottomWidth: 1.5, borderLeftColor: '#584D5A', borderLeftWidth: 1.5, height: 7, transform: [{ rotate: '45deg' }], width: 7 },
  navChevronRight: { borderRightColor: '#584D5A', borderRightWidth: 1.5, borderTopColor: '#584D5A', borderTopWidth: 1.5, height: 7, transform: [{ rotate: '45deg' }], width: 7 },
  monthLabel: { color: '#100013', fontFamily: 'Aeonik Pro', fontSize: 14, fontWeight: '600' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 2 },
  weekDayLabel: { color: '#9C8DAA', fontFamily: 'Urbanist', fontSize: 11, fontWeight: '500', textAlign: 'center', width: 28 },
  dayCell: { alignItems: 'center', borderRadius: 6, height: 30, justifyContent: 'center', width: 28 },
  dayCellToday: { backgroundColor: '#FFF4C2' },
  dayCellSelected: { backgroundColor: '#8359D5' },
  dayText: { color: '#100013', fontFamily: 'Urbanist', fontSize: 12, fontWeight: '400' },
  dayTextOut: { color: '#C3BFC4' },
  dayTextToday: { color: '#100013', fontWeight: '600' },
  dayTextSelected: { color: '#FFFFFF', fontWeight: '600' },
  footer: { alignItems: 'center', borderTopColor: '#E8E6E8', borderTopWidth: 1, flexDirection: 'row', gap: 12, justifyContent: 'flex-end', paddingHorizontal: 20, paddingVertical: 16 },
  cancelBtn: { alignItems: 'center', height: 44, justifyContent: 'center', paddingHorizontal: 20 },
  cancelText: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 15, fontWeight: '500' },
  applyBtn: { alignItems: 'center', backgroundColor: '#42007A', borderRadius: 100, height: 44, justifyContent: 'center', paddingHorizontal: 24 },
  applyText: { color: '#FFFFFF', fontFamily: 'Urbanist', fontSize: 15, fontWeight: '600' },
});

function MetricCard({ title, number, bottomLabel, badge }: { readonly title: string; readonly number: string; readonly bottomLabel: string; readonly badge: string }) {
  return (
    <View style={styles.card}>
      <AppText style={styles.cardLabel}>{title}</AppText>
      <AppText style={styles.cardNumber}>{number}</AppText>
      <View style={styles.cardBottom}>
        <AppText style={styles.cardBottomLabel}>{bottomLabel}</AppText>
        <View style={styles.darkBadge}>
          <AppText style={styles.darkBadgeText}>{badge}</AppText>
        </View>
      </View>
    </View>
  );
}

function QRCodeView() {
  return (
    <View style={styles.qrOuter}>
      <View style={styles.qrInner}>
        <View style={styles.qrTopRow}>
          <View style={styles.qrCorner} />
          <View style={styles.qrDots} />
          <View style={styles.qrCorner} />
        </View>
        <View style={styles.qrMidRow}>
          {Array.from({ length: 10 }).map((_, i) => (
            <View key={i} style={[styles.qrCell, { backgroundColor: i % 3 === 0 ? '#1C0E30' : i % 2 === 0 ? '#584D5A' : 'transparent' }]} />
          ))}
        </View>
        <View style={styles.qrTopRow}>
          <View style={styles.qrCorner} />
          <View style={styles.qrDots} />
          <View style={[styles.qrCorner, { opacity: 0 }]} />
        </View>
      </View>
    </View>
  );
}

function LineChartView() {
  const yLabels = ['12', '9', '6', '3', '0'];
  const xLabels = ['21-04-2026', '24-04-2026', '27-04-2026'];
  return (
    <View style={styles.chartOuter}>
      <View style={styles.chartLeft}>
        {yLabels.map((label) => <AppText key={label} style={styles.yLabel}>{label}</AppText>)}
      </View>
      <View style={styles.chartArea}>
        {yLabels.map((label) => <View key={label} style={styles.gridLine} />)}
        <View style={styles.flatLine} />
        {xLabels.map((label) => <View key={label} style={styles.xDot} />)}
        <View style={styles.tooltipBox}>
          <AppText style={styles.tooltipDate}>27-04-2026</AppText>
          <View style={styles.tooltipRow}>
            <View style={[styles.tooltipDot, { backgroundColor: '#8359D5' }]} />
            <AppText style={styles.tooltipText}>men: 0</AppText>
          </View>
          <View style={styles.tooltipRow}>
            <View style={[styles.tooltipDot, { backgroundColor: '#584D5A' }]} />
            <AppText style={styles.tooltipText}>other: 0</AppText>
          </View>
          <View style={styles.tooltipRow}>
            <View style={[styles.tooltipDot, { backgroundColor: '#E879A0' }]} />
            <AppText style={styles.tooltipText}>women: 0</AppText>
          </View>
        </View>
      </View>
      <View style={styles.xLabelsRow}>
        <View style={styles.xLabelOffset} />
        {xLabels.map((label) => <AppText key={label} style={styles.xLabel}>{label}</AppText>)}
      </View>
    </View>
  );
}

function CalendarIcon() { return <View style={styles.calIconFrame}><View style={styles.calOutline} /><View style={styles.calLine} /></View>; }
function ChevronDownIcon() { return <View style={styles.chevron} />; }
function ShareIcon() {
  return (
    <View style={styles.shareIconFrame}>
      <View style={styles.shareCircleTop} /><View style={styles.shareCircleBottomLeft} />
      <View style={styles.shareCircleBottomRight} /><View style={styles.shareLine1} /><View style={styles.shareLine2} />
    </View>
  );
}
function DownloadIcon() {
  return (
    <View style={styles.downloadIconFrame}>
      <View style={styles.downloadArrowBody} /><View style={styles.downloadArrowLeft} />
      <View style={styles.downloadArrowRight} /><View style={styles.downloadBase} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { gap: 16, padding: 16, paddingBottom: 32 },
  headerSection: { gap: 6, marginBottom: 4 },
  welcomeText: { color: '#100013', fontFamily: 'Aeonik Pro', fontSize: 28, fontWeight: '700', lineHeight: 34 },
  subText: { color: '#7C737E', fontFamily: 'Urbanist', fontSize: 14, fontWeight: '400', lineHeight: 20 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  allTimePill: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#C3BFC4', borderRadius: 100, borderWidth: 1, flexDirection: 'row', gap: 6, height: 38, paddingHorizontal: 14 },
  allTimePillText: { color: '#100013', fontFamily: 'Urbanist', fontSize: 14, fontWeight: '500' },
  sharePill: { alignItems: 'center', backgroundColor: '#42007A', borderRadius: 100, flexDirection: 'row', gap: 6, height: 38, paddingHorizontal: 14 },
  sharePillText: { color: '#FFFFFF', fontFamily: 'Urbanist', fontSize: 14, fontWeight: '500' },
  card1: { backgroundColor: '#14082A', borderRadius: 16, overflow: 'hidden', padding: 20, position: 'relative' },
  card1Glow: { backgroundColor: 'rgba(106, 78, 200, 0.3)', borderRadius: 200, bottom: -60, height: 200, left: -40, position: 'absolute', width: 200 },
  card1Label: { color: 'rgba(255,255,255,0.7)', fontFamily: 'Urbanist', fontSize: 14, fontWeight: '400', lineHeight: 20 },
  card1Number: { color: '#FFFFFF', fontFamily: 'Aeonik Pro', fontSize: 56, fontWeight: '700', lineHeight: 64, marginTop: 4 },
  card1Bottom: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 8 },
  card1BottomLabel: { color: 'rgba(255,255,255,0.6)', fontFamily: 'Urbanist', fontSize: 13, fontWeight: '400' },
  card: { backgroundColor: '#FFFFFF', borderColor: '#C3BFC4', borderRadius: 16, borderWidth: 1, padding: 20 },
  cardLabel: { color: '#100013', fontFamily: 'Urbanist', fontSize: 14, fontWeight: '400', lineHeight: 20 },
  cardNumber: { color: '#100013', fontFamily: 'Aeonik Pro', fontSize: 48, fontWeight: '700', lineHeight: 56, marginTop: 4 },
  cardBottom: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 8 },
  cardBottomLabel: { color: '#6949AA', fontFamily: 'Urbanist', fontSize: 13, fontWeight: '400' },
  cardTitle: { color: '#100013', fontFamily: 'Aeonik Pro', fontSize: 16, fontWeight: '600', marginBottom: 16 },
  darkBadge: { backgroundColor: '#2D1B5E', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3 },
  darkBadgeText: { color: '#FFFFFF', fontFamily: 'Urbanist', fontSize: 12, fontWeight: '500' },
  qrContainer: { alignItems: 'center', position: 'relative' },
  qrOuter: { alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 8, height: 160, justifyContent: 'center', width: 160 },
  qrInner: { gap: 6, height: 120, justifyContent: 'space-between', width: 120 },
  qrTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  qrCorner: { backgroundColor: '#1C0E30', borderRadius: 4, height: 28, width: 28 },
  qrDots: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, height: 28, width: 48 },
  qrMidRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  qrCell: { borderRadius: 2, height: 8, width: 8 },
  downloadPill: { alignItems: 'center', backgroundColor: '#F3EEFF', borderRadius: 100, flexDirection: 'row', gap: 6, marginTop: 12, paddingHorizontal: 16, paddingVertical: 8 },
  downloadText: { color: '#42007A', fontFamily: 'Urbanist', fontSize: 14, fontWeight: '500' },
  legendRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  legendItem: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  legendDot: { borderRadius: 4, height: 8, width: 8 },
  legendText: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 12, fontWeight: '400' },
  legendValue: { color: '#100013', fontFamily: 'Urbanist', fontSize: 12, fontWeight: '600', marginLeft: 4 },
  chartOuter: { flexDirection: 'column' },
  chartLeft: { position: 'absolute', left: 0, top: 0, height: 120, justifyContent: 'space-between', width: 28, zIndex: 1 },
  yLabel: { color: '#7C737E', fontFamily: 'Urbanist', fontSize: 10, textAlign: 'right', width: 24 },
  chartArea: { height: 120, marginLeft: 32, position: 'relative' },
  gridLine: { backgroundColor: 'transparent', borderColor: '#E8E6E8', borderStyle: 'dashed', borderTopWidth: 1, height: 1, marginTop: 22, width: '100%' },
  flatLine: { backgroundColor: '#8359D5', bottom: 20, height: 1.5, left: 0, position: 'absolute', right: 0 },
  xDot: { backgroundColor: '#8359D5', borderRadius: 4, bottom: 16, height: 8, position: 'absolute', width: 8 },
  tooltipBox: { backgroundColor: '#FFFFFF', borderColor: '#E8E6E8', borderRadius: 8, borderWidth: 1, gap: 4, padding: 10, position: 'absolute', right: 0, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, top: 0, width: 120, elevation: 2 },
  tooltipDate: { color: '#100013', fontFamily: 'Urbanist', fontSize: 11, fontWeight: '600', marginBottom: 4 },
  tooltipRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  tooltipDot: { borderRadius: 3, height: 6, width: 6 },
  tooltipText: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 11 },
  xLabelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginLeft: 32, marginTop: 6 },
  xLabelOffset: { width: 0 },
  xLabel: { color: '#7C737E', fontFamily: 'Urbanist', fontSize: 9 },
  donutRow: { alignItems: 'center', flexDirection: 'row', gap: 24 },
  donutWrap: { alignItems: 'center', justifyContent: 'center' },
  donutRing: { alignItems: 'center', borderColor: '#9B8FE8', borderRadius: 999, borderWidth: 20, height: 120, justifyContent: 'center', width: 120 },
  donutCenter: { color: '#100013', fontFamily: 'Aeonik Pro', fontSize: 28, fontWeight: '700' },
  donutLegend: { flex: 1, gap: 12 },
  calIconFrame: { height: 16, position: 'relative', width: 16 },
  calOutline: { borderColor: '#100013', borderRadius: 3, borderWidth: 1.5, height: 14, left: 1, position: 'absolute', top: 2, width: 14 },
  calLine: { backgroundColor: '#100013', height: 4, left: 1, position: 'absolute', top: 6, width: 14 },
  chevron: { borderBottomColor: '#100013', borderBottomWidth: 1.5, borderRightColor: '#100013', borderRightWidth: 1.5, height: 6, transform: [{ rotate: '45deg' }], width: 6 },
  shareIconFrame: { height: 16, position: 'relative', width: 16 },
  shareCircleTop: { borderColor: '#FFFFFF', borderRadius: 4, borderWidth: 1.5, height: 6, left: 5, position: 'absolute', top: 0, width: 6 },
  shareCircleBottomLeft: { borderColor: '#FFFFFF', borderRadius: 4, borderWidth: 1.5, height: 6, left: 0, position: 'absolute', top: 10, width: 6 },
  shareCircleBottomRight: { borderColor: '#FFFFFF', borderRadius: 4, borderWidth: 1.5, height: 6, left: 10, position: 'absolute', top: 10, width: 6 },
  shareLine1: { backgroundColor: '#FFFFFF', borderRadius: 1, height: 1.5, left: 4, position: 'absolute', top: 5, transform: [{ rotate: '30deg' }], width: 9 },
  shareLine2: { backgroundColor: '#FFFFFF', borderRadius: 1, height: 1.5, left: 4, position: 'absolute', top: 10, transform: [{ rotate: '-30deg' }], width: 9 },
  downloadIconFrame: { height: 16, position: 'relative', width: 16 },
  downloadArrowBody: { backgroundColor: '#42007A', borderRadius: 1, height: 8, left: 7, position: 'absolute', top: 0, width: 2 },
  downloadArrowLeft: { backgroundColor: '#42007A', borderRadius: 1, height: 2, left: 4, position: 'absolute', top: 7, transform: [{ rotate: '45deg' }], width: 6 },
  downloadArrowRight: { backgroundColor: '#42007A', borderRadius: 1, height: 2, left: 8, position: 'absolute', top: 7, transform: [{ rotate: '-45deg' }], width: 6 },
  downloadBase: { backgroundColor: '#42007A', borderRadius: 1, height: 2, left: 2, position: 'absolute', top: 14, width: 12 },
});
