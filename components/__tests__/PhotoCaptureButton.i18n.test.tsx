import React from 'react';
import { render, act } from '@testing-library/react-native';
import i18next from 'i18next';
import { ExpirationPhotoButton, ProductPhotoButton } from '../PhotoCaptureButton';
import type { PhotoNavigationParams } from '@/hooks/usePhotoNavigation';

jest.mock('@/hooks/usePhotoNavigation', () => ({
  usePhotoNavigation: () => ({ navigateToPhotoCapture: jest.fn() }),
}));

const formData: PhotoNavigationParams = {
  name: '', brand: '', selectedCategory: '', purchaseDate: '',
  expirationDate: '', notes: '', barcode: '', imageUrl: null,
};

describe('photo buttons follow the active language', () => {
  afterEach(async () => {
    await i18next.changeLanguage('it');
  });

  it.each([
    { language: 'it', expiry: 'Fotografa la scadenza', hint: 'Apre la fotocamera per fotografare la data di scadenza', product: 'Scatta foto prodotto' },
    { language: 'en', expiry: 'Photograph the expiry date', hint: 'Opens the camera to photograph the expiry date', product: 'Take product photo' },
  ])('renders text and accessibility metadata in $language', async ({ language, expiry, hint, product }) => {
    await act(async () => { await i18next.changeLanguage(language); });
    const expiryButton = render(<ExpirationPhotoButton formData={formData} isDarkMode={false} />);
    expect(expiryButton.getByText(expiry)).toBeTruthy();
    expect(expiryButton.getByTestId('capture-expiration-date-button').props.accessibilityHint).toBe(hint);
    expiryButton.unmount();

    const productButton = render(
      <ProductPhotoButton imageUrl={null} isDarkMode={false} onPhotoPress={jest.fn()} />
    );
    expect(productButton.getByText(product)).toBeTruthy();
    expect(productButton.getByTestId('photo-capture-button-capture').props.accessibilityLabel).toBe(product);
  });
});
