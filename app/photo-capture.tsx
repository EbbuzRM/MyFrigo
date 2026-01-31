import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { View, Button, BackHandler, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { getStyles } from './photo-capture.styles';
import { useCamera, CaptureMode } from '@/hooks/useCamera';
import { usePhotoActions } from '@/hooks/usePhotoActions';
import { CameraView } from '@/components/CameraView';
import { PhotoPreview } from '@/components/PhotoPreview';
import { router } from 'expo-router';
import { LoggingService } from '@/services/LoggingService';

/**
 * Photo capture screen component.
 * 
 * Coordinates camera functionality, photo capture, and confirmation actions.
 * Supports multiple capture modes:
 * - expirationDateOnly: Captures and crops image for OCR-based expiration date extraction
 * - updateProductPhoto: Updates existing product's image
 * - productPhoto: Captures product photo for new entries
 */
const PhotoCaptureScreen: React.FC = memo(() => {
  const { isDarkMode } = useTheme();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const isFocused = useIsFocused();

  const styles = useMemo(() => getStyles(isDarkMode), [isDarkMode]);
  const params = useLocalSearchParams();

  // Extract capture mode and product ID from route params
  const captureMode = useMemo<CaptureMode>(() => {
    const mode = params.captureMode as string;
    if (mode === 'expirationDateOnly' || mode === 'updateProductPhoto') {
      return mode;
    }
    return 'productPhoto';
  }, [params.captureMode]);

  const productId = useMemo(() => params.productId as string | undefined, [params.productId]);

  // Initialize camera hook
  const {
    cameraRef,
    hasCameraPermission,
    hasGalleryPermission,
    isProcessingImage,
    requestCameraPermission,
    requestGalleryPermission,
    takePicture,
    pickImage,
    setIsProcessingImage,
  } = useCamera(captureMode);

  // Initialize photo actions hook
  const {
    confirmPhoto,
    ocrProgress,
    resetOCRProgress,
  } = usePhotoActions();

  /**
   * Handle taking a picture and storing the result
   */
  const handleTakePicture = useCallback(async () => {
    const imageUri = await takePicture();
    if (imageUri) {
      setCapturedImage(imageUri);
    }
  }, [takePicture]);

  /**
   * Handle picking an image from gallery
   */
  const handlePickImage = useCallback(async () => {
    const imageUri = await pickImage();
    if (imageUri) {
      setCapturedImage(imageUri);
    }
  }, [pickImage]);

  /**
   * Handle confirming the captured photo
   */
  const handleConfirmPhoto = useCallback(async () => {
    await confirmPhoto(capturedImage, captureMode);
  }, [confirmPhoto, capturedImage, captureMode]);

  /**
   * Handle retaking the photo
   */
  const handleRetakePhoto = useCallback(() => {
    setCapturedImage(null);
  }, []);

  /**
   * Handle canceling OCR and returning to camera
   */
  const handleCancelOCR = useCallback(() => {
    resetOCRProgress();
    setCapturedImage(null);
  }, [resetOCRProgress]);

  /**
   * Handle back button press
   * Returns to camera if in preview, otherwise goes back to previous screen
   */
  const handleBackPress = useCallback(() => {
    if (capturedImage) {
      setCapturedImage(null);
      return true;
    }
    router.back();
    return true;
  }, [capturedImage]);

  // Register back button handler
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [handleBackPress]);

  // Auto-request permissions if not granted and can ask again
  useEffect(() => {
    if (!hasCameraPermission) {
      requestCameraPermission();
    }
    if (!hasGalleryPermission) {
      requestGalleryPermission();
    }
  }, [hasCameraPermission, hasGalleryPermission, requestCameraPermission, requestGalleryPermission]);

  // Loading state while permissions are loading
  if (!hasCameraPermission || !hasGalleryPermission) {
    return <View />;
  }

  // Permission denied state
  if (!hasCameraPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Abbiamo bisogno del permesso per usare la fotocamera.
          </Text>
          <Button onPress={requestCameraPermission} title="Concedi Permesso" />
          <Button onPress={() => router.back()} title="Indietro" color="gray" />
        </View>
      </SafeAreaView>
    );
  }

  // Show preview if image is captured
  if (capturedImage) {
    return (
      <SafeAreaView style={styles.container}>
        <PhotoPreview
          capturedImage={capturedImage}
          styles={styles}
          isProcessingImage={isProcessingImage}
          ocrProgress={ocrProgress}
          onRetake={handleRetakePhoto}
          onConfirm={handleConfirmPhoto}
          onCancelOCR={handleCancelOCR}
        />
      </SafeAreaView>
    );
  }

  // Show camera view
  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        cameraRef={cameraRef}
        styles={styles}
        captureMode={captureMode}
        onTakePicture={handleTakePicture}
        onPickImage={handlePickImage}
      />
    </SafeAreaView>
  );
});

PhotoCaptureScreen.displayName = 'PhotoCaptureScreen';

export default PhotoCaptureScreen;
