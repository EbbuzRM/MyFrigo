// RecentsPicker.tsx — RecentsPicker module.
//
// exports: RecentsPicker
// used_by: app\(tabs)\add.tsx
// rules:   - Lightweight picker for recent products: search TextInput + horizontal FlatList + multi-select checkmark + Continua button. No form logic.

import React from 'react';
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Search, Check } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { Product } from '@/types/Product';

interface RecentsPickerProps {
  products: Product[];
  selectedIds: Set<string>;
  onToggle: (product: Product) => void;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  loading: boolean;
  error: string | null;
  hintText: string | null;
}

export function RecentsPicker({
  products,
  selectedIds,
  onToggle,
  searchQuery,
  onSearchChange,
  loading,
  error,
  hintText,
}: RecentsPickerProps) {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  const renderItem = ({ item }: { item: Product }) => {
    const selected = selectedIds.has(item.id);
    return (
      <TouchableOpacity
        testID={`recent-card-${item.id}`}
        accessibilityLabel={`Seleziona ${item.name}`}
        accessibilityRole="button"
        style={[styles.card, selected && styles.cardSelected]}
        onPress={() => onToggle(item)}
        activeOpacity={0.8}
      >
        <View style={styles.imageWrapper}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}
          {selected && (
            <View style={styles.checkBadge}>
              <Check size={14} color="#fff" />
            </View>
          )}
        </View>
        <Text style={styles.cardName} numberOfLines={2}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container} testID="recents-picker">
      <Text style={styles.sectionTitle}>Recenti</Text>

      <View style={styles.searchContainer}>
        <Search size={16} color={isDarkMode ? '#8b949e' : '#64748b'} />
        <TextInput
          testID="recents-search-input"
          style={styles.searchInput}
          placeholder="Cerca nome o marca..."
          placeholderTextColor={isDarkMode ? '#8b949e' : '#64748b'}
          value={searchQuery}
          onChangeText={onSearchChange}
          accessibilityLabel="Cerca prodotti recenti"
          returnKeyType="search"
          autoCorrect={false}
        />
      </View>

      {hintText ? (
        <Text style={styles.hintText} testID="recents-hint">
          {hintText}
        </Text>
      ) : null}

      {loading ? (
        <View style={styles.centerBox} testID="recents-loading">
          <ActivityIndicator size="small" color={isDarkMode ? '#fff' : '#000'} />
        </View>
      ) : error ? (
        <Text style={styles.errorText} testID="recents-error">
          {error}
        </Text>
      ) : products.length === 0 ? (
        <Text style={styles.emptyText} testID="recents-empty">
          Nessun prodotto recente
        </Text>
      ) : (
        <FlatList
          testID="recents-list"
          data={products}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}

    </View>
  );
}

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      marginTop: 8,
      gap: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: isDarkMode ? '#c9d1d9' : '#1e293b',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#161b22' : '#f1f5f9',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: isDarkMode ? '#c9d1d9' : '#1e293b',
      paddingVertical: 2,
    },
    hintText: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: isDarkMode ? '#8b949e' : '#64748b',
    },
    centerBox: {
      paddingVertical: 16,
      alignItems: 'center',
    },
    errorText: {
      fontSize: 13,
      color: '#ef4444',
      fontFamily: 'Inter-Regular',
    },
    emptyText: {
      fontSize: 13,
      color: isDarkMode ? '#8b949e' : '#64748b',
      fontFamily: 'Inter-Regular',
    },
    listContent: {
      gap: 10,
      paddingRight: 16,
    },
    card: {
      width: 84,
      alignItems: 'center',
      gap: 6,
      borderWidth: 2,
      borderColor: 'transparent',
      borderRadius: 12,
      padding: 6,
      backgroundColor: isDarkMode ? '#21262d' : '#ffffff',
    },
    cardSelected: {
      borderColor: isDarkMode ? '#58a6ff' : '#3b82f6',
      backgroundColor: isDarkMode ? '#0d419d' : '#dbeafe',
    },
    imageWrapper: {
      width: 68,
      height: 68,
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: isDarkMode ? '#30363d' : '#e2e8f0',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    imagePlaceholder: {
      flex: 1,
      backgroundColor: isDarkMode ? '#30363d' : '#e2e8f0',
    },
    checkBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#3b82f6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardName: {
      fontSize: 11,
      fontFamily: 'Inter-Regular',
      color: isDarkMode ? '#c9d1d9' : '#1e293b',
      textAlign: 'center',
    },

  });
