import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { AppText } from '../../../../../shared/ui';
import { apiClient } from '../../../../../shared/api/apiClient';

interface ManageHackathonRegistrationScreenProps {
  readonly slug: string;
}

interface HackathonRegistrationResponse {
  readonly hackathonId: string;
  readonly rounds: readonly {
    readonly id: string;
    readonly name: string;
    readonly order: number;
    readonly roundType: string;
  }[];
  readonly teams: readonly {
    readonly teamId: string;
    readonly teamName: string;
    readonly memberCount: number;
    readonly maxSize: number;
    readonly leader: {
      readonly id: string;
      readonly email: string;
      readonly firstName: string | null;
      readonly lastName: string | null;
      readonly imageUrl: string | null;
      readonly university: string | null;
      readonly location: string | null;
    };
    readonly roundSubmissions: Record<string, { 
      submissionId: string;
      submittedAt: string | null;
      payload: {
        files: Array<{ url: string; name: string }>;
        note?: string;
      };
    }>;
  }[];
}

// ── Mock Data for Missing Fields in UI ────────────────────────────────────────
const MOCK_AVATAR = 'https://i.pravatar.cc/150?img=47'; // Maya Patel looking avatar
const MOCK_QR = 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg';

type StageType = 'all' | 'round';
interface Stage {
  id: string;
  type: StageType;
  label: string;
  subLabel: string;
}

