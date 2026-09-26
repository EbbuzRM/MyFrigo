// EmptyProductState.tsx — EmptyProductState module.
//
// exports: EmptyProductState
// used_by: components\products\ProductList.tsx
// rules:   - Empty state components must use `useTheme()` hook from `@/context/ThemeContext` for dark mode support and generate styles dynamically via `getStyles(isDarkMode)`
//          - All interactive UI components must include `accessibilityRole`, `accessibilityLabel`, and `accessibilityHint` props for screen reader compatibility
//          - Component props must be defined as TypeScript interfaces with JSDoc comments for each property
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';

/**
 * Props for EmptyProductState component
 */
interface EmptyProductStateProps {
  /** Whether a search query is active */
  hasSearchQuery: boolean;
  /** Whether categories are filtered */
  hasCategoryFilter: boolean;
  /** Optional test ID for testing */
  testID?: string;
}

/**
 * Empty state component for when no products match filters
 * Shows appropriate message based on filter state
 * 
 * @param props - Component props
 * @returns EmptyProductState component
 */
export function EmptyProductState({
  hasSearchQuery,
  hasCategoryFilter,
  testID,
}: EmptyProductStateProps): React.ReactElement {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  const hasActiveFilters = hasSearchQuery || hasCategoryFilter;

  const message = hasActiveFilters
    ? t('products.emptyFiltered')
    : t('products.emptyNoneAdded');

  const accessibilityHint = hasActiveFilters
    ? t('products.emptyFilteredHint')
    : t('products.emptyNoneAddedHint');

  return (
    <View 
      style={styles.emptyState} 
      testID={testID}
      accessibilityRole="text"
      accessibilityLabel={message}
      accessibilityHint={accessibilityHint}
    >
      <Text style={styles.emptyStateText}>
        {message}
      </Text>
    </View>
  );
}

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
  },
});
