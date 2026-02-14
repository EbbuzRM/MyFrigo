import React, { useCallback } from 'react';
import { Text, TextInput, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { formStateLogger } from '@/utils/FormStateLogger';
import PhotoCaptureButton from './PhotoCaptureButton';
import ProductNameInput from './ProductNameInput';
import BrandInput from './BrandInput';
import { getHeaderStyles, getInputStyles } from './ProductFormHeader.styles';

/**
 * Product data group
 */
interface ProductData {
  name: string;
  brand: string;
  selectedCategory: string;
  isEditMode: boolean;
  originalProductId?: string | null;
}

/**
 * Form actions group
 */
interface FormActions {
  setName: (value: string) => void;
  setBrand: (value: string) => void;
}

/**
 * Photo configuration group
 */
interface PhotoConfig {
  imageUrl: string | null;
  barcode: string;
  navigatingToPhotoCapture: React.MutableRefObject<boolean>;
}

/**
 * Additional form data needed for navigation
 */
interface FormData {
  purchaseDate: string;
  expirationDate: string;
  notes: string;
}

/**
 * Props for ProductFormHeader component
 */
interface ProductFormHeaderProps {
  productData: ProductData;
  formActions: FormActions;
  photoConfig: PhotoConfig;
  formData: FormData;
  isFrozen: boolean;
  setIsFrozen: (value: boolean) => void;
}

/**
 * ProductFormHeader - Header section of product form with grouped props
 * 
 * Features:
 * - Grouped props for better maintainability (reduced from 20 to 6 top-level groups)
 * - Extracted sub-components for reusability
 * - Memoized callbacks for performance
 * - Full accessibility support
 * 
 * @example
 * <ProductFormHeader
 *   productData={{ name, brand, selectedCategory, isEditMode, originalProductId }}
 *   formActions={{ setName, setBrand }}
 *   photoConfig={{ imageUrl, barcode, navigatingToPhotoCapture }}
 *   formData={{ purchaseDate, expirationDate, notes }}
 *   isFrozen={isFrozen}
 *   setIsFrozen={setIsFrozen}
 * />
 */
const ProductFormHeader = React.memo(({
  productData,
  formActions,
  photoConfig,
  formData,
  isFrozen,
  setIsFrozen,
}: ProductFormHeaderProps) => {
  const { isDarkMode } = useTheme();
  const headerStyles = getHeaderStyles(isDarkMode);
  const inputStyles = getInputStyles(isDarkMode);

  const { name, brand, isEditMode } = productData;
  const { setName, setBrand } = formActions;
  const { imageUrl, barcode, navigatingToPhotoCapture } = photoConfig;
  const { purchaseDate, expirationDate, notes } = formData;

  /**
   * Navigate to photo capture screen with current form state
   */
  const handlePhotoPress = useCallback(() => {
    const currentFormData = {
      name,
      brand,
      selectedCategory: productData.selectedCategory,
      purchaseDate,
      expirationDate,
      notes,
      barcode,
      fromManualEntry: 'true',
    };

    formStateLogger.logNavigation(
      'TAKE_PHOTO',
      'manual-entry',
      'photo-capture',
      currentFormData
    );

    navigatingToPhotoCapture.current = true;
    const captureMode = isEditMode ? 'updateProductPhoto' : 'productPhoto';
    router.push({
      pathname: '/photo-capture',
      params: {
        captureMode,
        ...currentFormData,
      },
    });

    setTimeout(() => {
      navigatingToPhotoCapture.current = false;
    }, 500);
  }, [
    name,
    brand,
    productData.selectedCategory,
    purchaseDate,
    expirationDate,
    notes,
    barcode,
    isEditMode,
    navigatingToPhotoCapture,
  ]);

  /**
   * Handle freezer toggle
   */
  const handleFrozenToggle = useCallback((value: boolean) => {
    setIsFrozen(value);
  }, [setIsFrozen]);

  return (
    <>
      <Text style={headerStyles.title} accessibilityRole="header">
        {isEditMode ? 'Modifica Prodotto' : 'Inserimento Manuale'}
      </Text>

      <PhotoCaptureButton
        imageUrl={imageUrl}
        barcode={barcode}
        isDarkMode={isDarkMode}
        onPhotoPress={handlePhotoPress}
        testID="product-photo-capture"
      />

      {barcode && !imageUrl && (
        <>
          <Text style={headerStyles.label}>Codice a Barre Scansionato</Text>
          <TextInput
            style={[inputStyles.input, inputStyles.disabledInput]}
            value={barcode}
            editable={false}
            accessibilityLabel="Scanned barcode"
            accessibilityHint="Barcode value from scan, cannot be edited"
            testID="barcode-display"
          />
        </>
      )}

      <ProductNameInput
        value={name}
        onChangeText={setName}
        required={true}
        testID="product-name-input"
      />

      <BrandInput
        value={brand}
        onChangeText={setBrand}
        testID="brand-input"
      />

      <View style={headerStyles.switchContainer}>
        <Text style={headerStyles.label}>(Freezer)</Text>
        <Switch
          value={isFrozen}
          onValueChange={handleFrozenToggle}
          trackColor={{
            false: isDarkMode ? '#30363d' : '#cbd5e1',
            true: '#2563EB',
          }}
          thumbColor={isDarkMode ? '#c9d1d9' : '#ffffff'}
          accessibilityLabel="Freezer storage toggle"
          accessibilityHint="Toggle to mark product as stored in freezer"
          accessibilityState={{ checked: isFrozen }}
          testID="freezer-toggle"
        />
      </View>
    </>
  );
});

ProductFormHeader.displayName = 'ProductFormHeader';

export default ProductFormHeader;
