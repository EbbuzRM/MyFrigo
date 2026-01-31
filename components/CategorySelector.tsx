import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { StyleSheet } from 'react-native';

/**
 * Props for CategorySelector component
 */
interface CategorySelectorProps {
  /** Currently selected category */
  selectedCategory: string;
  /** Callback when category is selected */
  onSelect: (category: string) => void;
  /** Array of available categories */
  categories?: string[];
  /** Label text */
  label?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Test ID for testing */
  testID?: string;
}

/**
 * Default categories if none provided
 */
const DEFAULT_CATEGORIES = [
  'Alimentari',
  'Bevande',
  'Latticini',
  'Carne',
  'Pesce',
  'Frutta',
  'Verdura',
  'Surgelati',
  'Snack',
  'Altro',
];

/**
 * CategorySelector - A component for selecting product category
 * 
 * Features:
 * - Horizontal scrollable list of category chips
 * - Visual selection indicator
 * - Accessible touch targets
 * 
 * @example
 * <CategorySelector
 *   selectedCategory={category}
 *   onSelect={setCategory}
 *   categories={['Food', 'Drink', 'Snack']}
 * />
 */
const CategorySelector = React.memo(({
  selectedCategory,
  onSelect,
  categories = DEFAULT_CATEGORIES,
  label = 'Categoria',
  accessibilityLabel = 'Category selector',
  testID = 'category-selector',
}: CategorySelectorProps) => {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  const handleSelect = useCallback((category: string) => {
    onSelect(category);
  }, [onSelect]);

  return (
    <View style={styles.container} accessibilityLabel={accessibilityLabel} testID={testID}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => {
          const isSelected = category === selectedCategory;
          return (
            <TouchableOpacity
              key={category}
              style={[
                styles.chip,
                isSelected && styles.selectedChip,
              ]}
              onPress={() => handleSelect(category)}
              accessibilityLabel={`Select ${category} category`}
              accessibilityState={{ selected: isSelected }}
              accessibilityRole="button"
              testID={`${testID}-chip-${category}`}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.selectedChipText,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  scrollContent: {
    paddingVertical: 4,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: isDarkMode ? '#21262d' : '#f1f5f9',
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
    marginRight: 8,
  },
  selectedChip: {
    backgroundColor: isDarkMode ? '#1f4d7a' : '#dbeafe',
    borderColor: isDarkMode ? '#58a6ff' : '#3b82f6',
  },
  chipText: {
    fontSize: 14,
    color: isDarkMode ? '#c9d1d9' : '#475569',
    fontWeight: '500',
  },
  selectedChipText: {
    color: isDarkMode ? '#58a6ff' : '#2563eb',
    fontWeight: '600',
  },
});

CategorySelector.displayName = 'CategorySelector';

export default CategorySelector;
