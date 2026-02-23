import { useState, useEffect, useRef, useCallback } from 'react';
import { useCameraPermissions, PermissionResponse } from 'expo-camera';
import { TemplateService } from '@/services/TemplateService';
import { CategoryMatcher } from '@/services/CategoryMatcher';
import { ProductCategory, Product } from '@/types/Product';
import { LoggingService } from '@/services/LoggingService';

const API_TIMEOUT = 15000; // Aumentato da 10 a 15 secondi per connessioni lente
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MIN_OVERLAP_PERCENTAGE = 0.1; // 10% of barcode must be visible
const DEBUG_SCANNER = __DEV__; // Abilita log dettagliati solo in sviluppo

interface OpenFoodFactsProduct {
  product_name?: string;
  product_name_it?: string;
  generic_name?: string;
  generic_name_it?: string;
  abbreviated_product_name?: string;
  brands?: string;
  brands_tags?: string[];
  image_url?: string;
  image_front_url?: string;
  image_front_small_url?: string;
  categories_tags?: string[];
  [key: string]: unknown;
}

interface OpenFoodFactsResponse {
  status: number;
  product?: OpenFoodFactsProduct;
}

interface BarcodeBounds {
  origin: { x: number; y: number };
  size: { width: number; height: number };
}

interface FrameLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ScanResult {
  type: 'template' | 'online' | 'not_found';
  data?: Partial<Product> | OpenFoodFactsProduct;
  params: Partial<Product> & { barcodeType?: string; addedMethod?: string };
  error?: string;
}

export interface UseBarcodeScannerReturn {
  permission: ReturnType<typeof useCameraPermissions>[0];
  scanned: boolean;
  isLoading: boolean;
  loadingError: string | null;
  loadingProgress: string;
  currentBarcode: string | null;
  handleBarCodeScanned: (data: string, type: string, bounds: BarcodeBounds, frameLayout: FrameLayout | null) => Promise<void>;
  resetScanner: () => void;
  requestPermission: () => Promise<PermissionResponse>;
}

const mapOffCategoryToAppCategory = (
  offCategories: string[] | undefined,
  appCategories: ProductCategory[]
): string | null => {
  return CategoryMatcher.mapOpenFoodFactsCategories(offCategories, appCategories);
};

/**
 * Estrae il nome del prodotto con fallback alla versione localizzata italiana.
 * Molti prodotti su OFF hanno `product_name` vuoto ma `product_name_it` popolato.
 */
export const extractProductName = (product: OpenFoodFactsProduct): string => {
  return product.product_name || product.product_name_it || product.generic_name_it || product.generic_name || product.abbreviated_product_name || '';
};

/**
 * Estrae la marca con fallback a brands_tags.
 */
export const extractBrand = (product: OpenFoodFactsProduct): string => {
  return product.brands || (product.brands_tags?.length ? product.brands_tags[0] : '');
};

/**
 * Estrae l'URL dell'immagine con fallback ai campi alternativi.
 */
export const extractImageUrl = (product: OpenFoodFactsProduct): string => {
  return product.image_url || product.image_front_url || product.image_front_small_url || '';
};

const isBarcodeInFrame = (
  bounds: BarcodeBounds,
  frameLayout: FrameLayout
): boolean => {
  const barcodeLeft = bounds.origin.x;
  const barcodeRight = bounds.origin.x + bounds.size.width;
  const barcodeTop = bounds.origin.y;
  const barcodeBottom = bounds.origin.y + bounds.size.height;

  const frameLeft = frameLayout.x;
  const frameRight = frameLayout.x + frameLayout.width;
  const frameTop = frameLayout.y;
  const frameBottom = frameLayout.y + frameLayout.height;

  const overlapX = Math.max(0, Math.min(barcodeRight, frameRight) - Math.max(barcodeLeft, frameLeft));
  const overlapY = Math.max(0, Math.min(barcodeBottom, frameBottom) - Math.max(barcodeTop, frameTop));

  const barcodeArea = bounds.size.width * bounds.size.height;
  const overlapArea = overlapX * overlapY;

  return overlapArea >= barcodeArea * MIN_OVERLAP_PERCENTAGE;
};

