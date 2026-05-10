import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useProductActions } from '../useProductActions';
import { ProductStorage } from '@/services/ProductStorage';
import { Product } from '@/types/Product';

jest.mock('react-native', () => {
  return {
    Alert: {
      alert: jest.fn(),
    },
  };
});

jest.mock('@/services/ProductStorage', () => ({
  ProductStorage: {
    updateProductStatus: jest.fn(),
    deleteProduct: jest.fn(),
    saveProduct: jest.fn(),
  },
}));

jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('useProductActions', () => {
  const mockRefreshProducts = jest.fn();
  const mockOnShowConsumeModal = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseProduct: Product = {
    id: '1',
    name: 'Latte',
    brand: '',
    category: 'dairy',
    expirationDate: '2025-10-10',
    purchaseDate: '2025-10-01',
    status: 'active',
    addedMethod: 'manual',
    addedAt: '2025-10-01',
    updatedAt: '2025-10-01',
    isFrozen: false,
    userId: 'user1',
    quantities: [{ quantity: 1, unit: 'units' }]
  };

  it('should handle direct consume successfully', async () => {
    (ProductStorage.updateProductStatus as jest.Mock).mockResolvedValue({ success: true });
    
    const { result } = renderHook(() => useProductActions({
      refreshProducts: mockRefreshProducts,
      onShowConsumeModal: mockOnShowConsumeModal,
    }));

    await act(async () => {
      await result.current.handleDirectConsume(baseProduct);
    });

    expect(ProductStorage.updateProductStatus).toHaveBeenCalledWith('1', 'consumed');
    expect(mockRefreshProducts).toHaveBeenCalled();
  });

  it('should handle direct consume failure', async () => {
    (ProductStorage.updateProductStatus as jest.Mock).mockResolvedValue({ success: false, error: new Error('Network error') });
    
    const { result } = renderHook(() => useProductActions({
      refreshProducts: mockRefreshProducts,
      onShowConsumeModal: mockOnShowConsumeModal,
    }));

    await act(async () => {
      await result.current.handleDirectConsume(baseProduct);
    });

    expect(ProductStorage.updateProductStatus).toHaveBeenCalledWith('1', 'consumed');
    expect(mockRefreshProducts).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalledWith('Errore', 'Si è verificato un errore durante il consumo del prodotto.');
  });

  it('should show consume modal', () => {
    const { result } = renderHook(() => useProductActions({
      refreshProducts: mockRefreshProducts,
      onShowConsumeModal: mockOnShowConsumeModal,
    }));

    act(() => {
      result.current.handleShowConsumeModal(baseProduct);
    });

    expect(mockOnShowConsumeModal).toHaveBeenCalledWith(baseProduct);
  });

  it('should handle product deletion successfully', async () => {
    (ProductStorage.deleteProduct as jest.Mock).mockResolvedValue({ success: true });
    
    const { result } = renderHook(() => useProductActions({
      refreshProducts: mockRefreshProducts,
      onShowConsumeModal: mockOnShowConsumeModal,
    }));

    await act(async () => {
      await result.current.handleDelete(baseProduct);
    });

    expect(ProductStorage.deleteProduct).toHaveBeenCalledWith('1');
    expect(mockRefreshProducts).toHaveBeenCalled();
  });

  it('should handle partial consume confirmation', async () => {
    (ProductStorage.saveProduct as jest.Mock).mockResolvedValue({ success: true });
    
    const multiQuantityProduct: Product = {
      ...baseProduct,
      quantities: [{ quantity: 5, unit: 'units' }, { quantity: 2, unit: 'units' }] // Total 7
    };

    const { result } = renderHook(() => useProductActions({
      refreshProducts: mockRefreshProducts,
      onShowConsumeModal: mockOnShowConsumeModal,
    }));

    await act(async () => {
      // Consume 6 out of 7. It should deduct from 5 first, then 1 from 2.
      // So remaining should be [{ quantity: 1, type: 'units' }]
      await result.current.handleConsumeConfirm(multiQuantityProduct, 6);
    });

    expect(ProductStorage.saveProduct).toHaveBeenCalled();
    const savedProduct = (ProductStorage.saveProduct as jest.Mock).mock.calls[0][0];
    expect(savedProduct.quantities).toEqual([{ quantity: 1, unit: 'units' }]);
    expect(mockRefreshProducts).toHaveBeenCalled();
  });

  it('should mark as consumed if all quantities are consumed', async () => {
    (ProductStorage.updateProductStatus as jest.Mock).mockResolvedValue({ success: true });
    
    const multiQuantityProduct: Product = {
      ...baseProduct,
      quantities: [{ quantity: 5, unit: 'units' }] 
    };

    const { result } = renderHook(() => useProductActions({
      refreshProducts: mockRefreshProducts,
      onShowConsumeModal: mockOnShowConsumeModal,
    }));

    await act(async () => {
      // Consume all 5
      await result.current.handleConsumeConfirm(multiQuantityProduct, 5);
    });

    expect(ProductStorage.updateProductStatus).toHaveBeenCalledWith('1', 'consumed');
    expect(mockRefreshProducts).toHaveBeenCalled();
  });
});
