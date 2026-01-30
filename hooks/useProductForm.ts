import { useManualEntry } from '@/context/ManualEntryContext';
import { useCategories } from '@/context/CategoryContext';
import { LoggingService } from '@/services/LoggingService';
import { useProductFormData } from './useProductFormData';
import { useProductInitialization } from './useProductInitialization';
import { useCategorySelection } from './useCategorySelection';
import { useProductSave } from './useProductSave';

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

  LoggingService.info('useProductForm_RENDER', `Hook rendering. isEditMode from context: ${isEditMode}`);

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
  const onChangePurchaseDate = (event: any, selectedDate?: Date) => {
    const dateString = onChangePurchaseDateBase(event, selectedDate);
    if (dateString) {
      setPurchaseDate(dateString);
    }
  };

  const onChangeExpirationDate = (event: any, selectedDate?: Date) => {
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
