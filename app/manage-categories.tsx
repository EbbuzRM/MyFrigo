import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StorageService } from '@/services/StorageService';
import { ProductCategory, PRODUCT_CATEGORIES } from '@/types/Product';
import { router } from 'expo-router';
import { X, Check } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

export default function ManageCategoriesScreen() {
  const { isDarkMode } = useTheme();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    const loadCategories = async () => {
      const storedCategories = await StorageService.getCategories();
      const customCategories = storedCategories.filter(sc => !PRODUCT_CATEGORIES.some(dc => dc.id === sc.id));
      setCategories(customCategories);
    };
    loadCategories();
  }, []);

  const handleEdit = (category: ProductCategory) => {
    setEditingCategoryId(category.id);
    setNewCategoryName(category.name);
  };

  const handleSave = async (categoryId: string) => {
    if (!newCategoryName.trim()) {
      Alert.alert('Errore', 'Il nome della categoria non può essere vuoto.');
      return;
    }
    const updatedCategories = categories.map(c =>
      c.id === categoryId ? { ...c, name: newCategoryName.trim() } : c
    );
    await StorageService.saveCategories([...PRODUCT_CATEGORIES, ...updatedCategories]);
    setCategories(updatedCategories);
    setEditingCategoryId(null);
  };

  const handleDelete = async (categoryId: string) => {
    const updatedCategories = categories.filter(c => c.id !== categoryId);
    await StorageService.saveCategories([...PRODUCT_CATEGORIES, ...updatedCategories]);
    setCategories(updatedCategories);
  };

  const renderItem = ({ item }: { item: ProductCategory }) => {
    const isEditing = editingCategoryId === item.id;
    return (
      <View style={styles.itemContainer}>
        {isEditing ? (
          <TextInput
            value={newCategoryName}
            onChangeText={setNewCategoryName}
            style={styles.input}
            autoFocus
            placeholderTextColor={isDarkMode ? '#8b949e' : '#64748B'}
          />
        ) : (
          <Text style={styles.categoryName}>{item.name}</Text>
        )}
        <View style={styles.buttonsContainer}>
          {isEditing ? (
            <TouchableOpacity onPress={() => handleSave(item.id)} style={styles.button}>
              <Check size={20} color={isDarkMode ? '#10B981' : 'green'} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => handleEdit(item)} style={styles.button}>
              <Text style={styles.buttonText}>Modifica</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.button}>
            <X size={20} color={isDarkMode ? '#EF4444' : 'red'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const styles = getStyles(isDarkMode);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Gestisci Categorie</Text>
      <Text style={styles.infoText}>
        Qui puoi modificare o eliminare le categorie che hai creato. Le categorie predefinite non sono modificabili.
      </Text>
      <FlatList
        data={categories}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>Nessuna categoria personalizzata.</Text>}
      />
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>Indietro</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20, // Mantieni padding orizzontale
    paddingTop: 10, // Riduci padding superiore
    backgroundColor: isDarkMode ? '#0d1117' : '#f8fafc',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
    marginBottom: 15, // Spazio sotto il testo informativo
    textAlign: 'center',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: isDarkMode ? '#30363d' : '#ccc',
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    borderRadius: 8,
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  input: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    borderBottomWidth: 1,
    borderColor: isDarkMode ? '#8b949e' : '#ccc',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    flex: 1,
    paddingVertical: 0, // Adjust for better alignment
  },
  buttonsContainer: {
    flexDirection: 'row',
  },
  button: {
    marginLeft: 10,
    padding: 5, // Add padding for touchable area
  },
  buttonText: {
    color: isDarkMode ? '#58a6ff' : '#2563EB', // Example color for edit
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: isDarkMode ? '#8b949e' : '#64748B',
    fontFamily: 'Inter-Regular',
  },
  backButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: isDarkMode ? '#21262d' : '#2563EB',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : 'transparent',
  },
  backButtonText: {
    color: isDarkMode ? '#c9d1d9' : 'white',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
});
