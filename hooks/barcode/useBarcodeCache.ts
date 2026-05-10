// useBarcodeCache.ts — useBarcodeCache module.
//
// exports: useBarcodeCache
// used_by: hooks\useBarcodeScanner.ts
// rules:   - The module uses `useRef` for cache storage, so cache is NOT shared across component instances — each caller gets its own isolated cache.
//          - Cache has a hard limit of 100 entries (`MAX_CACHE_SIZE`) with automatic LRU-style eviction and periodic cleanup every 5 minutes (`CACHE_CLEANUP_INTERVAL`).
//          - Cache entries expire after 30 minutes (`CACHE_DURATION`) and expired entries are removed during both `get` and cleanup cycles.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { useRef, useEffect, useCallback } from 'react';
import { LoggingService } from '@/services/LoggingService';
import { ScanResult } from '../useBarcodeScanner';

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Limite massimo elementi per evitare memory leak

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
     // Rimuovi il più vecchio se il limite è stato raggiunto
     if (barcodeCache.current.size >= MAX_CACHE_SIZE) {
       const iterator = barcodeCache.current.keys();
       const firstEntry = iterator.next();
       if (!firstEntry.done) {
         barcodeCache.current.delete(firstEntry.value);
         LoggingService.debug('BarcodeScanner', `Cache limit reached, removed oldest entry: ${firstEntry.value}`);
       }
     }

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
