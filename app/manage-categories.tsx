// manage-categories.tsx — manage-categories module.
//
// exports: ManageCategoriesScreen | function
// used_by: none
// rules:   - All category mutations (add, update, delete) must be performed exclusively through the CategoryContext API, never directly modifying the categories state.
//          - The PRODUCT_CATEGORIES constant defines default/system categories that must remain immutable and cannot be deleted or edited through the UI.
//          - Screen navigation and modal visibility state must be managed locally with useState, not shared outside the component.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Modal, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { PRODUCT_CATEGORIES } from '@/types/Product';
import { router } from 'expo-router';
import { X, Plus, Edit2 } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useCategories } from '@/context/CategoryContext';
import { LoggingService } from '@/services/LoggingService';
import { getStyles } from '@/styles/manage-categories.styles';
import { useTranslation } from 'react-i18next';
import { useAppLanguage } from '@/i18n/useAppLanguage';
import { getCategoryLabel } from '@/utils/categoryLabels';

interface CreateCategoryModalProps {
  isVisible: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  styles: Record<string, ViewStyle | TextStyle>;
}

function CreateCategoryModal({ isVisible, onClose, isDarkMode, styles }: CreateCategoryModalProps) {
  const { t } = useTranslation();
  const [categoryName, setCategoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { addCategory } = useCategories();

  const handleCreate = async () => {
    if (!categoryName.trim()) {
      Alert.alert(t('common.error'), t('categories.nameRequiredError'));
      return;
    }

    setIsCreating(true);
    try {
      const newCategory = await addCategory(categoryName.trim());
      if (newCategory) {
        if (newCategory.iconNotFound) {
          LoggingService.info('ManageCategories', `Category "${newCategory.name}" created without icon`);
        }
      }
      setCategoryName('');
      onClose();
    } catch {
      Alert.alert(t('common.error'), t('categories.createFailedError'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={isVisible}
      onRequestClose={onClose}
      onShow={() => inputRef.current?.focus()}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{t('categories.createNewTitle')}</Text>
          <TextInput
            ref={inputRef}
            style={styles.modalInput}
            placeholder={t('categories.namePlaceholder')}
            value={categoryName}
            onChangeText={setCategoryName}
            autoFocus
            placeholderTextColor={isDarkMode ? '#8b949e' : '#64748B'}
            testID="category-name-input"
          />
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity 
              accessibilityLabel={t('common.cancel')}
              accessibilityRole="button" 
              style={[styles.modalButton, styles.modalButtonCancel]} 
              onPress={onClose}
              disabled={isCreating}
            >
              <Text style={styles.modalButtonTextCancel}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              accessibilityLabel={t('categories.confirmCreateLabel')}
              accessibilityRole="button" 
              style={[styles.modalButton, styles.modalButtonConfirm]} 
              onPress={handleCreate} 
              testID="save-category-button"
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.modalButtonTextConfirm}>{t('categories.createAction')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ManageCategoriesScreen() {
  const { t } = useTranslation();
  const language = useAppLanguage();
  const { isDarkMode } = useTheme();
  const { categories, deleteCategory, updateCategory } = useCategories();
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editCategoryNameInput, setEditCategoryNameInput] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const editInputRef = useRef<TextInput>(null);

  const customCategories = categories.filter(sc => sc.isDefault !== true && !PRODUCT_CATEGORIES.some(dc => dc.id === sc.id));

  const handleDelete = (categoryId: string) => {

    Alert.alert(
      t('categories.deleteConfirmTitle'),
      t('categories.deleteConfirmMessage'),
      [
        { text: t('common.cancel'), style: "cancel" },
        { text: t('common.delete'), style: "destructive", onPress: () => deleteCategory(categoryId) }
      ]
    );
  };

  const handleEdit = (categoryId: string, currentName: string) => {
    setSelectedCategoryId(categoryId);
    setEditCategoryNameInput(currentName);
    setEditModalVisible(true);
  };

  const handleUpdateCategory = async () => {
    if (!selectedCategoryId) return;
    
    try {
      if (!editCategoryNameInput.trim()) {
        Alert.alert(t('common.error'), t('categories.nameRequiredError'));
        return;
      }

      // Verifica se esiste già una categoria con lo stesso nome
      if (categories.some(cat =>
        cat.id !== selectedCategoryId &&
        getCategoryLabel(cat, language).toLocaleLowerCase() === editCategoryNameInput.trim().toLocaleLowerCase()
      )) {
        Alert.alert(t('common.error'), t('categories.duplicateNameError'));
        return;
      }

      await updateCategory(selectedCategoryId, editCategoryNameInput);
      setEditModalVisible(false);
      LoggingService.info('ManageCategories', `Categoria ${selectedCategoryId} rinominata in "${editCategoryNameInput}"`);
    } catch (error: unknown) {
      LoggingService.error('ManageCategories', 'Failed to update category', error);
      Alert.alert(t('common.error'), t('categories.updateFailedError'));
    }
  };

  const renderItem = ({ item }: { item: { id: string; name: string } }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.categoryName}>{item.name}</Text>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity accessibilityLabel={t('categories.editCategoryLabel')} accessibilityRole="button" onPress={() => handleEdit(item.id, item.name)} style={styles.button}>
          <Edit2 size={20} color={isDarkMode ? '#58a6ff' : '#3b82f6'} />
        </TouchableOpacity>
        <TouchableOpacity accessibilityLabel={t('categories.deleteCategoryLabel')} accessibilityRole="button" onPress={() => handleDelete(item.id)} style={styles.button} testID="delete-category-button">
          <X size={20} color={isDarkMode ? '#EF4444' : 'red'} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const styles = getStyles(isDarkMode);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t('categories.manageTitle')}</Text>
      <Text style={styles.infoText}>
        {t('categories.manageInfo')}
      </Text>
       <TouchableOpacity accessibilityLabel={t('categories.createNewTitle')} accessibilityRole="button" style={styles.createButton} onPress={() => setCreateModalVisible(true)} testID="add-category-button">
        <Plus size={20} color="white" />
        <Text style={styles.createButtonText}>{t('categories.createNewTitle')}</Text>
      </TouchableOpacity>
      <FlashList
        data={customCategories}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>{t('categories.noCustomCategories')}</Text>}
      />
      <TouchableOpacity accessibilityLabel={t('common.goBack')} accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>{t('common.back')}</Text>
      </TouchableOpacity>

      <CreateCategoryModal 
        isVisible={isCreateModalVisible} 
        onClose={() => setCreateModalVisible(false)} 
        isDarkMode={isDarkMode} 
        styles={styles} 
      />

      <Modal
        transparent={true}
        animationType="fade"
        visible={isEditModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
        onShow={() => editInputRef.current?.focus()}
      >

        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t('categories.editNameTitle')}</Text>
             <TextInput
               ref={editInputRef}
               style={styles.modalInput}
               placeholder={t('categories.newNamePlaceholder')}
               value={editCategoryNameInput}
               onChangeText={setEditCategoryNameInput}
               autoFocus
               placeholderTextColor={isDarkMode ? '#8b949e' : '#64748B'}
             />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity accessibilityLabel={t('categories.cancelEditLabel')} accessibilityRole="button" style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalButtonTextCancel}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityLabel={t('categories.saveEditLabel')} accessibilityRole="button" style={[styles.modalButton, styles.modalButtonConfirm]} onPress={handleUpdateCategory}>
                <Text style={styles.modalButtonTextConfirm}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
