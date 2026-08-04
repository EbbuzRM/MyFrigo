// useBarcodeScanner.test.ts — useBarcodeScanner.test module.
//
// exports: none
// used_by: none
// rules:   none
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

/**
 * Test completo per useBarcodeScanner hook e handleBarCodeScanned.
 * Include test per helper functions e logica principale del hook.
 */

// Mock delle dipendenze
jest.mock('react-native-url-polyfill/auto');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@supabase/supabase-js');
jest.mock('expo-camera');
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
        warning: jest.fn(),
        warn: jest.fn(),
    },
}));
jest.mock('../barcode/useBarcodeCache');
jest.mock('../barcode/useOpenFoodFactsApi');
jest.mock('../barcode/useLocalDatabaseLookup');

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useCameraPermissions } from 'expo-camera';
import { useBarcodeCache } from '../barcode/useBarcodeCache';
import { useOpenFoodFactsApi } from '../barcode/useOpenFoodFactsApi';
import { useLocalDatabaseLookup } from '../barcode/useLocalDatabaseLookup';
import { CategoryMatcher } from '@/services/CategoryMatcher';
import { useBarcodeScanner, __testing, ScanResult } from '../useBarcodeScanner';
import { ProductCategory } from '@/types/Product';

const { extractProductName, extractBrand, extractImageUrl } = __testing;

// Mock typed functions
const mockUseCameraPermissions = useCameraPermissions as jest.MockedFunction<typeof useCameraPermissions>;
const mockUseBarcodeCache = useBarcodeCache as jest.MockedFunction<typeof useBarcodeCache>;
const mockUseOpenFoodFactsApi = useOpenFoodFactsApi as jest.MockedFunction<typeof useOpenFoodFactsApi>;
const mockUseLocalDatabaseLookup = useLocalDatabaseLookup as jest.MockedFunction<typeof useLocalDatabaseLookup>;
const mockMapCategories = CategoryMatcher.mapOpenFoodFactsCategories as jest.MockedFunction<typeof CategoryMatcher.mapOpenFoodFactsCategories>;

// ─── Fixture Data ────────────────────────────────────────────────

const MOCK_BARCODE = '8001505005707';
const MOCK_BARCODE_TYPE = 'org.gs1.EAN-13';

const MOCK_BOUNDS = {
    origin: { x: 100, y: 100 },
    size: { width: 200, height: 100 }
};

const MOCK_FRAME_LAYOUT = {
    x: 50,
    y: 50,
    width: 300,
    height: 300
};

const MOCK_APP_CATEGORIES: ProductCategory[] = [
    { 
        id: '1', 
        name: 'Pasta', 
        icon: '🍝',
        color: '#FFA500'
    }
];

const MOCK_SUPABASE_PRODUCT = {
    id: '123',
    name: 'Pasta Barilla',
    brand: 'Barilla',
    category: 'Pasta',
    imageUrl: 'https://example.com/pasta.jpg',
    barcode: MOCK_BARCODE
};

const MOCK_OFF_PRODUCT = {
    barcode: MOCK_BARCODE,
    product_name: 'Pasta De Cecco',
    brands: 'De Cecco',
    image_front_small_url: 'https://off.com/pasta.jpg',
    categories_tags: ['en:pasta', 'en:dried-products']
};

// ─── Test Helpers ────────────────────────────────────────────────

const setupMocks = (overrides?: {
    cacheResult?: ScanResult | null;
    supabaseResult?: any;
    offResult?: any;
    permission?: any;
}) => {
    const defaultPermission = {
        granted: true,
        canAskAgain: true,
        status: 'granted' as const
    };

    const mockRequestPermission = jest.fn().mockResolvedValue(defaultPermission);
    const mockGet = jest.fn().mockReturnValue(overrides?.cacheResult ?? null);
    const mockSet = jest.fn();
    const mockFetchSupabase = jest.fn().mockResolvedValue(overrides?.supabaseResult ?? null);
    const mockFetchOFF = jest.fn().mockResolvedValue(overrides?.offResult ?? null);

    mockUseCameraPermissions.mockReturnValue([
        overrides?.permission ?? defaultPermission,
        mockRequestPermission,
        jest.fn()
    ] as any);

    mockUseBarcodeCache.mockReturnValue({
        get: mockGet,
        set: mockSet
    } as any);

    mockUseLocalDatabaseLookup.mockReturnValue({
        fetchProductFromSupabase: mockFetchSupabase
    } as any);

    mockUseOpenFoodFactsApi.mockReturnValue({
        fetchProduct: mockFetchOFF
    } as any);

    mockMapCategories.mockReturnValue('1');

    return {
        mockGet,
        mockSet,
        mockFetchSupabase,
        mockFetchOFF,
        mockRequestPermission
    };
};

