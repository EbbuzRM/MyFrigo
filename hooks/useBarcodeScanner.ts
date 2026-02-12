import { useState, useEffect, useRef, useCallback } from 'react';
import { useCameraPermissions, PermissionResponse } from 'expo-camera';
import { TemplateService } from '@/services/TemplateService';
import { CategoryMatcher } from '@/services/CategoryMatcher';
import { ProductCategory, Product } from '@/types/Product';
import { LoggingService } from '@/services/LoggingService';

const API_TIMEOUT = 10000;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MIN_OVERLAP_PERCENTAGE = 0.1; // 10% of barcode must be visible

interface OpenFoodFactsProduct {
  product_name?: string;
  brands?: string;
  image_url?: string;
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
      return template;
    } catch (error) {
      LoggingService.error('Scanner', 'Errore nel database locale:', error);
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
              return;
            }
            if (jsonResponse.status !== 1 || !jsonResponse.product) {
              reject(new Error('Prodotto non trovato nel database online'));
              return;
            }
            resolve(jsonResponse.product);
          })
          .catch(error => {
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
    if (!frameLayout) return;

    const now = Date.now();
    
    // Check cache first
    const cacheEntry = barcodeCache.current.get(data);
    if (cacheEntry && (now - cacheEntry.timestamp) < CACHE_DURATION) {
      LoggingService.info('Scanner', `Using cached result for barcode: ${data}`);
      onProductFound(cacheEntry.result, data);
      return;
    }

    // Validate barcode is within frame
    if (!isBarcodeInFrame(bounds, frameLayout)) {
      return;
    }

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

      // Check Supabase result first (preferred)
      if (supabaseResult.status === 'fulfilled' && supabaseResult.value) {
        const result: ScanResult = {
          type: 'template',
          data: supabaseResult.value,
          params: paramsForManualEntry
        };
        
        barcodeCache.current.set(data, { timestamp: now, result });
        onProductFound(result, data);
        return;
      }

      // Check Open Food Facts result
      if (offResult.status === 'fulfilled') {
        const productInfo = offResult.value;
        if (productInfo && typeof productInfo === 'object') {
          const suggestedCategoryId = mapOffCategoryToAppCategory(productInfo.categories_tags, appCategories);

          paramsForManualEntry = {
            ...paramsForManualEntry,
            name: productInfo.product_name || '',
            brand: productInfo.brands || '',
            imageUrl: productInfo.image_url || '',
            category: suggestedCategoryId || '',
          };

          const result: ScanResult = {
            type: 'online',
            data: productInfo,
            params: paramsForManualEntry
          };

          barcodeCache.current.set(data, { timestamp: now, result });
          onProductFound(result, data);
          return;
        }
      }

      // Both searches failed
      const supabaseError = supabaseResult.status === 'rejected' ? supabaseResult.reason?.message : null;
      const offError = offResult.status === 'rejected' ? 'Prodotto non trovato online' : null;

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
