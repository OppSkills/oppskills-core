import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AppText } from '../../../../../shared/ui';
import { type LiveHackathon } from './OrganizerCreateHackathonScreen';
import { HackathonDashboardScreen } from './HackathonDashboardScreen';
import { ManageHackathonRegistrationScreen } from './ManageHackathonRegistrationScreen';
import { EditHackathonScreen } from './EditHackathonScreen';
import { HackathonReferralsPanel } from './HackathonReferralsPanel';
import { HackathonManageRolesPanel } from './HackathonManageRolesPanel';
import { HackathonPaymentsPanel } from './HackathonPaymentsPanel';
import { HackathonNotificationsPanel } from './HackathonNotificationsPanel';
import { HackathonSettingsPanel } from './HackathonSettingsPanel';

interface HackathonDetailScreenProps {
  readonly hackathon: LiveHackathon;
  readonly onBack: () => void;
  readonly onOpenMainSidebar: () => void;
  readonly onUpdateHackathon: (hackathon: LiveHackathon) => void;
}

type ContextSectionKey =
  | 'dashboard'
  | 'manage-registration'
  | 'edit-hackathon'
  | 'referrals'
  | 'manage-roles'
  | 'payments'
  | 'send-notifications'
  | 'settings';

const CONTEXT_ITEMS: { key: ContextSectionKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'manage-registration', label: 'Manage Registration' },
  { key: 'edit-hackathon', label: 'Edit Hackathon' },
  { key: 'referrals', label: 'Referrals' },
  { key: 'manage-roles', label: 'Manage Roles' },
  { key: 'payments', label: 'Payments' },
  { key: 'send-notifications', label: 'Send Notifications' },
  { key: 'settings', label: 'Settings' },
];

export function HackathonDetailScreen({ hackathon: initialHackathon, onBack, onOpenMainSidebar, onUpdateHackathon }: HackathonDetailScreenProps) {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeContextSection, setActiveContextSection] = useState<ContextSectionKey>('dashboard');
  const [hackathon, setHackathon] = useState(initialHackathon);

  function handleUpdateHackathon(updated: LiveHackathon) {
    setHackathon(updated);
    onUpdateHackathon(updated);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable onPress={() => setDrawerVisible(true)} style={styles.topBarLeft}>
          <View style={styles.hamburgerWrap}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </View>
          <AppText numberOfLines={1} style={styles.topBarTitle}>
            {hackathon.title}
          </AppText>
        </Pressable>
        <Pressable onPress={onBack} style={styles.backButton}>
          <View style={styles.backArrowLeft} />
          <View style={styles.backArrowRight} />
        </Pressable>
      </View>

      {activeContextSection === 'dashboard' ? (
        <HackathonDashboardScreen hackathon={hackathon} />
      ) : activeContextSection === 'manage-registration' ? (
        <ManageHackathonRegistrationScreen />
      ) : activeContextSection === 'edit-hackathon' ? (
        <EditHackathonScreen hackathon={hackathon} onUpdateHackathon={handleUpdateHackathon} />
      ) : activeContextSection === 'referrals' ? (
        <HackathonReferralsPanel hackathon={hackathon} />
      ) : activeContextSection === 'manage-roles' ? (
        <HackathonManageRolesPanel />
      ) : activeContextSection === 'payments' ? (
        <HackathonPaymentsPanel hackathon={hackathon} />
      ) : activeContextSection === 'send-notifications' ? (
        <HackathonNotificationsPanel />
      ) : activeContextSection === 'settings' ? (
        <HackathonSettingsPanel hackathon={hackathon} />
      ) : (
        <View style={styles.placeholderWrap}>
          <AppText style={styles.placeholderText}>Coming soon</AppText>
        </View>
      )}

      <ContextSidebarDrawer
        activeItemKey={activeContextSection}
        onClose={() => setDrawerVisible(false)}
        onOpenMainSidebar={() => {
          setDrawerVisible(false);
          onOpenMainSidebar();
        }}
        onSelect={(key) => {
          setActiveContextSection(key);
          setDrawerVisible(false);
        }}
        visible={drawerVisible}
      />
    </View>
  );
}

