import { useState, useCallback } from 'react';
import { ProductStorage } from '@/services/ProductStorage';
import { LoggingService } from '@/services/LoggingService';

/**
 * Result interface for useProductRefresh hook
 */
export interface UseProductRefreshResult {
  /** Whether refresh is in progress */
  refreshing: boolean;
  /** Last refresh timestamp */
  lastRefreshTimestamp: number;
  /** Set refresh timestamp manually */
  setLastRefreshTimestamp: (timestamp: number) => void;
  /** Callback to trigger manual refresh */
  onRefresh: () => Promise<void>;
  /** Check if auto-refresh should occur (2 minutes threshold) */
  shouldAutoRefresh: () => boolean;
  /** Move expired products to history */
  moveExpiredToHistory: () => Promise<void>;
  /** Callback to refresh products from context */
  refreshProducts: () => Promise<void>;
}

/**
 * Parameters for useProductRefresh hook
 */
export interface UseProductRefreshParams {
  /** Callback to refresh products from ProductContext */
  refreshProductsFromContext: () => Promise<void>;
}

/**
 * Auto-refresh interval in milliseconds (2 minutes)
 */
const AUTO_REFRESH_INTERVAL = 120000;

/**
 * Custom hook for managing product refresh functionality
 * Handles pull-to-refresh, auto-refresh logic, and moving expired products
 * 
 * @param params - Hook parameters
 * @returns Refresh state and handlers
 */
export function useProductRefresh({
  refreshProductsFromContext,
}: UseProductRefreshParams): UseProductRefreshResult {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState<number>(Date.now());

  /**
   * Checks if auto-refresh should occur based on 2 minute threshold
   */
  const shouldAutoRefresh = useCallback((): boolean => {
    const now = Date.now();
    return (now - lastRefreshTimestamp) > AUTO_REFRESH_INTERVAL;
  }, [lastRefreshTimestamp]);

  /**
   * Moves expired products to history
   */
  const moveExpiredToHistory = useCallback(async (): Promise<void> => {
    try {
      const result = await ProductStorage.getExpiredProducts();
      if (!result.success || !result.data) {
        return;
      }

      const expiredProducts = result.data;
      if (expiredProducts.length > 0) {
        const productIds = expiredProducts.map(p => p.id);
        const moveResult = await ProductStorage.moveProductsToHistory(productIds);
        if (moveResult.success) {
          LoggingService.info('useProductRefresh', 
            `Moved ${expiredProducts.length} expired products to history`);
        }
      }
    } catch (error) {
      LoggingService.error('useProductRefresh', 'Error moving expired products to history:', error);
    }
  }, []);

  /**
   * Handles manual refresh (pull-to-refresh)
   */
  const onRefresh = useCallback(async (): Promise<void> => {
    LoggingService.info('useProductRefresh', 'User triggered pull-to-refresh');
    setRefreshing(true);
    await refreshProductsFromContext();
    setLastRefreshTimestamp(Date.now());
    setRefreshing(false);
  }, [refreshProductsFromContext]);

  /**
   * Main refresh products callback
   */
  const refreshProducts = useCallback(async (): Promise<void> => {
    await refreshProductsFromContext();
  }, [refreshProductsFromContext]);

  return {
    refreshing,
    lastRefreshTimestamp,
    setLastRefreshTimestamp,
    onRefresh,
    shouldAutoRefresh,
    moveExpiredToHistory,
    refreshProducts,
  };
}
