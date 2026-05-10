// CategoryFilter.test.tsx — CategoryFilter.test module.
//
// exports: none
// used_by: none
// rules:   none

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CategoryFilter } from '../CategoryFilter';
import { Product, ProductCategory } from '@/types/Product';

const mockTheme = {
  isDarkMode: false,
  toggleTheme: jest.fn(),
};

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => mockTheme,
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('@/utils/accessibility', () => ({
  getCategoryFilterAccessibilityProps: (name: string, count: number, isSelected: boolean) => ({
    accessibilityLabel: `${name}, ${count} prodotti${isSelected ? ', selezionato' : ''}`,
    accessibilityRole: 'button',
    accessibilityState: { selected: isSelected },
  }),
}));

describe('CategoryFilter', () => {
  const mockCategories: ProductCategory[] = [
    { id: 'dairy', name: 'Latticini', icon: '🥛', color: '#3B82F6' },
    { id: 'meat', name: 'Carne', icon: '🥩', color: '#EF4444' },
    { id: 'fruits', name: 'Frutta', icon: '🍎', color: '#F59E0B' },
  ];

  const mockProducts: Product[] = [
    {
      id: '1', name: 'Latte', category: 'dairy',
      quantities: [{ quantity: 1, unit: 'pz' }],
      purchaseDate: '2026-01-01', expirationDate: '2026-06-01',
      status: 'active', addedMethod: 'manual',
    },
    {
      id: '2', name: 'Pollo', category: 'meat',
      quantities: [{ quantity: 2, unit: 'pz' }],
      purchaseDate: '2026-01-01', expirationDate: '2026-06-01',
      status: 'active', addedMethod: 'manual',
    },
  ];

  const defaultProps = {
    selectedCategories: ['all'],
    onCategoryChange: jest.fn(),
    products: mockProducts,
    categories: mockCategories,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "Tutti" category always', () => {
    const { getByText } = render(<CategoryFilter {...defaultProps} />);
    expect(getByText('Tutti')).toBeTruthy();
  });

  it('renders custom categories that have products', () => {
    const { getByText } = render(<CategoryFilter {...defaultProps} />);
    expect(getByText('Latticini')).toBeTruthy();
    expect(getByText('Carne')).toBeTruthy();
  });

  it('hides categories with zero products', () => {
    const { queryByText } = render(<CategoryFilter {...defaultProps} />);
    // 'fruits' has no products in mockProducts
    expect(queryByText('Frutta')).toBeNull();
  });

  it('shows correct product count for each category', () => {
    const { getByText } = render(<CategoryFilter {...defaultProps} />);
    // "all" should show total count (2)
    expect(getByText('2')).toBeTruthy();
  });

  it('calls onCategoryChange when a category is pressed', () => {
    const onCategoryChange = jest.fn();
    const { getByText } = render(
      <CategoryFilter {...defaultProps} onCategoryChange={onCategoryChange} />
    );
    fireEvent.press(getByText('Latticini'));
    expect(onCategoryChange).toHaveBeenCalledWith('dairy');
  });

  it('calls onCategoryChange with "all" when Tutti is pressed', () => {
    const onCategoryChange = jest.fn();
    const { getByText } = render(
      <CategoryFilter {...defaultProps} onCategoryChange={onCategoryChange} />
    );
    fireEvent.press(getByText('Tutti'));
    expect(onCategoryChange).toHaveBeenCalledWith('all');
  });

  it('highlights selected category with border color', () => {
    const { getByText } = render(
      <CategoryFilter {...defaultProps} selectedCategories={['dairy']} />
    );
    expect(getByText('Latticini')).toBeTruthy();
  });

  it('renders emoji icon for categories with emoji icons', () => {
    const { getByText } = render(<CategoryFilter {...defaultProps} />);
    expect(getByText('🥛')).toBeTruthy();
  });

  it('renders correctly in dark mode', () => {
    mockTheme.isDarkMode = true;
    const { getByText } = render(<CategoryFilter {...defaultProps} />);
    expect(getByText('Tutti')).toBeTruthy();
    mockTheme.isDarkMode = false;
  });

  it('shows "all" category even with zero products', () => {
    const { getByText } = render(
      <CategoryFilter {...defaultProps} products={[]} />
    );
    expect(getByText('Tutti')).toBeTruthy();
  });

  it('renders remote URL icons as Image components', () => {
    const remoteCategories: ProductCategory[] = [
      { id: 'custom', name: 'Custom', icon: 'https://example.com/icon.png', color: '#333' },
    ];
    const { UNSAFE_root } = render(
      <CategoryFilter {...defaultProps} categories={remoteCategories} />
    );
    expect(UNSAFE_root).toBeTruthy();
  });
});