export function useBarcodeScanner(
  appCategories: ProductCategory[],
  onProductFound: (result: ScanResult, barcode: string) => void
): UseBarcodeScannerReturn {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState<string>('Inizializzazione...');
  const [currentBarcode, setCurrentBarcode] = useState<string | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  interface CachedEntry {
    timestamp: number;
    result: ScanResult;
  }

  const barcodeCache = useRef<Map<string, CachedEntry>>(new Map());

  const clearApiTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const fetchProductFromSupabase = useCallback(async (barcode: string): Promise<Partial<Product> | null> => {
    setLoadingProgress('Cercando prodotto nel database locale...');

    try {
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout database locale')), 2000);
      });

      const templatePromise = TemplateService.getProductTemplate(barcode);
      const template = await Promise.race([templatePromise, timeoutPromise]);
      
      if (DEBUG_SCANNER && template) {
        LoggingService.debug('BarcodeScanner', `Template found: ${template.name}`);
      }
      return template;
    } catch (error) {
      if (DEBUG_SCANNER) {
        LoggingService.debug('BarcodeScanner', `Local DB error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
      return null;
    }
  }, []);

  const fetchProductFromOpenFoodFacts = useCallback((barcode: string): Promise<OpenFoodFactsProduct> => {
    setLoadingProgress('Cercando prodotto online...');

    return new Promise((resolve, reject) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          reject(new Error('Timeout della richiesta API'));
        }, API_TIMEOUT);

        fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}`, {
          signal: controller.signal
        })
          .then(response => {
            clearTimeout(timeoutId);
            if (!response.ok) {
              reject(new Error(`Errore HTTP: ${response.status}`));
              return;
            }
            return response.json() as Promise<OpenFoodFactsResponse>;
          })
          .then(jsonResponse => {
            if (!jsonResponse) {
              reject(new Error('Risposta API vuota'));
              return;
            }
            if (jsonResponse.status !== 1 || !jsonResponse.product) {
              reject(new Error('Prodotto non trovato nel database online'));
              return;
            }
            
            if (DEBUG_SCANNER) {
              const productName = jsonResponse.product.product_name || jsonResponse.product.product_name_it || 'N/D';
              LoggingService.debug('BarcodeScanner', `Product found on OFF: ${productName}`);
            }
            resolve(jsonResponse.product);
          })
          .catch(error => {
            if (DEBUG_SCANNER) {
              LoggingService.debug('BarcodeScanner', `OFF request error: ${error.message}`);
            }
            reject(error);
          });
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  const handleBarCodeScanned = useCallback(async (
    data: string,
    type: string,
    bounds: BarcodeBounds,
    frameLayout: FrameLayout | null
  ) => {
    if (!frameLayout) {
      LoggingService.warning('BarcodeScanner', '⚠️ frameLayout è null, salto scansione');
      return;
    }

    const startTime = Date.now();
    const now = Date.now();

    // Log essenziale di inizio scansione
    LoggingService.info('BarcodeScanner', `Scanning barcode: ${data}`);

    // Check cache first
    const cacheEntry = barcodeCache.current.get(data);
    if (cacheEntry && (now - cacheEntry.timestamp) < CACHE_DURATION) {
      if (DEBUG_SCANNER) {
        LoggingService.debug('BarcodeScanner', `Cache hit for ${data} (${now - cacheEntry.timestamp}ms)`);
      }
      onProductFound(cacheEntry.result, data);
      return;
    } else if (DEBUG_SCANNER && cacheEntry) {
      LoggingService.debug('BarcodeScanner', `Cache expired for ${data}`);
    }

    // Validate barcode is within frame
    if (!isBarcodeInFrame(bounds, frameLayout)) {
      LoggingService.warning('BarcodeScanner', '⚠️ Barcode fuori dal frame, ignoro scansione');
      return;
    }

    LoggingService.info('BarcodeScanner', '✅ Barcode valido e nel frame, procedo...');

    setScanned(true);
    setIsLoading(true);
    setLoadingError(null);
    setCurrentBarcode(data);
    setLoadingProgress('Inizializzazione scansione...');

    let paramsForManualEntry: Partial<Product> & { barcodeType?: string; addedMethod?: string } = {
      barcode: data,
      barcodeType: type,
      addedMethod: 'barcode'
    };

    try {
      setLoadingProgress('Ricerca velocissima in corso...');

      const [supabaseResult, offResult] = await Promise.allSettled([
        fetchProductFromSupabase(data),
        fetchProductFromOpenFoodFacts(data)
      ]);

      const totalTime = Date.now() - startTime;

      // Check Supabase result first (preferred)
      if (supabaseResult.status === 'fulfilled' && supabaseResult.value) {
        if (DEBUG_SCANNER) {
          LoggingService.debug('BarcodeScanner', `Template found: ${supabaseResult.value.name}`);
        }
        
        // Unisci i dati del template nei parametri per il form
        paramsForManualEntry = {
          ...paramsForManualEntry,
          name: supabaseResult.value.name || '',
          brand: supabaseResult.value.brand || '',
          category: supabaseResult.value.category || '',
          imageUrl: supabaseResult.value.imageUrl || '',
        };

        const result: ScanResult = {
          type: 'template',
          data: supabaseResult.value,
          params: paramsForManualEntry
        };

        barcodeCache.current.set(data, { timestamp: now, result });
        LoggingService.info('BarcodeScanner', `Found template: ${supabaseResult.value.name} (${totalTime}ms)`);
        onProductFound(result, data);
        return;
      } else if (DEBUG_SCANNER && supabaseResult.status === 'rejected') {
        LoggingService.debug('BarcodeScanner', `Supabase error: ${supabaseResult.reason?.message}`);
      }

      // Check Open Food Facts result
      if (offResult.status === 'fulfilled') {
        const productInfo = offResult.value;
        if (productInfo && typeof productInfo === 'object') {
          const suggestedCategoryId = mapOffCategoryToAppCategory(productInfo.categories_tags, appCategories);
          const extractedName = extractProductName(productInfo);
          const extractedBrand = extractBrand(productInfo);
          const extractedImage = extractImageUrl(productInfo);

          paramsForManualEntry = {
            ...paramsForManualEntry,
            name: extractedName,
            brand: extractedBrand,
            imageUrl: extractedImage,
            category: suggestedCategoryId || '',
          };

          const result: ScanResult = {
            type: 'online',
            data: productInfo,
            params: paramsForManualEntry
          };

          barcodeCache.current.set(data, { timestamp: now, result });
          LoggingService.info('BarcodeScanner', `Found online: ${extractedName} (${totalTime}ms)`);
          onProductFound(result, data);
          return;
        }
      } else if (DEBUG_SCANNER) {
        LoggingService.debug('BarcodeScanner', `OpenFoodFacts error: ${offResult.reason?.message}`);
      }

      // Both searches failed
      const supabaseError = supabaseResult.status === 'rejected' ? supabaseResult.reason?.message : null;
      const offError = offResult.status === 'rejected' ? offResult.reason?.message : null;

      if (supabaseError?.includes('Timeout database locale') && !offError) {
        throw new Error(offError || 'Entrambe le ricerche hanno fallito');
      }

      const errorMessage = supabaseError && offError
        ? `Database locale: ${supabaseError}. ${offError}`
        : supabaseError || offError || 'Entrambe le ricerche hanno fallito';

      throw new Error(errorMessage);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      LoggingService.error('BarcodeScanner', `Scan error: ${errorMessage}`, error);

      // Handle "not found" case
      if (errorMessage.includes('Prodotto non trovato') || errorMessage.includes('Errore HTTP: 404')) {
        const result: ScanResult = {
          type: 'not_found',
          params: paramsForManualEntry
        };

        barcodeCache.current.set(data, { timestamp: now, result });
        onProductFound(result, data);
      } else {
        // Other errors (network, timeout, etc.) - show blocking error
        setLoadingError(`Errore: ${errorMessage}. Riprova o inserisci manualmente.`);
      }
    } finally {
      const finalTime = Date.now() - startTime;
      if (DEBUG_SCANNER) {
        LoggingService.debug('BarcodeScanner', `Scan completed in ${finalTime}ms`);
      }
      setIsLoading(false);
      clearApiTimeout();
    }
  }, [appCategories, clearApiTimeout, fetchProductFromSupabase, fetchProductFromOpenFoodFacts, onProductFound]);

  const resetScanner = useCallback(() => {
    setScanned(false);
    setIsLoading(false);
    setLoadingError(null);
    clearApiTimeout();
  }, [clearApiTimeout]);

  // Request camera permissions on mount if needed
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      clearApiTimeout();
    };
  }, [clearApiTimeout]);

  // Periodic cache cleanup to prevent memory leaks
  useEffect(() => {
    const cleanupCache = () => {
      const now = Date.now();
      let removedCount = 0;

      barcodeCache.current.forEach((entry, key) => {
        if (now - entry.timestamp >= CACHE_DURATION) {
          barcodeCache.current.delete(key);
          removedCount++;
        }
      });

      if (removedCount > 0) {
        LoggingService.debug('Scanner', `Cache cleanup: removed ${removedCount} expired entries`);
      }
    };

    const intervalId = setInterval(cleanupCache, CACHE_CLEANUP_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return {
    permission,
    scanned,
    isLoading,
    loadingError,
    loadingProgress,
    currentBarcode,
    handleBarCodeScanned,
    resetScanner,
    requestPermission
  };
}
