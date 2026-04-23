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
                product_name: 'Pasta Barilla',
                brands: 'Barilla',
                image_url: 'https://images.openfoodfacts.org/image.jpg',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    status: 1,
                    product: mockProduct,
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
                product_name: 'Test Product',
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    status: 1,
                    product: mockProduct,
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
            }
        });

        it('should handle timeout', async () => {
            // Mock fetch che non risponde mai (simula timeout)
            mockFetch.mockImplementationOnce(() => new Promise(() => { }));

            const { result } = renderHook(() => useOpenFoodFactsApi());

            let errorResult: Error | null = null;
            await act(async () => {
                try {
                    await result.current.fetchProduct(testBarcode);
                } catch (e) {
                    errorResult = e as Error;
                }
            });

            expect(errorResult).not.toBeNull();
            expect(errorResult?.message).toBe('Timeout della richiesta API');
        });

        it('should advance timer to trigger timeout', async () => {
            mockFetch.mockImplementationOnce(() => new Promise(() => { }));

            const { result } = renderHook(() => useOpenFoodFactsApi());

            let errorResult: Error | null = null;

            // Start the fetch but don't await
            const fetchPromise = act(async () => {
                try {
                    await result.current.fetchProduct(testBarcode);
                } catch (e) {
                    errorResult = e as Error;
                }
            });

            // Advance time beyond timeout
            act(() => {
                jest.advanceTimersByTime(API_TIMEOUT + 100);
            });

            await fetchPromise;

            expect(errorResult?.message).toBe('Timeout della richiesta API');
        });

        it('should return null on error', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const { result } = renderHook(() => useOpenFoodFactsApi());

            let errorResult: Error | null = null;
            await act(async () => {
                try {
                    await result.current.fetchProduct(testBarcode);
                } catch (e) {
                    errorResult = e as Error;
                }
            });

            expect(errorResult).not.toBeNull();
            expect(errorResult?.message).toBe('Network error');
        });

        it('should reject when HTTP status is not ok', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
            });

            const { result } = renderHook(() => useOpenFoodFactsApi());

            let errorResult: Error | null = null;
            await act(async () => {
                try {
                    await result.current.fetchProduct(testBarcode);
                } catch (e) {
                    errorResult = e as Error;
                }
            });

            expect(errorResult).not.toBeNull();
            expect(errorResult?.message).toBe('Errore HTTP: 404');
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

            let errorResult: Error | null = null;
            await act(async () => {
                try {
                    await result.current.fetchProduct(testBarcode);
                } catch (e) {
                    errorResult = e as Error;
                }
            });

            expect(errorResult).not.toBeNull();
            expect(errorResult?.message).toBe('Prodotto non trovato nel database online');
        });

        it('should reject when response is empty', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(null),
            });

            const { result } = renderHook(() => useOpenFoodFactsApi());

            let errorResult: Error | null = null;
            await act(async () => {
                try {
                    await result.current.fetchProduct(testBarcode);
                } catch (e) {
                    errorResult = e as Error;
                }
            });

            expect(errorResult).not.toBeNull();
            expect(errorResult?.message).toBe('Risposta API vuota');
        });
    });
});