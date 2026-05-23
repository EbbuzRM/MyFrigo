// useCamera.test.ts — useCamera test module.
//
// exports: none
// used_by: none
// rules: none

import { renderHook, act } from '@testing-library/react-native';
import { useCamera, CaptureMode } from '../useCamera';
import { useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert } from 'react-native';

// Mock expo-camera
jest.mock('expo-camera', () => ({
  CameraView: jest.fn(),
  useCameraPermissions: jest.fn(),
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  useMediaLibraryPermissions: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
}));

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
}));

// Mock LoggingService
jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockedUseCameraPermissions = useCameraPermissions as jest.Mock;
const mockedUseMediaLibraryPermissions = ImagePicker.useMediaLibraryPermissions as jest.Mock;
const mockedLaunchImageLibraryAsync = ImagePicker.launchImageLibraryAsync as jest.Mock;
const mockedManipulateAsync = ImageManipulator.manipulateAsync as jest.Mock;

describe('useCamera', () => {
  const mockCameraPermission = { granted: true, canAskAgain: true };
  const mockGalleryPermission = { granted: true, canAskAgain: true };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseCameraPermissions.mockReturnValue([mockCameraPermission, jest.fn()]);
    mockedUseMediaLibraryPermissions.mockReturnValue([mockGalleryPermission, jest.fn()]);
  });

  describe('Initialization', () => {
    it('should initialize with default values in expirationDateOnly mode', () => {
      const { result } = renderHook(() => useCamera('expirationDateOnly'));

      expect(result.current.hasCameraPermission).toBe(true);
      expect(result.current.hasGalleryPermission).toBe(true);
      expect(result.current.isProcessingImage).toBe(false);
      expect(result.current.cameraRef).toBeDefined();
    });

    it('should initialize with default values in productPhoto mode', () => {
      const { result } = renderHook(() => useCamera('productPhoto'));

      expect(result.current.hasCameraPermission).toBe(true);
      expect(result.current.hasGalleryPermission).toBe(true);
      expect(result.current.isProcessingImage).toBe(false);
    });

    it('should provide all required functions', () => {
      const { result } = renderHook(() => useCamera('expirationDateOnly'));

      expect(typeof result.current.takePicture).toBe('function');
      expect(typeof result.current.pickImage).toBe('function');
      expect(typeof result.current.requestCameraPermission).toBe('function');
      expect(typeof result.current.requestGalleryPermission).toBe('function');
      expect(typeof result.current.setIsProcessingImage).toBe('function');
    });

    it('should handle denied camera permission', () => {
      mockedUseCameraPermissions.mockReturnValue([
        { granted: false, canAskAgain: false },
        jest.fn(),
      ]);
      mockedUseMediaLibraryPermissions.mockReturnValue([{ granted: true, canAskAgain: true }, jest.fn()]);

      const { result } = renderHook(() => useCamera('expirationDateOnly'));

      expect(result.current.hasCameraPermission).toBe(false);
    });

    it('should handle denied gallery permission', () => {
      mockedUseCameraPermissions.mockReturnValue([{ granted: true, canAskAgain: true }, jest.fn()]);
      mockedUseMediaLibraryPermissions.mockReturnValue([
        { granted: false, canAskAgain: false },
        jest.fn(),
      ]);

      const { result } = renderHook(() => useCamera('expirationDateOnly'));

      expect(result.current.hasGalleryPermission).toBe(false);
    });
  });

  describe('takePicture', () => {
    it('should return null when camera ref is not available', async () => {
      const { result } = renderHook(() => useCamera('expirationDateOnly'));

      // Camera ref is initially null current
      let photoUri;
      await act(async () => {
        photoUri = await result.current.takePicture();
      });

      expect(photoUri).toBeNull();
    });

    it('should set processing state during capture', async () => {
      // We can't easily mock CameraView ref, so test that processing state changes
      const { result } = renderHook(() => useCamera('expirationDateOnly'));

      // Manually set processing
      act(() => {
        result.current.setIsProcessingImage(true);
      });

      expect(result.current.isProcessingImage).toBe(true);

      act(() => {
        result.current.setIsProcessingImage(false);
      });

      expect(result.current.isProcessingImage).toBe(false);
    });
  });

  describe('requestCameraPermission', () => {
    it('should call native permission request', async () => {
      const requestPermission = jest.fn();
      mockedUseCameraPermissions.mockReturnValue([
        { granted: true, canAskAgain: true },
        requestPermission,
      ]);
      mockedUseMediaLibraryPermissions.mockReturnValue([{ granted: true, canAskAgain: true }, jest.fn()]);

      const { result } = renderHook(() => useCamera('expirationDateOnly'));

      await act(async () => {
        await result.current.requestCameraPermission();
      });

      expect(requestPermission).toHaveBeenCalled();
    });

    it('should handle error during permission request', async () => {
      const requestPermission = jest.fn().mockRejectedValue(new Error('Permission error'));
      mockedUseCameraPermissions.mockReturnValue([
        { granted: false, canAskAgain: true },
        requestPermission,
      ]);
      mockedUseMediaLibraryPermissions.mockReturnValue([{ granted: true, canAskAgain: true }, jest.fn()]);

      const { result } = renderHook(() => useCamera('expirationDateOnly'));

      await act(async () => {
        await result.current.requestCameraPermission();
      });

      // Should not throw - error is caught internally
      expect(result.current.hasCameraPermission).toBe(false);
    });
  });

  describe('requestGalleryPermission', () => {
    it('should call native gallery permission request', async () => {
      const requestPermission = jest.fn();
      mockedUseCameraPermissions.mockReturnValue([{ granted: true, canAskAgain: true }, jest.fn()]);
      mockedUseMediaLibraryPermissions.mockReturnValue([
        { granted: true, canAskAgain: true },
        requestPermission,
      ]);

      const { result } = renderHook(() => useCamera('expirationDateOnly'));

      await act(async () => {
        await result.current.requestGalleryPermission();
      });

      expect(requestPermission).toHaveBeenCalled();
    });
  });

  describe('pickImage', () => {
    it('should return URI when image is selected from gallery', async () => {
      mockedLaunchImageLibraryAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file://test.jpg', width: 1920, height: 1080 }],
      });
      mockedManipulateAsync.mockResolvedValueOnce({
        uri: 'file://processed.jpg',
        width: 1000,
        height: 750,
      });

      const { result } = renderHook(() => useCamera('productPhoto'));

      let uri;
      await act(async () => {
        uri = await result.current.pickImage();
      });

      expect(uri).toBe('file://processed.jpg');
      expect(mockedLaunchImageLibraryAsync).toHaveBeenCalled();
    });

    it('should return null when gallery selection is cancelled', async () => {
      mockedLaunchImageLibraryAsync.mockResolvedValueOnce({
        canceled: true,
        assets: [],
      });

      const { result } = renderHook(() => useCamera('productPhoto'));

      let uri;
      await act(async () => {
        uri = await result.current.pickImage();
      });

      expect(uri).toBeNull();
    });

    it('should use prepareImageForOCR in expirationDateOnly mode', async () => {
      mockedLaunchImageLibraryAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file://gallery.jpg', width: 4032, height: 3024 }],
      });

      // Mock the crop+resize for OCR mode
      mockedManipulateAsync.mockImplementation(async (uri, operations, options) => {
        return { uri: 'file://ocr-ready.jpg', width: 1200, height: 600 };
      });

      const { result } = renderHook(() => useCamera('expirationDateOnly'));

      let uri;
      await act(async () => {
        uri = await result.current.pickImage();
      });

      expect(uri).toBe('file://ocr-ready.jpg');
    });

    it('should handle errors during image pick', async () => {
      mockedLaunchImageLibraryAsync.mockRejectedValueOnce(new Error('Picker error'));

      const { result } = renderHook(() => useCamera('expirationDateOnly'));

      let uri;
      await act(async () => {
        uri = await result.current.pickImage();
      });

      expect(uri).toBeNull();
    });
  });

  describe('Capture Mode', () => {
    it('should not affect initialization with updateProductPhoto mode', () => {
      const { result } = renderHook(() => useCamera('updateProductPhoto'));

      expect(result.current.hasCameraPermission).toBeDefined();
      expect(result.current.hasGalleryPermission).toBeDefined();
    });
  });
});
