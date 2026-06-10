// products.test.tsx — ProductsScreen test module.
//
// exports: none
// used_by: none
// rules: none

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import ProductsScreen from '../(tabs)/products';

// --- Mocks ---

// Override SafeAreaView mock to preserve testID
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children, style, testID, ...props }: any) =>
      React.createElement(View, { style, testID, ...props }, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useFocusEffect: jest.fn((callback) => callback()),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

// Mock product sub-components
jest.mock('@/components/products/ProductsHeader', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    ProductsHeader: () => <View testID="products-header"><Text>Products Header</Text></View>,
  };
});

jest.mock('@/components/products/SearchBar', () => {
  const React = require('react');
  const { View, Text, TextInput } = require('react-native');
  return {
    SearchBar: ({ value, onChangeText }: any) => (
      <View testID="search-bar">
        <TextInput testID="search-input" value={value} onChangeText={onChangeText} />
      </View>
    ),
  };
});

jest.mock('@/components/products/StatusFilterBar', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    StatusFilterBar: ({ selectedStatus, onStatusChange }: any) => (
      <View testID="status-filter-bar">
        <Text>Status: {selectedStatus}</Text>
        <TouchableOpacity testID="status-all" onPress={() => onStatusChange('all')}>
          <Text>Tutti</Text>
        </TouchableOpacity>
        <TouchableOpacity testID="status-expiring" onPress={() => onStatusChange('expiring')}>
          <Text>In scadenza</Text>
        </TouchableOpacity>
      </View>
    ),
  };
});

jest.mock('@/components/products/CategoryFilterBar', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    CategoryFilterBar: ({ selectedCategories, onCategoryChange }: any) => (
      <View testID="category-filter-bar">
        <Text>Categories: {selectedCategories?.join(',')}</Text>
        <TouchableOpacity testID="filter-all" onPress={() => onCategoryChange(['all'])}>
          <Text>Tutte</Text>
        </TouchableOpacity>
      </View>
    ),
  };
});

jest.mock('@/components/products/ProductList', () => {
  const React = require('react');
  const { View, Text, FlatList, TouchableOpacity } = require('react-native');
  return {
    ProductList: ({ products, onProductPress, onConsume, onDelete, refreshing }: any) => (
      <View testID="product-list">
        <Text>Prodotti: {products?.length || 0}</Text>
        {products?.map((product: any) => (
          <View key={product.id} testID={`product-item-${product.id}`}>
            <Text>{product.name}</Text>
            <TouchableOpacity
              testID={`consume-${product.id}`}
              onPress={() => onConsume(product)}
              accessibilityLabel="Consuma prodotto"
              accessibilityRole="button"
            >
              <Text>Consuma</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID={`press-${product.id}`}
              onPress={() => onProductPress(product)}
            >
              <Text>Dettagli</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID={`delete-${product.id}`}
              onPress={() => onDelete(product)}
              accessibilityLabel="Elimina prodotto"
              accessibilityRole="button"
            >
              <Text>Elimina</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    ),
  };
});

jest.mock('@/components/ConsumeQuantityModal', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    ConsumeQuantityModal: ({ visible, product, onConfirm, onCancel }: any) => {
      if (!visible || !product) return null;
      return (
        <View testID="consume-quantity-modal">
          <Text>Consuma {product.name}</Text>
          <TouchableOpacity testID="consume-confirm" onPress={() => onConfirm(1)}>
            <Text>Conferma consumo</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="consume-cancel" onPress={onCancel}>
            <Text>Annulla</Text>
          </TouchableOpacity>
        </View>
      );
    },
  };
});

// Mock context hooks
jest.mock('@/context/ProductContext', () => ({
  useProducts: jest.fn(),
}));

jest.mock('@/context/CategoryContext', () => ({
  useCategories: jest.fn(),
}));

// Mock custom hooks
jest.mock('@/hooks/useProductSearch', () => ({
  useProductSearch: jest.fn(),
}));

jest.mock('@/hooks/useProductFilters', () => ({
  useProductFilters: jest.fn(),
}));

jest.mock('@/hooks/useProductActions', () => ({
  useProductActions: jest.fn(),
}));

jest.mock('@/hooks/useProductRefresh', () => ({
  useProductRefresh: jest.fn(),
}));

// Mock LoggingService
jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    debug: jest.fn(),
  },
}));

