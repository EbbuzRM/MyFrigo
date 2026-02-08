import React, { memo } from 'react';
import { View, Image, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Check, RefreshCw, Calendar, Edit2 } from 'lucide-react-native';
import { PhotoCaptureStyles } from '@/app/_photo-capture.styles';
import { OCRProgressOverlay } from './OCRProgressOverlay';
import { CaptureMode } from '@/hooks/useCamera';

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
  /** Extracted expiration date from OCR */
  extractedDate?: string | null;
  /** Whether to show the date confirmation UI */
  showDateConfirmation?: boolean;
  /** Callback to confirm the extracted date */
  onConfirmDate?: () => void;
  /** Callback to edit the extracted date */
  onEditDate?: () => void;
  /** Current capture mode */
  captureMode?: CaptureMode;
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
  extractedDate,
  showDateConfirmation,
  onConfirmDate,
  onEditDate,
  captureMode,
}) => {
  const isOCRProcessing = ocrProgress.isProcessing;
  const isExpirationMode = captureMode === 'expirationDateOnly';

  return (
    <>
      <Image
        source={{ uri: capturedImage }}
        style={styles.previewImage}
        accessibilityLabel="Immagine scattata del prodotto"
        accessibilityHint="Tocca conferma per procedere o riprova per scattare una nuova foto"
        testID="preview-image"
      />

      {/* OCR Progress Overlay */}
      <OCRProgressOverlay
        styles={styles}
        ocrProgress={ocrProgress}
        onCancel={onCancelOCR}
      />

      {/* Date Confirmation Overlay */}
      {isExpirationMode && showDateConfirmation && extractedDate && (
        <View style={styles.dateConfirmationOverlay}>
          <View style={styles.dateConfirmationPanel}>
            <View style={styles.dateIconContainer}>
              <Calendar size={32} color="#4CAF50" />
            </View>
            <Text style={styles.dateConfirmationTitle}>Data Rilevata</Text>
            <Text style={styles.dateConfirmationDate} testID="expiration-date-display">{extractedDate}</Text>
            <Text style={styles.dateConfirmationSubtitle}>
              Verifica che la data sia corretta
            </Text>

            <View style={styles.dateConfirmationButtons}>
              <TouchableOpacity
                style={[styles.dateButton, styles.dateButtonConfirm]}
                onPress={onConfirmDate}
                accessibilityLabel="Conferma data"
                accessibilityRole="button"
                testID="confirm-date-button"
              >
                <Check size={20} color="#fff" />
                <Text style={styles.dateButtonText}>Conferma</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dateButton, styles.dateButtonEdit]}
                onPress={onEditDate}
                accessibilityLabel="Modifica data"
                accessibilityRole="button"
                testID="edit-date-button"
              >
                <Edit2 size={20} color="#fff" />
                <Text style={styles.dateButtonText}>Modifica</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dateButton, styles.dateButtonRetry]}
                onPress={onRetake}
                accessibilityLabel="Scatta di nuovo"
                accessibilityRole="button"
              >
                <RefreshCw size={20} color="#fff" />
                <Text style={styles.dateButtonText}>Riprova</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Standard Controls - Hidden when showing date confirmation */}
      {(!isExpirationMode || !showDateConfirmation) && (
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
      )}
    </>
  );
});

PhotoPreview.displayName = 'PhotoPreview';
