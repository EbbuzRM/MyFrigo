// scanner.tsx — scanner module.
//
// exports: BarcodeScannerScreen | function
// used_by: none
// rules:   - Do not remove or modify the `interface FrameLayout` or `interface ManualEntryParams` type definitions; they are used for type-safe navigation parameters and UI layout calculations.
//          - The `CameraView` from `expo-camera` is the core scanning component and must remain the primary barcode capture method.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { useState, useCallback } from 'react';
import { Text, View, StyleSheet, Button, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView } from 'expo-camera';
import { router } from 'expo-router';
import { useIsFocused } from 'expo-router/build/react-navigation/native';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCategories } from '@/context/CategoryContext';
import { Product } from '@/types/Product';
import { LoggingService } from '@/services/LoggingService';
import { useBarcodeScanner, ScanResult } from '@/hooks/useBarcodeScanner';
import { styles } from '@/styles/scanner.styles';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';

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
  const { t } = useTranslation();
  const [frameLayout, setFrameLayout] = useState<FrameLayout | null>(null);
  const isFocused = useIsFocused();
  const { categories: appCategories } = useCategories();

  const handleProductFound = useCallback((result: ScanResult, barcode: string) => {
    const translate = i18next.t.bind(i18next);
    if (result.type === 'template' && result.data) {
      Alert.alert(translate('scanner.productFoundTitle'), translate('scanner.savedTemplateFound', { name: (result.data as Partial<Product>).name }), [
        {
          text: translate('common.continue'),
          onPress: () => {
            LoggingService.info('Scanner', `Navigating to manual-entry with params: ${JSON.stringify(result.params)}`);
            router.replace({ pathname: '/manual-entry', params: { ...result.params, isEditMode: 'false', resetForm: 'true' } as ManualEntryParams });
          }
        },
        {
          text: translate('scanner.scanAgain'),
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
      Alert.alert(translate('scanner.productFoundTitle'), translate('scanner.onlineProductFound', { name: displayName || barcode }), [
        {
          text: translate('common.continue'),
          onPress: () => {
            LoggingService.info('Scanner', `Navigating to manual-entry with online params: ${JSON.stringify(result.params)}`);
            router.replace({ pathname: '/manual-entry', params: { ...result.params, isEditMode: 'false', resetForm: 'true' } as ManualEntryParams });
          }
        },
        {
          text: translate('scanner.scanAgain'),
          onPress: () => resetScanner(),
          style: 'cancel',
        },
      ]);
    } else if (result.type === 'not_found') {
      Alert.alert(
        translate('scanner.productNotFoundTitle'),
        translate('scanner.addBarcodeManuallyPrompt', { barcode }),
        [
          {
            text: translate('scanner.yesAdd'),
            onPress: () => {
              LoggingService.info('Scanner', `Navigating to manual-entry for manual entry: ${JSON.stringify(result.params)}`);
              router.replace({ pathname: '/manual-entry', params: { ...result.params, isEditMode: 'false', resetForm: 'true' } as ManualEntryParams });
            }
          },
          {
            text: translate('scanner.scanAgain'),
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
          <Text style={styles.permissionText}>{t('scanner.cameraPermissionMessage')}</Text>
          <Button onPress={requestPermission} title={t('scanner.grantPermission')} />
          <Button onPress={() => router.back()} title={t('common.back')} color="gray" />
        </View>
      </SafeAreaView>
    );
  } else if (isLoading) {
    content = (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#fff" style={styles.loadingIndicator} />
        <Text style={styles.loadingText}>{t(loadingProgress === 'searching' ? 'scanner.searchingBarcode' : 'scanner.initializingBarcode')}</Text>
        {loadingProgress === 'searching' && (
          <TouchableOpacity
            accessibilityLabel={t('scanner.skipSearch')}
            accessibilityRole="button"
            style={styles.skipButton}
            onPress={() => resetScanner()}
          >
            <Text style={styles.skipButtonText}>{t('scanner.skipSearch')}</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  } else if (loadingError) {
    content = (
      <SafeAreaView style={[styles.container, styles.errorContainer]}>
            <Text style={styles.errorText}>{t('scanner.lookupFailed')}</Text>
            <TouchableOpacity testID="scanner-retry-button" accessibilityLabel={t('scanner.retryScan')} accessibilityRole="button" style={styles.retryButton} onPress={() => resetScanner()}>
          <RefreshCw size={20} color="#fff" />
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
            <TouchableOpacity testID="scanner-manual-entry-button" accessibilityLabel={t('scanner.enterManually')} accessibilityRole="button" style={styles.manualButton} onPress={() => {
          LoggingService.info('Scanner', `Manual entry button pressed, navigating with barcode: ${currentBarcode}`);
          router.replace({ pathname: '/manual-entry', params: { barcode: currentBarcode, barcodeType: 'unknown', addedMethod: 'barcode', fromScannerError: 'true', isEditMode: 'false', resetForm: 'true' } as ManualEntryParams })
        }}>
          <Text style={styles.manualButtonText}>{t('scanner.enterManually')}</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityLabel={t('common.goBack')} accessibilityRole="button" style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{t('common.goBack')}</Text>
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
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={styles.scanFrameContainer} pointerEvents="none">
          <View style={styles.scanFrame} onLayout={handleFrameLayout} />
          <Text testID="scanner-frame-label" style={styles.scanFrameText}>{t('scanner.frameBarcode')}</Text>
        </View>
        {scanned && !isLoading && (
            <TouchableOpacity testID="scanner-rescan-button" accessibilityLabel={t('scanner.scanAgain')} accessibilityRole="button" style={styles.rescanButtonContainer} onPress={() => resetScanner()}>
            <Text style={styles.rescanButtonText}>{t('scanner.tapToScanAgain')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity testID="scanner-back-button" accessibilityLabel={t('scanner.previousScreen')} accessibilityRole="button" onPress={() => router.back()} style={styles.backButtonContainer}>
          <ArrowLeft size={28} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return content;
}
