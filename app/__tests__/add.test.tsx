// add.test.tsx — AddProduct screen test module.
//
// exports: none
// used_by: none
// rules: none

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { View, Text, TouchableOpacity } from 'react-native';
import AddProduct from '../(tabs)/add';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ProductStorage } from '@/services/ProductStorage';
import { recentProductQueue } from '@/utils/recentProductQueue';
import { RecentsPicker } from '@/components/RecentsPicker';
import { Product } from '@/types/Product';

// --- Mocks ---
// All jest.mock factories use inline jest.fn() to avoid hoisting TDZ issues.
// References retrieved after import via type assertion.

// Mock expo-router: override global to add useFocusEffect + configurable useLocalSearchParams
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({})),
  useFocusEffect: jest.fn(),
}));

// Mock react-native-safe-area-context preserving testID
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children, style, testID, ...props }: { children: React.ReactNode; style?: unknown; testID?: string }) =>
      React.createElement(View, { style, testID, ...props }, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// Mock AddMethodCard — simple TouchableOpacity with testID
jest.mock('@/components/AddMethodCard', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return {
    AddMethodCard: ({ title, testID, onPress }: { title: string; testID?: string; onPress: () => void }) =>
      React.createElement(TouchableOpacity, { testID, onPress },
        React.createElement(Text, null, title)
      ),
  };
});

// Mock RecentsPicker as jest.fn() to capture props via mock.calls
jest.mock('@/components/RecentsPicker', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    RecentsPicker: jest.fn((props: {
      products: { length: number }[];
      loading: boolean;
      error: string | null;
      hintText: string | null;
      onToggle: (p: unknown) => void;
    }) =>
      React.createElement(View, { testID: 'recents-picker-mock' },
        React.createElement(Text, { testID: 'recents-count' }, String(props.products.length)),
        props.loading ? React.createElement(Text, { testID: 'recents-loading' }, 'Loading') : null,
        props.error ? React.createElement(Text, { testID: 'recents-error' }, props.error) : null,
        props.hintText ? React.createElement(Text, { testID: 'recents-hint' }, props.hintText) : null,
        React.createElement(TouchableOpacity, {
          testID: 'mock-toggle',
          onPress: () => props.onToggle({ id: 'p1', name: 'Test' }),
        }),
      ),
    ),
  };
});

// Mock ProductStorage with getRecentProducts + searchRecentProducts
jest.mock('@/services/ProductStorage', () => ({
  ProductStorage: {
    getRecentProducts: jest.fn(),
    searchRecentProducts: jest.fn(),
  },
}));

// Mock recentProductQueue
jest.mock('@/utils/recentProductQueue', () => ({
  recentProductQueue: {
    clear: jest.fn(),
    push: jest.fn(),
    peekNext: jest.fn(),
    advance: jest.fn(),
    isEmpty: jest.fn(() => true),
    size: jest.fn(() => 0),
    getAll: jest.fn(() => []),
  },
}));

// --- Retrieve mock references after import ---
const mockPush = router.push as jest.Mock;
const mockReplace = router.replace as jest.Mock;
const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockUseFocusEffect = useFocusEffect as jest.Mock;
const mockGetRecentProducts = ProductStorage.getRecentProducts as jest.Mock;
const mockSearchRecentProducts = ProductStorage.searchRecentProducts as jest.Mock;
const mockedRecentsPicker = RecentsPicker as jest.Mock;
const mockedQueue = recentProductQueue as jest.Mocked<typeof recentProductQueue>;

// Helper: get last props passed to RecentsPicker mock
function getLastRecentsProps() {
  const calls = mockedRecentsPicker.mock.calls;
  return calls[calls.length - 1]?.[0] as {
    products: Product[];
    selectedIds: Set<string>;
    onToggle: (p: Product) => void;
    searchQuery: string;
    onSearchChange: (t: string) => void;
    loading: boolean;
    error: string | null;
    hintText: string | null;
  };
}

// Helper: create a Product
function makeProduct(overrides: Partial<Product> & { id: string; name: string }): Product {
  return {
    category: 'fruits',
    quantities: [],
    purchaseDate: '2026-01-01',
    expirationDate: '2026-12-31',
    status: 'active',
    addedMethod: 'manual',
    ...overrides,
  };
}

