import { AnimatedPressable } from '@/components/AnimatedPressable';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

const ProductFormHeader = React.memo(({ isEditMode, imageUrl, barcode, name, brand, setName, setBrand, styles }) => (
  <>
    <Text style={styles.title}>{isEditMode ? 'Modifica Prodotto' : 'Inserimento Manuale'}</Text>
    {!imageUrl && !isEditMode && (
      <TouchableOpacity
        style={styles.takePhotoButton}
        onPress={() => router.push({ pathname: '/photo-capture', params: { fromManualEntry: 'true' } })}
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
));

const ProductFormFooter = React.memo(({ quantity, unit, purchaseDate, expirationDate, notes, setQuantity, setUnit, setShowPurchaseDatePicker, setShowExpirationDatePicker, setNotes, handleSaveProduct, isEditMode, showPurchaseDatePicker, showExpirationDatePicker, onChangePurchaseDate, onChangeExpirationDate, styles, name, brand, selectedCategory, barcode, imageUrl }) => (
  <>
    <View style={styles.row}>
      <View style={styles.column}>
        <Text style={styles.label}>Quantità*</Text>
        <View style={styles.quantityContainer}>
          <AnimatedPressable onPress={() => setQuantity(q => String(Math.max(1, parseInt(q, 10) - 1)))} style={styles.quantityButton}>
            <Text style={styles.quantityButtonText}>-</Text>
          </AnimatedPressable>
          <TextInput
            style={styles.quantityInput}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholderTextColor={styles.placeholder.color}
          />
          <AnimatedPressable onPress={() => setQuantity(q => String(parseInt(q, 10) + 1))} style={styles.quantityButton}>
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
          const currentFormData = { name, brand, selectedCategory, quantity, unit, purchaseDate, expirationDate, notes, barcode, imageUrl };
          router.push({ pathname: '/photo-capture', params: { ...currentFormData, captureMode: 'expirationDateOnly' } });
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
    <TouchableOpacity style={styles.saveButton} onPress={handleSaveProduct}>
      <Text style={styles.saveButtonText}>{isEditMode ? 'Aggiorna Prodotto' : 'Salva Prodotto'}</Text>
    </TouchableOpacity>
  </>
));

export default function ManualEntryScreen() {
  const { isDarkMode } = useTheme();
  const { categories, addCategory, loading: categoriesLoading } = useCategories();
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
    } catch (error: any) {
      Alert.alert('Errore', error.message);
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
    if (!categoriesLoading && categories.length > 0 && !selectedCategory) {
      const isValidCurrentSelection = categories.some(cat => cat.id === selectedCategory);
      if (!isValidCurrentSelection) {
        setSelectedCategory(categories[0].id);
      }
    }
  }, [categories, categoriesLoading, selectedCategory]);

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
        console.warn(`Product with ID ${id} not found for editing.`);
      }
    };
    if (params.productId && typeof params.productId === 'string') {
      loadProductForEdit(params.productId);
    }
  }, [params.productId]);

  useEffect(() => {
    if (!params.productId) {
      if (params.barcode && typeof params.barcode === 'string') setBarcode(params.barcode);
      if (params.productName && typeof params.productName === 'string') setName(params.productName);
      if (params.brand && typeof params.brand === 'string') setBrand(params.brand);
      if (params.imageUrl && typeof params.imageUrl === 'string') setImageUrl(params.imageUrl);
      if (params.category && typeof params.category === 'string') {
        setSelectedCategory(params.category);
        setHasManuallySelectedCategory(true);
      }
    }
  }, []);

  useEffect(() => {
    if (params.extractedExpirationDate && typeof params.extractedExpirationDate === 'string') {
      setExpirationDate(params.extractedExpirationDate);
      const { extractedExpirationDate, ...rest } = params;
      router.replace({ pathname: '/manual-entry', params: rest });
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

  const handleSaveProduct = useCallback(async () => {
    if (!name || !selectedCategory || !quantity || !unit || !purchaseDate || !expirationDate) {
      Alert.alert('Errore', 'Per favore, compila tutti i campi obbligatori.');
      return;
    }
    const productToSave: Partial<Product> = {
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
      productToSave.id = originalProductId;
    }
    try {
      await StorageService.saveProduct(productToSave);
      Alert.alert('Prodotto Salvato', `${name} è stato aggiunto e salvato nella tua dispensa.`);
      if (Platform.OS === 'web') {
        setTimeout(() => {
          if (router.canGoBack()) router.back();
          else router.replace('/(tabs)');
        }, 100);
      } else {
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Errore durante il salvataggio del prodotto:', error);
      Alert.alert('Errore', 'Si è verificato un errore durante il salvataggio del prodotto.');
    }
  }, [name, brand, selectedCategory, quantity, unit, purchaseDate, expirationDate, notes, barcode, imageUrl, isEditMode, originalProductId, params.addedMethod]);

  const styles = getStyles(isDarkMode);

  const renderCategoryItem = useCallback(({ item }: { item: any }) => {
    if (item.spacer) {
      return <View style={styles.categoryItemSpacer} />;
    }
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          selectedCategory === item.id && styles.categoryItemSelected,
        ]}
        onPress={() => handleCategoryChange(item.id)}
      >
        {item.localIcon ? (
          <Image source={item.localIcon} style={{ width: 40, height: 40, marginBottom: 4, borderRadius: 8 }} />
        ) : item.iconUrl ? (
          <Image source={{ uri: item.iconUrl }} style={styles.categoryImage} />
        ) : (
          <Text style={styles.categoryIcon}>{item.icon}</Text>
        )}
        <Text 
          style={styles.categoryName} 
          numberOfLines={1} 
          adjustsFontSizeToFit
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  }, [selectedCategory, handleCategoryChange, styles]);

  const numColumns = 4;
  const categoryData = useMemo(() => {
    const formatData = (data, columns) => {
      const dataWithButton = [...data, { id: ADD_NEW_CATEGORY_ID, name: 'Aggiungi', icon: '+', color: '#808080' }];
      const numberOfFullRows = Math.floor(dataWithButton.length / columns);
      let numberOfElementsLastRow = dataWithButton.length - (numberOfFullRows * columns);
      while (numberOfElementsLastRow !== columns && numberOfElementsLastRow !== 0) {
        dataWithButton.push({ id: `spacer-${numberOfElementsLastRow}`, spacer: true });
        numberOfElementsLastRow++;
      }
      return dataWithButton;
    };
    return formatData(categories, numColumns);
  }, [categories]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        <ProductFormHeader
          isEditMode={isEditMode}
          imageUrl={imageUrl}
          barcode={barcode}
          name={name}
          brand={brand}
          setName={setName}
          setBrand={setBrand}
          styles={styles}
        />
        {!categoriesLoading && (
          <FlatList
            data={categoryData}
            renderItem={renderCategoryItem}
            keyExtractor={item => item.id}
            numColumns={numColumns}
            columnWrapperStyle={styles.rowStyle}
            scrollEnabled={false}
          />
        )}
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
  categoryIcon: {
    fontSize: 32, // Aumentato per coerenza
    marginBottom: 4,
  },
  categoryImage: {
    width: 40,
    height: 40,
    marginBottom: 4,
    borderRadius: 8,
  },
  categoryName: {
    fontSize: 13, // Aumentato per leggibilità
    textAlign: 'center',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    fontFamily: 'Inter-Regular',
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