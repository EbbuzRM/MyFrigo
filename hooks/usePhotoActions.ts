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
 * Interface for photo actions hook return values
 */
interface UsePhotoActionsReturn {
  /** Confirm the captured photo and process based on capture mode */
  confirmPhoto: (capturedImage: string | null, captureMode: CaptureMode) => Promise<void>;
  /** Extract expiration date using OCR */
  extractExpirationDate: (imageUri: string) => Promise<OCRResult>;
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
   * Handle expiration date extraction and navigation
   * @param imageUri - The captured image URI
   * @param productId - Optional product ID for edit mode
   */
  const handleExpirationDateExtraction = useCallback(async (
    imageUri: string,
    productId?: string
  ): Promise<void> => {
    try {
      const ocrResult = await extractOCRDate(imageUri);

      if (ocrResult.success && ocrResult.extractedDate) {
        setExpirationDate(ocrResult.extractedDate);
        
        const returnParams = {
          ...params,
          expirationDate: ocrResult.extractedDate,
          fromPhotoCapture: 'true',
          // Force edit mode if coming from existing product
          isEditMode: productId ? 'true' : (params.isEditMode || 'false')
        };

        Alert.alert(
          "Data Rilevata",
          `Data di scadenza rilevata: ${ocrResult.extractedDate}`,
          [{ 
            text: 'OK', 
            onPress: () => router.replace({ pathname: '/manual-entry', params: returnParams }) 
          }]
        );
        
        LoggingService.info('usePhotoActions', `Expiration date extracted: ${ocrResult.extractedDate}`);
      } else {
        // No date detected - show options to retry or enter manually
        Alert.alert(
          "Data Non Rilevata",
          ocrResult.error || "Non è stato possibile trovare una data di scadenza nell'immagine.",
          [
            {
              text: 'Inserisci manualmente',
              onPress: () => router.replace({ 
                pathname: '/manual-entry', 
                params: { ...params, isEditMode: 'false' } 
              }),
              style: 'cancel'
            },
            {
              text: 'Riprova',
              onPress: () => {
                // Reset will be handled by caller
                resetProgress();
              }
            }
          ]
        );
        
        LoggingService.warning('usePhotoActions', 'No expiration date detected in image');
      }
    } catch (error) {
      LoggingService.error('usePhotoActions', 'Error extracting expiration date', error);
      throw error;
    }
  }, [extractOCRDate, setExpirationDate, params, resetProgress]);

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
   * Confirm the captured photo and process based on capture mode
   * @param capturedImage - The captured image URI
   * @param captureMode - The mode determining how to process the photo
   */
  const confirmPhoto = useCallback(async (
    capturedImage: string | null, 
    captureMode: CaptureMode
  ): Promise<void> => {
    if (!capturedImage) {
      LoggingService.warning('usePhotoActions', 'Confirm photo called with null image');
      return;
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
          break;

        case 'expirationDateOnly':
          await handleExpirationDateExtraction(capturedImage, productId);
          break;

        case 'productPhoto':
        default:
          await handleProductPhotoCapture(capturedImage);
          break;
      }
    } catch (error) {
      LoggingService.error('usePhotoActions', 'Error in confirmPhoto', error);
      Alert.alert(
        "Errore",
        "Si è verificato un errore durante l'elaborazione dell'immagine.",
        [{ text: 'OK' }]
      );
    }
  }, [
    params.productId, 
    handleUpdateProductPhoto, 
    handleExpirationDateExtraction, 
    handleProductPhotoCapture
  ]);

  return {
    confirmPhoto,
    extractExpirationDate: extractOCRDate,
    ocrProgress,
    resetOCRProgress: resetProgress,
  };
};
