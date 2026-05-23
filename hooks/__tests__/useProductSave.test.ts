// useProductSave.test.ts — useProductSave.test module.
//
// exports: none
// used_by: none
// rules: none
// agent: deepseek/deepseek-chat | deepseek | 2026-05-23 | codedna-cli | initial test creation
// message:

jest.mock('react-native-url-polyfill/auto');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@supabase/supabase-js');
jest.mock('@/services/ProductStorage');
jest.mock('@/services/CategoryService');
jest.mock('@/services/LoggingService');
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
  useLocalSearchParams: jest.fn(),
}));
jest.mock('react-native', () => {
  return {
    Alert: {
      alert: jest.fn(),
    },
  };
});

import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useProductSave } from '../useProductSave';
import { ProductStorage } from '@/services/ProductStorage';
import { useManualEntry } from '@/context/ManualEntryContext';
import { useLocalSearchParams, router } from 'expo-router';
import { LoggingService } from '@/services/LoggingService';
import { createSuccessResult, createErrorResult } from '@/types/ServiceResult';

jest.mock('@/context/ManualEntryContext', () => ({
  useManualEntry: jest.fn(),
}));

const mockUseManualEntry = useManualEntry as jest.MockedFunction<typeof useManualEntry>;
const mockUseLocalSearchParams = useLocalSearchParams as jest.MockedFunction<typeof useLocalSearchParams>;
const mockProductStorage = ProductStorage as jest.Mocked<typeof ProductStorage>;
const mockRouter = router as jest.Mocked<typeof router>;
const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;

const mockManualEntryContext = {
  name: 'Test Product',
  brand: 'Test Brand',
  selectedCategory: 'dairy',
  quantities: [{ quantity: '1', unit: 'pz' }],
  purchaseDate: '2025-01-01',
  expirationDate: '2025-12-31',
  notes: 'Test notes',
  barcode: '123456789',
  imageUrl: 'https://example.com/image.jpg',
  isEditMode: false,
  originalProductId: null,
  clearForm: jest.fn(),
  isFrozen: false,
  setName: jest.fn(),
  setBrand: jest.fn(),
  setSelectedCategory: jest.fn(),
  setQuantities: jest.fn(),
  setPurchaseDate: jest.fn(),
  setExpirationDate: jest.fn(),
  setNotes: jest.fn(),
  setBarcode: jest.fn(),
  setImageUrl: jest.fn(),
  setIsFrozen: jest.fn(),
  setIsEditMode: jest.fn(),
  setOriginalProductId: jest.fn(),
  setHasManuallySelectedCategory: jest.fn(),
  setIsInitialized: jest.fn(),
  addQuantity: jest.fn(),
  removeQuantity: jest.fn(),
  updateQuantity: jest.fn(),
  initializeForm: jest.fn(),
};

