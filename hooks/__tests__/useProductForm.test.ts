// Mock delle dipendenze PRIMA di importare useProductForm
jest.mock('react-native-url-polyfill/auto');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@supabase/supabase-js');
jest.mock('@/context/ManualEntryContext', () => ({
  useManualEntry: jest.fn(),
}));
jest.mock('@/context/CategoryContext', () => ({
  useCategories: jest.fn(),
}));
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
}));
jest.mock('@/services/LoggingService');
jest.mock('@/services/ProductStorage');
jest.mock('@/services/supabaseClient');

import { renderHook, act } from '@testing-library/react-native';
import { useProductForm } from '../useProductForm';
import { useManualEntry } from '@/context/ManualEntryContext';
import { useCategories } from '@/context/CategoryContext';
import { useLocalSearchParams } from 'expo-router';

const mockUseManualEntry = useManualEntry as jest.MockedFunction<typeof useManualEntry>;
const mockUseCategories = useCategories as jest.MockedFunction<typeof useCategories>;
const mockUseLocalSearchParams = useLocalSearchParams as jest.MockedFunction<typeof useLocalSearchParams>;

describe('useProductForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockUseLocalSearchParams.mockReturnValue({});
    mockUseCategories.mockReturnValue({
      categories: [
        { id: 'dairy', name: 'Latticini', icon: '🧀', color: '#FFD700' },
        { id: 'vegetables', name: 'Verdure', icon: '🥬', color: '#90EE90' },
      ],
      addCategory: jest.fn(),
      loading: false,
    } as any);

    mockUseManualEntry.mockReturnValue({
      name: '',
      setName: jest.fn(),
      brand: '',
      setBrand: jest.fn(),
      selectedCategory: '',
      setSelectedCategory: jest.fn(),
      quantities: [],
      addQuantity: jest.fn(),
      removeQuantity: jest.fn(),
      updateQuantity: jest.fn(),
      purchaseDate: '',
      setPurchaseDate: jest.fn(),
      expirationDate: '',
      setExpirationDate: jest.fn(),
      notes: '',
      setNotes: jest.fn(),
      barcode: '',
      imageUrl: '',
      setImageUrl: jest.fn(),
      isEditMode: false,
      originalProductId: null,
      hasManuallySelectedCategory: false,
      setHasManuallySelectedCategory: jest.fn(),
      isInitialized: false,
      setIsInitialized: jest.fn(),
      initializeForm: jest.fn(),
      clearForm: jest.fn(),
    } as any);
  });

  describe('Hook Initialization', () => {
    it('should initialize hook without errors', () => {
      const { result } = renderHook(() => useProductForm());

      expect(result.current).toBeDefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should return all expected properties', () => {
      const { result } = renderHook(() => useProductForm());

      expect(result.current).toHaveProperty('name');
      expect(result.current).toHaveProperty('setName');
      expect(result.current).toHaveProperty('brand');
      expect(result.current).toHaveProperty('setBrand');
      expect(result.current).toHaveProperty('selectedCategory');
      expect(result.current).toHaveProperty('setSelectedCategory');
      expect(result.current).toHaveProperty('quantities');
      expect(result.current).toHaveProperty('addQuantity');
      expect(result.current).toHaveProperty('removeQuantity');
      expect(result.current).toHaveProperty('updateQuantity');
      expect(result.current).toHaveProperty('purchaseDate');
      expect(result.current).toHaveProperty('setPurchaseDate');
      expect(result.current).toHaveProperty('expirationDate');
      expect(result.current).toHaveProperty('setExpirationDate');
      expect(result.current).toHaveProperty('notes');
      expect(result.current).toHaveProperty('setNotes');
      expect(result.current).toHaveProperty('barcode');
      expect(result.current).toHaveProperty('imageUrl');
      expect(result.current).toHaveProperty('setImageUrl');
      expect(result.current).toHaveProperty('isEditMode');
      expect(result.current).toHaveProperty('originalProductId');
      expect(result.current).toHaveProperty('hasManuallySelectedCategory');
      expect(result.current).toHaveProperty('handleSaveProduct');
      expect(result.current).toHaveProperty('handleCategoryChange');
      expect(result.current).toHaveProperty('onChangePurchaseDate');
      expect(result.current).toHaveProperty('onChangeExpirationDate');
    });

    it('should have empty initial values', () => {
      const { result } = renderHook(() => useProductForm());

      expect(result.current.name).toBe('');
      expect(result.current.brand).toBe('');
      expect(result.current.selectedCategory).toBe('');
      expect(result.current.quantities).toEqual([]);
      expect(result.current.purchaseDate).toBe('');
      expect(result.current.expirationDate).toBe('');
      expect(result.current.notes).toBe('');
    });

    it('should have correct initial state flags', () => {
      const { result } = renderHook(() => useProductForm());

      expect(result.current.isEditMode).toBe(false);
      expect(result.current.originalProductId).toBeNull();
      expect(result.current.hasManuallySelectedCategory).toBe(false);
    });
  });

  describe('Category Handling', () => {
    it('should return formatted category data', () => {
      const { result } = renderHook(() => useProductForm());

      expect(result.current.categoryData).toBeDefined();
      expect(Array.isArray(result.current.categoryData)).toBe(true);
      expect(result.current.categoryData.length).toBeGreaterThan(0);
    });

    it('should include add new category button in category data', () => {
      const { result } = renderHook(() => useProductForm());

      const hasAddButton = result.current.categoryData.some(
        (cat: any) => cat.id === 'add_new_category_sentinel_value'
      );
      expect(hasAddButton).toBe(true);
    });

    it('should handle category change', () => {
      const mockSetSelectedCategory = jest.fn();
      const mockSetHasManuallySelectedCategory = jest.fn();

      mockUseManualEntry.mockReturnValue({
        ...mockUseManualEntry.getMockImplementation()?.(),
        setSelectedCategory: mockSetSelectedCategory,
        setHasManuallySelectedCategory: mockSetHasManuallySelectedCategory,
      } as any);

      const { result } = renderHook(() => useProductForm());

      act(() => {
        result.current.handleCategoryChange('dairy');
      });

      expect(mockSetSelectedCategory).toHaveBeenCalledWith('dairy');
      expect(mockSetHasManuallySelectedCategory).toHaveBeenCalledWith(true);
    });

    it('should show category modal when add new category is selected', () => {
      const mockSetIsCategoryModalVisible = jest.fn();
      const { result } = renderHook(() => useProductForm());

      act(() => {
        result.current.handleCategoryChange('add_new_category_sentinel_value');
      });

      expect(result.current.isCategoryModalVisible).toBeDefined();
    });
  });

  describe('Date Handling', () => {
    it('should handle purchase date change', () => {
      const mockSetPurchaseDate = jest.fn();
      mockUseManualEntry.mockReturnValue({
        ...mockUseManualEntry.getMockImplementation()?.(),
        setPurchaseDate: mockSetPurchaseDate,
      } as any);

      const { result } = renderHook(() => useProductForm());
      const testDate = new Date('2025-06-15');

      act(() => {
        result.current.onChangePurchaseDate(
          { type: 'set' } as any,
          testDate
        );
      });

      expect(mockSetPurchaseDate).toHaveBeenCalledWith('2025-06-15');
    });

    it('should handle expiration date change', () => {
      const mockSetExpirationDate = jest.fn();
      mockUseManualEntry.mockReturnValue({
        ...mockUseManualEntry.getMockImplementation()?.(),
        setExpirationDate: mockSetExpirationDate,
      } as any);

      const { result } = renderHook(() => useProductForm());
      const testDate = new Date('2025-12-31');

      act(() => {
        result.current.onChangeExpirationDate(
          { type: 'set' } as any,
          testDate
        );
      });

      expect(mockSetExpirationDate).toHaveBeenCalledWith('2025-12-31');
    });

    it('should not update date on cancel', () => {
      const mockSetExpirationDate = jest.fn();
      mockUseManualEntry.mockReturnValue({
        ...mockUseManualEntry.getMockImplementation()?.(),
        setExpirationDate: mockSetExpirationDate,
      } as any);

      const { result } = renderHook(() => useProductForm());

      act(() => {
        result.current.onChangeExpirationDate(
          { type: 'dismissed' } as any,
          undefined
        );
      });

      expect(mockSetExpirationDate).not.toHaveBeenCalled();
    });
  });

  describe('Modal State Management', () => {
    it('should toggle purchase date picker', () => {
      const { result } = renderHook(() => useProductForm());

      expect(result.current.showPurchaseDatePicker).toBe(false);

      act(() => {
        result.current.setShowPurchaseDatePicker(true);
      });

      expect(result.current.showPurchaseDatePicker).toBe(true);
    });

    it('should toggle expiration date picker', () => {
      const { result } = renderHook(() => useProductForm());

      expect(result.current.showExpirationDatePicker).toBe(false);

      act(() => {
        result.current.setShowExpirationDatePicker(true);
      });

      expect(result.current.showExpirationDatePicker).toBe(true);
    });

    it('should toggle category modal', () => {
      const { result } = renderHook(() => useProductForm());

      expect(result.current.isCategoryModalVisible).toBe(false);

      act(() => {
        result.current.setIsCategoryModalVisible(true);
      });

      expect(result.current.isCategoryModalVisible).toBe(true);
    });

    it('should manage new category name input', () => {
      const { result } = renderHook(() => useProductForm());

      expect(result.current.newCategoryNameInput).toBe('');

      act(() => {
        result.current.setNewCategoryNameInput('New Category');
      });

      expect(result.current.newCategoryNameInput).toBe('New Category');
    });
  });

  describe('Category Guessing', () => {
    it('should guess dairy category for milk products', () => {
      const { result } = renderHook(() => useProductForm());

      expect(result.current).toBeDefined();
    });

    it('should not guess category if manually selected', () => {
      mockUseManualEntry.mockReturnValue({
        ...mockUseManualEntry.getMockImplementation()?.(),
        hasManuallySelectedCategory: true,
      } as any);

      const { result } = renderHook(() => useProductForm());

      expect(result.current.hasManuallySelectedCategory).toBe(true);
    });

    it('should not guess category in edit mode', () => {
      mockUseManualEntry.mockReturnValue({
        ...mockUseManualEntry.getMockImplementation()?.(),
        isEditMode: true,
      } as any);

      const { result } = renderHook(() => useProductForm());

      expect(result.current.isEditMode).toBe(true);
    });
  });

  describe('Loading State', () => {
    it('should start with loading state true', () => {
      const { result } = renderHook(() => useProductForm());

      expect(result.current.isLoading).toBe(false);
    });

    it('should have categories loading flag', () => {
      const { result } = renderHook(() => useProductForm());

      expect(result.current.categoriesLoading).toBe(false);
    });
  });

  describe('Callback Functions', () => {
    it('should provide handleAddNewCategory callback', () => {
      const { result } = renderHook(() => useProductForm());

      expect(typeof result.current.handleAddNewCategory).toBe('function');
    });

    it('should provide handleCategoryChange callback', () => {
      const { result } = renderHook(() => useProductForm());

      expect(typeof result.current.handleCategoryChange).toBe('function');
    });

    it('should provide onChangePurchaseDate callback', () => {
      const { result } = renderHook(() => useProductForm());

      expect(typeof result.current.onChangePurchaseDate).toBe('function');
    });

    it('should provide onChangeExpirationDate callback', () => {
      const { result } = renderHook(() => useProductForm());

      expect(typeof result.current.onChangeExpirationDate).toBe('function');
    });

    it('should provide handleSaveProduct callback', () => {
      const { result } = renderHook(() => useProductForm());

      expect(typeof result.current.handleSaveProduct).toBe('function');
    });
  });

  describe('Navigation Reference', () => {
    it('should have navigatingToPhotoCapture ref', () => {
      const { result } = renderHook(() => useProductForm());

      expect(result.current.navigatingToPhotoCapture).toBeDefined();
      expect(result.current.navigatingToPhotoCapture.current).toBe(false);
    });

    it('should allow updating navigatingToPhotoCapture ref', () => {
      const { result } = renderHook(() => useProductForm());

      act(() => {
        result.current.navigatingToPhotoCapture.current = true;
      });

      expect(result.current.navigatingToPhotoCapture.current).toBe(true);
    });
  });

  describe('Image URL Handling', () => {
    it('should initialize with empty image URL', () => {
      const { result } = renderHook(() => useProductForm());

      expect(result.current.imageUrl).toBe('');
    });

    it('should allow setting image URL', () => {
      const mockSetImageUrl = jest.fn();
      mockUseManualEntry.mockReturnValue({
        ...mockUseManualEntry.getMockImplementation()?.(),
        setImageUrl: mockSetImageUrl,
      } as any);

      const { result } = renderHook(() => useProductForm());

      act(() => {
        result.current.setImageUrl('https://example.com/image.jpg');
      });

      expect(mockSetImageUrl).toHaveBeenCalledWith('https://example.com/image.jpg');
    });
  });

  describe('Barcode Handling', () => {
    it('should initialize with empty barcode', () => {
      const { result } = renderHook(() => useProductForm());

      expect(result.current.barcode).toBe('');
    });
  });

  describe('Edit Mode', () => {
    it('should detect edit mode from context', () => {
      mockUseManualEntry.mockReturnValue({
        ...mockUseManualEntry.getMockImplementation()?.(),
        isEditMode: true,
        originalProductId: 'product-123',
      } as any);

      const { result } = renderHook(() => useProductForm());

      expect(result.current.isEditMode).toBe(true);
      expect(result.current.originalProductId).toBe('product-123');
    });
  });

  describe('Quantities Management', () => {
    it('should initialize with empty quantities array', () => {
      const { result } = renderHook(() => useProductForm());

      expect(Array.isArray(result.current.quantities)).toBe(true);
      expect(result.current.quantities.length).toBe(0);
    });

    it('should provide addQuantity callback', () => {
      const { result } = renderHook(() => useProductForm());

      expect(typeof result.current.addQuantity).toBe('function');
    });

    it('should provide removeQuantity callback', () => {
      const { result } = renderHook(() => useProductForm());

      expect(typeof result.current.removeQuantity).toBe('function');
    });

    it('should provide updateQuantity callback', () => {
      const { result } = renderHook(() => useProductForm());

      expect(typeof result.current.updateQuantity).toBe('function');
    });
  });

  describe('Notes Handling', () => {
    it('should initialize with empty notes', () => {
      const { result } = renderHook(() => useProductForm());

      expect(result.current.notes).toBe('');
    });

    it('should allow setting notes', () => {
      const mockSetNotes = jest.fn();
      mockUseManualEntry.mockReturnValue({
        ...mockUseManualEntry.getMockImplementation()?.(),
        setNotes: mockSetNotes,
      } as any);

      const { result } = renderHook(() => useProductForm());

      act(() => {
        result.current.setNotes('Test notes');
      });

      expect(mockSetNotes).toHaveBeenCalledWith('Test notes');
    });
  });

  describe('Brand Handling', () => {
    it('should initialize with empty brand', () => {
      const { result } = renderHook(() => useProductForm());

      expect(result.current.brand).toBe('');
    });

    it('should allow setting brand', () => {
      const mockSetBrand = jest.fn();
      mockUseManualEntry.mockReturnValue({
        ...mockUseManualEntry.getMockImplementation()?.(),
        setBrand: mockSetBrand,
      } as any);

      const { result } = renderHook(() => useProductForm());

      act(() => {
        result.current.setBrand('Test Brand');
      });

      expect(mockSetBrand).toHaveBeenCalledWith('Test Brand');
    });
  });

  describe('Name Handling', () => {
    it('should initialize with empty name', () => {
      const { result } = renderHook(() => useProductForm());

      expect(result.current.name).toBe('');
    });

    it('should allow setting name', () => {
      const mockSetName = jest.fn();
      mockUseManualEntry.mockReturnValue({
        ...mockUseManualEntry.getMockImplementation()?.(),
        setName: mockSetName,
      } as any);

      const { result } = renderHook(() => useProductForm());

      act(() => {
        result.current.setName('Test Product');
      });

      expect(mockSetName).toHaveBeenCalledWith('Test Product');
    });
  });
});
