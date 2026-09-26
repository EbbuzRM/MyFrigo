// useProductSave.ts — useProductSave module.
//
// exports: UseProductSaveReturn | useProductSave
// used_by: hooks\useProductForm.ts
// rules:   The `formValuesRef` must be updated synchronously every render before any callback execution, and all form values must be accessed exclusively through this ref rather than direct state variables to ensure stale closure issues are avoided.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { useCallback, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ProductStorage } from '@/services/ProductStorage';
import { useManualEntry } from '@/context/ManualEntryContext';
import { LoggingService } from '@/services/LoggingService';
import { Product } from '@/types/Product';
import { recentProductQueue } from '@/utils/recentProductQueue';
import { saveImagePermanently } from '@/utils/imageStorage';
import { Paths } from 'expo-file-system';
import { getLocalISODate } from '@/utils/dateUtils';
import { useTranslation } from 'react-i18next';

class ProductSaveError extends Error {
  constructor(message: string, readonly code: 'timeout' | 'failed') {
    super(message);
  }
}

export interface UseProductSaveReturn {
  handleSaveProduct: () => Promise<void>;
}

export const useProductSave = (): UseProductSaveReturn => {
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;
  const params = useLocalSearchParams();
  const {
    name,
    brand,
    selectedCategory,
    quantities,
    purchaseDate,
    expirationDate,
    notes,
    barcode,
    imageUrl,
    isEditMode,
    originalProductId,
    clearForm,
    isFrozen,
  } = useManualEntry();

// Ref per memorizzare i valori del form senza causare ricreazione della callback
   const formValuesRef = useRef({
     name,
     brand,
     selectedCategory,
     quantities,
     purchaseDate,
     expirationDate,
     notes,
     barcode,
     imageUrl,
     isEditMode,
     originalProductId,
     clearForm,
     isFrozen,
     addedMethod: params.addedMethod,
   });

   // Sincronizza il ref con i valori del form ad ogni render
   useEffect(() => {
     formValuesRef.current = {
       name,
       brand,
       selectedCategory,
       quantities,
       purchaseDate,
       expirationDate,
       notes,
       barcode,
       imageUrl,
       isEditMode,
       originalProductId,
       clearForm,
       isFrozen,
       addedMethod: params.addedMethod,
     };
   });

  const handleSaveProduct = useCallback(async () => {
    // Accedi ai valori correnti tramite il ref
    const {
      name: currentName,
      brand: currentBrand,
      selectedCategory: currentCategory,
      quantities: currentQuantities,
      purchaseDate: currentPurchaseDate,
      expirationDate: currentExpirationDate,
      notes: currentNotes,
      barcode: currentBarcode,
      imageUrl: currentImageUrl,
      isEditMode: currentIsEditMode,
      originalProductId: currentOriginalProductId,
      clearForm: currentClearForm,
      isFrozen: currentIsFrozen,
      addedMethod: currentAddedMethod,
    } = formValuesRef.current;
    LoggingService.info('useProductSave', `handleSaveProduct called. Form state: name=${currentName}, selectedCategory=${currentCategory}, quantities=${JSON.stringify(currentQuantities)}, purchaseDate=${currentPurchaseDate}, expirationDate=${currentExpirationDate}`);

    const areQuantitiesValid = currentQuantities.every(q => q.quantity.trim() !== '' && parseFloat(q.quantity.replace(',', '.')) > 0 && q.unit.trim() !== '');
    LoggingService.info('useProductSave', `Quantities validation: ${areQuantitiesValid}, quantities: ${JSON.stringify(currentQuantities)}`);

    if (!currentName || !currentCategory || currentQuantities.length === 0 || !areQuantitiesValid || !currentPurchaseDate || !currentExpirationDate) {
      LoggingService.error('useProductSave', 'Validation failed - missing required fields');
      Alert.alert(tRef.current('common.error'), tRef.current('products.requiredFieldsError'));
      return;
    }

    // Handle image copy: https passthrough, file:// -> try copy, fail->null
    let finalImageUrl: string | undefined = currentImageUrl || undefined;
    if (finalImageUrl && !finalImageUrl.startsWith('http')) {
      const productsDir = Paths.document.uri + 'products/';
      if (!finalImageUrl.startsWith(productsDir)) {
        try {
          finalImageUrl = await saveImagePermanently(finalImageUrl);
        } catch (e) {
          LoggingService.warning('useProductSave', 'Image copy failed, fallback to null', e);
          finalImageUrl = undefined;
        }
      }
    }

    const productData: Partial<Product> & { quantities: Product['quantities'] } = {
      name: currentName,
      brand: currentBrand || '',
      category: currentCategory,
      quantities: currentQuantities.map(q => ({ quantity: Number(q.quantity.replace(',', '.')), unit: q.unit })),
      purchaseDate: currentPurchaseDate,
      expirationDate: currentExpirationDate,
      notes: currentNotes || '',
      status: 'active',
      addedMethod: currentAddedMethod === 'photo' ? 'photo' : currentBarcode ? 'barcode' : 'manual',
      barcode: currentBarcode || '',
      imageUrl: finalImageUrl,
      isFrozen: currentIsFrozen,
    };

    if (currentIsEditMode && currentOriginalProductId) {
      productData.id = currentOriginalProductId;
    }

    LoggingService.info('useProductSave', "Attempting to save product with data:", JSON.stringify({ ...productData, expirationDate }, null, 2));

    try {
      LoggingService.info('useProductSave', 'Calling ProductStorage.saveProduct...');
      const saveResult = await ProductStorage.saveProduct(productData);
      if (!saveResult.success) {
        throw new ProductSaveError(saveResult.error, saveResult.errorCode === 'timeout' ? 'timeout' : 'failed');
      }
      const savedProductName = currentName;
      LoggingService.info('useProductSave', `Product saved successfully: ${savedProductName}`);

      LoggingService.info('useProductSave', `handleSaveProduct check: isEditMode=${currentIsEditMode}`);

      if (currentIsEditMode) {
        Alert.alert(tRef.current('products.updatedTitle'), tRef.current('products.updatedMessage', { name: savedProductName }));
        try {
          router.replace('/(tabs)/products');
        } catch (navError) {
          LoggingService.error('useProductSave', 'Edit mode navigation failed', navError);
        }
        return;
      }

      // Queue branch BEFORE normal Alert (spec :141)
      if (!recentProductQueue.isEmpty()) {
        LoggingService.info('useProductSave', `Queue advance: queue size before advance=${recentProductQueue.size()}`);
        recentProductQueue.advance();
        const next = recentProductQueue.peekNext();
        LoggingService.info('useProductSave', `Queue after advance: next product=${next?.name || 'null'}, remaining=${recentProductQueue.size()}`);
        
        if (next) {
          const params: Record<string, string> = {
            name: next.name,
            purchaseDate: getLocalISODate(),
            resetForm: 'true',
          };
          if (next.brand) params.brand = next.brand;
          if (next.barcode) params.barcode = next.barcode;
          if (next.imageUrl) params.imageUrl = next.imageUrl;
          if (next.selectedCategory) params.selectedCategory = next.selectedCategory;
          if (next.notes) params.notes = next.notes;
          if (next.isFrozen) params.isFrozen = String(next.isFrozen);
          
          // Suppress form clear: next screen will initialize via useProductInitialization
          try {
            LoggingService.info('useProductSave', `Navigating to next product: ${next.name}`);
            router.replace({ pathname: '/manual-entry', params });
          } catch (navError) {
            LoggingService.error('useProductSave', 'Queue advance navigation failed', navError);
            currentClearForm();
            try {
              router.replace('/(tabs)/products');
            } catch (fallbackNavError) {
              LoggingService.error('useProductSave', 'Fallback navigation also failed', fallbackNavError);
            }
          Alert.alert(tRef.current('common.error'), tRef.current('products.openNextError'));
          }
        } else {
          LoggingService.info('useProductSave', 'Queue empty after advance, navigating to products');
          currentClearForm();
          try {
            router.replace('/(tabs)/products');
          } catch (navError) {
            LoggingService.error('useProductSave', 'Final navigation failed after queue completion', navError);
            Alert.alert(tRef.current('common.error'), tRef.current('products.returnToListError'));
          }
        }
        return;
      }

      LoggingService.info('useProductSave', 'Showing success alert for new product');
      Alert.alert(
        tRef.current('products.savedTitle'),
        tRef.current('products.savedMessage', { name: savedProductName }),
        [
          { text: tRef.current('products.addManuallyAction'), onPress: () => { LoggingService.info('useProductSave', 'User chose to add manually'); currentClearForm(); } },
          { text: tRef.current('products.scanCodeAction'), onPress: () => {
            LoggingService.info('useProductSave', 'User chose to scan barcode'); 
            currentClearForm(); 
            try {
              router.replace('/scanner');
            } catch (navError) {
              LoggingService.error('useProductSave', 'Navigation to scanner failed', navError);
            }
          } },
          { text: tRef.current('common.done'), onPress: () => {
            LoggingService.info('useProductSave', 'User chose to finish'); 
            currentClearForm(); 
            try {
              router.replace('/(tabs)/products');
            } catch (navError) {
              LoggingService.error('useProductSave', 'Navigation to products failed', navError);
            }
          }, style: 'cancel' },
        ],
        { cancelable: false }
      );

    } catch (error: unknown) {
      LoggingService.error('useProductSave', 'Errore durante il salvataggio del prodotto:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      LoggingService.error('useProductSave', `Save failed with error: ${errorMessage}`);

      // Queue active: clear queue and show Alert per spec
      if (!recentProductQueue.isEmpty() && !formValuesRef.current.isEditMode) {
        recentProductQueue.clear();
      }

      if (error instanceof ProductSaveError && error.code === 'timeout') {
        Alert.alert(
          tRef.current('products.saveTimeoutTitle'),
          tRef.current('products.saveTimeoutMessage'),
          [
            { text: tRef.current('common.ok'), style: 'cancel' },
            { text: tRef.current('common.retry'), onPress: () => handleSaveProduct() }
          ]
        );
      } else {
        Alert.alert(tRef.current('common.error'), tRef.current('products.saveFailedMessage'));
      }
    }
  }, []); // Nessuna dipendenza - usa sempre i valori correnti dal ref

  return {
    handleSaveProduct,
  };
};
