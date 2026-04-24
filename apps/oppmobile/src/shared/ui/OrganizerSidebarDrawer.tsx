import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import oppskillsLogo from '../../../assets/OppSkill_Logo_UP_6 1.png';
import { lightTheme } from '../theme';
import { AppText } from './AppText';

export type OrganizerSidebarIconName =
  | 'dashboard'
  | 'home'
  | 'launchpad'
  | 'events'
  | 'participants'
  | 'organizer-id'
  | 'notifications'
  | 'registrations'
  | 'edit-opportunity'
  | 'payments'
  | 'referrals';

const MINI_WIDTH = 66;
const CHILD_WIDTH = 330;

const HOME_CHILD_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' as OrganizerSidebarIconName },
  { key: 'manage-registrations', label: 'Manage Registrations', icon: 'registrations' as OrganizerSidebarIconName },
  { key: 'edit-opportunity', label: 'Edit Opportunity', icon: 'edit-opportunity' as OrganizerSidebarIconName },
  { key: 'payments', label: 'Payments', icon: 'payments' as OrganizerSidebarIconName },
  { key: 'manage-roles', label: 'Manage Roles', icon: 'organizer-id' as OrganizerSidebarIconName },
  { key: 'send-notifications', label: 'Send Notifications', icon: 'notifications' as OrganizerSidebarIconName },
  { key: 'referrals', label: 'Referrals', icon: 'referrals' as OrganizerSidebarIconName },
] as const;

export interface OrganizerSidebarItem {
  readonly key: string;
  readonly label: string;
  readonly icon: OrganizerSidebarIconName;
}

interface OrganizerSidebarDrawerProps {
  readonly visible: boolean;
  readonly items: readonly OrganizerSidebarItem[];
  readonly activeItemKey?: string;
  readonly onClose: () => void;
  readonly onSelect: (key: string) => void;
}

