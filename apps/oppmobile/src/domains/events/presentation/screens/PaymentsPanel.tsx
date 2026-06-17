import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { useAppSession } from '../../../../shared/auth/useAppSession';
import { AppText } from '../../../../shared/ui';
import { type LiveEvent } from './OrganizerCreateEventScreen';

// ── Types ─────────────────────────────────────────────────────────────────────
type FeeBearer = 'participant' | 'organiser';

interface Ticket {
  readonly id: string;
  readonly name: string;
  readonly pricePerTeam: number;
  readonly limit: number;
}

interface PayoutDetails {
  holderName: string;
  phone: string;
  email: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  pan: string;
  gstTin: string;
  address: string;
}

export interface PaymentsPanelProps {
  readonly event: LiveEvent;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function categoryLabel(ev: LiveEvent): string {
  const t = ev.title?.toLowerCase() ?? '';
  if (t.includes('festival')) return 'Festival';
  if (t.includes('event')) return 'Event';
  return 'Event';
}

const EMPTY_PAYOUT: PayoutDetails = {
  holderName: '',
  phone: '',
  email: '',
  bankName: '',
  accountNumber: '',
  ifsc: '',
  pan: '',
  gstTin: '',
  address: '',
};

// ── Main Panel ────────────────────────────────────────────────────────────────
export function PaymentsPanel({ event }: PaymentsPanelProps) {
  const session = useAppSession();
  const cat = categoryLabel(event);

  const [isPaid, setIsPaid] = useState(event.ticketType === 'paid');
  const [feeBearer, setFeeBearer] = useState<FeeBearer>('participant');
  const [tickets, setTickets] = useState<Ticket[]>([
    { id: '1', name: 'Ticket name', pricePerTeam: 4000, limit: 10000 },
  ]);
  const [payout, setPayout] = useState<PayoutDetails>(EMPTY_PAYOUT);
  const [showAddTicket, setShowAddTicket] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  const userName = `${session.firstName ?? ''} ${session.lastName ?? ''}`.trim() || 'Rohit';
  const userEmail = session.userEmail ?? 'tstrohittiwari@gmail.com';

  // Fee math (sample ₹100 base)
  const baseAmount = 100;
  const serviceCharge = baseAmount * 0.02;       // 2%
  const tax = serviceCharge * 0.18;              // 18% GST of 2%
  const participantPays = baseAmount + serviceCharge + tax;
  const organiserPays = baseAmount - serviceCharge - tax;

  function handleDeleteTicket(id: string) {
    setTickets((prev) => prev.filter((t) => t.id !== id));
  }

  function handleAddTicket(name: string, price: number, limit: number) {
    setTickets((prev) => [
      ...prev,
      { id: String(Date.now()), name, pricePerTeam: price, limit },
    ]);
    setShowAddTicket(false);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Is The Event Paid ── */}
        <View style={styles.paidRow}>
          <AppText style={styles.paidLabel}>Is The {cat} Paid</AppText>
          <View style={styles.paidToggleGroup}>
            <Pressable
              onPress={() => setIsPaid(true)}
              style={[styles.paidBtn, isPaid ? styles.paidBtnActive : styles.paidBtnInactive]}
            >
              <AppText style={[styles.paidBtnText, isPaid ? styles.paidBtnTextActive : styles.paidBtnTextInactive]}>
                Yes
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => setIsPaid(false)}
              style={[styles.paidBtn, !isPaid ? styles.paidBtnActive : styles.paidBtnInactive]}
            >
              <AppText style={[styles.paidBtnText, !isPaid ? styles.paidBtnTextActive : styles.paidBtnTextInactive]}>
                No
              </AppText>
            </Pressable>
          </View>
        </View>

