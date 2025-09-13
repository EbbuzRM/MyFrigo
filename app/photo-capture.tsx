import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, Button, Alert, TouchableOpacity, Image, BackHandler } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera as CameraIcon, Check, Image as ImageIcon } from 'lucide-react-native';
import TextRecognition, { TextBlock } from '@react-native-ml-kit/text-recognition';
import { useTheme } from '@/context/ThemeContext';
import { LoggingService } from '@/services/LoggingService';
import { StorageService } from '@/services/StorageService';
import { useManualEntry } from '@/context/ManualEntryContext';

export default function PhotoCaptureScreen() {
  const { isDarkMode } = useTheme();
  const { setImageUrl, setExpirationDate } = useManualEntry();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [galleryPermission, requestGalleryPermission] = ImagePicker.useMediaLibraryPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const params = useLocalSearchParams();
  const isFocused = useIsFocused();
  const styles = getStyles(isDarkMode);

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

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
        if (photo && photo.uri) setCapturedImage(photo.uri);
      } catch (error) {
        LoggingService.error("Errore scattando la foto:", "Error occurred", error);
        Alert.alert("Errore", `Si è verificato un problema: ${(error as Error).message}`);
      }
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
    }
  };

  const extractExpirationDateFromImage = async (imageUri: string): Promise<string | null> => {
    const TAG = 'PhotoCapture-OCR';
    try {
      const result = await TextRecognition.recognize(imageUri);
      if (!result || result.blocks.length === 0) {
        LoggingService.debug(TAG, 'Nessun blocco di testo trovato.');
        return null;
      }

      const allText = result.blocks.map((block: TextBlock) => block.text).join(' ').replace(/\n/g, ' ');
      LoggingService.debug(TAG, 'Testo grezzo rilevato:', allText);

      const dateRegex = /\b(\d{1,2}[\.\/\- ]\d{1,2}[\.\/\- ](\d{4}|\d{2}))\b/g;
      const matches = allText.match(dateRegex);

      if (!matches) {
        LoggingService.debug(TAG, 'Nessuna data trovata con la nuova regex.');
        return null;
      }

      LoggingService.debug(TAG, 'Trovate possibili date:', matches);

      const candidateDates: Date[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const match of matches) {
        let cleanedMatch = match.replace(/[\.\- ]/g, '/');
        const parts = cleanedMatch.split('/');

        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          if (day > 31 || month > 12) continue;

          if (parts[2].length === 2) {
            parts[2] = `20${parts[2]}`;
          }
          
          const isoDateString = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          const parsedDate = new Date(isoDateString);

          LoggingService.debug(TAG, `Analizzo match: "${match}" -> Parsato come: ${parsedDate.toISOString()}`);

          if (!isNaN(parsedDate.getTime())) {
            const year = parsedDate.getFullYear();
            if (year >= 2000 && year < 2100 && parsedDate >= today) {
              candidateDates.push(parsedDate);
              LoggingService.debug(TAG, `---> Aggiunta data candidata valida: ${parsedDate.toISOString()}`);
            }
          }
        }
      }

      if (candidateDates.length === 0) {
        LoggingService.debug(TAG, 'Nessuna data candidata valida e futura trovata.');
        return null;
      }

      candidateDates.sort((a, b) => a.getTime() - b.getTime());

      const bestDate = candidateDates[0];
      const finalDate = bestDate.toISOString().split('T')[0];

      LoggingService.debug(TAG, `Data migliore selezionata: ${finalDate}`);
      return finalDate;

    } catch (error) {
      LoggingService.error(TAG, "Errore durante l'OCR:", error);
      return null;
    }
  };

  const confirmPhoto = async () => {
    if (!capturedImage) return;

    const originalParams = params;

    if (params.captureMode === 'updateProductPhoto' && typeof params.productId === 'string') {
      try {
        await StorageService.updateProductImage(params.productId, capturedImage);
        Alert.alert("Foto Aggiornata", "L'immagine del prodotto è stata aggiornata.", [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } catch (error) {
        LoggingService.error('PhotoCapture', 'Error updating product image', error);
        Alert.alert("Errore", "Si è verificato un errore durante l'aggiornamento della foto.");
      }
    } else if (params.captureMode === 'expirationDateOnly') {
      const extractedDate = await extractExpirationDateFromImage(capturedImage);
      if (extractedDate) {
        setExpirationDate(extractedDate);
        const returnParams = { ...originalParams, expirationDate: extractedDate, fromPhotoCapture: 'true' };
        Alert.alert("Data Rilevata", `Data di scadenza: ${extractedDate}. Premi OK per tornare al modulo.`, [
          { text: 'OK', onPress: () => router.replace({ pathname: '/manual-entry', params: returnParams }) }
        ]);
      } else {
        Alert.alert(
          "Data Non Rilevata",
          "Non è stato possibile trovare una data. Puoi riprovare o inserirla manualmente.",
          [
            { 
              text: 'Inserisci a mano', 
              onPress: () => router.replace({ pathname: '/manual-entry', params: originalParams }),
              style: 'cancel' 
            },
            { text: 'Riprova', onPress: () => setCapturedImage(null) }
          ]
        );
      }
    } else {
      setImageUrl(capturedImage);
      router.back();
    }
  };

  const retakePhoto = () => setCapturedImage(null);

  if (capturedImage) {
    return (
      <SafeAreaView style={styles.container}>
        <Image source={{ uri: capturedImage }} style={styles.previewImage} />
        <View style={styles.previewControls}>
          <TouchableOpacity style={styles.controlButton} onPress={retakePhoto}>
            <Text style={styles.controlButtonText}>Riprova</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlButton, styles.confirmButton]} onPress={confirmPhoto}>
            <Check size={24} color="#fff" />
            <Text style={styles.controlButtonText}>Conferma</Text>
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
            {...(params.captureMode === 'expirationDateOnly' && {
                zoom: 0.1, // A slight zoom might help focus
                autoFocus: 'on',
            })}
          > 
            {params.captureMode === 'expirationDateOnly' && (
                <View style={styles.macroFocusFrame} />
            )}
          </CameraView>
          <View style={styles.cameraControlsContainer}>
            <TouchableOpacity style={styles.controlButton} onPress={pickImage}>
              <ImageIcon size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <CameraIcon size={32} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={() => router.back()}>
              <Text style={styles.controlButtonText}>Indietro</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

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
  }
});
