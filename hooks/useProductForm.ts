import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Alert } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ProductStorage } from '@/services/ProductStorage';
import { useCategories } from '@/context/CategoryContext';
import { useManualEntry, ManualEntryFormData } from '@/context/ManualEntryContext';
import { LoggingService, LogLevel } from '@/services/LoggingService';
import { ProductCategory, Product, ISODateString } from '@/types/Product';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';


export const useProductForm = () => {
  const { categories, addCategory, loading: categoriesLoading } = useCategories();
  const params = useLocalSearchParams();
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
    hasManuallySelectedCategory, setHasManuallySelectedCategory,
    isInitialized, setIsInitialized, // Get from context
    isFrozen, setIsFrozen,
    initializeForm,
    clearForm
  } = useManualEntry();

  LoggingService.info('useProductForm_RENDER', `Hook rendering. isEditMode from context: ${isEditMode}`);

  const [isLoading, setIsLoading] = useState(true);
  const [showPurchaseDatePicker, setShowPurchaseDatePicker] = useState(false);
  const [showExpirationDatePicker, setShowExpirationDatePicker] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [newCategoryNameInput, setNewCategoryNameInput] = useState('');
  const navigatingToPhotoCapture = useRef(false);

  const ADD_NEW_CATEGORY_ID = 'add_new_category_sentinel_value';

  const productId = useMemo(() =>
    Array.isArray(params.productId) ? params.productId[0] : params.productId,
    [params.productId]
  );

  // Create a stable key for tracking when scanner data changes
  const scannerDataKey = useMemo(() => {
    return `${params.barcode || ''}-${params.fromPhotoCapture ? 'photo' : 'none'}`;
  }, [params.barcode, params.fromPhotoCapture]);

  // Sostituisce useEffect con un approccio più diretto basato su useCallback
  const loadData = useCallback(async () => {
    // Capture current params at this moment
    const currentParams = { ...params };

    LoggingService.info('useProductForm_LOAD', `Loading data. productId: ${productId}`);
    LoggingService.info('useProductForm_LOAD', `Params: ${JSON.stringify(currentParams)}`);
    LoggingService.info('useProductForm_LOAD', `isInitialized: ${isInitialized}, categoriesLoading: ${categoriesLoading}, scannerKey: ${scannerDataKey}`);

    // Check if we need to skip initialization
    // REMOVED: Skip logic that prevented form reset after saving
    // Previously, if (isInitialized && !productId && !hasScannerData) would prevent re-initialization
    // This caused the form to retain previous product values when adding a new product manually


    setIsLoading(true);
    try {
      if (productId) {
        LoggingService.info('useProductForm', `Loading product for edit with ID: ${productId}`);
        const productToEdit = await ProductStorage.getProductById(productId);
        if (productToEdit) {
          LoggingService.info('useProductForm', `Product loaded successfully: ${productToEdit.name}`);
          initializeForm({
            product: productToEdit,
            isEditMode: true,
            originalProductId: productToEdit.id,
            hasManuallySelectedCategory: true,
          });
        } else {
          LoggingService.error('useProductForm', `Product with ID ${productId} not found`);
        }
      } else {
        LoggingService.info('useProductForm', 'Initializing form for new product or from params.');
        const initialData = { ...currentParams };
        delete initialData.productId;
        LoggingService.info('useProductForm', `Initializing form with data: ${JSON.stringify(initialData)}`);
        initializeForm(initialData as Partial<ManualEntryFormData>);
      }
      setIsInitialized(true);
      LoggingService.info('useProductForm_LOAD', 'Data loading completed successfully');
    } catch (error) {
      LoggingService.error('useProductForm_LOAD', 'Error during data loading:', error);
    } finally {
      setIsLoading(false);
      LoggingService.info('useProductForm_LOAD', 'Setting isLoading to false');
    }
  }, [productId, initializeForm, isInitialized, categoriesLoading, scannerDataKey]);

  // Effect più semplice che gestisce solo la chiamata a loadData
  useEffect(() => {
    LoggingService.info('useProductForm', 'useEffect triggered for loadData');
    loadData();
  }, [loadData]);

  // useFocusEffect(
  //   useCallback(() => {
  //     LoggingService.info('useProductForm', 'Screen focused');
  //     return () => {
  //       LoggingService.info('useProductForm', 'Screen unfocused, clearing form.');
  //       clearForm();
  //     };
  //   }, [clearForm])
  // );

  useEffect(() => {
    if (params.fromPhotoCapture && params.imageUrl) {
      const url = Array.isArray(params.imageUrl) ? params.imageUrl[0] : params.imageUrl;
      LoggingService.info('useProductForm', `Setting imageUrl from photo capture: ${url}`);
      if (url) setImageUrl(url);
    }
  }, [params.fromPhotoCapture, params.imageUrl]);

  const guessCategory = useCallback((productName: string, productBrand: string, allCategories: ProductCategory[]): string | null => {
    const fullText = `${productName.toLowerCase()} ${productBrand.toLowerCase()}`;
    const keywordMap: { [key: string]: string[] } = {
      'milk': ['latte'],
      'dairy': ['formaggio', 'yogurt', 'mozzarella', 'ricotta', 'burro', 'panna', 'mascarpone'],
      'meat': ['pollo', 'manzo', 'maiale', 'salsiccia', 'prosciutto', 'salame', 'tacchino', 'agnello', 'wurstel'],
      'fish': ['tonno', 'salmone', 'merluzzo', 'gamber', 'vongole', 'cozze', 'sogliola'],
      'fruits': ['mela', 'banana', 'arancia', 'fragola', 'uva', 'pesca', 'albicocca', 'kiwi'],
      'vegetables': ['pomodoro', 'insalata', 'zucchina', 'melanzana', 'carota', 'patata', 'cipolla', 'spinaci'],
      'frozen': ['gelato', 'pizz', 'basta', 'minestrone', 'patatine fritte'],
      'beverages': ['acqua', 'succo', 'aranciata', 'cola', 'vino', 'birra', 'tè', 'caffè'],
      'canned': ['pasta', 'riso', 'pane', 'biscotti', 'farina', 'zucchero', 'sale', 'olio', 'aceto', 'conserve', 'pelati', 'legumi', 'fagioli', 'ceci', 'lenticchie'],
      'snacks': ['patatine', 'cioccolato', 'caramelle', 'merendine', 'cracker', 'taralli'],
      'grains': ['cereali', 'fette biscottate', 'marmellata', 'croissant'],
      'condiments': ['maionese', 'ketchup', 'senape', 'salsa'],
      'eggs': ['uova', 'uovo'],
      'sweets': ['torta', 'crostata', 'budino', 'pasticcini'],
    };

    for (const categoryId in keywordMap) {
      if (keywordMap[categoryId].some(keyword => fullText.includes(keyword))) {
        if (allCategories.some(cat => cat.id === categoryId)) return categoryId;
      }
    }
    return null;
  }, []);

  useEffect(() => {
    if (!isEditMode && !hasManuallySelectedCategory && (name || brand) && !categoriesLoading) {
      const guessedCategoryId = guessCategory(name, brand, categories);
      if (guessedCategoryId && guessedCategoryId !== selectedCategory) {
        LoggingService.info('useProductForm', `Guessed category: ${guessedCategoryId} for name: ${name}, brand: ${brand}`);
        setSelectedCategory(guessedCategoryId);
      }
    }
  }, [name, brand, isEditMode, hasManuallySelectedCategory, categories, categoriesLoading, guessCategory, selectedCategory]);

  const handleAddNewCategory = useCallback(async () => {
    LoggingService.info('useProductForm', `handleAddNewCategory called with name: ${newCategoryNameInput}`);
    if (!newCategoryNameInput.trim()) {
      Alert.alert('Errore', 'Il nome della categoria non può essere vuoto.');
      return;
    }
    try {
      const newCategory = await addCategory(newCategoryNameInput);
      if (newCategory) {
        LoggingService.info('useProductForm', `New category created: ${newCategory.id} - ${newCategory.name}`);
        setSelectedCategory(newCategory.id);
        setHasManuallySelectedCategory(true);
      }
      setIsCategoryModalVisible(false);
      setNewCategoryNameInput('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Si è verificato un errore sconosciuto.';
      LoggingService.error('useProductForm', `Error creating category: ${message}`);
      Alert.alert('Errore', message);
    }
  }, [newCategoryNameInput, addCategory, setHasManuallySelectedCategory]);

  const handleCategoryChange = useCallback((itemValue: string) => {
    LoggingService.info('useProductForm', `handleCategoryChange called with: ${itemValue}`);
    if (itemValue === ADD_NEW_CATEGORY_ID) {
      LoggingService.info('useProductForm', 'Opening add new category modal');
      setNewCategoryNameInput('');
      setIsCategoryModalVisible(true);
    } else {
      LoggingService.info('useProductForm', `Setting selected category to: ${itemValue}`);
      setSelectedCategory(itemValue);
      setHasManuallySelectedCategory(true);
    }
  }, [setHasManuallySelectedCategory]);

  const onChangePurchaseDate = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    LoggingService.info('useProductForm', `onChangePurchaseDate called with event.type: ${event.type}`);
    setShowPurchaseDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      LoggingService.info('useProductForm', `Setting purchase date to: ${dateString}`);
      setPurchaseDate(dateString);
    }
  }, [setPurchaseDate]);

  const onChangeExpirationDate = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    LoggingService.info('useProductForm', `onChangeExpirationDate called with event.type: ${event.type}`);
    setShowExpirationDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      const newDate = selectedDate.toISOString().split('T')[0];
      LoggingService.info('useProductForm', `Setting expiration date to: ${newDate}`);
      setExpirationDate(newDate);
    }
  }, [setExpirationDate]);
  const handleSaveProduct = useCallback(async () => {
    LoggingService.info('useProductForm', `handleSaveProduct called. Form state: name=${name}, selectedCategory=${selectedCategory}, quantities=${JSON.stringify(quantities)}, purchaseDate=${purchaseDate}, expirationDate=${expirationDate}`);

    const areQuantitiesValid = quantities.every(q => q.quantity.trim() !== '' && parseFloat(q.quantity.replace(',', '.')) > 0 && q.unit.trim() !== '');
    LoggingService.info('useProductForm', `Quantities validation: ${areQuantitiesValid}, quantities: ${JSON.stringify(quantities)}`);

    if (!name || !selectedCategory || quantities.length === 0 || !areQuantitiesValid || !purchaseDate || !expirationDate) {
      LoggingService.error('useProductForm', 'Validation failed - missing required fields');
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

    LoggingService.info('ManualEntry', "Attempting to save product with data:", JSON.stringify({ ...productData, expirationDate }, null, 2));

    try {
      LoggingService.info('useProductForm', 'Calling ProductStorage.saveProduct...');
      await ProductStorage.saveProduct(productData);
      const savedProductName = name;
      LoggingService.info('useProductForm', `Product saved successfully: ${savedProductName}`);

      LoggingService.info('useProductForm', `handleSaveProduct check: isEditMode=${isEditMode}`);

      if (isEditMode) {
        Alert.alert('Prodotto Aggiornato', `${savedProductName} è stato aggiornato con successo.`);
        router.replace('/(tabs)/products');
        return;
      }

      LoggingService.info('useProductForm', 'Showing success alert for new product');
      Alert.alert(
        'Prodotto Salvato',
        `${savedProductName} è stato aggiunto. Cosa vuoi fare ora?`,
        [
          { text: 'Aggiungi Manualmente', onPress: () => { LoggingService.info('useProductForm', 'User chose to add manually'); clearForm(); } },
          { text: 'Scansiona Codice', onPress: () => { LoggingService.info('useProductForm', 'User chose to scan barcode'); clearForm(); router.replace('/scanner'); } },
          { text: 'Finito', onPress: () => { LoggingService.info('useProductForm', 'User chose to finish'); clearForm(); router.replace('/(tabs)/products'); }, style: 'cancel' },
        ],
        { cancelable: false }
      );

    } catch (error: unknown) {
      LoggingService.error('ManualEntry', 'Errore durante il salvataggio del prodotto:', error);
      // Gestisci meglio gli errori specifici
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      LoggingService.error('useProductForm', `Save failed with error: ${errorMessage}`);

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
  }, [categories]);

  return {
    isLoading,
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
    showPurchaseDatePicker, setShowPurchaseDatePicker,
    showExpirationDatePicker, setShowExpirationDatePicker,
    isCategoryModalVisible, setIsCategoryModalVisible,
    newCategoryNameInput, setNewCategoryNameInput,
    navigatingToPhotoCapture,
    categories,
    categoriesLoading,
    categoryData,
    handleAddNewCategory,
    handleCategoryChange,
    onChangePurchaseDate,
    onChangeExpirationDate,
    handleSaveProduct,
    isFrozen, setIsFrozen,
  };
};
