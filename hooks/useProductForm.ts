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
    initializeForm,
    clearForm
  } = useManualEntry();

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

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (productId) {
          LoggingService.info('useProductForm', `Loading product for edit with ID: ${productId}`);
          const productToEdit = await ProductStorage.getProductById(productId);
          if (productToEdit) {
            initializeForm({
              product: productToEdit,
              isEditMode: true,
              originalProductId: productToEdit.id,
              hasManuallySelectedCategory: true,
            });
          }
        } else {
          LoggingService.info('useProductForm', 'Initializing form for new product or from params.');
          const initialData = { ...params };
          delete initialData.productId;
          initializeForm(initialData as Partial<ManualEntryFormData>);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

  }, [productId, initializeForm]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        LoggingService.info('useProductForm', 'Screen unfocused, clearing form.');
        clearForm();
      };
    }, [clearForm])
  );

  useEffect(() => {
    if (params.fromPhotoCapture && params.imageUrl) {
      const url = Array.isArray(params.imageUrl) ? params.imageUrl[0] : params.imageUrl;
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
            setSelectedCategory(guessedCategoryId);
        }
    }
  }, [name, brand, isEditMode, hasManuallySelectedCategory, categories, categoriesLoading, guessCategory, selectedCategory]);

  const handleAddNewCategory = useCallback(async () => {
    if (!newCategoryNameInput.trim()) {
      Alert.alert('Errore', 'Il nome della categoria non può essere vuoto.');
      return;
    }
    try {
      const newCategory = await addCategory(newCategoryNameInput);
      if (newCategory) {
        setSelectedCategory(newCategory.id);
        setHasManuallySelectedCategory(true);
      }
      setIsCategoryModalVisible(false);
      setNewCategoryNameInput('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Si è verificato un errore sconosciuto.';
      Alert.alert('Errore', message);
    }
  }, [newCategoryNameInput, addCategory, setHasManuallySelectedCategory]);

  const handleCategoryChange = useCallback((itemValue: string) => {
    if (itemValue === ADD_NEW_CATEGORY_ID) {
      setNewCategoryNameInput('');
      setIsCategoryModalVisible(true);
    } else {
      setSelectedCategory(itemValue);
      setHasManuallySelectedCategory(true);
    }
  }, [setHasManuallySelectedCategory]);

  const onChangePurchaseDate = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPurchaseDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setPurchaseDate(selectedDate.toISOString().split('T')[0]);
    }
  }, [setPurchaseDate]);

  const onChangeExpirationDate = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowExpirationDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      const newDate = selectedDate.toISOString().split('T')[0];
      setExpirationDate(newDate);
    }
  }, [setExpirationDate]);
  const handleSaveProduct = useCallback(async () => {
    const areQuantitiesValid = quantities.every(q => q.quantity.trim() !== '' && parseFloat(q.quantity.replace(',', '.')) > 0 && q.unit.trim() !== '');

    if (!name || !selectedCategory || quantities.length === 0 || !areQuantitiesValid || !purchaseDate || !expirationDate) {
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
    };

    if (isEditMode && originalProductId) {
      productData.id = originalProductId;
    }

    LoggingService.info('ManualEntry', "Attempting to save product with data:", JSON.stringify({ ...productData, expirationDate }, null, 2));

    try {
      await ProductStorage.saveProduct(productData);
      const savedProductName = name;
      
      if (isEditMode) {
        Alert.alert('Prodotto Aggiornato', `${savedProductName} è stato aggiornato con successo.`);
        router.replace('/(tabs)/products');
        return;
      }

      Alert.alert(
        'Prodotto Salvato',
        `${savedProductName} è stato aggiunto. Cosa vuoi fare ora?`,
        [
          { text: 'Aggiungi Manualmente', onPress: () => clearForm() },
          { text: 'Scansiona Codice', onPress: () => { clearForm(); router.replace('/scanner'); } },
          { text: 'Finito', onPress: () => router.replace('/(tabs)/products'), style: 'cancel' },
        ],
        { cancelable: false }
      );
    } catch (error: unknown) {
      LoggingService.error('ManualEntry', 'Errore durante il salvataggio del prodotto:', error);
      Alert.alert('Errore', 'Si è verificato un errore durante il salvataggio del prodotto.');
    }
  }, [name, brand, selectedCategory, quantities, purchaseDate, expirationDate, notes, barcode, imageUrl, isEditMode, originalProductId, params.addedMethod, clearForm]);

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
  };
};