import { StyleSheet } from 'react-native';

import { lightTheme } from '../../../../shared/theme';

export const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F5F5F7',
    flex: 1,
  },

  topBar: {
    backgroundColor: '#F5F5F7',
    gap: 10,
    paddingBottom: 14,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  festivalsTitle: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  topBarRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E0DCE5',
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    height: 44,
    paddingHorizontal: 14,
  },
  searchSymbolWrap: {
    alignItems: 'center',
    height: 20,
    justifyContent: 'center',
    marginRight: 8,
    position: 'relative',
    width: 20,
  },
  searchSymbolCircle: {
    borderColor: '#9CA3AF',
    borderRadius: 8,
    borderWidth: 1.5,
    height: 14,
    width: 14,
  },
  searchSymbolHandle: {
    backgroundColor: '#9CA3AF',
    borderRadius: 1,
    bottom: 1,
    height: 1.5,
    position: 'absolute',
    right: 0,
    transform: [{ rotate: '45deg' }],
    width: 6,
  },
  searchInput: {
    color: '#100013',
    flex: 1,
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    paddingVertical: 0,
  },
  hostButton: {
    alignItems: 'center',
    backgroundColor: '#1C1340',
    borderRadius: lightTheme.radius.pill,
    flexDirection: 'row',
    gap: 8,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  plusCircleWrap: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  plusH: {
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    height: 1.5,
    position: 'absolute',
    width: 10,
  },
  plusV: {
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    height: 10,
    position: 'absolute',
    width: 1.5,
  },
  hostLabel: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },

  tableScrollOuter: {
    flex: 1,
  },

  tableHeader: {
    alignItems: 'stretch',
    backgroundColor: '#1C1340',
    flexDirection: 'row',
  },
  th: {
    alignItems: 'center',
    borderRightColor: 'rgba(255,255,255,0.15)',
    borderRightWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  thLast: {
    borderRightWidth: 0,
  },
  thText: {
    color: '#FFFFFF',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    textAlign: 'center',
  },
  thOpportunity: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },

  row: {
    alignItems: 'stretch',
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E8E4EC',
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  td: {
    alignItems: 'center',
    borderRightColor: '#E8E4EC',
    borderRightWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 14,
  },
  tdLast: {
    borderRightWidth: 0,
  },

  serialText: {
    color: '#7C737E',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'center',
  },

  opportunityCell: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  thumbnail: {
    borderRadius: 8,
    height: 72,
    width: 110,
  },
  opportunityInfo: {
    flex: 1,
    gap: 6,
  },
  opportunityTitle: {
    color: '#100013',
    fontFamily: 'Aeonik Pro',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  festivalBadge: {
    color: '#9CA3AF',
    fontFamily: 'Urbanist',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    lineHeight: 14,
  },

  candidatesText: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
  },

  statusChip: {
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusChipText: {
    color: '#0F766E',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },

  dateBlock: {
    alignItems: 'center',
    gap: 3,
  },
  dateText: {
    color: '#100013',
    fontFamily: 'Urbanist',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center',
  },
  timeText: {
    color: '#9CA3AF',
    fontFamily: 'Urbanist',
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 14,
    textAlign: 'center',
  },

  registrationsCell: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  toggleTrack: {
    backgroundColor: '#FBCFE8',
    borderRadius: 12,
    height: 22,
    justifyContent: 'center',
    paddingHorizontal: 2,
    width: 42,
  },
  toggleThumb: {
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
  closedText: {
    color: '#EF4444',
    fontFamily: 'Urbanist',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },

  tableScrollContent: {
    paddingBottom: 120,
  },
});
