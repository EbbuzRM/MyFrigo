import React from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import i18next from 'i18next';
import type { Product } from '@/types/Product';
import { initI18n } from '@/i18n';
import { enCatalogs } from '@/i18n/catalogs/en';
import { itCatalogs } from '@/i18n/catalogs/it';
import { HistoryCard } from '../HistoryCard';
import { formatHistoryDate } from '../HistoryCardStatus';

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageTag: 'it-IT' }]),
}));

// Use React Native's View component; global Reanimated mock exposes an invalid native object here.
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    View,
    useSharedValue: jest.fn((value: number) => ({ value })),
    useAnimatedStyle: jest.fn((getStyle: () => object) => getStyle()),
    withDelay: jest.fn((_delay: number, animation: unknown) => animation),
    withTiming: jest.fn(() => 0),
  };
});

jest.mock('@/context/CategoryContext', () => ({
  useCategories: () => ({
    getCategoryById: () => ({
      id: 'dairy',
      name: 'Latticini',
      color: '#3B82F6',
      icon: '🧀',
    }),
  }),
}));

jest.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}));

const consumedProduct: Product = {
  id: 'product-1',
  name: 'Latte',
  brand: 'Parmalat',
  category: 'dairy',
  quantities: [{ quantity: 1, unit: 'L' }],
  purchaseDate: '2026-05-01',
  expirationDate: '2026-06-15',
  consumedDate: '2026-06-10',
  status: 'consumed',
  addedMethod: 'manual',
};

describe('HistoryCard localization', () => {
  beforeEach(() => {
    initI18n();
  });

  afterEach(async () => {
    await i18next.changeLanguage('it');
  });

  it('updates status, restore copy, and accessibility when language changes', async () => {
    const screen = render(
      <HistoryCard product={consumedProduct} type="consumed" onRestore={jest.fn()} />,
    );
    const italianDateLabel = itCatalogs.history.cardDateLabel
      .replace('{{status}}', itCatalogs.history.statusConsumed)
      .replace('{{date}}', formatHistoryDate(consumedProduct.consumedDate));

    expect(screen.getByText(italianDateLabel)).toBeTruthy();
    expect(screen.getByText(itCatalogs.history.restoreProduct)).toBeTruthy();
    expect(screen.getByLabelText(itCatalogs.history.restoreProductLabel).props.accessibilityHint)
      .toBe(itCatalogs.history.restoreHint);

    await act(async () => {
      await i18next.changeLanguage('en');
    });

    const englishDateLabel = enCatalogs.history.cardDateLabel
      .replace('{{status}}', enCatalogs.history.statusConsumed)
      .replace('{{date}}', formatHistoryDate(consumedProduct.consumedDate));

    await waitFor(() => {
      expect(screen.getByText(englishDateLabel)).toBeTruthy();
      expect(screen.getByText(enCatalogs.history.restoreProduct)).toBeTruthy();
      expect(screen.getByLabelText(enCatalogs.history.restoreProductLabel).props.accessibilityHint)
        .toBe(enCatalogs.history.restoreHint);
    });
  });
});
