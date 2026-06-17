import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, type RegistrationQuestion } from '../../../../shared/ui';
import { EditEventScreen } from './EditEventScreen';
import { type LocationMode } from './EventFormModals';

export type EligibilityKey = 'everyone' | 'school' | 'college' | 'freshers' | 'professionals';
export type PassSendingMode = 'immediate' | 'after-approval';

export interface EventPrize {
  readonly id: string;
  readonly title: string;
  readonly amount: string;
}

export interface EventContact {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly email: string;
}

export interface LiveEvent {
  readonly id: string;
  readonly slug?: string;
  readonly title: string;
  readonly candidates: number;
  readonly startDate: string;
  readonly startTime: string;
  readonly organizerName: string;
  readonly locationMode: LocationMode;
  readonly locationValue: string;
  readonly description: string;
  readonly maxAttendees: string;
  readonly ticketType: 'free' | 'paid';
  // Registration Settings
  readonly eligibleCandidates?: readonly EligibilityKey[];
  readonly registrationStartDate?: string;
  readonly registrationStartTime?: string;
  readonly registrationDeadlineDate?: string;
  readonly registrationDeadlineTime?: string;
  readonly additionalQuestions?: readonly RegistrationQuestion[];
  // Prizes
  readonly prizeDescription?: string;
  readonly participationCertificate?: boolean;
  readonly prizes?: readonly EventPrize[];
  // Additional Info
  readonly contacts?: readonly EventContact[];
  // Pass Settings
  readonly passSendingMode?: PassSendingMode;
  readonly restrictToColleges?: boolean;
  readonly imageUrl?: string | null;
}

const EMPTY_EVENT: LiveEvent = {
  id: '',
  title: '',
  candidates: 0,
  startDate: '',
  startTime: '10:00 AM',
  organizerName: '',
  locationMode: 'online',
  locationValue: '',
  description: '',
  maxAttendees: '',
  ticketType: 'free',
  eligibleCandidates: ['everyone'],
};

export interface OrganizerCreateEventScreenProps {
  readonly onBack: () => void;
  readonly onHostEvent: (event: LiveEvent) => void;
}

export function OrganizerCreateEventScreen({ onBack, onHostEvent }: OrganizerCreateEventScreenProps) {
  const [event, setEvent] = useState<LiveEvent>({ ...EMPTY_EVENT, id: String(Date.now()) });

  return (
    <View style={createStyles.screen}>
      <View style={createStyles.topBar}>
        <Pressable onPress={onBack} style={createStyles.backButton}>
          <View style={createStyles.backChevron} />
        </Pressable>
        <AppText style={createStyles.topBarTitle}>Host Event</AppText>
      </View>

      <EditEventScreen
        event={event}
        mode="create"
        onCreateEvent={onHostEvent}
        onUpdateEvent={setEvent}
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
