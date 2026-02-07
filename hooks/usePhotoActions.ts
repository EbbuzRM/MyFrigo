import { useCallback } from 'react';
import { Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LoggingService } from '@/services/LoggingService';
import { ProductStorage } from '@/services/ProductStorage';
import { useManualEntry } from '@/context/ManualEntryContext';
import { usePhotoOCR, OCRResult } from '@/hooks/usePhotoOCR';
import { CaptureMode } from '@/hooks/useCamera';

/**
 * Parameters passed via router
 */
interface RouterParams {
  productId?: string;
  isEditMode?: string;
  [key: string]: string | undefined;
}

/**
 * Result of confirming a photo
 */
export type ConfirmPhotoResult = 'success' | 'retry';

/**
 * Interface for photo actions hook return values
 */
interface UsePhotoActionsReturn {
  /** Confirm the captured photo and process based on capture mode */
  confirmPhoto: (capturedImage: string | null, captureMode: CaptureMode) => Promise<ConfirmPhotoResult>;
  /** Extract expiration date using OCR and return result for UI display */
  extractExpirationDate: (imageUri: string) => Promise<OCRResult>;
  /** Navigate to manual entry with extracted date */
  navigateToManualEntry: (expirationDate: string) => void;
  /** Current OCR progress state */
  ocrProgress: {
    isProcessing: boolean;
    progress: number;
    currentStep: string;
  };
  /** Reset OCR progress */
  resetOCRProgress: () => void;
}

/**
 * Hook to manage photo confirmation actions and routing.
 * Handles different capture modes: expiration date extraction,
 * product photo updates, and navigation.
 */
export const usePhotoActions = (): UsePhotoActionsReturn => {
  const params = useLocalSearchParams() as RouterParams;
  const { setImageUrl, setExpirationDate } = useManualEntry();
  const { extractExpirationDate: extractOCRDate, ocrProgress, resetProgress } = usePhotoOCR();

  /**
   * Handle updating product photo
   * @param productId - The product ID to update
   * @param imageUri - The captured image URI
   */
  const handleUpdateProductPhoto = useCallback(async (
    productId: string, 
    imageUri: string
  ): Promise<void> => {
    try {
      await ProductStorage.updateProductImage(productId, imageUri);
      
      Alert.alert(
        "Foto Aggiornata",
        "L'immagine del prodotto è stata aggiornata con successo.",
        [{ text: 'OK', onPress: () => router.back() }]
      );
      
      LoggingService.info('usePhotoActions', `Product ${productId} image updated`);
    } catch (error) {
      LoggingService.error('usePhotoActions', 'Error updating product image', error);
      throw error;
    }
  }, []);

  /**
   * Handle expiration date extraction
   * @param imageUri - The captured image URI
   * @returns OCR result with extracted date or error info
   */
  const handleExpirationDateExtraction = useCallback(async (
    imageUri: string
  ): Promise<OCRResult> => {
    try {
      const ocrResult = await extractOCRDate(imageUri);

      if (ocrResult.success && ocrResult.extractedDate) {
        setExpirationDate(ocrResult.extractedDate);
        LoggingService.info('usePhotoActions', `Expiration date extracted: ${ocrResult.extractedDate}`);
      } else {
        LoggingService.warning('usePhotoActions', 'No expiration date detected in image');
      }

      return ocrResult;
    } catch (error) {
      LoggingService.error('usePhotoActions', 'Error extracting expiration date', error);
      throw error;
    }
  }, [extractOCRDate, setExpirationDate]);

  /**
   * Handle product photo capture (default mode)
   * @param imageUri - The captured image URI
   */
  const handleProductPhotoCapture = useCallback(async (imageUri: string): Promise<void> => {
    try {
      LoggingService.info('usePhotoActions', `Setting product image URL: ${imageUri}`);
      setImageUrl(imageUri);
      // Go back to previous screen (manual-entry) which will preserve its state
      router.back();
    } catch (error) {
      LoggingService.error('usePhotoActions', 'Error setting product image URL', error);
      throw error;
    }
  }, [setImageUrl]);

  /**
   * Navigate to manual entry with extracted date
   * @param expirationDate - The extracted expiration date
   */
  const navigateToManualEntry = useCallback((expirationDate: string) => {
    const returnParams = {
      ...params,
      expirationDate,
      fromPhotoCapture: 'true',
      isEditMode: params.isEditMode || 'false'
    };
    router.replace({ pathname: '/manual-entry', params: returnParams });
  }, [params]);

  /**
   * Confirm the captured photo and process based on capture mode
   * @param capturedImage - The captured image URI
   * @param captureMode - The mode determining how to process the photo
   * @returns 'success' if photo was processed successfully
   */
  const confirmPhoto = useCallback(async (
    capturedImage: string | null, 
    captureMode: CaptureMode
  ): Promise<ConfirmPhotoResult> => {
    if (!capturedImage) {
      LoggingService.warning('usePhotoActions', 'Confirm photo called with null image');
      return 'success';
    }

    const productId = params.productId;

    try {
      switch (captureMode) {
        case 'updateProductPhoto':
          if (productId) {
            await handleUpdateProductPhoto(productId, capturedImage);
          } else {
            LoggingService.error('usePhotoActions', 'updateProductPhoto mode without productId');
            Alert.alert("Errore", "ID prodotto mancante per l'aggiornamento.", [{ text: 'OK' }]);
          }
          return 'success';

        case 'expirationDateOnly':
          // For expiration date mode, we return success immediately
          // The actual OCR and date display is handled separately by the component
          return 'success';

        case 'productPhoto':
        default:
          await handleProductPhotoCapture(capturedImage);
          return 'success';
      }
    } catch (error) {
      LoggingService.error('usePhotoActions', 'Error in confirmPhoto', error);
      Alert.alert(
        "Errore",
        "Si è verificato un errore durante l'elaborazione dell'immagine.",
        [{ text: 'OK' }]
      );
      return 'success';
    }
  }, [
    params.productId, 
    handleUpdateProductPhoto, 
    handleProductPhotoCapture
  ]);

  return {
    confirmPhoto,
    extractExpirationDate: handleExpirationDateExtraction,
    navigateToManualEntry,
    ocrProgress,
    resetOCRProgress: resetProgress,
  };
};
