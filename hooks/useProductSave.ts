import { useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ProductStorage } from '@/services/ProductStorage';
import { useManualEntry } from '@/context/ManualEntryContext';
import { LoggingService } from '@/services/LoggingService';
import { Product } from '@/types/Product';

export interface UseProductSaveReturn {
  handleSaveProduct: () => Promise<void>;
}

export const useProductSave = (): UseProductSaveReturn => {
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

  // Aggiorna il ref ad ogni cambio di stato
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
      Alert.alert('Errore', 'Per favore, compila tutti i campi obbligatori, inclusa almeno una quantità valida.');
      return;
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
      imageUrl: currentImageUrl || undefined,
      isFrozen: currentIsFrozen,
    };

    if (currentIsEditMode && currentOriginalProductId) {
      productData.id = currentOriginalProductId;
    }

    LoggingService.info('useProductSave', "Attempting to save product with data:", JSON.stringify({ ...productData, expirationDate }, null, 2));

    try {
      LoggingService.info('useProductSave', 'Calling ProductStorage.saveProduct...');
      await ProductStorage.saveProduct(productData);
      const savedProductName = currentName;
      LoggingService.info('useProductSave', `Product saved successfully: ${savedProductName}`);

      LoggingService.info('useProductSave', `handleSaveProduct check: isEditMode=${currentIsEditMode}`);

      if (currentIsEditMode) {
        Alert.alert('Prodotto Aggiornato', `${savedProductName} è stato aggiornato con successo.`);
        router.replace('/(tabs)/products');
        return;
      }

      LoggingService.info('useProductSave', 'Showing success alert for new product');
      Alert.alert(
        'Prodotto Salvato',
        `${savedProductName} è stato aggiunto. Cosa vuoi fare ora?`,
        [
          { text: 'Aggiungi Manualmente', onPress: () => { LoggingService.info('useProductSave', 'User chose to add manually'); currentClearForm(); } },
          { text: 'Scansiona Codice', onPress: () => { LoggingService.info('useProductSave', 'User chose to scan barcode'); currentClearForm(); router.replace('/scanner'); } },
          { text: 'Finito', onPress: () => { LoggingService.info('useProductSave', 'User chose to finish'); currentClearForm(); router.replace('/(tabs)/products'); }, style: 'cancel' },
        ],
        { cancelable: false }
      );

    } catch (error: unknown) {
      LoggingService.error('useProductSave', 'Errore durante il salvataggio del prodotto:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      LoggingService.error('useProductSave', `Save failed with error: ${errorMessage}`);

      if (errorMessage.includes('Timeout')) {
        Alert.alert(
          'Timeout',
          'Il salvataggio ha impiegato troppo tempo. Assicurati di avere una connessione stabile.',
          [
            { text: 'OK', style: 'cancel' },
            { text: 'Riprova', onPress: () => handleSaveProduct() }
          ]
        );
      } else {
        Alert.alert('Errore', `${errorMessage}. Riprova o contatta il supporto.`);
      }
    }
  }, []); // Nessuna dipendenza - usa sempre i valori correnti dal ref

  return {
    handleSaveProduct,
  };
};
