import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PRODUCT_CATEGORIES } from '@/types/Product';
import { router } from 'expo-router';
import { X, Plus } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useCategories } from '@/context/CategoryContext';

export default function ManageCategoriesScreen() {
  const { isDarkMode } = useTheme();
  const { categories, addCategory, deleteCategory } = useCategories();
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [createCategoryName, setCreateCategoryName] = useState('');

  const customCategories = categories.filter(sc => !PRODUCT_CATEGORIES.some(dc => dc.id === sc.id));

  const handleDelete = (categoryId: string) => {
    Alert.alert(
      "Conferma Eliminazione",
      "Sei sicuro di voler eliminare questa categoria? Questa azione non può essere annullata.",
      [
        { text: "Annulla", style: "cancel" },
        { text: "Elimina", style: "destructive", onPress: () => deleteCategory(categoryId) }
      ]
    );
  };

  const handleCreate = async () => {
    try {
      await addCategory(createCategoryName);
      setCreateCategoryName('');
      setCreateModalVisible(false);
    } catch (error: any) {
      Alert.alert('Errore', error.message);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemContainer}>
      <View style={styles.categoryInfo}>
        {item.iconUrl ? (
          <Image source={{ uri: item.iconUrl }} style={styles.categoryImage} />
        ) : (
          <Text style={styles.categoryIcon}>{item.icon}</Text>
        )}
        <Text style={styles.categoryName}>{item.name}</Text>
      </View>
      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.button}>
        <X size={20} color={isDarkMode ? '#EF4444' : 'red'} />
      </TouchableOpacity>
    </View>
  );

  const styles = getStyles(isDarkMode);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Gestisci Categorie</Text>
      <Text style={styles.infoText}>
        Qui puoi creare o eliminare le categorie personalizzate. Le categorie predefinite non sono modificabili.
      </Text>
      <TouchableOpacity style={styles.createButton} onPress={() => setCreateModalVisible(true)}>
        <Plus size={20} color="white" />
        <Text style={styles.createButtonText}>Crea Nuova Categoria</Text>
      </TouchableOpacity>
      <FlatList
        data={customCategories}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>Nessuna categoria personalizzata.</Text>}
      />
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>Indietro</Text>
      </TouchableOpacity>

      <Modal
        transparent={true}
        animationType="fade"
        visible={isCreateModalVisible}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Crea Nuova Categoria</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nome della categoria"
              value={createCategoryName}
              onChangeText={setCreateCategoryName}
              autoFocus
              placeholderTextColor={isDarkMode ? '#8b949e' : '#64748B'}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setCreateModalVisible(false)}>
                <Text style={styles.modalButtonTextCancel}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={handleCreate}>
                <Text style={styles.modalButtonTextConfirm}>Crea</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: isDarkMode ? '#0d1117' : '#ffffff',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
    marginBottom: 15,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginLeft: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  categoryImage: {
    width: 24,
    height: 24,
    marginRight: 12,
    borderRadius: 4,
  },
  categoryName: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  buttonsContainer: {
    flexDirection: 'row',
  },
  button: {
    marginLeft: 10,
    padding: 5,
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
    backgroundColor: isDarkMode ? '#21262d' : '#ffffff',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  backButtonText: {
    color: isDarkMode ? '#c9d1d9' : '#2563EB',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'stretch',
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 15,
    textAlign: 'center',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 20,
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    backgroundColor: isDarkMode ? '#0d1117' : '#ffffff',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: isDarkMode ? '#30363d' : '#ffffff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  modalButtonConfirm: {
    backgroundColor: '#10B981',
    marginLeft: 10,
  },
  modalButtonTextCancel: {
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  modalButtonTextConfirm: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
});