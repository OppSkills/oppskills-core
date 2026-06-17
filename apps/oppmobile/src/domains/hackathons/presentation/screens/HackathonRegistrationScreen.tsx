import { useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import bannerImage from '../../../../../assets/highres_490352821 1.png';
import { useAppSession } from '../../../../shared/auth/useAppSession';
import { useHideTabBar } from '../../../../shared/hooks/useHideTabBar';
import { AppText } from '../../../../shared/ui';
import { useCreateTeam } from '../hooks/useTeamRegistration';
import { useRequestJoinTeam, useTeamJoinRequests, useRespondJoinRequest, useLeaveTeam, useKickMember, useChangeLeader } from '../hooks/useTeamRequests';
import { useTeamDetails } from '../hooks/useTeamDetails';
import { useMyTeam } from '../hooks/useMyTeam';
import { useHackathonDetail } from '../hooks/useHackathonDetail';

import * as DocumentPicker from 'expo-document-picker';
import { useMyTeamSubmissions, useUpsertRoundSubmission } from '../hooks/useTeamSubmissions';
import { uploadDocument } from '../../../../shared/api/mediaClient';

type TeamMode = 'create' | 'join';

// ── Sub-steps for each mode ──────────────────────────────────────────────────
// Create team: step 1 = Team Name + toggle, step 2 = Leader details
// Join team:   step 1 = Search / Code,      step 2 = Personal details

interface HackathonRegistrationScreenProps {
  readonly hackathon?: { id?: string; title?: string; bannerImageUrl?: string | null };
  readonly onBack: () => void;
  readonly onRegistered?: () => void;
}

export function HackathonRegistrationScreen({
  hackathon,
  onBack,
  onRegistered,
}: HackathonRegistrationScreenProps) {
  useHideTabBar();
  const session = useAppSession();
  const { data: hackathonDetail } = useHackathonDetail(hackathon?.id || '');

  const [mode, setMode] = useState<TeamMode>('create');
  const [step, setStep] = useState<1 | 2>(1);
  const [registered, setRegistered] = useState(false);

  // Create team fields
  const [teamName, setTeamName] = useState('');
  const [openToJoin, setOpenToJoin] = useState(true);
  const [leaderPhone, setLeaderPhone] = useState('');
  const [leaderRoll, setLeaderRoll] = useState('');


  // Join team fields
  const [searchTeam, setSearchTeam] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [yourPhone, setYourPhone] = useState('');
  const [yourRoll, setYourRoll] = useState('');

  // Referral code
  const [referralCode, setReferralCode] = useState('');


  const userName = `${session.firstName ?? ''} ${session.lastName ?? ''}`.trim() || 'Rohit';
  const userEmail = session.userEmail ?? 'tstrohittiwari@gmail.com';

  function handleModeChange(next: TeamMode) {
    setMode(next);
    setStep(1);
  }

  const { data: myTeam } = useMyTeam(hackathon?.id || '');
  const { mutateAsync: createTeam, isPending: isCreating } = useCreateTeam();
  const { mutateAsync: requestJoin, isPending: isJoining } = useRequestJoinTeam();

  async function handlePrimaryAction() {
    if (mode === 'create') {
      if (step === 1) {
        if (!teamName.trim()) return;
        setStep(2);
      } else {
        if (!hackathon?.id) return;
        try {
          await createTeam({
            hackathonId: hackathon.id,
            name: teamName,
            isOpen: openToJoin,
            answers: [
              { fieldId: 'default-name', value: userName },
              { fieldId: 'default-email', value: userEmail },
              { fieldId: 'default-phone', value: leaderPhone || '0000000000' },
              { fieldId: 'default-gender', value: 'PREFER_NOT_TO_SAY' },
              { fieldId: 'default-college-name', value: 'Unknown College' }
            ],
            referralCode: referralCode || undefined,
          });
          setRegistered(true);
          onRegistered?.();
        } catch (e) {
          console.error(e);
          // Show error toast
        }
      }
    } else {
      if (step === 1) {
        if (!teamCode.trim()) return;
        setStep(2);
      } else {
        if (!hackathon?.id) return;
        try {
          await requestJoin({
            invitationCode: teamCode,
            answers: [
              { fieldId: 'default-name', value: userName },
              { fieldId: 'default-email', value: userEmail },
              { fieldId: 'default-phone', value: yourPhone || '0000000000' },
              { fieldId: 'default-gender', value: 'PREFER_NOT_TO_SAY' },
              { fieldId: 'default-college-name', value: 'Unknown College' },
              { fieldId: 'yourPhone', value: yourPhone },
              { fieldId: 'yourRoll', value: yourRoll }
            ],
            referralCode: referralCode || undefined,
          });
          setRegistered(true);
          onRegistered?.();
        } catch (e) {
          console.error(e);
          // Show error toast
        }
      }
    }
  }

  if (registered || myTeam) {
    return (
      <TeamDetailsScreen
        hackathon={hackathon}
        onBack={onBack}
        teamId={myTeam?.id}
        teamName={myTeam?.name || teamName || 'Team Orange Wheel'}
        userName={userName}
        userEmail={userEmail}
      />
    );
  }

  const isBusy = isCreating || isJoining;
  const primaryLabel = isBusy ? 'Processing...' : mode === 'join' && step === 2 ? 'Request to join team' : 'Register as team';

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      {/* Banner */}
      <View style={styles.heroContainer}>
        <ImageBackground
          resizeMode="cover"
          source={
            hackathon?.bannerImageUrl
              ? { uri: hackathon.bannerImageUrl }
              : hackathonDetail?.bannerImageUrl
              ? { uri: hackathonDetail.bannerImageUrl }
              : bannerImage
          }
          style={styles.hero}
        >
          <View style={styles.backButtonWrap}>
            <Pressable hitSlop={8} onPress={onBack} style={styles.backButton}>
              <View style={styles.backArrowOuter}>
                <View style={styles.backArrowLeft} />
                <View style={styles.backArrowRight} />
              </View>
            </Pressable>
            {hackathon?.title ? (
              <AppText numberOfLines={1} style={styles.backLabel}>
                {hackathon.title}
              </AppText>
            ) : null}
          </View>

          {/* Hackathon name overlay */}
          <View style={styles.heroTextWrap}>
            <AppText style={styles.heroTitle}>
              {hackathon?.title ?? 'Edureka! Masterclass'}
            </AppText>
          </View>
        </ImageBackground>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppText style={styles.heading}>Registration Form</AppText>

        {/* Mode toggle tabs */}
        <View style={styles.modeRow}>
          <Pressable
            onPress={() => handleModeChange('create')}
            style={[
              styles.modeButton,
              mode === 'create' ? styles.modeButtonActive : styles.modeButtonInactive,
            ]}
          >
            <AppText style={styles.modeIcon}>👥</AppText>
            <AppText
              style={[
                styles.modeLabel,
                mode === 'create' ? styles.modeLabelActive : styles.modeLabelInactive,
              ]}
            >
              Create team
            </AppText>
          </Pressable>

          <Pressable
            onPress={() => handleModeChange('join')}
            style={[
              styles.modeButton,
              mode === 'join' ? styles.modeButtonActive : styles.modeButtonInactive,
            ]}
          >
            <AppText style={styles.modeIcon}>🤸</AppText>
            <AppText
              style={[
                styles.modeLabel,
                mode === 'join' ? styles.modeLabelActive : styles.modeLabelInactive,
              ]}
            >
              Join existing team
            </AppText>
          </Pressable>
        </View>

        {/* ── Create Team ── */}
        {mode === 'create' && step === 1 && (
          <>
            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>Team Name</AppText>
              <View style={styles.inputWrap}>
                <TextInput
                  onChangeText={setTeamName}
                  placeholder="Team Innovators"
                  placeholderTextColor="#9C8DAA"
                  style={styles.textInput}
                  value={teamName}
                />
              </View>
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleTextGroup}>
                <AppText style={styles.toggleTitle}>Open for other teams to join</AppText>
                <AppText style={styles.toggleSub}>
                  All other participants can request to join your team
                </AppText>
              </View>
              <Switch
                onValueChange={setOpenToJoin}
                thumbColor="#FFFFFF"
                trackColor={{ false: '#C3BFC4', true: '#0A9952' }}
                value={openToJoin}
              />
            </View>
          </>
        )}

        {mode === 'create' && step === 2 && (
          <>
            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>Team Leader Number</AppText>
              <View style={styles.inputWrap}>
                <TextInput
                  keyboardType="phone-pad"
                  onChangeText={setLeaderPhone}
                  placeholder="+91 99999 99999"
                  placeholderTextColor="#9C8DAA"
                  style={styles.textInput}
                  value={leaderPhone}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>Team Leader Roll Number</AppText>
              <View style={styles.inputWrap}>
                <TextInput
                  onChangeText={setLeaderRoll}
                  placeholder="220010155558"
                  placeholderTextColor="#9C8DAA"
                  style={styles.textInput}
                  value={leaderRoll}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>Referral Code (Optional)</AppText>
              <View style={styles.inputWrap}>
                <TextInput
                  onChangeText={setReferralCode}
                  placeholder="REF_123456"
                  placeholderTextColor="#9C8DAA"
                  style={styles.textInput}
                  value={referralCode}
                />
              </View>
            </View>
          </>
        )}

        {/* ── Join Existing Team ── */}
        {mode === 'join' && step === 1 && (
          <>
            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>Search Team</AppText>
              <View style={styles.inputWrap}>
                <TextInput
                  onChangeText={setSearchTeam}
                  placeholder="eg. Team Innovators"
                  placeholderTextColor="#9C8DAA"
                  style={styles.textInput}
                  value={searchTeam}
                />
              </View>
            </View>

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <AppText style={styles.orText}>Or</AppText>
              <View style={styles.orLine} />
            </View>

            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>Team Code</AppText>
              <View style={styles.inputWrap}>
                <TextInput
                  autoCapitalize="characters"
                  onChangeText={setTeamCode}
                  placeholder="5ADBRF64"
                  placeholderTextColor="#9C8DAA"
                  style={styles.textInput}
                  value={teamCode}
                />
              </View>
            </View>
          </>
        )}

        {mode === 'join' && step === 2 && (
          <>
            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>Your Number</AppText>
              <View style={styles.inputWrap}>
                <TextInput
                  keyboardType="phone-pad"
                  onChangeText={setYourPhone}
                  placeholder="+91 99999 99999"
                  placeholderTextColor="#9C8DAA"
                  style={styles.textInput}
                  value={yourPhone}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>Your Roll Number</AppText>
              <View style={styles.inputWrap}>
                <TextInput
                  onChangeText={setYourRoll}
                  placeholder="220010155558"
                  placeholderTextColor="#9C8DAA"
                  style={styles.textInput}
                  value={yourRoll}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>Referral Code (Optional)</AppText>
              <View style={styles.inputWrap}>
                <TextInput
                  onChangeText={setReferralCode}
                  placeholder="REF_123456"
                  placeholderTextColor="#9C8DAA"
                  style={styles.textInput}
                  value={referralCode}
                />
              </View>
            </View>
          </>
        )}

        <View style={styles.spacer} />
      </ScrollView>

      {/* Sticky footer */}
      <View style={styles.footer}>
        <View style={styles.participantCard}>
          <View style={styles.participantRow}>
            <Image
              source={{ uri: 'https://i.pravatar.cc/100?img=11' }}
              style={styles.avatarImage}
            />
            <AppText style={styles.participantName}>{userName}</AppText>
            <AppText numberOfLines={1} style={styles.participantEmail}>
              {userEmail}
            </AppText>
          </View>

          <Pressable disabled={isBusy} onPress={handlePrimaryAction} style={[styles.registerButton, isBusy && { opacity: 0.7 }]}>
            <AppText style={styles.registerLabel}>{primaryLabel}</AppText>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ── Team Details Screen (post-registration) ───────────────────────────────────
interface TeamDetailsMember {
  name: string;
  phone: string;
  email: string;
  role: 'Team Leader' | 'Team Member';
}

interface TeamDetailsScreenProps {
  readonly hackathon?: { id?: string; title?: string; bannerImageUrl?: string | null } | undefined;
  readonly onBack: () => void;
  readonly teamId?: string;
  readonly teamName: string;
  readonly userName: string;
  readonly userEmail: string;
}

function TeamDetailsScreen({ hackathon, onBack, teamId, teamName }: TeamDetailsScreenProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'requests'>('members');
  const { data: teamDetails } = useTeamDetails(teamId || '');
  const { data: teamRequests } = useTeamJoinRequests(teamId || '');
  const { mutateAsync: respondRequest } = useRespondJoinRequest();
  const { mutateAsync: leaveTeam, isPending: isLeaving } = useLeaveTeam();
  const { mutateAsync: kickMember, isPending: isKicking } = useKickMember();
  const { mutateAsync: changeLeader, isPending: isChangingLeader } = useChangeLeader();
  const { data: hackathonDetail } = useHackathonDetail(hackathon?.id || '');

  const slug = hackathonDetail?.slug || '';
  const { data: myTeamSubmissions } = useMyTeamSubmissions(slug);
  const { mutateAsync: upsertSubmission } = useUpsertRoundSubmission(slug);
  const [uploadingRoundId, setUploadingRoundId] = useState<string | null>(null);

  const session = useAppSession();
  const isLeader = session?.user?.id === teamDetails?.leaderId;

  async function handleRoundSubmission(roundId: string) {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) return;
      const file = res.assets[0];

      setUploadingRoundId(roundId);

      const { publicUrl } = await uploadDocument(
        file.uri,
        file.name,
        file.mimeType || 'application/octet-stream',
        'opportunity_attachment'
      );

      await upsertSubmission({
        roundId,
        files: [{
          name: file.name,
          url: publicUrl,
          mimeType: file.mimeType || 'application/octet-stream',
        }],
      });

      Alert.alert('Success', 'Submission uploaded successfully!');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to upload submission');
    } finally {
      setUploadingRoundId(null);
    }
  }

  async function handleAccept(requestId: string) {
    try {
      await respondRequest({ requestId, dto: { status: 'ACCEPTED' } });
    } catch (e) {
      console.error(e);
    }
  }

  async function handleReject(requestId: string) {
    try {
      await respondRequest({ requestId, dto: { status: 'REJECTED' } });
    } catch (e) {
      console.error(e);
    }
  }

  async function handleLeaveTeam() {
    if (!teamId) return;
    Alert.alert(
      isLeader ? 'Disband Team' : 'Leave Team',
      isLeader
        ? 'As team leader, leaving will disband the entire team. Are you sure?'
        : 'Are you sure you want to leave this team?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isLeader ? 'Disband' : 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveTeam(teamId);
              onBack();
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'Could not leave the team. Please try again.');
            }
          },
        },
      ],
    );
  }

  async function handleKickMember(userId: string, memberName: string) {
    if (!teamId) return;
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from the team?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await kickMember({ teamId, userId });
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'Could not remove the member. Please try again.');
            }
          },
        },
      ],
    );
  }

  async function handleMakeLeader(userId: string, memberName: string) {
    if (!teamId) return;
    Alert.alert(
      'Transfer Leadership',
      `Make ${memberName} the new team leader?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Transfer',
          style: 'default',
          onPress: async () => {
            try {
              await changeLeader({ teamId, newLeaderId: userId });
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'Could not transfer leadership. Please try again.');
            }
          },
        },
      ],
    );
  }

  // Build members list — leader always first
  type MemberItem = {
    userId: string;
    name: string;
    phone: string;
    email: string;
    imageUrl: string | null;
    role: 'Team Leader' | 'Team Member';
  };

  const membersList: MemberItem[] = [];
  if (teamDetails?.leader) {
    membersList.push({
      userId: teamDetails.leader.id,
      name: `${teamDetails.leader.firstName ?? ''} ${teamDetails.leader.lastName ?? ''}`.trim() || teamDetails.leader.email,
      phone: teamDetails.leaderPhone || '',
      email: teamDetails.leader.email,
      imageUrl: teamDetails.leader.imageUrl ?? null,
      role: 'Team Leader',
    });
  }
  (teamDetails?.members ?? []).forEach(m => {
    if (m.userId !== teamDetails?.leaderId) {
      membersList.push({
        userId: m.userId,
        name: `${m.user.firstName ?? ''} ${m.user.lastName ?? ''}`.trim() || m.user.email,
        phone: '',
        email: m.user.email,
        imageUrl: m.user.imageUrl ?? null,
        role: 'Team Member',
      });
    }
  });

  const joinRequests = teamRequests?.filter(r => r.status === 'PENDING') || [];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.heroContainer}>
          <ImageBackground
            resizeMode="cover"
            source={
              hackathon?.bannerImageUrl
                ? { uri: hackathon.bannerImageUrl }
                : hackathonDetail?.bannerImageUrl
                ? { uri: hackathonDetail.bannerImageUrl }
                : bannerImage
            }
            style={styles.heroBanner}
          >
            <View style={styles.backButtonWrap}>
              <Pressable hitSlop={8} onPress={onBack} style={styles.backButton}>
                <View style={styles.backArrowOuter}>
                  <View style={styles.backArrowLeft} />
                  <View style={styles.backArrowRight} />
                </View>
              </Pressable>
              {hackathon?.title ? (
                <AppText numberOfLines={1} style={styles.backLabel}>{hackathon.title}</AppText>
              ) : null}
            </View>
            <View style={styles.heroTextWrap}>
              <AppText style={styles.heroTitle}>
                {hackathon?.title ?? 'Edureka! Masterclass'}
              </AppText>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.teamDetailsBody}>
          {/* Team header */}
          <AppText style={styles.teamDetailsTitle}>Team Details</AppText>
          <AppText style={styles.teamNameLabel}>
            Team Name:{' '}
            <AppText style={styles.teamNameValue}>{teamDetails?.name || teamName} ({membersList.length}/{teamDetails?.maxSize || 4})</AppText>
          </AppText>

          {/* Tabs */}
          <View style={styles.modeRow}>
            <Pressable
              onPress={() => setActiveTab('members')}
              style={[
                styles.modeButton,
                activeTab === 'members' ? styles.modeButtonActive : styles.modeButtonInactive,
              ]}
            >
              <AppText style={styles.modeIcon}>👥</AppText>
              <AppText
                style={[
                  styles.modeLabel,
                  activeTab === 'members' ? styles.modeLabelActive : styles.modeLabelInactive,
                ]}
              >
                Team Members
              </AppText>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('requests')}
              style={[
                styles.modeButton,
                activeTab === 'requests' ? styles.modeButtonActive : styles.modeButtonInactive,
              ]}
            >
              <AppText style={styles.modeIcon}>🤸</AppText>
              <AppText
                style={[
                  styles.modeLabel,
                  activeTab === 'requests' ? styles.modeLabelActive : styles.modeLabelInactive,
                ]}
              >
                Join Requests{joinRequests.length > 0 ? ` (${joinRequests.length})` : ''}
              </AppText>
            </Pressable>
          </View>

          {/* Member list */}
          {activeTab === 'members' && (
            <View style={styles.memberList}>
              {membersList.map((member) => (
                <View key={member.userId} style={styles.memberRow}>
                  {/* Avatar */}
                  {member.imageUrl ? (
                    <Image source={{ uri: member.imageUrl }} style={styles.memberAvatarImg} />
                  ) : (
                    <View style={styles.memberAvatar}>
                      <AppText style={styles.memberAvatarText}>
                        {member.name.charAt(0).toUpperCase()}
                      </AppText>
                    </View>
                  )}
                  <View style={[styles.memberInfo, { flex: 1 }]}>
                    <View style={styles.memberNameRow}>
                      <AppText style={[styles.memberName, { flex: 1 }]} numberOfLines={1}>{member.name}</AppText>
                      <View
                        style={[
                          styles.memberRoleBadge,
                          member.role === 'Team Leader'
                            ? styles.memberRoleLeader
                            : styles.memberRoleMember,
                        ]}
                      >
                        <AppText
                          style={[
                            styles.memberRoleText,
                            member.role === 'Team Leader'
                              ? styles.memberRoleLeaderText
                              : styles.memberRoleMemberText,
                          ]}
                        >
                          {member.role}
                        </AppText>
                      </View>
                    </View>
                    <AppText style={styles.memberMeta} numberOfLines={1}>
                      {member.phone ? `${member.phone}  •  ` : ''}{member.email}
                    </AppText>

                    {/* Leader-only actions for non-leader members */}
                    {isLeader && member.role !== 'Team Leader' && (
                      <View style={styles.memberActions}>
                        <Pressable
                          onPress={() => handleMakeLeader(member.userId, member.name)}
                          style={[styles.memberActionBtn, styles.memberActionMakeLeader]}
                          disabled={isChangingLeader}
                        >
                          <AppText style={styles.memberActionMakeLeaderText}>👑 Make Leader</AppText>
                        </Pressable>
                        <Pressable
                          onPress={() => handleKickMember(member.userId, member.name)}
                          style={[styles.memberActionBtn, styles.memberActionKick]}
                          disabled={isKicking}
                        >
                          <AppText style={styles.memberActionKickText}>✕ Remove</AppText>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              ))}

              {/* Leave Team button */}
              <Pressable
                onPress={handleLeaveTeam}
                style={[styles.leaveTeamBtn, isLeaving && { opacity: 0.6 }]}
                disabled={isLeaving}
              >
                <AppText style={styles.leaveTeamText}>
                  {isLeaving ? 'Leaving...' : isLeader ? '🗑 Disband Team' : '🚪 Leave Team'}
                </AppText>
              </Pressable>
            </View>
          )}

          {activeTab === 'requests' && (
            <View style={styles.memberList}>
              {joinRequests.length === 0 ? (
                <View style={styles.emptyRequests}>
                  <AppText style={styles.emptyRequestsText}>No join requests yet.</AppText>
                </View>
              ) : (
                joinRequests.map((req) => (
                  <View key={req.id} style={styles.memberRow}>
                    <View style={styles.memberAvatar}>
                      <AppText style={styles.memberAvatarText}>TM</AppText>
                    </View>
                    <View style={styles.memberInfo}>
                      <View style={styles.memberNameRow}>
                        <AppText style={[styles.memberName, { flex: 1 }]}>
                          {`${req.user.firstName ?? ''} ${req.user.lastName ?? ''}`.trim() || req.user.email}
                        </AppText>
                        <Pressable onPress={() => handleAccept(req.id)} style={styles.acceptBtn}>
                          <AppText style={styles.acceptText}>Accept</AppText>
                        </Pressable>
                        <Pressable onPress={() => handleReject(req.id)} style={styles.rejectBtn}>
                          <AppText style={styles.rejectText}>Reject</AppText>
                        </Pressable>
                      </View>
                      <AppText style={styles.memberMeta}>{req.user.email}</AppText>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          <AppText style={styles.roundsTitle}>Round Details</AppText>

          <View style={styles.roundList}>
            {hackathonDetail?.rounds?.map((round, idx) => (
              <View key={round.id} style={styles.roundGroup}>
                <View style={styles.roundLabelRow}>
                  <View style={[styles.roundDot, styles.roundDotDefault]} />
                  <AppText style={styles.roundLabel}>Round {idx + 1}</AppText>
                </View>

                <View style={[styles.roundCard, styles.roundCardDefault]}>
                  <View style={styles.roundCardHeader}>
                    <AppText style={styles.roundName}>{round.title}</AppText>
                  </View>
                  <AppText style={styles.roundDescription}>{round.checkpoints[0] || round.timeline}</AppText>
                  <AppText style={styles.roundNotes}>{round.stageLabel}</AppText>

                  <View style={styles.roundDateRow}>
                    <View style={styles.calIcon} />
                    <AppText style={styles.roundDateText}>Timeline: {round.timeline}</AppText>
                  </View>

                  {/* Uploaded Files display */}
                  {myTeamSubmissions?.submissions?.[round.id]?.files?.length ? (
                    <View style={{ marginTop: 12 }}>
                      <AppText style={{ fontSize: 13, color: '#333', fontWeight: 'bold', marginBottom: 4 }}>
                        Submitted Files:
                      </AppText>
                      {myTeamSubmissions.submissions[round.id].files.map((f, i) => (
                        <AppText key={i} style={{ fontSize: 12, color: '#6A5ACD' }} numberOfLines={1}>
                          • {f.name}
                        </AppText>
                      ))}
                    </View>
                  ) : null}

                  {/* Upload button for team leader */}
                  {isLeader && round.stageLabel !== 'Completed' && (
                    <Pressable
                      style={[styles.uploadBtn, uploadingRoundId === round.id && { opacity: 0.5 }]}
                      onPress={() => handleRoundSubmission(round.id)}
                      disabled={uploadingRoundId === round.id}
                    >
                      <AppText style={styles.uploadBtnText}>
                        {uploadingRoundId === round.id ? 'Uploading...' : 'Upload Submission'}
                      </AppText>
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#FAFAFA',
    flex: 1,
  },
  heroContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 36,
  },
  hero: {
    height: 235,
    position: 'relative',
    width: '100%',
  },
  heroBanner: {
    height: 180,
    position: 'relative',
    width: '100%',
  },
  backButtonWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    left: 12,
    position: 'absolute',
    top: 12,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.90)',
    borderRadius: 24,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  backArrowOuter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  backArrowLeft: {
    backgroundColor: '#342636',
    borderRadius: 1,
    height: 2,
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
    width: 10,
    top: -4,
    left: 1,
  },
  backArrowRight: {
    backgroundColor: '#342636',
    borderRadius: 1,
    height: 2,
    position: 'absolute',
    transform: [{ rotate: '-45deg' }],
    width: 10,
    top: 2,
    left: 1,
  },
  backLabel: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '600',
  },
  heroTextWrap: {
    bottom: 20,
    left: 16,
    position: 'absolute',
    right: 16,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontFamily: 'Aeonik Pro',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  scrollContent: {
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  heading: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    marginTop: 24,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modeButton: {
    alignItems: 'center',
    borderRadius: 100,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    height: 42,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  modeButtonActive: {
    backgroundColor: '#F3EEFF',
    borderColor: '#6949AA',
    borderWidth: 1.5,
  },
  modeButtonInactive: {
    backgroundColor: '#F3EEFF',
    borderColor: 'transparent',
    borderWidth: 1.5,
  },
  modeIcon: {
    fontSize: 16,
  },
  modeLabel: {
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '500',
  },
  modeLabelActive: {
    color: '#6949AA',
  },
  modeLabelInactive: {
    color: '#584D5A',
  },
  fieldGroup: {
    gap: 6,
    marginTop: 20,
  },
  fieldLabel: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 12,
    lineHeight: 16,
  },
  inputWrap: {
    backgroundColor: '#FAFAFA',
    borderColor: '#C3BFC4',
    borderRadius: 100,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  uploadWrap: {
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderColor: '#C3BFC4',
    borderRadius: 100,
    borderWidth: 1,
    flexDirection: 'row',
    height: 48,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  textInput: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 14,
    lineHeight: 21,
    padding: 0,
  },
  orRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  orLine: {
    backgroundColor: '#E8E6E8',
    flex: 1,
    height: 1,
  },
  orText: {
    color: '#9C8DAA',
    fontFamily: 'Urbanist',
    fontSize: 14,
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  toggleTextGroup: {
    flex: 1,
    gap: 4,
  },
  toggleTitle: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  toggleSub: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 12,
    lineHeight: 18,
  },
  spacer: {
    height: 24,
  },

  /* Footer */
  footer: {
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  participantCard: {
    backgroundColor: '#F3EEFF',
    borderColor: '#6949AA',
    borderRadius: 26,
    borderWidth: 0.5,
    gap: 8,
    paddingBottom: 6,
    paddingHorizontal: 6,
    paddingTop: 10,
  },
  participantRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  avatarImage: {
    borderRadius: 10,
    height: 24,
    width: 24,
  },
  participantName: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 17,
  },
  participantEmail: {
    color: '#584D5A',
    flex: 1,
    fontFamily: 'Urbanist',
    fontSize: 14,
    lineHeight: 21,
  },
  registerButton: {
    alignItems: 'center',
    backgroundColor: '#423072',
    borderRadius: 100,
    height: 50,
    justifyContent: 'center',
    width: '100%',
  },
  registerLabel: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 16,
    fontWeight: '600',
  },

  /* Team Details Screen */
  teamDetailsBody: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  teamDetailsTitle: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 20,
  },
  teamNameLabel: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 14,
    marginTop: 6,
  },
  teamNameValue: {
    color: '#6949AA',
    fontWeight: '600',
  },

  /* Member list */
  memberList: {
    gap: 12,
    marginTop: 16,
  },
  memberRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  memberAvatar: {
    alignItems: 'center',
    backgroundColor: '#2D1B5E',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  memberAvatarText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
    gap: 3,
  },
  memberNameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  memberName: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '600',
  },
  memberRoleBadge: {
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  memberRoleLeader: {
    backgroundColor: '#FFF3DC',
    borderColor: '#F5A623',
    borderWidth: 1,
  },
  memberRoleMember: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  memberRoleText: {
    fontFamily: 'Urbanist',
    fontSize: 11,
    fontWeight: '600',
  },
  memberRoleLeaderText: {
    color: '#C17B00',
  },
  memberRoleMemberText: {
    color: '#2E7D32',
  },
  memberMeta: {
    color: '#7C737E',
    fontFamily: 'Urbanist',
    fontSize: 12,
  },

  emptyRequests: {
    alignItems: 'center',
    marginTop: 32,
    paddingVertical: 24,
  },
  emptyRequestsText: {
    color: '#9C8DAA',
    fontFamily: 'Urbanist',
    fontSize: 14,
  },
  acceptBtn: {
    borderColor: '#22C55E',
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginLeft: 6,
  },
  acceptText: {
    color: '#16A34A',
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '600',
  },
  rejectBtn: {
    borderColor: '#EF4444',
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginLeft: 4,
  },
  rejectText: {
    color: '#DC2626',
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '600',
  },

  /* Member avatar image (when real photo available) */
  memberAvatarImg: {
    borderRadius: 22,
    height: 44,
    width: 44,
  },

  /* Member action row (kick / make leader) */
  memberActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  memberActionBtn: {
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  memberActionKick: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  memberActionKickText: {
    color: '#DC2626',
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '600',
  },
  memberActionMakeLeader: {
    borderColor: '#F5A623',
    backgroundColor: '#FFF8EE',
  },
  memberActionMakeLeaderText: {
    color: '#C17B00',
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '600',
  },

  /* Leave / Disband button */
  leaveTeamBtn: {
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
    paddingVertical: 14,
  },
  leaveTeamText: {
    color: '#DC2626',
    fontFamily: 'Urbanist',
    fontSize: 15,
    fontWeight: '700',
  },

  /* Round Details */
  roundsTitle: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 32,
    marginBottom: 16,
  },
  roundList: {
    gap: 20,
  },
  roundGroup: {
    gap: 8,
  },
  roundLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  roundDot: {
    borderRadius: 8,
    height: 12,
    width: 12,
  },
  roundDotQualified: {
    backgroundColor: '#22C55E',
  },
  roundDotDefault: {
    backgroundColor: '#C3BFC4',
  },
  roundLabel: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '600',
  },
  roundCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
    padding: 16,
  },
  roundCardQualified: {
    backgroundColor: '#FAFFF9',
    borderColor: '#22C55E',
  },
  roundCardDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E6E8',
  },
  roundCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roundName: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 16,
    fontWeight: '600',
  },
  qualifiedBadge: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  qualifiedText: {
    color: '#16A34A',
    fontFamily: 'Urbanist',
    fontSize: 11,
    fontWeight: '600',
  },
  roundDescription: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 13,
    lineHeight: 18,
  },
  roundNotes: {
    color: '#7C737E',
    fontFamily: 'Urbanist',
    fontSize: 13,
  },
  roundDateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  calIcon: {
    borderColor: '#7C737E',
    borderRadius: 2,
    borderWidth: 1,
    height: 12,
    width: 12,
  },
  roundDateText: {
    color: '#584D5A',
    fontFamily: 'Urbanist',
    fontSize: 12,
  },
  uploadPptRow: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  uploadPptText: {
    color: '#6949AA',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '500',
  },
  uploadBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#6A5ACD',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
