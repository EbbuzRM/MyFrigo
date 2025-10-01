import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { Text, View, StyleSheet, Button, Alert, TouchableOpacity, Image, BackHandler, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera as CameraIcon, Check, Image as ImageIcon, RefreshCw, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { LoggingService } from '@/services/LoggingService';
import { ProductStorage } from '@/services/ProductStorage';
import { useManualEntry } from '@/context/ManualEntryContext';
import { usePhotoOCR, OCRProgress } from '@/hooks/usePhotoOCR';

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: isDarkMode ? '#0d1117' : '#ffffff',
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  camera: {
    flex: 1,
  },
  macroFocusFrame: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    bottom: '30%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusFrameText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  cameraControlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 20,
    paddingHorizontal: 30,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 5,
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  confirmButton: {
    backgroundColor: '#28A745',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  ocrOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ocrProgressContainer: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 250,
  },
  ocrProgressText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    textAlign: 'center',
  },
  ocrProgressStep: {
    color: '#58a6ff',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginTop: 15,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28A745',
    borderRadius: 2,
  },
});

const PhotoCaptureScreen: React.FC = memo(() => {
  const { isDarkMode } = useTheme();
  const { setImageUrl, setExpirationDate } = useManualEntry();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [galleryPermission, requestGalleryPermission] = ImagePicker.useMediaLibraryPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const params = useLocalSearchParams();
  const isFocused = useIsFocused();

  const { extractExpirationDate, ocrProgress, resetProgress } = usePhotoOCR();

  const styles = useMemo(() => getStyles(isDarkMode), [isDarkMode]);

  const captureMode = useMemo(() => params.captureMode as string, [params.captureMode]);
  const productId = useMemo(() => params.productId as string, [params.productId]);

  useEffect(() => {
    const backAction = () => {
      if (capturedImage) {
        setCapturedImage(null);
        return true;
      }
      router.back();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [capturedImage]);

  useEffect(() => {
    if (cameraPermission && !cameraPermission.granted && cameraPermission.canAskAgain) {
      requestCameraPermission();
    }
    if (galleryPermission && !galleryPermission.granted && galleryPermission.canAskAgain) {
      requestGalleryPermission();
    }
  }, [cameraPermission, galleryPermission]);

  if (!cameraPermission || !galleryPermission) {
    return <View />; // Loading
  }

  if (!cameraPermission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Abbiamo bisogno del permesso per usare la fotocamera.</Text>
          <Button onPress={requestCameraPermission} title="Concedi Permesso" />
          <Button onPress={() => router.back()} title="Indietro" color="gray" />
        </View>
      </SafeAreaView>
    );
  }

  const takePicture = useCallback(async () => {
    if (cameraRef.current) {
      try {
        setIsProcessingImage(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          exif: false
        });
        if (photo && photo.uri) {
          setCapturedImage(photo.uri);
          LoggingService.info('PhotoCapture', 'Foto scattata con successo');
        }
      } catch (error) {
        LoggingService.error('PhotoCapture', 'Errore durante lo scatto della foto', error);
        Alert.alert(
          "Errore Fotocamera",
          `Si è verificato un problema durante lo scatto: ${(error as Error).message}`,
          [
            { text: 'Riprova', style: 'default' },
            { text: 'Annulla', style: 'cancel' }
          ]
        );
      } finally {
        setIsProcessingImage(false);
      }
    }
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
    }
  };


  const confirmPhoto = useCallback(async () => {
    if (!capturedImage) return;

    setIsProcessingImage(true);

    try {
      if (captureMode === 'updateProductPhoto' && productId) {
        await ProductStorage.updateProductImage(productId, capturedImage);
        Alert.alert(
          "Foto Aggiornata",
          "L'immagine del prodotto è stata aggiornata con successo.",
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else if (captureMode === 'expirationDateOnly') {
        const ocrResult = await extractExpirationDate(capturedImage);

        if (ocrResult.success && ocrResult.extractedDate) {
          setExpirationDate(ocrResult.extractedDate);
          const returnParams = {
            ...params,
            expirationDate: ocrResult.extractedDate,
            fromPhotoCapture: 'true'
          };

          Alert.alert(
            "Data Rilevata",
            `Data di scadenza rilevata: ${ocrResult.extractedDate}\n\nAccuratezza: ${Math.round(ocrResult.confidence * 100)}%`,
            [{ text: 'OK', onPress: () => router.replace({ pathname: '/manual-entry', params: returnParams }) }]
          );
        } else {
          Alert.alert(
            "Data Non Rilevata",
            ocrResult.error || "Non è stato possibile trovare una data di scadenza nell'immagine.",
            [
              {
                text: 'Inserisci manualmente',
                onPress: () => router.replace({ pathname: '/manual-entry', params }),
                style: 'cancel'
              },
              {
                text: 'Riprova',
                onPress: () => {
                  setCapturedImage(null);
                  resetProgress();
                }
              }
            ]
          );
        }
      } else {
        setImageUrl(capturedImage);
        router.back();
      }
    } catch (error) {
      LoggingService.error('PhotoCapture', 'Error in confirmPhoto', error);
      Alert.alert(
        "Errore",
        "Si è verificato un errore durante l'elaborazione dell'immagine.",
        [{ text: 'OK' }]
      );
    } finally {
      setIsProcessingImage(false);
    }
  }, [capturedImage, captureMode, productId, extractExpirationDate, setExpirationDate, setImageUrl, params, resetProgress]);

  const retakePhoto = () => setCapturedImage(null);

  if (capturedImage) {
    return (
      <SafeAreaView style={styles.container}>
        <Image
          source={{ uri: capturedImage }}
          style={styles.previewImage}
          accessibilityLabel="Immagine scattata del prodotto"
          accessibilityHint="Tocca conferma per procedere o riprova per scattare una nuova foto"
        />

        {/* OCR Progress Overlay */}
        {ocrProgress.isProcessing && (
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
            </View>
          </View>
        )}

        <View style={styles.previewControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={retakePhoto}
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
            onPress={confirmPhoto}
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {isFocused && (
        <>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            accessibilityLabel="Vista fotocamera"
            accessibilityHint="Inquadra il prodotto e tocca il pulsante centrale per scattare la foto"
            {...(captureMode === 'expirationDateOnly' && {
                zoom: 0.1,
                autoFocus: 'on',
            })}
          >
            {captureMode === 'expirationDateOnly' && (
                <View style={styles.macroFocusFrame}>
                  <Text style={styles.focusFrameText}>
                    Inquadra la data di scadenza
                  </Text>
                </View>
            )}
          </CameraView>

          <View style={styles.cameraControlsContainer}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={pickImage}
              accessibilityLabel="Seleziona dalla galleria"
              accessibilityRole="button"
            >
              <ImageIcon size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
              accessibilityLabel="Scatta foto"
              accessibilityRole="button"
            >
              <CameraIcon size={32} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => router.back()}
              accessibilityLabel="Torna indietro"
              accessibilityRole="button"
            >
              <Text style={styles.controlButtonText}>Indietro</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
});

export default PhotoCaptureScreen;
