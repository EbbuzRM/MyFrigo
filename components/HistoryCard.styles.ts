import { StyleSheet } from 'react-native';
import { scaleFont } from '@/utils/scaleFont';

/**
 * Border radius constants
 */
const BORDER_RADIUS = {
  card: 16,
  icon: 12,
  image: 8,
  badge: 6,
};

/**
 * Spacing constants
 */
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
};

/**
 * Shadow constants
 */
const SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 2,
};

/**
 * Status indicator width
 */
const STATUS_INDICATOR_WIDTH = 5;

/**
 * HistoryCard styles factory
 * @param isDarkMode - Current theme mode
 */
export const getHistoryCardStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    card: {
      borderRadius: BORDER_RADIUS.card,
      marginBottom: SPACING.lg,
      borderWidth: 1,
      backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
      ...SHADOW,
      flexDirection: 'row',
      overflow: 'hidden',
    },
    statusIndicator: {
      width: STATUS_INDICATOR_WIDTH,
    },
    content: {
      flex: 1,
      padding: SPACING.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.lg,
    },
    productInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 1,
      marginRight: SPACING.xs,
    },
    textContainer: {
      flex: 1,
      gap: SPACING.xs,
    },
    productName: {
      fontSize: scaleFont(17),
      fontFamily: 'Inter-SemiBold',
      color: isDarkMode ? '#c9d1d9' : '#1e293b',
    },
    brandName: {
      fontSize: scaleFont(14),
      fontFamily: 'Inter-Regular',
      color: isDarkMode ? '#8b949e' : '#64748B',
    },
    categoryBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: SPACING.sm,
      paddingVertical: 4,
      borderRadius: BORDER_RADIUS.badge,
    },
    categoryName: {
      fontSize: scaleFont(14),
      fontFamily: 'Inter-Medium',
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    restoreButton: {
      padding: SPACING.sm,
      alignSelf: 'flex-end',
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
    },
    restoreText: {
      fontFamily: 'Inter-Medium',
      fontSize: scaleFont(14),
    },
    details: {
      gap: SPACING.md,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.sm,
    },
    detailText: {
      fontSize: scaleFont(14),
      fontFamily: 'Inter-Regular',
      color: isDarkMode ? '#8b949e' : '#64748B',
    },
    dateText: {
      fontSize: scaleFont(14),
      fontFamily: 'Inter-Medium',
      color: isDarkMode ? '#c9d1d9' : '#334155',
    },
  });
