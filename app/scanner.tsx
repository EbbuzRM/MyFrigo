import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Text, View, StyleSheet, Button, Alert, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TemplateService } from '@/services/TemplateService';
import { useCategories } from '@/context/CategoryContext';
import { ProductCategory, Product } from '@/types/Product';
import { ProductTemplate } from '@/services/TemplateService';
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
  const isFocused = useIsFocused();
  const { categories: appCategories } = useCategories();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentBarcode, setCurrentBarcode] = useState<string | null>(null);
  const [frameLayout, setFrameLayout] = useState<{ x: number, y: number, width: number, height: number } | null>(null);

  const handleFrameLayout = (event: { nativeEvent: { layout: { x: number, y: number, width: number, height: number } } }) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setFrameLayout({ x, y, width, height });
  };

  const clearApiTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Funzione per recuperare i dati del prodotto da Supabase
  const fetchProductFromSupabase = useCallback(async (barcode: string): Promise<Partial<Product> | null> => {
    setLoadingProgress('Cercando prodotto nel database locale...');

    try {
      // Ridotto timeout da 5000 a 2000ms per velocità
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout database locale')), 2000);
      });

      const templatePromise = TemplateService.getProductTemplate(barcode);

      const template = await Promise.race([templatePromise, timeoutPromise]);
      return template;
    } catch (error) {
      LoggingService.error('Scanner', 'Errore nel database locale:', error);
      return null;
    }
  }, []);

  // Funzione per recuperare i dati del prodotto da Open Food Facts
  const fetchProductFromOpenFoodFacts = useCallback((barcode: string): Promise<unknown> => {
    setLoadingProgress('Cercando prodotto online...');
    
    // Crea una promessa che si risolve con il risultato della fetch o viene rifiutata dopo il timeout
    const fetchPromise = new Promise<unknown>((resolve, reject) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          reject(new Error('Timeout della richiesta API'));
        }, API_TIMEOUT);

        fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}`, {
          signal: controller.signal
        }).then(response => {
          clearTimeout(timeoutId);
          if (!response.ok) {
            reject(new Error(`Errore HTTP: ${response.status}`));
            return;
          }
          return response.json();
        }).then(jsonResponse => {
          if (jsonResponse.status !== 1 || !jsonResponse.product) {
            reject(new Error('Prodotto non trovato nel database online'));
            return;
          }
          resolve(jsonResponse.product);
        }).catch(error => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
    
    return fetchPromise;
  }, []);


  // Modifica handleBarCodeScanned per velocizzare l'esperienza
interface CachedResult {
  type: 'template' | 'online' | 'not_found';
  data?: any;
  params: Partial<Product> & { barcodeType?: string; addedMethod?: string };
}

interface CachedEntry {
  timestamp: number;
  result: CachedResult;
}

  const useBarcodeCache = useRef<Map<string, CachedEntry>>(new Map());

  const handleBarCodeScanned = useCallback(async ({ type, data, bounds }: { type: string; data: string; bounds: { origin: { x: number, y: number }, size: { width: number, height: number } } }) => {
    if (!frameLayout) return;

    // Controlla cache per evitare ricerche ripetute (valida per 30 minuti)
    const now = Date.now();
    const cacheEntry = useBarcodeCache.current.get(data);
    if (cacheEntry && (now - cacheEntry.timestamp) < 30 * 60 * 1000) {
      // Usa cache per risposta veloce
      if (cacheEntry.result.type === 'template' && cacheEntry.result.data) {
        LoggingService.info('Scanner', `Using cached template result for barcode: ${data}`);
        Alert.alert('Prodotto Trovato!', `Trovato template salvato: ${cacheEntry.result.data.name}`, [
          {
            text: 'Continua',
            onPress: () => {
              LoggingService.info('Scanner', `Navigating to manual-entry with cached params: ${JSON.stringify(cacheEntry.result.params)}`);
              router.replace({ pathname: '/manual-entry', params: { ...cacheEntry.result.params, isEditMode: 'false' } as any });
            }
          },
          {
            text: 'Scansiona di Nuovo',
            onPress: () => setScanned(false),
            style: 'cancel',
          },
        ]);
        return;
      }
    }

    // Controllo rilassato: se almeno una parte del codice è visibile nel quadro
    // invece di richiedere che il centro sia dentro
    const barcodeLeft = bounds.origin.x;
    const barcodeRight = bounds.origin.x + bounds.size.width;
    const barcodeTop = bounds.origin.y;
    const barcodeBottom = bounds.origin.y + bounds.size.height;

    const frameLeft = frameLayout.x;
    const frameRight = frameLayout.x + frameLayout.width;
    const frameTop = frameLayout.y;
    const frameBottom = frameLayout.y + frameLayout.height;

    // Controllo se c'è almeno una intersezione significativa tra barcode e frame
    const overlapX = Math.max(0, Math.min(barcodeRight, frameRight) - Math.max(barcodeLeft, frameLeft));
    const overlapY = Math.max(0, Math.min(barcodeBottom, frameBottom) - Math.max(barcodeTop, frameTop));

    const barcodeArea = bounds.size.width * bounds.size.height;
    const overlapArea = overlapX * overlapY;

    // Richiede almeno il 30% del barcode visibile nel frame
    if (overlapArea < barcodeArea * 0.3) {
      return;
    }

    setScanned(true);
    setIsLoading(true);
    setLoadingError(null);
    setCurrentBarcode(data);
    setLoadingProgress('Inizializzazione scansione...');

    let paramsForManualEntry: Partial<Product> & { barcodeType?: string; addedMethod?: string } = { barcode: data, barcodeType: type, addedMethod: 'barcode' };

    try {
      // Ricerca parallela ultra veloce
      setLoadingProgress('Ricerca velocissima in corso...');

      const [supabaseResult, offResult] = await Promise.allSettled([
        fetchProductFromSupabase(data),
        fetchProductFromOpenFoodFacts(data)
      ]);

      // 1. Controlla se abbiamo trovato un template locale (preferito)
      if (supabaseResult.status === 'fulfilled' && supabaseResult.value) {
        useBarcodeCache.current.set(data, {
          timestamp: now,
          result: {
            type: 'template',
            data: supabaseResult.value,
            params: paramsForManualEntry
          }
        });
        if (supabaseResult.value.name) {
          LoggingService.info('Scanner', `Found template result for barcode: ${data}, navigating to manual-entry`);
          Alert.alert('Prodotto Trovato!', `Trovato template salvato: ${supabaseResult.value.name}`, [
            {
              text: 'Continua',
              onPress: () => {
                LoggingService.info('Scanner', `Navigating to manual-entry with params: ${JSON.stringify(paramsForManualEntry)}`);
                router.replace({ pathname: '/manual-entry', params: { ...paramsForManualEntry, isEditMode: 'false' } as any });
              }
            },
            {
              text: 'Scansiona di Nuovo',
              onPress: () => setScanned(false),
              style: 'cancel',
            },
          ]);
          return;
        }
      }

      // 2. Controlla se abbiamo trovato dati online
      if (offResult.status === 'fulfilled') {
        const productInfo = offResult.value as any; // API esterna, non possiamo definire il tipo esatto
        if (productInfo && typeof productInfo === 'object') {
          const suggestedCategoryId = mapOffCategoryToAppCategory(productInfo.categories_tags, appCategories);

          paramsForManualEntry = {
            ...paramsForManualEntry,
            name: productInfo.product_name || '',
            brand: productInfo.brands || '',
            imageUrl: productInfo.image_url || '',
            category: suggestedCategoryId || '',
          };

          // Salva in cache
          useBarcodeCache.current.set(data, {
            timestamp: now,
            result: {
              type: 'online',
              data: productInfo,
              params: paramsForManualEntry
            }
          });

          LoggingService.info('Scanner', `Found online result for barcode: ${data}, navigating to manual-entry`);
          Alert.alert('Prodotto Trovato!', `Trovato online: ${productInfo.product_name || data}`, [
            {
              text: 'Continua',
              onPress: () => {
                LoggingService.info('Scanner', `Navigating to manual-entry with online params: ${JSON.stringify(paramsForManualEntry)}`);
                router.replace({ pathname: '/manual-entry', params: { ...paramsForManualEntry, isEditMode: 'false' } as any });
              }
            },
            {
              text: 'Scansiona di Nuovo',
              onPress: () => setScanned(false),
              style: 'cancel',
            },
          ]);
          return;
        }
      }

      // Se entrambe le ricerche hanno fallito, mostra errore
      const supabaseError = supabaseResult.status === 'rejected' ? supabaseResult.reason?.message : null;
      const offError = offResult.status === 'rejected' ? 'Prodotto non trovato online' : null;

      // Non mostrare errore se è solo timeout locale - passa direttamente alla ricerca online
      if (supabaseError?.includes('Timeout database locale') && !offError) {
        throw new Error(offError || 'Entrambe le ricerche hanno fallito');
      }

      const errorMessage = supabaseError && offError
        ? `Database locale: ${supabaseError}. ${offError}`
        : supabaseError || offError || 'Entrambe le ricerche hanno fallito';

      throw new Error(errorMessage);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      LoggingService.error('Scanner', "Errore durante la ricerca del prodotto:", errorMessage);

      // Se l'errore è che il prodotto non è stato trovato (o è un 404), lo gestiamo come un caso normale
      if (errorMessage.includes('Prodotto non trovato') || errorMessage.includes('Errore HTTP: 404')) {
        // Salva in cache anche il mancato ritrovamento per evitare ricerche ripetute
        useBarcodeCache.current.set(data, {
          timestamp: now,
          result: {
            type: 'not_found',
            params: paramsForManualEntry
          }
        });

        LoggingService.info('Scanner', `Product not found for barcode: ${data}, offering manual entry`);
        Alert.alert(
          'Prodotto Non Trovato',
          `Vuoi aggiungere manualmente il prodotto con codice ${data}?`,
          [
            {
              text: 'Sì, Aggiungi',
              onPress: () => {
                LoggingService.info('Scanner', `Navigating to manual-entry for manual entry: ${JSON.stringify(paramsForManualEntry)}`);
                router.replace({ pathname: '/manual-entry', params: { ...paramsForManualEntry, isEditMode: 'false' } as any });
              }
            },
            {
              text: 'Scansiona di Nuovo',
              onPress: () => setScanned(false),
              style: 'cancel',
            },
          ]
        );
      } else {
        // Per tutti gli altri errori (rete, timeout, etc.), mostriamo un errore bloccante
        setLoadingError(`Errore: ${errorMessage}. Riprova o inserisci manualmente.`);
      }
    } finally {
      setIsLoading(false);
      clearApiTimeout();
    }
  }, [appCategories, clearApiTimeout, fetchProductFromSupabase, fetchProductFromOpenFoodFacts, frameLayout]);

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
        {loadingProgress.includes('velocemente') && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => {
              setIsLoading(false);
              setScanned(false);
            }}
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
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <RefreshCw size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Riprova</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.manualButton} onPress={() => {
          LoggingService.info('Scanner', `Manual entry button pressed, navigating with barcode: ${currentBarcode}`);
          router.replace({ pathname: '/manual-entry', params: { barcode: currentBarcode, barcodeType: 'unknown', addedMethod: 'barcode', fromScannerError: 'true', isEditMode: 'false' } as any })
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
          onBarcodeScanned={scanned || isLoading ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "qr", "pdf417", "datamatrix", "code39", "code93", "code128", "itf14", "codabar", "aztec"], // Add more types as needed
          }}
          style={StyleSheet.absoluteFillObject}
        />
        )}
        <View style={styles.scanFrameContainer} pointerEvents="none">
            <View style={styles.scanFrame} onLayout={handleFrameLayout} />
            <Text style={styles.scanFrameText}>Inquadra il codice a barre</Text>
        </View>
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
