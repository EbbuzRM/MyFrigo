import React, { useCallback } from 'react';
import { Text, TouchableOpacity, Image, View, AccessibilityProps } from 'react-native';
import { usePhotoNavigation, PhotoNavigationParams } from '@/hooks/usePhotoNavigation';
import { getPhotoCaptureStyles, getButtonStyles } from './ProductFormHeader.styles';

// ============================================================================
// EXPIRATION DATE BUTTON (for Footer)
// ============================================================================

interface ExpirationPhotoButtonProps extends AccessibilityProps {
  formData: PhotoNavigationParams;
  isDarkMode: boolean;
  mode?: 'expirationDateOnly' | 'full';
  accessible?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

/**
 * ExpirationPhotoButton - Button for capturing expiration date
 * Used by ProductFormFooter
 */
export const ExpirationPhotoButton = React.memo(({
  formData,
  isDarkMode,
  mode = 'expirationDateOnly',
  accessible = true,
  accessibilityLabel = 'Capture expiration date with camera',
  testID = 'capture-expiration-date-button',
}: ExpirationPhotoButtonProps) => {
  const styles = getButtonStyles(isDarkMode);
  const { navigateToPhotoCapture } = usePhotoNavigation();

  const handlePress = useCallback(() => {
    navigateToPhotoCapture(formData, mode);
  }, [navigateToPhotoCapture, formData, mode]);

  return (
    <TouchableOpacity
      style={styles.photoButton}
      onPress={handlePress}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityHint="Opens camera to capture expiration date"
      testID={testID}
    >
      <Text style={styles.photoButtonText}>
        {mode === 'expirationDateOnly' ? 'Fotografa la scadenza' : 'Scatta Foto'}
      </Text>
    </TouchableOpacity>
  );
});

ExpirationPhotoButton.displayName = 'ExpirationPhotoButton';

// ============================================================================
// PRODUCT PHOTO BUTTON (for Header)  
// ============================================================================

interface ProductPhotoButtonProps extends AccessibilityProps {
  /** Current image URL if available */
  imageUrl: string | null;
  /** Barcode value to display when no image */
  barcode?: string;
  /** Dark mode flag for theming */
  isDarkMode: boolean;
  /** Callback when user taps to capture/update photo */
  onPhotoPress: () => void;
  /** Accessibility label for the button */
  accessibilityLabel?: string;
  /** Test ID for testing */
  testID?: string;
}

/**
 * ProductPhotoButton - Component for product photo capture with preview
 * 
 * Displays either:
 * - A button to capture photo when no image exists
 * - A preview image with tap to change functionality when image exists
 * 
 * Used by ProductFormHeader
 */
export const ProductPhotoButton = React.memo(({
  imageUrl,
  barcode,
  isDarkMode,
  onPhotoPress,
  accessibilityLabel = imageUrl ? 'Tap to change product photo' : 'Capture product photo',
  testID = 'photo-capture-button',
}: ProductPhotoButtonProps) => {
  const styles = getPhotoCaptureStyles(isDarkMode);

  const handlePress = useCallback(() => {
    onPhotoPress();
  }, [onPhotoPress]);

  // No image - show capture button
  if (!imageUrl) {
    return (
      <TouchableOpacity
        style={styles.noImageButton}
        onPress={handlePress}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        testID={`${testID}-capture`}
      >
        <Text style={styles.noImageButtonText}>
          {barcode ? 'Aggiungi Foto Prodotto' : 'Scatta Foto Prodotto'}
        </Text>
      </TouchableOpacity>
    );
  }

  // Has image - show preview with tap to change
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.imageTouchable}
        onPress={handlePress}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        testID={`${testID}-preview`}
      >
        <Text style={styles.imageLabel}>
          Immagine Prodotto (clicca per modificare)
        </Text>
        <Image
          source={{ uri: imageUrl }}
          style={styles.productImage}
          resizeMode="contain"
          accessibilityIgnoresInvertColors={true}
        />
      </TouchableOpacity>
    </View>
  );
});

ProductPhotoButton.displayName = 'ProductPhotoButton';

// ============================================================================
// LEGACY EXPORT (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use ExpirationPhotoButton or ProductPhotoButton instead
 */
export const PhotoCaptureButton = ExpirationPhotoButton;

// Default export for easier imports
export default ProductPhotoButton;
