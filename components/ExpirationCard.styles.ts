import { StyleSheet } from 'react-native';
import { scaleFont } from '@/utils/scaleFont';

/**
 * Theme color types for type safety
 */
interface ThemeColors {
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  cardBackground: string;
  borderColor: string;
}

/**
 * Creates ExpirationCard styles based on theme
 * @param {boolean} isDarkMode - Whether dark mode is enabled
 * @param {ThemeColors} colors - Theme colors object
 * @returns {StyleSheet.NamedStyles} Compiled styles
 */
export const getExpirationCardStyles = (isDarkMode: boolean, colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    content: {
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    productInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 12,
    },
    textContainer: {
      flex: 1,
    },
    productName: {
      fontSize: scaleFont(16),
      fontFamily: 'Inter-SemiBold',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    brandName: {
      fontSize: scaleFont(14),
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    statusText: {
      fontSize: scaleFont(12),
      fontFamily: 'Inter-Medium',
    },
    details: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    detailText: {
      fontSize: scaleFont(14),
      fontFamily: 'Inter-Regular',
      color: colors.textTertiary,
      marginLeft: 6,
    },
  });

/**
 * Default theme colors for ExpirationCard
 */
export const getExpirationCardColors = (isDarkMode: boolean): ThemeColors => ({
  textPrimary: isDarkMode ? '#c9d1d9' : '#1e293b',
  textSecondary: isDarkMode ? '#8b949e' : '#64748B',
  textTertiary: isDarkMode ? '#8b949e' : '#64748B',
  cardBackground: isDarkMode ? '#1e293b' : '#ffffff',
  borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
});
