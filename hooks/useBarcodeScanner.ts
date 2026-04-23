import { useState, useEffect, useRef, useCallback } from 'react';
import { useCameraPermissions, PermissionResponse } from 'expo-camera';
import { CategoryMatcher } from '@/services/CategoryMatcher';
import { ProductCategory, Product } from '@/types/Product';
import { LoggingService } from '@/services/LoggingService';
import { OpenFoodFactsProduct } from '@/types/api';
import { useBarcodeCache } from './barcode/useBarcodeCache';
import { useOpenFoodFactsApi } from './barcode/useOpenFoodFactsApi';
import { useLocalDatabaseLookup } from './barcode/useLocalDatabaseLookup';

const MIN_OVERLAP_PERCENTAGE = 0.1;
const DEBUG_SCANNER = __DEV__;

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

export const extractProductName = (product: OpenFoodFactsProduct): string => {
  return product.product_name || product.product_name_it || product.generic_name_it || product.generic_name || product.abbreviated_product_name || '';
};

export const extractBrand = (product: OpenFoodFactsProduct): string => {
  return product.brands || (product.brands_tags?.length ? product.brands_tags[0] : '');
};

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

  const { get: getCache, set: setCache } = useBarcodeCache();
  const { fetchProduct: fetchOFF } = useOpenFoodFactsApi();
  const { fetchProductFromSupabase: fetchSupabase } = useLocalDatabaseLookup();

  const clearApiTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
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

    LoggingService.info('BarcodeScanner', `Scanning barcode: ${data}`);

    const cachedResult = getCache(data);
    if (cachedResult) {
      if (DEBUG_SCANNER) {
        LoggingService.debug('BarcodeScanner', `Cache hit for ${data}`);
      }
      onProductFound(cachedResult, data);
      return;
    }

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
        fetchSupabase(data),
        fetchOFF(data)
      ]);

      const totalTime = Date.now() - startTime;

      if (supabaseResult.status === 'fulfilled' && supabaseResult.value) {
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

        setCache(data, result);
        LoggingService.info('BarcodeScanner', `Found template: ${supabaseResult.value.name} (${totalTime}ms)`);
        onProductFound(result, data);
        return;
      }

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

          setCache(data, result);
          LoggingService.info('BarcodeScanner', `Found online: ${extractedName} (${totalTime}ms)`);
          onProductFound(result, data);
          return;
        }
      }

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

      if (errorMessage.includes('Prodotto non trovato') || errorMessage.includes('Errore HTTP: 404')) {
        const result: ScanResult = {
          type: 'not_found',
          params: paramsForManualEntry
        };

        setCache(data, result);
        onProductFound(result, data);
      } else {
        setLoadingError(`Errore: ${errorMessage}. Riprova o inserisci manualmente.`);
      }
    } finally {
      setIsLoading(false);
      clearApiTimeout();
    }
  }, [appCategories, clearApiTimeout, fetchSupabase, fetchOFF, onProductFound, getCache, setCache]);

  const resetScanner = useCallback(() => {
    setScanned(false);
    setIsLoading(false);
    setLoadingError(null);
    clearApiTimeout();
  }, [clearApiTimeout]);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    return () => {
      clearApiTimeout();
    };
  }, [clearApiTimeout]);

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
