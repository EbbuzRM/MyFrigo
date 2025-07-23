import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HistoryCard } from '../HistoryCard';
import { Product } from '@/types/Product';

// --- Mocks ---

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

jest.mock('@/context/CategoryContext', () => ({
  useCategories: () => ({
    getCategoryById: () => ({
      id: 'cat1',
      name: 'Latticini',
      icon: '🥛',
      color: '#3b82f6',
    }),
  }),
}));

// --- Dati di Test ---

const mockProduct: Product = {
  id: '1',
  name: 'Yogurt',
  brand: 'Super Brand',
  status: 'consumed',
  consumedDate: new Date('2023-10-27T10:00:00.000Z').toISOString(),
  expirationDate: new Date('2023-10-26T10:00:00.000Z').toISOString(),
  categoryId: 'cat1',
  userId: 'user1',
  quantity: 1,
  unit: 'pz',
  purchaseDate: new Date().toISOString(),
};

describe('HistoryCard', () => {
  it('should render correctly for a "consumed" product', () => {
    const { getByText, queryByTestId } = render(
      <HistoryCard product={mockProduct} type="consumed" />
    );

    expect(getByText('Yogurt')).toBeTruthy();
    expect(getByText('Super Brand')).toBeTruthy();
    expect(getByText(/Consumato: 27\/10\/2023/)).toBeTruthy();
    // Il pulsante di ripristino non dovrebbe esserci se onRestore non è fornito
    expect(queryByTestId('restore-button')).toBeNull();
  });

  it('should render correctly for an "expired" product', () => {
    const expiredProduct = { ...mockProduct, status: 'expired' as const };
    const { getByText, queryByTestId } = render(
      <HistoryCard product={expiredProduct} type="expired" />
    );

    expect(getByText('Yogurt')).toBeTruthy();
    expect(getByText(/Scaduto: 26\/10\/2023/)).toBeTruthy();
    // Il pulsante di ripristino non appare mai per i prodotti scaduti
    expect(queryByTestId('restore-button')).toBeNull();
  });

  it('should show and call onRestore for a "consumed" product', () => {
    const onRestoreMock = jest.fn();
    const { getByTestId } = render(
      <HistoryCard
        product={mockProduct}
        type="consumed"
        onRestore={onRestoreMock}
      />
    );

    const restoreButton = getByTestId('restore-button');
    expect(restoreButton).toBeTruthy();

    fireEvent.press(restoreButton);
    expect(onRestoreMock).toHaveBeenCalledTimes(1);
    expect(onRestoreMock).toHaveBeenCalledWith(mockProduct.id);
  });
});
