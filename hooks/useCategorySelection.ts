// useCategorySelection.ts — useCategorySelection module.
//
// exports: UseCategorySelectionProps | UseCategorySelectionReturn | useCategorySelection
// used_by: hooks\useProductForm.ts
// rules:   - Category data formatting logic (grid spacers, "Add New" button) must remain isolated in the `formatCategoryData` utility function and not be mixed into React component or hook logic
//          - All category selection and creation flows must go through the CategoryContext and ManualEntryContext providers, not direct state manipulation
//          - The ADD_NEW_CATEGORY_ID constant must be defined by the consumer and passed through props, not hardcoded in this hook
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useCategories } from '@/context/CategoryContext';
import { useManualEntry } from '@/context/ManualEntryContext';
import { LoggingService } from '@/services/LoggingService';
import { CategoryMatcher } from '@/services/CategoryMatcher';
import { ProductCategory } from '@/types/Product';

/**
 * Formats category data for grid display with "Add New" button and spacers
 */
const formatCategoryData = (
  data: ProductCategory[],
  columns: number,
  addNewCategoryId: string
): (ProductCategory & { spacer?: boolean })[] => {
  // Create new array with "Add New" button
  const dataWithButton: (ProductCategory & { spacer?: boolean })[] = [
    ...data,
    { id: addNewCategoryId, name: 'Aggiungi', icon: '+', color: '#808080' },
  ];

  // Calculate how many spacers are needed to fill the last row
  const remainder = dataWithButton.length % columns;
  if (remainder !== 0) {
    const spacersNeeded = columns - remainder;
    for (let i = 0; i < spacersNeeded; i++) {
      dataWithButton.push({
        id: `spacer-${i}`,
        name: '',
        color: 'transparent',
        spacer: true,
      });
    }
  }

  return dataWithButton;
};

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

  // Debounce ref to avoid calling guessCategory on every keystroke
  const guessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-guess category effect (debounced 500ms)
  useEffect(() => {
    if (guessTimeoutRef.current) {
      clearTimeout(guessTimeoutRef.current);
    }

    if (!isEditMode && !hasManuallySelectedCategory && (name || brand) && !categoriesLoading) {
      guessTimeoutRef.current = setTimeout(() => {
        const guessedCategoryId = guessCategory(name, brand, categories);
        if (guessedCategoryId && guessedCategoryId !== selectedCategory) {
          LoggingService.info('useCategorySelection', `Auto-guessed category: ${guessedCategoryId} for name: ${name}, brand: ${brand}`);
          setSelectedCategory(guessedCategoryId);
        }
      }, 500);
    }

    return () => {
      if (guessTimeoutRef.current) {
        clearTimeout(guessTimeoutRef.current);
      }
    };
  }, [name, brand, isEditMode, hasManuallySelectedCategory, categories, categoriesLoading, guessCategory, selectedCategory]);

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

  const categoryData = useMemo(
    () => formatCategoryData(categories, 4, ADD_NEW_CATEGORY_ID),
    [categories]
  );

  return {
    categoryData,
    handleAddNewCategory,
    handleCategoryChange,
    guessCategory,
  };
};
