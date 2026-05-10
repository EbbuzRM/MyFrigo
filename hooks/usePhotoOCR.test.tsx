import { renderHook } from '@testing-library/react-hooks';
import usePhotoOCR from '../usePhotoOCR';

// Mock external OCR services
jest.mock('utils/ocr/ocrSpaceService', () => ({
  ocrSpaceEngine2: jest.fn(),
}));

// MockML Kit if needed
// jest.mock('utils/ocr/mlKitService', () => ({ detectExpirationDate: jest.fn() }));

describe('usePhotoOCR', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('successfully processes a valid image and returns a valid expiration date', async () => {
    // Arrange: mock the OCR service to return a known date
    const mockDate = '2026-12-31';
    // Mock the fallback service to resolve with a successful result
    const { ocrSpaceEngine2 } = require('utils/ocr/ocrSpaceService');
    ocrSpaceEngine2.mockResolvedValueOnce({ textAnnotation: mockDate });

    // Act: call the hook with a valid image reference
    const { result } = renderHook(() => usePhotoOCR('data:image/png;base64,VALID_IMAGE'));

    // Assert: the hook should expose the parsed expiration date
    expect(result.current.expirationDate).toBe(mockDate);
  });

  it('handles empty or invalid image input, expecting null or an error', async () => {
    // Act: call the hook with an empty string (invalid image)
    const { result } = renderHook(() => usePhotoOCR(''));

    // Assert: expirationDate should be null for invalid input
    expect(result.current.expirationDate).toBeNull();
  });

  it('processes dot-matrix OCR fallback via ocr.space', async () => {
    // Arrange: mock ocrSpaceEngine2 to return dot-matrix style text
    const mockDotMatrixText = '15/11/26\\nLOTTO: 11.8';
    const { ocrSpaceEngine2 } = require('utils/ocr/ocrSpaceService');
    ocrSpaceEngine2.mockResolvedValueOnce({ textAnnotation: mockDotMatrixText });

    // Act: invoke the hook with a flag that triggers dot-matrix processing
    const { result } = renderHook(() => usePhotoOCR('dot-matrix-image'));

    // Assert: the parsed expiration date should match the expected pattern
    expect(result.current.expirationDate).toMatch(/^2026-\\d{2}-\\d{2}$/);
  });
});