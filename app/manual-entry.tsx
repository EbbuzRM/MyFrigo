import { AnimatedPressable } from '@/components/AnimatedPressable';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  Modal,
  FlatList,
  ScrollView,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Product, ProductCategory } from '@/types/Product';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import { StorageService } from '@/services/StorageService';
import { CustomDatePicker } from '@/components/CustomDatePicker';
import { useTheme } from '@/context/ThemeContext';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useCategories } from '@/context/CategoryContext';
import { LoggingService } from '@/services/LoggingService';
import { formStateLogger } from '@/utils/FormStateLogger';

const COMMON_UNITS = [
  { id: 'pz', name: 'pz (pezzi)' },
  { id: 'kg', name: 'kg (chilogrammi)' },
  { id: 'g', name: 'g (grammi)' },
  { id: 'L', name: 'L (litri)' },
  { id: 'ml', name: 'ml (millilitri)' },
  { id: 'conf', name: 'conf. (confezione)' },
  { id: 'barattolo', name: 'barattolo' },
  { id: 'bottiglia', name: 'bottiglia' },
  { id: 'vasetto', name: 'vasetto' },
];

interface ProductFormHeaderProps {
  isEditMode: boolean;
  imageUrl: string | null;
  barcode: string;
  name: string;
  brand: string;
  selectedCategory: string;
  quantity: string;
  unit: string;
  purchaseDate: string;
  expirationDate: string;
  notes: string;
  setName: (value: string) => void;
  setBrand: (value: string) => void;
  styles: any; // Migliora con tipi specifici se possibile
  navigatingToPhotoCapture: React.MutableRefObject<boolean>;
}
const ProductFormHeader = React.memo(({
  isEditMode,
  imageUrl,
  barcode,
  name,
  brand,
  selectedCategory,
  quantity,
  unit,
  purchaseDate,
  expirationDate,
  notes,
  setName,
  setBrand,
  styles,
  navigatingToPhotoCapture
}: ProductFormHeaderProps) => {
  return (
  <>
    <Text style={styles.title}>{isEditMode ? 'Modifica Prodotto' : 'Inserimento Manuale'}</Text>
    {!imageUrl && !isEditMode && (
      <TouchableOpacity
        style={styles.takePhotoButton}
        onPress={() => {
          // Salva lo stato corrente del form prima di navigare
          const currentFormData = {
            name: name,
            brand: brand,
            selectedCategory: selectedCategory,
            quantity: quantity,
            unit: unit,
            purchaseDate: purchaseDate,
            expirationDate: expirationDate,
            notes: notes,
            barcode: barcode,
            fromManualEntry: 'true'
          };
          
          // Registra la navigazione
          formStateLogger.logNavigation('TAKE_PHOTO', 'manual-entry', 'photo-capture', currentFormData);
          
          // Imposta il flag di navigazione
          navigatingToPhotoCapture.current = true;
          
          // Naviga alla schermata di cattura foto
          router.push({
            pathname: '/photo-capture',
            params: currentFormData
          });
          
          // Resetta il flag dopo un breve ritardo
          setTimeout(() => {
            navigatingToPhotoCapture.current = false;
          }, 500);
        }}
      >
        <Text style={styles.takePhotoButtonText}>Scatta Foto Prodotto</Text>
      </TouchableOpacity>
    )}
    {imageUrl && (
      <>
        <Text style={styles.label}>Immagine Prodotto</Text>
        <Image source={{ uri: imageUrl }} style={styles.productImagePreview} />
      </>
    )}
    {barcode && !imageUrl && (
      <>
        <Text style={styles.label}>Codice a Barre Scansionato</Text>
        <TextInput style={[styles.input, styles.disabledInput]} value={barcode} editable={false} />
      </>
    )}
    <Text style={styles.label}>Nome Prodotto*</Text>
    <TextInput
      style={styles.input}
      value={name}
      onChangeText={setName}
      placeholder="Es. Latte Parzialmente Scremato"
      placeholderTextColor={styles.placeholder.color}
    />
    <Text style={styles.label}>Marca</Text>
    <TextInput
      style={styles.input}
      value={brand}
      onChangeText={setBrand}
      placeholder="Es. Granarolo"
      placeholderTextColor={styles.placeholder.color}
    />
    <Text style={styles.label}>Categoria*</Text>
  </>
  );
});

