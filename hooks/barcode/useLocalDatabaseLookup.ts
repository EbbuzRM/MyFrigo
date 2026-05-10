// useLocalDatabaseLookup.ts — useLocalDatabaseLookup module.
//
// exports: useLocalDatabaseLookup
// used_by: hooks\useBarcodeScanner.ts
// rules:   The module implements a timeout pattern for database lookups; any new async operations added must maintain consistent timeout handling and error fallback behavior. The function returns `Partial<Product> | null` exclusively — all code paths must preserve this return type contract.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { useCallback } from 'react';
import { TemplateService } from '@/services/TemplateService';
import { Product } from '@/types/Product';
import { LoggingService } from '@/services/LoggingService';

export function useLocalDatabaseLookup() {
  const fetchProductFromSupabase = useCallback(async (barcode: string): Promise<Partial<Product> | null> => {
    try {
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout database locale')), 2000);
      });

      const templatePromise = TemplateService.getProductTemplate(barcode);
      const template = await Promise.race([templatePromise, timeoutPromise]);
      
      if (__DEV__ && template) {
        LoggingService.debug('BarcodeScanner', `Template found: ${template.name}`);
      }
      return template;
    } catch (error) {
      if (__DEV__) {
        LoggingService.debug('BarcodeScanner', `Local DB error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
      return null;
    }
  }, []);

  return { fetchProductFromSupabase };
}
