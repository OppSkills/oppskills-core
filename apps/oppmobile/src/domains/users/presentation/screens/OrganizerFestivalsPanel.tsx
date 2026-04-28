import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { AppText } from '../../../../shared/ui';
import { styles } from './OrganizerFestivalsPanel.styles';

const searchPlaceholderColor = '#7C737E';

type FestivalCard = {
  readonly id: string;
  readonly title: string;
  readonly typeLabel: string;
  readonly typeBackground: string;
  readonly typeColor: string;
  readonly statusLabel: string;
  readonly statusBackground: string;
  readonly statusColor: string;
  readonly candidatesLabel: string;
  readonly eventsLabel: string;
  readonly competitionsLabel: string;
};

const festivalCards: readonly FestivalCard[] = [
  {
    candidatesLabel: '1,120 Candidates',
    competitionsLabel: '20 Competitions',
    eventsLabel: '15 Events',
    id: 'sustainable-gardening',
    statusBackground: '#93D7D0',
    statusColor: '#007569',
    statusLabel: 'Upcoming',
    title: 'Sustainable Gardening Webinar',
    typeBackground: '#EDEDED',
    typeColor: '#342636',
    typeLabel: 'Webinar',
  },
  {
    candidatesLabel: '3,150 Candidates',
    competitionsLabel: '20 Competitions',
    eventsLabel: '15 Events',
    id: 'hydroponics-basics',
    statusBackground: '#93D7D0',
    statusColor: '#007569',
    statusLabel: 'Registration Closed',
    title: 'Hydroponics Basics Course',
    typeBackground: '#EDEDED',
    typeColor: '#342636',
    typeLabel: 'Course',
  },
  {
    candidatesLabel: '980 Candidates',
    competitionsLabel: '20 Competitions',
    eventsLabel: '15 Events',
    id: 'composting-waste',
    statusBackground: '#93D7D0',
    statusColor: '#007569',
    statusLabel: 'In process',
    title: 'Composting and Waste Management',
    typeBackground: '#EDEDED',
    typeColor: '#342636',
    typeLabel: 'Seminar',
  },
  {
    candidatesLabel: '2,800 Candidates',
    competitionsLabel: '20 Competitions',
    eventsLabel: '15 Events',
    id: 'vertical-farming',
    statusBackground: '#93D7D0',
    statusColor: '#007569',
    statusLabel: 'Upcoming',
    title: 'Vertical Farming Innovations',
    typeBackground: '#EDEDED',
    typeColor: '#342636',
    typeLabel: 'Workshop',
  },
  {
    candidatesLabel: '1,400 Candidates',
    competitionsLabel: '20 Competitions',
    eventsLabel: '15 Events',
    id: 'organic-pest-control',
    statusBackground: '#93D7D0',
    statusColor: '#007569',
    statusLabel: 'In process',
    title: 'Organic Pest Control Techniques',
    typeBackground: '#EDEDED',
    typeColor: '#342636',
    typeLabel: 'Webinar',
  },
] as const;

interface OrganizerFestivalsPanelProps {
  readonly onOpenSidebar: () => void;
}

