
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '@/context/ThemeContext';
import { formStateLogger } from '@/utils/FormStateLogger';
import { CustomDatePicker } from './CustomDatePicker';
import QuantityInputRow from './QuantityInputRow';
import { Quantity as FormQuantity } from '@/context/ManualEntryContext';
import { LoggingService } from '@/services/LoggingService';

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
  name,
  brand,
  selectedCategory,
  barcode,
  imageUrl,
  loading,
  navigatingToPhotoCapture,
}: ProductFormFooterProps) => {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  LoggingService.debug('ProductFormFooter', 'Rendering', { expirationDate });

  return (
    <>
      {quantities.map((item) => (
        <QuantityInputRow
          key={item.id}
          item={item}
          updateQuantity={updateQuantity}
          removeQuantity={removeQuantity}
          isOnlyOne={quantities.length === 1}
        />
      ))}

      {quantities.length > 1 && (
        <View style={styles.quantitiesSummary}>
          <Text style={styles.quantitiesSummaryText}>
            Quantità totali: {quantities.map(q => `${q.quantity} ${q.unit}`).join(', ')}
          </Text>
        </View>
      )}

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
              captureMode: 'expirationDateOnly',
            };
            formStateLogger.logNavigation('CAPTURE_EXPIRATION', 'manual-entry', 'photo-capture', currentFormData);
            navigatingToPhotoCapture.current = true;
            router.push({
              pathname: '/photo-capture',
              params: currentFormData,
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
        placeholderTextColor={isDarkMode ? '#8b949e' : '#64748b'}
      />

      <TouchableOpacity style={[styles.saveButton, loading && styles.saveButtonDisabled]} onPress={handleSaveProduct} disabled={loading}>
        {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveButtonText}>{isEditMode ? 'Aggiorna Prodotto' : 'Salva Prodotto'}</Text>}
      </TouchableOpacity>
    </>
  );
});

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  quantitiesSummary: {
    backgroundColor: isDarkMode ? '#21262d' : '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
  },
  quantitiesSummaryText: {
    fontSize: 14,
    color: isDarkMode ? '#8b949e' : '#475569',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
});

export default ProductFormFooter;