describe('useProductSave', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({});
    mockUseManualEntry.mockReturnValue(mockManualEntryContext as any);
    mockProductStorage.saveProduct.mockResolvedValue(createSuccessResult(undefined));
  });

  describe('Hook Initialization', () => {
    it('should initialize hook without errors', () => {
      const { result } = renderHook(() => useProductSave());

      expect(result.current).toBeDefined();
      expect(result.current.handleSaveProduct).toBeDefined();
      expect(typeof result.current.handleSaveProduct).toBe('function');
    });

    it('should return handleSaveProduct function', () => {
      const { result } = renderHook(() => useProductSave());

      expect(result.current.handleSaveProduct).toBeDefined();
      expect(typeof result.current.handleSaveProduct).toBe('function');
    });
  });

  describe('Product Validation', () => {
    it('should show alert when name is missing', async () => {
      mockUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        name: '',
      } as any);

      const { result } = renderHook(() => useProductSave());

      await act(async () => {
        await result.current.handleSaveProduct();
      });

      expect(mockAlert).toHaveBeenCalledWith(
        'Errore',
        'Per favore, compila tutti i campi obbligatori, inclusa almeno una quantità valida.'
      );
      expect(mockProductStorage.saveProduct).not.toHaveBeenCalled();
    });

    it('should show alert when category is missing', async () => {
      mockUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        selectedCategory: '',
      } as any);

      const { result } = renderHook(() => useProductSave());

      await act(async () => {
        await result.current.handleSaveProduct();
      });

      expect(mockAlert).toHaveBeenCalledWith(
        'Errore',
        'Per favore, compila tutti i campi obbligatori, inclusa almeno una quantità valida.'
      );
      expect(mockProductStorage.saveProduct).not.toHaveBeenCalled();
    });

    it('should show alert when quantities are empty', async () => {
      mockUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        quantities: [],
      } as any);

      const { result } = renderHook(() => useProductSave());

      await act(async () => {
        await result.current.handleSaveProduct();
      });

      expect(mockAlert).toHaveBeenCalledWith(
        'Errore',
        'Per favore, compila tutti i campi obbligatori, inclusa almeno una quantità valida.'
      );
      expect(mockProductStorage.saveProduct).not.toHaveBeenCalled();
    });

    it('should show alert when quantity is invalid', async () => {
      mockUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        quantities: [{ quantity: '', unit: 'pz' }],
      } as any);

      const { result } = renderHook(() => useProductSave());

      await act(async () => {
        await result.current.handleSaveProduct();
      });

      expect(mockAlert).toHaveBeenCalledWith(
        'Errore',
        'Per favore, compila tutti i campi obbligatori, inclusa almeno una quantità valida.'
      );
      expect(mockProductStorage.saveProduct).not.toHaveBeenCalled();
    });

    it('should show alert when purchase date is missing', async () => {
      mockUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        purchaseDate: '',
      } as any);

      const { result } = renderHook(() => useProductSave());

      await act(async () => {
        await result.current.handleSaveProduct();
      });

      expect(mockAlert).toHaveBeenCalledWith(
        'Errore',
        'Per favore, compila tutti i campi obbligatori, inclusa almeno una quantità valida.'
      );
      expect(mockProductStorage.saveProduct).not.toHaveBeenCalled();
    });

    it('should show alert when expiration date is missing', async () => {
      mockUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        expirationDate: '',
      } as any);

      const { result } = renderHook(() => useProductSave());

      await act(async () => {
        await result.current.handleSaveProduct();
      });

      expect(mockAlert).toHaveBeenCalledWith(
        'Errore',
        'Per favore, compila tutti i campi obbligatori, inclusa almeno una quantità valida.'
      );
      expect(mockProductStorage.saveProduct).not.toHaveBeenCalled();
    });
  });

  describe('Product Saving', () => {
    it('should save product successfully with all required fields', async () => {
      const { result } = renderHook(() => useProductSave());

      await act(async () => {
        await result.current.handleSaveProduct();
      });

      expect(mockProductStorage.saveProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Product',
          brand: 'Test Brand',
          category: 'dairy',
          quantities: [{ quantity: 1, unit: 'pz' }],
          purchaseDate: '2025-01-01',
          expirationDate: '2025-12-31',
          notes: 'Test notes',
          barcode: '123456789',
          imageUrl: 'https://example.com/image.jpg',
          isFrozen: false,
        })
      );
    });

    it('should save product with default brand when empty', async () => {
      mockUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        brand: '',
      } as any);

      const { result } = renderHook(() => useProductSave());

      await act(async () => {
        await result.current.handleSaveProduct();
      });

      expect(mockProductStorage.saveProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          brand: '',
        })
      );
    });

    it('should save product with default notes when undefined', async () => {
      mockUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        notes: undefined,
      } as any);

      const { result } = renderHook(() => useProductSave());

      await act(async () => {
        await result.current.handleSaveProduct();
      });

      expect(mockProductStorage.saveProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: '',
        })
      );
    });

    it('should handle quantity with comma as decimal separator', async () => {
      mockUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        quantities: [{ quantity: '1,5', unit: 'kg' }],
      } as any);

      const { result } = renderHook(() => useProductSave());

      await act(async () => {
        await result.current.handleSaveProduct();
      });

      expect(mockProductStorage.saveProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          quantities: [{ quantity: 1.5, unit: 'kg' }],
        })
      );
    });

    it('should set addedMethod to photo when from photo capture', async () => {
      mockUseLocalSearchParams.mockReturnValue({ addedMethod: 'photo' } as any);

      const { result } = renderHook(() => useProductSave());

      await act(async () => {
        await result.current.handleSaveProduct();
      });

      expect(mockProductStorage.saveProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          addedMethod: 'photo',
        })
      );
    });

    it('should set addedMethod to barcode when barcode is present', async () => {
      mockUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        barcode: '123456789',
      } as any);

      const { result } = renderHook(() => useProductSave());

      await act(async () => {
        await result.current.handleSaveProduct();
      });

      expect(mockProductStorage.saveProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          addedMethod: 'barcode',
        })
      );
    });

    it('should set addedMethod to manual when no barcode and not from photo', async () => {
      mockUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        barcode: undefined,
      } as any);

      const { result } = renderHook(() => useProductSave());

      await act(async () => {
        await result.current.handleSaveProduct();
      });

      expect(mockProductStorage.saveProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          addedMethod: 'manual',
        })
      );
    });
  });

  describe('Edit Mode', () => {
    it('should save product in edit mode with original ID', async () => {
      mockUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        isEditMode: true,
        originalProductId: 'product-123',
      } as any);

      const { result } = renderHook(() => useProductSave());

      await act(async () => {
        await result.current.handleSaveProduct();
      });

      expect(mockProductStorage.saveProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'product-123',
        })
      );
    });

    it('should show update alert and replace route in edit mode on success', async () => {
      mockUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        isEditMode: true,
        originalProductId: 'product-123',
      } as any);

      const { result } = renderHook(() => useProductSave());

      await act(async () => {
        await result.current.handleSaveProduct();
      });

      expect(mockAlert).toHaveBeenCalledWith(
        'Prodotto Aggiornato',
        'Test Product è stato aggiornato con successo.'
      );
      expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/products');
    });
  });

  describe('Success Flow', () => {
    it('should show success alert with multiple options for new product', async () => {
      const { result } = renderHook(() => useProductSave());

      await act(async () => {
        await result.current.handleSaveProduct();
      });

      expect(mockAlert).toHaveBeenCalledWith(
        'Prodotto Salvato',
        'Test Product è stato aggiunto. Cosa vuoi fare ora?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Aggiungi Manualmente' }),
          expect.objectContaining({ text: 'Scansiona Codice' }),
          expect.objectContaining({ text: 'Finito' }),
        ]),
        expect.objectContaining({ cancelable: false })
      );
    });

    it('should call clearForm when user chooses Aggiungi Manualmente', async () => {
      const mockClearForm = jest.fn();
      mockUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        clearForm: mockClearForm,
      } as any);

      const { result } = renderHook(() => useProductSave());

      await act(async () => {
        await result.current.handleSaveProduct();
      });

      mockAlert.mock.calls[0][2]?.find((btn: any) => btn.text === 'Aggiungi Manualmente')?.onPress?.();

      expect(mockClearForm).toHaveBeenCalled();
    });

    it('should call clearForm and navigate to scanner when user chooses Scansiona Codice', async () => {
      const mockClearForm = jest.fn();
      mockUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        clearForm: mockClearForm,
      } as any);

      const { result } = renderHook(() => useProductSave());

      await act(async () => {
        await result.current.handleSaveProduct();
      });

      mockAlert.mock.calls[0][2]?.find((btn: any) => btn.text === 'Scansiona Codice')?.onPress?.();

      expect(mockClearForm).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith('/scanner');
    });

    it('should call clearForm and navigate to products when user chooses Finito', async () => {
      const mockClearForm = jest.fn();
      mockUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        clearForm: mockClearForm,
      } as any);

      const { result } = renderHook(() => useProductSave());

      await act(async () => {
        await result.current.handleSaveProduct();
      });

      mockAlert.mock.calls[0][2]?.find((btn: any) => btn.text === 'Finito')?.onPress?.();

      expect(mockClearForm).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/products');
    });
  });