export function ManageHackathonRegistrationScreen({ slug }: ManageHackathonRegistrationScreenProps) {
  const [search, setSearch] = useState('');
  const [activeStageId, setActiveStageId] = useState<string>('all');
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const { data, isLoading, isError } = useQuery<HackathonRegistrationResponse>({
    queryKey: ['hackathon', 'registrations', slug],
    queryFn: () => apiClient.getAuth<HackathonRegistrationResponse>(`/hackathons/by-slug/${slug}/registrations`),
    enabled: !!slug,
    staleTime: 1000 * 60 * 2,
    retry: false,
  });

  // Build dynamic stages
  const stages: Stage[] = useMemo(() => {
    const defaultStage: Stage = {
      id: 'all',
      type: 'all',
      label: 'All registrations',
      subLabel: 'All registered teams',
    };
    if (!data?.rounds || data.rounds.length === 0) return [defaultStage];
    
    const roundStages = data.rounds.map((r, idx) => ({
      id: r.id,
      type: 'round' as StageType,
      label: `R${idx + 1} - ${r.name}`,
      subLabel: `${r.roundType || 'ONLINE'} round`,
    }));
    return [defaultStage, ...roundStages];
  }, [data]);

  const teams = useMemo(() => {
    return (data?.teams ?? []).map((team) => {
      const isCompleted = Object.keys(team.roundSubmissions).length > 0;
      return {
        id: team.teamId,
        name: `${team.leader.firstName || ''} ${team.leader.lastName || ''}`.trim() || team.teamName || 'Maya Patel',
        email: team.leader.email,
        college: team.leader.university || team.leader.location || 'Design Institute of India',
        avatar: team.leader.imageUrl || MOCK_AVATAR,
        membersCount: team.memberCount,
        isCompleted,
        // Mock status for visual variety based on id
        submissionStatus: isCompleted ? 'Submission Complete' : (team.teamId.charCodeAt(0) % 2 === 0 ? 'Not Qualified' : 'Submission Incomplete'),
        isRoundScreen: activeStageId !== 'all',
        roundSubmissions: team.roundSubmissions,
        rounds: data?.rounds ?? [],
      };
    });
  }, [data, activeStageId]);

  const filteredTeams = search.trim()
    ? teams.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase()))
    : teams;

  if (isLoading) {
    return (
      <View style={styles.centerWrap}>
        <ActivityIndicator color="#42007A" size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerWrap}>
        <AppText style={styles.errorText}>Unable to load registrations. Please try again.</AppText>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[1]}>
        
        {/* Stages Scroller */}
        <View style={styles.stagesSection}>
          <AppText style={styles.sectionTitle}>STAGES</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stagesScroll}>
            {stages.map((stage, idx) => {
              const isActive = activeStageId === stage.id;
              return (
                <View key={stage.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Pressable 
                    onPress={() => setActiveStageId(stage.id)} 
                    style={[styles.stageCard, isActive ? styles.stageCardActive : null]}
                  >
                    <View style={[styles.stageIconWrap, isActive ? styles.stageIconWrapActive : null]}>
                      {isActive && <View style={styles.stageCheck} />}
                    </View>
                    <View>
                      <AppText style={[styles.stageLabel, isActive ? styles.stageLabelActive : null]}>{stage.label}</AppText>
                      <AppText style={styles.stageSub}>{stage.subLabel}</AppText>
                    </View>
                  </Pressable>
                  {idx < stages.length - 1 && (
                    <View style={styles.stageArrow}>
                      <View style={styles.arrowLine} />
                      <View style={styles.arrowHead1} />
                      <View style={styles.arrowHead2} />
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Toolbar & Search */}
        <View style={styles.toolbarSticky}>
          <View style={styles.toolbarRow}>
            <View style={styles.searchBar}>
              <AppText style={styles.searchPlaceholder}>Search</AppText>
              <SearchIcon />
            </View>
          </View>
          <View style={styles.filterSortRow}>
            <Pressable style={styles.filterBtn}>
              <SortIcon />
              <AppText style={styles.filterBtnText}>Sort</AppText>
            </Pressable>
            <Pressable style={styles.filterBtn}>
              <FunnelIcon />
              <AppText style={styles.filterBtnText}>Filter</AppText>
            </Pressable>
          </View>
        </View>

        {/* List */}
        <View style={styles.listContainer}>
          {filteredTeams.map((t) => (
            <RegistrationCard 
              key={t.id} 
              data={t} 
              onPress={() => t.membersCount > 1 ? setSelectedTeam(t) : setSelectedParticipant(t)}
            />
          ))}
          {filteredTeams.length === 0 && (
             <AppText style={styles.emptyText}>No registrations found.</AppText>
          )}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Participant Details Modal */}
      <ParticipantDetailsModal 
        visible={!!selectedParticipant} 
        onClose={() => setSelectedParticipant(null)} 
        data={selectedParticipant} 
        onShare={() => { setSelectedParticipant(null); setShowShareModal(true); }}
      />

      {/* Team Details Modal */}
      <TeamDetailsModal 
        visible={!!selectedTeam} 
        onClose={() => setSelectedTeam(null)} 
        data={selectedTeam} 
      />

      {/* Share Link Modal */}
      <ShareLinkModal 
        visible={showShareModal} 
        onClose={() => setShowShareModal(false)} 
      />
    </View>
  );
}

// ── Components ────────────────────────────────────────────────────────────────

function RegistrationCard({ data, onPress }: { readonly data: any; readonly onPress: () => void }) {
  // Styles based on submission status
  let subBg = '#D8B4FE';
  let subText = '#6B21A8';
  if (data.submissionStatus === 'Submission Incomplete') { subBg = '#E9D5FF'; }
  if (data.submissionStatus === 'Not Qualified') { subBg = '#FECACA'; subText = '#DC2626'; }

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: data.avatar }} style={styles.avatarImg} />
        <View style={styles.cardInfo}>
          <View style={styles.cardTitleRow}>
            <AppText style={styles.cardName}>{data.name}</AppText>
            <View style={[styles.statusBadge, { backgroundColor: data.isCompleted ? '#FEF08A' : '#FEF9C3' }]}>
              <AppText style={[styles.statusBadgeText, { color: data.isCompleted ? '#8E7700' : '#A16207' }]}>
                {data.isCompleted ? 'Completed' : 'Not Completed'}
              </AppText>
            </View>
          </View>
          <View style={styles.cardContactRow}>
            <MailIcon />
            <AppText style={styles.cardContactText}>{data.email}</AppText>
          </View>
          <View style={styles.cardContactRow}>
            <GradCapIcon />
            <AppText style={styles.cardContactText}>{data.college}</AppText>
          </View>
        </View>
      </View>

      <View style={styles.cardMetaRow}>
        <View style={styles.membersBadge}>
          <AppText style={styles.membersBadgeText}>{data.membersCount} Members</AppText>
        </View>
        
        {data.isRoundScreen ? (
          <AppText style={styles.flowText}>REG <AppText style={styles.flowArrow}>⟶</AppText> ROUND 1</AppText>
        ) : (
          data.isCompleted ? (
            <View style={[styles.submissionBadge, { backgroundColor: subBg }]}>
              <AppText style={[styles.submissionBadgeText, { color: subText }]}>{data.submissionStatus}</AppText>
            </View>
          ) : (
            <AppText style={styles.notCompletedText}>Registration Not Complete</AppText>
          )
        )}
      </View>

      {/* Action buttons only in "All Registrations" for completed submissions */}
      {!data.isRoundScreen && data.isCompleted && (
        <View style={styles.cardActionsRow}>
          <Pressable style={styles.actionRejectBtn}>
            <AppText style={styles.actionRejectText}>Reject</AppText>
          </Pressable>
          <Pressable style={styles.actionPassBtn}>
            <AppText style={styles.actionPassText}>Pass to round 2</AppText>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

// ── Modals ────────────────────────────────────────────────────────────────────

function ParticipantDetailsModal({ visible, onClose, data, onShare }: any) {
  const [tab, setTab] = useState<'profile'|'synopsis'>('profile');
  if (!data) return null;
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={pm.overlay} onPress={onClose}>
        <Pressable style={pm.sheet} onPress={() => {}}>
          <View style={pm.handle} />
          <AppText style={pm.title}>Participant Details</AppText>

          <View style={pm.tabsRow}>
            <Pressable onPress={() => setTab('profile')} style={[pm.tabBtn, tab==='profile' && pm.tabBtnActive]}>
              <ProfileIcon active={tab==='profile'} />
              <AppText style={[pm.tabText, tab==='profile' && pm.tabTextActive]}>Profile</AppText>
            </Pressable>
            <Pressable onPress={() => setTab('synopsis')} style={[pm.tabBtn, tab==='synopsis' && pm.tabBtnActive]}>
              <DocIcon active={tab==='synopsis'} />
              <AppText style={[pm.tabText, tab==='synopsis' && pm.tabTextActive]}>Synopsis Submission</AppText>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {tab === 'profile' && (
              <>
            {/* Profile */}
            <View style={pm.profileHeader}>
              <Image source={{ uri: data.avatar }} style={pm.profileAvatar} />
              <View style={pm.profileInfo}>
                <View style={pm.profileTitleRow}>
                  <AppText style={pm.profileName}>{data.name}</AppText>
                  <View style={[pm.badge, { backgroundColor: '#FEF08A' }]}>
                    <AppText style={[pm.badgeText, { color: '#8E7700' }]}>College Student</AppText>
                  </View>
                </View>
                <View style={pm.contactRow}><LocationIcon /><AppText style={pm.contactText}>Mumbai, Maharashtra, India</AppText></View>
                <View style={pm.contactRow}><PhoneIcon /><AppText style={pm.contactText}>+91 88888 77777</AppText></View>
                <View style={pm.contactRow}><MailIcon /><AppText style={pm.contactText}>{data.email}</AppText></View>
                <View style={pm.contactRow}><GradCapIcon /><AppText style={pm.contactText}>{data.college}</AppText></View>
              </View>
            </View>

            {/* Q&A */}
            <AppText style={pm.sectionTitle}>Additional Questions</AppText>
            <View style={pm.qaContainer}>
              <QABlock q="Which programming languages are you interested in?" a="User expressed interest in Python and JavaScript for web development." />
              <QABlock q="What motivates you to learn new skills?" a="User is driven by career advancement and personal growth opportunities." />
              <QABlock q="Preferred learning style?" a="User enjoys hands-on projects and collaborative environments." isLast />
            </View>

            {/* Pass Details */}
            <View style={pm.passHeaderRow}>
              <AppText style={pm.passSectionTitle}>Pass Details</AppText>
              <Pressable onPress={onShare} style={pm.sharePassBtn}>
                <AppText style={pm.sharePassText}>Share Pass</AppText>
                <ShareIcon />
              </Pressable>
            </View>

            <View style={pm.qrContainer}>
              {/* Fake QR shape using blocks for "SVG" placeholder as per design */}
              <View style={pm.fakeQrCode}>
                <View style={pm.qrCornerTL} />
                <View style={pm.qrCornerTR} />
                <View style={pm.qrCornerBL} />
                <View style={pm.qrCenterLines} />
              </View>
              <AppText style={pm.qrTitle}>AFDK - AFDS - FSDS - DSRD</AppText>
              <AppText style={pm.qrMeta}>Payment id: somepayment id link here</AppText>
              <AppText style={pm.qrMeta}>Transaction detail: ₹299 | 29-03-2026 | 09:30 AM</AppText>
            </View>
            </>
          )}

            {tab === 'synopsis' && (
              <View style={{ gap: 16, marginTop: 16 }}>
                {data.rounds?.map((round: any) => {
                  const sub = data.roundSubmissions?.[round.id];
                  if (!sub) return null;
                  return (
                    <View key={round.id} style={{ backgroundColor: '#F3EEFF', padding: 16, borderRadius: 8 }}>
                      <AppText style={{ fontFamily: 'Urbanist', fontSize: 16, fontWeight: '600', color: '#100013', marginBottom: 8 }}>{round.name}</AppText>
                      {sub.payload?.note ? (
                        <AppText style={{ fontFamily: 'Urbanist', fontSize: 14, color: '#584D5A', marginBottom: 12 }}>{sub.payload.note}</AppText>
                      ) : null}
                      {sub.payload?.files?.map((f: any, idx: number) => (
                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 6, marginBottom: 8 }}>
                          <DocIcon active />
                          <AppText style={{ fontFamily: 'Urbanist', fontSize: 14, color: '#6949AA', marginLeft: 12, flex: 1 }} numberOfLines={1}>{f.name}</AppText>
                          <Pressable onPress={() => { if (f.url) Linking.openURL(f.url); }}>
                            <AppText style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#6949AA', textDecorationLine: 'underline' }}>View</AppText>
                          </Pressable>
                        </View>
                      ))}
                      {(!sub.payload?.files || sub.payload.files.length === 0) && (
                        <AppText style={styles.emptyText}>No files submitted.</AppText>
                      )}
                    </View>
                  );
                })}
                {(!data.roundSubmissions || Object.keys(data.roundSubmissions).length === 0) && (
                  <AppText style={styles.emptyText}>No round submissions yet.</AppText>
                )}
              </View>
            )}

          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function TeamDetailsModal({ visible, onClose, data }: any) {
  const [tab, setTab] = useState<'members'|'synopsis'>('members');
  if (!data) return null;

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={pm.overlay} onPress={onClose}>
        <Pressable style={pm.sheet} onPress={() => {}}>
          <View style={pm.handle} />
          <AppText style={pm.title}>Team Details</AppText>

          <View style={pm.tabsRow}>
            <Pressable onPress={() => setTab('members')} style={[pm.tabBtn, tab==='members' && pm.tabBtnActive]}>
              <ProfileIcon active={tab==='members'} />
              <AppText style={[pm.tabText, tab==='members' && pm.tabTextActive]}>Team Members</AppText>
            </Pressable>
            <Pressable onPress={() => setTab('synopsis')} style={[pm.tabBtn, tab==='synopsis' && pm.tabBtnActive]}>
              <DocIcon active={tab==='synopsis'} />
              <AppText style={[pm.tabText, tab==='synopsis' && pm.tabTextActive]}>Synopsis Submission</AppText>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {tab === 'members' && (
              <>
                {/* Team Leader Profile */}
                <View style={pm.profileHeader}>
                  <Image source={{ uri: data.avatar }} style={pm.profileAvatar} />
                  <View style={pm.profileInfo}>
                    <View style={pm.profileTitleRow}>
                      <AppText style={pm.profileName}>{data.name}</AppText>
                      <View style={[pm.badge, { backgroundColor: '#FEF08A' }]}>
                        <AppText style={[pm.badgeText, { color: '#8E7700' }]}>Team Leader</AppText>
                      </View>
                    </View>
                    <View style={pm.contactRow}><LocationIcon /><AppText style={pm.contactText}>Mumbai, Maharashtra, India</AppText></View>
                    <View style={pm.contactRow}><PhoneIcon /><AppText style={pm.contactText}>+91 88888 77777</AppText></View>
                    <View style={pm.contactRow}><MailIcon /><AppText style={pm.contactText}>{data.email}</AppText></View>
                    <View style={pm.contactRow}><GradCapIcon /><AppText style={pm.contactText}>{data.college}</AppText></View>
                  </View>
                </View>

                {/* Leader Q&A */}
                <AppText style={pm.sectionTitle}>Additional Questions</AppText>
                <View style={pm.qaContainer}>
                  <QABlock q="Which programming languages are you interested in?" a="User expressed interest in Python and JavaScript for web development." />
                  <QABlock q="What motivates you to learn new skills?" a="User is driven by career advancement and personal growth opportunities." />
                  <QABlock q="Preferred learning style?" a="User enjoys hands-on projects and collaborative environments." isLast />
                </View>

                {/* Team Member Profile */}
                <View style={[pm.profileHeader, { marginTop: 16 }]}>
                  <Image source={{ uri: data.avatar }} style={pm.profileAvatar} />
                  <View style={pm.profileInfo}>
                    <View style={pm.profileTitleRow}>
                      <AppText style={pm.profileName}>{data.name}</AppText>
                      <View style={[pm.badge, { backgroundColor: '#FEF08A' }]}>
                        <AppText style={[pm.badgeText, { color: '#8E7700' }]}>Team Member</AppText>
                      </View>
                    </View>
                    <View style={pm.contactRow}><LocationIcon /><AppText style={pm.contactText}>Mumbai, Maharashtra, India</AppText></View>
                  </View>
                </View>
              </>
            )}
            {tab === 'synopsis' && (
              <View style={{ gap: 16, marginTop: 16 }}>
                {data.rounds.map((round: any) => {
                  const sub = data.roundSubmissions[round.id];
                  if (!sub) return null;
                  return (
                    <View key={round.id} style={{ backgroundColor: '#F3EEFF', padding: 16, borderRadius: 8 }}>
                      <AppText style={{ fontFamily: 'Urbanist', fontSize: 16, fontWeight: '600', color: '#100013', marginBottom: 8 }}>{round.name}</AppText>
                      {sub.payload?.note ? (
                        <AppText style={{ fontFamily: 'Urbanist', fontSize: 14, color: '#584D5A', marginBottom: 12 }}>{sub.payload.note}</AppText>
                      ) : null}
                      {sub.payload?.files?.map((f: any, idx: number) => (
                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 6, marginBottom: 8 }}>
                          <DocIcon active />
                          <AppText style={{ fontFamily: 'Urbanist', fontSize: 14, color: '#6949AA', marginLeft: 12, flex: 1 }} numberOfLines={1}>{f.name}</AppText>
                          <Pressable onPress={() => { if (f.url) Linking.openURL(f.url); }}>
                            <AppText style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#6949AA', textDecorationLine: 'underline' }}>View</AppText>
                          </Pressable>
                        </View>
                      ))}
                      {(!sub.payload?.files || sub.payload.files.length === 0) && (
                        <AppText style={styles.emptyText}>No files submitted.</AppText>
                      )}
                    </View>
                  );
                })}
                {Object.keys(data.roundSubmissions).length === 0 && (
                  <AppText style={styles.emptyText}>No round submissions yet.</AppText>
                )}
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ShareLinkModal({ visible, onClose }: any) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={pm.overlay} onPress={onClose}>
        <Pressable style={pm.sheet} onPress={() => {}}>
          <View style={pm.handle} />
          <AppText style={pm.title}>Share Link</AppText>

          <AppText style={pm.shareMeta}>Directly Share To</AppText>
          <View style={pm.socialRow}>
            <SocialBtn icon="f" label="Facebook" />
            <SocialBtn icon="cam" label="Instagram" />
            <SocialBtn icon="in" label="LinkedIn" />
            <SocialBtn icon="X" label="Twitter" />
          </View>

          <AppText style={pm.shareMeta}>Copy Link to</AppText>
          <View style={pm.copyWrap}>
            <AppText style={pm.copyText} numberOfLines={1}>https://oppskills.com/events/new_to_ai</AppText>
            <View style={pm.copyIcon} />
          </View>
          <View style={{ height: 20 }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function QABlock({ q, a, isLast }: { readonly q: string; readonly a: string; readonly isLast?: boolean }) {
  return (
    <View style={[pm.qaBlock, isLast && pm.qaBlockLast]}>
      <View style={pm.qaQRow}>
        <AppText style={pm.qaQ}>{q}</AppText>
        <View style={[pm.badge, { backgroundColor: '#FFD4F6' }]}>
          <AppText style={[pm.badgeText, { color: '#D946EF' }]}>Text</AppText>
        </View>
      </View>
      <AppText style={pm.qaA}>{a}</AppText>
    </View>
  );
}

function SocialBtn({ label }: { readonly icon: string; readonly label: string }) {
  return (
    <View style={pm.socialWrap}>
      <View style={pm.socialCircle}>
        <View style={pm.socialIconPlaceholder} />
      </View>
      <AppText style={pm.socialLabel}>{label}</AppText>
    </View>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <View style={{ height: 18, width: 18, position: 'relative' }}>
      <View style={{ borderColor: '#584D5A', borderRadius: 6, borderWidth: 1.5, height: 12, position: 'absolute', top: 1, left: 1, width: 12 }} />
      <View style={{ backgroundColor: '#584D5A', borderRadius: 1, bottom: 2, height: 2, position: 'absolute', right: 1, transform: [{ rotate: '45deg' }], width: 6 }} />
    </View>
  );
}
function SortIcon() {
  return (
    <View style={{ height: 14, width: 14, position: 'relative' }}>
      <View style={{ backgroundColor: '#584D5A', width: 1.5, height: 10, position: 'absolute', left: 4, top: 2 }} />
      <View style={{ backgroundColor: '#584D5A', width: 1.5, height: 10, position: 'absolute', right: 4, top: 2 }} />
      <View style={{ borderBottomColor: 'transparent', borderBottomWidth: 3, borderLeftColor: 'transparent', borderLeftWidth: 3, borderRightColor: 'transparent', borderRightWidth: 3, borderTopColor: '#584D5A', borderTopWidth: 4, position: 'absolute', left: 2.5, bottom: 0 }} />
      <View style={{ borderBottomColor: '#584D5A', borderBottomWidth: 4, borderLeftColor: 'transparent', borderLeftWidth: 3, borderRightColor: 'transparent', borderRightWidth: 3, borderTopColor: 'transparent', borderTopWidth: 3, position: 'absolute', right: 2.5, top: 0 }} />
    </View>
  );
}
function FunnelIcon() {
  return (
    <View style={{ height: 14, width: 14, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ backgroundColor: '#584D5A', borderRadius: 1, height: 1.5, width: 12, marginBottom: 2 }} />
      <View style={{ backgroundColor: '#584D5A', borderRadius: 1, height: 1.5, width: 8, marginBottom: 2 }} />
      <View style={{ backgroundColor: '#584D5A', borderRadius: 1, height: 1.5, width: 4 }} />
    </View>
  );
}
function MailIcon() {
  return (
    <View style={{ borderColor: '#7C737E', borderRadius: 2, borderWidth: 1.2, height: 10, width: 14, position: 'relative', overflow: 'hidden' }}>
      <View style={{ borderBottomColor: '#7C737E', borderBottomWidth: 1.2, borderLeftColor: 'transparent', borderLeftWidth: 7, borderRightColor: 'transparent', borderRightWidth: 7, height: 0, position: 'absolute', top: -3, width: 0 }} />
    </View>
  );
}
function GradCapIcon() {
  return (
    <View style={{ height: 12, width: 14, alignItems: 'center' }}>
      <View style={{ borderBottomColor: 'transparent', borderBottomWidth: 3, borderLeftColor: 'transparent', borderLeftWidth: 7, borderRightColor: 'transparent', borderRightWidth: 7, borderTopColor: '#7C737E', borderTopWidth: 4, height: 0, width: 0, zIndex: 2 }} />
      <View style={{ borderColor: '#7C737E', borderTopWidth: 0, borderWidth: 1.2, height: 4, width: 8, marginTop: -4 }} />
    </View>
  );
}
function LocationIcon() {
  return (
    <View style={{ height: 14, width: 12, alignItems: 'center' }}>
      <View style={{ borderColor: '#7C737E', borderRadius: 5, borderWidth: 1.2, height: 10, width: 10 }} />
      <View style={{ backgroundColor: '#7C737E', height: 4, width: 1.2, marginTop: -2 }} />
    </View>
  );
}
function PhoneIcon() {
  return (
    <View style={{ borderColor: '#7C737E', borderRadius: 2, borderWidth: 1.2, height: 12, width: 8 }} />
  );
}
function ShareIcon() {
  return (
    <View style={{ height: 14, width: 14, position: 'relative' }}>
      <View style={{ borderColor: '#D8B4FE', borderRadius: 2, borderWidth: 1.5, borderTopWidth: 0, borderRightWidth: 0, height: 10, width: 10, position: 'absolute', bottom: 1, left: 1 }} />
      <View style={{ backgroundColor: '#D8B4FE', width: 1.5, height: 10, position: 'absolute', top: 1, right: 3, transform: [{ rotate: '45deg' }] }} />
      <View style={{ borderBottomColor: '#D8B4FE', borderBottomWidth: 4, borderLeftColor: 'transparent', borderLeftWidth: 3, borderRightColor: 'transparent', borderRightWidth: 3, borderTopColor: 'transparent', borderTopWidth: 3, position: 'absolute', right: 0, top: 0 }} />
    </View>
  );
}
function ProfileIcon({ active }: { readonly active?: boolean }) {
  const color = active ? '#6949AA' : '#9C8DAA';
  return (
    <View style={{ height: 16, width: 16, alignItems: 'center' }}>
      <View style={{ borderColor: color, borderRadius: 4, borderWidth: 1.5, height: 8, width: 8 }} />
      <View style={{ borderColor: color, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderWidth: 1.5, borderBottomWidth: 0, height: 6, width: 14, marginTop: 1 }} />
    </View>
  );
}
function DocIcon({ active }: { readonly active?: boolean }) {
  const color = active ? '#6949AA' : '#9C8DAA';
  return (
    <View style={{ borderColor: color, borderRadius: 2, borderWidth: 1.5, height: 16, width: 12, alignItems: 'center', paddingTop: 3 }}>
      <View style={{ backgroundColor: color, height: 1.5, width: 6, marginBottom: 2 }} />
      <View style={{ backgroundColor: color, height: 1.5, width: 6 }} />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#EF4444', fontFamily: 'Urbanist', fontSize: 14 },
  screen: { backgroundColor: '#FAFAFA', flex: 1 },
  
  stagesSection: { backgroundColor: '#FAFAFA', paddingBottom: 12, paddingTop: 16 },
  sectionTitle: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 12, fontWeight: '700', paddingHorizontal: 16, marginBottom: 10 },
  stagesScroll: { paddingHorizontal: 16, paddingRight: 40 },
  stageCard: { borderColor: '#E8E6E8', borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFFFFF', minWidth: 180 },
  stageCardActive: { borderColor: '#D8B4FE', backgroundColor: '#F3EEFF' },
  stageIconWrap: { alignItems: 'center', borderColor: '#9C8DAA', borderRadius: 12, borderWidth: 1.5, height: 24, justifyContent: 'center', width: 24 },
  stageIconWrapActive: { borderColor: '#6949AA' },
  stageCheck: { borderBottomColor: '#6949AA', borderBottomWidth: 2, borderLeftColor: '#6949AA', borderLeftWidth: 2, height: 6, transform: [{ rotate: '-45deg' }], width: 10, marginTop: -2 },
  stageLabel: { color: '#100013', fontFamily: 'Urbanist', fontSize: 13, fontWeight: '600' },
  stageLabelActive: { color: '#6949AA' },
  stageSub: { color: '#7C737E', fontFamily: 'Urbanist', fontSize: 11 },
  stageArrow: { alignItems: 'center', width: 30, position: 'relative' },
  arrowLine: { backgroundColor: '#C3BFC4', height: 1, width: 16 },
  arrowHead1: { backgroundColor: '#C3BFC4', height: 1, width: 6, position: 'absolute', right: 6, top: -2, transform: [{ rotate: '45deg' }] },
  arrowHead2: { backgroundColor: '#C3BFC4', height: 1, width: 6, position: 'absolute', right: 6, top: 2, transform: [{ rotate: '-45deg' }] },

  toolbarSticky: { backgroundColor: '#FAFAFA', paddingHorizontal: 16, paddingBottom: 10 },
  toolbarRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderColor: '#C3BFC4', borderRadius: 100, borderWidth: 1, height: 40, paddingHorizontal: 16 },
  searchPlaceholder: { color: '#9C8DAA', fontFamily: 'Urbanist', fontSize: 14 },
  filterSortRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 12 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterBtnText: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 13, fontWeight: '500' },

  listContainer: { paddingHorizontal: 16, paddingTop: 8 },
  card: { borderBottomColor: '#E8E6E8', borderBottomWidth: 1, paddingVertical: 16 },
  cardHeader: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  avatarImg: { borderRadius: 8, height: 50, width: 50 },
  cardInfo: { flex: 1, gap: 4 },
  cardTitleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  cardName: { color: '#100013', fontFamily: 'Urbanist', fontSize: 18, fontWeight: '600' },
  statusBadge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  statusBadgeText: { fontFamily: 'Urbanist', fontSize: 11, fontWeight: '600' },
  cardContactRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  cardContactText: { color: '#7C737E', fontFamily: 'Urbanist', fontSize: 13 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  membersBadge: { backgroundColor: '#FFD4F6', borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4 },
  membersBadgeText: { color: '#D946EF', fontFamily: 'Urbanist', fontSize: 12, fontWeight: '600' },
  submissionBadge: { borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4 },
  submissionBadgeText: { fontFamily: 'Urbanist', fontSize: 12, fontWeight: '600' },
  notCompletedText: { color: '#9C8DAA', fontFamily: 'Urbanist', fontSize: 12, fontWeight: '500' },
  flowText: { color: '#7C737E', fontFamily: 'Urbanist', fontSize: 12, fontWeight: '600' },
  flowArrow: { color: '#C3BFC4' },
  cardActionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  actionRejectBtn: { alignItems: 'center', flex: 1, paddingVertical: 12 },
  actionRejectText: { color: '#42007A', fontFamily: 'Urbanist', fontSize: 14, fontWeight: '500' },
  actionPassBtn: { alignItems: 'center', backgroundColor: '#3B2464', borderRadius: 100, flex: 1, paddingVertical: 12 },
  actionPassText: { color: '#FFFFFF', fontFamily: 'Urbanist', fontSize: 14, fontWeight: '500' },
  emptyText: { color: '#9C8DAA', fontFamily: 'Urbanist', fontSize: 14, textAlign: 'center', marginTop: 40 },
});

const pm = StyleSheet.create({
  overlay: { backgroundColor: 'rgba(12,1,20,0.4)', flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', padding: 24, paddingTop: 16 },
  handle: { alignSelf: 'center', backgroundColor: '#C3BFC4', borderRadius: 4, height: 5, marginBottom: 24, width: 48 },
  title: { color: '#100013', fontFamily: 'Aeonik Pro', fontSize: 22, fontWeight: '600', marginBottom: 24 },
  
  profileHeader: { flexDirection: 'row', gap: 14, marginBottom: 24 },
  profileAvatar: { borderRadius: 8, height: 60, width: 60 },
  profileInfo: { flex: 1, gap: 6 },
  profileTitleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  profileName: { color: '#100013', fontFamily: 'Urbanist', fontSize: 18, fontWeight: '600' },
  badge: { borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontFamily: 'Urbanist', fontSize: 11, fontWeight: '600' },
  contactRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  contactText: { color: '#7C737E', fontFamily: 'Urbanist', fontSize: 12 },
  
  sectionTitle: { color: '#100013', fontFamily: 'Urbanist', fontSize: 16, fontWeight: '500', marginBottom: 12 },
  qaContainer: { borderLeftColor: '#10B981', borderLeftWidth: 2, paddingLeft: 12, marginBottom: 24 },
  qaBlock: { marginBottom: 16 },
  qaBlockLast: { marginBottom: 0 },
  qaQRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  qaQ: { color: '#100013', fontFamily: 'Urbanist', fontSize: 13, flex: 1, paddingRight: 10 },
  qaA: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 13, lineHeight: 18 },
  
  passHeaderRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  passSectionTitle: { color: '#100013', fontFamily: 'Urbanist', fontSize: 16, fontWeight: '500' },
  sharePassBtn: { alignItems: 'center', backgroundColor: '#3B2464', borderRadius: 100, flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  sharePassText: { color: '#FFFFFF', fontFamily: 'Urbanist', fontSize: 13, fontWeight: '500' },
  qrContainer: { alignItems: 'center', backgroundColor: '#FAFAFA', borderRadius: 16, paddingVertical: 32 },
  fakeQrCode: { height: 160, width: 160, backgroundColor: '#000000', marginBottom: 20, borderRadius: 12, position: 'relative' },
  qrCornerTL: { position: 'absolute', top: 10, left: 10, width: 30, height: 30, borderColor: '#FFF', borderWidth: 6, borderRadius: 6 },
  qrCornerTR: { position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderColor: '#FFF', borderWidth: 6, borderRadius: 6 },
  qrCornerBL: { position: 'absolute', bottom: 10, left: 10, width: 30, height: 30, borderColor: '#FFF', borderWidth: 6, borderRadius: 6 },
  qrCenterLines: { position: 'absolute', top: 50, left: 50, width: 60, height: 60, backgroundColor: '#FFF' }, // Basic fake visual
  qrTitle: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 18, fontWeight: '700', marginBottom: 16, letterSpacing: 1 },
  qrMeta: { color: '#9C8DAA', fontFamily: 'Urbanist', fontSize: 12, marginBottom: 8 },

  tabsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderColor: '#C3BFC4', borderRadius: 8, borderWidth: 1, paddingVertical: 12 },
  tabBtnActive: { borderColor: '#D8B4FE', backgroundColor: '#F3EEFF' },
  tabText: { color: '#9C8DAA', fontFamily: 'Urbanist', fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: '#6949AA' },

  shareMeta: { color: '#584D5A', fontFamily: 'Urbanist', fontSize: 15, marginBottom: 16 },
  socialRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  socialWrap: { alignItems: 'center', gap: 8 },
  socialCircle: { backgroundColor: '#F3F4F6', borderRadius: 30, height: 60, width: 60, alignItems: 'center', justifyContent: 'center' },
  socialIconPlaceholder: { backgroundColor: '#584D5A', borderRadius: 16, height: 32, width: 32 },
  socialLabel: { color: '#100013', fontFamily: 'Urbanist', fontSize: 13 },
  copyWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderColor: '#C3BFC4', borderRadius: 100, borderWidth: 1, paddingHorizontal: 16, height: 50 },
  copyText: { color: '#7C737E', fontFamily: 'Urbanist', fontSize: 14, flex: 1 },
  copyIcon: { borderColor: '#584D5A', borderRadius: 4, borderWidth: 1.5, height: 16, width: 12 },
});
