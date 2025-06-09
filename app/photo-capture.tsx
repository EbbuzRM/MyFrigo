import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, Button, Alert, TouchableOpacity, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router'; // Added useLocalSearchParams
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlipHorizontal, Camera as CameraIcon, Check } from 'lucide-react-native';
import TextRecognition from 'react-native-text-recognition'; // Import OCR

export default function PhotoCaptureScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const params = useLocalSearchParams(); // Get navigation params

  useEffect(() => {
    // Request permissions if not determined or not granted but can ask again
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]); // Re-run if permission object changes

  if (!permission) {
    return <View />; // Permissions still loading
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Abbiamo bisogno del permesso per usare la fotocamera.</Text>
          <Button onPress={requestPermission} title="Concedi Permesso" />
          <Button onPress={() => router.back()} title="Indietro" color="gray" />
        </View>
      </SafeAreaView>
    );
  }

  const toggleCameraType = () => {
    setCameraType(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
        if (photo?.uri) {
          setCapturedImage(photo.uri);
        } else {
          Alert.alert("Errore", "Impossibile scattare la foto.");
        }
      } catch (error) {
        console.error("Errore scattando la foto:", error);
        Alert.alert("Errore", "Si è verificato un problema durante lo scatto della foto.");
      }
    }
  };

  // Enhanced (but still simplified) date parsing logic
  const findDateInOcrResult = (ocrResult: string[]): string | null => {
    console.log("OCR Text Blocks for date parsing:", ocrResult.join('\n'));
    const dateKeywords = ['exp', 'scad', 'best before', 'use by', 'entro il'];
    
    const patterns = [
      { regex: /\b(\d{1,2})[\s\/\.-](\d{1,2})[\s\/\.-](\d{2,4})\b/g, day: 1, month: 2, year: 3 },
      { regex: /\b(\d{4})[\s\/\.-](\d{1,2})[\s\/\.-](\d{1,2})\b/g, year: 1, month: 2, day: 3 },
    ];

    let potentialDates: { date: string, score: number }[] = [];

    for (const text of ocrResult) {
      const lowerText = text.toLowerCase();
      let keywordBonus = 0;
      for (const keyword of dateKeywords) {
        if (lowerText.includes(keyword)) {
          keywordBonus = 1; 
          break;
        }
      }

      for (const p of patterns) {
        p.regex.lastIndex = 0; 
        let match;
        while ((match = p.regex.exec(text)) !== null) {
          try {
            const dayStr = match[p.day];
            const monthStr = match[p.month];
            const yearStr = match[p.year];

            let day = parseInt(dayStr, 10);
            let month = parseInt(monthStr, 10);
            let year = parseInt(yearStr, 10);

            if (yearStr.length === 2) {
              year += 2000; 
            }
            
            if (isNaN(day) || isNaN(month) || isNaN(year)) continue;
            if (month < 1 || month > 12) continue;
            const daysInMonth = new Date(year, month, 0).getDate(); 
            if (day < 1 || day > daysInMonth) continue;
            if (year < (new Date().getFullYear() - 2) || year > (new Date().getFullYear() + 15)) continue; 

            const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            potentialDates.push({ date: formattedDate, score: keywordBonus });
            console.log(`Potential date: ${formattedDate} from text: "${text}" with keyword bonus: ${keywordBonus}`);
          } catch (e) {
            // console.error("Error parsing date from match:", match, e);
          }
        }
      }
    }

    if (potentialDates.length === 0) {
      console.log("No potential dates found after regex matching.");
      return null;
    }

    potentialDates.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    
    console.log("Best potential date:", potentialDates[0].date);
    return potentialDates[0].date;
  };

  const extractExpirationDateFromImage = async (imageUri: string): Promise<string | null> => {
    try {
      const result = await TextRecognition.recognize(imageUri); 
      return findDateInOcrResult(result);
    } catch (error) {
      console.error("OCR Error:", error);
      Alert.alert("Errore OCR", "Impossibile leggere il testo dall'immagine.");
      return null;
    }
  };

  const confirmPhoto = async () => { 
    if (capturedImage) {
      Alert.alert("Elaborazione OCR", "Estrazione della data di scadenza in corso...");
      const extractedDate = await extractExpirationDateFromImage(capturedImage);
      if (extractedDate) {
        Alert.alert("Data Rilevata", `Data di scadenza: ${extractedDate}. Controlla e conferma.`);
      } else {
      Alert.alert("Data Non Rilevata", "Nessuna data di scadenza rilevata automaticamente. Inseriscila manualmente.");
    }

    let forwardParams: any = { ...params }; 

    if (params.captureMode === 'expirationDateOnly') {
      forwardParams.extractedExpirationDate = extractedDate || undefined;
      delete forwardParams.captureMode;
    } else {
      forwardParams.imageUrl = capturedImage; 
      forwardParams.addedMethod = 'photo';
      forwardParams.extractedExpirationDate = extractedDate || undefined;
    }
    
    router.replace({ 
      pathname: '/(tabs)/add', 
      params: forwardParams
    });
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
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
      >
        <View style={styles.cameraControlsContainer}>
          <TouchableOpacity style={styles.controlButton} onPress={() => router.back()}>
            <Text style={styles.controlButtonText}>Indietro</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <CameraIcon size={32} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={toggleCameraType}>
            <FlipHorizontal size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
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
    backgroundColor: '#28A745', // Green color for confirm
  }
});
