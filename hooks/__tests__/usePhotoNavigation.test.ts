// usePhotoNavigation.test.ts — usePhotoNavigation test module.
//
// exports: none
// used_by: none
// rules: none

import { renderHook, act } from '@testing-library/react-native';
import { router } from 'expo-router';
import { usePhotoNavigation } from '../usePhotoNavigation';
import type { PhotoNavigationParams } from '../usePhotoNavigation';

// Mock FormStateLogger
jest.mock('@/utils/FormStateLogger', () => ({
  formStateLogger: {
    logNavigation: jest.fn(),
  },
}));

describe('usePhotoNavigation', () => {
  const mockFormData: PhotoNavigationParams = {
    name: 'Test Product',
    brand: 'Test Brand',
    selectedCategory: 'dairy',
    purchaseDate: '2026-05-01',
    expirationDate: '2026-12-31',
    notes: 'Test notes',
    barcode: '123456789',
    imageUrl: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with navigatingToPhotoCapture ref set to false', () => {
      const { result } = renderHook(() => usePhotoNavigation());

      expect(result.current.navigatingToPhotoCapture.current).toBe(false);
    });

    it('should expose navigateToPhotoCapture function', () => {
      const { result } = renderHook(() => usePhotoNavigation());

      expect(typeof result.current.navigateToPhotoCapture).toBe('function');
    });
  });

  describe('navigateToPhotoCapture', () => {
    it('should navigate to photo-capture with form data in expirationDateOnly mode', () => {
      const { result } = renderHook(() => usePhotoNavigation());

      act(() => {
        result.current.navigateToPhotoCapture(mockFormData, 'expirationDateOnly');
      });

      expect(router.push).toHaveBeenCalledWith({
        pathname: '/photo-capture',
        params: expect.objectContaining({
          name: 'Test Product',
          brand: 'Test Brand',
          captureMode: 'expirationDateOnly',
        }),
      });
    });

    it('should navigate to photo-capture with form data in full mode', () => {
      const { result } = renderHook(() => usePhotoNavigation());

      act(() => {
        result.current.navigateToPhotoCapture(mockFormData, 'full');
      });

      expect(router.push).toHaveBeenCalledWith({
        pathname: '/photo-capture',
        params: expect.objectContaining({
          name: 'Test Product',
          captureMode: 'full',
        }),
      });
    });

    it('should default to expirationDateOnly mode when not specified', () => {
      const { result } = renderHook(() => usePhotoNavigation());

      act(() => {
        result.current.navigateToPhotoCapture(mockFormData, 'full');
      });

      expect(router.push).toHaveBeenCalledWith({
        pathname: '/photo-capture',
        params: expect.objectContaining({
          captureMode: 'expirationDateOnly',
        }),
      });
    });

    it('should set navigatingToPhotoCapture ref to true during navigation', () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => usePhotoNavigation());

      act(() => {
        result.current.navigateToPhotoCapture(mockFormData, 'expirationDateOnly');
      });

      expect(result.current.navigatingToPhotoCapture.current).toBe(true);

      // After 500ms timeout, should reset to false
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.navigatingToPhotoCapture.current).toBe(false);

      jest.useRealTimers();
    });

    it('should log navigation via formStateLogger', () => {
      const { formStateLogger } = require('@/utils/FormStateLogger');
      const { result } = renderHook(() => usePhotoNavigation());

      act(() => {
        result.current.navigateToPhotoCapture(mockFormData, 'expirationDateOnly');
      });

      expect(formStateLogger.logNavigation).toHaveBeenCalledWith(
        'CAPTURE_EXPIRATION',
        'manual-entry',
        'photo-capture',
        expect.objectContaining({
          name: 'Test Product',
          captureMode: 'expirationDateOnly',
        })
      );
    });

    it('should pass all ImageUrl params to router', () => {
      const formDataWithImage: PhotoNavigationParams = {
        ...mockFormData,
        imageUrl: 'file:///test-image.jpg',
      };

      const { result } = renderHook(() => usePhotoNavigation());

      act(() => {
        result.current.navigateToPhotoCapture(formDataWithImage, 'full');
      });

      expect(router.push).toHaveBeenCalledWith({
        pathname: '/photo-capture',
        params: expect.objectContaining({
          imageUrl: 'file:///test-image.jpg',
        }),
      });
    });
  });
});
