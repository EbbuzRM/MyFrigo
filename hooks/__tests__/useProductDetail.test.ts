import { renderHook, act } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useProductDetail } from '../useProductDetail';
import { ProductStorage } from '@/services/ProductStorage';
import { Alert } from 'react-native';
import { createSuccessResult, createErrorResult } from '@/types/ServiceResult';

// Mock delle dipendenze
jest.mock('expo-router');
jest.mock('@/services/ProductStorage');

const mockRouter = router as jest.Mocked<typeof router>;
const mockProductStorage = ProductStorage as jest.Mocked<typeof ProductStorage>;

describe('useProductDetail', () => {
  const mockProduct = {
    id: 'test-id',
    name: 'Test Product',
    brand: 'Test Brand',
    category: 'test-category',
    quantities: [{ quantity: 2, unit: 'pz' }],
    expirationDate: '2024-12-31',
    purchaseDate: '2024-01-01',
    status: 'active' as const,
    addedMethod: 'manual' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.back = jest.fn();
    mockRouter.push = jest.fn();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useProductDetail('test-id'));

    expect(result.current.state).toEqual({
      product: null,
      isLoading: true,
      error: undefined,
      isModalVisible: false,
      toastVisible: false,
      toastMessage: '',
      toastType: 'success',
      relatedIcons: [],
    });
    expect(typeof result.current.actions.loadProduct).toBe('function');
    expect(typeof result.current.actions.handleConsume).toBe('function');
    expect(typeof result.current.actions.handleDelete).toBe('function');
  });

  it('should load product successfully', async () => {
    mockProductStorage.getProductById.mockResolvedValue(createSuccessResult(mockProduct));

    const { result } = renderHook(() => useProductDetail('test-id'));

    await act(async () => {
      await result.current.actions.loadProduct();
    });

    expect(result.current.state.product).toEqual(mockProduct);
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.error).toBeUndefined();
    expect(mockProductStorage.getProductById).toHaveBeenCalledWith('test-id');
  });

  it('should handle product loading error', async () => {
    const mockError = new Error('Product not found');
    mockProductStorage.getProductById.mockResolvedValue(createErrorResult(mockError));

    const { result } = renderHook(() => useProductDetail('test-id'));

    await act(async () => {
      await result.current.actions.loadProduct();
    });

    expect(result.current.state.product).toBeNull();
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.error).toBe('Prodotto non trovato');
  });

  it('should handle consume action for single quantity', async () => {
    const singleQuantityProduct = {
      ...mockProduct,
      quantities: [{ quantity: 1, unit: 'pz' }],
    };
    mockProductStorage.getProductById.mockResolvedValue(createSuccessResult(singleQuantityProduct));
    mockProductStorage.saveProduct.mockResolvedValue(createSuccessResult(undefined));

    const { result } = renderHook(() => useProductDetail('test-id'));

    // Prima carica il prodotto
    await act(async () => {
      await result.current.actions.loadProduct();
    });

    // Poi testa il consume
    await act(async () => {
      await result.current.actions.handleModalConfirm(1);
    });

    expect(mockProductStorage.saveProduct).toHaveBeenCalled();
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('should handle consume action for multiple quantities', async () => {
    mockProductStorage.getProductById.mockResolvedValue(createSuccessResult(mockProduct));
    mockProductStorage.saveProduct.mockResolvedValue(createSuccessResult(undefined));

    const { result } = renderHook(() => useProductDetail('test-id'));

    // Prima carica il prodotto
    await act(async () => {
      await result.current.actions.loadProduct();
    });

    // Poi testa il consume (dovrebbe aprire il modale)
    act(() => {
      result.current.actions.handleConsume();
    });

    expect(result.current.state.isModalVisible).toBe(true);
  });

  it('should handle delete action with confirmation', async () => {
    mockProductStorage.getProductById.mockResolvedValue(createSuccessResult(mockProduct));
    mockProductStorage.deleteProduct.mockResolvedValue(createSuccessResult(undefined));

    const { result } = renderHook(() => useProductDetail('test-id'));

    // Prima carica il prodotto
    await act(async () => {
      await result.current.actions.loadProduct();
    });

    // Mock Alert.alert per simulare conferma
    (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
      // Simula click su "Elimina"
      buttons?.[1]?.onPress?.();
    });

    await act(async () => {
      await result.current.actions.handleDelete();
    });

    expect(mockProductStorage.deleteProduct).toHaveBeenCalledWith('test-id');
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('should handle edit action', async () => {
    mockProductStorage.getProductById.mockResolvedValue(createSuccessResult(mockProduct));

    const { result } = renderHook(() => useProductDetail('test-id'));

    // Prima carica il prodotto
    await act(async () => {
      await result.current.actions.loadProduct();
    });

    act(() => {
      result.current.actions.handleEdit();
    });

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/manual-entry',
      params: {
        productId: 'test-id'
      }
    });
  });

  it('should show toast messages correctly', () => {
    const { result } = renderHook(() => useProductDetail('test-id'));

    act(() => {
      result.current.actions.showToast('Test message', 'success');
    });

    expect(result.current.state.toastMessage).toBe('Test message');
    expect(result.current.state.toastType).toBe('success');
    expect(result.current.state.toastVisible).toBe(true);

    act(() => {
      result.current.actions.hideToast();
    });

    expect(result.current.state.toastVisible).toBe(false);
  });

  it('should compute canConsume correctly', async () => {
    mockProductStorage.getProductById.mockResolvedValue(createSuccessResult(mockProduct));

    const { result } = renderHook(() => useProductDetail('test-id'));

    // Prima carica il prodotto
    await act(async () => {
      await result.current.actions.loadProduct();
    });

    expect(result.current.computed.canConsume).toBe(true);
    expect(result.current.computed.totalQuantity).toBe(2);
    expect(result.current.computed.isSingleQuantity).toBe(false);
  });

  it('should handle invalid product ID', async () => {
    const { result } = renderHook(() => useProductDetail(undefined));

    await act(async () => {
      await result.current.actions.loadProduct();
    });

    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.error).toBe('ID prodotto non valido');
  });

  it('should handle partial consumption correctly', async () => {
    const multiQuantityProduct = {
      ...mockProduct,
      quantities: [
        { quantity: 3, unit: 'pz' },
        { quantity: 2, unit: 'pz' }
      ],
    };

    mockProductStorage.getProductById.mockResolvedValue(createSuccessResult(multiQuantityProduct));
    mockProductStorage.saveProduct.mockResolvedValue(createSuccessResult(undefined));

    const { result } = renderHook(() => useProductDetail('test-id'));

    // Prima carica il prodotto
    await act(async () => {
      await result.current.actions.loadProduct();
    });

    // Consuma 2 elementi
    await act(async () => {
      await result.current.actions.handleModalConfirm(2);
    });

    expect(mockProductStorage.saveProduct).toHaveBeenCalled();
    expect(mockRouter.back).toHaveBeenCalled();
  });
});