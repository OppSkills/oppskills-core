import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '../../../../shared/ui';
import { type LiveEvent } from './OrganizerCreateEventScreen';

type FeeBearer = 'organiser' | 'participant';

interface PayoutDetails {
  readonly holderName: string;
  readonly accountNumber: string;
  readonly ifsc: string;
  readonly upi: string;
}

interface PaymentsPanelProps {
  readonly event: LiveEvent;
}

export function PaymentsPanel({ event }: PaymentsPanelProps) {
  const [isPaid, setIsPaid] = useState(event.ticketType === 'paid');
  const [feeBearer, setFeeBearer] = useState<FeeBearer>('participant');
  const [entryFee, setEntryFee] = useState('50');
  const [payoutDetails, setPayoutDetails] = useState<PayoutDetails | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  const fee = parseFloat(entryFee) || 0;
  const razorpayFee = fee * 0.02;
  const gstOnRazorpay = razorpayFee * 0.18;
  const totalParticipantPays = fee + razorpayFee + gstOnRazorpay;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <AppText style={styles.subtitle}>
        Set up event fees for participants (if applicable).{'\n'}
        Configure payment settings and payout account details.
      </AppText>

      {/* Locked warning */}
      <View style={styles.warningCard}>
        <View style={styles.warningIcon}>
          <View style={styles.warningCircle} />
          <AppText style={styles.warningBang}>!</AppText>
        </View>
        <View style={styles.warningBody}>
          <AppText style={styles.warningTitle}>Pricing Fields Locked</AppText>
          <AppText style={styles.warningText}>
            Cannot change pricing fields (isFree, entryFeeAmount) after registration has started.
          </AppText>
        </View>
      </View>

      {/* Is The Event Paid */}
      <View style={styles.card}>
        <AppText style={styles.cardTitle}>Is The Event Paid</AppText>
        <AppText style={styles.cardSub}>Pricing cannot be changed after registration has started.</AppText>
        <View style={styles.toggleRow}>
          <Pressable
            onPress={() => setIsPaid(true)}
            style={[styles.toggleBtn, isPaid ? styles.toggleBtnActive : styles.toggleBtnInactive]}
          >
            <AppText style={[styles.toggleBtnText, isPaid ? styles.toggleBtnTextActive : styles.toggleBtnTextInactive]}>
              Yes
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => setIsPaid(false)}
            style={[styles.toggleBtn, !isPaid ? styles.toggleBtnActive : styles.toggleBtnInactive]}
          >
            <AppText style={[styles.toggleBtnText, !isPaid ? styles.toggleBtnTextActive : styles.toggleBtnTextInactive]}>
              No
            </AppText>
          </Pressable>
        </View>
      </View>

      {isPaid && (
        <>
          {/* Who Pays Processing Fee */}
          <View style={styles.card}>
            <AppText style={styles.cardTitle}>Who Pays The Processing Fee?</AppText>
            <AppText style={styles.cardSub}>
              The processing fee is 2% + 18% GST (= 2.36%). Choose who bears it.
            </AppText>
            <View style={styles.toggleRow}>
              <Pressable
                onPress={() => setFeeBearer('organiser')}
                style={[
                  styles.toggleBtn,
                  styles.toggleBtnWide,
                  feeBearer === 'organiser' ? styles.toggleBtnActive : styles.toggleBtnInactive,
                ]}
              >
                <AppText style={[styles.toggleBtnText, feeBearer === 'organiser' ? styles.toggleBtnTextActive : styles.toggleBtnTextInactive]}>
                  Organiser (default)
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => setFeeBearer('participant')}
                style={[
                  styles.toggleBtn,
                  styles.toggleBtnWide,
                  feeBearer === 'participant' ? styles.toggleBtnActive : styles.toggleBtnInactive,
                ]}
              >
                <AppText style={[styles.toggleBtnText, feeBearer === 'participant' ? styles.toggleBtnTextActive : styles.toggleBtnTextInactive]}>
                  Participant
                </AppText>
              </Pressable>
            </View>
            {feeBearer === 'participant' && (
              <View style={styles.infoBox}>
                <AppText style={styles.infoBoxText}>
                  Participants will be charged the entry fee + 2.36% processing fee at checkout.
                </AppText>
              </View>
            )}
            {feeBearer === 'organiser' && (
              <View style={styles.infoBox}>
                <AppText style={styles.infoBoxText}>
                  You will bear the 2.36% processing fee. Participants only pay the entry fee.
                </AppText>
              </View>
            )}
          </View>

          {/* Entry Fee Amount */}
          <View style={styles.card}>
            <AppText style={styles.cardTitle}>Entry Fee Amount</AppText>
            <AppText style={styles.cardSub}>Amount charged per participant</AppText>
            <View style={styles.feeInputRow}>
              <AppText style={styles.rupeeSign}>₹</AppText>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={setEntryFee}
                placeholder="0"
                placeholderTextColor="#C3BFC4"
                style={styles.feeInput}
                value={entryFee}
              />
            </View>
          </View>

          {/* Free For Select Colleges */}
          <View style={styles.card}>
            <AppText style={styles.cardTitle}>Free For Select Colleges</AppText>
            <AppText style={styles.cardSub}>
              Students from these colleges will get free entry (max 5).
            </AppText>
          </View>

          {/* Fee Breakdown */}
          <View style={styles.card}>
            <AppText style={styles.cardTitle}>Fee Breakdown</AppText>
            <AppText style={styles.cardSub}>
              {feeBearer === 'participant'
                ? 'Participant pays the entry fee plus Razorpay processing (2% + 18% GST on that fee). You receive the full entry fee — there is no separate platform cut.'
                : 'You pay the Razorpay processing fee (2% + 18% GST). Participants only pay the entry fee.'}
            </AppText>
            <View style={styles.breakdownCard}>
              <View style={styles.breakdownHeader}>
                <AppText style={styles.breakdownTitle}>
                  {feeBearer === 'participant' ? 'Participant View' : 'Organiser View'}
                </AppText>
                <View style={styles.checkBadge}>
                  <View style={styles.checkMark} />
                </View>
              </View>
              <View style={styles.breakdownDivider} />
              <BreakdownRow label="Entry Fee:" value={`₹ ${fee.toFixed(2)}`} />
              <BreakdownRow label="Razorpay fee (2%):" value={`₹ ${razorpayFee.toFixed(2)}`} />
              <BreakdownRow label="GST on Razorpay fee:" value={`₹ ${gstOnRazorpay.toFixed(2)}`} />
              <View style={styles.breakdownDivider} />
              <BreakdownRow
                bold
                label={feeBearer === 'participant' ? 'Total paid by participant:' : 'You receive:'}
                value={`₹ ${feeBearer === 'participant' ? totalParticipantPays.toFixed(2) : fee.toFixed(2)}`}
              />
            </View>
          </View>
        </>
      )}

      {/* Payout Account */}
      <View style={styles.card}>
        <View style={styles.payoutHeader}>
          <View style={{ flex: 1 }}>
            <AppText style={styles.cardTitle}>Payout Account Details</AppText>
            <AppText style={styles.cardSub}>
              Bank details for receiving payouts from paid registrations
            </AppText>
          </View>
          <View style={styles.payoutStatus}>
            {payoutDetails ? (
              <View style={styles.setStatusBadge}>
                <AppText style={styles.setStatusText}>Set</AppText>
              </View>
            ) : (
              <View style={styles.notSetBadge}>
                <AppText style={styles.notSetIcon}>!</AppText>
                <AppText style={styles.notSetText}>Not{'\n'}Set</AppText>
              </View>
            )}
            <Pressable hitSlop={8} onPress={() => setShowPayoutModal(true)} style={styles.editPencil}>
              <View style={styles.pencilBody} />
              <View style={styles.pencilTip} />
            </Pressable>
          </View>
        </View>

        {payoutDetails ? (
          <View style={styles.payoutSetBox}>
            <AppText style={styles.payoutSetRow}>
              <AppText style={styles.payoutSetLabel}>Name: </AppText>
              {payoutDetails.holderName}
            </AppText>
            <AppText style={styles.payoutSetRow}>
              <AppText style={styles.payoutSetLabel}>Acc: </AppText>
              {'•'.repeat(Math.max(0, payoutDetails.accountNumber.length - 4)) + payoutDetails.accountNumber.slice(-4)}
            </AppText>
            <AppText style={styles.payoutSetRow}>
              <AppText style={styles.payoutSetLabel}>IFSC: </AppText>
              {payoutDetails.ifsc}
            </AppText>
            {payoutDetails.upi !== '' && (
              <AppText style={styles.payoutSetRow}>
                <AppText style={styles.payoutSetLabel}>UPI: </AppText>
                {payoutDetails.upi}
              </AppText>
            )}
          </View>
        ) : (
          <View style={styles.payoutEmptyBox}>
            <AppText style={styles.payoutEmptyText}>
              Set up your payout account to receive payments
            </AppText>
            <Pressable onPress={() => setShowPayoutModal(true)} style={styles.setupBtn}>
              <AppText style={styles.setupBtnText}>Set Up Payout Account</AppText>
            </Pressable>
          </View>
        )}
      </View>

      <PayoutModal
        initialDetails={payoutDetails}
        onClose={() => setShowPayoutModal(false)}
        onSave={(d) => { setPayoutDetails(d); setShowPayoutModal(false); }}
        visible={showPayoutModal}
      />
    </ScrollView>
  );
}

