import { AnimatedPressable } from '@/components/AnimatedPressable';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  FlatList,
  ScrollView,
  ActivityIndicator,
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
import { useManualEntry, Quantity as FormQuantity, ManualEntryFormData } from '@/context/ManualEntryContext';
import { LoggingService } from '@/services/LoggingService';
import { formStateLogger } from '@/utils/FormStateLogger';

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
    fontSize: 14,
    textAlign: 'center',
    fontWeight: 'bold',
    position: 'absolute',
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
    alignItems: 'center', // Allinea verticalmente gli elementi
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
  addButton: {
    backgroundColor: isDarkMode ? '#21262d' : '#e2e8f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
    alignItems: 'center',
  },
  addButtonText: {
    color: isDarkMode ? '#58a6ff' : '#3b82f6',
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: isDarkMode ? '#440c0c' : '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    marginLeft: 8,
    alignSelf: 'center',
  },
  removeButtonText: {
    color: isDarkMode ? '#ff7b72' : '#ef4444',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

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
  purchaseDate: string;
  expirationDate: string;
  notes: string;
  setName: (value: string) => void;
  setBrand: (value: string) => void;
  styles: ReturnType<typeof getStyles>;
  navigatingToPhotoCapture: React.MutableRefObject<boolean>;
}
const ProductFormHeader = React.memo(({
  isEditMode,
  imageUrl,
  barcode,
  name,
  brand,
  selectedCategory,
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
          const currentFormData = {
            name: name,
            brand: brand,
            selectedCategory: selectedCategory,
            purchaseDate: purchaseDate,
            expirationDate: expirationDate,
            notes: notes,
            barcode: barcode,
            fromManualEntry: 'true'
          };
          formStateLogger.logNavigation('TAKE_PHOTO', 'manual-entry', 'photo-capture', currentFormData);
          navigatingToPhotoCapture.current = true;
          router.push({
            pathname: '/photo-capture',
            params: currentFormData
          });
          setTimeout(() => {
            navigatingToPhotoCapture.current = false;
          }, 500);
        }}
      >
        <Text style={styles.takePhotoButtonText}>Scatta Foto Prodotto</Text>
      </TouchableOpacity>
    )}
    {imageUrl && (
      <TouchableOpacity 
        onPress={() => {
          const currentFormData = {
            name: name,
            brand: brand,
            selectedCategory: selectedCategory,
            purchaseDate: purchaseDate,
            expirationDate: expirationDate,
            notes: notes,
            barcode: barcode,
            fromManualEntry: 'true'
          };
          navigatingToPhotoCapture.current = true;
          router.push({
            pathname: '/photo-capture',
            params: currentFormData
          });
          setTimeout(() => {
            navigatingToPhotoCapture.current = false;
          }, 500);
        }}
      >
        <Text style={styles.label}>Immagine Prodotto (clicca per modificare)</Text>
        <Image source={{ uri: imageUrl }} style={styles.productImagePreview} />
      </TouchableOpacity>
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

interface QuantityInputRowProps {
  item: FormQuantity;
  updateQuantity: (id: string, field: 'quantity' | 'unit', value: string) => void;
  removeQuantity: (id: string) => void;
  isOnlyOne: boolean;
  styles: ReturnType<typeof getStyles>;
}

const QuantityInputRow = React.memo(({ item, updateQuantity, removeQuantity, isOnlyOne, styles }: QuantityInputRowProps) => {
  return (
    <View style={styles.row}>
      <View style={styles.column}>
        <Text style={styles.label}>Quantità*</Text>
        <View style={styles.quantityContainer}>
          <AnimatedPressable 
            onPress={() => { 
              const currentVal = parseFloat(item.quantity.replace(',', '.')) || 0; 
              const newValue = String(Math.max(0, currentVal - 1)); 
              updateQuantity(item.id, 'quantity', newValue); 
            }} 
            style={styles.quantityButton}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </AnimatedPressable>
          <TextInput
            style={styles.quantityInput}
            value={item.quantity}
            onChangeText={(text) => updateQuantity(item.id, 'quantity', text.replace(',', '.'))}
            keyboardType="decimal-pad"
            placeholderTextColor={styles.placeholder.color}
          />
          <AnimatedPressable 
            onPress={() => { 
              const currentVal = parseFloat(item.quantity.replace(',', '.')) || 0; 
              const newValue = String(currentVal + 1); 
              updateQuantity(item.id, 'quantity', newValue); 
            }} 
            style={styles.quantityButton}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </AnimatedPressable>
        </View>
      </View>
      <View style={styles.column}>
        <Text style={styles.label}>Unità*</Text>
        <View style={styles.pickerContainer}>
          <Picker 
            selectedValue={item.unit} 
            style={styles.picker} 
            onValueChange={itemValue => updateQuantity(item.id, 'unit', itemValue)} 
            dropdownIconColor={styles.picker.color}
          >
            {COMMON_UNITS.map(u => <Picker.Item key={u.id} label={u.name} value={u.id} />)}
          </Picker>
        </View>
      </View>
      {!isOnlyOne && (
        <TouchableOpacity onPress={() => removeQuantity(item.id)} style={styles.removeButton}>
          <Text style={styles.removeButtonText}>-</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

interface ProductFormFooterProps {
  quantities: FormQuantity[];
  purchaseDate: string;
  expirationDate: string;
  notes: string;
  updateQuantity: (id: string, field: 'quantity' | 'unit', value: string) => void;
  addQuantity: () => void;
  removeQuantity: (id: string) => void;
  setShowPurchaseDatePicker: (value: boolean) => void;
  setShowExpirationDatePicker: (value: boolean) => void;
  setNotes: (value: string) => void;
  handleSaveProduct: () => void;
  isEditMode: boolean;
  showPurchaseDatePicker: boolean;
  showExpirationDatePicker: boolean;
  onChangePurchaseDate: (event: DateTimePickerEvent, selectedDate?: Date) => void;
  onChangeExpirationDate: (event: DateTimePickerEvent, selectedDate?: Date) => void;
  styles: ReturnType<typeof getStyles>;
  name: string;
  brand: string;
  selectedCategory: string;
  barcode: string;
  imageUrl: string | null;
  loading: boolean;
  navigatingToPhotoCapture: React.MutableRefObject<boolean>;
}
const ProductFormFooter = React.memo(({
  quantities,
  purchaseDate,
  expirationDate,
  notes,
  updateQuantity,
  addQuantity,
  removeQuantity,
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
    {quantities.map(item => (
      <QuantityInputRow 
        key={item.id}
        item={item}
        updateQuantity={updateQuantity}
        removeQuantity={removeQuantity}
        isOnlyOne={quantities.length === 1}
        styles={styles}
      />
    ))}
    <TouchableOpacity style={styles.addButton} onPress={addQuantity}>
      <Text style={styles.addButtonText}>Aggiungi quantità</Text>
    </TouchableOpacity>

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
          const currentFormData = {
            name: name,
            brand: brand,
            selectedCategory: selectedCategory,
            purchaseDate: purchaseDate,
            expirationDate: expirationDate,
            notes: notes,
            barcode: barcode,
            imageUrl: imageUrl,
            captureMode: 'expirationDateOnly'
          };
          formStateLogger.logNavigation('CAPTURE_EXPIRATION', 'manual-entry', 'photo-capture', currentFormData);
          navigatingToPhotoCapture.current = true;
          router.push({
            pathname: '/photo-capture',
            params: currentFormData
          });
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
  return (
    prevProps.quantities === nextProps.quantities &&
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
  
  const {
    name, setName,
    brand, setBrand,
    selectedCategory, setSelectedCategory,
    quantities, addQuantity, removeQuantity, updateQuantity, // Updated
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

  const [showPurchaseDatePicker, setShowPurchaseDatePicker] = useState(false);
  const [showExpirationDatePicker, setShowExpirationDatePicker] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [newCategoryNameInput, setNewCategoryNameInput] = useState('');
  
  const navigatingToPhotoCapture = useRef(false);

  const ADD_NEW_CATEGORY_ID = 'add_new_category_sentinel_value';

  useEffect(() => {
    const loadProductForEdit = async (id: string) => {
      const productToEdit = await StorageService.getProductById(id);
      if (productToEdit) {
        initializeForm({ 
            product: productToEdit, 
            isEditMode: true, 
            originalProductId: productToEdit.id, 
            hasManuallySelectedCategory: true 
        });
      }
    };

    const productId = Array.isArray(params.productId) ? params.productId[0] : params.productId;

    if (productId) {
      loadProductForEdit(productId);
    } else {
      initializeForm(params as Partial<ManualEntryFormData>);
    }

    return () => {
      clearForm();
    };
  }, [params.productId]);

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
    if (!isEditMode && !hasManuallySelectedCategory && (name || brand) && !loading) {
        const guessedCategoryId = guessCategory(name, brand, categories);
        if (guessedCategoryId && guessedCategoryId !== selectedCategory) {
            setSelectedCategory(guessedCategoryId);
        }
    }
  }, [name, brand, isEditMode, hasManuallySelectedCategory, categories, loading, guessCategory, selectedCategory]);

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
      setExpirationDate(selectedDate.toISOString().split('T')[0]);
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

    LoggingService.info('ManualEntry', "Attempting to save product with data:", JSON.stringify(productData, null, 2));

    try {
      await StorageService.saveProduct(productData);
      const savedProductName = name; // Save name for the alert
      
      if (isEditMode) {
        Alert.alert('Prodotto Aggiornato', `${savedProductName} è stato aggiornato con successo.`);
        router.replace('/(tabs)/products');
        return;
      }

      Alert.alert(
        'Prodotto Salvato',
        `${savedProductName} è stato aggiunto. Cosa vuoi fare ora?`,
        [
          {
            text: 'Aggiungi Manualmente',
            onPress: () => {
              clearForm();
            },
          },
          {
            text: 'Scansiona Codice',
            onPress: () => {
              clearForm();
              router.replace('/scanner');
            },
          },
          {
            text: 'Finito',
            onPress: () => {
              router.replace('/(tabs)/products');
            },
            style: 'cancel',
          },
        ],
        { cancelable: false }
      );
    } catch (error: unknown) {
      LoggingService.error('ManualEntry', 'Errore durante il salvataggio del prodotto:', error);
      Alert.alert('Errore', 'Si è verificato un errore durante il salvataggio del prodotto.');
    }
  }, [name, brand, selectedCategory, quantities, purchaseDate, expirationDate, notes, barcode, imageUrl, isEditMode, originalProductId, params.addedMethod, clearForm]);

  const styles = getStyles(isDarkMode);

  const renderCategoryItem = useCallback(({ item }: { item: ProductCategory & { spacer?: boolean } }) => {
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
          quantities={quantities}
          purchaseDate={purchaseDate}
          expirationDate={expirationDate}
          notes={notes}
          addQuantity={addQuantity}
          removeQuantity={removeQuantity}
          updateQuantity={updateQuantity}
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
