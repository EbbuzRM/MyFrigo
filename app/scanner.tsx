import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Text, View, StyleSheet, Button, Alert, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StorageService } from '@/services/StorageService';
import { useCategories } from '@/context/CategoryContext';
import { ProductCategory } from '@/types/Product';
import { LoggingService } from '@/services/LoggingService';

// Timeout per le richieste API (in millisecondi)
const API_TIMEOUT = 10000;

const mapOffCategoryToAppCategory = (
  offCategories: string[] | undefined,
  appCategories: ProductCategory[]
): string | null => {
  if (!offCategories || offCategories.length === 0) {
    return null;
  }

  const keywordMap: { [key: string]: string[] } = {
      'latticini': ['dairy', 'cheeses', 'yogurts', 'milks', 'butters', 'creams'],
      'carne': ['meats', 'poultry', 'beef', 'pork', 'sausages', 'hams', 'salami', 'turkey', 'lamb'],
      'pesce': ['seafood', 'fishes', 'tuna', 'salmon', 'cod', 'shrimps', 'clams', 'mussels'],
      'frutta': ['fruits', 'apples', 'bananas', 'oranges', 'strawberries', 'grapes', 'peaches', 'apricots', 'kiwis'],
      'verdura': ['vegetables', 'tomatoes', 'lettuces', 'zucchini', 'eggplants', 'carrots', 'potatoes', 'onions', 'spinach'],
      'surgelati': ['frozen-foods', 'ice-creams', 'frozen-pizzas', 'frozen-ready-meals', 'frozen-vegetables'],
      'bevande': ['beverages', 'waters', 'juices', 'sodas', 'wines', 'beers', 'teas', 'coffees'],
      'dispensa': ['pantry', 'pastas', 'rices', 'breads', 'biscuits', 'flours', 'sugars', 'salts', 'oils', 'vinegars', 'canned-foods', 'pulses', 'beans', 'chickpeas', 'lentils'],
      'snack': ['snacks', 'crisps', 'chocolates', 'sweets', 'crackers'],
      'colazione': ['breakfasts', 'cereals', 'rusks', 'jams', 'croissants'],
      'condimenti': ['condiments', 'sauces', 'mayonnaises', 'ketchups', 'mustards'],
      'uova': ['eggs'],
      'dolci': ['desserts', 'cakes', 'puddings', 'pastries'],
  };

  const lowerCaseOffCategories = offCategories.map(c => c.toLowerCase());

  for (const appCategoryId in keywordMap) {
    const keywords = keywordMap[appCategoryId];
    if (keywords.some(keyword => lowerCaseOffCategories.some(offCat => offCat.includes(keyword)))) {
      if (appCategories.some(cat => cat.id === appCategoryId)) {
        return appCategoryId;
      }
    }
  }

  return null;
};

