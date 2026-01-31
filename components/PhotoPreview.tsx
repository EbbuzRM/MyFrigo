import React, { memo } from 'react';
import { View, Image, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Check, RefreshCw } from 'lucide-react-native';
import { PhotoCaptureStyles } from '@/app/photo-capture.styles';
import { OCRProgressOverlay } from './OCRProgressOverlay';

/**
 * Props for PhotoPreview component
 */
interface PhotoPreviewProps {
  /** URI of the captured image to display */
  capturedImage: string;
  /** Current styles based on theme */
  styles: PhotoCaptureStyles;
  /** Whether an image processing operation is in progress */
  isProcessingImage: boolean;
  /** OCR processing state and progress information */
  ocrProgress: {
    isProcessing: boolean;
    progress: number;
    currentStep: string;
  };
  /** Callback to reset the captured image and return to camera */
  onRetake: () => void;
  /** Callback to confirm the captured image */
  onConfirm: () => void;
  /** Callback to cancel OCR processing */
  onCancelOCR: () => void;
}

/**
 * Photo preview component with confirmation controls.
 * Displays the captured image with options to confirm or retry,
 * and shows OCR processing overlay when active.
 */
export const PhotoPreview: React.FC<PhotoPreviewProps> = memo(({
  capturedImage,
  styles,
  isProcessingImage,
  ocrProgress,
  onRetake,
  onConfirm,
  onCancelOCR,
}) => {
  const isOCRProcessing = ocrProgress.isProcessing;

  return (
    <>
      <Image
        source={{ uri: capturedImage }}
        style={styles.previewImage}
        accessibilityLabel="Immagine scattata del prodotto"
        accessibilityHint="Tocca conferma per procedere o riprova per scattare una nuova foto"
      />

      {/* OCR Progress Overlay */}
      <OCRProgressOverlay
        styles={styles}
        ocrProgress={ocrProgress}
        onCancel={onCancelOCR}
      />

      <View style={styles.previewControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={onRetake}
          accessibilityLabel="Scatta una nuova foto"
          accessibilityRole="button"
          disabled={isProcessingImage}
        >
          <RefreshCw size={20} color="#fff" />
          <Text style={styles.controlButtonText}>Riprova</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.confirmButton,
            isProcessingImage && styles.buttonDisabled
          ]}
          onPress={onConfirm}
          accessibilityLabel="Conferma e procedi"
          accessibilityRole="button"
          disabled={isProcessingImage}
        >
          {isProcessingImage ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Check size={24} color="#fff" />
          )}
          <Text style={styles.controlButtonText}>
            {isProcessingImage ? 'Elaborazione...' : 'Conferma'}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
});

PhotoPreview.displayName = 'PhotoPreview';