// ═══════════════════════════════════════════════════════════════════════
// Main Hook Tests
// ═══════════════════════════════════════════════════════════════════════

describe('useBarcodeScanner - Hook Initialization', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should initialize with correct default state', () => {
        setupMocks();
        const mockCallback = jest.fn();

        const { result } = renderHook(() => 
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        expect(result.current.scanned).toBe(false);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.loadingError).toBe(null);
        expect(result.current.currentBarcode).toBe(null);
        expect(result.current.loadingProgress).toBe('Inizializzazione...');
    });

    it('should return correct interface structure', () => {
        setupMocks();
        const mockCallback = jest.fn();

        const { result } = renderHook(() => 
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        expect(result.current).toHaveProperty('permission');
        expect(result.current).toHaveProperty('scanned');
        expect(result.current).toHaveProperty('isLoading');
        expect(result.current).toHaveProperty('loadingError');
        expect(result.current).toHaveProperty('loadingProgress');
        expect(result.current).toHaveProperty('currentBarcode');
        expect(result.current).toHaveProperty('handleBarCodeScanned');
        expect(result.current).toHaveProperty('resetScanner');
        expect(result.current).toHaveProperty('requestPermission');
    });

    it('should request camera permissions on mount when not granted', () => {
        const { mockRequestPermission } = setupMocks({
            permission: {
                granted: false,
                canAskAgain: true,
                status: 'undetermined'
            }
        });
        const mockCallback = jest.fn();

        renderHook(() => useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback));

        expect(mockRequestPermission).toHaveBeenCalled();
    });
});

