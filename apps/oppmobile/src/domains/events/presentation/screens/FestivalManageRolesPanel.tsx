import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { AppText } from '../../../../shared/ui';
import { apiClient } from '../../../../shared/api/apiClient';

interface RoleMember {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly initial: string;
  readonly color: string;
}

interface EventRoleItem {
  readonly id: string;
  readonly email: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly imageUrl: string | null;
}

interface EventRolesResponse {
  readonly owner: EventRoleItem;
  readonly managers: readonly EventRoleItem[];
  readonly evaluators: readonly EventRoleItem[];
}

type RoleTab = 'manager' | 'evaluator';

interface FestivalManageRolesPanelProps {
  readonly eventId: string;
}

function getPersonName(person: EventRoleItem) {
  const name = `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim();
  return name || person.email;
}

function getColorForRole(role: RoleTab) {
  return role === 'manager' ? '#4B7A3A' : '#8359D5';
}

export function FestivalManageRolesPanel({ eventId }: FestivalManageRolesPanelProps) {
  const [activeTab, setActiveTab] = useState<RoleTab>('manager');

  const { data, isLoading, isError } = useQuery<EventRolesResponse>({
    queryKey: ['event', eventId, 'roles'],
    queryFn: () => apiClient.getAuth<EventRolesResponse>(`/events/${eventId}/roles`),
    enabled: !!eventId,
    staleTime: 1000 * 60 * 2,
    retry: false,
  });

  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#8359D5" />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.errorWrap}>
        <AppText style={styles.errorText}>Unable to load roles. Please try again.</AppText>
      </View>
    );
  }

  const ownerName = getPersonName(data.owner);
  const ownerInitial = ownerName.charAt(0).toUpperCase();
  const managers: RoleMember[] = data.managers.map((member) => ({
    id: member.id,
    name: getPersonName(member),
    email: member.email,
    initial: getPersonName(member).charAt(0).toUpperCase(),
    color: getColorForRole('manager'),
  }));
  const evaluators: RoleMember[] = data.evaluators.map((member) => ({
    id: member.id,
    name: getPersonName(member),
    email: member.email,
    initial: getPersonName(member).charAt(0).toUpperCase(),
    color: getColorForRole('evaluator'),
  }));

  const list = activeTab === 'manager' ? managers : evaluators;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AppText style={styles.subtitle}>
        Manage user roles, set permissions, and control access for a secure system.
      </AppText>

      <View style={styles.ownerCard}>
        <View style={styles.ownerLeft}>
          <View style={styles.ownerAvatar}>
            <AppText style={styles.ownerInitial}>{ownerInitial}</AppText>
          </View>
          <View style={styles.ownerInfo}>
            <View style={styles.ownerNameRow}>
              <AppText style={styles.ownerName}>{ownerName}</AppText>
              <View style={styles.ownerBadge}>
                <AppText style={styles.ownerBadgeText}>Owner</AppText>
              </View>
            </View>
            <AppText style={styles.ownerEmail}>{data.owner.email}</AppText>
          </View>
        </View>
        <AppText style={styles.cannotModify}>Cannot be modified</AppText>
      </View>

      <View style={styles.divider} />

      <View style={styles.tabRow}>
        <Pressable
          onPress={() => setActiveTab('manager')}
          style={[styles.roleTab, activeTab === 'manager' ? styles.roleTabActive : null]}
        >
          <AppText style={[styles.roleTabText, activeTab === 'manager' ? styles.roleTabTextActive : null]}>
            Manager ({managers.length})
          </AppText>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('evaluator')}
          style={[styles.roleTab, activeTab === 'evaluator' ? styles.roleTabActive : null]}
        >
          <AppText style={[styles.roleTabText, activeTab === 'evaluator' ? styles.roleTabTextActive : null]}>
            Evaluator ({evaluators.length})
          </AppText>
        </Pressable>
      </View>

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
  loadingWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    color: '#EF4444',
    fontFamily: 'Urbanist',
    fontSize: 14,
    textAlign: 'center',
  },
});
