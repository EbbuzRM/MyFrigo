import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

/**
 * Props for SearchBar component
 */
interface SearchBarProps {
  /** Current search query value */
  value: string;
  /** Callback when search text changes */
  onChangeText: (text: string) => void;
  /** Optional placeholder text */
  placeholder?: string;
  /** Optional test ID for testing */
  testID?: string;
}

/**
 * Search bar component for product filtering
 * Displays search icon and text input
 * 
 * @param props - Component props
 * @returns SearchBar component
 */
export function SearchBar({
  value,
  onChangeText,
  placeholder = "Cerca per nome o marca...",
  testID,
}: SearchBarProps): React.ReactElement {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.searchContainer} testID={testID}>
      <View style={styles.searchInputContainer}>
        <Search size={20} color={isDarkMode ? '#8b949e' : '#64748B'} />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor={isDarkMode ? '#8b949e' : '#64748B'}
          value={value}
          onChangeText={onChangeText}
          accessibilityLabel="Cerca prodotti"
          accessibilityRole="search"
          accessibilityHint="Inserisci il nome o la marca del prodotto da cercare"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>
    </View>
  );
}

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#21262d' : '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
});
