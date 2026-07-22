// useCamera.ts — useCamera module.
//
// exports: CaptureMode | useCamera
// used_by: app\photo-capture.tsx
//                   components\CameraView.tsx
//                   components\PhotoPreview.tsx
//                   hooks\usePhotoActions.ts
// rules:   - This hook must remain a pure camera management layer, never containing UI rendering logic or business-specific image processing; all capture mode behaviors must be controlled by the consuming component.
//          - Camera and gallery permissions must be requested separately and independently, never combined into a single permission request.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { useRef, useCallback, useState, useEffect, RefObject } from 'react';
import { Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { router } from 'expo-router';
import { LoggingService } from '@/services/LoggingService';
import { saveImagePermanently } from '@/utils/imageStorage';

/**
 * Type for capture mode
 */
export type CaptureMode = 'expirationDateOnly' | 'updateProductPhoto' | 'productPhoto';

/**
 * Interface for camera hook return values
 */
interface UseCameraReturn {
  /** Camera reference for taking pictures */
  cameraRef: React.RefObject<CameraView | null>;
  /** Whether camera permission is granted */
  hasCameraPermission: boolean;
  /** Whether gallery permission is granted */
  hasGalleryPermission: boolean;
  /** Whether camera is processing an image */
  isProcessingImage: boolean;
  /** Request camera permission */
  requestCameraPermission: () => Promise<void>;
  /** Request gallery permission */
  requestGalleryPermission: () => Promise<void>;
  /** Take a picture and process it */
  takePicture: () => Promise<string | null>;
  /** Pick an image from the gallery */
  pickImage: () => Promise<string | null>;
  /** Set processing state manually */
  setIsProcessingImage: (value: boolean) => void;
}

/**
 * Hook to manage camera functionality including permissions,
 * picture taking, and image cropping based on capture mode.
 * 
 * @param captureMode - The mode determining how photos are processed
 * @returns Camera control methods and state
 */
export const useCamera = (captureMode: CaptureMode): UseCameraReturn => {
  const cameraRef = useRef<CameraView>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const [cameraPermission, requestCameraPermissionRaw] = useCameraPermissions();
  const [galleryPermission, requestGalleryPermissionRaw] = ImagePicker.useMediaLibraryPermissions();

  /**
   * Request camera permission with logging
   */
  const requestCameraPermission = useCallback(async () => {
    try {
      await requestCameraPermissionRaw();
      LoggingService.info('useCamera', 'Camera permission requested');
    } catch (error) {
      LoggingService.error('useCamera', 'Error requesting camera permission', error);
    }
  }, [requestCameraPermissionRaw]);

  /**
   * Request gallery permission with logging
   */
  const requestGalleryPermission = useCallback(async () => {
    try {
      await requestGalleryPermissionRaw();
      LoggingService.info('useCamera', 'Gallery permission requested');
    } catch (error) {
      LoggingService.error('useCamera', 'Error requesting gallery permission', error);
    }
  }, [requestGalleryPermissionRaw]);

  /**
   * Auto-request permissions on mount if not granted
   */
  useEffect(() => {
    if (cameraPermission && !cameraPermission.granted && cameraPermission.canAskAgain) {
      requestCameraPermission();
    }
    if (galleryPermission && !galleryPermission.granted && galleryPermission.canAskAgain) {
      requestGalleryPermission();
    }
  }, [cameraPermission, galleryPermission, requestCameraPermission, requestGalleryPermission]);

  /**
   * ✅ NUOVO: Prepara l'immagine per OCR con contrast boost e risoluzione ottimale
   * Cruciale per font dot-matrix su superfici alimentari (colori simili tra testo e sfondo) 
   */
  const prepareImageForOCR = useCallback(async (
    uri: string,
    width: number,
    height: number
  ): Promise<string> => {
    try {
      // Step 1: Crop la zona della data (molto ampia per sicurezza)
      const cropRect = {
        originX: 0,
        originY: height * 0.15,
        width: width,
        height: height * 0.70,
      };

      // Step 2: Cropa E ridimensiona a larghezza fissa per OCR ottimale 
      // ML Kit lavora meglio con immagini ~1200px di larghezza per testo piccolo
       const result = await ImageManipulator.manipulateAsync(
         uri,
         [
           { rotate: 0 },
           { crop: cropRect },
           { resize: { width: 1200 } }, // ✅ dimensione ottimale per ML Kit 
         ],
         {
           compress: 1.0, // Massima qualità
           format: ImageManipulator.SaveFormat.JPEG,
           base64: false
         }
       );
 
        if (result.width < 800) {
          LoggingService.warning('useCamera', 'OCR: Image quality too low (width < 800px)');
          throw new Error("Immagine troppo piccola per il riconoscimento. Si prega di avvicinarsi al testo.");
        }
 
       LoggingService.info('useCamera', `OCR-ready image: ${result.uri} (${result.width}x${result.height})`);
      return result.uri;
    } catch (error) {
      LoggingService.error('useCamera', 'Error preparing image for OCR', error);
      return uri;
    }
  }, []);

  /**
   * Take a picture and process it based on capture mode
   * @returns The processed image URI or null if failed
   */
  const takePicture = useCallback(async (): Promise<string | null> => {
    if (!cameraRef.current) {
      LoggingService.warning('useCamera', 'Camera ref not available');
      return null;
    }

    try {
      setIsProcessingImage(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        exif: false
      });

      if (!photo || !photo.uri) {
        LoggingService.warning('useCamera', 'Photo capture returned no image');
        return null;
      }

      // Only for expirationDateOnly mode do we crop and prepare for OCR
      if (captureMode === 'expirationDateOnly') {
        const croppedUri = await prepareImageForOCR(
          photo.uri,
          photo.width,
          photo.height
        );

        LoggingService.info('useCamera', 'Photo taken and processed for OCR');
        return croppedUri;
      } else {
        // For product photos (productPhoto / updateProductPhoto):
        // 1. Resize to 1200px to avoid storing 12-48 MP (4-15 MB) images
        //    that cause slow decode (200-500 ms) on mid-range devices
        //    and waste user storage. Coerente con prepareImageForOCR
        //    (1200px) e processGalleryImage (1000px).
        // 2. Copy the resized image to a persistent location
        //    (documentDirectory/products/) so it survives OS tmp/
        //    cleanup, reinstall, OOM, and iOS "Offload App" events.
        // Note: expirationDateOnly has its own preprocessing (prepareImageForOCR)
        // and is not touched here.
        try {
          const resized = await ImageManipulator.manipulateAsync(
            photo.uri,
            [
              { rotate: 0 }, // Bake EXIF orientation into pixels
              { resize: { width: 1200 } },
            ],
            {
              compress: 0.85,
              format: ImageManipulator.SaveFormat.JPEG,
              base64: false,
            }
          );
          LoggingService.info(
            'useCamera',
            `Product photo resized: ${resized.width}x${resized.height}`
          );

          const persistentUri = await saveImagePermanently(resized.uri);
          return persistentUri;
        } catch (resizeError) {
          // Fallback: se il resize fallisce, salva l'originale piuttosto
          // che perdere la foto. Coerente con processGalleryImage che fa
          // fallback a uri originale se manipulateAsync fallisce.
          LoggingService.error(
            'useCamera',
            'Error resizing product photo, falling back to original',
            resizeError
          );
          const persistentUri = await saveImagePermanently(photo.uri);
          return persistentUri;
        }
      }

    } catch (error) {
      LoggingService.error('useCamera', 'Error during photo capture', error);

      Alert.alert(
        "Errore Fotocamera",
        `Si è verificato un problema: ${(error as Error).message}`,
        [
          { text: 'Riprova', style: 'default', onPress: () => setIsProcessingImage(false) },
          { text: 'Annulla', style: 'cancel', onPress: () => router.back() }
        ]
      );

      return null;
    } finally {
      setIsProcessingImage(false);
    }
  }, [captureMode, prepareImageForOCR]);

  /**
   * Pick an image from the gallery
   * @returns Selected image URI or null if cancelled/failed
   */
  /**
   * Process gallery image to ensure standard format and size for OCR
   */
  const processGalleryImage = useCallback(async (uri: string): Promise<string> => {
    LoggingService.info('useCamera', `Processing gallery image: ${uri}`);
    try {
      // Normalize: 
      // 1. Bake EXIF orientation (rotate: 0 does this in expo-image-manipulator)
      // 2. Resize to optimal width for OCR (1000px is usually a sweet spot)
      // 3. Ensure JPEG format
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          { rotate: 0 }, // Critical: bakes the EXIF orientation into the pixels
          { resize: { width: 1000 } }
        ],
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: false
        }
      );

      LoggingService.info('useCamera', `Image processed: ${result.uri} (${result.width}x${result.height})`);
      return result.uri;
    } catch (error) {
      LoggingService.error('useCamera', 'Error processing gallery image', error);
      return uri; // Fallback to original if manipulation fails
    }
  }, []);

  /**
   * Pick an image from the gallery
   * @returns Selected image URI or null if cancelled/failed
   */
  const pickImage = useCallback(async (): Promise<string | null> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        LoggingService.info('useCamera', `Image selected from gallery: ${asset.uri} (${asset.width}x${asset.height})`);

        const normalizedUri = captureMode === 'expirationDateOnly'
          ? await prepareImageForOCR(asset.uri, asset.width, asset.height)
          : await processGalleryImage(asset.uri);
        return normalizedUri;
      }

      return null;
    } catch (error) {
      LoggingService.error('useCamera', 'Error picking image from gallery', error);
      Alert.alert(
        "Errore Galleria",
        "Si è verificato un errore durante la selezione dell'immagine.",
        [{ text: 'OK' }]
      );
      return null;
    }
  }, [captureMode, prepareImageForOCR, processGalleryImage]);

  const hasCameraPermission = cameraPermission?.granted ?? false;
  const hasGalleryPermission = galleryPermission?.granted ?? false;

  return {
    cameraRef,
    hasCameraPermission,
    hasGalleryPermission,
    isProcessingImage,
    requestCameraPermission,
    requestGalleryPermission,
    takePicture,
    pickImage,
    setIsProcessingImage,
  };
};

