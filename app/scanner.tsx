import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, Alert, TouchableOpacity, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StorageService } from '@/services/StorageService';

export default function BarcodeScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Added for loading state
  const isFocused = useIsFocused();

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission]); // Re-run if permission object changes

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Abbiamo bisogno del permesso per usare la fotocamera per scansionare i codici a barre.</Text>
          <Button onPress={requestPermission} title="Concedi Permesso" />
          <Button onPress={() => router.back()} title="Indietro" color="gray" />
        </View>
      </SafeAreaView>
    );
  }

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setIsLoading(true);

    let productInfoFound = false;
    let alertMessage = `Codice: ${data}`;
    let paramsForAddScreen: any = { barcode: data, barcodeType: type };

    try {
      // 1. Check for a saved template first
      const template = await StorageService.getProductTemplate(data);
      if (template) {
        productInfoFound = true;
        alertMessage = `Prodotto Trovato (salvato): ${template.name}`;
        paramsForAddScreen = {
          ...paramsForAddScreen,
          productName: template.name,
          brand: template.brand || '',
          category: template.category,
          imageUrl: template.imageUrl || '',
        };
      } else {
        // 2. If no template, try Open Food Facts
        const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${data}`);
        if (response.ok) {
          const jsonResponse = await response.json();
          if (jsonResponse.status === 1 && jsonResponse.product) {
            const productInfo = jsonResponse.product;
            productInfoFound = true;
            alertMessage = `Prodotto Trovato (Online): ${productInfo.product_name || data}`;
            paramsForAddScreen = {
              ...paramsForAddScreen,
              productName: productInfo.product_name || '',
              brand: productInfo.brands || '',
              imageUrl: productInfo.image_url || '',
            };
          } else {
            alertMessage = `Prodotto non trovato (codice: ${data}). Puoi inserirlo manualmente.`;
          }
        } else {
          alertMessage = `Errore nel recuperare dati per il codice: ${data}. (HTTP ${response.status})`;
        }
      }
    } catch (error) {
      console.error("Failed to fetch product info:", error);
      alertMessage = `Errore di rete. Puoi inserirlo manualmente.`;
    } finally {
      setIsLoading(false);
    }

    Alert.alert(
      productInfoFound ? 'Prodotto Trovato!' : 'Prodotto Non Trovato',
      alertMessage,
      [
        {
          text: 'Continua', // Changed from 'OK'
          onPress: () => {
            // Now ask if they want to photograph expiration date
            Alert.alert(
              'Data di Scadenza',
              'Vuoi fotografare la data di scadenza per provare a inserirla automaticamente?',
              [
                {
                  text: 'Sì, Fotografa',
                  onPress: () => {
                    // Navigate to photo-capture for expiration date
                    // We use push so user can go back if photo capture fails or is cancelled
                    router.push({ 
                      pathname: '/photo-capture', 
                      params: { 
                        ...paramsForAddScreen, 
                        captureMode: 'expirationDateOnly' // Specific mode for photo-capture screen
                      } 
                    });
                  }
                },
                {
                  text: 'No, Inserisci Manualmente',
                  onPress: () => {
                    router.replace({ pathname: '/(tabs)/add', params: paramsForAddScreen });
                  },
                  style: 'cancel' 
                }
              ],
              { cancelable: false } // Optional: prevent dismissing this second alert easily
            );
          },
        },
        {
          text: 'Scansiona di Nuovo',
          onPress: () => {
            setScanned(false); 
            // setIsLoading(false) is handled by the finally block of the API call
          },
          style: 'cancel',
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Recupero informazioni prodotto...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {isFocused && (
      <CameraView
        onBarcodeScanned={scanned || isLoading ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "qr", "pdf417", "datamatrix", "code39", "code93", "code128", "itf14", "codabar", "aztec"], // Add more types as needed
        }}
        style={StyleSheet.absoluteFillObject}
      />
      )}
      {scanned && !isLoading && (
        <TouchableOpacity style={styles.rescanButtonContainer} onPress={() => { setScanned(false); setIsLoading(false); }}>
          <Text style={styles.rescanButtonText}>Tocca per Scansionare di Nuovo</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButtonContainer}>
        <ArrowLeft size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black', // Ensure full screen coverage
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
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  loadingText: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Inter-Medium',
  },
  rescanButtonContainer: {
    position: 'absolute',
    bottom: 100,
    left: '20%',
    right: '20%',
    paddingVertical: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 30,
    alignItems: 'center',
  },
  rescanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  backButtonContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40, // Adjusted for typical status bar/notch
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25, // Make it circular for a typical icon button feel
    padding: 8, // Add some padding around the icon
    zIndex: 10, // Ensure it's above the CameraView
  }
});
