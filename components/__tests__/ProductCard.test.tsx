import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { ProductCard } from '../ProductCard';
import { Alert } from 'react-native';
import { Product, ProductCategory } from '@/types/Product';

// --- Mocks ---

// Mock del contesto del tema
jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({
    isDarkMode: false,
  }),
}));

// Mock dell'hook dello stato di scadenza
jest.mock('@/hooks/useExpirationStatus', () => ({
  useExpirationStatus: jest.fn(() => ({
    color: '#000000',
    backgroundColor: '#ffffff',
    status: 'valid',
  })),
}));

// Mock di Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.useSharedValue = jest.fn(() => ({ value: 0 }));
  Reanimated.useAnimatedStyle = jest.fn((callback) => callback());
  Reanimated.withTiming = jest.fn((toValue) => toValue);
  Reanimated.withDelay = jest.fn((_, animation) => animation);
  return Reanimated;
});

// Mock per Alert.alert
jest.spyOn(Alert, 'alert');

// --- Dati di Test ---

const mockProduct: Product = {
  id: '1',
  name: 'Latte',
  brand: 'Super Brand',
  quantity: 1,
  unit: 'L',
  expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Scade tra 3 giorni
  purchaseDate: new Date().toISOString(),
  categoryId: 'cat1',
  status: 'active',
  notes: 'Note di prova',
  userId: 'user1',
};

const mockCategory: ProductCategory = {
  id: 'cat1',
  name: 'Latticini',
  icon: '🥛',
  color: '#3b82f6',
};

describe('ProductCard', () => {
  // Pulisce i mock dopo ogni test
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render product name, brand, and quantity', () => {
    const { getByText } = render(
      <ProductCard
        product={mockProduct}
        categoryInfo={mockCategory}
        onDelete={jest.fn()}
        index={0}
      />
    );

    expect(getByText('Latte')).toBeTruthy();
    expect(getByText('Super Brand')).toBeTruthy();
    expect(getByText('1 L')).toBeTruthy();
  });

  it('should render category information', () => {
    const { getByText } = render(
      <ProductCard
        product={mockProduct}
        categoryInfo={mockCategory}
        onDelete={jest.fn()}
        index={0}
      />
    );

    expect(getByText('Latticini')).toBeTruthy();
    expect(getByText('🥛')).toBeTruthy(); // Emoji dell'icona
  });

  it('should show "Consumato" button and call onConsume when pressed', () => {
    const onConsumeMock = jest.fn();
    const { getByText } = render(
      <ProductCard
        product={mockProduct}
        categoryInfo={mockCategory}
        onDelete={jest.fn()}
        onConsume={onConsumeMock}
        index={0}
      />
    );

    const consumeButton = getByText('Consumato');
    expect(consumeButton).toBeTruthy();

    fireEvent.press(consumeButton);
    expect(onConsumeMock).toHaveBeenCalledTimes(1);
  });

  it('should not show "Consumato" button if onConsume is not provided', () => {
    const { queryByText } = render(
      <ProductCard
        product={mockProduct}
        categoryInfo={mockCategory}
        onDelete={jest.fn()}
        index={0}
      />
    );

    expect(queryByText('Consumato')).toBeNull();
  });

  it('should call onDelete when delete is confirmed in the alert', () => {
    const onDeleteMock = jest.fn();
    const { getByTestId } = render(
      <ProductCard
        product={mockProduct}
        categoryInfo={mockCategory}
        onDelete={onDeleteMock}
        index={0}
      />
    );
    
    // Trova il pulsante tramite un testID implicito che aggiungeremo
    // (non possiamo farlo direttamente, quindi troviamo il genitore)
    const deleteButton = getByTestId('delete-button');
    fireEvent.press(deleteButton);

    // Verifica che Alert.alert sia stato chiamato
    expect(Alert.alert).toHaveBeenCalled();

    // Simula la pressione del pulsante "Elimina" nell'alert
    // @ts-ignore
    act(() => Alert.alert.mock.calls[0][2][1].onPress());
    
    expect(onDeleteMock).toHaveBeenCalledTimes(1);
  });

  it('should render notes if provided', () => {
    const { getByText } = render(
      <ProductCard
        product={mockProduct}
        categoryInfo={mockCategory}
        onDelete={jest.fn()}
        index={0}
      />
    );

    expect(getByText('Note di prova')).toBeTruthy();
  });
});
