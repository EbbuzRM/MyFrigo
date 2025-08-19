import React from 'react';
import { render } from '@testing-library/react-native';
import { ProductCard } from '../ProductCard';
import { Product } from '@/types/Product';
import { ProductCategory } from '@/types/Product';

// Mock del contesto del tema
jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    isDarkMode: false,
    colors: {
      textPrimary: '#1a1a1a',
      textSecondary: '#666666',
      primary: '#3b82f6',
      error: '#ef4444',
      cardBackground: '#ffffff',
      background: '#f5f5f5'
    }
  }),
}));

// Mock del contesto delle categorie
jest.mock('@/context/CategoryContext', () => ({
  useCategories: () => ({
    categories: [
      { id: 'cat1', name: 'Latticini', icon: '🥛', color: '#3b82f6' },
      { id: 'cat2', name: 'Frutta', icon: '🍎', color: '#ef4444' },
    ],
    getCategoryById: (id: string) => {
      const categories = [
        { id: 'cat1', name: 'Latticini', icon: '🥛', color: '#3b82f6' },
        { id: 'cat2', name: 'Frutta', icon: '🍎', color: '#ef4444' },
      ];
      return categories.find(cat => cat.id === id);
    }
  }),
}));

// Mock dell'hook useExpirationStatus
jest.mock('@/hooks/useExpirationStatus', () => ({
  useExpirationStatus: jest.fn(() => ({
    backgroundColor: '#ffffff',
    color: '#16a34a',
    daysUntilExpiration: 5,
    isExpiringSoon: false,
    isExpired: false,
  })),
}));

// Mock delle funzioni di accessibilità
jest.mock('@/utils/accessibility', () => ({
  getProductCardAccessibilityProps: jest.fn(() => ({})),
  getDeleteButtonAccessibilityProps: jest.fn(() => ({})),
  getActionButtonAccessibilityProps: jest.fn(() => ({})),
  getImageAccessibilityProps: jest.fn(() => ({})),
}));

// Mock del LoggingService
jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    warning: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock delle costanti dei colori
jest.mock('@/constants/colors', () => ({
  COLORS: {
    LIGHT: {
      textPrimary: '#1a1a1a',
    },
    DARK: {
      textPrimary: '#ffffff',
    },
  },
}));

// --- Dati di Test ---

const mockCategory: ProductCategory = {
  id: 'cat1',
  name: 'Latticini',
  icon: '🥛',
  color: '#3b82f6'
};

const mockProduct: Product = {
  id: '1',
  name: 'Latte',
  category: 'cat1',
  quantity: 1,
  unit: 'litro',
  purchaseDate: '2024-01-15',
  expirationDate: '2024-01-25',
  status: 'active',
  addedMethod: 'manual'
};

describe('ProductCard', () => {
  it('should render product information correctly', () => {
    const { getByText } = render(
      <ProductCard
        product={mockProduct}
        categoryInfo={mockCategory}
        onPress={jest.fn()}
        onDelete={jest.fn()}
        index={0}
      />
    );

    expect(getByText('Latte')).toBeTruthy();
    expect(getByText('1 litro')).toBeTruthy();
    expect(getByText('🥛')).toBeTruthy();
  });

  it('should display expiration date', () => {
    const { getByText } = render(
      <ProductCard
        product={mockProduct}
        categoryInfo={mockCategory}
        onPress={jest.fn()}
        onDelete={jest.fn()}
        index={0}
      />
    );

    expect(getByText('25/01/2024')).toBeTruthy();
  });
});
