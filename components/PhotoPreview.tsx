// PhotoPreview.tsx — PhotoPreview module.
//
// exports: PhotoPreview
// used_by: app\photo-capture.tsx
// rules:   - OCR progress state must be properly managed to prevent UI blocking during image processing operations
//          - Capture mode determines which UI elements and callbacks are rendered, requiring consistent mode-based conditional rendering throughout
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Image, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Check, RefreshCw, Calendar, Edit2 } from 'lucide-react-native';
import { PhotoCaptureStyles } from '@/styles/photo-capture.styles';
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
  const { t } = useTranslation();
  const isExpirationMode = captureMode === 'expirationDateOnly';

  return (
    <>
      <Image
        source={{ uri: capturedImage }}
        style={styles.previewImage}
        accessibilityLabel={t('scanner.capturedImage')}
        accessibilityHint={t('scanner.capturedImageHint')}
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
            <Text style={styles.dateConfirmationTitle}>{t('scanner.dateDetected')}</Text>
            <Text style={styles.dateConfirmationDate} testID="expiration-date-display">{extractedDate}</Text>
            <Text style={styles.dateConfirmationSubtitle}>
              {t('scanner.verifyDate')}
            </Text>

            <View style={styles.dateConfirmationButtons}>
              <TouchableOpacity
                style={[styles.dateButton, styles.dateButtonConfirm]}
                onPress={onConfirmDate}
                accessibilityLabel={t('scanner.confirmDate')}
                accessibilityRole="button"
                testID="confirm-date-button"
              >
                <Check size={20} color="#fff" />
                <Text style={styles.dateButtonText}>{t('common.confirm')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dateButton, styles.dateButtonEdit]}
                onPress={onEditDate}
                accessibilityLabel={t('scanner.editDate')}
                accessibilityRole="button"
                testID="edit-date-button"
              >
                <Edit2 size={20} color="#fff" />
                <Text style={styles.dateButtonText}>{t('scanner.edit')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dateButton, styles.dateButtonRetry]}
                onPress={onRetake}
                accessibilityLabel={t('scanner.retakePhoto')}
                accessibilityRole="button"
              >
                <RefreshCw size={20} color="#fff" />
                <Text style={styles.dateButtonText}>{t('common.retry')}</Text>
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
            accessibilityLabel={t('scanner.retakePhoto')}
            accessibilityRole="button"
            disabled={isProcessingImage}
            accessibilityState={{ disabled: isProcessingImage }}
          >
            <RefreshCw size={20} color="#fff" />
            <Text style={styles.controlButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              styles.confirmButton,
              isProcessingImage && styles.buttonDisabled
            ]}
            onPress={onConfirm}
            accessibilityLabel={t('scanner.confirmProceed')}
            accessibilityRole="button"
            disabled={isProcessingImage}
            accessibilityState={{ disabled: isProcessingImage }}
          >
            {isProcessingImage ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Check size={24} color="#fff" />
            )}
            <Text style={styles.controlButtonText}>
              {isProcessingImage ? t('scanner.processing') : t('common.confirm')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
});

PhotoPreview.displayName = 'PhotoPreview';
