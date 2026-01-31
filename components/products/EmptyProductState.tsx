import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  const message = hasSearchQuery || hasCategoryFilter
    ? 'Nessun prodotto trovato'
    : 'Nessun prodotto ancora aggiunto';

  const accessibilityHint = hasSearchQuery || hasCategoryFilter
    ? 'Prova a modificare i filtri o la ricerca'
    : 'Aggiungi il tuo primo prodotto usando il pulsante in alto a destra';

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
