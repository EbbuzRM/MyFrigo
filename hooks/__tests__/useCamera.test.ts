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
import { saveImagePermanently } from '@/utils/imageStorage';
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

// Mock imageStorage so the test does not need a real expo-file-system.
// The camera ref is null in these tests, so saveImagePermanently is never
// actually executed, but the import must resolve cleanly.
jest.mock('@/utils/imageStorage', () => ({
  saveImagePermanently: jest.fn((uri: string) => Promise.resolve(uri)),
  deleteProductImage: jest.fn(() => Promise.resolve()),
}));

const mockedUseCameraPermissions = useCameraPermissions as jest.Mock;
const mockedUseMediaLibraryPermissions = ImagePicker.useMediaLibraryPermissions as jest.Mock;
const mockedLaunchImageLibraryAsync = ImagePicker.launchImageLibraryAsync as jest.Mock;
const mockedManipulateAsync = ImageManipulator.manipulateAsync as jest.Mock;
const mockedSaveImagePermanently = saveImagePermanently as jest.Mock;

/**
 * Helper: installs a mock takePictureAsync on the hook's camera ref and
 * restores the original ref to null in an afterEach hook. This lets the
 * caller simulate a working camera without re-rendering the hook.
 */
const installMockCameraRef = (takePictureImpl: () => Promise<any>) => {
  const mockTakePictureAsync = jest.fn(takePictureImpl);
  let ref: any = null;
  const originalAfterEach = () => {
    if (ref) {
      ref.current = null;
      ref = null;
    }
  };
  return {
    mockTakePictureAsync,
    attach: (cameraRef: any) => {
      ref = cameraRef;
      cameraRef.current = { takePictureAsync: mockTakePictureAsync };
    },
    cleanup: originalAfterEach,
  };
};

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

  /**
   * Fix #6: modalita productPhoto deve ridimensionare la foto a 1200px
   * prima di salvarla permanentemente. Senza resize, foto a piena
   * risoluzione (12-48 MP) causano decode lento e memory pressure.
   */
  describe('takePicture - productPhoto resize (Fix #6)', () => {
    const originalPhoto = {
      uri: 'file:///tmp/camera/original.jpg',
      width: 4032,
      height: 3024,
    };
    const resizedPhoto = {
      uri: 'file:///tmp/camera/resized.jpg',
      width: 1200,
      height: 900,
    };

    afterEach(() => {
      // Ripristina sempre lo stato del ref dopo ogni test di questa suite
      // per non interferire con altri describe.
      jest.restoreAllMocks();
    });

    it('should call ImageManipulator.manipulateAsync with width 1200 in productPhoto mode', async () => {
      mockedManipulateAsync.mockResolvedValueOnce(resizedPhoto);
      mockedSaveImagePermanently.mockResolvedValueOnce(
        'file:///documents/products/product_123.jpg'
      );

      const { result } = renderHook(() => useCamera('productPhoto'));
      const { mockTakePictureAsync, attach, cleanup } = installMockCameraRef(() =>
        Promise.resolve(originalPhoto)
      );
      attach(result.current.cameraRef);

      let photoUri: string | null = null;
      await act(async () => {
        photoUri = await result.current.takePicture();
      });

      cleanup();

      expect(mockTakePictureAsync).toHaveBeenCalled();
      expect(mockedManipulateAsync).toHaveBeenCalledTimes(1);
      const [uriArg, opsArg, optsArg] = mockedManipulateAsync.mock.calls[0];
      expect(uriArg).toBe(originalPhoto.uri);

      // Verifica resize a 1200px
      const resizeOp = opsArg.find((op: any) => op.resize);
      expect(resizeOp).toEqual({ resize: { width: 1200 } });

      // Verifica opzioni: JPEG, compress 0.85, no base64
      expect(optsArg.format).toBe('jpeg');
      expect(optsArg.compress).toBe(0.85);
      expect(optsArg.base64).toBe(false);
      expect(photoUri).toBe('file:///documents/products/product_123.jpg');
    });

    it('should pass the RESIZED uri to saveImagePermanently, not the original', async () => {
      mockedManipulateAsync.mockResolvedValueOnce(resizedPhoto);
      mockedSaveImagePermanently.mockResolvedValueOnce(
        'file:///documents/products/persistent.jpg'
      );

      const { result } = renderHook(() => useCamera('productPhoto'));
      const { attach, cleanup } = installMockCameraRef(() =>
        Promise.resolve(originalPhoto)
      );
      attach(result.current.cameraRef);

      await act(async () => {
        await result.current.takePicture();
      });

      cleanup();

      // saveImagePermanently deve ricevere resizedPhoto.uri, NON originalPhoto.uri
      expect(mockedSaveImagePermanently).toHaveBeenCalledTimes(1);
      expect(mockedSaveImagePermanently).toHaveBeenCalledWith(resizedPhoto.uri);
      expect(mockedSaveImagePermanently).not.toHaveBeenCalledWith(originalPhoto.uri);
    });

    it('should fall back to original uri if manipulateAsync throws', async () => {
      mockedManipulateAsync.mockRejectedValueOnce(new Error('Manipulation failed'));
      mockedSaveImagePermanently.mockResolvedValueOnce(
        'file:///documents/products/original-fallback.jpg'
      );

      const { result } = renderHook(() => useCamera('productPhoto'));
      const { attach, cleanup } = installMockCameraRef(() =>
        Promise.resolve(originalPhoto)
      );
      attach(result.current.cameraRef);

      let photoUri: string | null = null;
      await act(async () => {
        photoUri = await result.current.takePicture();
      });

      cleanup();

      // In caso di errore su manipulate, deve salvare l'URI originale
      expect(mockedSaveImagePermanently).toHaveBeenCalledTimes(1);
      expect(mockedSaveImagePermanently).toHaveBeenCalledWith(originalPhoto.uri);
      expect(photoUri).toBe('file:///documents/products/original-fallback.jpg');
    });

    it('should not call productPhoto resize in expirationDateOnly mode (no-regression)', async () => {
      // In expirationDateOnly, prepareImageForOCR gestisce tutto: usa
      // manipulateAsync con crop+resize a 1200px ma NON chiama saveImagePermanently.
      // Questo test verifica che il flusso expirationDateOnly resti invariato.
      mockedManipulateAsync.mockResolvedValueOnce({
        uri: 'file:///tmp/ocr-ready.jpg',
        width: 1200,
        height: 700,
      });

      const { result } = renderHook(() => useCamera('expirationDateOnly'));
      const { attach, cleanup } = installMockCameraRef(() =>
        Promise.resolve({
          uri: 'file:///tmp/camera/original.jpg',
          width: 4032,
          height: 3024,
        })
      );
      attach(result.current.cameraRef);

      let photoUri: string | null = null;
      await act(async () => {
        photoUri = await result.current.takePicture();
      });

      cleanup();

      // expirationDateOnly chiama manipulateAsync UNA volta (via prepareImageForOCR)
      expect(mockedManipulateAsync).toHaveBeenCalledTimes(1);
      const [, opsArg] = mockedManipulateAsync.mock.calls[0];
      // prepareImageForOCR fa crop+resize (3 ops) — diverso dal productPhoto
      // che fa solo resize (2 ops, no crop).
      const hasCrop = opsArg.some((op: any) => op.crop);
      expect(hasCrop).toBe(true);

      // expirationDateOnly NON deve chiamare saveImagePermanently
      // (l'immagine OCR-ready non è persistente in questo flusso)
      expect(mockedSaveImagePermanently).not.toHaveBeenCalled();
      expect(photoUri).toBe('file:///tmp/ocr-ready.jpg');
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
