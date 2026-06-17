import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { SearchFlowState } from '../../model/searchStateMachine';
import type { SearchResultEntity } from '../../domain/entities/SearchCatalog';
import { appDimensions } from '../../../../shared/constants/dimensions';
import { lightTheme } from '../../../../shared/theme';
import { AppText, SearchInput } from '../../../../shared/ui';

interface SearchPageRecentScreenProps {
  readonly query: string;
  readonly flowState: SearchFlowState;
  readonly recentQueries: readonly string[];
  readonly onPopular: () => void;
  readonly onQueryChange: (nextQuery: string) => void;
  readonly onSubmitQuery: (query: string) => void;
}

export function SearchPageRecentScreen({
  query,
  flowState,
  recentQueries,
  onPopular,
  onQueryChange,
  onSubmitQuery,
}: SearchPageRecentScreenProps) {
  return (
    <SearchScaffold
      query={query}
      title="Recent Searches"
      flowState={flowState}
      onQueryChange={onQueryChange}
      onSubmitQuery={onSubmitQuery}
    >
      <QueryList emptyLabel="No search history yet. Start typing to discover opportunities." items={recentQueries} onSelect={onSubmitQuery} />
      <FooterCopy />
      <Pressable onPress={onPopular} style={styles.secondaryRouteLink}>
        <AppText colorToken="brandPrimaryStrong" variant="caption">
          Switch to popular searches
        </AppText>
      </Pressable>
    </SearchScaffold>
  );
}

interface SearchPagePopularScreenProps {
  readonly query: string;
  readonly flowState: SearchFlowState;
  readonly popularQueries: readonly string[];
  readonly onRecent: () => void;
  readonly onQueryChange: (nextQuery: string) => void;
  readonly onSubmitQuery: (query: string) => void;
}

export function SearchPagePopularScreen({
  query,
  flowState,
  popularQueries,
  onRecent,
  onQueryChange,
  onSubmitQuery,
}: SearchPagePopularScreenProps) {
  return (
    <SearchScaffold
      query={query}
      title="Popular Searches"
      flowState={flowState}
      onQueryChange={onQueryChange}
      onSubmitQuery={onSubmitQuery}
    >
      <QueryList items={popularQueries} onSelect={onSubmitQuery} />
      <FooterCopy />
      <Pressable onPress={onRecent} style={styles.secondaryRouteLink}>
        <AppText colorToken="brandPrimaryStrong" variant="caption">
          View recent searches
        </AppText>
      </Pressable>
    </SearchScaffold>
  );
}

interface SearchPageTypingScreenProps {
  readonly query: string;
  readonly flowState: SearchFlowState;
  readonly suggestions: readonly string[];
  readonly onPopular: () => void;
  readonly onQueryChange: (nextQuery: string) => void;
  readonly onSubmitQuery: (query: string) => void;
}

export function SearchPageTypingScreen({
  query,
  flowState,
  suggestions,
  onPopular,
  onQueryChange,
  onSubmitQuery,
}: SearchPageTypingScreenProps) {
  return (
    <SearchScaffold
      query={query}
      title="Suggestions"
      flowState={flowState}
      onQueryChange={onQueryChange}
      onSubmitQuery={onSubmitQuery}
    >
      <QueryList
        emptyLabel="Keep typing to explore matching opportunities."
        items={suggestions}
        onSelect={onSubmitQuery}
      />
      <FooterCopy />
      <Pressable onPress={onPopular} style={styles.secondaryRouteLink}>
        <AppText colorToken="brandPrimaryStrong" variant="caption">
          Browse popular searches
        </AppText>
      </Pressable>
    </SearchScaffold>
  );
}

interface SearchPageResultsScreenProps {
  readonly query: string;
  readonly flowState: SearchFlowState;
  readonly results: readonly SearchResultEntity[];
  readonly onCompetition: (id: string) => void;
  readonly onHackathon: (id: string) => void;
  readonly onQueryChange: (nextQuery: string) => void;
  readonly onSubmitQuery: (query: string) => void;
}

