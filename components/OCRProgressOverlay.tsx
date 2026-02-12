import React, { memo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { PhotoCaptureStyles } from '@/app/_photo-capture.styles';

/**
 * Props for OCRProgressOverlay component
 */
interface OCRProgressOverlayProps {
  /** Current styles based on theme */
  styles: PhotoCaptureStyles;
  /** OCR processing state and progress information */
  ocrProgress: {
    isProcessing: boolean;
    progress: number;
    currentStep: string;
  };
  /** Callback to cancel OCR processing and return to camera */
  onCancel: () => void;
}

/**
 * OCR progress overlay component.
 * Displays a modal overlay with loading indicator, progress bar,
 * and current OCR processing step. Allows users to cancel the operation.
 */
export const OCRProgressOverlay: React.FC<OCRProgressOverlayProps> = memo(({
  styles,
  ocrProgress,
  onCancel,
}) => {
  // Don't render if not processing
  if (!ocrProgress.isProcessing) {
    return null;
  }

  return (
    <View style={styles.ocrOverlay}>
      <View style={styles.ocrProgressContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.ocrProgressText}>
          Analisi immagine in corso...
        </Text>
        <Text style={styles.ocrProgressStep}>
          {ocrProgress.currentStep}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${ocrProgress.progress}%` }
            ]}
          />
        </View>
        <TouchableOpacity
          style={styles.resetOcrButton}
          onPress={onCancel}
        >
          <Text style={styles.resetOcrButtonText}>Annulla</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

OCRProgressOverlay.displayName = 'OCRProgressOverlay';
