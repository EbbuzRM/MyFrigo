import React, { useState, useCallback } from 'react';
import { Text, View, StyleSheet, Button, Alert, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { CameraView } from 'expo-camera';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCategories } from '@/context/CategoryContext';
import { Product } from '@/types/Product';
import { LoggingService } from '@/services/LoggingService';
import { useBarcodeScanner, ScanResult } from '@/hooks/useBarcodeScanner';

interface FrameLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function BarcodeScannerScreen() {
  const [frameLayout, setFrameLayout] = useState<FrameLayout | null>(null);
  const isFocused = useIsFocused();
  const { categories: appCategories } = useCategories();

  const handleProductFound = useCallback((result: ScanResult, barcode: string) => {
    if (result.type === 'template' && result.data) {
      Alert.alert('Prodotto Trovato!', `Trovato template salvato: ${result.data.name}`, [
        {
          text: 'Continua',
          onPress: () => {
            LoggingService.info('Scanner', `Navigating to manual-entry with params: ${JSON.stringify(result.params)}`);
            router.replace({ pathname: '/manual-entry', params: { ...result.params, isEditMode: 'false', resetForm: 'true' } as any });
          }
        },
        {
          text: 'Scansiona di Nuovo',
          onPress: () => resetScanner(),
          style: 'cancel',
        },
      ]);
    } else if (result.type === 'online' && result.data) {
      Alert.alert('Prodotto Trovato!', `Trovato online: ${result.data.product_name || barcode}`, [
        {
          text: 'Continua',
          onPress: () => {
            LoggingService.info('Scanner', `Navigating to manual-entry with online params: ${JSON.stringify(result.params)}`);
            router.replace({ pathname: '/manual-entry', params: { ...result.params, isEditMode: 'false', resetForm: 'true' } as any });
          }
        },
        {
          text: 'Scansiona di Nuovo',
          onPress: () => resetScanner(),
          style: 'cancel',
        },
      ]);
    } else if (result.type === 'not_found') {
      Alert.alert(
        'Prodotto Non Trovato',
        `Vuoi aggiungere manualmente il prodotto con codice ${barcode}?`,
        [
          {
            text: 'Sì, Aggiungi',
            onPress: () => {
              LoggingService.info('Scanner', `Navigating to manual-entry for manual entry: ${JSON.stringify(result.params)}`);
              router.replace({ pathname: '/manual-entry', params: { ...result.params, isEditMode: 'false', resetForm: 'true' } as any });
            }
          },
          {
            text: 'Scansiona di Nuovo',
            onPress: () => resetScanner(),
            style: 'cancel',
          },
        ]
      );
    }
  }, []);

  const {
    permission,
    scanned,
    isLoading,
    loadingError,
    loadingProgress,
    currentBarcode,
    handleBarCodeScanned,
    resetScanner,
    requestPermission
  } = useBarcodeScanner(appCategories, handleProductFound);

  const handleFrameLayout = (event: { nativeEvent: { layout: FrameLayout } }) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setFrameLayout({ x, y, width, height });
  };

  const onBarcodeScanned = useCallback(({ type, data, bounds }: { 
    type: string; 
    data: string; 
    bounds: { origin: { x: number, y: number }, size: { width: number, height: number } } 
  }) => {
    handleBarCodeScanned(data, type, bounds, frameLayout);
  }, [handleBarCodeScanned, frameLayout]);

  // Render content based on state
  let content;

  if (!permission) {
    content = <View />;
  } else if (!permission.granted) {
    content = (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Abbiamo bisogno del permesso per usare la fotocamera per scansionare i codici a barre.</Text>
          <Button onPress={requestPermission} title="Concedi Permesso" />
          <Button onPress={() => router.back()} title="Indietro" color="gray" />
        </View>
      </SafeAreaView>
    );
  } else if (isLoading) {
    content = (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#fff" style={styles.loadingIndicator} />
        <Text style={styles.loadingText}>{loadingProgress}</Text>
        {loadingProgress.includes('velocissima') && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => resetScanner()}
          >
            <Text style={styles.skipButtonText}>Salta ricerca e aggiungi manualmente</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  } else if (loadingError) {
    content = (
      <SafeAreaView style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>{loadingError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => resetScanner()}>
          <RefreshCw size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Riprova</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.manualButton} onPress={() => {
          LoggingService.info('Scanner', `Manual entry button pressed, navigating with barcode: ${currentBarcode}`);
          router.replace({ pathname: '/manual-entry', params: { barcode: currentBarcode, barcodeType: 'unknown', addedMethod: 'barcode', fromScannerError: 'true', isEditMode: 'false', resetForm: 'true' } as any })
        }}>
          <Text style={styles.manualButtonText}>Inserisci Manualmente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Torna Indietro</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  } else {
    content = (
      <SafeAreaView style={styles.container}>
        {isFocused && (
          <CameraView
            onBarcodeScanned={scanned || isLoading ? undefined : onBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "qr", "pdf417", "datamatrix", "code39", "code93", "code128", "itf14", "codabar", "aztec"],
            }}
            style={StyleSheet.absoluteFillObject}
          />
        )}
        <View style={styles.scanFrameContainer} pointerEvents="none">
          <View style={styles.scanFrame} onLayout={handleFrameLayout} />
          <Text style={styles.scanFrameText}>Inquadra il codice a barre</Text>
        </View>
        {scanned && !isLoading && (
          <TouchableOpacity style={styles.rescanButtonContainer} onPress={() => resetScanner()}>
            <Text style={styles.rescanButtonText}>Tocca per Scansionare di Nuovo</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButtonContainer}>
          <ArrowLeft size={28} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return content;
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
    backgroundColor: '#ffffff',
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
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  loadingIndicator: {
    marginBottom: 15,
  },
  loadingText: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ff6b6b',
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
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
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: 8,
    zIndex: 10,
  },
  scanFrameContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: '90%',
    height: '30%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  scanFrameText: {
    position: 'absolute',
    top: '32%',
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  skipButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  manualButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
  },
  manualButtonText: {
    color: '#58a6ff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  }
});
