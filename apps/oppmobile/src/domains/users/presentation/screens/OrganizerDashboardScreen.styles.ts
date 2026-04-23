import { StyleSheet } from 'react-native';

import { appDimensions } from '../../../../shared/constants/dimensions';
import { lightTheme } from '../../../../shared/theme';

export const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    borderColor: '#E8E6E8',
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  backButtonShaft: {
    backgroundColor: '#584D5A',
    borderRadius: 2,
    height: 2,
    width: 14,
  },
  backButtonTipPrimary: {
    backgroundColor: '#584D5A',
    borderRadius: 2,
    height: 2,
    marginBottom: -6,
    marginLeft: -8,
    transform: [{ rotate: '-45deg' }],
    width: 8,
  },
  backButtonTipSecondary: {
    backgroundColor: '#584D5A',
    borderRadius: 2,
    height: 2,
    marginLeft: -8,
    marginTop: -6,
    transform: [{ rotate: '45deg' }],
    width: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEE8FF',
    borderRadius: lightTheme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeLabel: {
    color: '#42007A',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E6E8',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  cardDescription: {
    color: '#6F6571',
    marginTop: 8,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardIndex: {
    color: '#8A7D95',
  },
  cardList: {
    gap: 14,
  },
  cardTitle: {
    color: '#100013',
    marginTop: 14,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  headerText: {
    flex: 1,
  },
  menuButton: {
    alignItems: 'center',
    borderColor: '#E8E6E8',
    borderRadius: lightTheme.radius.pill,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  menuLine: {
    backgroundColor: '#584D5A',
    borderRadius: 2,
    height: 2,
    marginVertical: 2,
    width: 16,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8E6E8',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minWidth: 98,
    padding: 14,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 18,
  },
  metricLabel: {
    color: '#7A6D80',
  },
  metricValue: {
    color: '#100013',
    marginTop: 10,
  },
  screen: {
    backgroundColor: lightTheme.colors.backgroundPrimary,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
    paddingHorizontal: appDimensions.screenHorizontalPadding,
  },
  sectionBody: {
    color: '#584D5A',
    marginTop: 10,
  },
  sectionCard: {
    backgroundColor: '#F5F1FB',
    borderRadius: 24,
    marginBottom: 18,
    overflow: 'hidden',
    padding: 22,
  },
  sectionTitle: {
    color: '#100013',
    marginTop: 16,
  },
  subtitle: {
    color: '#7A6D80',
    marginTop: 6,
  },
  title: {
    color: '#100013',
  },
});
