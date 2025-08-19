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
import { formStateLogger } from '@/utils/FormStateLogger';

export default function PhotoCaptureScreen() {
  const { isDarkMode } = useTheme();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [galleryPermission, requestGalleryPermission] = ImagePicker.useMediaLibraryPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const params = useLocalSearchParams();
  const isFocused = useIsFocused();
  const styles = getStyles(isDarkMode);
  
  // Identificatore unico per questa istanza della schermata
  const screenInstanceId = useRef(`photo-capture-${Date.now()}`).current;
  
  // Salva i parametri originali per poterli ripristinare in caso di problemi
  const originalParams = useRef(params);
  
  // Gestisce il pulsante indietro hardware
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (capturedImage) {
        // Se c'è un'immagine catturata, permetti di tornare alla modalità fotocamera
        setCapturedImage(null);
        return true;
      } else {
        // Altrimenti, torna alla schermata precedente con i parametri originali
        formStateLogger.logNavigation('BACK_BUTTON', 'photo-capture', 'manual-entry', originalParams.current);
        
        // Assicurati di preservare tutti i parametri originali quando torni indietro
        router.replace({
          pathname: '/manual-entry',
          params: {
            ...originalParams.current,
            fromPhotoCapture: 'true'
          }
        });
        return true;
      }
    });

    return () => backHandler.remove();
  }, [capturedImage]);
  
  // Registra i parametri ricevuti
  useEffect(() => {
    LoggingService.info('PhotoCapture', 'Received parameters:', params);
    formStateLogger.logNavigation('SCREEN_MOUNTED', 'manual-entry', 'photo-capture', params);
    
    // Salva i parametri originali
    originalParams.current = params;
  }, []);

  useEffect(() => {
    if (cameraPermission && !cameraPermission.granted && cameraPermission.canAskAgain) {
      requestCameraPermission();
    }
    if (galleryPermission && !galleryPermission.granted && galleryPermission.canAskAgain) {
      requestGalleryPermission();
    }
  }, [cameraPermission, galleryPermission]);

  if (!cameraPermission || !galleryPermission) {
    return <View />; // Permissions still loading
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
    if (!cameraPermission?.granted) {
      Alert.alert("Permesso Fotocamera Negato", "Non è possibile scattare foto senza il permesso della fotocamera.");
      return;
    }
    if (!galleryPermission?.granted) {
      Alert.alert("Permesso Galleria Negato", "Per salvare le foto o accedere alla galleria, è necessario il permesso.");
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return;
      }
    }

    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: false });
        if (photo && photo.uri) {
          setCapturedImage(photo.uri);
        } else {
          Alert.alert("Errore", "Impossibile scattare la foto: nessun URI valido ricevuto.");
        }
      } catch (error: unknown) { // Explicitly type error as unknown
        LoggingService.error("Errore scattando la foto:", "Error occurred", error);
        Alert.alert("Errore", `Si è verificato un problema durante lo scatto della foto: ${(error as Error).message || 'Errore sconosciuto'}`);
      }
    }
  };

  const pickImage = async () => {
    if (!galleryPermission?.granted) {
      Alert.alert("Permesso Negato", "Abbiamo bisogno del permesso per accedere alla galleria.");
      if (galleryPermission?.canAskAgain) {
        requestGalleryPermission();
      }
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
    }
  };

  const findDateInOcrResult = (ocrResult: string[]): string | null => {
    if (!ocrResult || ocrResult.length === 0) {
      LoggingService.error('PhotoCapture', "OCR result is undefined or empty", ocrResult);
      return null;
    }

    LoggingService.info('PhotoCapture', "OCR Text Blocks for date parsing:", ocrResult.join('\n'));
    const dateKeywords = [
      'exp', 'scad', 'best before', 'use by', 'entro il', 
      'da consumarsi preferibilmente entro il', 
      'da consumarsi preferibilmente entro fine'
    ];
    
    const patterns = [
      { regex: /(\d{1,2})[\s/.,-](\d{1,2})[\s/.,-](\d{4})/g, day: 1, month: 2, year: 3 },
      { regex: /(\d{1,2})[\s/.,-](\d{1,2})[\s/.,-](\d{2})/g, day: 1, month: 2, year: 3 },
      { regex: /(\d{4})[\s/.,-](\d{1,2})[\s/.,-](\d{1,2})/g, year: 1, month: 2, day: 3 },
      { regex: /(\d{1,2})[\s/.,-](\d{4})/g, day: null, month: 1, year: 2 },
      { regex: /(\d{1,2})[\s/.,-](\d{2})/g, day: null, month: 1, year: 2 }
    ];

    let potentialDates: { date: Date, score: number }[] = [];
    const fullText = ocrResult.join(' ').toLowerCase();
    const keywordInText = dateKeywords.some(k => fullText.includes(k));

    for (const text of ocrResult) {
      if (!text) continue;

      for (const p of patterns) {
        p.regex.lastIndex = 0;
        let match;
        while ((match = p.regex.exec(text)) !== null) {
          try {
            const dayStr = p.day ? match[p.day] : '01';
            const monthStr = match[p.month];
            const yearStr = match[p.year];

            let day = parseInt(dayStr, 10);
            let month = parseInt(monthStr, 10);
            let year = parseInt(yearStr, 0);
            if (isNaN(day) || isNaN(month) || isNaN(year)) continue;

            if (yearStr.length === 2) {
              year += 2000;
            }

            const currentYear = new Date().getFullYear();
            if (year < currentYear || year > currentYear + 15) continue;

            if (month < 1 || month > 12) continue;
            // Usiamo UTC per calcolare i giorni del mese per evitare problemi di fuso orario
            const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
            if (day < 1 || day > daysInMonth) continue;

            // Crea la data in UTC per evitare errori di fuso orario
            const parsedDate = new Date(Date.UTC(year, month - 1, day));
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);

            if (parsedDate.getUTCFullYear() === year && parsedDate.getUTCMonth() === month - 1 && parsedDate.getUTCDate() === day && parsedDate >= today) {
              const score = keywordInText ? 1 : 0;
              potentialDates.push({ date: parsedDate, score });
              LoggingService.info('PhotoCapture', `Potential date: ${parsedDate.toISOString()} from text: "${text}" with score: ${score}`);
            }
          } catch (e) {
            LoggingService.error("Error parsing date from match:", String(match), e);
          }
        }
      }
    }

    if (potentialDates.length === 0) {
      LoggingService.info('PhotoCapture', "No potential dates found after regex matching and validation.");
      return null;
    }

    potentialDates.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.date.getTime() - b.date.getTime();
    });
    
    const bestDate = potentialDates[0].date;
    // Formatta la data basandosi sui valori UTC
    const formattedDate = `${bestDate.getUTCFullYear()}-${String(bestDate.getUTCMonth() + 1).padStart(2, '0')}-${String(bestDate.getUTCDate()).padStart(2, '0')}`;
    LoggingService.info('PhotoCapture', "Best potential date selected:", formattedDate);
    return formattedDate;
  };

  const extractExpirationDateFromImage = async (imageUri: string): Promise<string | null> => {
    LoggingService.info('PhotoCapture', "Esecuzione OCR per l'immagine:", imageUri);
    try {
      const result = await TextRecognition.recognize(imageUri);
      LoggingService.info('PhotoCapture', "Risultato OCR:", result);

      if (result && result.blocks && result.blocks.length > 0) {
        const allText = result.blocks.map((block: TextBlock) => block.text);
        const extractedDate = findDateInOcrResult(allText);
        if (extractedDate) {
          LoggingService.info('PhotoCapture', "Data estratta tramite OCR:", extractedDate);
          return extractedDate;
        } else {
          LoggingService.info('PhotoCapture', "Nessuna data rilevata nei blocchi di testo OCR.");
          return null;
        }
      } else {
        LoggingService.info('PhotoCapture', "Nessun blocco di testo rilevato dall'OCR.");
        return null;
      }
    } catch (error) {
      LoggingService.error('PhotoCapture', "Errore durante il riconoscimento del testo:", error);
      Alert.alert("Errore OCR", "Si è verificato un problema durante il riconoscimento del testo.");
      return null;
    }
  };

  // Funzione helper per preservare tutti i parametri del form
  const getAllFormParams = (overrides: Record<string, string> = {}): Record<string, string> => {
    // Estrai tutti i parametri esistenti
    const formParams: Record<string, string> = {};
    
    // Lista di tutti i possibili parametri del form
    const paramKeys = [
      'name', 'brand', 'selectedCategory', 'quantity', 'unit',
      'purchaseDate', 'expirationDate', 'notes', 'barcode',
      'imageUrl', 'addedMethod', 'extractedExpirationDate'
    ];
    
    // Copia tutti i parametri esistenti
    for (const key of paramKeys) {
      let value = params[key];
      if (Array.isArray(value)) {
        value = value[0];
      }
      if (value) {
        formParams[key] = value;
      }
    }
    
    // Applica i valori di default per i campi mancanti
    if (!formParams.quantity) formParams.quantity = '1';
    if (!formParams.unit) formParams.unit = 'pz';
    if (!formParams.addedMethod) formParams.addedMethod = 'manual';
    
    // Aggiungi il flag che indica che stiamo tornando dalla schermata di cattura
    formParams.fromPhotoCapture = 'true';
    
    // Applica gli override
    for (const [key, value] of Object.entries(overrides)) {
      formParams[key] = value;
    }
    
    // Log dettagliato dei parametri preservati
    LoggingService.info('PhotoCapture', 'Form parameters preserved:', formParams);
    formStateLogger.saveFormState(`${screenInstanceId}-params`, formParams);
    
    return formParams;
  };

  const confirmPhoto = async () => {
    if (capturedImage) {
      formStateLogger.logNavigation('CONFIRM_PHOTO', 'photo-capture', 'manual-entry', {
        captureMode: params.captureMode,
        hasImage: true
      });
      
      if (params.captureMode === 'expirationDateOnly') {
        Alert.alert("Elaborazione OCR", "Estrazione della data di scadenza in corso...");
        const extractedDate = await extractExpirationDateFromImage(capturedImage);

        if (extractedDate) {
          Alert.alert("Data Rilevata", `Data di scadenza: ${extractedDate}. Controlla e conferma.`);
          
          // Preserva tutti i dati del form e aggiunge la data estratta
          const forwardParams = getAllFormParams({
            expirationDate: extractedDate,
            extractedExpirationDate: extractedDate
          });
          
          // Salva lo stato prima di navigare
          formStateLogger.saveFormState(screenInstanceId, {
            ...originalParams.current,
            expirationDate: extractedDate,
            extractedExpirationDate: extractedDate,
            imageUrl: capturedImage // Aggiungi l'immagine anche per la modalità data di scadenza
          });
          
          // Usa router.replace per navigare direttamente a manual-entry con i nuovi parametri
          // Questo forza la ricaricazione della schermata con i dati aggiornati
          router.replace({
            pathname: '/manual-entry',
            params: forwardParams
          });
        } else {
          Alert.alert("Data Non Rilevata", "Nessuna data di scadenza rilevata automaticamente. Inseriscila manualmente.");
          
          // Preserva tutti i dati del form senza modificare la data
          const forwardParams = getAllFormParams();
          
          // Salva lo stato prima di navigare
          formStateLogger.saveFormState(screenInstanceId, {
            ...originalParams.current,
            imageUrl: capturedImage
          });
          
          // Naviga indietro invece di sostituire
          router.setParams(forwardParams); // Imposta i parametri correnti
          router.back(); // Torna alla schermata precedente
        }
      } else {
        // Per la cattura dell'immagine del prodotto
        const forwardParams = getAllFormParams({
          imageUrl: capturedImage,
          addedMethod: 'photo'
        });
        
        // Salva lo stato prima di navigare
        formStateLogger.saveFormState(screenInstanceId, {
          ...originalParams.current,
          imageUrl: capturedImage,
          addedMethod: 'photo'
        });
        
        // Usa router.replace() per consistenza con expirationDateOnly
        // Questo garantisce che tutti i parametri vengano passati correttamente
        router.replace({
          pathname: '/manual-entry',
          params: forwardParams
        });
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

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
            ratio="4:3"
          />
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
