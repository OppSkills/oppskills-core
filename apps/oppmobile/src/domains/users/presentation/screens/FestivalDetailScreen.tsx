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

import { AppText } from '../../../../shared/ui';
import { FestivalDashboardScreen } from './FestivalDashboardScreen';
import { ManageFestivalRegistrationScreen } from './ManageFestivalRegistrationScreen';
import { EditFestivalScreen } from './EditFestivalScreen';
import { SendFestivalNotificationsPanel } from './SendFestivalNotificationsPanel';

export interface LiveFestival {
  readonly id: string;
  readonly title: string;
  readonly typeLabel: string;
  readonly statusLabel: string;
  readonly candidatesLabel: string;
  readonly eventsLabel: string;
  readonly competitionsLabel: string;
}

interface FestivalDetailScreenProps {
  readonly festival: LiveFestival;
  readonly onBack: () => void;
  readonly onOpenMainSidebar: () => void;
  readonly onUpdateFestival: (festival: LiveFestival) => void;
}

type ContextSectionKey =
  | 'dashboard'
  | 'manage-registration'
  | 'edit-festival'
  | 'referrals'
  | 'manage-roles'
  | 'payments'
  | 'send-notifications'
  | 'settings';

const CONTEXT_ITEMS: { key: ContextSectionKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'manage-registration', label: 'Manage Registration' },
  { key: 'edit-festival', label: 'Edit Festival' },
  { key: 'referrals', label: 'Referrals' },
  { key: 'manage-roles', label: 'Manage Roles' },
  { key: 'payments', label: 'Payments' },
  { key: 'send-notifications', label: 'Send Notifications' },
  { key: 'settings', label: 'Settings' },
];

export function FestivalDetailScreen({
  festival: initialFestival,
  onBack,
  onOpenMainSidebar,
  onUpdateFestival,
}: FestivalDetailScreenProps) {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeContextSection, setActiveContextSection] = useState<ContextSectionKey>('dashboard');
  const [festival, setFestival] = useState(initialFestival);

  function handleUpdateFestival(updated: LiveFestival) {
    setFestival(updated);
    onUpdateFestival(updated);
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
            {festival.title}
          </AppText>
        </Pressable>
        <Pressable onPress={onBack} style={styles.backButton}>
          <View style={styles.backArrowLeft} />
          <View style={styles.backArrowRight} />
        </Pressable>
      </View>

      {activeContextSection === 'dashboard' ? (
        <FestivalDashboardScreen festival={festival} />
      ) : activeContextSection === 'manage-registration' ? (
        <ManageFestivalRegistrationScreen />
      ) : activeContextSection === 'edit-festival' ? (
        <EditFestivalScreen festival={festival} onUpdateFestival={handleUpdateFestival} />
      ) : activeContextSection === 'send-notifications' ? (
        <SendFestivalNotificationsPanel onOpenSidebar={() => setDrawerVisible(true)} />
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
        <View style={[iconStyles.gridCell, { borderColor: tintColor, top: 4, left: 4 }]} />
        <View style={[iconStyles.gridCell, { borderColor: tintColor, top: 4, left: 16 }]} />
        <View style={[iconStyles.gridCell, { borderColor: tintColor, top: 16, left: 4 }]} />
        <View style={[iconStyles.gridCell, { borderColor: tintColor, top: 16, left: 16 }]} />
      </View>
    );
  }

  if (name === 'manage-registration') {
    return (
      <View style={iconStyles.frame}>
        <View style={[iconStyles.regOutline, { borderColor: tintColor }]} />
        <View style={[iconStyles.regLine, { borderColor: tintColor, top: 11 }]} />
        <View style={[iconStyles.regLine, { borderColor: tintColor, top: 16 }]} />
        <View style={[iconStyles.regLineShort, { borderColor: tintColor, top: 21 }]} />
      </View>
    );
  }

  if (name === 'edit-festival') {
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