export function OrganizerSidebarDrawer({
  visible,
  items,
  activeItemKey,
  onClose,
  onSelect,
}: OrganizerSidebarDrawerProps) {
  const { width } = useWindowDimensions();
  const fullDrawerWidth = Math.min(299, Math.max(260, width * 0.82));

  const drawerSlideX = useRef(new Animated.Value(-fullDrawerWidth)).current;
  const mainWidthAnim = useRef(new Animated.Value(fullDrawerWidth)).current;
  const childSlideX = useRef(new Animated.Value(CHILD_WIDTH)).current;
  const labelOpacity = useRef(new Animated.Value(1)).current;

  const [childVisible, setChildVisible] = useState(false);

  useEffect(() => {
    if (!visible) {
      setChildVisible(false);
      drawerSlideX.setValue(-fullDrawerWidth);
      mainWidthAnim.setValue(fullDrawerWidth);
      labelOpacity.setValue(1);
      childSlideX.setValue(CHILD_WIDTH);
      return;
    }

    drawerSlideX.setValue(-fullDrawerWidth);
    Animated.timing(drawerSlideX, {
      duration: 220,
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }, [drawerSlideX, fullDrawerWidth, labelOpacity, mainWidthAnim, childSlideX, visible]);

  useEffect(() => {
    if (childVisible) {
      Animated.parallel([
        Animated.timing(mainWidthAnim, {
          duration: 200,
          toValue: MINI_WIDTH,
          useNativeDriver: false,
        }),
        Animated.timing(labelOpacity, {
          duration: 120,
          toValue: 0,
          useNativeDriver: false,
        }),
        Animated.timing(childSlideX, {
          duration: 220,
          toValue: 0,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      childSlideX.setValue(CHILD_WIDTH);
      Animated.parallel([
        Animated.timing(mainWidthAnim, {
          duration: 200,
          toValue: fullDrawerWidth,
          useNativeDriver: false,
        }),
        Animated.timing(labelOpacity, {
          duration: 200,
          toValue: 1,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [childVisible, childSlideX, fullDrawerWidth, labelOpacity, mainWidthAnim]);

  if (!visible) {
    return null;
  }

  return (
    <Modal onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalRoot}>
        <Pressable accessibilityLabel="Close sidebar" onPress={onClose} style={styles.backdrop} />

        <Animated.View style={[styles.container, { transform: [{ translateX: drawerSlideX }] }]}>
          {/* Main / mini sidebar */}
          <Animated.View style={[styles.drawer, { width: mainWidthAnim }]}>
            <SafeAreaView edges={['top', 'bottom', 'left']} style={styles.drawerSafeArea}>
              {/* Logo bar — shows full logo or just logo mark depending on width */}
              <View style={styles.logoBar}>
                <Animated.View style={[styles.logoFull, { opacity: labelOpacity }]}>
                  <Image resizeMode="contain" source={oppskillsLogo} style={styles.logoImage} />
                </Animated.View>
                <Animated.View style={[styles.logoMini, { opacity: labelOpacity.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
                  <View style={styles.logoMiniMark} />
                </Animated.View>

                <Animated.View style={[styles.closeButtonWrap, { opacity: labelOpacity }]}>
                  <Pressable accessibilityLabel="Close sidebar" hitSlop={8} onPress={onClose} style={styles.closeButton}>
                    <View style={[styles.closeStroke, styles.closeStrokePrimary]} />
                    <View style={[styles.closeStroke, styles.closeStrokeSecondary]} />
                  </Pressable>
                </Animated.View>
              </View>

              <View style={styles.menuContainer}>
                {items.map((item) => {
                  const isActive = item.key === activeItemKey;
                  const isHome = item.key === 'home';

                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => {
                        if (isHome) {
                          setChildVisible((prev) => !prev);
                        } else {
                          setChildVisible(false);
                          onSelect(item.key);
                        }
                      }}
                      style={[styles.menuItem, isActive ? styles.menuItemActive : null]}
                    >
                      <View style={[styles.menuItemIndicator, isActive ? styles.menuItemIndicatorActive : null]} />
                      <SidebarIcon active={isActive} name={item.icon} />
                      <Animated.Text
                        numberOfLines={1}
                        style={[
                          styles.menuItemLabel,
                          isActive ? styles.menuItemLabelActive : null,
                          { opacity: labelOpacity },
                        ]}
                      >
                        {item.label}
                      </Animated.Text>
                      {isHome ? (
                        <Animated.View
                          style={[
                            styles.chevron,
                            childVisible ? styles.chevronOpen : null,
                            { opacity: labelOpacity },
                          ]}
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </SafeAreaView>
          </Animated.View>

          {/* Child sidebar — slides in to the right of mini bar */}
          <Animated.View
            style={[
              styles.childDrawer,
              { transform: [{ translateX: childSlideX }], width: CHILD_WIDTH },
            ]}
          >
            <SafeAreaView edges={['top', 'bottom', 'right']} style={styles.drawerSafeArea}>
              <View style={styles.childLogoBar}>
                <Image resizeMode="contain" source={oppskillsLogo} style={styles.logoImage} />
                <Pressable
                  accessibilityLabel="Back to main sidebar"
                  hitSlop={8}
                  onPress={() => setChildVisible(false)}
                  style={styles.closeButton}
                >
                  <View style={[styles.closeStroke, styles.closeStrokePrimary]} />
                  <View style={[styles.closeStroke, styles.closeStrokeSecondary]} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.childMenuContainer}>
                {HOME_CHILD_ITEMS.map((item) => (
                  <Pressable
                    key={item.key}
                    onPress={() => {
                      setChildVisible(false);
                      onSelect(item.key);
                    }}
                    style={styles.childMenuItem}
                  >
                    <SidebarIcon active={false} name={item.icon} />
                    <AppText style={styles.childMenuItemLabel} variant="body">
                      {item.label}
                    </AppText>
                  </Pressable>
                ))}
              </ScrollView>
            </SafeAreaView>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function SidebarIcon({
  name,
  active,
}: {
  readonly name: OrganizerSidebarIconName;
  readonly active: boolean;
}) {
  const tintStyle = active ? styles.iconStrokeActive : styles.iconStroke;

  if (name === 'dashboard') {
    return (
      <View style={styles.iconFrame}>
        <View style={[styles.gridIcon, tintStyle]}>
          <View style={[styles.gridCell, tintStyle]} />
          <View style={[styles.gridCell, tintStyle]} />
          <View style={[styles.gridCell, tintStyle]} />
          <View style={[styles.gridCell, tintStyle]} />
        </View>
      </View>
    );
  }

  if (name === 'home') {
    return (
      <View style={styles.iconFrame}>
        <View style={styles.homeIcon}>
          <View style={[styles.homeRoof, tintStyle]} />
          <View style={[styles.homeBody, tintStyle]} />
        </View>
      </View>
    );
  }

  if (name === 'launchpad') {
    return (
      <View style={styles.iconFrame}>
        <View style={[styles.rocketBody, tintStyle]} />
        <View style={[styles.rocketWingLeft, tintStyle]} />
        <View style={[styles.rocketWingRight, tintStyle]} />
        <View style={[styles.rocketFlame, active ? styles.iconFillActive : styles.iconFill]} />
      </View>
    );
  }

  if (name === 'events') {
    return (
      <View style={styles.iconFrame}>
        <View style={[styles.confettiStem, tintStyle]} />
        <View style={[styles.confettiBurstLarge, active ? styles.iconFillActive : styles.iconFill]} />
        <View style={[styles.confettiBurstSmall, active ? styles.iconFillActive : styles.iconFill]} />
        <View style={[styles.confettiSparkLeft, tintStyle]} />
        <View style={[styles.confettiSparkRight, tintStyle]} />
      </View>
    );
  }

  if (name === 'participants') {
    return (
      <View style={styles.iconFrame}>
        <View style={[styles.groupHeadLeft, tintStyle]} />
        <View style={[styles.groupHeadRight, tintStyle]} />
        <View style={[styles.groupBodyPrimary, tintStyle]} />
        <View style={[styles.groupBodySecondary, tintStyle]} />
      </View>
    );
  }

  if (name === 'organizer-id') {
    return (
      <View style={styles.iconFrame}>
        <View style={[styles.idCardOutline, tintStyle]} />
        <View style={[styles.idHead, tintStyle]} />
        <View style={[styles.idBody, tintStyle]} />
        <View style={[styles.idLineOne, tintStyle]} />
        <View style={[styles.idLineTwo, tintStyle]} />
      </View>
    );
  }

  if (name === 'registrations') {
    return (
      <View style={styles.iconFrame}>
        <View style={[styles.regOutline, tintStyle]} />
        <View style={[styles.regLineTop, tintStyle]} />
        <View style={[styles.regLineMid, tintStyle]} />
        <View style={[styles.regLineBot, tintStyle]} />
      </View>
    );
  }

  if (name === 'edit-opportunity') {
    return (
      <View style={styles.iconFrame}>
        <View style={[styles.editBody, tintStyle]} />
        <View style={[styles.editUnderline, tintStyle]} />
      </View>
    );
  }

  if (name === 'payments') {
    return (
      <View style={styles.iconFrame}>
        <View style={[styles.payCard, tintStyle]} />
        <View style={[styles.payStripe, active ? styles.iconFillActive : styles.iconFill]} />
      </View>
    );
  }

  if (name === 'referrals') {
    return (
      <View style={styles.iconFrame}>
        <View style={[styles.refHeadLeft, tintStyle]} />
        <View style={[styles.refHeadRight, tintStyle]} />
        <View style={[styles.refArrow, tintStyle]} />
      </View>
    );
  }

  return (
    <View style={styles.iconFrame}>
      <View style={[styles.bellBody, tintStyle]} />
      <View style={[styles.bellTop, tintStyle]} />
      <View style={[styles.bellClapper, active ? styles.iconFillActive : styles.iconFill]} />
      <View style={[styles.notificationDot, active ? styles.notificationDotActive : styles.notificationDotIdle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 1, 20, 0.2)',
  },
  container: {
    bottom: 0,
    flexDirection: 'row',
    left: 0,
    position: 'absolute',
    top: 0,
  },
  drawer: {
    backgroundColor: '#FAFAFA',
    borderColor: '#E8E6E8',
    borderRightWidth: 1,
    bottom: 0,
    overflow: 'hidden',
    top: 0,
  },
  drawerSafeArea: {
    flex: 1,
    paddingTop: 14,
  },
  logoBar: {
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderBottomColor: '#E8E6E8',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  logoFull: {
    flex: 1,
  },
  logoMini: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  logoMiniMark: {
    backgroundColor: '#835BD5',
    borderRadius: 6,
    height: 28,
    width: 28,
  },
  closeButtonWrap: {
    marginLeft: 8,
  },
  logoImage: {
    height: 24,
    width: 142,
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: lightTheme.radius.pill,
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
  closeStrokePrimary: {
    transform: [{ rotate: '45deg' }],
  },
  closeStrokeSecondary: {
    transform: [{ rotate: '-45deg' }],
  },
  menuContainer: {
    backgroundColor: '#FAFAFA',
    flex: 1,
    gap: 12,
    paddingTop: 33,
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
  menuItemIndicator: {
    backgroundColor: 'transparent',
    borderRadius: 6,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 4,
  },
  menuItemIndicatorActive: {
    backgroundColor: '#8359D5',
  },
  menuItemLabel: {
    color: '#584D5A',
    flexShrink: 1,
    fontFamily: 'Aeonik Pro',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 20,
  },
  menuItemLabelActive: {
    color: '#42007A',
  },
  chevron: {
    borderBottomColor: '#584D5A',
    borderBottomWidth: 1.5,
    borderRightColor: '#584D5A',
    borderRightWidth: 1.5,
    height: 7,
    marginLeft: 'auto',
    transform: [{ rotate: '-45deg' }],
    width: 7,
  },
  chevronOpen: {
    transform: [{ rotate: '45deg' }],
  },
  childDrawer: {
    backgroundColor: '#FAFAFA',
    borderColor: '#E8E6E8',
    borderLeftWidth: 1,
    bottom: 0,
    overflow: 'hidden',
    top: 0,
  },
  childLogoBar: {
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderBottomColor: '#E8E6E8',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  childMenuContainer: {
    backgroundColor: '#FAFAFA',
    flex: 1,
    paddingTop: 33,
  },
  childMenuItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 18,
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  childMenuItemLabel: {
    color: '#584D5A',
    fontFamily: 'Aeonik Pro',
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 20,
  },
  modalRoot: {
    flex: 1,
  },
  bellBody: {
    borderColor: '#584D5A',
    borderRadius: 6,
    borderWidth: 1.5,
    height: 15,
    left: 8,
    position: 'absolute',
    top: 9,
    width: 16,
  },
  bellClapper: {
    backgroundColor: '#584D5A',
    borderRadius: 2,
    height: 3,
    left: 14,
    position: 'absolute',
    top: 23,
    width: 4,
  },
  bellTop: {
    borderColor: '#584D5A',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    borderWidth: 1.5,
    height: 6,
    left: 12,
    position: 'absolute',
    top: 6,
    width: 8,
  },
  confettiBurstLarge: {
    backgroundColor: '#584D5A',
    borderRadius: 4,
    height: 8,
    left: 9,
    position: 'absolute',
    top: 12,
    transform: [{ rotate: '-28deg' }],
    width: 8,
  },
  confettiBurstSmall: {
    backgroundColor: '#584D5A',
    borderRadius: 3,
    height: 6,
    left: 17,
    position: 'absolute',
    top: 8,
    width: 6,
  },
  confettiSparkLeft: {
    borderColor: '#584D5A',
    borderWidth: 1.5,
    height: 6,
    left: 7,
    position: 'absolute',
    top: 6,
    transform: [{ rotate: '30deg' }],
    width: 1,
  },
  confettiSparkRight: {
    borderColor: '#584D5A',
    borderWidth: 1.5,
    height: 6,
    left: 24,
    position: 'absolute',
    top: 15,
    transform: [{ rotate: '-35deg' }],
    width: 1,
  },
  confettiStem: {
    borderColor: '#584D5A',
    borderWidth: 1.5,
    height: 14,
    left: 14,
    position: 'absolute',
    top: 13,
    transform: [{ rotate: '35deg' }],
    width: 1,
  },
  gridCell: {
    borderColor: '#584D5A',
    borderRadius: 3,
    borderWidth: 1.5,
    height: 8,
    width: 8,
  },
  gridIcon: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    height: 19,
    width: 19,
  },
  groupBodyPrimary: {
    borderColor: '#584D5A',
    borderRadius: 6,
    borderWidth: 1.5,
    height: 9,
    left: 5,
    position: 'absolute',
    top: 15,
    width: 15,
  },
  groupBodySecondary: {
    borderColor: '#584D5A',
    borderRadius: 5,
    borderWidth: 1.5,
    height: 7,
    left: 18,
    position: 'absolute',
    top: 16,
    width: 9,
  },
  groupHeadLeft: {
    borderColor: '#584D5A',
    borderRadius: 5,
    borderWidth: 1.5,
    height: 8,
    left: 8,
    position: 'absolute',
    top: 7,
    width: 8,
  },
  groupHeadRight: {
    borderColor: '#584D5A',
    borderRadius: 4,
    borderWidth: 1.5,
    height: 7,
    left: 19,
    position: 'absolute',
    top: 8,
    width: 7,
  },
  homeBody: {
    borderColor: '#584D5A',
    borderRadius: 4,
    borderWidth: 1.5,
    height: 10,
    top: 13,
    width: 14,
  },
  homeIcon: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  homeRoof: {
    borderColor: '#584D5A',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    borderWidth: 1.5,
    height: 10,
    marginBottom: -2,
    transform: [{ rotate: '45deg' }],
    width: 10,
  },
  iconFill: {
    backgroundColor: '#584D5A',
  },
  iconFillActive: {
    backgroundColor: '#42007A',
  },
  iconFrame: {
    alignItems: 'center',
    flexShrink: 0,
    height: 32,
    justifyContent: 'center',
    position: 'relative',
    width: 32,
  },
  iconStroke: {
    borderColor: '#584D5A',
  },
  iconStrokeActive: {
    borderColor: '#42007A',
  },
  idBody: {
    borderColor: '#584D5A',
    borderRadius: 3,
    borderWidth: 1.5,
    height: 5,
    left: 10,
    position: 'absolute',
    top: 16,
    width: 8,
  },
  idCardOutline: {
    borderColor: '#584D5A',
    borderRadius: 5,
    borderWidth: 1.5,
    height: 20,
    left: 5,
    position: 'absolute',
    top: 6,
    width: 22,
  },
  idHead: {
    borderColor: '#584D5A',
    borderRadius: 4,
    borderWidth: 1.5,
    height: 6,
    left: 11,
    position: 'absolute',
    top: 9,
    width: 6,
  },
  idLineOne: {
    borderColor: '#584D5A',
    borderWidth: 1.5,
    height: 1,
    left: 20,
    position: 'absolute',
    top: 12,
    width: 5,
  },
  idLineTwo: {
    borderColor: '#584D5A',
    borderWidth: 1.5,
    height: 1,
    left: 20,
    position: 'absolute',
    top: 18,
    width: 5,
  },
  notificationDot: {
    borderRadius: 4,
    height: 6,
    left: 21,
    position: 'absolute',
    top: 7,
    width: 6,
  },
  notificationDotActive: {
    backgroundColor: '#42007A',
  },
  notificationDotIdle: {
    backgroundColor: '#584D5A',
  },
  rocketBody: {
    borderColor: '#584D5A',
    borderRadius: 6,
    borderWidth: 1.5,
    height: 14,
    position: 'absolute',
    top: 7,
    transform: [{ rotate: '35deg' }],
    width: 10,
  },
  rocketFlame: {
    backgroundColor: '#584D5A',
    borderRadius: 3,
    height: 6,
    left: 11,
    position: 'absolute',
    top: 20,
    transform: [{ rotate: '35deg' }],
    width: 6,
  },
  rocketWingLeft: {
    borderColor: '#584D5A',
    borderWidth: 1.5,
    height: 6,
    left: 7,
    position: 'absolute',
    top: 15,
    transform: [{ rotate: '25deg' }],
    width: 1,
  },
  rocketWingRight: {
    borderColor: '#584D5A',
    borderWidth: 1.5,
    height: 6,
    left: 22,
    position: 'absolute',
    top: 12,
    transform: [{ rotate: '-25deg' }],
    width: 1,
  },
  regOutline: {
    borderColor: '#584D5A',
    borderRadius: 4,
    borderWidth: 1.5,
    height: 20,
    left: 5,
    position: 'absolute',
    top: 6,
    width: 22,
  },
  regLineTop: {
    borderColor: '#584D5A',
    borderWidth: 1.5,
    height: 1,
    left: 9,
    position: 'absolute',
    top: 11,
    width: 10,
  },
  regLineMid: {
    borderColor: '#584D5A',
    borderWidth: 1.5,
    height: 1,
    left: 9,
    position: 'absolute',
    top: 16,
    width: 10,
  },
  regLineBot: {
    borderColor: '#584D5A',
    borderWidth: 1.5,
    height: 1,
    left: 9,
    position: 'absolute',
    top: 21,
    width: 6,
  },
  editBody: {
    borderColor: '#584D5A',
    borderRadius: 3,
    borderWidth: 1.5,
    height: 16,
    left: 8,
    position: 'absolute',
    top: 6,
    transform: [{ rotate: '35deg' }],
    width: 10,
  },
  editUnderline: {
    borderColor: '#584D5A',
    borderWidth: 1.5,
    height: 1,
    left: 5,
    position: 'absolute',
    top: 25,
    width: 22,
  },
  payCard: {
    borderColor: '#584D5A',
    borderRadius: 4,
    borderWidth: 1.5,
    height: 18,
    left: 5,
    position: 'absolute',
    top: 7,
    width: 22,
  },
  payStripe: {
    backgroundColor: '#584D5A',
    height: 4,
    left: 5,
    position: 'absolute',
    top: 12,
    width: 22,
  },
  refHeadLeft: {
    borderColor: '#584D5A',
    borderRadius: 5,
    borderWidth: 1.5,
    height: 8,
    left: 4,
    position: 'absolute',
    top: 7,
    width: 8,
  },
  refHeadRight: {
    borderColor: '#584D5A',
    borderRadius: 5,
    borderWidth: 1.5,
    height: 8,
    left: 20,
    position: 'absolute',
    top: 7,
    width: 8,
  },
  refArrow: {
    borderColor: '#584D5A',
    borderTopWidth: 1.5,
    height: 1,
    left: 9,
    position: 'absolute',
    top: 19,
    width: 14,
  },
});
