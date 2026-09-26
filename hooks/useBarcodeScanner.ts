// useBarcodeScanner.ts — useBarcodeScanner module.
//
// exports: ScanResult | UseBarcodeScannerReturn | useBarcodeScanner
// used_by: app\__tests__\scanner.test.tsx
//                   app\scanner.tsx
// rules:   - All scanner hooks (useBarcodeCache, useOpenFoodFactsApi, useLocalDatabaseLookup) must be consumed through this module's exports only, never directly imported in other files
//          - The ScanResult interface defines the canonical return type; all scan resolution paths must produce a result conforming to this interface without adding custom properties
//          - Camera permission management is exclusively handled through this hook; no other module should request or manage camera permissions independently
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCameraPermissions, PermissionResponse } from 'expo-camera';
import { CategoryMatcher } from '@/services/CategoryMatcher';
import { ProductCategory, Product } from '@/types/Product';
import { LoggingService } from '@/services/LoggingService';
import { OpenFoodFactsProduct } from '@/types/api';
import { useBarcodeCache } from './barcode/useBarcodeCache';
import { ProductNotFoundError, useOpenFoodFactsApi } from './barcode/useOpenFoodFactsApi';
import { useLocalDatabaseLookup } from './barcode/useLocalDatabaseLookup';
import { getCurrentLanguage } from '@/i18n';
import type { SupportedLanguage } from '@/i18n/types';

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
  type?: 'template' | 'online' | 'not_found';
  data?: Partial<Product> | OpenFoodFactsProduct;
  params?: Partial<Product> & { barcodeType?: string; addedMethod?: string };
  error?: string;
  // Proprietà comuni per accesso rapido (derivate da data)
  barcode?: string;
  product_name?: string;
  brand_name?: string;
  image_url?: string;
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

const extractProductName = (product: OpenFoodFactsProduct, language: SupportedLanguage = 'it'): string => {
  const activeName = language === 'it' ? product.product_name_it : product.product_name_en;
  const activeGeneric = language === 'it' ? product.generic_name_it : product.generic_name_en;
  const otherName = language === 'it' ? product.product_name_en : product.product_name_it;
  const otherGeneric = language === 'it' ? product.generic_name_en : product.generic_name_it;
  return activeName || activeGeneric || product.generic_name || otherName || otherGeneric || product.product_name || product.abbreviated_product_name || '';
};

const extractBrand = (product: OpenFoodFactsProduct): string => {
  return product.brands || (product.brands_tags?.length ? product.brands_tags[0] : '');
};

const extractImageUrl = (product: OpenFoodFactsProduct): string => {
  const imageUrl = product.image_front_small_url || product.image_front_url || product.image_url || '';
  return /^https?:\/\//i.test(imageUrl) ? imageUrl : '';
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
  const [loadingProgress, setLoadingProgress] = useState<string>('initializing');
  const [currentBarcode, setCurrentBarcode] = useState<string | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const onProductFoundRef = useRef(onProductFound);
  onProductFoundRef.current = onProductFound;

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

    LoggingService.info('BarcodeScanner', `Scanning barcode: ${data}`);

    const language = getCurrentLanguage();
    const cacheKey = `${language}:${data}`;
    const cachedResult = getCache(cacheKey);
    if (cachedResult) {
      if (DEBUG_SCANNER) {
        LoggingService.debug('BarcodeScanner', `Cache hit for ${data}`);
      }
      onProductFoundRef.current(cachedResult, data);
      return;
    }

    if (!isBarcodeInFrame(bounds, frameLayout)) {
      LoggingService.warning('BarcodeScanner', '⚠️ Barcode fuori dal frame, ignoro scansione');
      return;
    }

    LoggingService.info('BarcodeScanner', '✅ Barcode valido e nel frame, procedo...');

    setScanned(true);
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setLoadingError(null);
    setCurrentBarcode(data);
    setLoadingProgress('initializing');

    let paramsForManualEntry: Partial<Product> & { barcodeType?: string; addedMethod?: string } = {
      barcode: data,
      barcodeType: type,
      addedMethod: 'barcode'
    };

    try {
      setLoadingProgress('searching');

      const [supabaseResult, offResult] = await Promise.allSettled([
        fetchSupabase(data),
        fetchOFF(data)
      ]);
      if (requestId !== requestIdRef.current) return;
      const deliveryLanguage = getCurrentLanguage();
      const deliveryCacheKey = `${deliveryLanguage}:${data}`;

      const totalTime = Date.now() - startTime;

      if (supabaseResult.status === 'fulfilled' && supabaseResult.value) {
        const offProduct = offResult.status === 'fulfilled' ? offResult.value : null;
        const offImageUrl = offProduct && typeof offProduct === 'object'
          ? extractImageUrl(offProduct)
          : '';

        paramsForManualEntry = {
          ...paramsForManualEntry,
          name: supabaseResult.value.name || '',
          brand: supabaseResult.value.brand || '',
          category: supabaseResult.value.category || '',
          imageUrl: offImageUrl || supabaseResult.value.imageUrl || '',
        };

        const result: ScanResult = {
          type: 'template',
          data: supabaseResult.value,
          params: paramsForManualEntry
        };

        setCache(deliveryCacheKey, result);
        LoggingService.info('BarcodeScanner', `Found template: ${supabaseResult.value.name} (${totalTime}ms)`);
        setCurrentBarcode(null);
        onProductFoundRef.current(result, data);
        return;
      }

      if (offResult.status === 'fulfilled') {
        const productInfo = offResult.value;
        if (productInfo && typeof productInfo === 'object') {
          const suggestedCategoryId = mapOffCategoryToAppCategory(productInfo.categories_tags, appCategories);
          const extractedName = extractProductName(productInfo, deliveryLanguage);
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

          setCache(deliveryCacheKey, result);
          LoggingService.info('BarcodeScanner', `Found online: ${extractedName} (${totalTime}ms)`);
          setCurrentBarcode(null);
          onProductFoundRef.current(result, data);
          return;
        }
      }

      if (offResult.status === 'fulfilled' ||
          (offResult.status === 'rejected' && offResult.reason instanceof ProductNotFoundError)) {
        const result: ScanResult = { type: 'not_found', params: paramsForManualEntry };
        setCache(deliveryCacheKey, result);
        setCurrentBarcode(null);
        onProductFoundRef.current(result, data);
        return;
      }

      throw offResult.status === 'rejected' ? offResult.reason : new Error('Barcode lookup failed');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      LoggingService.error('BarcodeScanner', `Scan error: ${errorMessage}`, error);

      if (requestId === requestIdRef.current) setLoadingError('lookup_failed');
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        clearApiTimeout();
      }
    }
  }, [appCategories, clearApiTimeout, fetchSupabase, fetchOFF, getCache, setCache]);

  const resetScanner = useCallback(() => {
    requestIdRef.current += 1;
    setScanned(false);
    setIsLoading(false);
    setCurrentBarcode(null);
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
      requestIdRef.current += 1;
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

// Re-export for testing only
export const __testing = {
  extractProductName,
  extractBrand,
  extractImageUrl,
};