interface ProductFormFooterProps {
  quantity: string;
  unit: string;
  purchaseDate: string;
  expirationDate: string;
  notes: string;
  setQuantity: (value: string) => void;
  setUnit: (value: string) => void;
  setShowPurchaseDatePicker: (value: boolean) => void;
  setShowExpirationDatePicker: (value: boolean) => void;
  setNotes: (value: string) => void;
  handleSaveProduct: () => void;
  isEditMode: boolean;
  showPurchaseDatePicker: boolean;
  showExpirationDatePicker: boolean;
  onChangePurchaseDate: (event: DateTimePickerEvent, selectedDate?: Date) => void;
  onChangeExpirationDate: (event: DateTimePickerEvent, selectedDate?: Date) => void;
  styles: any;
  name: string;
  brand: string;
  selectedCategory: string;
  barcode: string;
  imageUrl: string | null;
  loading: boolean;
  navigatingToPhotoCapture: React.MutableRefObject<boolean>;
}
const ProductFormFooter = React.memo(({
  quantity,
  unit,
  purchaseDate,
  expirationDate,
  notes,
  setQuantity,
  setUnit,
  setShowPurchaseDatePicker,
  setShowExpirationDatePicker,
  setNotes,
  handleSaveProduct,
  isEditMode,
  showPurchaseDatePicker,
  showExpirationDatePicker,
  onChangePurchaseDate,
  onChangeExpirationDate,
  styles,
  name,
  brand,
  selectedCategory,
  barcode,
  imageUrl,
  loading,
  navigatingToPhotoCapture
}: ProductFormFooterProps) => (
  <>
    <View style={styles.row}>
      <View style={styles.column}>
        <Text style={styles.label}>Quantità*</Text>
        <View style={styles.quantityContainer}>
          <AnimatedPressable onPress={() => { const newValue = String(Math.max(1, parseInt(quantity, 10) - 1)); setQuantity(newValue); }} style={styles.quantityButton}>
            <Text style={styles.quantityButtonText}>-</Text>
          </AnimatedPressable>
          <TextInput
            style={styles.quantityInput}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholderTextColor={styles.placeholder.color}
          />
          <AnimatedPressable onPress={() => { const newValue = String(parseInt(quantity, 10) + 1); setQuantity(newValue); }} style={styles.quantityButton}>
            <Text style={styles.quantityButtonText}>+</Text>
          </AnimatedPressable>
        </View>
      </View>
      <View style={styles.column}>
        <Text style={styles.label}>Unità*</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={unit} style={styles.picker} onValueChange={itemValue => setUnit(itemValue)} dropdownIconColor={styles.picker.color}>
            {COMMON_UNITS.map(u => <Picker.Item key={u.id} label={u.name} value={u.id} />)}
          </Picker>
        </View>
      </View>
    </View>
    <Text style={styles.label}>Data di Acquisto*</Text>
    <TouchableOpacity onPress={() => setShowPurchaseDatePicker(true)} style={styles.dateInputTouchable}>
      <Text style={styles.dateTextValue}>{purchaseDate ? new Date(purchaseDate).toLocaleDateString('it-IT') : 'Seleziona Data'}</Text>
    </TouchableOpacity>
    {showPurchaseDatePicker && <CustomDatePicker value={new Date(purchaseDate || Date.now())} onChange={onChangePurchaseDate} onClose={() => setShowPurchaseDatePicker(false)} maximumDate={new Date()} />}
    <View style={styles.labelRow}>
      <Text style={styles.label}>Data di Scadenza*</Text>
      <TouchableOpacity
        style={styles.photoButton}
        onPress={() => {
          // Salva lo stato corrente del form prima di navigare
          const currentFormData = {
            name: name,
            brand: brand,
            selectedCategory: selectedCategory,
            quantity: quantity,
            unit: unit,
            purchaseDate: purchaseDate,
            expirationDate: expirationDate,
            notes: notes,
            barcode: barcode,
            imageUrl: imageUrl,
            captureMode: 'expirationDateOnly'
          };
          
          // Registra la navigazione
          formStateLogger.logNavigation('CAPTURE_EXPIRATION', 'manual-entry', 'photo-capture', currentFormData);
          
          // Imposta il flag di navigazione
          navigatingToPhotoCapture.current = true;
          
          // Naviga alla schermata di cattura foto
          router.push({
            pathname: '/photo-capture',
            params: currentFormData
          });
          
          // Resetta il flag dopo un breve ritardo
          setTimeout(() => {
            navigatingToPhotoCapture.current = false;
          }, 500);
        }}
      >
        <Text style={styles.photoButtonText}>Fotografa la scadenza</Text>
      </TouchableOpacity>
    </View>
    <Text style={styles.helperText}>Puoi anche selezionare una foto dalla galleria nella schermata della fotocamera.</Text>
    <TouchableOpacity onPress={() => setShowExpirationDatePicker(true)} style={styles.dateInputTouchable}>
      <Text style={styles.dateTextValue}>{expirationDate ? new Date(expirationDate).toLocaleDateString('it-IT') : 'Seleziona Data'}</Text>
    </TouchableOpacity>
    {showExpirationDatePicker && <CustomDatePicker value={new Date(expirationDate || Date.now())} onChange={onChangeExpirationDate} onClose={() => setShowExpirationDatePicker(false)} minimumDate={new Date()} />}
    <Text style={styles.label}>Note</Text>
    <TextInput
      style={[styles.input, styles.textArea]}
      value={notes}
      onChangeText={setNotes}
      placeholder="Eventuali note aggiuntive..."
      multiline
      numberOfLines={3}
      placeholderTextColor={styles.placeholder.color}
    />
    <TouchableOpacity style={[styles.saveButton, loading && styles.saveButtonDisabled]} onPress={handleSaveProduct} disabled={loading}>
      {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveButtonText}>{isEditMode ? 'Aggiorna Prodotto' : 'Salva Prodotto'}</Text>}
    </TouchableOpacity>
  </>
), (prevProps, nextProps) => {
  // Confronto personalizzato per React.memo - assicura che il componente si ri-renderizzi quando unit cambia
  return (
    prevProps.quantity === nextProps.quantity &&
    prevProps.unit === nextProps.unit &&
    prevProps.purchaseDate === nextProps.purchaseDate &&
    prevProps.expirationDate === nextProps.expirationDate &&
    prevProps.notes === nextProps.notes &&
    prevProps.isEditMode === nextProps.isEditMode &&
    prevProps.showPurchaseDatePicker === nextProps.showPurchaseDatePicker &&
    prevProps.showExpirationDatePicker === nextProps.showExpirationDatePicker &&
    prevProps.loading === nextProps.loading &&
    prevProps.name === nextProps.name &&
    prevProps.brand === nextProps.brand &&
    prevProps.selectedCategory === nextProps.selectedCategory &&
    prevProps.barcode === nextProps.barcode &&
    prevProps.imageUrl === nextProps.imageUrl
  );
});