describe('handleBarCodeScanned - Frame Validation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should skip scan if frameLayout is null', async () => {
        const { mockFetchSupabase, mockFetchOFF } = setupMocks();
        const mockCallback = jest.fn();

        const { result } = renderHook(() => 
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        await act(async () => {
            await result.current.handleBarCodeScanned(
                MOCK_BARCODE,
                MOCK_BARCODE_TYPE,
                MOCK_BOUNDS,
                null
            );
        });

        expect(mockFetchSupabase).not.toHaveBeenCalled();
        expect(mockFetchOFF).not.toHaveBeenCalled();
        expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should skip scan if barcode is outside frame', async () => {
        const { mockFetchSupabase, mockFetchOFF } = setupMocks();
        const mockCallback = jest.fn();

        const outsideBounds = {
            origin: { x: 500, y: 500 },
            size: { width: 100, height: 50 }
        };

        const { result } = renderHook(() => 
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        await act(async () => {
            await result.current.handleBarCodeScanned(
                MOCK_BARCODE,
                MOCK_BARCODE_TYPE,
                outsideBounds,
                MOCK_FRAME_LAYOUT
            );
        });

        expect(mockFetchSupabase).not.toHaveBeenCalled();
        expect(mockFetchOFF).not.toHaveBeenCalled();
        expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should proceed if barcode is inside frame', async () => {
        const { mockFetchSupabase, mockFetchOFF } = setupMocks({
            supabaseResult: MOCK_SUPABASE_PRODUCT
        });
        const mockCallback = jest.fn();

        const { result } = renderHook(() => 
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        await act(async () => {
            await result.current.handleBarCodeScanned(
                MOCK_BARCODE,
                MOCK_BARCODE_TYPE,
                MOCK_BOUNDS,
                MOCK_FRAME_LAYOUT
            );
        });

        expect(mockFetchSupabase).toHaveBeenCalledWith(MOCK_BARCODE);
        expect(mockFetchOFF).toHaveBeenCalledWith(MOCK_BARCODE);
    });
});

describe('handleBarCodeScanned - Cache Hit Scenario', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return cached result immediately without fetch', async () => {
        const cachedResult: ScanResult = {
            type: 'template',
            data: MOCK_SUPABASE_PRODUCT,
            params: { barcode: MOCK_BARCODE }
        };

        const { mockFetchSupabase, mockFetchOFF, mockGet } = setupMocks({
            cacheResult: cachedResult
        });
        const mockCallback = jest.fn();

        const { result } = renderHook(() => 
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        await act(async () => {
            await result.current.handleBarCodeScanned(
                MOCK_BARCODE,
                MOCK_BARCODE_TYPE,
                MOCK_BOUNDS,
                MOCK_FRAME_LAYOUT
            );
        });

        expect(mockGet).toHaveBeenCalledWith(MOCK_BARCODE);
        expect(mockFetchSupabase).not.toHaveBeenCalled();
        expect(mockFetchOFF).not.toHaveBeenCalled();
    });

    it('should call onProductFound with cached data', async () => {
        const cachedResult: ScanResult = {
            type: 'online',
            data: MOCK_OFF_PRODUCT,
            params: { barcode: MOCK_BARCODE }
        };

        setupMocks({ cacheResult: cachedResult });
        const mockCallback = jest.fn();

        const { result } = renderHook(() => 
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        await act(async () => {
            await result.current.handleBarCodeScanned(
                MOCK_BARCODE,
                MOCK_BARCODE_TYPE,
                MOCK_BOUNDS,
                MOCK_FRAME_LAYOUT
            );
        });

        expect(mockCallback).toHaveBeenCalledWith(cachedResult, MOCK_BARCODE);
    });

    it('should not update loading state on cache hit', async () => {
        const cachedResult: ScanResult = {
            type: 'template',
            data: MOCK_SUPABASE_PRODUCT
        };

        setupMocks({ cacheResult: cachedResult });
        const mockCallback = jest.fn();

        const { result } = renderHook(() => 
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        await act(async () => {
            await result.current.handleBarCodeScanned(
                MOCK_BARCODE,
                MOCK_BARCODE_TYPE,
                MOCK_BOUNDS,
                MOCK_FRAME_LAYOUT
            );
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.scanned).toBe(false);
    });
});

describe('handleBarCodeScanned - Parallel Fetch (Supabase Priority)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch from both APIs in parallel', async () => {
        const { mockFetchSupabase, mockFetchOFF } = setupMocks({
            supabaseResult: MOCK_SUPABASE_PRODUCT,
            offResult: MOCK_OFF_PRODUCT
        });
        const mockCallback = jest.fn();

        const { result } = renderHook(() => 
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        await act(async () => {
            await result.current.handleBarCodeScanned(
                MOCK_BARCODE,
                MOCK_BARCODE_TYPE,
                MOCK_BOUNDS,
                MOCK_FRAME_LAYOUT
            );
        });

        expect(mockFetchSupabase).toHaveBeenCalledWith(MOCK_BARCODE);
        expect(mockFetchOFF).toHaveBeenCalledWith(MOCK_BARCODE);
    });

    it('should prefer Supabase result over OpenFoodFacts', async () => {
        const { mockSet } = setupMocks({
            supabaseResult: MOCK_SUPABASE_PRODUCT,
            offResult: MOCK_OFF_PRODUCT
        });
        const mockCallback = jest.fn();

        const { result } = renderHook(() => 
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        await act(async () => {
            await result.current.handleBarCodeScanned(
                MOCK_BARCODE,
                MOCK_BARCODE_TYPE,
                MOCK_BOUNDS,
                MOCK_FRAME_LAYOUT
            );
        });

        expect(mockCallback).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'template',
                data: MOCK_SUPABASE_PRODUCT
            }),
            MOCK_BARCODE
        );
    });

    it('should map Supabase result correctly to ScanResult', async () => {
        setupMocks({ supabaseResult: MOCK_SUPABASE_PRODUCT });
        const mockCallback = jest.fn();

        const { result } = renderHook(() => 
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        await act(async () => {
            await result.current.handleBarCodeScanned(
                MOCK_BARCODE,
                MOCK_BARCODE_TYPE,
                MOCK_BOUNDS,
                MOCK_FRAME_LAYOUT
            );
        });

        expect(mockCallback).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'template',
                data: MOCK_SUPABASE_PRODUCT,
                params: expect.objectContaining({
                    barcode: MOCK_BARCODE,
                    barcodeType: MOCK_BARCODE_TYPE,
                    addedMethod: 'barcode',
                    name: MOCK_SUPABASE_PRODUCT.name,
                    brand: MOCK_SUPABASE_PRODUCT.brand
                })
            }),
            MOCK_BARCODE
        );
    });

    it('should cache Supabase result', async () => {
        const { mockSet } = setupMocks({ supabaseResult: MOCK_SUPABASE_PRODUCT });
        const mockCallback = jest.fn();

        const { result } = renderHook(() => 
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        await act(async () => {
            await result.current.handleBarCodeScanned(
                MOCK_BARCODE,
                MOCK_BARCODE_TYPE,
                MOCK_BOUNDS,
                MOCK_FRAME_LAYOUT
            );
        });

        expect(mockSet).toHaveBeenCalledWith(
            MOCK_BARCODE,
            expect.objectContaining({
                type: 'template',
                data: MOCK_SUPABASE_PRODUCT
            })
        );
    });
});

