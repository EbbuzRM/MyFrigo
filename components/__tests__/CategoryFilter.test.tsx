import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CategoryFilter } from '../CategoryFilter';
import { Product, ProductCategory } from '@/types/Product';

// Mock del contesto del tema
jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

// --- Dati di Test ---

const mockCategories: ProductCategory[] = [
  { id: 'cat1', name: 'Latticini', icon: '🥛', color: '#3b82f6' },
  { id: 'cat2', name: 'Frutta', icon: '🍎', color: '#ef4444' },
  { id: 'cat3', name: 'Verdura', icon: '🥦', color: '#22c55e' },
];

const mockProducts: Product[] = [
  { 
    id: '1', 
    name: 'Latte', 
    category: 'cat1', 
    quantity: 1, 
    unit: 'unit', 
    purchaseDate: '2024-01-01', 
    expirationDate: '2024-01-10', 
    status: 'active',
    addedMethod: 'manual'
  },
  { 
    id: '2', 
    name: 'Formaggio', 
    category: 'cat1', 
    quantity: 1, 
    unit: 'unit', 
    purchaseDate: '2024-01-01', 
    expirationDate: '2024-01-15', 
    status: 'active',
    addedMethod: 'manual'
  },
  { 
    id: '3', 
    name: 'Mela', 
    category: 'cat2', 
    quantity: 1, 
    unit: 'unit', 
    purchaseDate: '2024-01-01', 
    expirationDate: '2024-01-20', 
    status: 'active',
    addedMethod: 'manual'
  },
];

describe('CategoryFilter', () => {
  const onCategoryChangeMock = jest.fn();

  beforeEach(() => {
    onCategoryChangeMock.mockClear();
  });

  it('should render all categories including "Tutti"', () => {
    const { getByText } = render(
      <CategoryFilter
        selectedCategory="all"
        onCategoryChange={onCategoryChangeMock}
        products={mockProducts}
        categories={mockCategories}
      />
    );

    expect(getByText('Tutti')).toBeTruthy();
    expect(getByText('Latticini')).toBeTruthy();
    expect(getByText('Frutta')).toBeTruthy();
  });

  it('should display the correct product count for each category', () => {
    const { getByText } = render(
      <CategoryFilter
        selectedCategory="all"
        onCategoryChange={onCategoryChangeMock}
        products={mockProducts}
        categories={mockCategories}
      />
    );

    // "Tutti" dovrebbe avere 3 prodotti
    expect(getByText('3')).toBeTruthy();
    // "Latticini" dovrebbe avere 2 prodotti
    expect(getByText('2')).toBeTruthy();
    // "Frutta" dovrebbe avere 1 prodotto
    expect(getByText('1')).toBeTruthy();
  });

  it('should not render categories with zero products', () => {
    const { queryByText } = render(
      <CategoryFilter
        selectedCategory="all"
        onCategoryChange={onCategoryChangeMock}
        products={mockProducts}
        categories={mockCategories}
      />
    );

    // "Verdura" (cat3) non ha prodotti e non dovrebbe essere renderizzata
    expect(queryByText('Verdura')).toBeNull();
  });

  it('should call onCategoryChange with the correct category id when pressed', () => {
    const { getByText } = render(
      <CategoryFilter
        selectedCategory="all"
        onCategoryChange={onCategoryChangeMock}
        products={mockProducts}
        categories={mockCategories}
      />
    );

    const latticiniButton = getByText('Latticini');
    fireEvent.press(latticiniButton);

    expect(onCategoryChangeMock).toHaveBeenCalledTimes(1);
    expect(onCategoryChangeMock).toHaveBeenCalledWith('cat1');
  });
  
  it('should apply selected styles to the selected category', () => {
    const { getByText } = render(
      <CategoryFilter
        selectedCategory="cat1" // Latticini è selezionato
        onCategoryChange={onCategoryChangeMock}
        products={mockProducts}
        categories={mockCategories}
      />
    );

    const latticiniButton = getByText('Latticini').parent?.parent;
    const tuttiButton = getByText('Tutti').parent?.parent;

    // Questo è un test di base. Un test di snapshot sarebbe più preciso per gli stili.
    // Verifichiamo che lo stile del pulsante selezionato sia diverso da quello non selezionato.
    expect(latticiniButton?.props.style).not.toEqual(tuttiButton?.props.style);
  });
});
