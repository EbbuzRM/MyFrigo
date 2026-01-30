import { useState, useCallback, useMemo, useEffect } from 'react';
import { Alert } from 'react-native';
import { useCategories } from '@/context/CategoryContext';
import { useManualEntry } from '@/context/ManualEntryContext';
import { LoggingService } from '@/services/LoggingService';
import { CategoryMatcher } from '@/services/CategoryMatcher';
import { ProductCategory } from '@/types/Product';

export interface UseCategorySelectionProps {
  categories: ProductCategory[];
  categoriesLoading: boolean;
  isCategoryModalVisible: boolean;
  setIsCategoryModalVisible: (visible: boolean) => void;
  newCategoryNameInput: string;
  setNewCategoryNameInput: (name: string) => void;
  ADD_NEW_CATEGORY_ID: string;
}

export interface UseCategorySelectionReturn {
  // Category data formatted for UI
  categoryData: (ProductCategory & { spacer?: boolean })[];

  // Category creation
  handleAddNewCategory: () => Promise<void>;

  // Category selection
  handleCategoryChange: (itemValue: string) => void;

  // Auto-guess category
  guessCategory: (productName: string, productBrand: string, allCategories: ProductCategory[]) => string | null;
}

export const useCategorySelection = ({
  categories,
  categoriesLoading,
  isCategoryModalVisible,
  setIsCategoryModalVisible,
  newCategoryNameInput,
  setNewCategoryNameInput,
  ADD_NEW_CATEGORY_ID,
}: UseCategorySelectionProps): UseCategorySelectionReturn => {
  const { addCategory } = useCategories();
  const {
    setSelectedCategory,
    setHasManuallySelectedCategory,
    name,
    brand,
    selectedCategory,
    isEditMode,
    hasManuallySelectedCategory,
  } = useManualEntry();

  const guessCategory = useCallback((productName: string, productBrand: string, allCategories: ProductCategory[]): string | null => {
    return CategoryMatcher.guessCategory(productName, productBrand, allCategories);
  }, []);

  // Auto-guess category effect
  useEffect(() => {
    if (!isEditMode && !hasManuallySelectedCategory && (name || brand) && !categoriesLoading) {
      const guessedCategoryId = guessCategory(name, brand, categories);
      if (guessedCategoryId && guessedCategoryId !== selectedCategory) {
        LoggingService.info('useCategorySelection', `Auto-guessed category: ${guessedCategoryId} for name: ${name}, brand: ${brand}`);
        setSelectedCategory(guessedCategoryId);
      }
    }
  }, [name, brand, isEditMode, hasManuallySelectedCategory, categories, categoriesLoading, guessCategory, selectedCategory, setSelectedCategory]);

  const handleAddNewCategory = useCallback(async () => {
    LoggingService.info('useCategorySelection', `handleAddNewCategory called with name: ${newCategoryNameInput}`);
    if (!newCategoryNameInput.trim()) {
      Alert.alert('Errore', 'Il nome della categoria non può essere vuoto.');
      return;
    }
    try {
      const newCategory = await addCategory(newCategoryNameInput);
      if (newCategory) {
        LoggingService.info('useCategorySelection', `New category created: ${newCategory.id} - ${newCategory.name}`);
        setSelectedCategory(newCategory.id);
        setHasManuallySelectedCategory(true);
      }
      setIsCategoryModalVisible(false);
      setNewCategoryNameInput('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Si è verificato un errore sconosciuto.';
      LoggingService.error('useCategorySelection', `Error creating category: ${message}`);
      Alert.alert('Errore', message);
    }
  }, [newCategoryNameInput, addCategory, setSelectedCategory, setHasManuallySelectedCategory, setIsCategoryModalVisible, setNewCategoryNameInput]);

  const handleCategoryChange = useCallback((itemValue: string) => {
    LoggingService.info('useCategorySelection', `handleCategoryChange called with: ${itemValue}`);
    if (itemValue === ADD_NEW_CATEGORY_ID) {
      LoggingService.info('useCategorySelection', 'Opening add new category modal');
      setNewCategoryNameInput('');
      setIsCategoryModalVisible(true);
    } else {
      LoggingService.info('useCategorySelection', `Setting selected category to: ${itemValue}`);
      setSelectedCategory(itemValue);
      setHasManuallySelectedCategory(true);
    }
  }, [ADD_NEW_CATEGORY_ID, setIsCategoryModalVisible, setNewCategoryNameInput, setSelectedCategory, setHasManuallySelectedCategory]);

  const categoryData = useMemo(() => {
    const formatData = (data: ProductCategory[], columns: number) => {
      const dataWithButton = [...data, { id: ADD_NEW_CATEGORY_ID, name: 'Aggiungi', icon: '+', color: '#808080' }];
      const numberOfFullRows = Math.floor(dataWithButton.length / columns);
      let numberOfElementsLastRow = dataWithButton.length - (numberOfFullRows * columns);
      while (numberOfElementsLastRow !== columns && numberOfElementsLastRow !== 0) {
        dataWithButton.push({ id: `spacer-${numberOfElementsLastRow}`, name: '', color: 'transparent', spacer: true } as ProductCategory & { spacer: boolean });
        numberOfElementsLastRow++;
      }
      return dataWithButton;
    };
    return formatData(categories, 4);
  }, [categories, ADD_NEW_CATEGORY_ID]);

  return {
    categoryData,
    handleAddNewCategory,
    handleCategoryChange,
    guessCategory,
  };
};
