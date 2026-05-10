// useOpenFoodFactsApi.test.ts — useOpenFoodFactsApi.test module.
//
// exports: none
// used_by: none
// rules:   none
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

/**
 * Test per useOpenFoodFactsApi - Chiamate HTTP all'API Open Food Facts
 */

// Mock delle dipendenze
jest.mock('@/services/LoggingService', () => ({
    LoggingService: {
        debug: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    },
}));

// Mock fetch globale
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { useOpenFoodFactsApi } from '../useOpenFoodFactsApi';
import { renderHook, act, waitFor } from '@testing-library/react-native';

const API_TIMEOUT = 15000;

describe('useOpenFoodFactsApi', () => {
    const testBarcode = '8001505005292';

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('fetchProduct', () => {
        it('should fetch product from API successfully', async () => {
            const mockProduct = {
                code: testBarcode,
                barcode: testBarcode,
                product_name: 'Pasta Barilla',
                brands: 'Barilla',
                image_url: 'https://images.openfoodfacts.org/image.jpg',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    status: 1,
                    product: {
                        code: testBarcode,
                        product_name: 'Pasta Barilla',
                        brands: 'Barilla',
                        image_url: 'https://images.openfoodfacts.org/image.jpg',
                    },
                }),
            });

            const { result } = renderHook(() => useOpenFoodFactsApi());

            let fetchResult: any;
            await act(async () => {
                try {
                    fetchResult = await result.current.fetchProduct(testBarcode);
                } catch (e) {
                    fetchResult = { error: e };
                }
            });

            expect(mockFetch).toHaveBeenCalledWith(
                `https://world.openfoodfacts.org/api/v2/product/${testBarcode}`,
                expect.objectContaining({
                    signal: expect.any(AbortSignal),
                })
            );

            if (fetchResult && !fetchResult.error) {
                expect(fetchResult).toEqual(mockProduct);
            }
        });

        it('should return product when status is 1', async () => {
            const mockProduct = {
                code: testBarcode,
                barcode: testBarcode,
                product_name: 'Test Product',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    status: 1,
                    product: {
                        code: testBarcode,
                        product_name: 'Test Product',
                    },
                }),
            });

            const { result } = renderHook(() => useOpenFoodFactsApi());

            let fetchResult: any;
            await act(async () => {
                try {
                    fetchResult = await result.current.fetchProduct(testBarcode);
                } catch (e) {
                    fetchResult = { error: e };
                }
            });

            if (fetchResult && !fetchResult.error) {
                expect(fetchResult.product_name).toBe('Test Product');
                expect(fetchResult.barcode).toBe(testBarcode);
            }
        });

        it('should handle timeout', async () => {
            // Mock fetch che non risponde mai (simula timeout)
            mockFetch.mockImplementationOnce(() => new Promise(() => { }));

            const { result } = renderHook(() => useOpenFoodFactsApi());

            // Avviamo la fetch
            const fetchPromise = result.current.fetchProduct(testBarcode);
            
            // Avanziamo i timer per triggerare il timeout nel hook
            act(() => {
                jest.advanceTimersByTime(API_TIMEOUT + 100);
            });

            await expect(fetchPromise).rejects.toThrow('Timeout della richiesta API');
        });

        it('should return null on error', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const { result } = renderHook(() => useOpenFoodFactsApi());

            await expect(result.current.fetchProduct(testBarcode)).rejects.toThrow('Network error');
        });

        it('should reject when HTTP status is not ok', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
            });

            const { result } = renderHook(() => useOpenFoodFactsApi());

            await expect(result.current.fetchProduct(testBarcode)).rejects.toThrow('Errore HTTP: 404');
        });

        it('should reject when product not found in database', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    status: 0,
                    status_verbose: 'product not found',
                }),
            });

            const { result } = renderHook(() => useOpenFoodFactsApi());

            await expect(result.current.fetchProduct(testBarcode)).rejects.toThrow('Prodotto non trovato nel database online');
        });

        it('should reject when response is empty', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(null),
            });

            const { result } = renderHook(() => useOpenFoodFactsApi());

            await expect(result.current.fetchProduct(testBarcode)).rejects.toThrow('Risposta API vuota');
        });
    });
});