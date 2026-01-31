import { useRef, useCallback, useState, useEffect, RefObject } from 'react';
import { Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { router } from 'expo-router';
import { LoggingService } from '@/services/LoggingService';

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
   * Crop image for expiration date capture mode
   * @param photoUri - The URI of the captured photo
   * @param width - Photo width
   * @param height - Photo height
   * @returns Cropped image URI
   */
  const cropImageForExpirationDate = useCallback(async (
    photoUri: string, 
    width: number, 
    height: number
  ): Promise<string> => {
    // Crop the image to the focus frame - larger area for better date capture
    const cropRect = {
      originX: width * 0.05,
      originY: height * 0.20, // Start higher to capture the date better
      width: width * 0.90,
      height: height * 0.40, // Taller area to include more context
    };

    // Check dimensions to determine orientation
    const isLandscape = width > height;

    const croppedImage = await ImageManipulator.manipulateAsync(
      photoUri,
      [
        { crop: cropRect },
        ...(isLandscape ? [{ rotate: 0 }] : []), // Keep orientation if landscape
        { resize: { width: 800 } } // Resize for better OCR
      ],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: false
      }
    );

    return croppedImage.uri;
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
        const croppedUri = await cropImageForExpirationDate(
          photo.uri, 
          photo.width, 
          photo.height
        );
        
        LoggingService.info('useCamera', 'Photo taken and cropped successfully for OCR');
        return croppedUri;
      } else {
        // For product photos, use original image without cropping
        LoggingService.info('useCamera', 'Photo taken - original image kept');
        return photo.uri;
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
  }, [captureMode, cropImageForExpirationDate]);

  /**
   * Pick an image from the gallery
   * @returns Selected image URI or null if cancelled/failed
   */
  const pickImage = useCallback(async (): Promise<string | null> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
      
      if (!result.canceled && result.assets.length > 0) {
        LoggingService.info('useCamera', 'Image selected from gallery');
        return result.assets[0].uri;
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
  }, []);

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
