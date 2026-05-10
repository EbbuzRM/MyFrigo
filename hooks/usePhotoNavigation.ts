// usePhotoNavigation.ts — usePhotoNavigation module.
//
// exports: PhotoNavigationParams | UsePhotoNavigationReturn | usePhotoNavigation
// used_by: components\PhotoCaptureButton.tsx
// rules:   - This module manages a `navigatingToPhotoCapture` ref that must remain `true` during navigation and reset to `false` after a 500ms timeout to prevent duplicate navigation.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { router } from 'expo-router';
import { useCallback, useRef } from 'react';
import { formStateLogger } from '@/utils/FormStateLogger';

export interface PhotoNavigationParams {
  name: string;
  brand: string;
  selectedCategory: string;
  purchaseDate: string;
  expirationDate: string;
  notes: string;
  barcode: string;
  imageUrl: string | null;
}

export interface UsePhotoNavigationReturn {
  navigatingToPhotoCapture: React.MutableRefObject<boolean>;
  navigateToPhotoCapture: (formData: PhotoNavigationParams, mode: 'expirationDateOnly' | 'full') => void;
}

export const usePhotoNavigation = (): UsePhotoNavigationReturn => {
  const navigatingToPhotoCapture = useRef(false);

  const navigateToPhotoCapture = useCallback(
    (formData: PhotoNavigationParams, mode: 'expirationDateOnly' | 'full' = 'expirationDateOnly') => {
      const navigationData = {
        ...formData,
        captureMode: mode,
      };

      formStateLogger.logNavigation(
        mode === 'expirationDateOnly' ? 'CAPTURE_EXPIRATION' : 'CAPTURE_PHOTO',
        'manual-entry',
        'photo-capture',
        navigationData
      );

      navigatingToPhotoCapture.current = true;

      router.push({
        pathname: '/photo-capture',
        params: navigationData,
      });

      setTimeout(() => {
        navigatingToPhotoCapture.current = false;
      }, 500);
    },
    []
  );

  return {
    navigatingToPhotoCapture,
    navigateToPhotoCapture,
  };
};
