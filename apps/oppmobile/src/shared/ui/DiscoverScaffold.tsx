import type { PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { appDimensions } from '../constants/dimensions';
import { lightTheme } from '../theme';
import type { DiscoverCategoryItem, DiscoverCardTone, DiscoverVariantItem } from '../types/discover';
import { AppText } from './AppText';
import { FooterSignatureBlock } from './FooterSignatureBlock';
import { SearchInput } from './SearchInput';

interface DiscoverScaffoldProps extends PropsWithChildren {
  readonly title: string;
  readonly categories: readonly DiscoverCategoryItem[];
  readonly activeCategoryId: DiscoverCategoryItem['id'];
  readonly onSelectCategory: (categoryId: DiscoverCategoryItem['id']) => void;
  readonly onSearchPress: () => void;
  readonly subtitle?: string;
}

interface DiscoverVariantListProps {
  readonly items: readonly DiscoverVariantItem[];
  readonly bookmarkedIds: readonly string[];
  readonly onToggleBookmark: (itemId: string) => void;
  readonly onOpenItem?: (itemId: string) => void;
  readonly emptyLabel?: string;
  readonly loading?: boolean;
  readonly errorLabel?: string | undefined;
  readonly onRetry?: () => void;
}

export function DiscoverScaffold({
  title,
  categories,
  activeCategoryId,
  onSelectCategory,
  onSearchPress,
  subtitle,
  children,
}: DiscoverScaffoldProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.contentArea}>
        <Pressable hitSlop={8} onPress={onSearchPress} style={styles.searchPressable}>
          <View pointerEvents="none">
            <SearchInput editable={false} onChangeText={() => undefined} value="" />
          </View>
        </Pressable>

        <ScrollView
          contentContainerStyle={styles.categoryStripContent}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryStrip}
        >
          {categories.map((category) => {
            const selected = category.id === activeCategoryId;

            return (
              <Pressable
                key={category.id}
                onPress={() => onSelectCategory(category.id)}
                style={[styles.categoryCard, selected ? styles.categoryCardSelected : null]}
              >
                <View style={[styles.categoryGlyph, selected ? styles.categoryGlyphSelected : null]} />
                <AppText
                  colorToken={selected ? 'brandPrimaryStrong' : 'textSecondary'}
                  style={styles.categoryLabel}
                  variant="caption"
                >
                  {category.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.titleBlock}>
          <AppText style={styles.title} variant="sectionHeading">
            {title}
          </AppText>
          {subtitle ? (
            <AppText colorToken="textSecondary" style={styles.subtitle} variant="caption">
              {subtitle}
            </AppText>
          ) : null}
        </View>

        {children}

        <FooterSignatureBlock compact />
      </View>
    </View>
  );
}

export function DiscoverVariantList({
  items,
  bookmarkedIds,
  onToggleBookmark,
  onOpenItem,
  emptyLabel = 'No discover records available for this category yet.',
  loading = false,
  errorLabel,
  onRetry,
}: DiscoverVariantListProps) {
  if (loading) {
    return (
      <View style={styles.listStack}>
        <DiscoverListSkeletonCard />
        <DiscoverListSkeletonCard />
      </View>
    );
  }

  if (errorLabel) {
    return (
      <View style={styles.emptyState}>
        <AppText colorToken="textSecondary" variant="caption">
          {errorLabel}
        </AppText>
        {onRetry ? (
          <Pressable onPress={onRetry} style={styles.retryButton}>
            <AppText colorToken="brandPrimaryStrong" variant="caption">
              Retry
            </AppText>
          </Pressable>
        ) : null}
      </View>
    );
  }

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
    <View style={styles.listStack}>
      {items.map((item) => {
        const bookmarked = bookmarkedIds.includes(item.id);

        if (item.kind === 'community') {
          return (
            <View key={item.id} style={styles.communityCard}>
              <View style={styles.communityHead}>
                <View style={styles.monitorGlyph} />
                <View style={styles.locationPill}>
                  <AppText colorToken="brandPrimaryStrong" variant="micro">
                    {item.location}
                  </AppText>
                </View>
              </View>

              <AppText colorToken="textMuted" variant="caption">
                {item.domain}
              </AppText>
              <AppText style={styles.communityTitle} variant="title">
                {item.title}
              </AppText>

              <View style={styles.metricRow}>
                <Metric label="Members" value={`${item.members}`} />
                <Metric label="Register by" value={item.registerBy} />
              </View>

              <Pressable onPress={() => onOpenItem?.(item.id)} style={styles.exploreButton}>
                <AppText colorToken="brandPrimaryStrong" variant="caption">
                  Explore Now
                </AppText>
              </Pressable>
            </View>
          );
        }

        if (item.kind === 'event-feature') {
          return (
            <Pressable key={item.id} onPress={() => onOpenItem?.(item.id)} style={styles.featureCard}>
              <View style={[styles.featureHero, heroTone(item.tone)]}>
                <Pressable
                  accessibilityLabel={`Toggle bookmark for ${item.title}`}
                  onPress={() => onToggleBookmark(item.id)}
                  style={styles.bookmarkButton}
                >
                  <AppText colorToken={bookmarked ? 'textInverse' : 'textPrimary'} variant="micro">
                    {bookmarked ? 'Saved' : 'Save'}
                  </AppText>
                </Pressable>
              </View>

              <View style={styles.featureMeta}>
                <View style={styles.featureTopRow}>
                  <AppText colorToken="textMuted" variant="caption">
                    {item.timing}
                  </AppText>
                  <AppText colorToken="brandPrimaryStrong" variant="caption">
                    {item.venue}
                  </AppText>
                </View>

                <AppText style={styles.featureTitle} variant="title">
                  {item.title}
                </AppText>

                <View style={styles.metricRow}>
                  <Metric label="Attendees" value={`${item.attendees}`} />
                  <Metric label="Register by" value={item.registerBy} />
                  <Metric align="right" label="Entry Fee" value={item.entryFee} />
                </View>
              </View>
            </Pressable>
          );
        }

        if (item.kind === 'compact') {
          return (
            <Pressable key={item.id} onPress={() => onOpenItem?.(item.id)} style={styles.compactCard}>
              <View style={[styles.compactThumb, heroTone(item.tone)]} />

              <View style={styles.compactMeta}>
                <View style={styles.compactTop}>
                  <AppText numberOfLines={2} style={styles.compactTitle} variant="title">
                    {item.title}
                  </AppText>
                  <Pressable
                    accessibilityLabel={`Toggle bookmark for ${item.title}`}
                    onPress={() => onToggleBookmark(item.id)}
                    style={styles.compactBookmark}
                  >
                    <AppText colorToken="brandPrimaryStrong" variant="caption">
                      {bookmarked ? 'On' : 'Off'}
                    </AppText>
                  </Pressable>
                </View>

                <AppText colorToken="textMuted" numberOfLines={1} variant="caption">
                  {item.host}
                </AppText>

                <View style={styles.kindChip}>
                  <AppText colorToken="brandPrimaryStrong" variant="micro">
                    {item.tagLabel}
                  </AppText>
                </View>

                <View style={styles.metricRow}>
                  <Metric label="Event Date" value={item.eventDate} />
                  <Metric label="Register by" value={item.registerBy} />
                  <Metric align="right" label={item.valueLabel} value={item.value} />
                </View>
              </View>
            </Pressable>
          );
        }

        return (
          <Pressable key={item.id} onPress={() => onOpenItem?.(item.id)} style={styles.opportunityCard}>
            <View style={[styles.opportunityHero, heroTone(item.tone)]}>
              <Pressable
                accessibilityLabel={`Toggle bookmark for ${item.title}`}
                onPress={() => onToggleBookmark(item.id)}
                style={styles.bookmarkButton}
              >
                <AppText colorToken={bookmarked ? 'textInverse' : 'textPrimary'} variant="micro">
                  {bookmarked ? 'Saved' : 'Save'}
                </AppText>
              </Pressable>
            </View>

            <View style={styles.opportunityMeta}>
              <AppText colorToken="brandPrimaryStrong" style={styles.modeLabel} variant="caption">
                {item.modeLabel}
              </AppText>

              <AppText style={styles.opportunityTitle} variant="title">
                {item.title}
              </AppText>
              <AppText colorToken="textMuted" variant="caption">
                {item.host}
              </AppText>

              <View style={styles.metricRow}>
                <Metric label="Register by" value={item.registerBy} />
                <Metric align="right" label={item.valueLabel} value={item.value} />
              </View>
            </View>
          </Pressable>
        );
      })}
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

function heroTone(tone: DiscoverCardTone) {
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

function DiscoverListSkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonHero} />
      <View style={styles.skeletonBody}>
        <View style={[styles.skeletonBar, styles.skeletonWide]} />
        <View style={[styles.skeletonBar, styles.skeletonMedium]} />
        <View style={[styles.skeletonBar, styles.skeletonShort]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  categoryCard: {
    alignItems: 'center',
    backgroundColor: lightTheme.colors.backgroundSecondary,
    borderColor: lightTheme.colors.brandPrimarySoft,
    borderRadius: lightTheme.radius.sm,
    borderWidth: 1,
    minWidth: 84,
    paddingHorizontal: lightTheme.spacing[8],
    paddingVertical: lightTheme.spacing[8],
  },
  categoryCardSelected: {
    borderColor: lightTheme.colors.brandPrimary,
    borderWidth: 1.5,
  },
  categoryGlyph: {
    backgroundColor: lightTheme.colors.surfaceMuted,
    borderRadius: lightTheme.radius.pill,
    height: 26,
    marginBottom: lightTheme.spacing[4],
    width: 40,
  },
  categoryGlyphSelected: {
    backgroundColor: lightTheme.colors.brandPrimarySoft,
  },
  categoryLabel: {
    textAlign: 'center',
  },
  categoryStrip: {
    marginTop: lightTheme.spacing[8],
  },
  categoryStripContent: {
    columnGap: lightTheme.spacing[8],
    paddingRight: lightTheme.spacing[8],
  },
  compactBookmark: {
    alignItems: 'center',
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    marginLeft: lightTheme.spacing[8],
    width: 40,
  },
  compactCard: {
    borderBottomColor: lightTheme.colors.divider,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: lightTheme.spacing[12],
  },
  compactMeta: {
    flex: 1,
  },
  compactThumb: {
    borderRadius: lightTheme.radius.sm,
    height: 72,
    marginRight: lightTheme.spacing[12],
    width: 126,
  },
  compactTitle: {
    fontSize: 34 / 2,
    lineHeight: 22,
    paddingRight: lightTheme.spacing[4],
  },
  compactTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  communityCard: {
    backgroundColor: lightTheme.colors.surfacePrimary,
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.md,
    borderWidth: 1,
    marginBottom: lightTheme.spacing[12],
    padding: lightTheme.spacing[12],
  },
  communityHead: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: lightTheme.spacing[8],
  },
  communityTitle: {
    marginTop: lightTheme.spacing[4],
  },
  contentArea: {
    flex: 1,
    paddingBottom: lightTheme.spacing[28],
    paddingHorizontal: appDimensions.screenHorizontalPadding,
    paddingTop: lightTheme.spacing[8],
  },
  emptyState: {
    alignItems: 'center',
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    padding: lightTheme.spacing[20],
  },
  eventRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  exploreButton: {
    alignItems: 'center',
    borderColor: lightTheme.colors.focusRing,
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: lightTheme.spacing[12],
    minHeight: 44,
    paddingHorizontal: lightTheme.spacing[16],
  },
  featureCard: {
    backgroundColor: lightTheme.colors.surfacePrimary,
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.md,
    borderWidth: 1,
    marginBottom: lightTheme.spacing[16],
    overflow: 'hidden',
  },
  featureHero: {
    height: 160,
    justifyContent: 'flex-start',
    paddingHorizontal: lightTheme.spacing[12],
    paddingTop: lightTheme.spacing[12],
  },
  featureMeta: {
    padding: lightTheme.spacing[12],
  },
  featureTitle: {
    marginTop: lightTheme.spacing[8],
  },
  featureTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  kindChip: {
    alignSelf: 'flex-start',
    backgroundColor: lightTheme.colors.brandPrimarySoft,
    borderRadius: lightTheme.radius.pill,
    marginTop: lightTheme.spacing[8],
    paddingHorizontal: lightTheme.spacing[8],
    paddingVertical: lightTheme.spacing[2],
  },
  listStack: {
    marginTop: lightTheme.spacing[8],
  },
  locationPill: {
    backgroundColor: lightTheme.colors.brandPrimarySoft,
    borderRadius: lightTheme.radius.pill,
    maxWidth: 130,
    paddingHorizontal: lightTheme.spacing[10],
    paddingVertical: lightTheme.spacing[4],
  },
  metricBlock: {
    flex: 1,
  },
  metricRight: {
    alignItems: 'flex-end',
  },
  metricRow: {
    columnGap: lightTheme.spacing[8],
    flexDirection: 'row',
    marginTop: lightTheme.spacing[10],
  },
  metricValue: {
    marginTop: lightTheme.spacing[2],
  },
  modeLabel: {
    marginBottom: lightTheme.spacing[8],
  },
  monitorGlyph: {
    backgroundColor: lightTheme.colors.surfaceMuted,
    borderColor: lightTheme.colors.danger,
    borderRadius: lightTheme.radius.xs,
    borderWidth: 1,
    height: 32,
    width: 32,
  },
  opportunityCard: {
    backgroundColor: lightTheme.colors.surfacePrimary,
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.md,
    borderWidth: 1,
    marginBottom: lightTheme.spacing[16],
    overflow: 'hidden',
  },
  opportunityHero: {
    height: 200,
    justifyContent: 'flex-start',
    paddingHorizontal: lightTheme.spacing[12],
    paddingTop: lightTheme.spacing[12],
  },
  opportunityMeta: {
    padding: lightTheme.spacing[12],
  },
  opportunityTitle: {
    marginBottom: lightTheme.spacing[4],
  },
  bookmarkButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    backgroundColor: lightTheme.colors.surfacePrimary,
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  retryButton: {
    alignItems: 'center',
    borderColor: lightTheme.colors.focusRing,
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: lightTheme.spacing[12],
    minHeight: 40,
    paddingHorizontal: lightTheme.spacing[16],
  },
  skeletonBar: {
    backgroundColor: lightTheme.colors.backgroundSecondary,
    borderRadius: lightTheme.radius.xs,
    height: 10,
    marginTop: lightTheme.spacing[8],
  },
  skeletonBody: {
    padding: lightTheme.spacing[12],
  },
  skeletonCard: {
    backgroundColor: lightTheme.colors.surfacePrimary,
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.md,
    borderWidth: 1,
    marginBottom: lightTheme.spacing[16],
    overflow: 'hidden',
  },
  skeletonHero: {
    backgroundColor: lightTheme.colors.surfaceMuted,
    height: 132,
    width: '100%',
  },
  skeletonMedium: {
    width: '70%',
  },
  skeletonShort: {
    width: '44%',
  },
  skeletonWide: {
    width: '88%',
  },
  screen: {
    backgroundColor: lightTheme.colors.backgroundPrimary,
    flex: 1,
  },
  searchPressable: {
    minHeight: 48,
  },
  subtitle: {
    marginTop: lightTheme.spacing[4],
  },
  title: {
    fontSize: lightTheme.typography.sectionHeading.fontSize,
  },
  titleBlock: {
    marginTop: lightTheme.spacing[20],
  },
});