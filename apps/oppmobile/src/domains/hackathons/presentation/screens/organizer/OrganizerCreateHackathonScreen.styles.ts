import { StyleSheet } from 'react-native';

import { lightTheme } from '../../../../../shared/theme';

export const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F5F5F7',
    flex: 1,
  },

  // ── Top bar ──────────────────────────────────────────────────────────────
  topBar: {
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    borderBottomColor: '#E8E4EC',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    marginRight: 12,
    width: 36,
  },
  backChevron: {
    borderBottomColor: '#1C1340',
    borderBottomWidth: 2,
    borderLeftColor: '#1C1340',
    borderLeftWidth: 2,
    height: 10,
    transform: [{ rotate: '45deg' }],
    width: 10,
  },
  topBarTitle: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },

  // ── Scroll content ────────────────────────────────────────────────────────
  scrollContent: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  sectionLabel: {
    color: '#7C737E',
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    lineHeight: 16,
    marginBottom: 8,
    marginTop: 24,
    textTransform: 'uppercase',
  },

  // ── Banner ────────────────────────────────────────────────────────────────
  bannerContainer: {
    borderRadius: 12,
    height: 160,
    marginBottom: 4,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  bannerImage: {
    height: '100%',
    width: '100%',
  },
  bannerOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  changeBannerBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  changeBannerText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },

  // ── Preview card ──────────────────────────────────────────────────────────
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#100013',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  previewCardBanner: {
    height: 80,
    width: '100%',
  },
  previewCardBody: {
    padding: 12,
  },
  previewBadgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  previewBadge: {
    backgroundColor: '#F3F0F7',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  previewBadgeText: {
    color: '#7C737E',
    fontFamily: 'Urbanist',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  previewTitle: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 2,
  },
  previewSubtitle: {
    color: '#9CA3AF',
    fontFamily: 'Urbanist',
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 14,
    marginBottom: 8,
  },
  previewFooterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  previewAvatarStack: {
    flexDirection: 'row',
    marginRight: 2,
  },
  previewAvatar: {
    backgroundColor: '#E0DCE5',
    borderColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1.5,
    height: 16,
    marginRight: -5,
    width: 16,
  },
  previewMeta: {
    color: '#9CA3AF',
    fontFamily: 'Urbanist',
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 14,
  },
  previewPill: {
    backgroundColor: '#F3F0F7',
    borderRadius: lightTheme.radius.pill,
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  previewPillText: {
    color: '#7C737E',
    fontFamily: 'Urbanist',
    fontSize: 10,
    fontWeight: '600',
  },

  // ── Type selector ─────────────────────────────────────────────────────────
  typeSelector: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E0DCE5',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    height: 48,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  typeSelectorText: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  chevronDown: {
    borderColor: '#7C737E',
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    height: 8,
    transform: [{ rotate: '45deg' }],
    width: 8,
  },

  // ── Hackathon name input ──────────────────────────────────────────────────
  eventNameInput: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    paddingVertical: 8,
  },
  eventNamePlaceholder: {
    color: '#D1CCd7',
  },

  // ── Form cards ────────────────────────────────────────────────────────────
  formCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E8E4EC',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  formCardFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  formCardLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderBottomWidth: 0,
  },
  formCardIconWrap: {
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  formCardContent: {
    flex: 1,
  },
  formCardTitle: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  formCardSubtitle: {
    color: '#9CA3AF',
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    marginTop: 1,
  },
  formCardChevron: {
    borderBottomColor: '#C4BEC9',
    borderBottomWidth: 1.5,
    borderRightColor: '#C4BEC9',
    borderRightWidth: 1.5,
    height: 8,
    transform: [{ rotate: '-45deg' }],
    width: 8,
  },

  // ── Icon shapes ───────────────────────────────────────────────────────────
  iconCircle: {
    borderColor: '#7C737E',
    borderRadius: 8,
    borderWidth: 1.5,
    height: 16,
    width: 16,
  },
  iconPin: {
    alignItems: 'center',
  },
  iconPinHead: {
    backgroundColor: '#7C737E',
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  iconPinTail: {
    backgroundColor: '#7C737E',
    borderRadius: 1,
    height: 5,
    width: 2,
  },
  iconLines: {
    gap: 2,
    justifyContent: 'center',
  },
  iconLine: {
    backgroundColor: '#7C737E',
    borderRadius: 1,
    height: 1.5,
  },
  iconPerson: {
    alignItems: 'center',
    gap: 1,
  },
  iconPersonHead: {
    backgroundColor: '#7C737E',
    borderRadius: 5,
    height: 8,
    width: 8,
  },
  iconPersonBody: {
    backgroundColor: '#7C737E',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    height: 6,
    width: 12,
  },
  iconBuilding: {
    gap: 1,
    justifyContent: 'flex-end',
  },
  iconBuildingTop: {
    backgroundColor: '#7C737E',
    height: 10,
    width: 14,
  },
  iconBuildingBase: {
    backgroundColor: '#7C737E',
    height: 3,
    width: 16,
  },
  iconTag: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTagShape: {
    borderColor: '#7C737E',
    borderRadius: 2,
    borderWidth: 1.5,
    height: 12,
    width: 12,
  },

  // ── Ticketing row ─────────────────────────────────────────────────────────
  ticketingRow: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  ticketingLeft: {
    flex: 1,
    gap: 2,
  },
  ticketingTitle: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  ticketingSubtitle: {
    color: '#9CA3AF',
    fontFamily: 'Urbanist',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  toggleTrack: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    height: 22,
    justifyContent: 'center',
    paddingHorizontal: 2,
    width: 42,
  },
  toggleThumb: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    elevation: 2,
    height: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    width: 18,
  },

  // ── Submit button ─────────────────────────────────────────────────────────
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#1C1340',
    borderRadius: lightTheme.radius.pill,
    height: 52,
    justifyContent: 'center',
    marginTop: 32,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
});
