import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ProductPhotoButton } from '../PhotoCaptureButton';

jest.mock('@/hooks/usePhotoNavigation', () => ({
  usePhotoNavigation: () => ({ navigateToPhotoCapture: jest.fn() }),
}));

describe('ProductPhotoButton', () => {
  it('offers photo capture again when the current image cannot be loaded', () => {
    const onPhotoPress = jest.fn();
    const screen = render(
      <ProductPhotoButton
        imageUrl="file:///data/user/0/com.myfrigo/cache/Camera/missing.jpg"
        barcode="8001234567890"
        isDarkMode={false}
        onPhotoPress={onPhotoPress}
      />
    );

    fireEvent(screen.getByTestId('photo-capture-button-image'), 'error');

    const captureButton = screen.getByTestId('photo-capture-button-capture');
    expect(captureButton).toBeTruthy();
    fireEvent.press(captureButton);
    expect(onPhotoPress).toHaveBeenCalledTimes(1);
  });
});
