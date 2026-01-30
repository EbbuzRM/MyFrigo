import { useCallback } from 'react';
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

  const handleSaveProduct = useCallback(async () => {
    LoggingService.info('useProductSave', `handleSaveProduct called. Form state: name=${name}, selectedCategory=${selectedCategory}, quantities=${JSON.stringify(quantities)}, purchaseDate=${purchaseDate}, expirationDate=${expirationDate}`);

    const areQuantitiesValid = quantities.every(q => q.quantity.trim() !== '' && parseFloat(q.quantity.replace(',', '.')) > 0 && q.unit.trim() !== '');
    LoggingService.info('useProductSave', `Quantities validation: ${areQuantitiesValid}, quantities: ${JSON.stringify(quantities)}`);

    if (!name || !selectedCategory || quantities.length === 0 || !areQuantitiesValid || !purchaseDate || !expirationDate) {
      LoggingService.error('useProductSave', 'Validation failed - missing required fields');
      Alert.alert('Errore', 'Per favore, compila tutti i campi obbligatori, inclusa almeno una quantità valida.');
      return;
    }

    const productData: Partial<Product> & { quantities: Product['quantities'] } = {
      name,
      brand: brand || '',
      category: selectedCategory,
      quantities: quantities.map(q => ({ quantity: Number(q.quantity.replace(',', '.')), unit: q.unit })),
      purchaseDate,
      expirationDate,
      notes: notes || '',
      status: 'active',
      addedMethod: params.addedMethod === 'photo' ? 'photo' : barcode ? 'barcode' : 'manual',
      barcode: barcode || '',
      imageUrl: imageUrl || undefined,
      isFrozen: isFrozen,
    };

    if (isEditMode && originalProductId) {
      productData.id = originalProductId;
    }

    LoggingService.info('useProductSave', "Attempting to save product with data:", JSON.stringify({ ...productData, expirationDate }, null, 2));

    try {
      LoggingService.info('useProductSave', 'Calling ProductStorage.saveProduct...');
      await ProductStorage.saveProduct(productData);
      const savedProductName = name;
      LoggingService.info('useProductSave', `Product saved successfully: ${savedProductName}`);

      LoggingService.info('useProductSave', `handleSaveProduct check: isEditMode=${isEditMode}`);

      if (isEditMode) {
        Alert.alert('Prodotto Aggiornato', `${savedProductName} è stato aggiornato con successo.`);
        router.replace('/(tabs)/products');
        return;
      }

      LoggingService.info('useProductSave', 'Showing success alert for new product');
      Alert.alert(
        'Prodotto Salvato',
        `${savedProductName} è stato aggiunto. Cosa vuoi fare ora?`,
        [
          { text: 'Aggiungi Manualmente', onPress: () => { LoggingService.info('useProductSave', 'User chose to add manually'); clearForm(); } },
          { text: 'Scansiona Codice', onPress: () => { LoggingService.info('useProductSave', 'User chose to scan barcode'); clearForm(); router.replace('/scanner'); } },
          { text: 'Finito', onPress: () => { LoggingService.info('useProductSave', 'User chose to finish'); clearForm(); router.replace('/(tabs)/products'); }, style: 'cancel' },
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
  }, [name, brand, selectedCategory, quantities, purchaseDate, expirationDate, notes, barcode, imageUrl, isEditMode, originalProductId, params.addedMethod, clearForm, isFrozen]);

  return {
    handleSaveProduct,
  };
};
