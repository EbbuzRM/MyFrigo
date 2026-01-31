/**
 * useHistoryData Hook
 * @module hooks/useHistoryData
 * @description Hook personalizzato per gestire il caricamento e la gestione dei dati della cronologia prodotti.
 * Include throttling, timeout handling e gestione degli errori.
 */

import { useState, useCallback, useRef } from 'react';
import { Product } from '@/types/Product';
import { UseHistoryDataReturn } from '@/types/history';
import { ProductStorage } from '@/services/ProductStorage';
import { LoggingService } from '@/services/LoggingService';

/**
 * Timeout di caricamento in millisecondi (15 secondi)
 */
const LOADING_TIMEOUT = 15000;

/**
 * Tempo di throttling tra caricamenti in millisecondi (5 secondi)
 */
const THROTTLE_TIME = 5000;

/**
 * Hook per gestire il caricamento dei dati della cronologia
 * @returns Stato e funzioni per gestire i dati della cronologia
 */
export function useHistoryData(): UseHistoryDataReturn {
  const [allHistory, setAllHistory] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Riferimenti per timeout e throttling
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLoadTimeRef = useRef<number>(0);
  const dataLoadedRef = useRef<boolean>(false);

  /**
   * Carica i dati della cronologia dai servizi
   * @param forceRefresh - Se true, ignora il throttling
   */
  const loadData = useCallback(async (forceRefresh = false): Promise<void> => {
    const now = Date.now();
    
    // Verifica throttling
    if (!forceRefresh && now - lastLoadTimeRef.current < THROTTLE_TIME) {
      LoggingService.info('History', 'Throttling data load - skipped');
      setRefreshing(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Pulisci timeout precedente
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Imposta timeout per evitare caricamenti infiniti
    timeoutRef.current = setTimeout(() => {
      if (loading) {
        LoggingService.error('History', 'Loading timeout reached');
        setLoading(false);
        setError('Caricamento troppo lungo, riprova più tardi');
        setRefreshing(false);
      }
    }, LOADING_TIMEOUT);

    LoggingService.info('History', 'Starting data load');

    try {
      // Carica tutti i tipi di prodotti in parallelo
      const [consumedResult, expiredResult, trulyExpiredResult] = await Promise.all([
        ProductStorage.getHistory(),
        ProductStorage.getExpiredProducts(),
        ProductStorage.getTrulyExpiredProducts(),
      ]);

      // Estrai i dati dai risultati o usa array vuoti in caso di errore
      const consumedProducts = consumedResult.success ? (consumedResult.data ?? []) : [];
      const activeExpiredProducts = expiredResult.success ? (expiredResult.data ?? []) : [];
      const trulyExpiredProducts = trulyExpiredResult.success ? (trulyExpiredResult.data ?? []) : [];

      // Combina tutti i prodotti
      const combinedHistory = [...consumedProducts, ...activeExpiredProducts, ...trulyExpiredProducts];

      // Ordina per data (più recente prima)
      combinedHistory.sort((a, b) => {
        const dateA = new Date(a.consumedDate || a.expirationDate).getTime();
        const dateB = new Date(b.consumedDate || b.expirationDate).getTime();
        return dateB - dateA;
      });

      setAllHistory(combinedHistory);
      LoggingService.info('History', `Loaded ${combinedHistory.length} history items`);
      lastLoadTimeRef.current = now;

    } catch (err) {
      LoggingService.error('History', 'Failed to load history:', err);
      setAllHistory([]);
      setError('Errore durante il caricamento dei dati');
    } finally {
      // Pulisci timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading]);

  /**
   * Cleanup function per pulire il timeout
   */
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    allHistory,
    loading,
    error,
    refreshing,
    loadData,
    setRefreshing,
    cleanup,
    dataLoadedRef,
    lastLoadTimeRef,
  } as UseHistoryDataReturn & { 
    cleanup: () => void;
    dataLoadedRef: React.MutableRefObject<boolean>;
    lastLoadTimeRef: React.MutableRefObject<number>;
  };
}
