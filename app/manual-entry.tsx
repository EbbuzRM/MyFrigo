import React, { useState, useEffect } from 'react'; // Consolidated imports
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Image, // Added Image
  Modal, // Added Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Product, PRODUCT_CATEGORIES } from '@/types/Product';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import { StorageService } from '@/services/StorageService';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

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
  const params = useLocalSearchParams();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  // State for categories, initialized with the static list from import
  const [dynamicCategories, setDynamicCategories] = useState([...PRODUCT_CATEGORIES]);
  // Initialize selectedCategory to an empty string or the first dynamic category later in useEffect
  const [selectedCategory, setSelectedCategory] = useState(''); 
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('pz'); // Default unit
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expirationDate, setExpirationDate] = useState('');
  const [notes, setNotes] = useState('');
  const [barcode, setBarcode] = useState(''); // State for barcode
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalProductId, setOriginalProductId] = useState<string | null>(null);

  const [showPurchaseDatePicker, setShowPurchaseDatePicker] = useState(false);
  const [showExpirationDatePicker, setShowExpirationDatePicker] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [newCategoryNameInput, setNewCategoryNameInput] = useState('');

  const ADD_NEW_CATEGORY_ID = 'add_new_category_sentinel_value'; // Unique value for "Add New"

  const handleAddNewCategory = () => {
    if (newCategoryNameInput && newCategoryNameInput.trim() !== '') {
      const trimmedName = newCategoryNameInput.trim();
      const newId = trimmedName.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(); // Ensure unique ID

      if (dynamicCategories.find(cat => cat.id === newId || cat.name.toLowerCase() === trimmedName.toLowerCase())) {
        Alert.alert('Errore', 'Una categoria con questo nome o ID esiste già.');
        // Optionally, don't close modal or clear input
        return;
      }
      const newCategory = { 
        id: newId, 
        name: trimmedName, 
        icon: '🏷️', // Default icon for new categories
        color: '#808080' // Default color (gray) for new categories
      };
      setDynamicCategories(prev => [...prev, newCategory]);
      setSelectedCategory(newId);
      // TODO: Persist newCategory to StorageService.
      setIsCategoryModalVisible(false);
      setNewCategoryNameInput(''); // Clear input
    } else {
      Alert.alert('Errore', 'Il nome della categoria non può essere vuoto.');
    }
  };

  const handleCategoryChange = (itemValue: string) => {
    if (itemValue === ADD_NEW_CATEGORY_ID) {
      setNewCategoryNameInput(''); // Clear previous input
      setIsCategoryModalVisible(true);
    } else {
      setSelectedCategory(itemValue);
    }
  };

  useEffect(() => {
    // Set initial selected category if not already set (e.g. by edit mode)
    // and dynamicCategories has items.
    if (dynamicCategories.length > 0 && !selectedCategory) {
      // Check if current selectedCategory is valid, otherwise default
      const isValidCurrentSelection = dynamicCategories.some(cat => cat.id === selectedCategory);
      if (!isValidCurrentSelection) {
        setSelectedCategory(dynamicCategories[0].id);
      }
    }
    // This effect will also re-run if dynamicCategories changes, ensuring selection logic is reapplied.
  }, [dynamicCategories, selectedCategory]);


  useEffect(() => {
    const loadProductForEdit = async (id: string) => {
      const products = await StorageService.getProducts();
      const productToEdit = products.find(p => p.id === id);
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
        setOriginalProductId(productToEdit.id); // Store original ID for saving
        setIsEditMode(true);
      } else {
        console.warn(`Product with ID ${id} not found for editing.`);
        // Optionally, navigate back or show an error
      }
    };

    if (params.productId && typeof params.productId === 'string') {
      loadProductForEdit(params.productId);
    } else {
      // Not in edit mode, pre-fill from scanner or photo capture parameters
      if (params.barcode && typeof params.barcode === 'string' && barcode !== params.barcode) {
        setBarcode(params.barcode);
      }
      if (params.productName && typeof params.productName === 'string' && name !== params.productName) {
        setName(params.productName); // Pre-fill product name
      }
      if (params.brand && typeof params.brand === 'string' && brand !== params.brand) {
        setBrand(params.brand); // Pre-fill brand
      }
      if (params.imageUrl && typeof params.imageUrl === 'string' && imageUrl !== params.imageUrl) {
        setImageUrl(params.imageUrl);
      }
      if (params.extractedExpirationDate && typeof params.extractedExpirationDate === 'string' && expirationDate !== params.extractedExpirationDate) {
        setExpirationDate(params.extractedExpirationDate);
      }
    }
  }, [
    params.productId, 
    params.barcode, 
    params.productName, 
    params.brand, 
    params.imageUrl, 
    params.extractedExpirationDate,
    // Add other relevant params if they are used for pre-filling in this effect
    // Also, include local state vars in dependency array if their change should re-evaluate pre-fill logic,
    // e.g. 'barcode', 'name', 'brand', 'imageUrl', 'expirationDate' are used for comparison.
    barcode, name, brand, imageUrl, expirationDate 
  ]);

  // States for date picker visibility (if using DateTimePicker)
  // Removed as they are now defined above

  const onChangePurchaseDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date(purchaseDate);
    setShowPurchaseDatePicker(Platform.OS === 'ios'); // On iOS, the picker is a modal that needs to be managed differently or might stay open.
                                                    // For simplicity, we can let it self-dismiss or require user to tap "Done".
                                                    // On Android, we always hide after an event.
    if (Platform.OS === 'android') {
      setShowPurchaseDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) { // "set" means user picked a date
      setPurchaseDate(currentDate.toISOString().split('T')[0]);
    }
  };

  const onChangeExpirationDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date(expirationDate || Date.now()); // Ensure a valid date for the picker if expirationDate is empty
    setShowExpirationDatePicker(Platform.OS === 'ios');
    if (Platform.OS === 'android') {
      setShowExpirationDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) { // "set" means user picked a date
      setExpirationDate(currentDate.toISOString().split('T')[0]);
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
      brand: brand || undefined,
      category: selectedCategory,
      quantity: parseInt(quantity, 10),
      unit,
      purchaseDate,
      expirationDate,
      notes: notes || undefined,
      status: 'active',
      addedMethod: params.addedMethod === 'photo' ? 'photo' : (barcode ? 'barcode' : 'manual'),
      barcode: barcode || undefined,
      imageUrl: imageUrl || undefined, // Add image URL to product
      // nutritionalInfo can be added later or remain undefined
    };

    try {
      await StorageService.saveProduct(productToSave);
      console.log('Nuovo Prodotto (Manuale) Salvato:', productToSave);
      Alert.alert('Prodotto Salvato', `${name} è stato aggiunto e salvato nella tua dispensa.`);
      
      // Navigate back or to product list
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

  // Date picker handlers (if using DateTimePicker)
  // const onChangePurchaseDate = (event: any, selectedDate?: Date) => {
  //   const currentDate = selectedDate || new Date(purchaseDate);
  //   setShowPurchaseDatePicker(Platform.OS === 'ios');
  //   setPurchaseDate(currentDate.toISOString().split('T')[0]);
  // };

  // const onChangeExpirationDate = (event: any, selectedDate?: Date) => { ... }; // Handled above

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Inserimento Manuale</Text>

        {/* Button to take a photo */}
        {!imageUrl && !isEditMode && ( // Show only if no image yet and not editing (to avoid confusion with existing image)
          <TouchableOpacity 
            style={styles.takePhotoButton} 
            onPress={() => {
              // Pass current form data to photo-capture so it can be returned
              const currentFormData = {
                name, brand, selectedCategory, quantity, unit, purchaseDate, expirationDate, notes, barcode
                // Do not pass imageUrl here, as we are about to capture it
              };
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

        {barcode && !imageUrl && ( // Show barcode only if no image
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
        />

        <Text style={styles.label}>Marca</Text>
        <TextInput
          style={styles.input}
          value={brand}
          onChangeText={setBrand}
          placeholder="Es. Granarolo"
        />

        <Text style={styles.label}>Categoria*</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCategory}
            style={styles.picker}
            onValueChange={handleCategoryChange} // Use the new handler
          >
            <Picker.Item label="Aggiungi Nuova Categoria..." value={ADD_NEW_CATEGORY_ID} />
            {dynamicCategories
              .filter(cat => cat.id !== 'other') // Exclude 'Altro' for now
              .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically
              .map((category) => (
                <Picker.Item key={category.id} label={category.name} value={category.id} />
              ))}
            {/* Add 'Altro' at the end if it exists in dynamicCategories */}
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
            />
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Unità*</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={unit}
                style={styles.picker}
                onValueChange={(itemValue: string) => setUnit(itemValue)}
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
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChangePurchaseDate}
            minimumDate={new Date(new Date().getFullYear() - 5, 0, 1)} // 5 years ago
            maximumDate={new Date()} // Today
          />
        )}

        <Text style={styles.label}>Data di Scadenza*</Text>
        <TouchableOpacity onPress={() => setShowExpirationDatePicker(true)} style={styles.dateInputTouchable}>
          <Text style={styles.dateTextValue}>{expirationDate ? new Date(expirationDate).toLocaleDateString('it-IT') : 'Seleziona Data'}</Text>
        </TouchableOpacity>
        {showExpirationDatePicker && (
          <DateTimePicker
            testID="expirationDatePicker"
            value={new Date(expirationDate || Date.now())}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChangeExpirationDate}
            minimumDate={new Date()} // Today
            // maximumDate can be set if needed, e.g., 10 years from now
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
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveProduct}>
          <Text style={styles.saveButtonText}>{isEditMode ? 'Aggiorna Prodotto' : 'Salva Prodotto'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        transparent={true}
        animationType="fade"
        visible={isCategoryModalVisible}
        onRequestClose={() => {
          setIsCategoryModalVisible(false);
          // Revert selection if modal is dismissed (e.g. Android back button)
          if (dynamicCategories.length > 0 && selectedCategory === ADD_NEW_CATEGORY_ID) {
            setSelectedCategory(dynamicCategories[0].id);
          }
        }}
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
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setIsCategoryModalVisible(false);
                  if (dynamicCategories.length > 0 && selectedCategory === ADD_NEW_CATEGORY_ID) {
                     // If user cancels, revert to the first actual category
                    setSelectedCategory(dynamicCategories.find(cat => cat.id !== ADD_NEW_CATEGORY_ID)?.id || '');
                  }
                }}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#334155',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
  },
  disabledInput: {
    backgroundColor: '#e2e8f0',
    color: '#64748b',
  },
  productImagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#e2e8f0', // Placeholder background
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden', // Needed for Picker border radius on Android
  },
  picker: {
    height: Platform.OS === 'ios' ? undefined : 50, // iOS picker height is intrinsic
    // width: '100%', // Not always needed, check layout
    color: '#1e293b',
    backgroundColor: Platform.OS === 'android' ? '#ffffff' : undefined, // Ensure bg for Android picker
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    marginRight: 8, // Add some spacing between columns
  },
  dateText: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
    textAlign: 'center',
  },
  dateInputTouchable: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12, // Adjusted padding for touchable
    justifyContent: 'center', // Center text vertically
  },
  dateTextValue: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
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
    backgroundColor: '#10B981', // Green, similar to photo add method card
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'stretch', // Changed from 'center'
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Changed to space-around for better spacing
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20, // Give more horizontal space
    borderRadius: 8,
    flex: 1, // Allow buttons to take space
    alignItems: 'center', // Center text in button
  },
  modalButtonCancel: {
    backgroundColor: '#e2e8f0',
    marginRight: 10, // Space between buttons
  },
  modalButtonConfirm: {
    backgroundColor: '#2563EB',
    marginLeft: 10, // Space between buttons
  },
  modalButtonTextCancel: {
    color: '#1e293b',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  modalButtonTextConfirm: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
});