interface ContextSidebarDrawerProps {
  readonly visible: boolean;
  readonly activeItemKey: ContextSectionKey;
  readonly onClose: () => void;
  readonly onSelect: (key: ContextSectionKey) => void;
  readonly onOpenMainSidebar: () => void;
}

function ContextSidebarDrawer({
  visible,
  activeItemKey,
  onClose,
  onSelect,
  onOpenMainSidebar,
}: ContextSidebarDrawerProps) {
  const { width } = useWindowDimensions();
  const drawerWidth = Math.min(299, Math.max(260, width * 0.82));
  const slideX = useRef(new Animated.Value(-drawerWidth)).current;

  useEffect(() => {
    if (!visible) {
      slideX.setValue(-drawerWidth);
      return;
    }
    slideX.setValue(-drawerWidth);
    Animated.timing(slideX, {
      duration: 220,
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }, [drawerWidth, slideX, visible]);

  if (!visible) return null;

  return (
    <Modal onRequestClose={onClose} transparent visible={visible}>
      <View style={drawerStyles.root}>
        <Pressable onPress={onClose} style={drawerStyles.backdrop} />
        <Animated.View style={[drawerStyles.drawer, { transform: [{ translateX: slideX }], width: drawerWidth }]}>
          <SafeAreaView edges={['top', 'bottom', 'left']} style={drawerStyles.safeArea}>
            <View style={drawerStyles.header}>
              <AppText style={drawerStyles.headerTitle}>Context Menu</AppText>
              <Pressable hitSlop={8} onPress={onClose} style={drawerStyles.closeBtn}>
                <View style={[drawerStyles.closeStroke, drawerStyles.closeStroke1]} />
                <View style={[drawerStyles.closeStroke, drawerStyles.closeStroke2]} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={drawerStyles.menuScroll}>
              {CONTEXT_ITEMS.map((item) => {
                const isActive = item.key === activeItemKey;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => onSelect(item.key)}
                    style={[drawerStyles.menuItem, isActive ? drawerStyles.menuItemActive : null]}
                  >
                    <View style={[drawerStyles.indicator, isActive ? drawerStyles.indicatorActive : null]} />
                    <ContextIcon active={isActive} name={item.key} />
                    <AppText style={[drawerStyles.menuLabel, isActive ? drawerStyles.menuLabelActive : null]}>
                      {item.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={drawerStyles.bottomRow}>
              <Pressable
                onPress={onOpenMainSidebar}
                style={[drawerStyles.pillButton, drawerStyles.pillButtonOutlined]}
              >
                <View style={drawerStyles.hamburgerMiniWrap}>
                  <View style={drawerStyles.hamburgerMiniLine} />
                  <View style={drawerStyles.hamburgerMiniLine} />
                  <View style={drawerStyles.hamburgerMiniLine} />
                </View>
                <AppText style={drawerStyles.pillButtonOutlinedText}>Main</AppText>
              </Pressable>
              <Pressable style={[drawerStyles.pillButton, drawerStyles.pillButtonFilled]}>
                <View style={drawerStyles.layoutIconWrap}>
                  <View style={drawerStyles.layoutTop} />
                  <View style={drawerStyles.layoutBottom} />
                </View>
                <AppText style={drawerStyles.pillButtonFilledText}>Context</AppText>
              </Pressable>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function ContextIcon({ name, active }: { readonly name: ContextSectionKey; readonly active: boolean }) {
  const tintColor = active ? '#42007A' : '#584D5A';

  if (name === 'dashboard') {
    return (
      <View style={iconStyles.frame}>
        <Svg fill="none" height={32} viewBox="0 0 32 32" width={32}>
          <Path d="M18 20.6663C18 18.1522 18 16.8951 18.781 16.1141C19.5621 15.333 20.8192 15.333 23.3333 15.333C25.8475 15.333 27.1046 15.333 27.8856 16.1141C28.6667 16.8951 28.6667 18.1522 28.6667 20.6663V23.333C28.6667 25.8472 28.6667 27.1042 27.8856 27.8853C27.1046 28.6663 25.8475 28.6663 23.3333 28.6663C20.8192 28.6663 19.5621 28.6663 18.781 27.8853C18 27.1042 18 25.8472 18 23.333V20.6663Z" stroke={tintColor} strokeWidth="1.5" />
          <Path d="M2.66667 11.333C2.66667 13.8472 2.66667 15.1042 3.44772 15.8853C4.22877 16.6663 5.48585 16.6663 8.00001 16.6663C10.5142 16.6663 11.7712 16.6663 12.5523 15.8853C13.3333 15.1042 13.3333 13.8472 13.3333 11.333V8.66634C13.3333 6.15218 13.3333 4.8951 12.5523 4.11406C11.7712 3.33301 10.5142 3.33301 8.00001 3.33301C5.48585 3.33301 4.22877 3.33301 3.44772 4.11406C2.66667 4.8951 2.66667 6.15218 2.66667 8.66634V11.333Z" stroke={tintColor} strokeWidth="1.5" />
          <Path d="M18 7.33301C18 6.0905 18 5.46924 18.203 4.97919C18.4736 4.32578 18.9928 3.80665 19.6462 3.536C20.1362 3.33301 20.7575 3.33301 22 3.33301H24.6667C25.9092 3.33301 26.5304 3.33301 27.0205 3.536C27.6739 3.80665 28.193 4.32578 28.4637 4.97919C28.6667 5.46924 28.6667 6.0905 28.6667 7.33301C28.6667 8.57552 28.6667 9.19677 28.4637 9.68683C28.193 10.3402 27.6739 10.8594 27.0205 11.13C26.5304 11.333 25.9092 11.333 24.6667 11.333H22C20.7575 11.333 20.1362 11.333 19.6462 11.13C18.9928 10.8594 18.4736 10.3402 18.203 9.68683C18 9.19677 18 8.57552 18 7.33301Z" stroke={tintColor} strokeWidth="1.5" />
          <Path d="M2.66667 24.667C2.66667 25.9095 2.66667 26.5308 2.86966 27.0208C3.14031 27.6742 3.65944 28.1934 4.31285 28.464C4.80291 28.667 5.42416 28.667 6.66667 28.667H9.33334C10.5758 28.667 11.1971 28.667 11.6872 28.464C12.3406 28.1934 12.8597 27.6742 13.1304 27.0208C13.3333 26.5308 13.3333 25.9095 13.3333 24.667C13.3333 23.4245 13.3333 22.8032 13.1304 22.3132C12.8597 21.6598 12.3406 21.1406 11.6872 20.87C11.1971 20.667 10.5758 20.667 9.33334 20.667H6.66667C5.42416 20.667 4.80291 20.667 4.31285 20.87C3.65944 21.1406 3.14031 21.6598 2.86966 22.3132C2.66667 22.8032 2.66667 23.4245 2.66667 24.667Z" stroke={tintColor} strokeWidth="1.5" />
        </Svg>
      </View>
    );
  }

  if (name === 'manage-registration') {
    return (
      <View style={iconStyles.frame}>
        <Svg fill="none" height={32} viewBox="0 0 32 32" width={32}>
          <Path d="M2.66667 7.33333L4.28572 9.33333L10 4" stroke={tintColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M2.66667 16.6663L4.28572 18.6663L10 13.333" stroke={tintColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M2.66667 26.0003L4.28572 28.0003L10 22.667" stroke={tintColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M29.3333 25.333L16 25.333" stroke={tintColor} strokeWidth="1.5" strokeLinecap="round" />
          <Path d="M29.3333 16L16 16" stroke={tintColor} strokeWidth="1.5" strokeLinecap="round" />
          <Path d="M29.3333 6.66699L16 6.66699" stroke={tintColor} strokeWidth="1.5" strokeLinecap="round" />
        </Svg>
      </View>
    );
  }

  if (name === 'edit-hackathon') {
    return (
      <View style={iconStyles.frame}>
        <View style={[iconStyles.editBody, { borderColor: tintColor }]} />
        <View style={[iconStyles.editUnder, { borderColor: tintColor }]} />
      </View>
    );
  }

  if (name === 'referrals') {
    return (
      <View style={iconStyles.frame}>
        <View style={[iconStyles.refHead, { borderColor: tintColor, left: 4 }]} />
        <View style={[iconStyles.refHead, { borderColor: tintColor, left: 20 }]} />
        <View style={[iconStyles.refArrow, { borderColor: tintColor }]} />
      </View>
    );
  }

  if (name === 'manage-roles') {
    return (
      <View style={iconStyles.frame}>
        <View style={[iconStyles.idCard, { borderColor: tintColor }]} />
        <View style={[iconStyles.idHead, { borderColor: tintColor }]} />
        <View style={[iconStyles.idLine, { borderColor: tintColor, top: 12 }]} />
        <View style={[iconStyles.idLine, { borderColor: tintColor, top: 18 }]} />
      </View>
    );
  }

  if (name === 'payments') {
    return (
      <View style={iconStyles.frame}>
        <View style={[iconStyles.payCard, { borderColor: tintColor }]} />
        <View style={[iconStyles.payStripe, { backgroundColor: tintColor }]} />
      </View>
    );
  }

  if (name === 'send-notifications') {
    return (
      <View style={iconStyles.frame}>
        <View style={[iconStyles.bellBody, { borderColor: tintColor }]} />
        <View style={[iconStyles.bellTop, { borderColor: tintColor }]} />
        <View style={[iconStyles.bellClapper, { backgroundColor: tintColor }]} />
      </View>
    );
  }

  return (
    <View style={iconStyles.frame}>
      <View style={[iconStyles.gear, { borderColor: tintColor }]} />
      <View style={[iconStyles.gearCenter, { borderColor: tintColor }]} />
    </View>
  );
}

const iconStyles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    flexShrink: 0,
    height: 32,
    justifyContent: 'center',
    position: 'relative',
    width: 32,
  },
  gridCell: {
    borderRadius: 3,
    borderWidth: 1.5,
    height: 8,
    position: 'absolute',
    width: 8,
  },
  regOutline: {
    borderRadius: 4,
    borderWidth: 1.5,
    height: 20,
    left: 5,
    position: 'absolute',
    top: 6,
    width: 22,
  },
  regLine: {
    borderWidth: 1.5,
    height: 1,
    left: 9,
    position: 'absolute',
    width: 10,
  },
  regLineShort: {
    borderWidth: 1.5,
    height: 1,
    left: 9,
    position: 'absolute',
    width: 6,
  },
  editBody: {
    borderRadius: 3,
    borderWidth: 1.5,
    height: 16,
    left: 8,
    position: 'absolute',
    top: 6,
    transform: [{ rotate: '35deg' }],
    width: 10,
  },
  editUnder: {
    borderWidth: 1.5,
    height: 1,
    left: 5,
    position: 'absolute',
    top: 25,
    width: 22,
  },
  refHead: {
    borderRadius: 5,
    borderWidth: 1.5,
    height: 8,
    position: 'absolute',
    top: 7,
    width: 8,
  },
  refArrow: {
    borderTopWidth: 1.5,
    height: 1,
    left: 9,
    position: 'absolute',
    top: 19,
    width: 14,
  },
  idCard: {
    borderRadius: 5,
    borderWidth: 1.5,
    height: 20,
    left: 5,
    position: 'absolute',
    top: 6,
    width: 22,
  },
  idHead: {
    borderRadius: 4,
    borderWidth: 1.5,
    height: 6,
    left: 11,
    position: 'absolute',
    top: 9,
    width: 6,
  },
  idLine: {
    borderWidth: 1.5,
    height: 1,
    left: 20,
    position: 'absolute',
    width: 5,
  },
  payCard: {
    borderRadius: 4,
    borderWidth: 1.5,
    height: 18,
    left: 5,
    position: 'absolute',
    top: 7,
    width: 22,
  },
  payStripe: {
    height: 4,
    left: 5,
    position: 'absolute',
    top: 12,
    width: 22,
  },
  bellBody: {
    borderRadius: 6,
    borderWidth: 1.5,
    height: 15,
    left: 8,
    position: 'absolute',
    top: 9,
    width: 16,
  },
  bellTop: {
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    borderWidth: 1.5,
    height: 6,
    left: 12,
    position: 'absolute',
    top: 6,
    width: 8,
  },
  bellClapper: {
    borderRadius: 2,
    height: 3,
    left: 14,
    position: 'absolute',
    top: 23,
    width: 4,
  },
  gear: {
    borderRadius: 9,
    borderWidth: 1.5,
    height: 18,
    left: 7,
    position: 'absolute',
    top: 7,
    width: 18,
  },
  gearCenter: {
    borderRadius: 4,
    borderWidth: 1.5,
    height: 6,
    left: 13,
    position: 'absolute',
    top: 13,
    width: 6,
  },
});

const drawerStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 1, 20, 0.2)',
  },
  drawer: {
    backgroundColor: '#FAFAFA',
    borderColor: '#E8E6E8',
    borderRightWidth: 1,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
  },
  safeArea: {
    flex: 1,
    paddingTop: 14,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: '#E8E6E8',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 16,
    fontWeight: '600',
  },
  closeBtn: {
    alignItems: 'center',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  closeStroke: {
    backgroundColor: '#584D5A',
    borderRadius: 2,
    height: 2,
    position: 'absolute',
    width: 14,
  },
  closeStroke1: {
    transform: [{ rotate: '45deg' }],
  },
  closeStroke2: {
    transform: [{ rotate: '-45deg' }],
  },
  menuScroll: {
    flex: 1,
    paddingTop: 16,
  },
  menuItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 18,
    minHeight: 48,
    overflow: 'hidden',
    paddingHorizontal: 17,
    paddingVertical: 8,
    position: 'relative',
  },
  menuItemActive: {
    backgroundColor: '#F3EEFF',
  },
  indicator: {
    backgroundColor: 'transparent',
    borderRadius: 6,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 4,
  },
  indicatorActive: {
    backgroundColor: '#8359D5',
  },
  menuLabel: {
    color: '#584D5A',
    flexShrink: 1,
    fontFamily: 'Aeonik Pro',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 20,
  },
  menuLabelActive: {
    color: '#42007A',
  },
  bottomRow: {
    borderTopColor: '#E8E6E8',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  pillButton: {
    alignItems: 'center',
    borderRadius: 100,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  pillButtonOutlined: {
    backgroundColor: '#FFFFFF',
    borderColor: '#8359D5',
    borderWidth: 1.5,
  },
  pillButtonFilled: {
    backgroundColor: '#42007A',
  },
  pillButtonOutlinedText: {
    color: '#8359D5',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '600',
  },
  pillButtonFilledText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '600',
  },
  hamburgerMiniWrap: {
    gap: 3,
    justifyContent: 'center',
  },
  hamburgerMiniLine: {
    backgroundColor: '#8359D5',
    borderRadius: 1,
    height: 1.5,
    width: 14,
  },
  layoutIconWrap: {
    gap: 3,
    height: 14,
    justifyContent: 'center',
    width: 14,
  },
  layoutTop: {
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    height: 5,
    width: 14,
  },
  layoutBottom: {
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    height: 5,
    width: 14,
  },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  topBar: {
    alignItems: 'center',
    borderBottomColor: '#E8E6E8',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topBarLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    marginRight: 12,
    overflow: 'hidden',
  },
  hamburgerWrap: {
    flexShrink: 0,
    gap: 4,
    justifyContent: 'center',
  },
  hamburgerLine: {
    backgroundColor: '#100013',
    borderRadius: 2,
    height: 2,
    width: 20,
  },
  topBarTitle: {
    color: '#100013',
    flex: 1,
    fontFamily: 'Aeonik Pro',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    flexShrink: 0,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  backArrowLeft: {
    backgroundColor: '#100013',
    borderRadius: 1,
    height: 2,
    position: 'absolute',
    right: 10,
    top: 13,
    transform: [{ rotate: '-45deg' }],
    width: 10,
  },
  backArrowRight: {
    backgroundColor: '#100013',
    borderRadius: 1,
    height: 2,
    position: 'absolute',
    right: 10,
    top: 21,
    transform: [{ rotate: '45deg' }],
    width: 10,
  },
  placeholderWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#7C737E',
    fontFamily: 'Urbanist',
    fontSize: 16,
  },
});