describe('Error Handling', () => {
  beforeEach(() => {
    // Reset mocks
    mockProductStorage.saveProduct.mockReset();
  });

  it('should show generic error alert on save failure', async () => {
    mockProductStorage.saveProduct.mockRejectedValue(new Error('Save error'));

    const { result } = renderHook(() => useProductSave());

    await act(async () => {
      await result.current.handleSaveProduct();
    });

    expect(mockAlert).toHaveBeenCalledWith(
      'Errore',
      expect.stringContaining('Save error')
    );
  });

  it('should show timeout error with retry option', async () => {
    mockProductStorage.saveProduct.mockRejectedValue(new Error('Timeout'));

    const { result } = renderHook(() => useProductSave());

    await act(async () => {
      await result.current.handleSaveProduct();
    });

    expect(mockAlert).toHaveBeenCalledWith(
      'Timeout',
      expect.stringContaining('Il salvataggio ha impiegato troppo tempo'),
      expect.arrayContaining([
        expect.objectContaining({ text: 'OK' }),
        expect.objectContaining({ text: 'Riprova' }),
      ])
    );
  });

  it('should log error on save failure', async () => {
    const mockError = new Error('Save failed');
    mockProductStorage.saveProduct.mockRejectedValue(mockError);

    const { result } = renderHook(() => useProductSave());

    await act(async () => {
      await result.current.handleSaveProduct();
    });

    expect(LoggingService.error).toHaveBeenCalledWith(
      'useProductSave',
      'Errore durante il salvataggio del prodotto:',
      expect.any(Error)
    );
  });
  });

  describe('Logging', () => {
    it('should log product save attempt with product details', async () => {
      const { result } = renderHook(() => useProductSave());

      await act(async () => {
        await result.current.handleSaveProduct();
      });

      expect(LoggingService.info).toHaveBeenCalledWith(
        'useProductSave',
        expect.stringContaining('handleSaveProduct called')
      );
    });

    it('should log validation failure', async () => {
      mockUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        name: '',
      } as any);

      const { result } = renderHook(() => useProductSave());

      await act(async () => {
        await result.current.handleSaveProduct();
      });

      expect(LoggingService.error).toHaveBeenCalledWith(
        'useProductSave',
        'Validation failed - missing required fields'
      );
    });

    it('should log successful save', async () => {
      const { result } = renderHook(() => useProductSave());

      await act(async () => {
        await result.current.handleSaveProduct();
      });

      expect(LoggingService.info).toHaveBeenCalledWith(
        'useProductSave',
        expect.stringContaining('Product saved successfully')
      );
    });
  });

  describe('Frozen Products', () => {
    it('should save product with isFrozen flag when set', async () => {
      mockUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        isFrozen: true,
      } as any);

      const { result } = renderHook(() => useProductSave());

      await act(async () => {
        await result.current.handleSaveProduct();
      });

      expect(mockProductStorage.saveProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          isFrozen: true,
        })
      );
    });

    it('should save product with isFrozen false when not frozen', async () => {
      mockUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        isFrozen: false,
      } as any);

      const { result } = renderHook(() => useProductSave());

      await act(async () => {
        await result.current.handleSaveProduct();
      });

      expect(mockProductStorage.saveProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          isFrozen: false,
        })
      );
    });
  });

  describe('Image URL Handling', () => {
    it('should save product with image URL when provided', async () => {
      mockUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        imageUrl: 'https://example.com/image.jpg',
      } as any);

      const { result } = renderHook(() => useProductSave());

      await act(async () => {
        await result.current.handleSaveProduct();
      });

      expect(mockProductStorage.saveProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: 'https://example.com/image.jpg',
        })
      );
    });

    it('should save product with undefined image URL when null', async () => {
      mockUseManualEntry.mockReturnValue({
        ...mockManualEntryContext,
        imageUrl: null,
      } as any);

      const { result } = renderHook(() => useProductSave());

      await act(async () => {
        await result.current.handleSaveProduct();
      });

      expect(mockProductStorage.saveProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: undefined,
        })
      );
    });
  });
});
