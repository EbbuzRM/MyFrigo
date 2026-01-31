import { StyleSheet } from 'react-native';
import { scaleFont } from '@/utils/scaleFont';
import { COLORS } from '@/constants/colors';

/**
 * Theme color types for type safety
 */
interface ThemeColors {
  textPrimary: string;
  textSecondary: string;
  primary: string;
  error: string;
  success: string;
  cardBackground: string;
  background: string;
}

/**
 * Creates ProductCard styles based on theme
 * @param {boolean} isDarkMode - Whether dark mode is enabled
 * @param {ThemeColors} colors - Theme colors object
 * @returns {StyleSheet.NamedStyles} Compiled styles
 */
export const getProductCardStyles = (isDarkMode: boolean, colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      borderRadius: 16,
      marginBottom: 16,
      borderWidth: 1,
      shadowColor: COLORS.LIGHT.textPrimary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
      flexDirection: 'row',
      overflow: 'hidden',
    },
    statusIndicator: {
      width: 5,
    },
    content: {
      flex: 1,
      padding: 16,
    },
  });

/**
 * Base card styles that can be composed with other styles
 */
export const baseCardStyles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  statusIndicator: {
    width: 5,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});

/**
 * Shared text styles
 */
export const textStyles = StyleSheet.create({
  productName: {
    fontSize: scaleFont(17),
    fontFamily: 'Inter-SemiBold',
  },
  brandName: {
    fontSize: scaleFont(14),
    fontFamily: 'Inter-Regular',
  },
  detailText: {
    fontSize: scaleFont(14),
    fontFamily: 'Inter-Regular',
  },
  dateText: {
    fontSize: scaleFont(14),
    fontFamily: 'Inter-Medium',
  },
});