        {/* ── Paid content ── */}
        {isPaid && (
          <>
            {/* Ticket Type */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AppText style={styles.sectionTitle}>Ticket Type</AppText>
                <Pressable onPress={() => setShowAddTicket(true)} style={styles.addCircleBtn}>
                  <View style={styles.plusH} />
                  <View style={styles.plusV} />
                </Pressable>
              </View>
              <AppText style={styles.sectionSub}>
                You can create different types of tickets from here for participants
              </AppText>

              {tickets.map((ticket) => (
                <View key={ticket.id} style={styles.ticketCard}>
                  <View style={styles.ticketTopRow}>
                    <AppText style={styles.ticketName}>{ticket.name}</AppText>
                    <View style={styles.ticketActions}>
                      <PencilIcon />
                      <AppText style={styles.ticketEdit}>Edit</AppText>
                    </View>
                  </View>
                  <View style={styles.ticketBottomRow}>
                    <AppText style={styles.ticketPrice}>
                      ₹ {ticket.pricePerTeam.toLocaleString('en-IN')} per team
                    </AppText>
                    <View style={styles.ticketLimitBadge}>
                      <AppText style={styles.ticketLimitText}>Limit: {ticket.limit.toLocaleString('en-IN')}</AppText>
                    </View>
                    <View style={styles.ticketDeleteRow}>
                      <TrashIcon />
                      <Pressable onPress={() => handleDeleteTicket(ticket.id)}>
                        <AppText style={styles.ticketDelete}>Delete</AppText>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}

              {/* No ticket hint */}
              <View style={styles.generateHint}>
                <View style={styles.hintIcon}>
                  <View style={styles.hintIconInner} />
                </View>
                <AppText style={styles.generateHintText}>
                  {'Don\'t have any ticket generated as of now. '}
                  <AppText style={styles.generateHintLink}>Click here to generate one</AppText>
                </AppText>
              </View>
            </View>

            {/* Service Charge */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AppText style={styles.sectionTitle}>Service charge</AppText>
                <Pressable style={styles.addCircleBtn}>
                  <View style={styles.plusH} />
                  <View style={styles.plusV} />
                </Pressable>
              </View>
              <AppText style={styles.sectionSub}>
                Select who pays service charge user or organizer
              </AppText>

              {/* Participant card (selected) */}
              <Pressable
                onPress={() => setFeeBearer('participant')}
                style={[styles.feeBearerCard, feeBearer === 'participant' && styles.feeBearerCardActive]}
              >
                <View style={styles.feeBearerHeader}>
                  <AppText style={styles.feeBearerTitle}>Participant</AppText>
                  {feeBearer === 'participant' && (
                    <View style={styles.checkCircle}>
                      <View style={styles.checkMark} />
                    </View>
                  )}
                </View>
                <AppText style={styles.feeBearerExample}>Example ——————</AppText>
                <BreakdownRow label="Registration Amount" value={`₹ ${baseAmount}`} />
                <BreakdownRow label="Service Charge" value={`₹ ${serviceCharge.toFixed(0)}(2%)`} />
                <BreakdownRow
                  label="Tax"
                  value={`₹ ${tax.toFixed(2)}(18% GST of 2%)`}
                  valueColor="#8359D5"
                />
                <View style={styles.breakdownDivider} />
                <BreakdownRow label="User Pay" value={`₹ ${participantPays.toFixed(2)}`} />
                <BreakdownRow label="You get" value={`₹ ${baseAmount}`} bold />
              </Pressable>

              {/* Organiser card */}
              <Pressable
                onPress={() => setFeeBearer('organiser')}
                style={[styles.feeBearerCard, feeBearer === 'organiser' && styles.feeBearerCardActive]}
              >
                <View style={styles.feeBearerHeader}>
                  <AppText style={styles.feeBearerTitle}>Organiser</AppText>
                  {feeBearer === 'organiser' && (
                    <View style={styles.checkCircle}>
                      <View style={styles.checkMark} />
                    </View>
                  )}
                </View>
                <AppText style={styles.feeBearerExample}>Example ——————</AppText>
                <BreakdownRow label="Registration Amount" value={`₹ ${baseAmount}`} />
                <BreakdownRow label="Service Charge" value={`₹ ${serviceCharge.toFixed(0)}(2%)`} />
                <BreakdownRow
                  label="Tax"
                  value={`₹ ${tax.toFixed(2)}(18% GST of 2%)`}
                  valueColor="#8359D5"
                />
                <View style={styles.breakdownDivider} />
                <BreakdownRow label="User Pay" value={`₹ ${baseAmount}`} />
                <BreakdownRow label="You get" value={`₹ ${organiserPays.toFixed(2)}`} bold />
              </Pressable>
            </View>

            {/* Payout Account Details */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AppText style={styles.sectionTitle}>Payout Account Details</AppText>
                <Pressable onPress={() => setShowPayoutModal(true)}>
                  <PencilIcon />
                </Pressable>
              </View>
              <AppText style={styles.sectionSub}>
                Details of the account in which all the amount will be given
              </AppText>

              <View style={styles.payoutTable}>
                {(
                  [
                    ['Account Holder Name', payout.holderName],
                    ['Phone Number', payout.phone],
                    ['Email', payout.email],
                    ['Bank Name', payout.bankName],
                    ['Bank Account Number', payout.accountNumber],
                    ['IFSC Code', payout.ifsc],
                    ['Pan Number', payout.pan],
                    ['GST Tin Number', payout.gstTin],
                    ['Address 1', payout.address],
                  ] as [string, string][]
                ).map(([label, value]) => (
                  <View key={label} style={styles.payoutRow}>
                    <AppText style={styles.payoutRowLabel}>{label}</AppText>
                    <AppText style={styles.payoutRowValue}>{value || '--'}</AppText>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Spacer for footer */}
        <View style={styles.footerSpacer} />
      </ScrollView>

      {/* ── Sticky Footer ── */}
      <View style={styles.footer}>
        <View style={styles.footerCard}>
          <View style={styles.footerUserRow}>
            <Image
              source={{ uri: 'https://i.pravatar.cc/100?img=11' }}
              style={styles.footerAvatar}
            />
            <AppText style={styles.footerName}>{userName}</AppText>
            <AppText numberOfLines={1} style={styles.footerEmail}>{userEmail}</AppText>
          </View>
          <Pressable style={styles.updateBtn}>
            <AppText style={styles.updateBtnText}>Update {cat}</AppText>
          </Pressable>
        </View>
      </View>

      {/* ── Add Ticket Modal ── */}
      <AddTicketModal
        onClose={() => setShowAddTicket(false)}
        onConfirm={handleAddTicket}
        visible={showAddTicket}
      />

      {/* ── Payout Modal ── */}
      <PayoutModal
        onClose={() => setShowPayoutModal(false)}
        onSave={(d) => { setPayout(d); setShowPayoutModal(false); }}
        payout={payout}
        visible={showPayoutModal}
      />
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function BreakdownRow({
  label,
  value,
  bold,
  valueColor,
}: {
  readonly label: string;
  readonly value: string;
  readonly bold?: boolean;
  readonly valueColor?: string;
}) {
  return (
    <View style={styles.breakdownRow}>
      <AppText style={[styles.breakdownLabel, bold && styles.breakdownBold]}>{label}</AppText>
      <AppText
        style={[
          styles.breakdownValue,
          bold && styles.breakdownBold,
          valueColor ? { color: valueColor } : null,
        ]}
      >
        {value}
      </AppText>
    </View>
  );
}

function PencilIcon() {
  return (
    <View style={{ height: 18, width: 18, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ backgroundColor: '#9C8DAA', borderRadius: 1, height: 12, width: 2, position: 'absolute', transform: [{ rotate: '-45deg' }], top: 1 }} />
      <View style={{ borderLeftColor: 'transparent', borderLeftWidth: 4, borderRightColor: 'transparent', borderRightWidth: 4, borderTopColor: '#9C8DAA', borderTopWidth: 5, height: 0, position: 'absolute', bottom: 1, width: 0 }} />
    </View>
  );
}

function TrashIcon() {
  return (
    <View style={{ height: 18, width: 14, position: 'relative', alignItems: 'center' }}>
      <View style={{ backgroundColor: '#EF4444', borderRadius: 1, height: 2, position: 'absolute', top: 0, width: 14 }} />
      <View style={{ borderColor: '#EF4444', borderRadius: 2, borderWidth: 1.5, bottom: 0, height: 13, position: 'absolute', width: 12 }} />
    </View>
  );
}

// ── Add Ticket Modal ──────────────────────────────────────────────────────────
function AddTicketModal({
  visible,
  onClose,
  onConfirm,
}: {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (name: string, price: number, limit: number) => void;
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [limit, setLimit] = useState('');

  function handleSave() {
    if (!name.trim()) return;
    onConfirm(name.trim(), parseFloat(price) || 0, parseInt(limit) || 0);
    setName(''); setPrice(''); setLimit('');
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={pm.overlay}>
        <Pressable onPress={() => undefined} style={pm.sheet}>
          <View style={pm.handle} />
          <AppText style={pm.title}>Add Ticket</AppText>
          <PmField label="Ticket Name" onChangeText={setName} placeholder="e.g. Team Pass" value={name} />
          <PmField keyboardType="decimal-pad" label="Price per team (₹)" onChangeText={setPrice} placeholder="0" value={price} />
          <PmField keyboardType="number-pad" label="Limit" onChangeText={setLimit} placeholder="e.g. 1000" value={limit} />
          <Pressable onPress={handleSave} style={pm.saveBtn}>
            <AppText style={pm.saveBtnText}>Add Ticket</AppText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Payout Modal ──────────────────────────────────────────────────────────────
function PayoutModal({
  visible,
  onClose,
  onSave,
  payout,
}: {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSave: (d: PayoutDetails) => void;
  readonly payout: PayoutDetails;
}) {
  const [form, setForm] = useState<PayoutDetails>({ ...payout });

  function set(key: keyof PayoutDetails, v: string) {
    setForm((prev) => ({ ...prev, [key]: v }));
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <Pressable onPress={onClose} style={pm.overlay}>
          <Pressable onPress={() => undefined} style={[pm.sheet, { maxHeight: '88%' }]}>
            <View style={pm.handle} />
            <AppText style={pm.title}>Payout Account Details</AppText>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <PmField label="Account Holder Name" onChangeText={(v) => set('holderName', v)} placeholder="Full Name" value={form.holderName} />
              <PmField keyboardType="phone-pad" label="Phone Number" onChangeText={(v) => set('phone', v)} placeholder="+91 00000 00000" value={form.phone} />
              <PmField autoCapitalize="none" keyboardType="email-address" label="Email" onChangeText={(v) => set('email', v)} placeholder="email@bank.com" value={form.email} />
              <PmField label="Bank Name" onChangeText={(v) => set('bankName', v)} placeholder="e.g. HDFC Bank" value={form.bankName} />
              <PmField keyboardType="number-pad" label="Bank Account Number" onChangeText={(v) => set('accountNumber', v)} placeholder="Account Number" value={form.accountNumber} />
              <PmField autoCapitalize="characters" label="IFSC Code" onChangeText={(v) => set('ifsc', v)} placeholder="e.g. HDFC0001234" value={form.ifsc} />
              <PmField autoCapitalize="characters" label="PAN Number" onChangeText={(v) => set('pan', v)} placeholder="e.g. ABCDE1234F" value={form.pan} />
              <PmField label="GST TIN Number" onChangeText={(v) => set('gstTin', v)} placeholder="Optional" value={form.gstTin} />
              <PmField label="Address" onChangeText={(v) => set('address', v)} placeholder="Full address" value={form.address} />
              <View style={{ height: 16 }} />
            </ScrollView>
            <Pressable onPress={() => onSave(form)} style={pm.saveBtn}>
              <AppText style={pm.saveBtnText}>Save Details</AppText>
            </Pressable>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PmField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChangeText: (v: string) => void;
  readonly placeholder: string;
  readonly keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'phone-pad' | 'email-address';
  readonly autoCapitalize?: 'none' | 'characters' | 'words' | 'sentences';
}) {
  return (
    <View style={pm.field}>
      <AppText style={pm.fieldLabel}>{label}</AppText>
      <TextInput
        autoCapitalize={autoCapitalize ?? 'words'}
        keyboardType={keyboardType ?? 'default'}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A099A1"
        style={pm.input}
        value={value}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F3FF',
    flex: 1,
  },
  content: {
    paddingBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  /* Is The Event Paid row */
  paidRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  paidLabel: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 15,
    fontWeight: '500',
  },
  paidToggleGroup: {
    flexDirection: 'row',
    gap: 0,
  },
  paidBtn: {
    borderRadius: 100,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  paidBtnActive: {
    backgroundColor: '#42007A',
  },
  paidBtnInactive: {
    backgroundColor: '#EDE9FF',
  },
  paidBtnText: {
    fontFamily: 'Urbanist',
    fontSize: 15,
    fontWeight: '600',
  },
  paidBtnTextActive: {
    color: '#FFFFFF',
  },
  paidBtnTextInactive: {
    color: '#9C8DAA',
  },

  /* Section */
  section: {
    backgroundColor: '#FAFAFA',
    borderRadius: 0,
    marginBottom: 20,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSub: {
    color: '#9C8DAA',
    fontFamily: 'Urbanist',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  addCircleBtn: {
    alignItems: 'center',
    borderColor: '#C3BFC4',
    borderRadius: 16,
    borderWidth: 1.5,
    height: 30,
    justifyContent: 'center',
    position: 'relative',
    width: 30,
  },
  plusH: {
    backgroundColor: '#584D5A',
    borderRadius: 1,
    height: 1.5,
    position: 'absolute',
    width: 14,
  },
  plusV: {
    backgroundColor: '#584D5A',
    borderRadius: 1,
    height: 14,
    position: 'absolute',
    width: 1.5,
  },

  /* Ticket card */
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2D3FF',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    padding: 14,
  },
  ticketTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ticketName: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 15,
    fontWeight: '700',
  },
  ticketActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  ticketEdit: {
    color: '#6949AA',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '600',
  },
  ticketBottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ticketPrice: {
    color: '#584D5A',
    flex: 1,
    fontFamily: 'Urbanist',
    fontSize: 13,
  },
  ticketLimitBadge: {
    backgroundColor: '#F3EEFF',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  ticketLimitText: {
    color: '#6949AA',
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '500',
  },
  ticketDeleteRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  ticketDelete: {
    color: '#EF4444',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '600',
  },

  /* Generate hint */
  generateHint: {
    alignItems: 'center',
    backgroundColor: '#F3EEFF',
    borderColor: '#DDD6FE',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    padding: 14,
  },
  hintIcon: {
    alignItems: 'center',
    borderColor: '#9C8DAA',
    borderRadius: 12,
    borderWidth: 1.5,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  hintIconInner: {
    backgroundColor: '#9C8DAA',
    borderRadius: 3,
    height: 12,
    width: 2,
  },
  generateHintText: {
    color: '#584D5A',
    flex: 1,
    fontFamily: 'Urbanist',
    fontSize: 13,
    lineHeight: 18,
  },
  generateHintLink: {
    color: '#6949AA',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  /* Fee bearer cards */
  feeBearerCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E6E8',
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
    marginBottom: 12,
    padding: 16,
  },
  feeBearerCardActive: {
    borderColor: '#8359D5',
  },
  feeBearerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  feeBearerTitle: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 16,
    fontWeight: '700',
  },
  checkCircle: {
    alignItems: 'center',
    backgroundColor: '#8359D5',
    borderRadius: 16,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  checkMark: {
    borderBottomColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderLeftColor: '#FFFFFF',
    borderLeftWidth: 2,
    height: 7,
    marginTop: -3,
    transform: [{ rotate: '-45deg' }],
    width: 11,
  },
  feeBearerExample: {
    color: '#C3BFC4',
    fontFamily: 'Urbanist',
    fontSize: 12,
    marginBottom: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 13,
  },
  breakdownValue: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '500',
  },
  breakdownBold: {
    color: '#100013',
    fontWeight: '700',
  },
  breakdownDivider: {
    backgroundColor: '#E8E6E8',
    height: 1,
    marginVertical: 4,
  },

  /* Payout table */
  payoutTable: {
    gap: 10,
    marginTop: 8,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  payoutRowLabel: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 13,
    flex: 1,
  },
  payoutRowValue: {
    color: '#9C8DAA',
    fontFamily: 'Urbanist',
    fontSize: 13,
    textAlign: 'right',
  },

  footerSpacer: {
    height: 130,
  },

  /* Sticky footer */
  footer: {
    bottom: 0,
    left: 0,
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
    position: 'absolute',
    right: 0,
  },
  footerCard: {
    backgroundColor: '#F3EEFF',
    borderColor: '#6949AA',
    borderRadius: 26,
    borderWidth: 0.5,
    gap: 8,
    paddingBottom: 6,
    paddingHorizontal: 6,
    paddingTop: 10,
  },
  footerUserRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  footerAvatar: {
    borderRadius: 10,
    height: 26,
    width: 26,
  },
  footerName: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '600',
  },
  footerEmail: {
    color: '#584D5A',
    flex: 1,
    fontFamily: 'Urbanist',
    fontSize: 14,
  },
  updateBtn: {
    alignItems: 'center',
    backgroundColor: '#42007A',
    borderRadius: 100,
    height: 50,
    justifyContent: 'center',
  },
  updateBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 16,
    fontWeight: '600',
  },
});

// ── Modal styles ──────────────────────────────────────────────────────────────
const pm = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(12,1,20,0.45)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#EEEEF0',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 16,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#C3BFC4',
    borderRadius: 4,
    height: 5,
    marginBottom: 20,
    width: 48,
  },
  title: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  field: {
    gap: 6,
    marginBottom: 14,
  },
  fieldLabel: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E6E8',
    borderRadius: 100,
    borderWidth: 1.5,
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 15,
    height: 50,
    paddingHorizontal: 20,
  },
  saveBtn: {
    alignItems: 'center',
    backgroundColor: '#42007A',
    borderRadius: 100,
    height: 52,
    justifyContent: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 16,
    fontWeight: '700',
  },
});

