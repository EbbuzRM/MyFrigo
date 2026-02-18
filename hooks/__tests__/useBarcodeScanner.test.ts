/**
 * Test per le funzioni helper di estrazione dati da Open Food Facts.
 * Verificano i fallback per product_name, brands e image_url.
 */

// Mock delle dipendenze
jest.mock('react-native-url-polyfill/auto');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@supabase/supabase-js');
jest.mock('expo-camera', () => ({
    useCameraPermissions: jest.fn(() => [null, jest.fn()]),
}));
jest.mock('@/services/TemplateService', () => ({
    TemplateService: { getProductTemplate: jest.fn() },
}));
jest.mock('@/services/CategoryMatcher', () => ({
    CategoryMatcher: { mapOpenFoodFactsCategories: jest.fn() },
}));
jest.mock('@/services/LoggingService', () => ({
    LoggingService: {
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
    },
}));

import { extractProductName, extractBrand, extractImageUrl } from '../useBarcodeScanner';

// ─── extractProductName ──────────────────────────────────────

describe('extractProductName', () => {
    it('dovrebbe restituire product_name se presente', () => {
        expect(extractProductName({ product_name: 'Pasta Barilla' })).toBe('Pasta Barilla');
    });

    it('dovrebbe fare fallback a product_name_it quando product_name è vuoto', () => {
        expect(extractProductName({ product_name: '', product_name_it: 'Pasta De Cecco' })).toBe('Pasta De Cecco');
    });

    it('dovrebbe fare fallback a product_name_it quando product_name è undefined', () => {
        expect(extractProductName({ product_name_it: 'Mozzarella di Bufala' })).toBe('Mozzarella di Bufala');
    });

    it('dovrebbe restituire stringa vuota quando nessun campo è presente', () => {
        expect(extractProductName({})).toBe('');
    });

    it('dovrebbe preferire product_name a product_name_it', () => {
        expect(extractProductName({ product_name: 'Generic', product_name_it: 'Italiano' })).toBe('Generic');
    });

    it('dovrebbe fare fallback a generic_name_it quando product_name e product_name_it sono assenti', () => {
        expect(extractProductName({ generic_name_it: 'Prodotto Generico IT' })).toBe('Prodotto Generico IT');
    });

    it('dovrebbe fare fallback a generic_name quando anche generic_name_it è assente', () => {
        expect(extractProductName({ generic_name: 'Generic Product' })).toBe('Generic Product');
    });

    it('dovrebbe fare fallback a abbreviated_product_name come ultima risorsa', () => {
        expect(extractProductName({ abbreviated_product_name: 'Abbr. Name' })).toBe('Abbr. Name');
    });
});

// ─── extractBrand ────────────────────────────────────────────

describe('extractBrand', () => {
    it('dovrebbe restituire brands se presente', () => {
        expect(extractBrand({ brands: 'Barilla' })).toBe('Barilla');
    });

    it('dovrebbe fare fallback a brands_tags[0] quando brands è vuoto', () => {
        expect(extractBrand({ brands: '', brands_tags: ['De Cecco'] })).toBe('De Cecco');
    });

    it('dovrebbe fare fallback a brands_tags[0] quando brands è undefined', () => {
        expect(extractBrand({ brands_tags: ['Mulino Bianco'] })).toBe('Mulino Bianco');
    });

    it('dovrebbe restituire stringa vuota quando nessun campo è presente', () => {
        expect(extractBrand({})).toBe('');
    });

    it('dovrebbe restituire stringa vuota quando brands_tags è un array vuoto', () => {
        expect(extractBrand({ brands_tags: [] })).toBe('');
    });

    it('dovrebbe preferire brands a brands_tags', () => {
        expect(extractBrand({ brands: 'Barilla', brands_tags: ['Altro'] })).toBe('Barilla');
    });
});

// ─── extractImageUrl ─────────────────────────────────────────

describe('extractImageUrl', () => {
    it('dovrebbe restituire image_url se presente', () => {
        expect(extractImageUrl({ image_url: 'https://img.off/1.jpg' })).toBe('https://img.off/1.jpg');
    });

    it('dovrebbe fare fallback a image_front_url quando image_url è vuoto', () => {
        expect(extractImageUrl({ image_url: '', image_front_url: 'https://img.off/front.jpg' }))
            .toBe('https://img.off/front.jpg');
    });

    it('dovrebbe fare fallback a image_front_url quando image_url è undefined', () => {
        expect(extractImageUrl({ image_front_url: 'https://img.off/front.jpg' }))
            .toBe('https://img.off/front.jpg');
    });

    it('dovrebbe fare fallback a image_front_small_url come ultima risorsa', () => {
        expect(extractImageUrl({ image_front_small_url: 'https://img.off/small.jpg' }))
            .toBe('https://img.off/small.jpg');
    });

    it('dovrebbe restituire stringa vuota quando nessun campo è presente', () => {
        expect(extractImageUrl({})).toBe('');
    });

    it('dovrebbe rispettare la priorità: image_url > image_front_url > image_front_small_url', () => {
        expect(extractImageUrl({
            image_url: 'https://img.off/1.jpg',
            image_front_url: 'https://img.off/front.jpg',
            image_front_small_url: 'https://img.off/small.jpg',
        })).toBe('https://img.off/1.jpg');
    });
});
