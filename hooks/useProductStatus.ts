import { useMemo, useCallback } from 'react';
import { LoggingService } from '@/services/LoggingService';
import { useExpirationStatus as useBaseExpirationStatus } from '@/hooks/useExpirationStatus';

/**
 * @hook useProductStatus
 * @description Hook that safely parses expiration date and determines product status.
 * Combines safe date parsing with expiration status calculation.
 * @param {string | undefined} expirationDate - Raw expiration date string
 * @param {boolean} isDarkMode - Current dark mode state
 * @param {boolean} [isFrozen] - Whether the product is frozen
 * @returns {{ 
 *   safeExpirationDate: Date | null, 
 *   expirationInfo: { text: string, color: string, backgroundColor: string },
 *   formattedExpirationDate: string,
 *   formattedPurchaseDate: (date: string | undefined) => string 
 * }}
 */
export function useProductStatus(
  expirationDate: string | undefined,
  isDarkMode: boolean,
  isFrozen?: boolean
) {
  const safeExpirationDate = useMemo(() => {
    if (!expirationDate) return null;

    try {
      const date = new Date(expirationDate);
      if (isNaN(date.getTime())) {
        LoggingService.warning('useProductStatus', `Invalid expiration date: ${expirationDate}`);
        return null;
      }
      return date;
    } catch (error) {
      LoggingService.error('useProductStatus', `Error parsing expiration date: ${expirationDate}`, error);
      return null;
    }
  }, [expirationDate]);

  const expirationInfo = useBaseExpirationStatus(
    safeExpirationDate ? safeExpirationDate.toISOString() : undefined,
    isDarkMode,
    isFrozen
  );

  const formatDate = useCallback((date: Date | null): string => {
    if (!date || isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('it-IT');
  }, []);

  const formattedExpirationDate = formatDate(safeExpirationDate);

  const formattedPurchaseDate = useCallback((purchaseDate: string | undefined): string => {
    if (!purchaseDate) return 'N/A';
    try {
      const date = new Date(purchaseDate);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('it-IT');
    } catch {
      return 'N/A';
    }
  }, []);

  return {
    safeExpirationDate,
    expirationInfo,
    formattedExpirationDate,
    formattedPurchaseDate,
  };
}