describe('handleBarCodeScanned - OpenFoodFacts Fallback', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fallback to OpenFoodFacts if Supabase returns null', async () => {
        setupMocks({
            supabaseResult: null,
            offResult: MOCK_OFF_PRODUCT
        });
        const mockCallback = jest.fn();

        const { result } = renderHook(() => 
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        await act(async () => {
            await result.current.handleBarCodeScanned(
                MOCK_BARCODE,
                MOCK_BARCODE_TYPE,
                MOCK_BOUNDS,
                MOCK_FRAME_LAYOUT
            );
        });

        expect(mockCallback).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'online',
                data: MOCK_OFF_PRODUCT
            }),
            MOCK_BARCODE
        );
    });

    it('should fallback to OpenFoodFacts if Supabase rejects', async () => {
        const { mockFetchSupabase } = setupMocks({
            offResult: MOCK_OFF_PRODUCT
        });
        mockFetchSupabase.mockRejectedValue(new Error('Database timeout'));
        const mockCallback = jest.fn();

        const { result } = renderHook(() => 
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        await act(async () => {
            await result.current.handleBarCodeScanned(
                MOCK_BARCODE,
                MOCK_BARCODE_TYPE,
                MOCK_BOUNDS,
                MOCK_FRAME_LAYOUT
            );
        });

        expect(mockCallback).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'online',
                data: MOCK_OFF_PRODUCT
            }),
            MOCK_BARCODE
        );
    });

    it('should map OpenFoodFacts product correctly', async () => {
        setupMocks({
            supabaseResult: null,
            offResult: MOCK_OFF_PRODUCT
        });
        const mockCallback = jest.fn();

        const { result } = renderHook(() => 
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        await act(async () => {
            await result.current.handleBarCodeScanned(
                MOCK_BARCODE,
                MOCK_BARCODE_TYPE,
                MOCK_BOUNDS,
                MOCK_FRAME_LAYOUT
            );
        });

        expect(mockCallback).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'online',
                data: MOCK_OFF_PRODUCT,
                params: expect.objectContaining({
                    barcode: MOCK_BARCODE,
                    name: MOCK_OFF_PRODUCT.product_name,
                    brand: MOCK_OFF_PRODUCT.brands,
                    imageUrl: MOCK_OFF_PRODUCT.image_front_small_url
                })
            }),
            MOCK_BARCODE
        );
    });

    it('should handle category mapping with CategoryMatcher', async () => {
        setupMocks({
            supabaseResult: null,
            offResult: MOCK_OFF_PRODUCT
        });
        const mockCallback = jest.fn();

        const { result } = renderHook(() => 
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        await act(async () => {
            await result.current.handleBarCodeScanned(
                MOCK_BARCODE,
                MOCK_BARCODE_TYPE,
                MOCK_BOUNDS,
                MOCK_FRAME_LAYOUT
            );
        });

        expect(mockMapCategories).toHaveBeenCalledWith(
            MOCK_OFF_PRODUCT.categories_tags,
            MOCK_APP_CATEGORIES
        );
    });

    it('should cache OpenFoodFacts result', async () => {
        const { mockSet } = setupMocks({
            supabaseResult: null,
            offResult: MOCK_OFF_PRODUCT
        });
        const mockCallback = jest.fn();

        const { result } = renderHook(() => 
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        await act(async () => {
            await result.current.handleBarCodeScanned(
                MOCK_BARCODE,
                MOCK_BARCODE_TYPE,
                MOCK_BOUNDS,
                MOCK_FRAME_LAYOUT
            );
        });

        expect(mockSet).toHaveBeenCalledWith(
            MOCK_BARCODE,
            expect.objectContaining({
                type: 'online',
                data: MOCK_OFF_PRODUCT
            })
        );
    });
});

