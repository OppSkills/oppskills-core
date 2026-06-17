import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../../../shared/ui';
import { EditFestivalScreen } from './EditFestivalScreen';
import { type LiveFestival } from './FestivalDetailScreen';

export type FestivalEligibilityKey = 'everyone' | 'school' | 'college' | 'freshers' | 'professionals';
export type FestivalPassSendingMode = 'immediate' | 'after-approval';

export interface FestivalPrize {
  readonly id: string;
  readonly title: string;
  readonly amount: string;
}

export interface FestivalContact {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly email: string;
}

/**
 * LiveFestivalCreated is what gets passed to `onHostFestival` when the organizer
 * submits. It maps to the broader LiveFestival shape used across the Festival detail flow.
 */
export type LiveFestivalCreated = LiveFestival;

export interface OrganizerCreateFestivalScreenProps {
  readonly onBack: () => void;
  readonly onHostFestival: (festival: LiveFestivalCreated) => void;
}

const EMPTY_FESTIVAL: LiveFestival = {
  id: '',
  title: '',
  typeLabel: 'FESTIVAL',
  statusLabel: 'Draft',
  candidatesLabel: '0 Candidates',
  eventsLabel: '0 Events',
  competitionsLabel: '0 Competitions',
  eligibleCandidates: ['everyone'],
};

export function OrganizerCreateFestivalScreen({ onBack, onHostFestival }: OrganizerCreateFestivalScreenProps) {
  const [festival, setFestival] = useState<LiveFestival>({ ...EMPTY_FESTIVAL, id: String(Date.now()) });

  return (
    <View style={createStyles.screen}>
      <View style={createStyles.topBar}>
        <Pressable onPress={onBack} style={createStyles.backButton}>
          <View style={createStyles.backChevron} />
        </Pressable>
        <AppText style={createStyles.topBarTitle}>Host Festival</AppText>
      </View>

      <EditFestivalScreen
        festival={festival}
        mode="create"
        onCreateFestival={onHostFestival}
        onUpdateFestival={setFestival}
      />
    </View>
  );
}

const createStyles = StyleSheet.create({
  screen: { backgroundColor: '#FFFFFF', flex: 1 },
  topBar: {
    alignItems: 'center',
    borderBottomColor: '#F3F4F6',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 },
  backChevron: {
    borderColor: '#100013',
    borderLeftWidth: 2,
    borderTopWidth: 2,
    height: 10,
    transform: [{ rotate: '-45deg' }],
    width: 10,
  },
  topBarTitle: { color: '#100013', fontFamily: 'Aeonik Pro', fontSize: 18, fontWeight: '700' },
});
