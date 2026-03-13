import { StyleSheet, View } from 'react-native';

import { lightTheme } from '../theme';
import { AppText } from './AppText';

interface TopBarProps {
  readonly timeLabel?: string;
}

const signalHeights = [6, 9, 12] as const;

export function TopBar({ timeLabel = '13:46' }: TopBarProps) {
  return (
    <View style={styles.wrapper}>
      <AppText style={styles.time} variant="statusTime">
        {timeLabel}
      </AppText>
      <View style={styles.signalGroup}>
        {signalHeights.map((height, index) => (
          <View key={index} style={[styles.signalBar, { height }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  signalBar: {
    backgroundColor: lightTheme.colors.textPrimary,
    borderRadius: lightTheme.radius.pill,
    width: 3,
  },
  signalGroup: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 4,
  },
  time: {
    color: lightTheme.colors.textPrimary,
  },
  wrapper: {
    alignItems: 'center',
    backgroundColor: lightTheme.colors.surfaceMuted,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: lightTheme.spacing[16],
    marginHorizontal: -20,
    paddingHorizontal: lightTheme.spacing[20],
    paddingVertical: lightTheme.spacing[12],
  },
});