export function SearchPageResultsScreen({
  query,
  flowState,
  results,
  onCompetition,
  onHackathon,
  onQueryChange,
  onSubmitQuery,
}: SearchPageResultsScreenProps) {
  const handleResultPress = (item: SearchResultEntity) => {
    if (item.kind === 'hackathon') {
      onHackathon(item.id);
      return;
    }

    onCompetition(item.id);
  };

  return (
    <SearchScaffold
      autoFocus={false}
      query={query}
      title="Search Results"
      flowState={flowState}
      onQueryChange={onQueryChange}
      onSubmitQuery={onSubmitQuery}
    >
      <ResultList items={results} onSelect={handleResultPress} />
      <FooterCopy />
    </SearchScaffold>
  );
}

interface SearchScaffoldProps {
  readonly query: string;
  readonly title: string;
  readonly flowState: SearchFlowState;
  readonly onQueryChange: (nextQuery: string) => void;
  readonly onSubmitQuery: (query: string) => void;
  readonly children: React.ReactNode;
  readonly autoFocus?: boolean;
}

function SearchScaffold({
  query,
  title,
  flowState,
  onQueryChange,
  onSubmitQuery,
  children,
  autoFocus = true,
}: SearchScaffoldProps) {
  const stateLabel = flowState === 'submitted' ? 'submitted' : flowState === 'typing' ? 'typing' : 'idle';

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          style={styles.scrollView}
        >
          <SearchInput
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={autoFocus}
            onChangeText={onQueryChange}
            onSubmitEditing={({ nativeEvent }) => onSubmitQuery(nativeEvent.text)}
            placeholder="Search"
            returnKeyType="search"
            value={query}
          />

          <View style={styles.titleRow}>
            <AppText style={styles.sectionTitle} variant="sectionHeading">
              {title}
            </AppText>
            <AppText colorToken="textMuted" variant="micro">
              {stateLabel}
            </AppText>
          </View>

          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface QueryListProps {
  readonly items: readonly string[];
  readonly onSelect: (query: string) => void;
  readonly emptyLabel?: string;
}

function QueryList({ items, onSelect, emptyLabel = 'No suggestions available yet.' }: QueryListProps) {
  if (items.length === 0) {
    return (
      <View style={styles.emptyState}>
        <AppText colorToken="textSecondary" variant="caption">
          {emptyLabel}
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.queryList}>
      {items.map((item) => (
        <Pressable key={item} onPress={() => onSelect(item)} style={styles.queryRow}>
          <AppText style={styles.queryLabel} variant="title">
            {item}
          </AppText>
          <AppText colorToken="textSecondary" style={styles.queryArrow} variant="label">
            {'>'}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

interface ResultListProps {
  readonly items: readonly SearchResultEntity[];
  readonly onSelect: (item: SearchResultEntity) => void;
}

function ResultList({ items, onSelect }: ResultListProps) {
  if (items.length === 0) {
    return (
      <View style={styles.emptyState}>
        <AppText colorToken="textSecondary" variant="caption">
          No matching opportunities found. Try a broader search term.
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.resultList}>
      {items.map((item) => (
        <Pressable key={item.id} onPress={() => onSelect(item)} style={styles.resultRow}>
          <View style={[styles.resultThumb, heroTone(item.tone)]}>
            <AppText colorToken="textInverse" numberOfLines={2} style={styles.resultThumbTitle} variant="micro">
              {item.title.toUpperCase()}
            </AppText>
          </View>

          <View style={styles.resultMeta}>
            <View style={styles.resultHeader}>
              <AppText numberOfLines={2} style={styles.resultTitle} variant="title">
                {item.title}
              </AppText>
              <View style={styles.resultBookmark}>
                <AppText colorToken="brandPrimaryStrong" variant="micro">
                  S
                </AppText>
              </View>
            </View>

            <AppText colorToken="textMuted" numberOfLines={1} variant="caption">
              {item.host}
            </AppText>

            <View style={styles.resultChip}>
              <AppText colorToken="brandPrimaryStrong" variant="micro">
                {item.tagLabel}
              </AppText>
            </View>

            <View style={styles.resultMetricRow}>
              <Metric label="Event Date" value={item.eventDate} />
              <Metric label="Register by" value={item.registerBy} />
              <Metric align="right" label={item.valueLabel} value={item.value} />
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function Metric({
  label,
  value,
  align = 'left',
}: {
  readonly label: string;
  readonly value: string;
  readonly align?: 'left' | 'right';
}) {
  return (
    <View style={[styles.metricBlock, align === 'right' ? styles.metricRight : null]}>
      <AppText colorToken="textMuted" variant="caption">
        {label}
      </AppText>
      <AppText style={styles.metricValue} variant="bodyStrong">
        {value}
      </AppText>
    </View>
  );
}

function FooterCopy() {
  return (
    <View style={styles.footerCopy}>
      <AppText style={styles.footerTitle} variant="displayH2">
        Global Opportunities.
      </AppText>
      <AppText style={styles.footerTitle} variant="displayH2">
        Powered by Skills.
      </AppText>
      <AppText colorToken="textSecondary" style={styles.footerMeta} variant="caption">
        Made with love in India
      </AppText>
    </View>
  );
}

function heroTone(tone: SearchResultEntity['tone']) {
  switch (tone) {
    case 'amber':
      return styles.heroAmber;
    case 'teal':
      return styles.heroTeal;
    case 'indigo':
      return styles.heroIndigo;
    default:
      return styles.heroViolet;
  }
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    marginTop: lightTheme.spacing[12],
    padding: lightTheme.spacing[20],
  },
  footerCopy: {
    marginTop: lightTheme.spacing[40],
  },
  footerMeta: {
    marginTop: lightTheme.spacing[12],
  },
  footerTitle: {
    fontSize: lightTheme.typography.sectionHeading.fontSize,
    lineHeight: lightTheme.typography.sectionHeading.lineHeight,
  },
  heroAmber: {
    backgroundColor: '#3E2A09',
  },
  heroIndigo: {
    backgroundColor: '#181F49',
  },
  heroTeal: {
    backgroundColor: '#0E3A44',
  },
  heroViolet: {
    backgroundColor: '#2E1B57',
  },
  keyboardContainer: {
    flex: 1,
  },
  metricBlock: {
    flex: 1,
  },
  metricRight: {
    alignItems: 'flex-end',
  },
  metricValue: {
    marginTop: lightTheme.spacing[2],
  },
  queryArrow: {
    fontSize: lightTheme.typography.label.fontSize,
  },
  queryLabel: {
    fontSize: 32 / 2,
    lineHeight: 22,
  },
  queryList: {
    marginTop: lightTheme.spacing[8],
  },
  queryRow: {
    alignItems: 'center',
    borderBottomColor: lightTheme.colors.divider,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingVertical: lightTheme.spacing[8],
  },
  resultBookmark: {
    alignItems: 'center',
    borderColor: lightTheme.colors.surfaceBorder,
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    marginLeft: lightTheme.spacing[8],
    width: 24,
  },
  resultChip: {
    alignSelf: 'flex-start',
    backgroundColor: lightTheme.colors.brandPrimarySoft,
    borderRadius: lightTheme.radius.pill,
    marginTop: lightTheme.spacing[6],
    paddingHorizontal: lightTheme.spacing[8],
    paddingVertical: lightTheme.spacing[2],
  },
  resultHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultList: {
    marginTop: lightTheme.spacing[8],
  },
  resultMeta: {
    flex: 1,
  },
  resultMetricRow: {
    flexDirection: 'row',
    marginTop: lightTheme.spacing[10],
  },
  resultRow: {
    borderBottomColor: lightTheme.colors.divider,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: lightTheme.spacing[12],
  },
  resultThumb: {
    alignItems: 'center',
    borderRadius: lightTheme.radius.sm,
    height: 72,
    justifyContent: 'center',
    marginRight: lightTheme.spacing[12],
    paddingHorizontal: lightTheme.spacing[8],
    width: 126,
  },
  resultThumbTitle: {
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  resultTitle: {
    flex: 1,
    fontSize: 34 / 2,
    lineHeight: 22,
  },
  safeArea: {
    backgroundColor: lightTheme.colors.backgroundPrimary,
    flex: 1,
  },
  scrollContent: {
    minHeight: '100%',
    paddingBottom: lightTheme.spacing[32],
    paddingHorizontal: appDimensions.screenHorizontalPadding,
    paddingTop: lightTheme.spacing[8],
  },
  scrollView: {
    flex: 1,
  },
  secondaryRouteLink: {
    alignSelf: 'flex-start',
    marginTop: lightTheme.spacing[16],
  },
  sectionTitle: {
    fontSize: lightTheme.typography.sectionHeading.fontSize,
    lineHeight: lightTheme.typography.sectionHeading.lineHeight,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: lightTheme.spacing[24],
  },
});
