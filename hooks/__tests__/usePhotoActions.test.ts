// usePhotoActions.test.ts — usePhotoActions test module.
//
// exports: none
// used_by: none
// rules: none

import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { usePhotoActions } from '../usePhotoActions';

// Override global LoggingService mock to include `warning` method
jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    warn: jest.fn(),
    warning: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock usePhotoOCR
jest.mock('../usePhotoOCR', () => ({
  usePhotoOCR: jest.fn(),
}));

// Mock ManualEntryContext locally (overrides global mock so we can track mock calls)
const mockSetImageUrl = jest.fn();
const mockSetExpirationDate = jest.fn();
jest.mock('@/context/ManualEntryContext', () => ({
  useManualEntry: () => ({
    name: '',
    setName: jest.fn(),
    brand: '',
    setBrand: jest.fn(),
    selectedCategory: '',
    setSelectedCategory: jest.fn(),
    quantities: [],
    purchaseDate: '',
    setPurchaseDate: jest.fn(),
    expirationDate: '',
    setExpirationDate: mockSetExpirationDate,
    notes: '',
    setNotes: jest.fn(),
    barcode: '',
    imageUrl: '',
    setImageUrl: mockSetImageUrl,
    isEditMode: false,
    isInitialized: false,
    initializeForm: jest.fn(),
    clearForm: jest.fn(),
  }),
}));

const { usePhotoOCR } = require('../usePhotoOCR');

describe('usePhotoActions', () => {
  const mockExtractOCRDate = jest.fn();
  const mockResetProgress = jest.fn();
  const mockOcrProgress = {
    isProcessing: false,
    progress: 0,
    currentStep: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock for usePhotoOCR
    (usePhotoOCR as jest.Mock).mockReturnValue({
      extractExpirationDate: mockExtractOCRDate,
      ocrProgress: { ...mockOcrProgress },
      resetProgress: mockResetProgress,
    });
  });

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => usePhotoActions());

      expect(result.current.ocrProgress).toEqual(mockOcrProgress);
      expect(typeof result.current.confirmPhoto).toBe('function');
      expect(typeof result.current.extractExpirationDate).toBe('function');
      expect(typeof result.current.navigateToManualEntry).toBe('function');
      expect(typeof result.current.resetOCRProgress).toBe('function');
    });
  });

  describe('confirmPhoto', () => {
    const capturedImage = 'file:///test-image.jpg';

    it('should handle null image gracefully', async () => {
      const { result } = renderHook(() => usePhotoActions());

      let res: string;
      await act(async () => {
        res = await result.current.confirmPhoto(null, 'productPhoto');
      });

      expect(res!).toBe('success');
    });

    it('should handle productPhoto mode - set image and navigate back', async () => {
      const { result } = renderHook(() => usePhotoActions());

      let res: string;
      await act(async () => {
        res = await result.current.confirmPhoto(capturedImage, 'productPhoto');
      });

      expect(mockSetImageUrl).toHaveBeenCalledWith(capturedImage);
      expect(router.back).toHaveBeenCalled();
      expect(res!).toBe('success');
    });

    it('should handle expirationDateOnly mode - return immediately', async () => {
      const { result } = renderHook(() => usePhotoActions());

      let res: string;
      await act(async () => {
        res = await result.current.confirmPhoto(capturedImage, 'expirationDateOnly');
      });

      expect(res!).toBe('success');
      expect(mockSetImageUrl).not.toHaveBeenCalled();
      expect(router.back).not.toHaveBeenCalled();
    });

    it('should show error alert in updateProductPhoto mode without productId', async () => {
      // Ensure useLocalSearchParams returns no productId (default is empty object)
      const { result } = renderHook(() => usePhotoActions());

      await act(async () => {
        await result.current.confirmPhoto(capturedImage, 'updateProductPhoto');
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Errore',
        expect.stringContaining('ID prodotto'),
        expect.any(Array)
      );
    });
  });

  describe('extractExpirationDate', () => {
    it('should extract and set expiration date successfully', async () => {
      const ocrResult = {
        success: true,
        extractedDate: '2026-12-31',
        confidence: 0.95,
        rawText: '31/12/2026',
      };
      mockExtractOCRDate.mockResolvedValueOnce(ocrResult);

      const { result } = renderHook(() => usePhotoActions());

      let res: unknown;
      await act(async () => {
        res = await result.current.extractExpirationDate('file:///test.jpg');
      });

      expect(mockExtractOCRDate).toHaveBeenCalledWith('file:///test.jpg');
      expect(mockSetExpirationDate).toHaveBeenCalledWith('2026-12-31');
      expect(res).toEqual(ocrResult);
    });

    it('should handle OCR failure without setting expiration date', async () => {
      const ocrFailure = {
        success: false,
        extractedDate: null,
        confidence: 0,
        rawText: '',
        error: 'Nessuna data rilevata',
      };
      mockExtractOCRDate.mockResolvedValueOnce(ocrFailure);

      const { result } = renderHook(() => usePhotoActions());

      let res: unknown;
      await act(async () => {
        res = await result.current.extractExpirationDate('file:///test.jpg');
      });

      expect(res).toEqual(ocrFailure);
      expect(mockSetExpirationDate).not.toHaveBeenCalled();
    });

    it('should propagate OCR errors', async () => {
      mockExtractOCRDate.mockRejectedValueOnce(new Error('OCR engine error'));

      const { result } = renderHook(() => usePhotoActions());

      await expect(async () => {
        await act(async () => {
          await result.current.extractExpirationDate('file:///test.jpg');
        });
      }).rejects.toThrow('OCR engine error');
    });
  });

  describe('navigateToManualEntry', () => {
    it('should navigate to manual entry with expirationDate', () => {
      const { result } = renderHook(() => usePhotoActions());

      act(() => {
        result.current.navigateToManualEntry('2026-12-31');
      });

      expect(router.replace).toHaveBeenCalledWith({
        pathname: '/manual-entry',
        params: expect.objectContaining({
          expirationDate: '2026-12-31',
          fromPhotoCapture: 'true',
          isEditMode: 'false',
        }),
      });
    });
  });

  describe('resetOCRProgress', () => {
    it('should reset OCR progress', () => {
      const { result } = renderHook(() => usePhotoActions());

      act(() => {
        result.current.resetOCRProgress();
      });

      expect(mockResetProgress).toHaveBeenCalled();
    });
  });
});