function BreakdownRow({
  label,
  value,
  bold,
}: {
  readonly label: string;
  readonly value: string;
  readonly bold?: boolean;
}) {
  return (
    <View style={styles.breakdownRow}>
      <AppText style={[styles.breakdownLabel, bold ? styles.breakdownBold : null]}>{label}</AppText>
      <AppText style={[styles.breakdownValue, bold ? styles.breakdownBold : null]}>{value}</AppText>
    </View>
  );
}

interface PayoutModalProps {
  readonly visible: boolean;
  readonly initialDetails: PayoutDetails | null;
  readonly onSave: (details: PayoutDetails) => void;
  readonly onClose: () => void;
}

function PayoutModal({ visible, initialDetails, onSave, onClose }: PayoutModalProps) {
  const [holderName, setHolderName] = useState(initialDetails?.holderName ?? '');
  const [accountNumber, setAccountNumber] = useState(initialDetails?.accountNumber ?? '');
  const [ifsc, setIfsc] = useState(initialDetails?.ifsc ?? '');
  const [upi, setUpi] = useState(initialDetails?.upi ?? '');

  if (!visible) return null;

  function handleSave() {
    if (!holderName.trim() || !accountNumber.trim() || !ifsc.trim()) return;
    onSave({ holderName: holderName.trim(), accountNumber: accountNumber.trim(), ifsc: ifsc.trim(), upi: upi.trim() });
  }

  return (
    <Modal onRequestClose={onClose} transparent visible={visible}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={pmStyles.overlay}>
          <View style={pmStyles.screen}>
            {/* Header */}
            <View style={pmStyles.header}>
              <AppText style={pmStyles.headerTitle}>Payout Details</AppText>
              <Pressable hitSlop={10} onPress={onClose} style={pmStyles.closeBtn}>
                <View style={[pmStyles.closeStroke, pmStyles.closeStroke1]} />
                <View style={[pmStyles.closeStroke, pmStyles.closeStroke2]} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={pmStyles.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Field
                label="Account Holder Name *"
                onChangeText={setHolderName}
                placeholder="Enter Name"
                value={holderName}
              />
              <Field
                keyboardType="number-pad"
                label="Account Number *"
                onChangeText={setAccountNumber}
                placeholder="Enter Account Number"
                value={accountNumber}
              />
              <Field
                autoCapitalize="characters"
                label="IFSC Code *"
                onChangeText={setIfsc}
                placeholder="Enter IFSC Code"
                value={ifsc}
              />
              <Field
                autoCapitalize="none"
                label="UPI ID (Optional)"
                onChangeText={setUpi}
                placeholder="e.g. username@upi"
                value={upi}
              />
            </ScrollView>

            <View style={pmStyles.footer}>
              <Pressable onPress={handleSave} style={pmStyles.saveBtn}>
                <AppText style={pmStyles.saveBtnText}>Save Details</AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
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
  readonly keyboardType?: 'default' | 'number-pad' | 'email-address';
  readonly autoCapitalize?: 'none' | 'characters' | 'words' | 'sentences';
}) {
  return (
    <View style={pmStyles.field}>
      <AppText style={pmStyles.fieldLabel}>{label}</AppText>
      <TextInput
        autoCapitalize={autoCapitalize ?? 'words'}
        keyboardType={keyboardType ?? 'default'}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#C3BFC4"
        style={pmStyles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
    padding: 16,
    paddingBottom: 48,
  },
  subtitle: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
  warningCard: {
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  warningIcon: {
    alignItems: 'center',
    height: 22,
    justifyContent: 'center',
    position: 'relative',
    width: 22,
  },
  warningCircle: {
    borderColor: '#D97706',
    borderRadius: 11,
    borderWidth: 1.5,
    height: 22,
    position: 'absolute',
    width: 22,
  },
  warningBang: {
    color: '#D97706',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '700',
  },
  warningBody: {
    flex: 1,
    gap: 4,
  },
  warningTitle: {
    color: '#D97706',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '700',
  },
  warningText: {
    color: '#D97706',
    fontFamily: 'Urbanist',
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E6E8',
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  cardTitle: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 18,
    fontWeight: '700',
  },
  cardSub: {
    color: '#9CA3AF',
    fontFamily: 'Urbanist',
    fontSize: 13,
    lineHeight: 18,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleBtn: {
    borderRadius: 100,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  toggleBtnWide: {
    flex: 1,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#8359D5',
  },
  toggleBtnInactive: {
    borderColor: '#DDD6FE',
    borderWidth: 1.5,
  },
  toggleBtnText: {
    fontFamily: 'Urbanist',
    fontSize: 15,
    fontWeight: '600',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
  toggleBtnTextInactive: {
    color: '#9CA3AF',
  },
  infoBox: {
    backgroundColor: '#EDE9FF',
    borderRadius: 10,
    padding: 12,
  },
  infoBoxText: {
    color: '#8359D5',
    fontFamily: 'Urbanist',
    fontSize: 13,
    lineHeight: 20,
  },
  feeInputRow: {
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rupeeSign: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 20,
    fontWeight: '700',
  },
  feeInput: {
    color: '#100013',
    flex: 1,
    fontFamily: 'Urbanist',
    fontSize: 20,
    fontWeight: '600',
    padding: 0,
  },
  breakdownCard: {
    borderColor: '#C4B5FD',
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
    padding: 14,
  },
  breakdownHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownTitle: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 15,
    fontWeight: '700',
  },
  checkBadge: {
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
  breakdownDivider: {
    backgroundColor: '#E8E6E8',
    height: 1,
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
    color: '#8359D5',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '600',
  },
  breakdownBold: {
    color: '#100013',
    fontWeight: '700',
  },
  // Payout
  payoutHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  payoutStatus: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  notSetBadge: {
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  notSetIcon: {
    color: '#D97706',
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '700',
  },
  notSetText: {
    color: '#D97706',
    fontFamily: 'Urbanist',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    textAlign: 'center',
  },
  setStatusBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  setStatusText: {
    color: '#16A34A',
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '700',
  },
  editPencil: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    position: 'relative',
    width: 24,
  },
  pencilBody: {
    borderColor: '#9CA3AF',
    borderRadius: 2,
    borderWidth: 1.5,
    height: 16,
    position: 'absolute',
    top: 4,
    transform: [{ rotate: '-45deg' }],
    width: 8,
  },
  pencilTip: {
    borderColor: '#9CA3AF',
    borderWidth: 1.5,
    bottom: 4,
    height: 4,
    position: 'absolute',
    width: 4,
  },
  payoutEmptyBox: {
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    gap: 12,
    padding: 20,
  },
  payoutEmptyText: {
    color: '#9CA3AF',
    fontFamily: 'Urbanist',
    fontSize: 14,
    textAlign: 'center',
  },
  setupBtn: {
    backgroundColor: '#42007A',
    borderRadius: 100,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  setupBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 15,
    fontWeight: '700',
  },
  payoutSetBox: {
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    gap: 6,
    padding: 14,
  },
  payoutSetRow: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 13,
  },
  payoutSetLabel: {
    color: '#100013',
    fontWeight: '700',
  },
});

const pmStyles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(12,1,20,0.4)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  screen: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#EDE9FF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerTitle: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 22,
    fontWeight: '700',
  },
  closeBtn: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  closeStroke: {
    backgroundColor: '#584D5A',
    borderRadius: 2,
    height: 2,
    position: 'absolute',
    width: 16,
  },
  closeStroke1: { transform: [{ rotate: '45deg' }] },
  closeStroke2: { transform: [{ rotate: '-45deg' }] },
  body: {
    gap: 16,
    padding: 24,
  },
  field: { gap: 8 },
  fieldLabel: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 14,
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
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  footer: {
    borderTopColor: '#F0EEF0',
    borderTopWidth: 1,
    padding: 20,
  },
  saveBtn: {
    alignItems: 'center',
    backgroundColor: '#8359D5',
    borderRadius: 100,
    paddingVertical: 16,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 16,
    fontWeight: '700',
  },
});
