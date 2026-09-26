import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Alert } from 'react-native';
import i18next from 'i18next';
import type { Product, ProductCategory } from '@/types/Product';
import { ProductCardDetails } from '../ProductCardDetails';
import { ProductCardHeader } from '../ProductCardHeader';
import { ProductList } from '../products/ProductList';
import { getProductCardAccessibilityProps } from '@/utils/accessibility/cards';
import { initI18n } from '@/i18n';
import { enCatalogs } from '@/i18n/catalogs/en';
import { itCatalogs } from '@/i18n/catalogs/it';

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(() => [{ languageTag: 'it-IT' }]),
}));

jest.mock('lucide-react-native', () => ({
  Calendar: 'Calendar',
  Check: 'Check',
  Package: 'Package',
  ShoppingCart: 'ShoppingCart',
  Trash2: 'Trash2',
}));

jest.mock('@shopify/flash-list', () => ({
  FlashList: 'FlashList',
}));

jest.mock('@/utils/accessibility', () => jest.requireActual('@/utils/accessibility'));

const product: Product = {
  id: 'product-1',
  name: 'Latte',
  brand: 'Parmalat',
  category: 'dairy',
  quantities: [{ quantity: 1, unit: 'L' }],
  purchaseDate: '2026-05-01',
  expirationDate: '2026-06-15',
  status: 'active',
  addedMethod: 'manual',
  isFrozen: true,
};

const categoryInfo: ProductCategory = {
  id: 'dairy',
  name: 'Latticini',
  icon: '🧀',
  color: '#3B82F6',
};

describe('Pantry list localization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    initI18n();
  });

  afterEach(async () => {
    await i18next.changeLanguage('it');
  });

  it('localizes pantry card detail labels', async () => {
    const screen = render(
      <ProductCardDetails
        product={product}
        colors={{ textPrimary: '#000000', textSecondary: '#666666' }}
        formattedPurchaseDate="01/05/2026"
        formattedExpirationDate="15/06/2026"
      />,
    );

    expect(screen.getByText(itCatalogs.products.purchaseDateLabel)).toBeTruthy();
    expect(screen.getByText(itCatalogs.products.expirationDateLabel)).toBeTruthy();
    expect(screen.getByText(itCatalogs.products.quantityLabel)).toBeTruthy();

    await act(async () => {
      await i18next.changeLanguage('en');
    });

    expect(screen.getByText(enCatalogs.products.purchaseDateLabel)).toBeTruthy();
    expect(screen.getByText(enCatalogs.products.expirationDateLabel)).toBeTruthy();
    expect(screen.getByText(enCatalogs.products.quantityLabel)).toBeTruthy();
  });

  it('localizes freezer indicator, delete alert, and action accessibility', async () => {
    const screen = render(
      <ProductCardHeader
        product={product}
        categoryInfo={categoryInfo}
        colors={{ textPrimary: '#000000', textSecondary: '#666666', success: '#00aa00', error: '#cc0000' }}
        onConsume={jest.fn()}
        onDelete={jest.fn()}
        index={0}
      />,
    );

    expect(screen.getByText(`(${itCatalogs.products.freezerIndicator})`)).toBeTruthy();
    const italianDeleteLabel = itCatalogs.accessibility.deleteProductLabel.replace('{{name}}', product.name);
    expect(screen.getByLabelText(italianDeleteLabel)).toBeTruthy();
    expect(screen.getByLabelText(
      itCatalogs.accessibility.consumeProductLabel.replace('{{name}}', product.name),
    )).toBeTruthy();

    fireEvent.press(screen.getByLabelText(italianDeleteLabel));
    expect(Alert.alert).toHaveBeenLastCalledWith(
      itCatalogs.products.deleteProductTitle,
      itCatalogs.products.deleteProductConfirmation.replace('{{name}}', product.name),
      expect.arrayContaining([
        expect.objectContaining({ text: itCatalogs.common.cancel }),
        expect.objectContaining({ text: itCatalogs.products.deleteProductAction }),
      ]),
    );

    await act(async () => {
      await i18next.changeLanguage('en');
    });

    expect(screen.getByText(`(${enCatalogs.products.freezerIndicator})`)).toBeTruthy();
    const englishDeleteLabel = enCatalogs.accessibility.deleteProductLabel.replace('{{name}}', product.name);
    expect(screen.getByLabelText(englishDeleteLabel)).toBeTruthy();
    fireEvent.press(screen.getByLabelText(englishDeleteLabel));
    expect(Alert.alert).toHaveBeenLastCalledWith(
      enCatalogs.products.deleteProductTitle,
      enCatalogs.products.deleteProductConfirmation.replace('{{name}}', product.name),
      expect.arrayContaining([
        expect.objectContaining({ text: enCatalogs.common.cancel }),
        expect.objectContaining({ text: enCatalogs.products.deleteProductAction }),
      ]),
    );
  });

  it('localizes product-card accessibility label and hint without translating user content', async () => {
    const italianProps = getProductCardAccessibilityProps(product, categoryInfo, i18next.getFixedT('it'));
    const formattedDate = new Date(product.expirationDate).toLocaleDateString('it-IT');

    expect(italianProps.accessibilityLabel).toBe(
      `Latte, marca Parmalat, categoria Latticini, scade il ${formattedDate}`,
    );
    expect(italianProps.accessibilityHint).toBe(itCatalogs.accessibility.productCardHint);

    const englishProps = getProductCardAccessibilityProps(product, categoryInfo, i18next.getFixedT('en'));
    expect(englishProps.accessibilityLabel).toBe(
      `Latte, brand Parmalat, category Latticini, expires ${formattedDate}`,
    );
    expect(englishProps.accessibilityHint).toBe(enCatalogs.accessibility.productCardHint);
  });

  it('localizes product-list and refresh accessibility labels', async () => {
    const screen = render(
      <ProductList
        products={[]}
        categories={[]}
        refreshing={false}
        onRefresh={jest.fn()}
        onProductPress={jest.fn()}
        onConsume={jest.fn()}
        onDelete={jest.fn()}
        hasSearchQuery={false}
        hasCategoryFilter={false}
      />,
    );
    const list = () => screen.getByTestId('products-list');

    expect(list().props.accessibilityLabel).toBe(itCatalogs.accessibility.productsListLabel);
    expect(list().props.refreshControl.props.accessibilityLabel)
      .toBe(itCatalogs.accessibility.refreshProductsListLabel);

    await act(async () => {
      await i18next.changeLanguage('en');
    });

    expect(list().props.accessibilityLabel).toBe(enCatalogs.accessibility.productsListLabel);
    expect(list().props.refreshControl.props.accessibilityLabel)
      .toBe(enCatalogs.accessibility.refreshProductsListLabel);
  });
});
