import React, { useCallback } from 'react';
import { View, Text, TextInput, AccessibilityProps } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Quantity as FormQuantity } from '@/context/ManualEntryContext';
import { QuantitySection } from './QuantitySection';
import { DatePickerRow } from './DatePickerRow';
import { ExpirationPhotoButton } from './PhotoCaptureButton';
import { FormActionButtons } from './FormActionButtons';
import { getStyles } from './ProductFormFooter.styles';

interface FormData {
  name: string;
  brand: string;
  selectedCategory: string;
  purchaseDate: string;
  expirationDate: string;
  notes: string;
  barcode: string;
  imageUrl: string | null;
}

interface DateHandlers {
  setShowPurchaseDatePicker: (value: boolean) => void;
  setShowExpirationDatePicker: (value: boolean) => void;
  onChangePurchaseDate: (event: DateTimePickerEvent, selectedDate?: Date) => void;
  onChangeExpirationDate: (event: DateTimePickerEvent, selectedDate?: Date) => void;
}

interface QuantityHandlers {
  updateQuantity: (id: string, field: 'quantity' | 'unit', value: string) => void;
  addQuantity: () => void;
  removeQuantity: (id: string) => void;
}

interface ProductFormFooterProps extends AccessibilityProps {
  formData: FormData;
  dateHandlers: DateHandlers;
  quantityHandlers: QuantityHandlers;
  quantities: FormQuantity[];
  setNotes: (value: string) => void;
  handleSaveProduct: () => void;
  isEditMode: boolean;
  showPurchaseDatePicker: boolean;
  showExpirationDatePicker: boolean;
  loading: boolean;
}

export const ProductFormFooter = React.memo(
  ({
    formData,
    dateHandlers,
    quantityHandlers,
    quantities,
    setNotes,
    handleSaveProduct,
    isEditMode,
    showPurchaseDatePicker,
    showExpirationDatePicker,
    loading,
    accessible = true,
    accessibilityLabel = 'Product form footer',
  }: ProductFormFooterProps) => {
    const { isDarkMode } = useTheme();
    const styles = getStyles(isDarkMode);

    const handleNotesChange = useCallback(
      (text: string) => {
        setNotes(text);
      },
      [setNotes]
    );

    const photoButtonFormData = {
      name: formData.name,
      brand: formData.brand,
      selectedCategory: formData.selectedCategory,
      purchaseDate: formData.purchaseDate,
      expirationDate: formData.expirationDate,
      notes: formData.notes,
      barcode: formData.barcode,
      imageUrl: formData.imageUrl,
    };

    return (
      <View accessible={accessible} accessibilityLabel={accessibilityLabel}>
        <QuantitySection
          quantities={quantities}
          handlers={quantityHandlers}
          isDarkMode={isDarkMode}
        />

        <DatePickerRow
          purchaseDate={formData.purchaseDate}
          expirationDate={formData.expirationDate}
          showPurchaseDatePicker={showPurchaseDatePicker}
          showExpirationDatePicker={showExpirationDatePicker}
          handlers={dateHandlers}
          isDarkMode={isDarkMode}
          renderPhotoButton={
            <ExpirationPhotoButton
              formData={photoButtonFormData}
              isDarkMode={isDarkMode}
              mode="expirationDateOnly"
            />
          }
        />

        <Text style={styles.helperText}>
          Puoi anche selezionare una foto dalla galleria nella schermata della fotocamera.
        </Text>

        <Text style={styles.label}>Note</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.notes}
          onChangeText={handleNotesChange}
          placeholder="Eventuali note aggiuntive..."
          multiline
          numberOfLines={3}
          placeholderTextColor={isDarkMode ? '#8b949e' : '#64748b'}
          accessible={true}
          accessibilityLabel="Notes"
          accessibilityRole="text"
          accessibilityHint="Enter additional notes about the product"
        />

        <FormActionButtons
          onSave={handleSaveProduct}
          isEditMode={isEditMode}
          isLoading={loading}
          isDarkMode={isDarkMode}
        />
      </View>
    );
  }
);

ProductFormFooter.displayName = 'ProductFormFooter';

export default ProductFormFooter;
