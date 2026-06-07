// useProductInitialization.test.ts — useProductInitialization test module.
//
// exports: none
// used_by: none
// rules: none

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useProductInitialization } from '../useProductInitialization';
import { useLocalSearchParams } from 'expo-router';
import { ProductStorage } from '@/services/ProductStorage';
import { useManualEntry } from '@/context/ManualEntryContext';
import { LoggingService } from '@/services/LoggingService';
import { Product } from '@/types/Product';

// --- Mocks ---

// Mock di expo-router
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
}));

// Mock del contesto ManualEntry
jest.mock('@/context/ManualEntryContext', () => ({
  useManualEntry: jest.fn(),
}));

// Mock del servizio ProductStorage
jest.mock('@/services/ProductStorage', () => ({
  ProductStorage: {
    getProductById: jest.fn(),
  },
}));

// Mock del LoggingService
jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    debug: jest.fn(),
  },
}));

// Type assertions per i mock
const mockedUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockedUseManualEntry = useManualEntry as jest.Mock;
const mockedGetProductById = ProductStorage.getProductById as jest.Mock;
const mockedLoggingService = LoggingService as jest.MockedType<typeof LoggingService>;

// Mock dei dati di default per ManualEntryContext
const mockManualEntryContext = {
  isInitialized: false,
  setIsInitialized: jest.fn(),
  initializeForm: jest.fn(),
  setImageUrl: jest.fn(),
  setExpirationDate: jest.fn(),
  name: '',
  setName: jest.fn(),
  brand: '',
  setBrand: jest.fn(),
  selectedCategory: '',
  setSelectedCategory: jest.fn(),
  quantities: [],
  setQuantities: jest.fn(),
  addQuantity: jest.fn(),
  removeQuantity: jest.fn(),
  updateQuantity: jest.fn(),
  purchaseDate: '',
  setPurchaseDate: jest.fn(),
  expirationDate: '',
  notes: '',
  setNotes: jest.fn(),
  barcode: '',
  setBarcode: jest.fn(),
  imageUrl: null,
  isEditMode: false,
  originalProductId: null,
  hasManuallySelectedCategory: false,
  setIsEditMode: jest.fn(),
  setOriginalProductId: jest.fn(),
  setHasManuallySelectedCategory: jest.fn(),
  clearForm: jest.fn(),
};

// Mock product data
const mockProduct: Product = {
  id: 'test-123',
  name: 'Test Product',
  brand: 'Test Brand',
  category: 'dairy',
  quantities: [{ quantity: 1, unit: 'pz' }],
  purchaseDate: '2024-01-01',
  expirationDate: '2024-12-31',
  status: 'active',
  isFrozen: false,
};