export default function ManualEntryScreen() {
  const { isDarkMode } = useTheme();
  const { categories, addCategory, loading } = useCategories();
  const params = useLocalSearchParams();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pz');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expirationDate, setExpirationDate] = useState('');
  const [notes, setNotes] = useState('');
  const [barcode, setBarcode] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalProductId, setOriginalProductId] = useState<string | null>(null);
  const [showPurchaseDatePicker, setShowPurchaseDatePicker] = useState(false);
  const [showExpirationDatePicker, setShowExpirationDatePicker] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [newCategoryNameInput, setNewCategoryNameInput] = useState('');
  const [hasManuallySelectedCategory, setHasManuallySelectedCategory] = useState(false);
  
  // Identificatore unico per questa istanza del form
  const formInstanceId = useRef(`manual-entry-${Date.now()}`).current;
  
  // Flag per tracciare se stiamo navigando verso la schermata di cattura foto
  const navigatingToPhotoCapture = useRef(false);

  const ADD_NEW_CATEGORY_ID = 'add_new_category_sentinel_value';

  const guessCategory = useCallback((productName: string, productBrand: string, allCategories: ProductCategory[]): string | null => {
    const fullText = `${productName.toLowerCase()} ${productBrand.toLowerCase()}`;
    
    const keywordMap: { [key: string]: string[] } = {
      'latticini': ['latte', 'formaggio', 'yogurt', 'mozzarella', 'ricotta', 'burro', 'panna', 'mascarpone'],
      'carne': ['pollo', 'manzo', 'maiale', 'salsiccia', 'prosciutto', 'salame', 'tacchino', 'agnello', 'wurstel'],
      'pesce': ['tonno', 'salmone', 'merluzzo', 'gamber', 'vongole', 'cozze', 'sogliola'],
      'frutta': ['mela', 'banana', 'arancia', 'fragola', 'uva', 'pesca', 'albicocca', 'kiwi'],
      'verdura': ['pomodoro', 'insalata', 'zucchina', 'melanzana', 'carota', 'patata', 'cipolla', 'spinaci'],
      'surgelati': ['gelato', 'pizz', 'basta', 'minestrone', 'patatine fritte'],
      'bevande': ['acqua', 'succo', 'aranciata', 'cola', 'vino', 'birra', 'tè', 'caffè'],
      'dispensa': ['pasta', 'riso', 'pane', 'biscotti', 'farina', 'zucchero', 'sale', 'olio', 'aceto', 'conserve', 'pelati', 'legumi', 'fagioli', 'ceci', 'lenticchie'],
      'snack': ['patatine', 'cioccolato', 'caramelle', 'merendine', 'cracker', 'taralli'],
      'colazione': ['cereali', 'fette biscottate', 'marmellata', 'croissant'],
      'condimenti': ['maionese', 'ketchup', 'senape', 'salsa'],
      'uova': ['uova', 'uovo'],
      'dolci': ['torta', 'crostata', 'budino', 'pasticcini'],
    };

    for (const categoryId in keywordMap) {
      const keywords = keywordMap[categoryId];
      if (keywords.some(keyword => fullText.includes(keyword))) {
        const categoryExists = allCategories.some(cat => cat.id === categoryId);
        if (categoryExists) {
          return categoryId;
        }
      }
    }
    
    return null;
  }, []);

  useEffect(() => {
    if (!isEditMode && !hasManuallySelectedCategory && (name || brand) && !loading) {
      const guessedCategoryId = guessCategory(name, brand, categories);
      if (guessedCategoryId && guessedCategoryId !== selectedCategory) {
        setSelectedCategory(guessedCategoryId);
      }
    }
  }, [name, brand, isEditMode, hasManuallySelectedCategory, categories, loading, guessCategory, selectedCategory]);
  
  // Preserva la categoria selezionata quando si torna dalla schermata di cattura foto
  useEffect(() => {
    if (params.fromPhotoCapture === 'true' && params.selectedCategory) {
      const categoryParam = Array.isArray(params.selectedCategory)
        ? params.selectedCategory[0]
        : params.selectedCategory;
      
      if (categoryParam) {
        LoggingService.info('ManualEntry', `Preserving selected category: ${categoryParam} after photo capture`);
        setSelectedCategory(categoryParam);
        setHasManuallySelectedCategory(true);
      }
    }
  }, [params.fromPhotoCapture, params.selectedCategory]);
  
  // Riferimenti ai valori iniziali per verificare se ci sono modifiche
  const initialValues = useRef<{
    name: string;
    brand: string;
    selectedCategory: string;
    quantity: string;
    unit: string;
    purchaseDate: string;
    expirationDate: string;
    notes: string;
    barcode: string;
    imageUrl: string | null;
  }>({
    name: '',
    brand: '',
    selectedCategory: '',
    quantity: '1',
    unit: 'pz',
    purchaseDate: new Date().toISOString().split('T')[0],
    expirationDate: '',
    notes: '',
    barcode: '',
    imageUrl: null
  });
  
  // Funzione per verificare se ci sono modifiche non salvate
  const hasUnsavedChanges = useCallback(() => {
    // Verifica se i valori attuali sono diversi dai valori iniziali
    return (
      name !== initialValues.current.name ||
      brand !== initialValues.current.brand ||
      selectedCategory !== initialValues.current.selectedCategory ||
      quantity !== initialValues.current.quantity ||
      unit !== initialValues.current.unit ||
      purchaseDate !== initialValues.current.purchaseDate ||
      expirationDate !== initialValues.current.expirationDate ||
      notes !== initialValues.current.notes ||
      barcode !== initialValues.current.barcode ||
      imageUrl !== initialValues.current.imageUrl
    );
  }, [
    isEditMode,
    name,
    brand,
    selectedCategory,
    quantity,
    unit,
    purchaseDate,
    expirationDate,
    notes,
    barcode,
    imageUrl
  ]);
  
  // Aggiorna i valori iniziali quando vengono caricati i parametri
  useEffect(() => {
    // Aggiorna i valori iniziali sia in modalità creazione che modifica
    initialValues.current = {
      name,
      brand,
      selectedCategory,
      quantity,
      unit,
      purchaseDate,
      expirationDate,
      notes,
      barcode,
      imageUrl
    };
    LoggingService.debug('ManualEntry', 'Valori iniziali impostati', initialValues.current);
  }, [loading, params.productId]);
  
  // Gestisce il pulsante indietro hardware
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      // Se stiamo navigando verso la schermata di cattura foto, salviamo lo stato del form
      if (navigatingToPhotoCapture.current) {
        return false; // Lascia che la navigazione proceda normalmente
      }
      
      // Esci direttamente senza conferma
      LoggingService.info('ManualEntry', 'Uscita diretta senza conferma');
      formStateLogger.logNavigation('BACK_BUTTON_DIRECT', 'manual-entry', 'previous-screen', null);
      router.back();
      return true; // Previene il comportamento predefinito
    });

    return () => backHandler.remove();
  }, []);
  
  // Salva lo stato del form quando cambia
  useEffect(() => {
    const formState = {
      name,
      brand,
      selectedCategory,
      quantity,
      unit,
      purchaseDate,
      expirationDate,
      notes,
      barcode,
      imageUrl,
      hasManuallySelectedCategory,
      isEditMode,
      originalProductId
    };
    
    formStateLogger.saveFormState(formInstanceId, formState);
  }, [
    formInstanceId,
    name,
    brand,
    selectedCategory,
    quantity,
    unit,
    purchaseDate,
    expirationDate,
    notes,
    barcode,
    imageUrl,
    hasManuallySelectedCategory,
    isEditMode,
    originalProductId
  ]);
  

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
        
        // Mostra un messaggio aggiuntivo se l'icona non è stata trovata
        if (newCategory.iconNotFound) {
          // Il messaggio principale è già mostrato dal context, ma possiamo aggiungere un feedback visivo
          LoggingService.info('ManualEntry', `Category "${newCategory.name}" created without icon`);
        }
      }
      setIsCategoryModalVisible(false);
      setNewCategoryNameInput('');
    } catch (error: unknown) {
    let message = 'Si è verificato un errore sconosciuto.';
    if (error instanceof Error) {
      message = error.message;
    }
    Alert.alert('Errore', message);
  }
  }, [newCategoryNameInput, addCategory]);

  const handleCategoryChange = useCallback((itemValue: string) => {
    if (itemValue === ADD_NEW_CATEGORY_ID) {
      setNewCategoryNameInput('');
      setIsCategoryModalVisible(true);
    } else {
      setSelectedCategory(itemValue);
      setHasManuallySelectedCategory(true);
    }
  }, []);

  useEffect(() => {
    if (!loading && categories.length > 0 && !selectedCategory) {
      const isValidCurrentSelection = categories.some(cat => cat.id === selectedCategory);
      if (!isValidCurrentSelection) {
        setSelectedCategory(categories[0].id);
      }
    }
  }, [categories, loading, selectedCategory]);

  useEffect(() => {
    const loadProductForEdit = async (id: string) => {
      const productToEdit = await StorageService.getProductById(id);
    if (productToEdit) {
      setName(productToEdit.name);
      setBrand(productToEdit.brand || '');
      setSelectedCategory(productToEdit.category);
      setQuantity(productToEdit.quantity.toString());
      setUnit(productToEdit.unit);
      setPurchaseDate(productToEdit.purchaseDate);
      setExpirationDate(productToEdit.expirationDate);
      setNotes(productToEdit.notes || '');
      setBarcode(productToEdit.barcode || '');
      setImageUrl(productToEdit.imageUrl || null);
      setOriginalProductId(productToEdit.id);
      setIsEditMode(true);
      setHasManuallySelectedCategory(true);
    } else {
      LoggingService.info('ManualEntry', `Product with ID ${id} not found for editing.`);
    }
    };
    let productId = params.productId;
    if (Array.isArray(productId)) {
      productId = productId[0];
    }
    if (productId && typeof productId === 'string') {
      loadProductForEdit(productId);
    }
  }, [params.productId]);

  useEffect(() => {
    if (!params.productId) {
      // Funzione helper per gestire parametri che potrebbero essere array
      const getStringParam = (param: string | string[] | undefined): string => {
        if (Array.isArray(param)) {
          return param[0] || '';
        }
        return param || '';
      };

      // Ripristina tutti i dati del form dai parametri
      const barcodeParam = getStringParam(params.barcode);
      if (barcodeParam) setBarcode(barcodeParam);

      const productNameParam = getStringParam(params.productName || params.name);
      if (productNameParam) setName(productNameParam);

      const brandParam = getStringParam(params.brand);
      if (brandParam) setBrand(brandParam);

      const imageUrlParam = getStringParam(params.imageUrl);
      if (imageUrlParam) {
        setImageUrl(imageUrlParam);
      }

      const categoryParam = getStringParam(params.category || params.selectedCategory);
      if (categoryParam) {
        setSelectedCategory(categoryParam);
        setHasManuallySelectedCategory(true);
      }

      // Ripristina quantità e unità se presenti
      const quantityParam = getStringParam(params.quantity);
      if (quantityParam) setQuantity(quantityParam);

      const unitParam = getStringParam(params.unit);
      if (unitParam) setUnit(unitParam);

      // Ripristina le date se presenti
      const purchaseDateParam = getStringParam(params.purchaseDate);
      if (purchaseDateParam) setPurchaseDate(purchaseDateParam);

      const expirationDateParam = getStringParam(params.expirationDate);
      if (expirationDateParam) setExpirationDate(expirationDateParam);

      // Ripristina le note se presenti
      const notesParam = getStringParam(params.notes);
      if (notesParam) setNotes(notesParam);

      // Log per debug
      if (params.fromPhotoCapture === 'true') {
        formStateLogger.logNavigation('RETURN_FROM_PHOTO_CAPTURE', 'photo-capture', 'manual-entry', {
          name: productNameParam,
          brand: brandParam,
          selectedCategory: categoryParam,
          quantity: quantityParam,
          unit: unitParam,
          purchaseDate: purchaseDateParam,
          expirationDate: expirationDateParam,
          notes: notesParam,
          barcode: barcodeParam,
          imageUrl: imageUrlParam
        });
        
        LoggingService.info('ManualEntry', 'Restoring form data from photo capture:', {
          name: productNameParam,
          brand: brandParam,
          selectedCategory: categoryParam,
          quantity: quantityParam,
          unit: unitParam,
          purchaseDate: purchaseDateParam,
          expirationDate: expirationDateParam,
          notes: notesParam,
          barcode: barcodeParam,
          imageUrl: imageUrlParam
        });
      }
    }
  }, [params]);

  useEffect(() => {
    let extractedExpirationDateParam = params.extractedExpirationDate;
    if (Array.isArray(extractedExpirationDateParam)) {
      extractedExpirationDateParam = extractedExpirationDateParam[0];
    }
    if (extractedExpirationDateParam && typeof extractedExpirationDateParam === 'string') {
      setExpirationDate(extractedExpirationDateParam);
    }
  }, [params.extractedExpirationDate]);

  const onChangePurchaseDate = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPurchaseDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setPurchaseDate(selectedDate.toISOString().split('T')[0]);
    }
  }, []);

  const onChangeExpirationDate = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate) {
      setExpirationDate(selectedDate.toISOString().split('T')[0]);
    }
    setShowExpirationDatePicker(false);
  }, []);

  // Funzione per salvare lo stato completo del form
  const saveCurrentFormState = useCallback(() => {
    const currentState = {
      name,
      brand,
      selectedCategory,
      quantity,
      unit,
      purchaseDate,
      expirationDate,
      notes,
      barcode,
      imageUrl,
      hasManuallySelectedCategory,
      isEditMode,
      originalProductId,
      formInstanceId: formInstanceId // Usa direttamente la stringa formInstanceId
    };
    formStateLogger.saveFormState(formInstanceId, currentState);
    LoggingService.info('ManualEntry', 'Current form state saved:', currentState);
  }, [
    name, brand, selectedCategory, quantity, unit, purchaseDate, expirationDate, notes,
    barcode, imageUrl, hasManuallySelectedCategory, isEditMode, originalProductId, formInstanceId
  ]);

  // Funzione per ripristinare lo stato del form
  const restoreFormState = useCallback(() => {
    const savedState = formStateLogger.getFormState(formInstanceId);
    if (savedState) {
      LoggingService.info('ManualEntry', 'Restoring form state:', savedState);
      setName(savedState.name || '');
      setBrand(savedState.brand || '');
      setSelectedCategory(savedState.selectedCategory || '');
      setQuantity(savedState.quantity || '1');
      setUnit(savedState.unit || 'pz');
      setPurchaseDate(savedState.purchaseDate || new Date().toISOString().split('T')[0]);
      setExpirationDate(savedState.expirationDate || '');
      setNotes(savedState.notes || '');
      setBarcode(savedState.barcode || '');
      setImageUrl(savedState.imageUrl || null);
      setHasManuallySelectedCategory(savedState.hasManuallySelectedCategory || false);
      setIsEditMode(savedState.isEditMode || false);
      setOriginalProductId(savedState.originalProductId || null);
      return true; // Stato ripristinato con successo
    }
    LoggingService.warning('ManualEntry', 'No saved form state found to restore.');
    return false; // Nessuno stato da ripristinare
  }, [formInstanceId]);

  // Log per debug della persistenza dei dati e ripristino stato
  useEffect(() => {
    if (params.fromPhotoCapture === 'true') {
      LoggingService.info('ManualEntry', 'Form data after photo capture:', {
        name,
        brand,
        selectedCategory,
        quantity,
        unit,
        purchaseDate,
        expirationDate,
        notes,
        barcode,
        imageUrl: params.imageUrl, // Usa params.imageUrl qui
        hasManuallySelectedCategory
      });
      
      // Prova a ripristinare lo stato del form
      const restorationSuccessful = restoreFormState();
      if (restorationSuccessful) {
        LoggingService.info('ManualEntry', 'Form state restored successfully after photo capture.');
      } else {
        LoggingService.warning('ManualEntry', 'Form state restoration failed after photo capture.');
      }
      
      // Confronta con lo stato salvato prima della navigazione (per log aggiuntivi)
      const previousState = formStateLogger.getFormState(formInstanceId);
      if (previousState) {
        const comparison = formStateLogger.compareStates(previousState, {
          name,
          brand,
          selectedCategory,
          quantity,
          unit,
          purchaseDate,
          expirationDate,
          notes,
          barcode,
          imageUrl: params.imageUrl, // Usa params.imageUrl qui
          hasManuallySelectedCategory
        });
        
        if (comparison.hasDifferences) {
          LoggingService.warning('ManualEntry', 'Differences detected in form state after photo capture (after restoration attempt):', comparison.differences);
        } else {
          LoggingService.info('ManualEntry', 'No differences detected in form state after photo capture (after restoration attempt).');
        }
      }
    }
  }, [
    formInstanceId,
    params.fromPhotoCapture,
    params.imageUrl, // Aggiungi params.imageUrl alle dipendenze
    name,
    brand,
    selectedCategory,
    quantity,
    unit,
    purchaseDate,
    expirationDate,
    notes,
    barcode,
    hasManuallySelectedCategory,
    restoreFormState
  ]);

  // Effetto speciale per aggiornare imageUrl quando arriva da photo-capture
  useEffect(() => {
    if (params.fromPhotoCapture === 'true' && params.imageUrl) {
      const imageUrlParam = Array.isArray(params.imageUrl) ? params.imageUrl[0] : params.imageUrl;
      setImageUrl(imageUrlParam);
    }
  }, [params.fromPhotoCapture, params.imageUrl]);

  // Effetto speciale per aggiornare expirationDate quando arriva da photo-capture (modalità data di scadenza)
  useEffect(() => {
    if (params.fromPhotoCapture === 'true' && params.expirationDate) {
      const expirationDateParam = Array.isArray(params.expirationDate) ? params.expirationDate[0] : params.expirationDate;
      LoggingService.info('ManualEntry', 'Setting expirationDate from params:', expirationDateParam);
      setExpirationDate(expirationDateParam);
    }
  }, [params.fromPhotoCapture, params.expirationDate]);

  const handleSaveProduct = useCallback(async () => {
    if (!name || !selectedCategory || !quantity || !unit || !purchaseDate || !expirationDate) {
      Alert.alert('Errore', 'Per favore, compila tutti i campi obbligatori.');
      return;
    }

    const productData: Partial<Product> = {
      name,
      brand: brand || '',
      category: selectedCategory,
      quantity: parseInt(quantity, 10),
      unit,
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

    LoggingService.info('ManualEntry', "Attempting to save product with data:", JSON.stringify(productData, null, 2));

    try {
      await StorageService.saveProduct(productData);
      
      // Pulisci lo stato del form per evitare problemi di navigazione
      formStateLogger.clearFormStates();
      
      // Mostra un toast o un alert temporaneo
      Alert.alert(
        'Prodotto Salvato',
        `${name} è stato aggiunto e salvato nella tua dispensa.`
      );
      
      // Log dell'operazione completata
      LoggingService.info('ManualEntry', 'Prodotto salvato con successo, navigazione alla schermata prodotti');
      
      // Naviga alla schermata prodotti per evitare problemi di stato
      // Questo risolve il problema del ritorno alla finestra pre-cattura
      setTimeout(() => {
        // Forza la navigazione alla schermata prodotti
        router.replace('/(tabs)/products');
      }, 1500); // Ritardo di 1.5 secondi per permettere all'utente di vedere il messaggio
    } catch (error: unknown) {
      LoggingService.error('ManualEntry', 'Errore durante il salvataggio del prodotto:', error);
      Alert.alert('Errore', 'Si è verificato un errore durante il salvataggio del prodotto.');
    }
  }, [name, brand, selectedCategory, quantity, unit, purchaseDate, expirationDate, notes, barcode, imageUrl, isEditMode, originalProductId, params.addedMethod, formInstanceId]);

  const styles = getStyles(isDarkMode);

  const renderCategoryItem = useCallback(({ item }: { item: any }) => {
    if (item.spacer) {
      return <View style={styles.categoryItemSpacer} />;
    }
    
    const hasIcon = (item.localIcon || (item.icon && item.icon !== '+')) && !item.iconNotFound;

    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          selectedCategory === item.id && styles.categoryItemSelected,
        ]}
        onPress={() => handleCategoryChange(item.id)}
      >
        {hasIcon ? (
          <View style={styles.iconContainer}>
            {item.localIcon ? (
              <Image source={item.localIcon} style={styles.categoryImage} />
            ) : item.icon && item.icon.startsWith('http') ? (
              <Image source={{ uri: item.icon }} style={styles.categoryImage} />
            ) : (
              <Text style={styles.categoryIcon}>{item.icon}</Text>
            )}
          </View>
        ) : null}
        <Text
          style={[styles.categoryName, !hasIcon && styles.categoryNameNoIcon]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  }, [selectedCategory, handleCategoryChange, styles]);

  const numColumns = 4;
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
    return formatData(categories, numColumns);
  }, [categories]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={isDarkMode ? '#ffffff' : '#000000'} />
          <Text style={{ color: isDarkMode ? '#ffffff' : '#000000', marginTop: 10 }}>Caricamento categorie...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        <ProductFormHeader
          isEditMode={isEditMode}
          imageUrl={imageUrl}
          barcode={barcode}
          name={name}
          brand={brand}
          selectedCategory={selectedCategory}
          quantity={quantity}
          unit={unit}
          purchaseDate={purchaseDate}
          expirationDate={expirationDate}
          notes={notes}
          setName={setName}
          setBrand={setBrand}
          styles={styles}
          navigatingToPhotoCapture={navigatingToPhotoCapture}
        />
        <FlatList
          data={categoryData}
          renderItem={renderCategoryItem}
          keyExtractor={item => item.id}
          numColumns={numColumns}
          columnWrapperStyle={styles.rowStyle}
          scrollEnabled={false}
        />
        <ProductFormFooter
          quantity={quantity}
          unit={unit}
          purchaseDate={purchaseDate}
          expirationDate={expirationDate}
          notes={notes}
          setQuantity={setQuantity}
          setUnit={setUnit}
          setShowPurchaseDatePicker={setShowPurchaseDatePicker}
          setShowExpirationDatePicker={setShowExpirationDatePicker}
          setNotes={setNotes}
          handleSaveProduct={handleSaveProduct}
          isEditMode={isEditMode}
          showPurchaseDatePicker={showPurchaseDatePicker}
          showExpirationDatePicker={showExpirationDatePicker}
          onChangePurchaseDate={onChangePurchaseDate}
          onChangeExpirationDate={onChangeExpirationDate}
          styles={styles}
          name={name}
          brand={brand}
          selectedCategory={selectedCategory}
          barcode={barcode}
          imageUrl={imageUrl}
          loading={loading}
          navigatingToPhotoCapture={navigatingToPhotoCapture}
        />
      </ScrollView>
      <Modal transparent={true} animationType="fade" visible={isCategoryModalVisible} onRequestClose={() => setIsCategoryModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Aggiungi Nuova Categoria</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nome della nuova categoria"
              value={newCategoryNameInput}
              onChangeText={setNewCategoryNameInput}
              autoFocus
              placeholderTextColor={styles.placeholder.color}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setIsCategoryModalVisible(false)}>
                <Text style={styles.modalButtonTextCancel}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={handleAddNewCategory}>
                <Text style={styles.modalButtonTextConfirm}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#0d1117' : '#f8f9fa',
  },
  contentContainer: {
    padding: 16,
  },
  rowStyle: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryItem: {
    width: '23%',
    aspectRatio: 1,
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
    backgroundColor: isDarkMode ? '#21262d' : '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryItemSpacer: {
    width: '23%',
    aspectRatio: 1,
  },
  categoryItemSelected: {
    borderColor: isDarkMode ? '#58a6ff' : '#3b82f6',
    backgroundColor: isDarkMode ? '#0d419d' : '#dbeafe',
  },
  iconContainer: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  categoryIcon: {
    fontSize: 32,
  },
  categoryImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  categoryName: {
    fontSize: 11,
    textAlign: 'center',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    fontFamily: 'Inter-Regular',
    width: '100%',
    marginBottom: 4,
    paddingHorizontal: 2,
    fontWeight: '500',
  },
  categoryNameNoIcon: {
    fontSize: 14, // Più grande
    textAlign: 'center',
    fontWeight: 'bold',
    position: 'absolute', // Per centrare perfettamente
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlignVertical: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  takePhotoButton: {
    backgroundColor: isDarkMode ? '#21262d' : '#e2e8f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
  },
  takePhotoButtonText: {
    textAlign: 'center',
    color: isDarkMode ? '#58a6ff' : '#3b82f6',
    fontWeight: '500',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  photoButton: {
    backgroundColor: isDarkMode ? '#238636' : '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  photoButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: isDarkMode ? '#8b949e' : '#64748b',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: isDarkMode ? '#21262d' : '#ffffff',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  disabledInput: {
    backgroundColor: isDarkMode ? '#161b22' : '#f1f5f9',
    color: isDarkMode ? '#8b949e' : '#64748b',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  column: {
    flex: 1,
    marginHorizontal: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
    borderRadius: 8,
    backgroundColor: isDarkMode ? '#21262d' : '#ffffff',
  },
  quantityButton: {
    padding: 12,
    backgroundColor: isDarkMode ? '#30363d' : '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  quantityInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    padding: 12,
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
    borderRadius: 8,
    backgroundColor: isDarkMode ? '#21262d' : '#ffffff',
  },
  picker: {
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  dateInputTouchable: {
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: isDarkMode ? '#21262d' : '#ffffff',
  },
  dateTextValue: {
    fontSize: 16,
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  productImagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    resizeMode: 'contain',
  },
  saveButton: {
    backgroundColor: isDarkMode ? '#238636' : '#10b981',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: isDarkMode ? '#21262d' : '#ffffff',
    padding: 20,
    borderRadius: 12,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: isDarkMode ? '#0d1117' : '#f8f9fa',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  modalButtonCancel: {
    backgroundColor: isDarkMode ? '#30363d' : '#e2e8f0',
  },
  modalButtonConfirm: {
    backgroundColor: isDarkMode ? '#238636' : '#10b981',
  },
  modalButtonTextCancel: {
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    textAlign: 'center',
    fontWeight: '500',
  },
  modalButtonTextConfirm: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '500',
  },
  placeholder: {
    color: isDarkMode ? '#8b949e' : '#64748b',
  },
});
