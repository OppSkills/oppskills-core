import { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Modal,
  Pressable,
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
  | 'notifications';

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
  const drawerWidth = Math.min(299, Math.max(260, width * 0.82));
  const translateX = useRef(new Animated.Value(-drawerWidth)).current;

  useEffect(() => {
    if (!visible) {
      return;
    }

    translateX.setValue(-drawerWidth);

    Animated.timing(translateX, {
      duration: 220,
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }, [drawerWidth, translateX, visible]);

  if (!visible) {
    return null;
  }

  return (
    <Modal onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalRoot}>
        <Pressable accessibilityLabel="Close sidebar" onPress={onClose} style={styles.backdrop} />

        <Animated.View style={[styles.drawer, { transform: [{ translateX }], width: drawerWidth }]}>
          <SafeAreaView edges={['top', 'bottom', 'left']} style={styles.drawerSafeArea}>
            <View style={styles.logoBar}>
              <Image resizeMode="contain" source={oppskillsLogo} style={styles.logoImage} />

              <Pressable accessibilityLabel="Close sidebar" hitSlop={8} onPress={onClose} style={styles.closeButton}>
                <View style={[styles.closeStroke, styles.closeStrokePrimary]} />
                <View style={[styles.closeStroke, styles.closeStrokeSecondary]} />
              </Pressable>
            </View>

            <View style={styles.menuContainer}>
              {items.map((item) => {
                const isActive = item.key === activeItemKey;

                return (
                  <Pressable
                    key={item.key}
                    onPress={() => onSelect(item.key)}
                    style={[styles.menuItem, isActive ? styles.menuItemActive : null]}
                  >
                    <View style={[styles.menuItemIndicator, isActive ? styles.menuItemIndicatorActive : null]} />
                    <SidebarIcon active={isActive} name={item.icon} />
                    <AppText style={[styles.menuItemLabel, isActive ? styles.menuItemLabelActive : null]} variant="body">
                      {item.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </SafeAreaView>
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
  drawer: {
    backgroundColor: '#FAFAFA',
    borderColor: '#E8E6E8',
    borderRightWidth: 1,
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
  },
  drawerSafeArea: {
    flex: 1,
    paddingTop: 14,
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
  logoBar: {
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
  logoImage: {
    height: 24,
    width: 142,
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
    paddingHorizontal: 20,
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
  modalRoot: {
    flex: 1,
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
});