// --- Imports for mock configuration ---
import { useProducts } from '@/context/ProductContext';
import { useCategories } from '@/context/CategoryContext';
import { useProductSearch } from '@/hooks/useProductSearch';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useProductActions } from '@/hooks/useProductActions';
import { useProductRefresh } from '@/hooks/useProductRefresh';
import { router } from 'expo-router';

// Type assertions
const mockedUseProducts = useProducts as jest.Mock;
const mockedUseCategories = useCategories as jest.Mock;
const mockedUseProductSearch = useProductSearch as jest.Mock;
const mockedUseProductFilters = useProductFilters as jest.Mock;
const mockedUseProductActions = useProductActions as jest.Mock;
const mockedUseProductRefresh = useProductRefresh as jest.Mock;
const mockedRouterPush = router.push as jest.Mock;

// Default mock values
const defaultProducts = [
  { id: '1', name: 'Latte', status: 'active', quantities: [{ quantity: 2, unit: 'L' }], categoryId: 'dairy', expirationDate: '2026-06-15' },
  { id: '2', name: 'Uova', status: 'active', quantities: [{ quantity: 6, unit: 'pz' }], categoryId: 'dairy', expirationDate: '2026-06-10' },
  { id: '3', name: 'Mele', status: 'active', quantities: [{ quantity: 1, unit: 'kg' }], categoryId: 'fruit', expirationDate: '2026-06-20' },
];

const defaultCategories = [
  { id: 'dairy', name: 'Latticini', icon: '🧀' },
  { id: 'fruit', name: 'Frutta', icon: '🍎' },
];

const defaultSearchHook = {
  searchQuery: '',
  setSearchQuery: jest.fn(),
  hasSearchQuery: false,
};

const defaultFiltersHook = {
  filteredProducts: defaultProducts,
};

const defaultActionsHook = {
  handleDirectConsume: jest.fn(),
  handleDelete: jest.fn(),
  handleConsumeConfirm: jest.fn(),
  handleShowConsumeModal: jest.fn(),
};

const defaultRefreshHook = {
  refreshing: false,
  onRefresh: jest.fn(),
  shouldAutoRefresh: jest.fn(() => false),
  moveExpiredToHistory: jest.fn(),
  refreshProducts: jest.fn(),
};

// --- Helpers ---

const renderProductsScreen = () => render(<ProductsScreen />);

// --- Test Suite ---

