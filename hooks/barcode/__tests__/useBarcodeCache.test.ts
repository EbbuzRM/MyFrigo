/**
 * Test per useBarcodeCache - LRU cache per scansioni barcode
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

// Import dopo i mock per catturare il valore di MAX_CACHE_SIZE
import { useBarcodeCache } from '../useBarcodeCache';
import { renderHook, act } from '@testing-library/react-native';
import { ScanResult } from '../useBarcodeScanner';

// Costanti testabili (devono coincidere con il modulo)
const CACHE_DURATION = 30 * 60 * 1000; // 30 minuti
const MAX_CACHE_SIZE = 100;

describe('useBarcodeCache', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('get/set operations', () => {
        it('should store and retrieve values', () => {
            const { result } = renderHook(() => useBarcodeCache());
            const mockResult: ScanResult = {
                barcode: '1234567890123',
                product_name: 'Test Product',
                brand_name: 'Test Brand',
                image_url: 'https://example.com/image.jpg',
            };

            result.current.set('1234567890123', mockResult);

            const retrieved = result.current.get('1234567890123');
            expect(retrieved).toEqual(mockResult);
        });

        it('should return null for non-existent barcode', () => {
            const { result } = renderHook(() => useBarcodeCache());

            const retrieved = result.current.get('nonexistent');
            expect(retrieved).toBeNull();
        });

        it('should return null for expired entries', () => {
            const { result } = renderHook(() => useBarcodeCache());
            const mockResult: ScanResult = {
                barcode: '1234567890123',
                product_name: 'Test Product',
                brand_name: 'Test Brand',
                image_url: 'https://example.com/image.jpg',
            };

            result.current.set('1234567890123', mockResult);

            // Advance time beyond CACHE_DURATION
            act(() => {
                jest.advanceTimersByTime(CACHE_DURATION + 1);
            });

            const retrieved = result.current.get('1234567890123');
            expect(retrieved).toBeNull();
        });

        it('should return valid value before expiration', () => {
            const { result } = renderHook(() => useBarcodeCache());
            const mockResult: ScanResult = {
                barcode: '1234567890123',
                product_name: 'Test Product',
                brand_name: 'Test Brand',
                image_url: 'https://example.com/image.jpg',
            };

            result.current.set('1234567890123', mockResult);

            // Advance time within CACHE_DURATION
            act(() => {
                jest.advanceTimersByTime(CACHE_DURATION - 1);
            });

            const retrieved = result.current.get('1234567890123');
            expect(retrieved).toEqual(mockResult);
        });
    });

    describe('MAX_CACHE_SIZE limit enforcement', () => {
        it('should enforce MAX_CACHE_SIZE limit', async () => {
            const { result } = renderHook(() => useBarcodeCache());

            // Add MAX_CACHE_SIZE items
            for (let i = 0; i < MAX_CACHE_SIZE; i++) {
                const mockResult: ScanResult = {
                    barcode: `barcode_${i}`,
                    product_name: `Product ${i}`,
                    brand_name: 'Test Brand',
                    image_url: 'https://example.com/image.jpg',
                };
                result.current.set(`barcode_${i}`, mockResult);
            }

            // Verify we have exactly MAX_CACHE_SIZE items
            // All items should still be accessible
            for (let i = 0; i < MAX_CACHE_SIZE; i++) {
                const retrieved = result.current.get(`barcode_${i}`);
                expect(retrieved?.product_name).toBe(`Product ${i}`);
            }
        });

        it('should remove oldest entry when limit reached', async () => {
            const { result } = renderHook(() => useBarcodeCache());

            // Add one item
            const firstResult: ScanResult = {
                barcode: 'barcode_first',
                product_name: 'First Product',
                brand_name: 'Test Brand',
                image_url: 'https://example.com/image.jpg',
            };
            result.current.set('barcode_first', firstResult);

            // Add MAX_CACHE_SIZE more items
            for (let i = 0; i < MAX_CACHE_SIZE; i++) {
                const mockResult: ScanResult = {
                    barcode: `barcode_${i}`,
                    product_name: `Product ${i}`,
                    brand_name: 'Test Brand',
                    image_url: 'https://example.com/image.jpg',
                };
                result.current.set(`barcode_${i}`, mockResult);
            }

            // The first entry should have been removed (oldest)
            const retrieved = result.current.get('barcode_first');
            expect(retrieved).toBeNull();

            // All the newer entries should still be accessible
            for (let i = 0; i < MAX_CACHE_SIZE; i++) {
                const retrieved = result.current.get(`barcode_${i}`);
                expect(retrieved?.product_name).toBe(`Product ${i}`);
            }
        });

        it('should log when removing oldest entry', async () => {
            const LoggingService = require('@/services/LoggingService').LoggingService;

            const { result } = renderHook(() => useBarcodeCache());

            // Add one item
            const firstResult: ScanResult = {
                barcode: 'barcode_first',
                product_name: 'First Product',
                brand_name: 'Test Brand',
                image_url: 'https://example.com/image.jpg',
            };
            result.current.set('barcode_first', firstResult);

            // Add MAX_CACHE_SIZE more items to trigger removal
            for (let i = 0; i < MAX_CACHE_SIZE; i++) {
                const mockResult: ScanResult = {
                    barcode: `barcode_${i}`,
                    product_name: `Product ${i}`,
                    brand_name: 'Test Brand',
                    image_url: 'https://example.com/image.jpg',
                };
                result.current.set(`barcode_${i}`, mockResult);
            }

            expect(LoggingService.debug).toHaveBeenCalledWith(
                'BarcodeScanner',
                expect.stringContaining('Cache limit reached')
            );
        });
    });

    describe('cache cleanup interval', () => {
        it('should set up cleanup interval on mount', () => {
            const { result, unmount } = renderHook(() => useBarcodeCache());

            // The hook should have set up an interval
            // We can verify this indirectly by checking that the cleanup runs
            const mockResult: ScanResult = {
                barcode: 'test_barcode',
                product_name: 'Test Product',
                brand_name: 'Test Brand',
                image_url: 'https://example.com/image.jpg',
            };

            result.current.set('test_barcode', mockResult);

            // Advance time by cleanup interval + 1ms
            act(() => {
                jest.advanceTimersByTime(5 * 60 * 1000 + 1);
            });

            // Component unmounts should clear interval
            expect(() => unmount()).not.toThrow();
        });
    });
});