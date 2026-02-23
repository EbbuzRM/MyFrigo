import { useCallback, useEffect, useMemo, useRef } from 'react';
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
    expirationDate,
    setExpirationDate,
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

  // Ref per tracciare se l'effect per expirationDate è già stato eseguito
  const hasSetExpirationDateRef = useRef(false);

  const loadData = useCallback(async () => {
    // Capture current params at this moment
    const currentParams = { ...params };

    LoggingService.info('useProductInitialization', `Loading data. productId: ${productId}, fromPhotoCapture: ${currentParams.fromPhotoCapture || 'false'}`);

    // Reset the ref when starting a new load (new photo capture or new product)
    hasSetExpirationDateRef.current = false;

    setIsLoading(true);
    try {
      if (productId) {
        const { data: productToEdit, success } = await ProductStorage.getProductById(productId);
        if (success && productToEdit) {
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
        const initialData = { ...currentParams };
        delete initialData.productId;

        // IMPORTANT: If fromPhotoCapture, don't pass expirationDate to initializeForm
        // We'll handle it separately in the dedicated effect to avoid race conditions
        if (currentParams.fromPhotoCapture === 'true') {
          delete initialData.expirationDate;
        }

        initializeForm(initialData as Partial<ManualEntryFormData>);
      }
      setIsInitialized(true);
    } catch (error) {
      LoggingService.error('useProductInitialization', 'Error during data loading:', error);
    } finally {
      setIsLoading(false);
    }
  }, [productId, initializeForm, isInitialized, categoriesLoading, scannerDataKey, setIsLoading, setIsInitialized]);

  // Effect for loading data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Effect for handling expiration date passed from photo capture
  // EXECUTE ONLY ONCE when returning from photo capture, not on every date change
  useEffect(() => {
    if (params.fromPhotoCapture === 'true' && params.expirationDate && !hasSetExpirationDateRef.current) {
      const expirationDateParam = Array.isArray(params.expirationDate) ? params.expirationDate[0] : params.expirationDate;
      if (expirationDateParam) {
        setExpirationDate(expirationDateParam);
        hasSetExpirationDateRef.current = true;
      }
    }
  }, [params.fromPhotoCapture, params.expirationDate, setExpirationDate]);

  // Effect for handling photo capture image URL
  useEffect(() => {
    if (params.fromPhotoCapture && params.imageUrl) {
      const url = Array.isArray(params.imageUrl) ? params.imageUrl[0] : params.imageUrl;
      if (url) setImageUrl(url);
    }
  }, [params.fromPhotoCapture, params.imageUrl, setImageUrl]);

  // Effect for auto-guessing category
  useEffect(() => {
    if (!isEditMode && !hasManuallySelectedCategory && (name || brand) && !categoriesLoading) {
      guessCategory(name, brand, categories);
    }
  }, [name, brand, isEditMode, hasManuallySelectedCategory, categories, categoriesLoading, guessCategory]);

  return {
    productId,
    scannerDataKey,
    loadData,
    guessCategory,
  };
};
