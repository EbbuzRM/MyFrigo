import React from 'react';
import { render } from '@testing-library/react-native';
import { HistoryCard } from '../HistoryCard';
import { Product } from '@/types/Product';

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

// Mock del LoggingService
jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    warning: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock delle categorie
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

// --- Dati di Test ---

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

describe('HistoryCard', () => {
  it('should render product information correctly', () => {
    const { getByText } = render(
      <HistoryCard
        product={mockProduct}
        type="expired"
      />
    );

    expect(getByText('Latte')).toBeTruthy();
    expect(getByText('1 litro')).toBeTruthy();
    expect(getByText('🥛')).toBeTruthy();
  });

  it('should display expiration date', () => {
    const { getByText } = render(
      <HistoryCard
        product={mockProduct}
        type="expired"
      />
    );

    expect(getByText('Scaduto: 25/01/2024')).toBeTruthy();
  });

  it('should display expiration date', () => {
    const { getByText } = render(
      <HistoryCard
        product={mockProduct}
        type="expired"
      />
    );

    expect(getByText('Scaduto: 25/01/2024')).toBeTruthy();
  });
});
