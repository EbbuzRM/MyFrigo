// scanner.tsx — scanner module.
//
// exports: BarcodeScannerScreen | function
// used_by: none
// rules:   - Do not remove or modify the `interface FrameLayout` or `interface ManualEntryParams` type definitions; they are used for type-safe navigation parameters and UI layout calculations.
//          - The `CameraView` from `expo-camera` is the core scanning component and must remain the primary barcode capture method.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { useState, useCallback } from 'react';
import { Text, View, StyleSheet, Button, Alert, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { CameraView } from 'expo-camera';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCategories } from '@/context/CategoryContext';
import { Product } from '@/types/Product';
import { LoggingService } from '@/services/LoggingService';
import { useBarcodeScanner, ScanResult } from '@/hooks/useBarcodeScanner';
import { styles } from './scanner.styles';

interface FrameLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ManualEntryParams {
  barcode?: string;
  barcodeType?: string;
  addedMethod?: string;
  fromScannerError?: string;
  isEditMode?: string;
  resetForm?: string;
  name?: string;
  brand?: string;
  categoryId?: string;
  [key: string]: string | undefined;
}

// Tipo per i dati del prodotto (template o online)
type ProductData = {
  product_name?: string;
  name?: string;
  brand?: string;
  category?: string;
  categoryId?: string;
  barcode?: string;
  imageUrl?: string;
};

export default function BarcodeScannerScreen() {
  const [frameLayout, setFrameLayout] = useState<FrameLayout | null>(null);
  const isFocused = useIsFocused();
  const { categories: appCategories } = useCategories();

  const handleProductFound = useCallback((result: ScanResult, barcode: string) => {
    if (result.type === 'template' && result.data) {
      Alert.alert('Prodotto Trovato!', `Trovato template salvato: ${(result.data as Partial<Product>).name}`, [
        {
          text: 'Continua',
          onPress: () => {
            LoggingService.info('Scanner', `Navigating to manual-entry with params: ${JSON.stringify(result.params)}`);
            router.replace({ pathname: '/manual-entry', params: { ...result.params, isEditMode: 'false', resetForm: 'true' } as ManualEntryParams });
            if (result.params?.imageUrl) {
              Image.prefetch(result.params.imageUrl);
            }
          }
        },
        {
          text: 'Scansiona di Nuovo',
          onPress: () => resetScanner(),
          style: 'cancel',
        },
      ]);
    } else if (result.type === 'online' && result.data) {
      // Usa il nome estratto dai parametri (che include la logica di fallback)
      // Se params non esiste (caso strano), tenta di accedere a data.product_name
      const extractedName = result.params?.name;
      const rawData = result.data as ProductData;
      const rawName = 'product_name' in rawData ? rawData.product_name : rawData.name;
      const displayName = extractedName || rawName;
      Alert.alert('Prodotto Trovato!', `Trovato online: ${displayName || barcode}`, [
        {
          text: 'Continua',
          onPress: () => {
            LoggingService.info('Scanner', `Navigating to manual-entry with online params: ${JSON.stringify(result.params)}`);
            router.replace({ pathname: '/manual-entry', params: { ...result.params, isEditMode: 'false', resetForm: 'true' } as ManualEntryParams });
            if (result.params?.imageUrl) {
              Image.prefetch(result.params.imageUrl);
            }
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
              router.replace({ pathname: '/manual-entry', params: { ...result.params, isEditMode: 'false', resetForm: 'true' } as ManualEntryParams });
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
            accessibilityLabel="Salta ricerca e aggiungi manualmente"
            accessibilityRole="button"
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
        <TouchableOpacity accessibilityLabel="Riprova scansione" accessibilityRole="button" style={styles.retryButton} onPress={() => resetScanner()}>
          <RefreshCw size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Riprova</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityLabel="Inserisci manualmente" accessibilityRole="button" style={styles.manualButton} onPress={() => {
          LoggingService.info('Scanner', `Manual entry button pressed, navigating with barcode: ${currentBarcode}`);
          router.replace({ pathname: '/manual-entry', params: { barcode: currentBarcode, barcodeType: 'unknown', addedMethod: 'barcode', fromScannerError: 'true', isEditMode: 'false', resetForm: 'true' } as ManualEntryParams })
        }}>
          <Text style={styles.manualButtonText}>Inserisci Manualmente</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityLabel="Torna indietro" accessibilityRole="button" style={styles.backButton} onPress={() => router.back()}>
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
          <TouchableOpacity accessibilityLabel="Scansiona di nuovo" accessibilityRole="button" style={styles.rescanButtonContainer} onPress={() => resetScanner()}>
            <Text style={styles.rescanButtonText}>Tocca per Scansionare di Nuovo</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity accessibilityLabel="Torna alla schermata precedente" accessibilityRole="button" onPress={() => router.back()} style={styles.backButtonContainer}>
          <ArrowLeft size={28} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return content;
}