export function OrganizerFestivalsPanel({ onOpenSidebar }: OrganizerFestivalsPanelProps) {
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();
  const visibleCards = festivalCards.filter((card) => {
    if (!normalizedQuery) {
      return true;
    }

    return (
      card.title.toLowerCase().includes(normalizedQuery) ||
      card.typeLabel.toLowerCase().includes(normalizedQuery) ||
      card.statusLabel.toLowerCase().includes(normalizedQuery)
    );
  });

  return (
    <View style={styles.screen}>
      <View style={styles.statusBar}>
        <AppText style={styles.statusTime} variant="statusTime">
          13:46
        </AppText>

        <View style={styles.statusIcons}>
          <SignalIcon compact />
          <SignalIcon />
        </View>
      </View>

      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Pressable accessibilityLabel="Open organizer sidebar" onPress={onOpenSidebar} style={styles.menuButton}>
            <View style={styles.menuIconColumn}>
              <View style={styles.menuIconPane} />
              <View style={styles.menuIconPane} />
            </View>
          </Pressable>

          <AppText style={styles.headerTitle}>Festivals</AppText>
        </View>

        <View style={styles.headerRight}>
          <Pressable accessibilityLabel="Festival notifications" onPress={() => {}} style={styles.notificationButton}>
            <View style={styles.notificationBellTop} />
            <View style={styles.notificationBellBody} />
            <View style={styles.notificationBellClapper} />
          </Pressable>

          <Pressable accessibilityLabel="Organizer profile menu" onPress={() => {}} style={styles.avatarPill}>
            <View style={styles.avatarCircle}>
              <AppText style={styles.avatarInitials}>OS</AppText>
            </View>
            <View style={styles.avatarChevron} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <TextInput
              onChangeText={setQuery}
              placeholder="Search"
              placeholderTextColor={searchPlaceholderColor}
              style={styles.searchInput}
              value={query}
            />
            <View style={styles.searchSymbol}>
              <View style={styles.searchSymbolCircle} />
              <View style={styles.searchSymbolHandle} />
            </View>
          </View>

          <Pressable accessibilityLabel="Host a festival" onPress={() => {}} style={styles.hostButton}>
            <View style={styles.plusIcon}>
              <View style={styles.plusCircle} />
              <View style={styles.plusHorizontal} />
              <View style={styles.plusVertical} />
            </View>
            <AppText style={styles.hostButtonLabel}>Host</AppText>
          </Pressable>
        </View>

        {visibleCards.length > 0 ? (
          <View style={styles.festivalList}>
            {visibleCards.map((card) => (
              <View key={card.id} style={styles.festivalCard}>
                <View style={styles.festivalTop}>
                  <PosterThumbnail />

                  <View style={styles.festivalInfo}>
                    <AppText numberOfLines={2} style={styles.festivalTitle}>
                      {card.title}
                    </AppText>

                    <View style={styles.tagRow}>
                      <TagChip
                        backgroundColor={card.typeBackground}
                        label={card.typeLabel}
                        textColor={card.typeColor}
                      />
                      <TagChip
                        backgroundColor={card.statusBackground}
                        label={card.statusLabel}
                        textColor={card.statusColor}
                      />
                    </View>

                    <View style={styles.candidateChip}>
                      <View style={styles.candidateIcon}>
                        <View style={styles.candidateIconHead} />
                        <View style={styles.candidateIconBody} />
                      </View>
                      <AppText style={styles.candidateChipText}>{card.candidatesLabel}</AppText>
                    </View>
                  </View>
                </View>

                <View style={styles.festivalFooter}>
                  <View style={styles.statRow}>
                    <View style={styles.statBlock}>
                      <AppText style={styles.statLabel}>No. Of Events</AppText>
                      <AppText style={styles.statValue}>{card.eventsLabel}</AppText>
                      <AppText style={styles.statCaption}>500 Candidates</AppText>
                    </View>

                    <View style={styles.statBlock}>
                      <AppText style={styles.statLabel}>No. Of Competitions</AppText>
                      <AppText style={styles.statValue}>{card.competitionsLabel}</AppText>
                      <AppText style={styles.statCaption}>500 Candidates</AppText>
                    </View>
                  </View>

                  <Pressable accessibilityLabel={`Edit ${card.title}`} onPress={() => {}} style={styles.editButton}>
                    <View style={styles.editIcon}>
                      <View style={styles.editIconBody} />
                      <View style={styles.editIconUnderline} />
                    </View>
                    <AppText style={styles.editButtonLabel}>Edit</AppText>
                  </Pressable>
                </View>
              </View>
            ))}
            <View style={styles.listEndSpacer} />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <AppText style={styles.emptyStateTitle} variant="title">
              No festivals found
            </AppText>
            <AppText style={styles.emptyStateBody} variant="body">
              Try a different title, type, or status in the search field.
            </AppText>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function PosterThumbnail() {
  return (
    <View style={styles.posterBackdrop}>
      <View style={styles.posterAccentLeft} />
      <View style={styles.posterAccentRight} />
      <View style={styles.posterBody}>
        <AppText style={styles.posterTitle}>FESTIVAL</AppText>
        <AppText style={styles.posterSubTitle}>OPPSKILLS LIVE SERIES</AppText>
        <AppText style={styles.posterMeta}>2026 / ORGANIZER EDITION</AppText>
      </View>
    </View>
  );
}

function SignalIcon({ compact = false }: { readonly compact?: boolean }) {
  return (
    <View style={styles.signalBarsGroup}>
      <View style={[styles.signalColumn, compact ? styles.signalBarTiny : styles.signalBarSmall]} />
      <View style={[styles.signalColumn, compact ? styles.signalBarSmall : styles.signalBarMedium]} />
      <View style={[styles.signalColumn, compact ? styles.signalBarMedium : styles.signalBarLarge]} />
    </View>
  );
}

function TagChip({
  backgroundColor,
  label,
  textColor,
}: {
  readonly backgroundColor: string;
  readonly label: string;
  readonly textColor: string;
}) {
  return (
    <View style={[styles.tagChip, { backgroundColor }]}>
      <AppText style={[styles.tagChipLabel, { color: textColor }]}>{label}</AppText>
    </View>
  );
}