describe('handleBarCodeScanned - Error Handling', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should handle both APIs failing', async () => {
        const { mockFetchSupabase, mockFetchOFF } = setupMocks();
        mockFetchSupabase.mockRejectedValue(new Error('Supabase timeout'));
        mockFetchOFF.mockRejectedValue(new Error('OFF network error'));
        const mockCallback = jest.fn();

        const { result } = renderHook(() => 
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        await act(async () => {
            await result.current.handleBarCodeScanned(
                MOCK_BARCODE,
                MOCK_BARCODE_TYPE,
                MOCK_BOUNDS,
                MOCK_FRAME_LAYOUT
            );
        });

        expect(result.current.loadingError).toContain('Errore');
        expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should handle product not found (both return null)', async () => {
        const { mockFetchSupabase, mockFetchOFF } = setupMocks();
        mockFetchSupabase.mockRejectedValue(new Error('Prodotto non trovato'));
        mockFetchOFF.mockRejectedValue(new Error('Errore HTTP: 404'));
        const mockCallback = jest.fn();

        const { result } = renderHook(() => 
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        await act(async () => {
            await result.current.handleBarCodeScanned(
                MOCK_BARCODE,
                MOCK_BARCODE_TYPE,
                MOCK_BOUNDS,
                MOCK_FRAME_LAYOUT
            );
        });

        expect(mockCallback).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'not_found',
                params: expect.objectContaining({
                    barcode: MOCK_BARCODE
                })
            }),
            MOCK_BARCODE
        );
    });

    it('should set loadingError on generic fetch failure', async () => {
        const { mockFetchSupabase, mockFetchOFF } = setupMocks();
        mockFetchSupabase.mockRejectedValue(new Error('Network error'));
        mockFetchOFF.mockRejectedValue(new Error('Server error'));
        const mockCallback = jest.fn();

        const { result } = renderHook(() => 
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        await act(async () => {
            await result.current.handleBarCodeScanned(
                MOCK_BARCODE,
                MOCK_BARCODE_TYPE,
                MOCK_BOUNDS,
                MOCK_FRAME_LAYOUT
            );
        });

        expect(result.current.loadingError).toBeTruthy();
        expect(result.current.loadingError).toContain('Errore');
    });

    it('should cache not_found result', async () => {
        const { mockFetchSupabase, mockFetchOFF, mockSet } = setupMocks();
        mockFetchSupabase.mockRejectedValue(new Error('Prodotto non trovato'));
        mockFetchOFF.mockRejectedValue(new Error('Errore HTTP: 404'));
        const mockCallback = jest.fn();

        const { result } = renderHook(() => 
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        await act(async () => {
            await result.current.handleBarCodeScanned(
                MOCK_BARCODE,
                MOCK_BARCODE_TYPE,
                MOCK_BOUNDS,
                MOCK_FRAME_LAYOUT
            );
        });

        expect(mockSet).toHaveBeenCalledWith(
            MOCK_BARCODE,
            expect.objectContaining({
                type: 'not_found'
            })
        );
    });

    it('should reset isLoading after error', async () => {
        const { mockFetchSupabase, mockFetchOFF } = setupMocks();
        mockFetchSupabase.mockRejectedValue(new Error('Error'));
        mockFetchOFF.mockRejectedValue(new Error('Error'));
        const mockCallback = jest.fn();

        const { result } = renderHook(() => 
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        await act(async () => {
            await result.current.handleBarCodeScanned(
                MOCK_BARCODE,
                MOCK_BARCODE_TYPE,
                MOCK_BOUNDS,
                MOCK_FRAME_LAYOUT
            );
        });

        expect(result.current.isLoading).toBe(false);
    });
});

describe('handleBarCodeScanned - State Management', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should set isLoading=true during fetch', async () => {
        const { mockFetchSupabase } = setupMocks();

        // Deferred promise per controllare quando fetchSupabase si risolve
        let resolveFetch: () => void;
        const fetchGate = new Promise<void>(resolve => {
            resolveFetch = resolve;
        });

        mockFetchSupabase.mockImplementation(async () => {
            await fetchGate;
            return MOCK_SUPABASE_PRODUCT;
        });

        const mockCallback = jest.fn();

        const { result } = renderHook(() =>
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        // Avvia scan dentro act() SINCRONO (senza await) — React flussa stati PRIMA dell'await
        let scanPromise: Promise<void>;
        act(() => {
            scanPromise = result.current.handleBarCodeScanned(
                MOCK_BARCODE,
                MOCK_BARCODE_TYPE,
                MOCK_BOUNDS,
                MOCK_FRAME_LAYOUT
            );
        });

        // Stato intermedio: fetch è ancora in attesa del gate
        expect(result.current.isLoading).toBe(true);
        expect(result.current.scanned).toBe(true);
        expect(result.current.currentBarcode).toBe(MOCK_BARCODE);

        // Rilascia il gate — fetchSupabase ora può risolvere
        resolveFetch!();

        await act(async () => {
            await scanPromise;
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.currentBarcode).toBeNull();
        expect(mockCallback).toHaveBeenCalled();
    });

    it('should set scanned=true after scan starts', async () => {
        setupMocks({ supabaseResult: MOCK_SUPABASE_PRODUCT });
        const mockCallback = jest.fn();

        const { result } = renderHook(() => 
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        expect(result.current.scanned).toBe(false);

        await act(async () => {
            await result.current.handleBarCodeScanned(
                MOCK_BARCODE,
                MOCK_BARCODE_TYPE,
                MOCK_BOUNDS,
                MOCK_FRAME_LAYOUT
            );
        });

        expect(result.current.scanned).toBe(true);
    });

    it('should set currentBarcode during processing', async () => {
        const { mockFetchSupabase } = setupMocks();

        // Deferred promise per controllare quando fetchSupabase si risolve
        let resolveFetch: () => void;
        const fetchGate = new Promise<void>(resolve => {
            resolveFetch = resolve;
        });

        mockFetchSupabase.mockImplementation(async () => {
            await fetchGate;
            return MOCK_SUPABASE_PRODUCT;
        });

        const mockCallback = jest.fn();
        const { result } = renderHook(() =>
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        // Avvia scan dentro act() sincrono — React flussa stati PRIMA dell'await
        let scanPromise: Promise<void>;
        act(() => {
            scanPromise = result.current.handleBarCodeScanned(
                MOCK_BARCODE, MOCK_BARCODE_TYPE, MOCK_BOUNDS, MOCK_FRAME_LAYOUT
            );
        });

        // Stato intermedio: currentBarcode deve essere settato
        expect(result.current.currentBarcode).toBe(MOCK_BARCODE);
        expect(result.current.isLoading).toBe(true);

        // Rilascia il gate — fetchSupabase ora può risolvere
        resolveFetch!();

        await act(async () => {
            await scanPromise;
        });

        // Stato finale: currentBarcode resettato a null
        expect(result.current.currentBarcode).toBeNull();
        expect(result.current.isLoading).toBe(false);
        expect(mockCallback).toHaveBeenCalled();
    });

    it('should update loadingProgress during fetch', async () => {
        setupMocks({ supabaseResult: MOCK_SUPABASE_PRODUCT });
        const mockCallback = jest.fn();
        const progressStates: string[] = [];

        const { result } = renderHook(() => 
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        progressStates.push(result.current.loadingProgress);

        await act(async () => {
            await result.current.handleBarCodeScanned(
                MOCK_BARCODE,
                MOCK_BARCODE_TYPE,
                MOCK_BOUNDS,
                MOCK_FRAME_LAYOUT
            );
        });

        expect(progressStates).toContain('Inizializzazione...');
    });
});

describe('resetScanner', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should reset all state to initial values', async () => {
        setupMocks({ supabaseResult: MOCK_SUPABASE_PRODUCT });
        const mockCallback = jest.fn();

        const { result } = renderHook(() => 
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        // Trigger a scan first
        await act(async () => {
            await result.current.handleBarCodeScanned(
                MOCK_BARCODE,
                MOCK_BARCODE_TYPE,
                MOCK_BOUNDS,
                MOCK_FRAME_LAYOUT
            );
        });

        expect(result.current.scanned).toBe(true);

        // Reset
        act(() => {
            result.current.resetScanner();
        });

        expect(result.current.scanned).toBe(false);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.loadingError).toBe(null);
    });

    it('should allow new scans after reset', async () => {
        setupMocks({ supabaseResult: MOCK_SUPABASE_PRODUCT });
        const mockCallback = jest.fn();

        const { result } = renderHook(() => 
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        // First scan
        await act(async () => {
            await result.current.handleBarCodeScanned(
                MOCK_BARCODE,
                MOCK_BARCODE_TYPE,
                MOCK_BOUNDS,
                MOCK_FRAME_LAYOUT
            );
        });

        expect(mockCallback).toHaveBeenCalledTimes(1);

        // Reset
        act(() => {
            result.current.resetScanner();
        });

        // Second scan
        await act(async () => {
            await result.current.handleBarCodeScanned(
                MOCK_BARCODE,
                MOCK_BARCODE_TYPE,
                MOCK_BOUNDS,
                MOCK_FRAME_LAYOUT
            );
        });

        expect(mockCallback).toHaveBeenCalledTimes(2);
    });

    it('should handle reset without active timeout', () => {
        setupMocks();
        const mockCallback = jest.fn();

        const { result } = renderHook(() => 
            useBarcodeScanner(MOCK_APP_CATEGORIES, mockCallback)
        );

        // Reset without any scan
        expect(() => {
            act(() => {
                result.current.resetScanner();
            });
        }).not.toThrow();

        expect(result.current.scanned).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════════════
// Helper Functions Tests (Existing)
// ═══════════════════════════════════════════════════════════════════════

// ─── extractProductName ──────────────────────────────────────

describe('extractProductName', () => {
    it('dovrebbe restituire product_name se presente', () => {
        expect(extractProductName({ barcode: '1234567890123', product_name: 'Pasta Barilla' })).toBe('Pasta Barilla');
    });

    it('dovrebbe fare fallback a product_name_it quando product_name è vuoto', () => {
        expect(extractProductName({ barcode: '1234567890123', product_name: '', product_name_it: 'Pasta De Cecco' })).toBe('Pasta De Cecco');
    });

    it('dovrebbe fare fallback a product_name_it quando product_name è undefined', () => {
        expect(extractProductName({ barcode: '1234567890123', product_name_it: 'Mozzarella di Bufala' })).toBe('Mozzarella di Bufala');
    });

    it('dovrebbe restituire stringa vuota quando nessun campo è presente', () => {
        expect(extractProductName({ barcode: '1234567890123' })).toBe('');
    });

    it('dovrebbe preferire product_name a product_name_it', () => {
        expect(extractProductName({ barcode: '1234567890123', product_name: 'Generic', product_name_it: 'Italiano' })).toBe('Generic');
    });

    it('dovrebbe fare fallback a generic_name_it quando product_name e product_name_it sono assenti', () => {
        expect(extractProductName({ barcode: '1234567890123', generic_name_it: 'Prodotto Generico IT' })).toBe('Prodotto Generico IT');
    });

    it('dovrebbe fare fallback a generic_name quando anche generic_name_it è assente', () => {
        expect(extractProductName({ barcode: '1234567890123', generic_name: 'Generic Product' })).toBe('Generic Product');
    });

    it('dovrebbe fare fallback a abbreviated_product_name come ultima risorsa', () => {
        expect(extractProductName({ barcode: '1234567890123', abbreviated_product_name: 'Abbr. Name' })).toBe('Abbr. Name');
    });
});

// ─── extractBrand ────────────────────────────────────────────

describe('extractBrand', () => {
    it('dovrebbe restituire brands se presente', () => {
        expect(extractBrand({ barcode: '1234567890123', brands: 'Barilla' })).toBe('Barilla');
    });

    it('dovrebbe fare fallback a brands_tags[0] quando brands è vuoto', () => {
        expect(extractBrand({ barcode: '1234567890123', brands: '', brands_tags: ['De Cecco'] })).toBe('De Cecco');
    });

    it('dovrebbe fare fallback a brands_tags[0] quando brands è undefined', () => {
        expect(extractBrand({ barcode: '1234567890123', brands_tags: ['Mulino Bianco'] })).toBe('Mulino Bianco');
    });

    it('dovrebbe restituire stringa vuota quando nessun campo è presente', () => {
        expect(extractBrand({ barcode: '1234567890123' })).toBe('');
    });

    it('dovrebbe restituire stringa vuota quando brands_tags è un array vuoto', () => {
        expect(extractBrand({ barcode: '1234567890123', brands_tags: [] })).toBe('');
    });

    it('dovrebbe preferire brands a brands_tags', () => {
        expect(extractBrand({ barcode: '1234567890123', brands: 'Barilla', brands_tags: ['Altro'] })).toBe('Barilla');
    });
});

// ─── extractImageUrl ─────────────────────────────────────────

describe('extractImageUrl', () => {
    it('dovrebbe restituire image_url se presente', () => {
        expect(extractImageUrl({ barcode: '1234567890123', image_url: 'https://img.off/1.jpg' })).toBe('https://img.off/1.jpg');
    });

    it('dovrebbe fare fallback a image_front_url quando image_url è vuoto', () => {
        expect(extractImageUrl({ barcode: '1234567890123', image_url: '', image_front_url: 'https://img.off/front.jpg' }))
            .toBe('https://img.off/front.jpg');
    });

    it('dovrebbe fare fallback a image_front_url quando image_url è undefined', () => {
        expect(extractImageUrl({ barcode: '1234567890123', image_front_url: 'https://img.off/front.jpg' }))
            .toBe('https://img.off/front.jpg');
    });

    it('dovrebbe fare fallback a image_front_small_url come ultima risorsa', () => {
        expect(extractImageUrl({ barcode: '1234567890123', image_front_small_url: 'https://img.off/small.jpg' }))
            .toBe('https://img.off/small.jpg');
    });

    it('dovrebbe restituire stringa vuota quando nessun campo è presente', () => {
        expect(extractImageUrl({ barcode: '1234567890123' })).toBe('');
    });

    it('dovrebbe rispettare la priorità: image_front_small_url > image_front_url > image_url', () => {
        expect(extractImageUrl({
            barcode: '1234567890123',
            image_url: 'https://img.off/1.jpg',
            image_front_url: 'https://img.off/front.jpg',
            image_front_small_url: 'https://img.off/small.jpg',
        })).toBe('https://img.off/small.jpg');
    });

    it('dovrebbe fare fallback a image_front_url quando image_url è vuoto', () => {
        expect(extractImageUrl({ barcode: '1234567890124', image_url: '', image_front_url: 'https://img.off/front.jpg' }))
            .toBe('https://img.off/front.jpg');
    });

    it('dovrebbe fare fallback a image_front_url quando image_url è undefined', () => {
        expect(extractImageUrl({ barcode: '1234567890125', image_front_url: 'https://img.off/front.jpg' }))
            .toBe('https://img.off/front.jpg');
    });

    it('dovrebbe fare fallback a image_front_small_url come ultima risorsa', () => {
        expect(extractImageUrl({ barcode: '1234567890126', image_front_small_url: 'https://img.off/small.jpg' }))
            .toBe('https://img.off/small.jpg');
    });

    it('dovrebbe restituire stringa vuota quando nessun campo è presente', () => {
        expect(extractImageUrl({ barcode: '1234567890127' })).toBe('');
    });

    it('dovrebbe rispettare la priorità: image_front_small_url > image_front_url > image_url', () => {
        expect(extractImageUrl({
            barcode: '1234567890128',
            image_url: 'https://img.off/1.jpg',
            image_front_url: 'https://img.off/front.jpg',
            image_front_small_url: 'https://img.off/small.jpg',
        })).toBe('https://img.off/small.jpg');
    });
});
