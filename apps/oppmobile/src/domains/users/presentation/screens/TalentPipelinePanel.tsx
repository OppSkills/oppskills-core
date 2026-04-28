import { useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';

import { AppText } from '../../../../shared/ui';
import { styles } from './TalentPipelinePanel.styles';

const searchPlaceholderColor = '#7C737E';

type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc';
type FilterOption = '3m' | '6m' | '9m' | '1y' | '2y';

type TalentEntry = {
  readonly id: string;
  readonly name: string;
  readonly tag: string;
  readonly location: string;
  readonly phone: string;
  readonly email: string;
  readonly institution: string;
};

const talentEntries: readonly TalentEntry[] = [
  {
    email: 'maya.patel@designhub.com',
    id: 'maya-patel',
    institution: 'Design Institute of India',
    location: 'Mumbai, Maharashtra, India',
    name: 'Maya Patel',
    phone: '+91 88888 77777',
    tag: 'Hackathon',
  },
  {
    email: 'rohan.gupta@techwave.com',
    id: 'rohan-gupta',
    institution: 'Indian Institute of Technology',
    location: 'Bangalore, Karnataka, India',
    name: 'Rohan Gupta',
    phone: '+91 77777 66666',
    tag: 'Hackathon',
  },
  {
    email: 'sneha.verma@marketpro.com',
    id: 'sneha-verma',
    institution: 'Delhi School of Economics',
    location: 'Delhi, India',
    name: 'Sneha Verma',
    phone: '+91 66666 55555',
    tag: 'Hackathon',
  },
  {
    email: 'aditya.singh@startupindia.in',
    id: 'aditya-singh',
    institution: 'Osmania University',
    location: 'Hyderabad, Telangana, India',
    name: 'Aditya Singh',
    phone: '+91 55555 44444',
    tag: 'Hackathon',
  },
  {
    email: 'neha.joshi@datainsights.com',
    id: 'neha-joshi',
    institution: 'Anna University',
    location: 'Chennai, Tamil Nadu, India',
    name: 'Neha Joshi',
    phone: '+91 44444 33333',
    tag: 'Hackathon',
  },
] as const;

interface TalentPipelinePanelProps {
  readonly onOpenSidebar: () => void;
}

export function TalentPipelinePanel({ onOpenSidebar }: TalentPipelinePanelProps) {
  const [query, setQuery] = useState('');
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [filterOption, setFilterOption] = useState<FilterOption>('3m');

  const normalizedQuery = query.trim().toLowerCase();

  const sortedEntries = [...talentEntries].sort((a, b) => {
    if (sortOption === 'name-asc') return a.name.localeCompare(b.name);
    if (sortOption === 'name-desc') return b.name.localeCompare(a.name);
    if (sortOption === 'oldest') return a.id.localeCompare(b.id);
    return 0;
  });

  const visibleEntries = sortedEntries.filter((entry) => {
    if (!normalizedQuery) return true;
    return (
      entry.name.toLowerCase().includes(normalizedQuery) ||
      entry.institution.toLowerCase().includes(normalizedQuery) ||
      entry.location.toLowerCase().includes(normalizedQuery) ||
      entry.tag.toLowerCase().includes(normalizedQuery)
    );
  });

  return (
    <View style={styles.screen}>
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Pressable accessibilityLabel="Open organizer sidebar" onPress={onOpenSidebar} style={styles.menuButton}>
            <View style={styles.menuIconColumn}>
              <View style={styles.menuIconPane} />
              <View style={styles.menuIconPane} />
            </View>
          </Pressable>
          <AppText style={styles.headerTitle}>Talent Pipeline</AppText>
        </View>

        <View style={styles.headerRight}>
          <Pressable accessibilityLabel="Pipeline notifications" onPress={() => {}} style={styles.notificationButton}>
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
              placeholder="Email address"
              placeholderTextColor={searchPlaceholderColor}
              style={styles.searchInput}
              value={query}
            />
            <View style={styles.searchSymbol}>
              <View style={styles.searchSymbolCircle} />
              <View style={styles.searchSymbolHandle} />
            </View>
          </View>

          <Pressable accessibilityLabel="Invite talent" onPress={() => {}} style={styles.inviteButton}>
            <View style={styles.plusIcon}>
              <View style={styles.plusCircle} />
              <View style={styles.plusHorizontal} />
              <View style={styles.plusVertical} />
            </View>
            <AppText style={styles.inviteButtonLabel}>Invite</AppText>
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          <Pressable accessibilityLabel="Sort entries" onPress={() => setSortOpen(true)} style={styles.filterButton}>
            <View style={styles.sortIcon}>
              <View style={styles.sortLineTop} />
              <View style={styles.sortLineMid} />
              <View style={styles.sortLineBot} />
            </View>
            <AppText style={styles.filterLabel}>Sort</AppText>
          </Pressable>

          <Pressable accessibilityLabel="Filter entries" onPress={() => setFilterOpen(true)} style={styles.filterButton}>
            <View style={styles.filterIconLines}>
              <View style={styles.filterLineTop} />
              <View style={styles.filterLineMid} />
              <View style={styles.filterLineBot} />
            </View>
            <AppText style={styles.filterLabel}>Filter</AppText>
          </Pressable>
        </View>

        {visibleEntries.length > 0 ? (
          <View style={styles.list}>
            {visibleEntries.map((entry, index) => (
              <View key={entry.id}>
                <TalentCard entry={entry} />
                {index < visibleEntries.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <AppText style={styles.emptyStateTitle} variant="title">
              No results found
            </AppText>
            <AppText style={styles.emptyStateBody} variant="body">
              Try a different name, location, or institution.
            </AppText>
          </View>
        )}
      </ScrollView>

      <SortModal
        onClose={() => setSortOpen(false)}
        onSelect={setSortOption}
        selected={sortOption}
        visible={sortOpen}
      />

      <FilterModal
        onClose={() => setFilterOpen(false)}
        onSelect={setFilterOption}
        selected={filterOption}
        visible={filterOpen}
      />
    </View>
  );
}

/* ── Sort Modal ─────────────────────────────────────────────────────────── */

const sortOptions: { readonly key: SortOption; readonly label: string }[] = [
  { key: 'newest', label: 'Newest Candidate' },
  { key: 'oldest', label: 'Oldest Candidates' },
  { key: 'name-asc', label: 'Candidates Names (A → Z)' },
  { key: 'name-desc', label: 'Candidates Names (Z → A)' },
];

interface SortModalProps {
  readonly visible: boolean;
  readonly selected: SortOption;
  readonly onSelect: (option: SortOption) => void;
  readonly onClose: () => void;
}

function SortModal({ visible, selected, onSelect, onClose }: SortModalProps) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.modalBackdrop}>
        <Pressable style={styles.sortSheet}>
          <View style={styles.sheetHandle} />
          <AppText style={styles.sheetTitle}>Sort By</AppText>

          <View style={styles.optionList}>
            {sortOptions.map(({ key, label }) => (
              <Pressable
                accessibilityLabel={label}
                key={key}
                onPress={() => {
                  onSelect(key);
                  onClose();
                }}
                style={styles.optionRow}
              >
                <CheckCircle checked={selected === key} />
                <AppText style={styles.optionLabel}>{label}</AppText>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ── Filter Modal ───────────────────────────────────────────────────────── */

const filterOptions: { readonly key: FilterOption; readonly label: string }[] = [
  { key: '3m', label: 'Last 3 Months' },
  { key: '6m', label: 'Last 6 Months' },
  { key: '9m', label: 'Last 9 Months' },
  { key: '1y', label: 'Last 1 Year' },
  { key: '2y', label: 'Last 2 Year' },
];

interface FilterModalProps {
  readonly visible: boolean;
  readonly selected: FilterOption;
  readonly onSelect: (option: FilterOption) => void;
  readonly onClose: () => void;
}

function FilterModal({ visible, selected, onSelect, onClose }: FilterModalProps) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.modalBackdrop}>
        <Pressable style={styles.filterSheet}>
          <View style={styles.sheetHandle} />
          <AppText style={styles.sheetTitle}>Filters</AppText>

          <View style={styles.optionList}>
            {filterOptions.map(({ key, label }) => (
              <Pressable
                accessibilityLabel={label}
                key={key}
                onPress={() => {
                  onSelect(key);
                  onClose();
                }}
                style={styles.optionRow}
              >
                <CheckCircle checked={selected === key} />
                <AppText style={styles.optionLabel}>{label}</AppText>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ── Shared components ──────────────────────────────────────────────────── */

function CheckCircle({ checked }: { readonly checked: boolean }) {
  return (
    <View style={[styles.checkCircle, checked && styles.checkCircleActive]}>
      {checked && <View style={styles.checkMark} />}
    </View>
  );
}

function TalentCard({ entry }: { readonly entry: TalentEntry }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardAvatar}>
        <AppText style={styles.cardAvatarInitials}>
          {entry.name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)}
        </AppText>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardNameRow}>
          <AppText style={styles.cardName}>{entry.name}</AppText>
          <View style={styles.tagChip}>
            <AppText style={styles.tagChipLabel}>{entry.tag}</AppText>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <LocationIcon />
            <AppText style={styles.detailText}>{entry.location}</AppText>
          </View>
          <View style={styles.detailRow}>
            <PhoneIcon />
            <AppText style={styles.detailText}>{entry.phone}</AppText>
          </View>
          <View style={styles.detailRow}>
            <MailIcon />
            <AppText style={styles.detailText}>{entry.email}</AppText>
          </View>
          <View style={styles.detailRow}>
            <AcademicCapIcon />
            <AppText style={styles.detailText}>{entry.institution}</AppText>
          </View>
        </View>
      </View>
    </View>
  );
}

function LocationIcon() {
  return (
    <View style={styles.iconWrapper}>
      <View style={styles.locationPin} />
      <View style={styles.locationDot} />
    </View>
  );
}

function PhoneIcon() {
  return (
    <View style={styles.iconWrapper}>
      <View style={styles.phoneBody} />
    </View>
  );
}

function MailIcon() {
  return (
    <View style={styles.iconWrapper}>
      <View style={styles.mailBody} />
      <View style={styles.mailChevron} />
    </View>
  );
}

function AcademicCapIcon() {
  return (
    <View style={styles.iconWrapper}>
      <View style={styles.capBrim} />
      <View style={styles.capTassel} />
      <View style={styles.capBase} />
    </View>
  );
}
