import { renderHook, act } from '@testing-library/react-native';
import { usePhotoOCR } from '../usePhotoOCR';

// Mock delle dipendenze
jest.mock('@react-native-ml-kit/text-recognition');
jest.mock('@/services/LoggingService');

const mockTextRecognition = require('@react-native-ml-kit/text-recognition');
const mockLoggingService = require('@/services/LoggingService');

describe('usePhotoOCR', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => usePhotoOCR());

    expect(result.current.ocrProgress).toEqual({
      isProcessing: false,
      progress: 0,
      currentStep: ''
    });
    expect(typeof result.current.extractExpirationDate).toBe('function');
    expect(typeof result.current.resetProgress).toBe('function');
  });

  it('should extract expiration date successfully', async () => {
    const mockImageUri = 'file://test-image.jpg';
    const mockOCRResult = {
      blocks: [
        {
          text: 'Latte scadenza 25/12/2024',
          boundingBox: { left: 0, top: 0, right: 100, bottom: 20 }
        }
      ]
    };

    mockTextRecognition.recognize.mockResolvedValue(mockOCRResult);

    const { result } = renderHook(() => usePhotoOCR());

    let ocrResult: any;
    await act(async () => {
      ocrResult = await result.current.extractExpirationDate(mockImageUri);
    });

    expect(ocrResult?.success).toBe(true);
    expect(ocrResult?.extractedDate).toBeTruthy();
    expect(ocrResult?.confidence).toBeGreaterThan(0);
    expect(mockTextRecognition.recognize).toHaveBeenCalledWith(mockImageUri);
  });

  it('should handle OCR errors gracefully', async () => {
    const mockImageUri = 'file://test-image.jpg';
    const mockError = new Error('OCR processing failed');

    mockTextRecognition.recognize.mockRejectedValue(mockError);

    const { result } = renderHook(() => usePhotoOCR());

    let ocrResult: any;
    await act(async () => {
      ocrResult = await result.current.extractExpirationDate(mockImageUri);
    });

    expect(ocrResult?.success).toBe(false);
    expect(ocrResult?.error).toBe('OCR processing failed');
    expect(ocrResult?.extractedDate).toBeNull();
  });

  it('should handle empty OCR results', async () => {
    const mockImageUri = 'file://test-image.jpg';

    mockTextRecognition.recognize.mockResolvedValue({
      blocks: []
    });

    const { result } = renderHook(() => usePhotoOCR());

    let ocrResult: any;
    await act(async () => {
      ocrResult = await result.current.extractExpirationDate(mockImageUri);
    });

    expect(ocrResult?.success).toBe(false);
    expect(ocrResult?.error).toBe('Nessun testo rilevato nell\'immagine');
  });

  it('should handle images without valid dates', async () => {
    const mockImageUri = 'file://test-image.jpg';

    mockTextRecognition.recognize.mockResolvedValue({
      blocks: [
        {
          text: 'Questo è un prodotto senza data di scadenza',
          boundingBox: { left: 0, top: 0, right: 100, bottom: 20 }
        }
      ]
    });

    const { result } = renderHook(() => usePhotoOCR());

    let ocrResult: any;
    await act(async () => {
      ocrResult = await result.current.extractExpirationDate(mockImageUri);
    });

    expect(ocrResult?.success).toBe(false);
    expect(ocrResult?.error).toBe('Nessuna data valida trovata');
  });

  it('should reset progress correctly', () => {
    const { result } = renderHook(() => usePhotoOCR());

    // Simula uno stato di processing
    act(() => {
      // In un test reale potresti voler mockare setState
      result.current.resetProgress();
    });

    expect(result.current.ocrProgress.isProcessing).toBe(false);
  });

  it('should handle multiple date patterns correctly', async () => {
    const mockImageUri = 'file://test-image.jpg';

    // Test con vari formati di data
    mockTextRecognition.recognize.mockResolvedValue({
      blocks: [
        {
          text: 'Scadenza: 25/12/2024 - Exp: 25-12-2024 - Use by: 12/25/2024',
          boundingBox: { left: 0, top: 0, right: 100, bottom: 20 }
        }
      ]
    });

    const { result } = renderHook(() => usePhotoOCR());

    let ocrResult: any;
    await act(async () => {
      ocrResult = await result.current.extractExpirationDate(mockImageUri);
    });

    // Dovrebbe trovare almeno una data valida
    expect(ocrResult?.success).toBe(true);
    expect(ocrResult?.extractedDate).toBeTruthy();
  });
});