// useOpenFoodFactsApi.ts — useOpenFoodFactsApi module.
//
// exports: useOpenFoodFactsApi
// used_by: hooks\useBarcodeScanner.ts
// rules:   This module is a stateless React hook that wraps the Open Food Facts API; it must not introduce any local state or side effects beyond the fetch logic.
//          Transient failures (network, timeout, HTTP errors) are retried once; ProductNotFoundError is never retried.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: retry singolo su errori transitori di OFF

import { useCallback } from 'react';

export class ProductNotFoundError extends Error {
  readonly code = 'product_not_found';
}
import { OpenFoodFactsProduct } from '@/types/api';

// Timeout per singolo tentativo: con un retry il caso peggiore resta ~17s (prima 15s con un solo tentativo)
const API_TIMEOUT = 8000;
const MAX_ATTEMPTS = 2;
const RETRY_DELAY = 1000;

interface OpenFoodFactsResponse {
  status: number;
  product?: OpenFoodFactsProduct;
}

function fetchProductOnce(barcode: string): Promise<OpenFoodFactsProduct> {
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
              reject(response.status === 404
                ? new ProductNotFoundError('Product not found')
                : new Error(`Open Food Facts HTTP ${response.status}`));
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
              reject(new ProductNotFoundError('Product not found'));
              return;
            }
            // Aggiungi il barcode al product (l'API lo restituisce come 'code' nella response principale)
            const productWithBarcode: OpenFoodFactsProduct = {
              ...jsonResponse.product,
              barcode: barcode, // Il barcode è il parametro della funzione
            };
            resolve(productWithBarcode);
          })
          .catch(error => {
            reject(error);
          });
      } catch (error) {
        reject(error);
      }
    });
}

export function useOpenFoodFactsApi() {
  const fetchProduct = useCallback(async (barcode: string): Promise<OpenFoodFactsProduct> => {
    for (let attempt = 1; ; attempt++) {
      try {
        return await fetchProductOnce(barcode);
      } catch (error) {
        // "Prodotto non trovato" è una risposta definitiva: ritentare non serve
        if (error instanceof ProductNotFoundError || attempt >= MAX_ATTEMPTS) throw error;
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }, []);

  return { fetchProduct };
}
