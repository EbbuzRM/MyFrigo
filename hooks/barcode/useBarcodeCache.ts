import { useRef, useEffect, useCallback } from 'react';
import { LoggingService } from '@/services/LoggingService';
import { ScanResult } from '../useBarcodeScanner';

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

interface CachedEntry {
  timestamp: number;
  result: ScanResult;
}

export function useBarcodeCache() {
  const barcodeCache = useRef<Map<string, CachedEntry>>(new Map());

  const get = useCallback((barcode: string) => {
    const entry = barcodeCache.current.get(barcode);
    if (entry && (Date.now() - entry.timestamp) < CACHE_DURATION) {
      return entry.result;
    }
    return null;
  }, []);

  const set = useCallback((barcode: string, result: ScanResult) => {
    barcodeCache.current.set(barcode, {
      timestamp: Date.now(),
      result,
    });
  }, []);

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
        LoggingService.debug('BarcodeScanner', `Cache cleanup: removed ${removedCount} expired entries`);
      }
    };

    const intervalId = setInterval(cleanupCache, CACHE_CLEANUP_INTERVAL);
    return () => clearInterval(intervalId);
  }, []);

  return { get, set };
}