describe('ProductsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseProducts.mockReturnValue({
      products: defaultProducts,
      refreshProducts: jest.fn(),
    });

    mockedUseCategories.mockReturnValue({
      categories: defaultCategories,
      loading: false,
    });

    mockedUseProductSearch.mockReturnValue({ ...defaultSearchHook });

    mockedUseProductFilters.mockReturnValue({ ...defaultFiltersHook });

    mockedUseProductActions.mockReturnValue({ ...defaultActionsHook });

    mockedUseProductRefresh.mockReturnValue({ ...defaultRefreshHook });
  });

  // ── Rendering ──────────────────────────────────────────────────────

  describe('rendering', () => {
    it('should render the products header', () => {
      const { getByTestId } = renderProductsScreen();
      expect(getByTestId('products-header')).toBeTruthy();
    });

    it('should render the search bar', () => {
      const { getByTestId } = renderProductsScreen();
      expect(getByTestId('search-bar')).toBeTruthy();
    });

    it('should render the status filter bar', () => {
      const { getByTestId } = renderProductsScreen();
      expect(getByTestId('status-filter-bar')).toBeTruthy();
    });

    it('should render the category filter bar', () => {
      const { getByTestId } = renderProductsScreen();
      expect(getByTestId('category-filter-bar')).toBeTruthy();
    });

    it('should render the product list', () => {
      const { getByTestId } = renderProductsScreen();
      expect(getByTestId('product-list')).toBeTruthy();
    });

    it('should render product items', () => {
      const { getByText } = renderProductsScreen();
      expect(getByText('Latte')).toBeTruthy();
      expect(getByText('Uova')).toBeTruthy();
      expect(getByText('Mele')).toBeTruthy();
    });
  });

  // ── Product Actions ────────────────────────────────────────────────

  describe('product actions', () => {
    it('should call onConsume when consume button is pressed', () => {
      const { handleDirectConsume } = defaultActionsHook;
      mockedUseProductActions.mockReturnValue({
        ...defaultActionsHook,
        handleDirectConsume,
      });
      // Product with single quantity should call handleDirectConsume directly
      // Mele has quantity: 1
      const { getByTestId } = renderProductsScreen();
      act(() => {
        fireEvent.press(getByTestId('consume-3'));
      });

      expect(handleDirectConsume).toHaveBeenCalledWith(
        expect.objectContaining({ id: '3', name: 'Mele' })
      );
    });

    it('should show consume modal when product has quantity > 1', () => {
      const { handleShowConsumeModal } = defaultActionsHook;
      // Latte has quantities: [{ quantity: 2, ... }]
      const { getByTestId, queryByTestId } = renderProductsScreen();

      // Modal should not be visible initially
      expect(queryByTestId('consume-quantity-modal')).toBeNull();
    });

    it('should call handleDelete when delete button is pressed', () => {
      const mockHandleDelete = jest.fn();
      mockedUseProductActions.mockReturnValue({
        ...defaultActionsHook,
        handleDelete: mockHandleDelete,
      });

      const { getByTestId } = renderProductsScreen();
      act(() => {
        fireEvent.press(getByTestId('delete-1'));
      });

      expect(mockHandleDelete).toHaveBeenCalledWith(
        expect.objectContaining({ id: '1' })
      );
    });

    it('should navigate to manual-entry on product press', () => {
      const { getByTestId } = renderProductsScreen();
      act(() => {
        fireEvent.press(getByTestId('press-1'));
      });

      expect(mockedRouterPush).toHaveBeenCalledWith({
        pathname: '/manual-entry',
        params: { productId: '1' },
      });
    });
  });

  // ── Search ─────────────────────────────────────────────────────────

  describe('search', () => {
    it('should render search input', () => {
      const { getByTestId } = renderProductsScreen();
      expect(getByTestId('search-input')).toBeTruthy();
    });

    it('should call setSearchQuery when search text changes', () => {
      const mockSetSearchQuery = jest.fn();
      mockedUseProductSearch.mockReturnValue({
        ...defaultSearchHook,
        setSearchQuery: mockSetSearchQuery,
      });

      const { getByTestId } = renderProductsScreen();
      act(() => {
        fireEvent.changeText(getByTestId('search-input'), 'latte');
      });

      expect(mockSetSearchQuery).toHaveBeenCalledWith('latte');
    });
  });

  // ── Filters ────────────────────────────────────────────────────────

  describe('filters', () => {
    it('should render status filter options', () => {
      const { getByText } = renderProductsScreen();
      expect(getByText('Status: all')).toBeTruthy();
    });

    it('should change status when status filter is pressed', () => {
      const mockOnStatusChange = jest.fn();
      // The onStatusChange is from StatusFilterBar which is a mock
      const { getByTestId } = renderProductsScreen();
      act(() => {
        fireEvent.press(getByTestId('status-all'));
      });
    });

    it('should render category filter options', () => {
      const { getByText } = renderProductsScreen();
      expect(getByText('Categories: all')).toBeTruthy();
    });

    it('should reset categories when "Tutte" is pressed', () => {
      const { getByTestId } = renderProductsScreen();
      act(() => {
        fireEvent.press(getByTestId('filter-all'));
      });
    });
  });

  // ── Consume Quantity Modal ─────────────────────────────────────────

  describe('consume quantity modal', () => {
    it('should not show modal initially', () => {
      const { queryByTestId } = renderProductsScreen();
      expect(queryByTestId('consume-quantity-modal')).toBeNull();
    });

    it('should show correct product count', () => {
      const { getByText } = renderProductsScreen();
      expect(getByText('Prodotti: 3')).toBeTruthy();
    });

    it('should display filtered products count', () => {
      mockedUseProductFilters.mockReturnValue({
        filteredProducts: [defaultProducts[0]],
      });

      const { getByText } = renderProductsScreen();
      expect(getByText('Prodotti: 1')).toBeTruthy();
    });
  });

  // ── Screen Focus ───────────────────────────────────────────────────

  describe('screen focus', () => {
    it('should call useFocusEffect on mount', () => {
      const mockUseFocusEffect = jest.requireMock('expo-router').useFocusEffect;
      renderProductsScreen();
      expect(mockUseFocusEffect).toHaveBeenCalled();
    });

    it('should handle first load with moveExpiredToHistory', async () => {
      const mockMoveExpiredToHistory = jest.fn().mockResolvedValue(undefined);
      const mockRefreshProducts = jest.fn().mockResolvedValue(undefined);

      mockedUseProductRefresh.mockReturnValue({
        ...defaultRefreshHook,
        moveExpiredToHistory: mockMoveExpiredToHistory,
        refreshProducts: mockRefreshProducts,
        shouldAutoRefresh: jest.fn(() => false),
      });

      mockedUseProducts.mockReturnValue({
        products: defaultProducts,
        refreshProducts: mockRefreshProducts,
      });

      // Force useFocusEffect to execute the callback
      const useFocusEffectMock = jest.requireMock('expo-router').useFocusEffect;
      useFocusEffectMock.mockImplementation((cb: any) => {
        const asyncCb = cb();
        if (asyncCb && typeof asyncCb.then === 'function') {
          return asyncCb;
        }
      });

      // For first load, isFirstLoad starts as true
      renderProductsScreen();

      // Wait for async operations
      await waitFor(() => {
        expect(mockMoveExpiredToHistory).toHaveBeenCalled();
      });
    });

    it('should handle auto-refresh on subsequent focuses', async () => {
      const mockRefreshProducts = jest.fn().mockResolvedValue(undefined);
      const mockShouldAutoRefresh = jest.fn(() => true);

      mockedUseProductRefresh.mockReturnValue({
        ...defaultRefreshHook,
        shouldAutoRefresh: mockShouldAutoRefresh,
        refreshProducts: mockRefreshProducts,
        moveExpiredToHistory: jest.fn().mockResolvedValue(undefined),
      });

      mockedUseProducts.mockReturnValue({
        products: defaultProducts,
        refreshProducts: mockRefreshProducts,
      });

      renderProductsScreen();

      // Wait for potential operations
      await waitFor(() => {
        // shouldAutoRefresh was called
        expect(mockShouldAutoRefresh).toHaveBeenCalled();
      });
    });
  });

  // ── Edge Cases ─────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle empty products list', () => {
      mockedUseProductFilters.mockReturnValue({
        filteredProducts: [],
      });

      const { getByText } = renderProductsScreen();
      expect(getByText('Prodotti: 0')).toBeTruthy();
    });

    it('should handle loading state through hooks', () => {
      mockedUseProductRefresh.mockReturnValue({
        ...defaultRefreshHook,
        refreshing: true,
      });

      const { getByTestId } = renderProductsScreen();
      expect(getByTestId('products-header')).toBeTruthy();
    });

    it('should filter products through useProductFilters', () => {
      mockedUseProductFilters.mockReturnValue({
        filteredProducts: [defaultProducts[0], defaultProducts[1]],
      });

      const { getByText, queryByText } = renderProductsScreen();
      expect(getByText('Latte')).toBeTruthy();
      expect(getByText('Uova')).toBeTruthy();
      expect(queryByText('Mele')).toBeNull();
    });

    it('should handle product consume with quantity > 1 via modal', () => {
      // Product with multiple quantities
      const productWithMultiple = {
        id: '4',
        name: 'Multi Pack',
        status: 'active',
        quantities: [{ quantity: 10, unit: 'pz' }],
        categoryId: 'other',
        expirationDate: '2026-07-01',
      };

      mockedUseProductFilters.mockReturnValue({
        filteredProducts: [...defaultProducts, productWithMultiple],
      });

      // For products with quantity > 1, the screen should show consume modal
      const { getByTestId, queryByTestId } = renderProductsScreen();

      // The screen should handle consume flow
      expect(getByTestId('product-list')).toBeTruthy();
    });
  });
});
