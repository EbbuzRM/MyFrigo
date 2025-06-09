import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BarcodeScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

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

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    Alert.alert(
      'Codice a Barre Scansionato',
      `Tipo: ${type}\nDati: ${data}`,
      [
        {
          text: 'OK',
          onPress: () => {
            // Here you would typically navigate to a form pre-filled with barcode data
            // or fetch product info from an API using the 'data' (barcode)
            console.log(`Barcode: ${data}, Type: ${type}`);
            // For now, just go back or allow another scan
            // router.back(); 
            // To allow another scan:
            // setScanned(false); 
            router.replace({ pathname: '/(tabs)/add', params: { barcode: data, barcodeType: type } });
          },
        },
        {
          text: 'Scansiona di Nuovo',
          onPress: () => setScanned(false),
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "qr", "pdf417", "datamatrix", "code39", "code93", "code128", "itf14", "codabar", "aztec"], // Add more types as needed
        }}
        style={StyleSheet.absoluteFillObject}
      />
      {scanned && (
        <View style={styles.rescanButtonContainer}>
          <Button title={'Tocca per Scansionare di Nuovo'} onPress={() => setScanned(false)} color="#fff" />
        </View>
      )}
      <View style={styles.backButtonContainer}>
        <Button title="Indietro" onPress={() => router.back()} color="#fff" />
      </View>
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
  rescanButtonContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  backButtonContainer: {
    position: 'absolute',
    top: 50, // Adjust as needed for SafeAreaView
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 5,
  }
});