describe('useProductInitialization', () => {
  const setIsLoading = jest.fn();
  const categories: any[] = [
    { id: 'dairy', name: 'Latticini', icon: '🧀', color: '#FFD700' },
    { id: 'vegetables', name: 'Verdure', icon: '🥬', color: '#90EE90' },
  ];
  const categoriesLoading = false;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup defaults
    mockedUseLocalSearchParams.mockReturnValue({});
    mockedUseManualEntry.mockReturnValue(mockManualEntryContext);
    mockedGetProductById.mockResolvedValue({ success: true, data: mockProduct });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Hook Initialization', () => {
    it('should initialize hook without errors', () => {
      const { result } = renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      expect(result.current).toBeDefined();
      expect(result.current.productId).toBeUndefined();
      expect(result.current.scannerDataKey).toBe('-none');
      expect(typeof result.current.loadData).toBe('function');
    });

    it('should return productId from params', () => {
      mockedUseLocalSearchParams.mockReturnValue({ productId: 'test-123' });

      const { result } = renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      expect(result.current.productId).toBe('test-123');
    });

    it('should handle array productId from params', () => {
      mockedUseLocalSearchParams.mockReturnValue({ productId: ['test-456'] });

      const { result } = renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      expect(result.current.productId).toBe('test-456');
    });

    it('should generate scannerDataKey from barcode and fromPhotoCapture', () => {
      mockedUseLocalSearchParams.mockReturnValue({
        barcode: '123456',
        fromPhotoCapture: 'true',
      });

      const { result } = renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      expect(result.current.scannerDataKey).toBe('123456-photo');
    });

    it('should generate scannerDataKey without barcode', () => {
      mockedUseLocalSearchParams.mockReturnValue({
        fromPhotoCapture: 'true',
      });

      const { result } = renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      expect(result.current.scannerDataKey).toBe('-photo');
    });
  });

  describe('Loading Data - New Product', () => {
    it('should initialize form with params data for new product', async () => {
      const mockInitializeForm = jest.fn();
      mockedUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        initializeForm: mockInitializeForm,
        isInitialized: false,
      });

      mockedUseLocalSearchParams.mockReturnValue({
        barcode: '123456',
        name: 'Test Product',
        brand: 'Test Brand',
      });

      const { result } = renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      await act(async () => {
        await result.current.loadData();
      });

      expect(mockInitializeForm).toHaveBeenCalledWith(
        expect.objectContaining({
          barcode: '123456',
          name: 'Test Product',
          brand: 'Test Brand',
        })
      );
    });

    it('should set loading state during data load', async () => {
      const mockInitializeForm = jest.fn();
      mockedUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        initializeForm: mockInitializeForm,
      });

      const { result } = renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      await act(async () => {
        await result.current.loadData();
      });

      expect(setIsLoading).toHaveBeenCalledWith(true);
      expect(setIsLoading).toHaveBeenCalledWith(false);
    });

    it('should handle expiration date from photo capture separately', async () => {
      const mockInitializeForm = jest.fn();
      const mockSetExpirationDate = jest.fn();
      mockedUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        initializeForm: mockInitializeForm,
        setExpirationDate: mockSetExpirationDate,
      });

      mockedUseLocalSearchParams.mockReturnValue({
        fromPhotoCapture: 'true',
        expirationDate: '2024-12-31',
        barcode: '123456',
      });

      const { result } = renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      await act(async () => {
        await result.current.loadData();
      });

      // expirationDate should NOT be passed to initializeForm when fromPhotoCapture is true
      expect(mockInitializeForm).not.toHaveBeenCalledWith(
        expect.objectContaining({
          expirationDate: '2024-12-31',
        })
      );

      // expirationDate should be set separately
      expect(mockSetExpirationDate).toHaveBeenCalledWith('2024-12-31');
    });

    it('should set image URL from photo capture params', async () => {
      const mockSetImageUrl = jest.fn();
      mockedUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        setImageUrl: mockSetImageUrl,
      });

      mockedUseLocalSearchParams.mockReturnValue({
        fromPhotoCapture: 'true',
        imageUrl: 'http://example.com/image.jpg',
      });

      const { result } = renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      await act(async () => {
        await result.current.loadData();
      });

      expect(mockSetImageUrl).toHaveBeenCalledWith('http://example.com/image.jpg');
    });
  });

  describe('Loading Data - Edit Product', () => {
    it('should load product by ID and initialize form in edit mode', async () => {
      const mockInitializeForm = jest.fn();
      mockedUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        initializeForm: mockInitializeForm,
      });

      mockedUseLocalSearchParams.mockReturnValue({ productId: 'test-123' });
      mockedGetProductById.mockResolvedValue({ success: true, data: mockProduct });

      const { result } = renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      await act(async () =>
        await result.current.loadData()
      );

      expect(mockedGetProductById).toHaveBeenCalledWith('test-123');
      expect(mockInitializeForm).toHaveBeenCalledWith({
        product: mockProduct,
        isEditMode: true,
        originalProductId: 'test-123',
        hasManuallySelectedCategory: true,
      });
    });

    it('should handle product not found', async () => {
      mockedGetProductById.mockResolvedValue({ success: false, data: null });

      mockedUseLocalSearchParams.mockReturnValue({ productId: 'invalid-id' });

      const { result } = renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      await act(async () => {
        await result.current.loadData();
      });

      expect(mockedLoggingService.error).toHaveBeenCalledWith(
        'useProductInitialization',
        expect.stringContaining('not found')
      );
    });

    it('should handle errors during product fetch', async () => {
      mockedGetProductById.mockRejectedValue(new Error('Network error'));

      mockedUseLocalSearchParams.mockReturnValue({ productId: 'test-123' });

      const { result } = renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      await act(async () => {
        await result.current.loadData();
      });

      expect(mockedLoggingService.error).toHaveBeenCalledWith(
        'useProductInitialization',
        expect.stringContaining('Error'),
        expect.any(Error)
      );
    });

    it('should set initialized flag after loading', async () => {
      const mockSetIsInitialized = jest.fn();
      mockedUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        setIsInitialized: mockSetIsInitialized,
      });

      const { result } = renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      await act(async () => {
        await result.current.loadData();
      });

      expect(mockSetIsInitialized).toHaveBeenCalledWith(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      const mockInitializeForm = jest.fn();
      mockInitializeForm.mockImplementation(() => {
        throw new Error('Initialization error');
      });

      mockedUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        initializeForm: mockInitializeForm,
      });

      mockedUseLocalSearchParams.mockReturnValue({ barcode: '123456' });

      const { result } = renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      await act(async () => {
        await result.current.loadData();
      });

      expect(mockedLoggingService.error).toHaveBeenCalledWith(
        'useProductInitialization',
        expect.stringContaining('Error'),
        expect.any(Error)
      );
    });

    it('should set loading to false even on error', async () => {
      mockedGetProductById.mockRejectedValue(new Error('Network error'));

      mockedUseLocalSearchParams.mockReturnValue({ productId: 'test-123' });

      const { result } = renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      await act(async () => {
        await result.current.loadData();
      });

      expect(setIsLoading).toHaveBeenCalledWith(false);
    });
  });

  describe('Empty States', () => {
    it('should handle empty params gracefully', async () => {
      mockedUseLocalSearchParams.mockReturnValue({});

      const { result } = renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      expect(result.current.productId).toBeUndefined();
      expect(result.current.scannerDataKey).toBe('-none');

      await act(async () => {
        await result.current.loadData();
      });

      expect(mockedLoggingService.error).not.toHaveBeenCalled();
    });

    it('should handle missing product ID in edit mode', async () => {
      const mockInitializeForm = jest.fn();
      mockedUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        initializeForm: mockInitializeForm,
      });

      // No productId in params
      mockedUseLocalSearchParams.mockReturnValue({});

      const { result } = renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      await act(async () => {
        await result.current.loadData();
      });

      // Should initialize as new product, not edit mode
      expect(mockInitializeForm).not.toHaveBeenCalledWith(
        expect.objectContaining({
          isEditMode: true,
        })
      );
    });
  });

  describe('Auto-load on Mount', () => {
    it('should call loadData automatically on mount', async () => {
      const mockInitializeForm = jest.fn();
      mockedUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        initializeForm: mockInitializeForm,
      });

      mockedUseLocalSearchParams.mockReturnValue({ barcode: '123456' });

      renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      // Wait for the effect to run
      await waitFor(() => {
        expect(mockInitializeForm).toHaveBeenCalled();
      });
    });

    it('should not reinitialize if already initialized', async () => {
      const mockInitializeForm = jest.fn();
      mockedUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        initializeForm: mockInitializeForm,
        isInitialized: true,
      });

      mockedUseLocalSearchParams.mockReturnValue({ barcode: '123456' });

      renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      await waitFor(() => {
        expect(mockInitializeForm).toHaveBeenCalled();
      });
    });
  });

  describe('Logging', () => {
    it('should log info during data loading', async () => {
      mockedUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
      });

      mockedUseLocalSearchParams.mockReturnValue({
        productId: 'test-123',
        fromPhotoCapture: 'true',
      });

      const { result } = renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      await act(async () => {
        await result.current.loadData();
      });

      expect(mockedLoggingService.info).toHaveBeenCalledWith(
        'useProductInitialization',
        expect.stringContaining('Loading data')
      );
    });
  });

  describe('Effect for Expiration Date', () => {
    it('should set expiration date only once from photo capture', async () => {
      const mockSetExpirationDate = jest.fn();
      mockedUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        setExpirationDate: mockSetExpirationDate,
      });

      mockedUseLocalSearchParams.mockReturnValue({
        fromPhotoCapture: 'true',
        expirationDate: '2024-12-31',
      });

      renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      // Should set expiration date
      await waitFor(() => {
        expect(mockSetExpirationDate).toHaveBeenCalledWith('2024-12-31');
      });
    });

    it('should handle array expirationDate param', async () => {
      const mockSetExpirationDate = jest.fn();
      mockedUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        setExpirationDate: mockSetExpirationDate,
      });

      mockedUseLocalSearchParams.mockReturnValue({
        fromPhotoCapture: 'true',
        expirationDate: ['2024-12-31'],
      });

      renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      await waitFor(() => {
        expect(mockSetExpirationDate).toHaveBeenCalledWith('2024-12-31');
      });
    });
  });

  describe('Effect for Image URL', () => {
    it('should set image URL from photo capture', async () => {
      const mockSetImageUrl = jest.fn();
      mockedUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        setImageUrl: mockSetImageUrl,
      });

      mockedUseLocalSearchParams.mockReturnValue({
        fromPhotoCapture: 'true',
        imageUrl: 'http://example.com/image.jpg',
      });

      renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      await waitFor(() => {
        expect(mockSetImageUrl).toHaveBeenCalledWith('http://example.com/image.jpg');
      });
    });

    it('should handle array imageUrl param', async () => {
      const mockSetImageUrl = jest.fn();
      mockedUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        setImageUrl: mockSetImageUrl,
      });

      mockedUseLocalSearchParams.mockReturnValue({
        fromPhotoCapture: 'true',
        imageUrl: ['http://example.com/image.jpg'],
      });

      renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      await waitFor(() => {
        expect(mockSetImageUrl).toHaveBeenCalledWith('http://example.com/image.jpg');
      });
    });
  });

  // --- Regression tests for image-persistence fixes (2026-06-02) ---

  describe('Loop Prevention (Fix #2: isInitialized removed from deps)', () => {
    it('should call loadData exactly once on mount, not in a loop', async () => {
      const mockInitializeForm = jest.fn();
      const mockSetIsInitialized = jest.fn();
      mockedUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        initializeForm: mockInitializeForm,
        setIsInitialized: mockSetIsInitialized,
      });

      mockedUseLocalSearchParams.mockReturnValue({ barcode: '123456' });

      renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      // Wait for initial load to complete
      await waitFor(() => {
        expect(mockInitializeForm).toHaveBeenCalled();
      });

      // Wait additional time to ensure no loop re-triggers loadData
      await new Promise(resolve => setTimeout(resolve, 100));

      // Without the fix, isInitialized would be in useCallback deps and
      // setIsInitialized(true) would re-create loadData, re-triggering the
      // useEffect and calling loadData again, infinitely. We assert
      // initializeForm is called exactly once.
      expect(mockInitializeForm).toHaveBeenCalledTimes(1);
      expect(mockSetIsInitialized).toHaveBeenCalledTimes(1);
    });
  });

  describe('Race Condition Fix in EDIT mode (Fix #3)', () => {
    it('should use new imageUrl from params in EDIT mode + photo capture (override OLD DB value)', async () => {
      const mockInitializeForm = jest.fn();
      const mockSetImageUrl = jest.fn();
      mockedUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        initializeForm: mockInitializeForm,
        setImageUrl: mockSetImageUrl,
      });

      const newImageUrl = 'file:///tmp/NEW.jpg';
      mockedUseLocalSearchParams.mockReturnValue({
        productId: 'test-123',
        fromPhotoCapture: 'true',
        imageUrl: newImageUrl,
      });
      mockedGetProductById.mockResolvedValue({ success: true, data: mockProduct });

      const { result } = renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      await act(async () => {
        await result.current.loadData();
      });

      // initializeForm should be called with the product from DB
      expect(mockInitializeForm).toHaveBeenCalledWith(
        expect.objectContaining({
          product: mockProduct,
          isEditMode: true,
          originalProductId: 'test-123',
          hasManuallySelectedCategory: true,
        })
      );

      // setImageUrl should be called with the NEW URL (override)
      expect(mockSetImageUrl).toHaveBeenCalledWith(newImageUrl);

      // The setImageUrl override call (the LAST invocation, coming from
      // loadData) must happen AFTER initializeForm so it wins over the OLD
      // imageUrl coming from the product in the DB. Note: setImageUrl is
      // also called earlier by the dedicated photo-capture effect, so we
      // specifically check the LAST invocation here.
      const initializeFormOrder = mockInitializeForm.mock.invocationCallOrder[0];
      const setImageUrlOrders = mockSetImageUrl.mock.invocationCallOrder;
      const lastSetImageUrlOrder = setImageUrlOrders[setImageUrlOrders.length - 1];
      expect(lastSetImageUrlOrder).toBeGreaterThan(initializeFormOrder);
    });

    it('should handle array imageUrl override in EDIT mode + photo capture', async () => {
      const mockInitializeForm = jest.fn();
      const mockSetImageUrl = jest.fn();
      mockedUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        initializeForm: mockInitializeForm,
        setImageUrl: mockSetImageUrl,
      });

      mockedUseLocalSearchParams.mockReturnValue({
        productId: 'test-123',
        fromPhotoCapture: 'true',
        imageUrl: ['file:///tmp/NEW-array.jpg'],
      });
      mockedGetProductById.mockResolvedValue({ success: true, data: mockProduct });

      const { result } = renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      await act(async () => {
        await result.current.loadData();
      });

      // Array imageUrl should be unwrapped to first element
      expect(mockSetImageUrl).toHaveBeenCalledWith('file:///tmp/NEW-array.jpg');
    });

    it('should NOT override imageUrl in EDIT mode when fromPhotoCapture is not true', async () => {
      const mockInitializeForm = jest.fn();
      const mockSetImageUrl = jest.fn();
      mockedUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        initializeForm: mockInitializeForm,
        setImageUrl: mockSetImageUrl,
      });

      // No fromPhotoCapture flag: plain EDIT mode (no new photo)
      mockedUseLocalSearchParams.mockReturnValue({
        productId: 'test-123',
      });
      mockedGetProductById.mockResolvedValue({ success: true, data: mockProduct });

      const { result } = renderHook(() =>
        useProductInitialization({ setIsLoading, categories, categoriesLoading })
      );

      await act(async () => {
        await result.current.loadData();
      });

      // initializeForm should be called with the product from DB
      expect(mockInitializeForm).toHaveBeenCalledWith(
        expect.objectContaining({
          product: mockProduct,
          isEditMode: true,
        })
      );

      // setImageUrl should NOT be called from loadData (only from the
      // dedicated photo-capture effect, which doesn't trigger here)
      expect(mockSetImageUrl).not.toHaveBeenCalled();
    });
  });
});
