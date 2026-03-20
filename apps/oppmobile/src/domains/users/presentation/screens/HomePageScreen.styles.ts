import { StyleSheet } from 'react-native';

import { appDimensions } from '../../../../shared/constants/dimensions';
import { lightTheme } from '../../../../shared/theme';

export const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: lightTheme.colors.brandPrimaryStrong,
    borderRadius: lightTheme.radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  cardStack: {
    gap: lightTheme.spacing[12],
  },
  categoryCard: {
    alignItems: 'center',
    backgroundColor: lightTheme.colors.backgroundSecondary,
    borderColor: lightTheme.colors.brandPrimarySoft,
    borderRadius: lightTheme.radius.sm,
    borderWidth: 1,
    minHeight: 72,
    paddingHorizontal: lightTheme.spacing[12],
    paddingVertical: lightTheme.spacing[8],
    width: '48%',
  },
  categoryCardActive: {
    borderColor: lightTheme.colors.brandPrimary,
    borderBottomWidth: 3,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: lightTheme.spacing[8],
    marginTop: lightTheme.spacing[12],
  },
  categoryIcon: {
    backgroundColor: lightTheme.colors.brandPrimarySoft,
    borderRadius: lightTheme.radius.sm,
    height: 26,
    marginBottom: lightTheme.spacing[8],
    width: 42,
  },
  categoryIconActive: {
    backgroundColor: '#D3C0FD',
  },
  categoryText: {
    textAlign: 'center',
  },
  communityButton: {
    alignItems: 'center',
    borderColor: lightTheme.colors.focusRing,
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    marginTop: lightTheme.spacing[10],
    paddingHorizontal: lightTheme.spacing[12],
    paddingVertical: lightTheme.spacing[8],
  },
  communityCard: {
    backgroundColor: lightTheme.colors.surfacePrimary,
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.md,
    borderWidth: 1,
    padding: lightTheme.spacing[12],
    width: '48%',
  },
  communityGlyph: {
    backgroundColor: '#F8D8D4',
    borderRadius: lightTheme.radius.sm,
    height: 20,
    width: 24,
  },
  communityHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: lightTheme.spacing[10],
  },
  communityMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: lightTheme.spacing[8],
  },
  communityName: {
    fontSize: 18,
    lineHeight: 24,
    marginTop: lightTheme.spacing[4],
  },
  communityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: lightTheme.spacing[10],
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: lightTheme.colors.surfacePrimary,
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 88,
    paddingHorizontal: lightTheme.spacing[16],
  },
  emptyText: {
    textAlign: 'center',
  },
  eventCard: {
    backgroundColor: lightTheme.colors.surfacePrimary,
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  eventHero: {
    backgroundColor: '#8FB5E0',
    height: 150,
    justifyContent: 'flex-end',
    padding: lightTheme.spacing[10],
  },
  eventMeta: {
    padding: lightTheme.spacing[12],
  },
  eventTitle: {
    marginTop: lightTheme.spacing[6],
  },
  eventVenuePill: {
    alignSelf: 'flex-end',
    backgroundColor: '#EEE8FF',
    borderRadius: lightTheme.radius.pill,
    paddingHorizontal: lightTheme.spacing[10],
    paddingVertical: lightTheme.spacing[6],
  },
  heroSection: {
    gap: lightTheme.spacing[12],
  },
  heroTitle: {
    color: lightTheme.colors.brandPrimaryStrong,
  },
  highlightCard: {
    borderRadius: lightTheme.radius.md,
    padding: lightTheme.spacing[16],
  },
  highlightIndigo: {
    backgroundColor: '#DADAFD',
  },
  highlightRose: {
    backgroundColor: '#F0C5E7',
  },
  highlightTitle: {
    marginBottom: lightTheme.spacing[8],
  },
  kindChip: {
    alignSelf: 'flex-start',
    backgroundColor: lightTheme.colors.brandPrimarySoft,
    borderRadius: lightTheme.radius.pill,
    marginTop: lightTheme.spacing[8],
    paddingHorizontal: lightTheme.spacing[8],
    paddingVertical: lightTheme.spacing[4],
  },
  listContent: {
    paddingBottom: lightTheme.spacing[32],
    paddingHorizontal: appDimensions.screenHorizontalPadding,
  },
  locationPill: {
    backgroundColor: '#EEE8FF',
    borderRadius: lightTheme.radius.pill,
    maxWidth: '70%',
    paddingHorizontal: lightTheme.spacing[8],
    paddingVertical: lightTheme.spacing[4],
  },
  metricAlignRight: {
    alignItems: 'flex-end',
  },
  metricBlock: {
    flex: 1,
    gap: 2,
  },
  metricRow: {
    borderTopColor: lightTheme.colors.divider,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: lightTheme.spacing[8],
    marginTop: lightTheme.spacing[10],
    paddingTop: lightTheme.spacing[10],
  },
  metricValue: {
    marginTop: 2,
  },
  miniSectionTitle: {
    fontSize: 20,
    lineHeight: 27,
    marginBottom: lightTheme.spacing[8],
    marginTop: lightTheme.spacing[8],
  },
  opportunityCard: {
    backgroundColor: lightTheme.colors.surfacePrimary,
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: lightTheme.spacing[10],
    padding: lightTheme.spacing[10],
  },
  opportunityHost: {
    marginTop: lightTheme.spacing[2],
  },
  opportunityMeta: {
    flex: 1,
  },
  opportunityThumb: {
    backgroundColor: '#2B2638',
    borderRadius: lightTheme.radius.sm,
    height: 82,
    width: 102,
  },
  opportunityTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  partnerChip: {
    alignItems: 'center',
    backgroundColor: lightTheme.colors.surfacePrimary,
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: lightTheme.spacing[12],
    paddingVertical: lightTheme.spacing[8],
  },
  partnerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: lightTheme.spacing[8],
  },
  partnerText: {
    maxWidth: 140,
  },
  profileMeta: {
    flex: 1,
    marginLeft: lightTheme.spacing[10],
  },
  profileRow: {
    alignItems: 'center',
    backgroundColor: lightTheme.colors.surfacePrimary,
    borderColor: lightTheme.colors.divider,
    borderRadius: lightTheme.radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: lightTheme.spacing[10],
    paddingVertical: lightTheme.spacing[8],
  },
  resetChip: {
    backgroundColor: lightTheme.colors.brandPrimarySoft,
    borderRadius: lightTheme.radius.pill,
    paddingHorizontal: lightTheme.spacing[12],
    paddingVertical: lightTheme.spacing[6],
  },
  screen: {
    backgroundColor: lightTheme.colors.backgroundPrimary,
    flex: 1,
  },
  sectionAction: {
    alignItems: 'center',
    borderColor: lightTheme.colors.focusRing,
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: lightTheme.spacing[10],
  },
  sectionBlock: {
    marginTop: lightTheme.spacing[24],
  },
  sectionHead: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: lightTheme.spacing[8],
    justifyContent: 'space-between',
    marginBottom: lightTheme.spacing[12],
  },
  sectionHeadText: {
    flex: 1,
  },
  sectionSkeletonCard: {
    marginTop: lightTheme.spacing[10],
  },
  sectionSubtitle: {
    marginTop: lightTheme.spacing[4],
  },
  sectionTitle: {
    fontSize: 38,
    lineHeight: 45,
  },
  sectionTitleBlock: {
    marginTop: lightTheme.spacing[8],
  },
  skeletonBar: {
    backgroundColor: '#EEEAF8',
    borderRadius: lightTheme.radius.pill,
    height: 12,
  },
  skeletonCard: {
    backgroundColor: '#EEEAF8',
    borderRadius: lightTheme.radius.md,
    height: 72,
  },
  skeletonMedium: {
    width: '56%',
  },
  skeletonTall: {
    height: 124,
  },
  skeletonWide: {
    width: '72%',
  },
  skeletonWrapper: {
    gap: lightTheme.spacing[10],
  },
  trackBadge: {
    alignSelf: 'flex-start',
    backgroundColor: lightTheme.colors.brandPrimary,
    borderRadius: lightTheme.radius.pill,
    marginBottom: lightTheme.spacing[8],
    paddingHorizontal: lightTheme.spacing[8],
    paddingVertical: lightTheme.spacing[4],
  },
  trackCard: {
    backgroundColor: '#F4EEFF',
    borderColor: lightTheme.colors.brandPrimarySoft,
    borderRadius: lightTheme.radius.md,
    borderWidth: 1,
    padding: lightTheme.spacing[16],
  },
  trackTitle: {
    marginBottom: lightTheme.spacing[6],
  },
});
