// useProductForm.ts — useProductForm module.
//
// exports: useProductForm
// used_by: app\manual-entry.tsx
// rules:   - All hooks (useProductFormData, useProductInitialization, useCategorySelection, useProductSave) must remain composable as separate hooks; do not merge them into a single monolithic hook.
//          - The ManualEntryContext is the single source of truth for all form field values; do not introduce duplicate state management for name, brand, category, quantities, dates, notes, or images.
//          - Date picker visibility, modal state, and loading state are local UI concerns managed by useProductFormData; do not lift these into context.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { useManualEntry } from '@/context/ManualEntryContext';
import { useCategories } from '@/context/CategoryContext';
import { useProductFormData } from './useProductFormData';
import { useProductInitialization } from './useProductInitialization';
import { useCategorySelection } from './useCategorySelection';
import { useProductSave } from './useProductSave';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';

export const useProductForm = () => {
  const {
    name, setName,
    brand, setBrand,
    selectedCategory, setSelectedCategory,
    quantities, addQuantity, removeQuantity, updateQuantity,
    purchaseDate, setPurchaseDate,
    expirationDate, setExpirationDate,
    notes, setNotes,
    barcode,
    imageUrl, setImageUrl,
    isEditMode,
    originalProductId,
    hasManuallySelectedCategory,
    isFrozen, setIsFrozen,
  } = useManualEntry();

  const { categories, loading: categoriesLoading } = useCategories();

  // Hook 1: Form field state management (date pickers, modals, loading)
  const {
    isLoading,
    setIsLoading,
    showPurchaseDatePicker,
    setShowPurchaseDatePicker,
    showExpirationDatePicker,
    setShowExpirationDatePicker,
    isCategoryModalVisible,
    setIsCategoryModalVisible,
    newCategoryNameInput,
    setNewCategoryNameInput,
    navigatingToPhotoCapture,
    onChangePurchaseDate: onChangePurchaseDateBase,
    onChangeExpirationDate: onChangeExpirationDateBase,
    ADD_NEW_CATEGORY_ID,
  } = useProductFormData();

  // Hook 2: Product data loading and initialization
  useProductInitialization({
    setIsLoading,
    categories,
    categoriesLoading,
  });

  // Hook 3: Category management
  const {
    categoryData,
    handleAddNewCategory,
    handleCategoryChange,
  } = useCategorySelection({
    categories,
    categoriesLoading,
    isCategoryModalVisible,
    setIsCategoryModalVisible,
    newCategoryNameInput,
    setNewCategoryNameInput,
    ADD_NEW_CATEGORY_ID,
  });

  // Hook 4: Save and validation
  const {
    handleSaveProduct,
  } = useProductSave();

  // Wrapper for date handlers to integrate with ManualEntryContext
  const onChangePurchaseDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const dateString = onChangePurchaseDateBase(event, selectedDate);
    if (dateString) {
      setPurchaseDate(dateString);
    }
  };

  const onChangeExpirationDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const dateString = onChangeExpirationDateBase(event, selectedDate);
    if (dateString) {
      setExpirationDate(dateString);
    }
  };

  return {
    // Loading state
    isLoading,

    // Form fields (from ManualEntryContext)
    name, setName,
    brand, setBrand,
    selectedCategory, setSelectedCategory,
    quantities, addQuantity, removeQuantity, updateQuantity,
    purchaseDate, setPurchaseDate,
    expirationDate, setExpirationDate,
    notes, setNotes,
    barcode,
    imageUrl, setImageUrl,
    isEditMode,
    originalProductId,
    hasManuallySelectedCategory,
    isFrozen, setIsFrozen,

    // UI states (from useProductFormData)
    showPurchaseDatePicker, setShowPurchaseDatePicker,
    showExpirationDatePicker, setShowExpirationDatePicker,
    isCategoryModalVisible, setIsCategoryModalVisible,
    newCategoryNameInput, setNewCategoryNameInput,
    navigatingToPhotoCapture,

    // Categories (from useCategories)
    categories,
    categoriesLoading,

    // Category data formatted for UI (from useCategorySelection)
    categoryData,

    // Handlers
    handleAddNewCategory,
    handleCategoryChange,
    onChangePurchaseDate,
    onChangeExpirationDate,
    handleSaveProduct,
  };
};
