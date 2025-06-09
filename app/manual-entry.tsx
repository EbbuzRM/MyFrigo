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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Product, PRODUCT_CATEGORIES } from '@/types/Product';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import { StorageService } from '@/services/StorageService';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

export default function ManualEntryScreen() {
  const params = useLocalSearchParams();
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(PRODUCT_CATEGORIES[0]?.id || '');
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
    } else if (params.barcode && typeof params.barcode === 'string') {
      setBarcode(params.barcode);
      console.log('Barcode ricevuto in ManualEntryScreen:', params.barcode);
    }
    if (params.imageUrl && typeof params.imageUrl === 'string') {
      setImageUrl(params.imageUrl);
      console.log('Immagine ricevuta in ManualEntryScreen:', params.imageUrl);
      // If an image is received, clear barcode as photo takes precedence
      setBarcode(''); 
    }
    if (params.extractedExpirationDate && typeof params.extractedExpirationDate === 'string' && !params.productId) { // Only prefill if not editing
      setExpirationDate(params.extractedExpirationDate);
      console.log('Data di scadenza estratta ricevuta:', params.extractedExpirationDate);
    }
  }, [params]);

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
            onValueChange={(itemValue: string) => setSelectedCategory(itemValue)}
          >
            {PRODUCT_CATEGORIES.map((category) => (
              <Picker.Item key={category.id} label={category.name} value={category.id} />
            ))}
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
            <TextInput
              style={styles.input}
              value={unit}
              onChangeText={setUnit}
              placeholder="Es. pz, L, kg"
            />
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
});
