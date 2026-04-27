import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../shared/ui';

interface RoleMember {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly initial: string;
  readonly color: string;
}

const MOCK_MANAGERS: RoleMember[] = [
  { id: '1', name: 'oppskills', email: 'oppskills15@gmail.com', initial: 'O', color: '#4B7A3A' },
  { id: '2', name: 'Harshit', email: 'harshitthakur012@gmail.com', initial: 'H', color: '#2D4A7A' },
  { id: '3', name: '4154arpit Mehral', email: '4154arpitmehrl@gmail.com', initial: '4', color: '#7A4B2D' },
  { id: '4', name: 'bca bca', email: 'bca@tiips.ac.in', initial: 'b', color: '#3A4B7A' },
];

const MOCK_EVALUATORS: RoleMember[] = [
  { id: '5', name: 'Evaluator User', email: 'evaluator@example.com', initial: 'E', color: '#8359D5' },
];

type RoleTab = 'manager' | 'evaluator';

export function ManageRolesPanel() {
  const [activeTab, setActiveTab] = useState<RoleTab>('manager');

  const list = activeTab === 'manager' ? MOCK_MANAGERS : MOCK_EVALUATORS;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AppText style={styles.subtitle}>
        Manage user roles, set permissions, and control access for a secure system.
      </AppText>

      {/* Owner card */}
      <View style={styles.ownerCard}>
        <View style={styles.ownerLeft}>
          <View style={styles.ownerAvatar}>
            <AppText style={styles.ownerInitial}>S</AppText>
          </View>
          <View style={styles.ownerInfo}>
            <View style={styles.ownerNameRow}>
              <AppText style={styles.ownerName}>Srishti Singh</AppText>
              <View style={styles.ownerBadge}>
                <AppText style={styles.ownerBadgeText}>Owner</AppText>
              </View>
            </View>
            <AppText style={styles.ownerEmail}>srishti16uv05@gmail.com</AppText>
          </View>
        </View>
        <AppText style={styles.cannotModify}>Cannot be modified</AppText>
      </View>

      <View style={styles.divider} />

      {/* Role tabs */}
      <View style={styles.tabRow}>
        <Pressable
          onPress={() => setActiveTab('manager')}
          style={[styles.roleTab, activeTab === 'manager' ? styles.roleTabActive : null]}
        >
          <AppText style={[styles.roleTabText, activeTab === 'manager' ? styles.roleTabTextActive : null]}>
            Manager ({MOCK_MANAGERS.length})
          </AppText>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('evaluator')}
          style={[styles.roleTab, activeTab === 'evaluator' ? styles.roleTabActive : null]}
        >
          <AppText style={[styles.roleTabText, activeTab === 'evaluator' ? styles.roleTabTextActive : null]}>
            Evaluator ({MOCK_EVALUATORS.length})
          </AppText>
        </Pressable>
      </View>

      {/* Members list */}
      {list.map((member) => (
        <View key={member.id} style={styles.memberCard}>
          <View style={styles.memberLeft}>
            <View style={[styles.memberAvatar, { backgroundColor: member.color }]}>
              <AppText style={styles.memberInitial}>{member.initial}</AppText>
            </View>
            <View style={styles.memberInfo}>
              <AppText style={styles.memberName}>{member.name}</AppText>
              <AppText style={styles.memberEmail}>{member.email}</AppText>
            </View>
          </View>
          <View style={styles.removeRow}>
            <View style={styles.trashWrap}>
              <View style={styles.trashLid} />
              <View style={styles.trashBody} />
            </View>
            <AppText style={styles.removeText}>Remove</AppText>
          </View>
        </View>
      ))}
    </ScrollView>
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
  ownerCard: {
    backgroundColor: '#EDE9FF',
    borderRadius: 16,
    gap: 10,
    padding: 16,
  },
  ownerLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  ownerAvatar: {
    alignItems: 'center',
    backgroundColor: '#6949AA',
    borderRadius: 28,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  ownerInitial: {
    color: '#FFFFFF',
    fontFamily: 'Aeonik Pro',
    fontSize: 20,
    fontWeight: '700',
  },
  ownerInfo: {
    flex: 1,
    gap: 4,
  },
  ownerNameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  ownerName: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 16,
    fontWeight: '700',
  },
  ownerBadge: {
    backgroundColor: '#8359D5',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  ownerBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '600',
  },
  ownerEmail: {
    color: '#7C737E',
    fontFamily: 'Urbanist',
    fontSize: 13,
  },
  cannotModify: {
    color: '#9CA3AF',
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'right',
  },
  divider: {
    backgroundColor: '#E8E6E8',
    height: 1,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleTab: {
    borderColor: '#E8E6E8',
    borderRadius: 100,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  roleTabActive: {
    backgroundColor: '#8359D5',
    borderColor: '#8359D5',
  },
  roleTabText: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '600',
  },
  roleTabTextActive: {
    color: '#FFFFFF',
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E6E8',
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  memberLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  memberAvatar: {
    alignItems: 'center',
    borderRadius: 28,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  memberInitial: {
    color: '#FFFFFF',
    fontFamily: 'Aeonik Pro',
    fontSize: 18,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
    gap: 3,
  },
  memberName: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 15,
    fontWeight: '700',
  },
  memberEmail: {
    color: '#7C737E',
    fontFamily: 'Urbanist',
    fontSize: 13,
  },
  removeRow: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    flexDirection: 'row',
    gap: 6,
  },
  trashWrap: {
    alignItems: 'center',
    height: 18,
    justifyContent: 'flex-end',
    position: 'relative',
    width: 14,
  },
  trashLid: {
    backgroundColor: '#EF4444',
    borderRadius: 1,
    height: 2,
    position: 'absolute',
    top: 0,
    width: 14,
  },
  trashBody: {
    borderColor: '#EF4444',
    borderRadius: 2,
    borderWidth: 1.5,
    bottom: 0,
    height: 12,
    position: 'absolute',
    width: 11,
  },
  removeText: {
    color: '#EF4444',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '500',
  },
});
