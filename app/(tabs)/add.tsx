import React, { useEffect } from 'react'; // Consolidated React imports
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Barcode, Keyboard } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AddMethodCard } from '@/components/AddMethodCard';
import { useTheme } from '@/context/ThemeContext';

// Componente per l'aggiunta di prodotti
const AddProduct = () => {
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  // const [someState, setSomeState] = useState(''); // Example if useState was needed

  useEffect(() => {
    // Check if we have barcode data, implying we came from the scanner
    if (params.barcode && typeof params.barcode === 'string') {
      // Prepare all parameters to forward to the manual entry screen
      const forwardParams: { [key: string]: string | undefined | string[] } = { 
        barcode: params.barcode,
      };
      if (params.barcodeType && typeof params.barcodeType === 'string') {
        forwardParams.barcodeType = params.barcodeType;
      }
      if (params.productName && typeof params.productName === 'string') {
        forwardParams.productName = params.productName;
      }
      if (params.brand && typeof params.brand === 'string') {
        forwardParams.brand = params.brand;
      }
      if (params.imageUrl && typeof params.imageUrl === 'string') {
        forwardParams.imageUrl = params.imageUrl;
      }
      // Add any other params you might have passed from scanner.tsx

      // Navigate to manual-entry with all collected parameters
      // Using replace to prevent going back to this intermediate 'add' screen
      router.replace({ pathname: '/manual-entry', params: forwardParams });
    }
  }, [params]);

  const handleBarcodeScanner = () => {
    router.push('/scanner');
  };

  const handleManualEntry = () => {
    router.push('/manual-entry');
  };

  const styles = getStyles(isDarkMode);

  return (
    <SafeAreaView style={styles.container} testID="add-product-screen">
      <View style={{ flex: 1, marginBottom: 60 + insets.bottom }}>
        <View style={styles.header}>
        <Text style={styles.title}>Aggiungi Prodotto</Text>
        <Text style={styles.subtitle}>
          Scegli il metodo per aggiungere un nuovo prodotto alla tua dispensa
        </Text>
      </View>

      <View style={styles.methodsContainer}>
        <AddMethodCard
          testID="photo-capture-button"
          title="Scansiona Codice a Barre"
          description="Usa la fotocamera per una scansione rapida"
          icon={<Barcode size={28} />}
          onPress={handleBarcodeScanner}
          variant="barcode"
        />

        <AddMethodCard
          testID="manual-entry-button"
          title="Inserimento Manuale"
          description="Aggiungi i dettagli del prodotto manualmente"
          icon={<Keyboard size={28} />}
          onPress={handleManualEntry}
          variant="manual"
        />
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Suggerimenti</Text>
        <View style={styles.tipContainer}>
          <Text style={styles.tipText}>
            • Puoi inserire la data di scadenza anche da un'immagine della galleria.Assicurati che l'etichetta sia ben illuminata e si consiglia di utilizzare la modalità macro.
          </Text>
          <Text style={styles.tipText}>
            • L'inserimento manuale ti permette il controllo completo sui dettagli
          </Text>
          <Text style={styles.tipText}>
            
          </Text>
        </View>
      </View>
    </View>
    </SafeAreaView>
  );
};

// Esportazione predefinita del componente
export default AddProduct;

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDarkMode ? '#0d1117' : '#ffffff',
    padding: 20,
    gap: 24,
  },
  header: {
    // No specific padding needed if container has it
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
    lineHeight: 20,
  },
  methodsContainer: {
    gap: 14,
  },
  infoSection: {
    // No specific padding needed if container has it
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
    marginBottom: 8,
  },
  tipContainer: {
    backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#8b949e' : '#64748B',
    lineHeight: 20,
  },
});

