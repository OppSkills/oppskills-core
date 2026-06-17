import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import subtractPlaceholder from '../../../../../../assets/Subtract.png';
import { AppText, type RegistrationQuestion } from '../../../../../shared/ui';
import { EditHackathonScreen } from './EditHackathonScreen';

export type EligibilityKey = 'everyone' | 'school' | 'college' | 'freshers' | 'professionals';
export type PassSendingMode = 'immediate' | 'after-approval';
export type TicketType = 'free' | 'paid';

export type RoundType = 'Online' | 'Offline' | 'Presentation';

export interface HackathonRound {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly type?: RoundType;
  readonly submissionsEnabled?: boolean;
}

export interface HackathonPrize {
  readonly id: string;
  readonly title: string;
  readonly amount: string;
}

export interface HackathonContact {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly email: string;
}

export interface HackathonAttachment {
  readonly id: string;
  readonly name: string;
  readonly url: string;
}

export interface LiveHackathon {
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
  readonly ticketType: TicketType;
  // Registration Settings
  readonly eligibleCandidates?: readonly EligibilityKey[];
  readonly registrationStartDate?: string;
  readonly registrationStartTime?: string;
  readonly registrationDeadlineDate?: string;
  readonly registrationDeadlineTime?: string;
  readonly additionalQuestions?: readonly RegistrationQuestion[];
  // Rounds
  readonly rounds?: readonly HackathonRound[];
  // Prizes
  readonly prizeDescription?: string;
  readonly participationCertificate?: boolean;
  readonly prizes?: readonly HackathonPrize[];
  // Additional Info
  readonly contacts?: readonly HackathonContact[];
  readonly attachments?: readonly HackathonAttachment[];
  // Pass Settings
  readonly passSendingMode?: PassSendingMode;
  readonly restrictToColleges?: boolean;
  readonly imageUrl?: string | null;
}

import {
  type LocationMode,
} from './HackathonFormModals';

export interface OrganizerCreateHackathonScreenProps {
  readonly onBack: () => void;
  readonly onHostHackathon: (hackathon: LiveHackathon) => void;
  readonly isCreating?: boolean;
}

const EMPTY_HACKATHON: LiveHackathon = {
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

export function OrganizerCreateHackathonScreen({ onBack, onHostHackathon, isCreating = false }: OrganizerCreateHackathonScreenProps) {
  const [hackathon, setHackathon] = useState<LiveHackathon>({ ...EMPTY_HACKATHON, id: String(Date.now()) });

  return (
    <View style={createStyles.screen}>
      {/* Top bar */}
      <View style={createStyles.topBar}>
        <Pressable onPress={onBack} style={createStyles.backButton}>
          <View style={createStyles.backChevron} />
        </Pressable>
        <AppText style={createStyles.topBarTitle}>Host Hackathon</AppText>
      </View>

      <EditHackathonScreen
        hackathon={hackathon}
        isCreating={isCreating}
        mode="create"
        onCreateHackathon={onHostHackathon}
        onUpdateHackathon={setHackathon}
      />
    </View>
  );
}

const createStyles = StyleSheet.create({
  screen: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  topBar: {
    alignItems: 'center',
    borderBottomColor: '#F3F4F6',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  backChevron: {
    borderColor: '#100013',
    borderLeftWidth: 2,
    borderTopWidth: 2,
    height: 10,
    transform: [{ rotate: '-45deg' }],
    width: 10,
  },
  topBarTitle: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 18,
    fontWeight: '700',
  },
});
