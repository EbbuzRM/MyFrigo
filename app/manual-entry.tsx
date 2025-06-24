import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Product, PRODUCT_CATEGORIES } from '@/types/Product';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import { StorageService } from '@/services/StorageService';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '@/context/ThemeContext';

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

export default function ManualEntryScreen() {
  const { isDarkMode } = useTheme();
  const params = useLocalSearchParams();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [dynamicCategories, setDynamicCategories] = useState([...PRODUCT_CATEGORIES]);
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

  const ADD_NEW_CATEGORY_ID = 'add_new_category_sentinel_value';

  const handleAddNewCategory = async () => {
    if (newCategoryNameInput && newCategoryNameInput.trim() !== '') {
      const trimmedName = newCategoryNameInput.trim();
      const newId = trimmedName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();

      if (dynamicCategories.find(cat => cat.id === newId || cat.name.toLowerCase() === trimmedName.toLowerCase())) {
        Alert.alert('Errore', 'Una categoria con questo nome o ID esiste già.');
        return;
      }
      const newCategory = {
        id: newId,
        name: trimmedName,
        icon: trimmedName.charAt(0).toUpperCase(),
        color: '#808080'
      };
      
      const updatedCategories = [...dynamicCategories, newCategory];
      setDynamicCategories(updatedCategories);
      setSelectedCategory(newId);
      await StorageService.saveCategories(updatedCategories);
      
      setIsCategoryModalVisible(false);
      setNewCategoryNameInput('');
    } else {
      Alert.alert('Errore', 'Il nome della categoria non può essere vuoto.');
    }
  };

  const handleCategoryChange = (itemValue: string) => {
    if (itemValue === ADD_NEW_CATEGORY_ID) {
      setNewCategoryNameInput('');
      setIsCategoryModalVisible(true);
    } else {
      setSelectedCategory(itemValue);
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      const storedCategories = await StorageService.getCategories();
      const combined = [...PRODUCT_CATEGORIES];
      storedCategories.forEach(storedCat => {
        if (!combined.some(defaultCat => defaultCat.id === storedCat.id)) {
          combined.push(storedCat);
        }
      });
      setDynamicCategories(combined);
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (dynamicCategories.length > 0 && !selectedCategory) {
      const isValidCurrentSelection = dynamicCategories.some(cat => cat.id === selectedCategory);
      if (!isValidCurrentSelection) {
        setSelectedCategory(dynamicCategories[0].id);
      }
    }
  }, [dynamicCategories, selectedCategory]);

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
        setExpirationDate(productToEdit.expirationDate); // This should correctly set the initial date for edit mode
        setNotes(productToEdit.notes || '');
        setBarcode(productToEdit.barcode || '');
        setImageUrl(productToEdit.imageUrl || null);
        setOriginalProductId(productToEdit.id);
        setIsEditMode(true);
      } else {
        console.warn(`Product with ID ${id} not found for editing.`);
      }
    };

    if (params.productId && typeof params.productId === 'string') {
      loadProductForEdit(params.productId);
    } else {
      if (params.barcode && typeof params.barcode === 'string') setBarcode(params.barcode);
      if (params.productName && typeof params.productName === 'string') setName(params.productName);
      if (params.brand && typeof params.brand === 'string') setBrand(params.brand);
      if (params.imageUrl && typeof params.imageUrl === 'string') setImageUrl(params.imageUrl);
      if (params.category && typeof params.category === 'string') setSelectedCategory(params.category);
      
      if (params.extractedExpirationDate && typeof params.extractedExpirationDate === 'string') {
        setExpirationDate(params.extractedExpirationDate);
        const currentParams = { ...params };
        delete currentParams.extractedExpirationDate;
        router.setParams(currentParams); 
      }
    }
  }, [params.productId, params.barcode, params.productName, params.brand, params.imageUrl, params.category, params.extractedExpirationDate]);

  const onChangePurchaseDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPurchaseDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setPurchaseDate(selectedDate.toISOString().split('T')[0]);
    }
  };

  const onChangeExpirationDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate) {
      setExpirationDate(selectedDate.toISOString().split('T')[0]);
      setShowExpirationDatePicker(false);
    } else if (event.type === 'dismissed') {
      setShowExpirationDatePicker(false);
    } else if (Platform.OS === 'android' && event.type !== 'set') {
      setShowExpirationDatePicker(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!name || !selectedCategory || !quantity || !unit || !purchaseDate || !expirationDate) {
      Alert.alert('Errore', 'Per favore, compila tutti i campi obbligatori.');
      return;
    }

    const productToSave: Product = {
      id: isEditMode && originalProductId ? originalProductId : Date.now().toString(),
      name,
      brand: brand || '',
      category: selectedCategory,
      quantity: parseInt(quantity, 10),
      unit,
      purchaseDate,
      expirationDate,
      notes: notes || '',
      status: 'active',
      addedMethod: params.addedMethod === 'photo' ? 'photo' : (barcode ? 'barcode' : 'manual'),
      barcode: barcode || '',
      imageUrl: imageUrl || undefined,
    };

    try {
      await StorageService.saveProduct(productToSave);
      Alert.alert('Prodotto Salvato', `${name} è stato aggiunto e salvato nella tua dispensa.`);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Errore durante il salvataggio del prodotto:', error);
      Alert.alert('Errore', 'Si è verificato un errore durante il salvataggio del prodotto.');
    }
  };

  const styles = getStyles(isDarkMode);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>{isEditMode ? 'Modifica Prodotto' : 'Inserimento Manuale'}</Text>

        {!imageUrl && !isEditMode && (
          <TouchableOpacity 
            style={styles.takePhotoButton} 
            onPress={() => {
              const currentFormData = { name, brand, selectedCategory, quantity, unit, purchaseDate, expirationDate, notes, barcode };
              router.push({ pathname: '/photo-capture', params: { ...currentFormData, fromManualEntry: 'true' } });
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
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={barcode}
              editable={false}
            />
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
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCategory}
            style={styles.picker}
            onValueChange={handleCategoryChange}
            dropdownIconColor={isDarkMode ? '#c9d1d9' : '#1e293b'}
          >
            <Picker.Item label="Aggiungi Nuova Categoria..." value={ADD_NEW_CATEGORY_ID} />
            {dynamicCategories
              .filter(cat => cat.id !== 'other')
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((category) => (
                <Picker.Item key={category.id} label={category.name} value={category.id} />
              ))}
            {dynamicCategories.find(cat => cat.id === 'other') && (
              <Picker.Item 
                key={'other'} 
                label={dynamicCategories.find(cat => cat.id === 'other')?.name || 'Altro'} 
                value={'other'} 
              />
            )}
          </Picker>
        </View>

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Quantità*</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="Es. 1"
              keyboardType="numeric"
              placeholderTextColor={styles.placeholder.color}
            />
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Unità*</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={unit}
                style={styles.picker}
                onValueChange={(itemValue: string) => setUnit(itemValue)}
                dropdownIconColor={isDarkMode ? '#c9d1d9' : '#1e293b'}
              >
                {COMMON_UNITS.map((u) => (
                  <Picker.Item key={u.id} label={u.name} value={u.id} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <Text style={styles.label}>Data di Acquisto*</Text>
        <TouchableOpacity onPress={() => setShowPurchaseDatePicker(true)} style={styles.dateInputTouchable}>
          <Text style={styles.dateTextValue}>{purchaseDate ? new Date(purchaseDate).toLocaleDateString('it-IT') : 'Seleziona Data'}</Text>
        </TouchableOpacity>
        {showPurchaseDatePicker && (
          <DateTimePicker
            testID="purchaseDatePicker"
            value={new Date(purchaseDate || Date.now())}
            mode="date"
            display="default"
            onChange={onChangePurchaseDate}
            maximumDate={new Date()}
          />
        )}

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
        {showExpirationDatePicker && (
          <DateTimePicker
            testID="expirationDatePicker"
            value={new Date(expirationDate || Date.now())}
            mode="date"
            display="default"
            onChange={onChangeExpirationDate}
            minimumDate={new Date()}
          />
        )}

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
      </ScrollView>

      <Modal
        transparent={true}
        animationType="fade"
        visible={isCategoryModalVisible}
        onRequestClose={() => setIsCategoryModalVisible(false)}
      >
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
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setIsCategoryModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Annulla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleAddNewCategory}
              >
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
  helperText: {
    fontSize: 12,
    color: isDarkMode ? '#8b949e' : '#64748b',
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  photoButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: isDarkMode ? '#38bdf8' : '#E0F2FE',
    borderRadius: 6,
  },
  photoButtonText: {
    color: isDarkMode ? '#0d1117' : '#0EA5E9',
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
  },
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#0d1117' : '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: isDarkMode ? '#8b949e' : '#334155',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  placeholder: {
    color: isDarkMode ? '#8b949e' : '#94a3b8',
  },
  disabledInput: {
    backgroundColor: isDarkMode ? '#21262d' : '#e2e8f0',
    color: isDarkMode ? '#8b949e' : '#64748b',
  },
  productImagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: isDarkMode ? '#21262d' : '#e2e8f0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: Platform.OS === 'ios' ? undefined : 50,
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    backgroundColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    marginRight: 8,
  },
  dateInputTouchable: {
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  dateTextValue: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 32,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  takePhotoButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  takePhotoButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: isDarkMode ? '#161b22' : 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 15,
    textAlign: 'center',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 20,
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    backgroundColor: isDarkMode ? '#0d1117' : '#ffffff',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: isDarkMode ? '#21262d' : '#e2e8f0',
    marginRight: 10,
  },
  modalButtonConfirm: {
    backgroundColor: '#2563EB',
    marginLeft: 10,
  },
  modalButtonTextCancel: {
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  modalButtonTextConfirm: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
});
