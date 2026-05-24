// ExpirationCard.test.tsx — ExpirationCard test module.
//
// exports: none
// used_by: none
// rules: none

import React from 'react';
import { render } from '@testing-library/react-native';
import { ExpirationCard } from '../ExpirationCard';
import type { Product } from '@/types/Product';

// Mock scaleFont: must be before any other import that depends on it
jest.mock('@/utils/scaleFont', () => ({
  scaleFont: (size: number) => size,
}));

// Mock CategoryContext (overrides global mock so we can control it per test)
const mockGetCategoryById = jest.fn((id: string) => {
  if (id === 'dairy') {
    return { id: 'dairy', name: 'Latticini', icon: '🧀', color: '#3B82F6' };
  }
  return undefined;
});

jest.mock('@/context/CategoryContext', () => ({
  useCategories: () => ({
    categories: [],
    getCategoryById: mockGetCategoryById,
    addCategory: jest.fn(),
    deleteCategory: jest.fn(),
    updateCategory: jest.fn(),
    loading: false,
  }),
}));

// Mock useExpirationStatus (overrides global)
jest.mock('@/hooks/useExpirationStatus', () => ({
  useExpirationStatus: jest.fn(),
}));

const { useExpirationStatus } = require('@/hooks/useExpirationStatus');

// Mock accessibility utils
jest.mock('@/utils/accessibility', () => ({
  getExpirationCardAccessibilityProps: jest.fn(() => ({
    accessibilityLabel: 'Mock product label',
    accessibilityHint: 'Mock hint',
    accessibilityRole: 'button',
  })),
}));

// Mock child components
jest.mock('../ExpirationCardHeader', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    ExpirationCardHeader: (props: any) =>
      React.createElement(View, { testID: 'expiration-card-header' },
        React.createElement(Text, { testID: 'product-name' }, props.product?.name),
        React.createElement(Text, { testID: 'status-text' }, props.statusText)
      ),
  };
});

jest.mock('../ExpirationCardDetails', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  return {
    ExpirationCardDetails: (props: any) =>
      React.createElement(View, { testID: 'expiration-card-details' },
        React.createElement(Text, null, String(props.expirationDate))
      ),
  };
});

describe('ExpirationCard', () => {
  const mockProduct: Product = {
    id: 'product-1',
    name: 'Latte',
    brand: 'Parmalat',
    category: 'dairy',
    quantities: [{ quantity: 1, unit: 'L' }],
    purchaseDate: '2026-05-01',
    expirationDate: '2026-06-15',
    status: 'active',
    addedMethod: 'manual',
  };

  const mockExpirationInfo = {
    text: '15 giorni',
    color: '#16a34a',
    backgroundColor: '#dcfce720',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useExpirationStatus as jest.Mock).mockReturnValue(mockExpirationInfo);
  });

  describe('Rendering', () => {
    it('should render the product card with header and details', () => {
      const { getByTestId } = render(
        <ExpirationCard product={mockProduct} onPress={jest.fn()} />
      );

      expect(getByTestId('expiration-card-header')).toBeTruthy();
      expect(getByTestId('expiration-card-details')).toBeTruthy();
    });

    it('should pass product name to ExpirationCardHeader', () => {
      const { getByTestId } = render(
        <ExpirationCard product={mockProduct} onPress={jest.fn()} />
      );

      expect(getByTestId('product-name')).toBeTruthy();
    });

    it('should call useExpirationStatus with product expiration date', () => {
      render(<ExpirationCard product={mockProduct} onPress={jest.fn()} />);

      expect(useExpirationStatus).toHaveBeenCalledWith(
        mockProduct.expirationDate,
        false
      );
    });

    it('should render correctly with frozen product (isFrozen not forwarded to hook)', () => {
      const frozenProduct: Product = {
        ...mockProduct,
        isFrozen: true,
      };

      render(<ExpirationCard product={frozenProduct} onPress={jest.fn()} />);

      // ExpirationCard does NOT pass isFrozen to useExpirationStatus
      expect(useExpirationStatus).toHaveBeenCalledWith(
        frozenProduct.expirationDate,
        false
      );
    });
  });

  describe('Category Handling', () => {
    it('should call getCategoryById with product category', () => {
      render(<ExpirationCard product={mockProduct} onPress={jest.fn()} />);

      expect(mockGetCategoryById).toHaveBeenCalledWith('dairy');
    });

    it('should return null when category is not found', () => {
      const unknownProduct: Product = {
        ...mockProduct,
        category: 'unknown-category',
      };

      const { queryByTestId } = render(
        <ExpirationCard product={unknownProduct} onPress={jest.fn()} />
      );

      // When category is not found, component returns null - no header rendered
      expect(queryByTestId('expiration-card-header')).toBeNull();
    });
  });

  describe('Press Handling', () => {
    it('should render without crashing when onPress is provided', () => {
      const { getByTestId } = render(
        <ExpirationCard product={mockProduct} onPress={jest.fn()} />
      );

      expect(getByTestId('expiration-card-header')).toBeTruthy();
    });

    it('should render without crashing when onPress is not provided', () => {
      const { getByTestId } = render(
        <ExpirationCard product={mockProduct} />
      );

      expect(getByTestId('expiration-card-header')).toBeTruthy();
    });
  });

  describe('Dark Mode', () => {
    it('should pass isDarkMode=false from global mock to useExpirationStatus', () => {
      const { getByTestId } = render(
        <ExpirationCard product={mockProduct} onPress={jest.fn()} />
      );

      expect(useExpirationStatus).toHaveBeenCalledWith(
        mockProduct.expirationDate,
        false
      );
      expect(getByTestId('expiration-card-header')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should call getExpirationCardAccessibilityProps', () => {
      const { getExpirationCardAccessibilityProps } = require('@/utils/accessibility');

      render(<ExpirationCard product={mockProduct} onPress={jest.fn()} />);

      expect(getExpirationCardAccessibilityProps).toHaveBeenCalledWith(
        mockProduct,
        mockExpirationInfo
      );
    });
  });
});
