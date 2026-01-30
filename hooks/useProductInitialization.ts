import { useCallback, useEffect, useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ProductStorage } from '@/services/ProductStorage';
import { LoggingService } from '@/services/LoggingService';
import { CategoryMatcher } from '@/services/CategoryMatcher';
import { ManualEntryFormData, useManualEntry } from '@/context/ManualEntryContext';
import { ProductCategory } from '@/types/Product';

export interface UseProductInitializationProps {
  setIsLoading: (loading: boolean) => void;
  categories: ProductCategory[];
  categoriesLoading: boolean;
}

export interface UseProductInitializationReturn {
  productId: string | undefined;
  scannerDataKey: string;
  loadData: () => Promise<void>;
  guessCategory: (productName: string, productBrand: string, allCategories: ProductCategory[]) => string | null;
}

export const useProductInitialization = ({
  setIsLoading,
  categories,
  categoriesLoading,
}: UseProductInitializationProps): UseProductInitializationReturn => {
  const params = useLocalSearchParams();
  const {
    name,
    brand,
    selectedCategory,
    isEditMode,
    hasManuallySelectedCategory,
    isInitialized,
    setIsInitialized,
    initializeForm,
    setImageUrl,
  } = useManualEntry();

  const productId = useMemo(() =>
    Array.isArray(params.productId) ? params.productId[0] : params.productId,
    [params.productId]
  );

  // Create a stable key for tracking when scanner data changes
  const scannerDataKey = useMemo(() => {
    return `${params.barcode || ''}-${params.fromPhotoCapture ? 'photo' : 'none'}`;
  }, [params.barcode, params.fromPhotoCapture]);

  const guessCategory = useCallback((productName: string, productBrand: string, allCategories: ProductCategory[]): string | null => {
    return CategoryMatcher.guessCategory(productName, productBrand, allCategories);
  }, []);

  const loadData = useCallback(async () => {
    // Capture current params at this moment
    const currentParams = { ...params };

    LoggingService.info('useProductInitialization', `Loading data. productId: ${productId}`);
    LoggingService.info('useProductInitialization', `Params: ${JSON.stringify(currentParams)}`);
    LoggingService.info('useProductInitialization', `isInitialized: ${isInitialized}, categoriesLoading: ${categoriesLoading}, scannerKey: ${scannerDataKey}`);

    setIsLoading(true);
    try {
      if (productId) {
        LoggingService.info('useProductInitialization', `Loading product for edit with ID: ${productId}`);
        const productToEdit = await ProductStorage.getProductById(productId);
        if (productToEdit) {
          LoggingService.info('useProductInitialization', `Product loaded successfully: ${productToEdit.name}`);
          initializeForm({
            product: productToEdit,
            isEditMode: true,
            originalProductId: productToEdit.id,
            hasManuallySelectedCategory: true,
          });
        } else {
          LoggingService.error('useProductInitialization', `Product with ID ${productId} not found`);
        }
      } else {
        LoggingService.info('useProductInitialization', 'Initializing form for new product or from params.');
        const initialData = { ...currentParams };
        delete initialData.productId;
        LoggingService.info('useProductInitialization', `Initializing form with data: ${JSON.stringify(initialData)}`);
        initializeForm(initialData as Partial<ManualEntryFormData>);
      }
      setIsInitialized(true);
      LoggingService.info('useProductInitialization', 'Data loading completed successfully');
    } catch (error) {
      LoggingService.error('useProductInitialization', 'Error during data loading:', error);
    } finally {
      setIsLoading(false);
      LoggingService.info('useProductInitialization', 'Setting isLoading to false');
    }
  }, [productId, initializeForm, isInitialized, categoriesLoading, scannerDataKey, setIsLoading, setIsInitialized]);

  // Effect for loading data on mount
  useEffect(() => {
    LoggingService.info('useProductInitialization', 'useEffect triggered for loadData');
    loadData();
  }, [loadData]);

  // Effect for handling photo capture image URL
  useEffect(() => {
    if (params.fromPhotoCapture && params.imageUrl) {
      const url = Array.isArray(params.imageUrl) ? params.imageUrl[0] : params.imageUrl;
      LoggingService.info('useProductInitialization', `Setting imageUrl from photo capture: ${url}`);
      if (url) setImageUrl(url);
    }
  }, [params.fromPhotoCapture, params.imageUrl, setImageUrl]);

  // Effect for auto-guessing category
  useEffect(() => {
    if (!isEditMode && !hasManuallySelectedCategory && (name || brand) && !categoriesLoading) {
      const guessedCategoryId = guessCategory(name, brand, categories);
      if (guessedCategoryId && guessedCategoryId !== selectedCategory) {
        LoggingService.info('useProductInitialization', `Guessed category: ${guessedCategoryId} for name: ${name}, brand: ${brand}`);
        // Note: We return the guessed category but don't set it here to avoid circular dependency
        // The parent hook will handle setting it
      }
    }
  }, [name, brand, isEditMode, hasManuallySelectedCategory, categories, categoriesLoading, guessCategory, selectedCategory]);

  return {
    productId,
    scannerDataKey,
    loadData,
    guessCategory,
  };
};
