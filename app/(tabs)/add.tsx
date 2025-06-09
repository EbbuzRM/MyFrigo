import React, { useState, useEffect } from 'react'; // Consolidated React imports
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, QrCode, PlusCircle } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AddMethodCard } from '@/components/AddMethodCard';

export default function AddProduct() {
  const params = useLocalSearchParams();
  // const [someState, setSomeState] = useState(''); // Example if useState was needed

  useEffect(() => {
    if (params.barcode) {
      console.log('Barcode ricevuto:', params.barcode, 'Tipo:', params.barcodeType);
      // Here you could navigate to manual-entry with pre-filled data
      // or show a modal, or directly try to fetch product info from an API.
      // For now, just logging.
      // Example: router.push({ pathname: '/manual-entry', params: { barcode: params.barcode } });
    }
  }, [params]);
  const handleBarcodeScanner = () => {
    router.push('/scanner');
  };

  const handlePhotoCapture = () => {
    router.push({ pathname: '/photo-capture' }); // Using HrefObject
  };

  const handleManualEntry = () => {
    router.push('/manual-entry');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Aggiungi Prodotto</Text>
          <Text style={styles.subtitle}>
            Scegli il metodo per aggiungere un nuovo prodotto alla tua dispensa
          </Text>
        </View>

        <View style={styles.methodsContainer}>
          <AddMethodCard
            title="Scansiona Codice a Barre"
            description="Scansiona il codice a barre per identificare automaticamente il prodotto"
            icon={<QrCode size={32} color="#2563EB" />}
            onPress={handleBarcodeScanner}
            backgroundColor="#EFF6FF"
            borderColor="#DBEAFE"
          />

          <AddMethodCard
            title="Fotografa il Prodotto"
            description="Scatta una foto per il riconoscimento automatico e l'estrazione della data"
            icon={<Camera size={32} color="#10B981" />}
            onPress={handlePhotoCapture}
            backgroundColor="#F0FDF4"
            borderColor="#DCFCE7"
          />

          <AddMethodCard
            title="Inserimento Manuale"
            description="Aggiungi manualmente tutti i dettagli del prodotto"
            icon={<PlusCircle size={32} color="#F59E0B" />}
            onPress={handleManualEntry}
            backgroundColor="#FFFBEB"
            borderColor="#FEF3C7"
          />
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Suggerimenti</Text>
          <View style={styles.tipContainer}>
            <Text style={styles.tipText}>
              • Per risultati migliori con la fotocamera, assicurati che l'etichetta sia ben illuminata
            </Text>
            <Text style={styles.tipText}>
              • Il codice a barre funziona meglio su superfici piatte e pulite
            </Text>
            <Text style={styles.tipText}>
              • L'inserimento manuale ti permette il controllo completo sui dettagli
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    lineHeight: 24,
  },
  methodsContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginBottom: 12,
  },
  tipContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tipText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 8,
  },
});