// Helper: capture and trigger useFocusEffect callback
let focusCallback: (() => (() => void) | void) | null = null;

// Helper: trigger focus and flush all async state updates.
// focusCallback() calls fetchRecents() which is fire-and-forget (not awaited).
// We need to flush microtasks so the resolved promise triggers state updates.
async function triggerFocus() {
  await act(async () => {
    focusCallback?.();
    await new Promise((r) => setTimeout(r, 0));
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useRealTimers();
  focusCallback = null;

  // Default: no params
  mockUseLocalSearchParams.mockReturnValue({});

  // Capture useFocusEffect callback
  mockUseFocusEffect.mockImplementation((cb: () => (() => void) | void) => {
    focusCallback = cb;
  });

  // Default: getRecentProducts returns empty success
  mockGetRecentProducts.mockResolvedValue({ success: true, data: [] });
  mockSearchRecentProducts.mockResolvedValue({ success: true, data: [] });

  // Default: queue peekNext returns null
  mockedQueue.peekNext.mockReturnValue(null);
});

describe('AddProduct Screen', () => {
  describe('Rendering', () => {
    it('renders screen with title and method cards', () => {
      const { getByText, getByTestId } = render(<AddProduct />);

      expect(getByText('Aggiungi Prodotto')).toBeTruthy();
      expect(getByTestId('barcode-scanner-button')).toBeTruthy();
      expect(getByTestId('manual-entry-button')).toBeTruthy();
      expect(getByTestId('recents-picker-mock')).toBeTruthy();
    });

    it('renders tips section', () => {
      const { getByText } = render(<AddProduct />);

      expect(getByText('Suggerimenti')).toBeTruthy();
    });

    it('renders subtitle text', () => {
      const { getByText } = render(<AddProduct />);

      expect(getByText(/Scegli il metodo/)).toBeTruthy();
    });
  });

  describe('Barcode forwarding', () => {
    it('redirects to manual-entry when barcode param present', () => {
      mockUseLocalSearchParams.mockReturnValue({ barcode: '8001234567890' });

      render(<AddProduct />);

      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/manual-entry',
        params: expect.objectContaining({
          barcode: '8001234567890',
          resetForm: 'true',
        }),
      });
    });

    it('forwards all optional barcode params', () => {
      mockUseLocalSearchParams.mockReturnValue({
        barcode: '123',
        barcodeType: 'EAN_13',
        productName: 'Pasta',
        brand: 'Barilla',
        imageUrl: 'https://example.com/img.jpg',
      });

      render(<AddProduct />);

      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/manual-entry',
        params: expect.objectContaining({
          barcode: '123',
          barcodeType: 'EAN_13',
          productName: 'Pasta',
          brand: 'Barilla',
          imageUrl: 'https://example.com/img.jpg',
          resetForm: 'true',
        }),
      });
    });

    it('does not redirect when no barcode param', () => {
      mockUseLocalSearchParams.mockReturnValue({});

      render(<AddProduct />);

      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('does not redirect when barcode is array (not string)', () => {
      mockUseLocalSearchParams.mockReturnValue({ barcode: ['123', '456'] });

      render(<AddProduct />);

      expect(mockReplace).not.toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/manual-entry' })
      );
    });

    it('omits optional params when not provided', () => {
      mockUseLocalSearchParams.mockReturnValue({ barcode: '999' });

      render(<AddProduct />);

      const callArgs = mockReplace.mock.calls[0][0];
      expect(callArgs.params.barcodeType).toBeUndefined();
      expect(callArgs.params.productName).toBeUndefined();
      expect(callArgs.params.brand).toBeUndefined();
      expect(callArgs.params.imageUrl).toBeUndefined();
    });
  });

  describe('Navigation buttons', () => {
    it('barcode scanner button navigates to /scanner', () => {
      const { getByTestId } = render(<AddProduct />);

      fireEvent.press(getByTestId('barcode-scanner-button'));

      expect(mockPush).toHaveBeenCalledWith('/scanner');
    });

    it('manual entry button navigates to /manual-entry with params', () => {
      const { getByTestId } = render(<AddProduct />);

      fireEvent.press(getByTestId('manual-entry-button'));

      expect(mockPush).toHaveBeenCalledWith('/manual-entry?isEditMode=false&resetForm=true');
    });
  });

  describe('Recents fetching', () => {
    it('fetches recents on focus effect', async () => {
      render(<AddProduct />);
      await triggerFocus();

      expect(mockGetRecentProducts).toHaveBeenCalledWith(10);
    });

    it('passes fetched recents to RecentsPicker', async () => {
      const products = [
        makeProduct({ id: '1', name: 'Milk' }),
        makeProduct({ id: '2', name: 'Bread' }),
      ];
      mockGetRecentProducts.mockResolvedValue({ success: true, data: products });

      render(<AddProduct />);
      await triggerFocus();

      expect(getLastRecentsProps().products).toEqual(products);
    });

    it('sets error state when fetch fails', async () => {
      mockGetRecentProducts.mockResolvedValue({ success: false, error: 'Network error' });

      render(<AddProduct />);
      await triggerFocus();

      expect(getLastRecentsProps().error).toBe('Network error');
    });

    it('sets default error message when fetch fails without error string', async () => {
      mockGetRecentProducts.mockResolvedValue({ success: false, error: undefined });

      render(<AddProduct />);
      await triggerFocus();

      expect(getLastRecentsProps().error).toBe('Errore caricamento recents');
    });

    it('passes empty array when fetch returns null data', async () => {
      mockGetRecentProducts.mockResolvedValue({ success: true, data: null });

      render(<AddProduct />);
      await triggerFocus();

      expect(getLastRecentsProps().products).toEqual([]);
    });

    it('ignores stale responses (race condition via requestIdRef)', async () => {
      let resolveFirst!: (v: unknown) => void;
      const firstPromise = new Promise((r) => { resolveFirst = r; });
      const secondResult = { success: true as const, data: [makeProduct({ id: '2', name: 'Second' })] };

      mockGetRecentProducts
        .mockReturnValueOnce(firstPromise as Promise<{ success: boolean; data: Product[] }>)
        .mockResolvedValueOnce(secondResult);

      render(<AddProduct />);

      // First focus — starts fetch #1 (requestId=1, pending)
      let firstCleanup: (() => void) | void;
      await act(async () => {
        firstCleanup = focusCallback?.();
        await new Promise((r) => setTimeout(r, 0));
      });

      // Cleanup only — increments requestIdRef to 2 (no re-focus)
      await act(async () => {
        if (typeof firstCleanup === 'function') firstCleanup();
      });

      // Second focus — starts fetch #2 (requestId=2, resolves with secondResult)
      await triggerFocus();

      // Resolve first (now stale) request — should be ignored
      await act(async () => {
        resolveFirst({ success: true, data: [makeProduct({ id: '1', name: 'Stale' })] });
        await new Promise((r) => setTimeout(r, 0));
      });

      // Should show second result, not stale first
      expect(getLastRecentsProps().products.length).toBe(1);
      expect(getLastRecentsProps().products[0].name).toBe('Second');
    });
  });

  describe('Search', () => {
    it('shows hint when search query is 1 character', async () => {
      render(<AddProduct />);
      await triggerFocus();

      await act(async () => {
        getLastRecentsProps().onSearchChange('A');
      });

      expect(getLastRecentsProps().hintText).toBe('Digita ancora…');
    });

    it('clears selection when search query changes', async () => {
      render(<AddProduct />);
      await triggerFocus();

      // Select something first
      await act(async () => {
        getLastRecentsProps().onToggle(makeProduct({ id: 'p1', name: 'Test' }));
      });
      expect(getLastRecentsProps().selectedIds.has('p1')).toBe(true);

      // Change search → clears selection
      await act(async () => {
        getLastRecentsProps().onSearchChange('ab');
      });

      expect(getLastRecentsProps().selectedIds.size).toBe(0);
    });

    it('triggers search after debounce for ≥2 chars', async () => {
      jest.useFakeTimers();
      render(<AddProduct />);
      act(() => { focusCallback?.(); });

      act(() => { getLastRecentsProps().onSearchChange('pa'); });
      act(() => { jest.advanceTimersByTime(300); });

      expect(mockSearchRecentProducts).toHaveBeenCalledWith('pa', 10);

      jest.useRealTimers();
    });

    it('fetches all recents when search cleared to empty', async () => {
      jest.useFakeTimers();
      render(<AddProduct />);
      act(() => { focusCallback?.(); });

      act(() => { getLastRecentsProps().onSearchChange('test'); });
      act(() => { getLastRecentsProps().onSearchChange(''); });
      act(() => { jest.advanceTimersByTime(300); });

      expect(mockGetRecentProducts).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('does not trigger search for 1 char (hint only)', async () => {
      jest.useFakeTimers();
      render(<AddProduct />);
      act(() => { focusCallback?.(); });

      act(() => { getLastRecentsProps().onSearchChange('a'); });
      act(() => { jest.advanceTimersByTime(500); });

      expect(mockSearchRecentProducts).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('trims whitespace before deciding to search', async () => {
      jest.useFakeTimers();
      render(<AddProduct />);
      act(() => { focusCallback?.(); });

      // ' a ' trimmed = 'a' (1 char) → hint only, no search
      act(() => { getLastRecentsProps().onSearchChange(' a '); });
      act(() => { jest.advanceTimersByTime(300); });

      expect(mockSearchRecentProducts).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('sets error when search fails', async () => {
      mockSearchRecentProducts.mockResolvedValue({ success: false, error: 'Search failed' });

      jest.useFakeTimers();
      render(<AddProduct />);
      act(() => { focusCallback?.(); });

      await act(async () => {
        getLastRecentsProps().onSearchChange('test');
        await jest.advanceTimersByTimeAsync(300);
      });

      expect(getLastRecentsProps().error).toBe('Search failed');

      jest.useRealTimers();
    });
  });

  describe('Selection toggle', () => {
    it('adds product to selection on toggle', async () => {
      const product = makeProduct({ id: 'p1', name: 'Milk' });
      mockGetRecentProducts.mockResolvedValue({ success: true, data: [product] });

      render(<AddProduct />);
      await triggerFocus();

      await act(async () => {
        getLastRecentsProps().onToggle(product);
      });

      expect(getLastRecentsProps().selectedIds.has('p1')).toBe(true);
    });

    it('removes product from selection on second toggle', async () => {
      const product = makeProduct({ id: 'p1', name: 'Milk' });
      mockGetRecentProducts.mockResolvedValue({ success: true, data: [product] });

      render(<AddProduct />);
      await triggerFocus();

      await act(async () => { getLastRecentsProps().onToggle(product); });
      await act(async () => { getLastRecentsProps().onToggle(product); });

      expect(getLastRecentsProps().selectedIds.has('p1')).toBe(false);
    });

    it('enforces max 10 selection limit', async () => {
      const products = Array.from({ length: 12 }, (_, i) =>
        makeProduct({ id: `p${i}`, name: `Product ${i}` })
      );
      mockGetRecentProducts.mockResolvedValue({ success: true, data: products });

      render(<AddProduct />);
      await triggerFocus();

      for (const p of products) {
        await act(async () => { getLastRecentsProps().onToggle(p); });
      }

      expect(getLastRecentsProps().selectedIds.size).toBe(10);
    });
  });

  describe('Continue (queue + navigation)', () => {
    it('does not show continue button when no products selected', async () => {
      const { queryByTestId } = render(<AddProduct />);
      await triggerFocus();

      expect(queryByTestId('recents-continue-button')).toBeNull();
      expect(mockedQueue.clear).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/manual-entry' })
      );
    });

    it('pushes selected items to queue and navigates to manual-entry', async () => {
      const products = [
        makeProduct({ id: 'p1', name: 'Milk', brand: 'Parmalat', category: 'dairy' }),
        makeProduct({ id: 'p2', name: 'Bread', category: 'grains' }),
      ];
      mockGetRecentProducts.mockResolvedValue({ success: true, data: products });

      mockedQueue.peekNext.mockReturnValue({
        name: 'Milk',
        brand: 'Parmalat',
        selectedCategory: 'dairy',
      });

      const { getByTestId } = render(<AddProduct />);
      await triggerFocus();

      await act(async () => { getLastRecentsProps().onToggle(products[0]); });
      await act(async () => { getLastRecentsProps().onToggle(products[1]); });
      fireEvent.press(getByTestId('recents-continue-button'));

      expect(mockedQueue.clear).toHaveBeenCalled();
      expect(mockedQueue.push).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Milk' }),
          expect.objectContaining({ name: 'Bread' }),
        ])
      );
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/manual-entry',
        params: expect.objectContaining({
          name: 'Milk',
          resetForm: 'true',
        }),
      });
    });

    it('includes optional fields in navigation params', async () => {
      const product = makeProduct({
        id: 'p1',
        name: 'Gelato',
        brand: 'Algida',
        barcode: '123456',
        imageUrl: 'https://img.com/gelato.jpg',
        category: 'ice_cream',
        notes: 'Cioccolato',
        isFrozen: true,
      });
      mockGetRecentProducts.mockResolvedValue({ success: true, data: [product] });

      mockedQueue.peekNext.mockReturnValue({
        name: 'Gelato',
        brand: 'Algida',
        barcode: '123456',
        imageUrl: 'https://img.com/gelato.jpg',
        selectedCategory: 'ice_cream',
        notes: 'Cioccolato',
        isFrozen: true,
      });

      const { getByTestId } = render(<AddProduct />);
      await triggerFocus();

      await act(async () => { getLastRecentsProps().onToggle(product); });
      fireEvent.press(getByTestId('recents-continue-button'));

      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/manual-entry',
        params: expect.objectContaining({
          name: 'Gelato',
          brand: 'Algida',
          barcode: '123456',
          imageUrl: 'https://img.com/gelato.jpg',
          selectedCategory: 'ice_cream',
          notes: 'Cioccolato',
          isFrozen: 'true',
          resetForm: 'true',
          purchaseDate: expect.any(String),
        }),
      });
    });

    it('does not navigate if queue peekNext returns null after push', async () => {
      const product = makeProduct({ id: 'p1', name: 'Milk' });
      mockGetRecentProducts.mockResolvedValue({ success: true, data: [product] });
      mockedQueue.peekNext.mockReturnValue(null);

      const { getByTestId } = render(<AddProduct />);
      await triggerFocus();

      await act(async () => { getLastRecentsProps().onToggle(product); });
      fireEvent.press(getByTestId('recents-continue-button'));

      expect(mockedQueue.clear).toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/manual-entry' })
      );
    });

    it('slices selection to max 10 items before pushing to queue', async () => {
      const products = Array.from({ length: 12 }, (_, i) =>
        makeProduct({ id: `p${i}`, name: `Product ${i}` })
      );
      mockGetRecentProducts.mockResolvedValue({ success: true, data: products });

      mockedQueue.peekNext.mockReturnValue({ name: 'Product 0', selectedCategory: 'fruits' });

      const { getByTestId } = render(<AddProduct />);
      await triggerFocus();

      for (const p of products) {
        await act(async () => { getLastRecentsProps().onToggle(p); });
      }

      fireEvent.press(getByTestId('recents-continue-button'));

      const pushArg = mockedQueue.push.mock.calls[0][0];
      if (Array.isArray(pushArg)) {
        expect(pushArg.length).toBeLessThanOrEqual(10);
      }
    });
  });

  describe('Focus cleanup', () => {
    it('cleanup function does not throw', () => {
      render(<AddProduct />);

      const cleanup = focusCallback?.();

      expect(() => {
        if (typeof cleanup === 'function') cleanup();
      }).not.toThrow();
    });
  });

  describe('Loading state', () => {
    it('passes loading=true to RecentsPicker while fetching', async () => {
      let resolveFetch!: (v: { success: boolean; data: Product[] }) => void;
      mockGetRecentProducts.mockReturnValue(
        new Promise((r) => { resolveFetch = r; })
      );

      render(<AddProduct />);

      // Trigger focus — fetch starts but doesn't resolve yet
      await act(async () => {
        focusCallback?.();
        // Let the synchronous setRecentsLoading(true) flush
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(getLastRecentsProps().loading).toBe(true);

      // Resolve the fetch
      await act(async () => {
        resolveFetch({ success: true, data: [] });
        await new Promise((r) => setTimeout(r, 0));
      });

      expect(getLastRecentsProps().loading).toBe(false);
    });
  });
});