export default function BarcodeScannerScreen() {
  // Tutti i hooks devono essere chiamati all'inizio del componente
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<string>('Inizializzazione...');
  const [currentBarcode, setCurrentBarcode] = useState<string | null>(null);
  const isFocused = useIsFocused();
  const { categories: appCategories } = useCategories();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Funzione per pulire il timeout
  const clearApiTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Funzione per impostare un nuovo timeout
  const setApiTimeout = useCallback((callback: () => void) => {
    clearApiTimeout();
    timeoutRef.current = setTimeout(callback, API_TIMEOUT);
  }, [clearApiTimeout]);

  // Funzione per recuperare i dati del prodotto da Supabase
  const fetchProductFromSupabase = useCallback(async (barcode: string): Promise<any> => {
    setLoadingProgress('Cercando prodotto nel database locale...');
    const template = await StorageService.getProductTemplate(barcode);
    return template;
  }, []);

  // Funzione per recuperare i dati del prodotto da Open Food Facts
  const fetchProductFromOpenFoodFacts = useCallback(async (barcode: string): Promise<any> => {
    setLoadingProgress('Cercando prodotto online...');
    
    // Crea una promessa che si risolve con il risultato della fetch o viene rifiutata dopo il timeout
    const fetchPromise = new Promise(async (resolve, reject) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          reject(new Error('Timeout della richiesta API'));
        }, API_TIMEOUT);

        const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          reject(new Error(`Errore HTTP: ${response.status}`));
          return;
        }
        
        const jsonResponse = await response.json();
        if (jsonResponse.status !== 1 || !jsonResponse.product) {
          reject(new Error('Prodotto non trovato nel database online'));
          return;
        }
        
        resolve(jsonResponse.product);
      } catch (error) {
        reject(error);
      }
    });
    
    return fetchPromise;
  }, []);

  // Funzione per gestire la scansione del codice a barre
  const handleBarCodeScanned = useCallback(async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setIsLoading(true);
    setLoadingError(null);
    setCurrentBarcode(data);
    setLoadingProgress('Inizializzazione scansione...');

    let productInfoFound = false;
    let alertMessage = `Codice: ${data}`;
    let paramsForAddScreen: any = { barcode: data, barcodeType: type };

    try {
      // 1. Prima controlla se esiste un template salvato
      setLoadingProgress('Cercando prodotto nel database locale...');
      const template = await fetchProductFromSupabase(data);
      
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
        // 2. Se non c'è un template, prova con Open Food Facts
        try {
          setLoadingProgress('Cercando prodotto online...');
          const productInfo = await fetchProductFromOpenFoodFacts(data);
          
          productInfoFound = true;
          alertMessage = `Prodotto Trovato (Online): ${productInfo.product_name || data}`;
          
          const suggestedCategoryId = mapOffCategoryToAppCategory(productInfo.categories_tags, appCategories);

          paramsForAddScreen = {
            ...paramsForAddScreen,
            productName: productInfo.product_name || '',
            brand: productInfo.brands || '',
            imageUrl: productInfo.image_url || '',
            category: suggestedCategoryId || '',
          };
        } catch (apiError) {
          LoggingService.error('Scanner', "Failed to fetch product from API:", apiError);
          alertMessage = `Prodotto non trovato online (codice: ${data}). Puoi inserirlo manualmente.`;
        }
      }
    } catch (error) {
      LoggingService.error('Scanner', "Failed to fetch product info:", error);
      setLoadingError("Errore durante il recupero delle informazioni del prodotto. Riprova o inserisci manualmente.");
    } finally {
      setIsLoading(false);
      clearApiTimeout();
    }

    if (!loadingError) {
      Alert.alert(
        productInfoFound ? 'Prodotto Trovato!' : 'Prodotto Non Trovato',
        alertMessage,
        [
          {
            text: 'Continua',
            onPress: () => {
              // Chiedi se vogliono fotografare la data di scadenza
              Alert.alert(
                'Data di Scadenza',
                'Vuoi fotografare la data di scadenza per provare a inserirla automaticamente?',
                [
                  {
                    text: 'Sì, Fotografa',
                    onPress: () => {
                      router.push({
                        pathname: '/photo-capture',
                        params: {
                          ...paramsForAddScreen,
                          captureMode: 'expirationDateOnly'
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
                { cancelable: false }
              );
            },
          },
          {
            text: 'Scansiona di Nuovo',
            onPress: () => {
              setScanned(false);
              setLoadingError(null);
            },
            style: 'cancel',
          },
        ]
      );
    }
  }, [appCategories, clearApiTimeout, fetchProductFromSupabase, fetchProductFromOpenFoodFacts]);

  // Funzione per riprovare la scansione
  const handleRetry = useCallback(() => {
    setLoadingError(null);
    setIsLoading(false);
    setScanned(false);
  }, []);

  // Richiedi permessi della fotocamera se necessario
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Pulisci il timeout quando il componente viene smontato
  useEffect(() => {
    return () => {
      clearApiTimeout();
    };
  }, [clearApiTimeout]);

  // Renderizza il contenuto appropriato in base allo stato
  let content;
  
  if (!permission) {
    // Camera permissions are still loading
    content = <View />;
  } else if (!permission.granted) {
    // Camera permissions are not granted yet
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
      </SafeAreaView>
    );
  } else if (loadingError) {
    content = (
      <SafeAreaView style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>{loadingError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <RefreshCw size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Riprova</Text>
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

  // Un unico return alla fine del componente
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
  }
});
