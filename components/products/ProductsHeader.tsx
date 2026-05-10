// ProductsHeader.tsx — ProductsHeader module.
//
// exports: ProductsHeader
// used_by: app\(tabs)\products.tsx
// rules:   - All React Native components must be located in the `components/` directory and follow the existing naming convention (`ComponentName.tsx`)
//          - Theme context (`useTheme`) must be used for all color/dark mode values; hardcoded colors are only allowed for brand colors (like `#2563EB`) and white
//          - Navigation must be handled exclusively through `expo-router` using the established route pattern (`/(tabs)/*`)
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';

/**
 * Props for ProductsHeader component
 */
interface ProductsHeaderProps {
  /** Optional test ID for testing */
  testID?: string;
}

/**
 * Header component for Products screen
 * Displays title and add button
 * 
 * @param props - Component props
 * @returns Header component
 */
export function ProductsHeader({ testID }: ProductsHeaderProps): React.ReactElement {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  const handleAddPress = (): void => {
    router.push('/(tabs)/add');
  };

  return (
    <View style={styles.header} testID={testID}>
      <Text style={styles.title} accessibilityRole="header">
        Prodotti
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddPress}
        accessibilityLabel="Aggiungi nuovo prodotto"
        accessibilityRole="button"
        accessibilityHint="Tocca per aggiungere un nuovo prodotto"
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
