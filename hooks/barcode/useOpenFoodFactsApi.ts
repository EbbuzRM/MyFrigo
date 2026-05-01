import { useCallback } from 'react';
import { LoggingService } from '@/services/LoggingService';
import { OpenFoodFactsProduct } from '@/types/api';

const API_TIMEOUT = 15000;

interface OpenFoodFactsResponse {
  status: number;
  product?: OpenFoodFactsProduct;
}

export function useOpenFoodFactsApi() {
  const fetchProduct = useCallback(async (barcode: string): Promise<OpenFoodFactsProduct> => {
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
              reject(new Error('Risposta API vuota'));
              return;
            }
            if (jsonResponse.status !== 1 || !jsonResponse.product) {
              reject(new Error('Prodotto non trovato nel database online'));
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
  }, []);

  return { fetchProduct };
}
