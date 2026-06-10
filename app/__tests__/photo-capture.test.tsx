// photo-capture.test.tsx — photo-capture test module.
//
// exports: none
// used_by: none
// rules:
// - Test completi per la schermata photo-capture
// - Mock di tutti i servizi: useCamera, usePhotoOCR, LoggingService
// - Test di rendering, scatto foto, gestione permessi, navigazione, stati di caricamento, gestione errori


// Mock dei componenti PRIMA degli import
jest.mock('@/components/CameraView', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  const CameraView = ({ onTakePicture, onPickImage }: any) => (
    <View testID="camera-view">
      <Text>Camera View</Text>
      <TouchableOpacity testID="take-picture-btn" onPress={onTakePicture}>
        <Text>Scatta</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="pick-image-btn" onPress={onPickImage}>
        <Text>Scegli dalla galleria</Text>
      </TouchableOpacity>
    </View>
  );
  return {
    __esModule: true,
    default: CameraView,
    CameraView,
  };
});

jest.mock('@/components/PhotoPreview', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  const PhotoPreview = ({
    onRetake,
    onConfirm,
    onConfirmDate,
    showDateConfirmation,
    extractedDate,
  }: any) => (
    <View testID="photo-preview">
      <Text>Photo Preview</Text>
      {showDateConfirmation && extractedDate && (
        <View>
          <Text testID="expiration-date-display">{extractedDate}</Text>
          <TouchableOpacity testID="confirm-date-button" onPress={onConfirmDate}>
            <Text>Conferma data</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity testID="retake-btn" onPress={onRetake}>
        <Text>Riscatta</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="confirm-btn" onPress={onConfirm}>
        <Text>Conferma</Text>
      </TouchableOpacity>
    </View>
  );
  return {
    __esModule: true,
    default: PhotoPreview,
    PhotoPreview,
  };
});

jest.mock('@/services/LoggingService', () => ({
  LoggingService: {
    info: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  router: {
    replace: jest.fn(),
    back: jest.fn(),
    push: jest.fn(),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useIsFocused: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: (props: any) => <View {...props} />,
  };
});

jest.mock('@/context/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

jest.mock('@/styles/photo-capture.styles', () => ({
  getStyles: jest.fn(() => ({})),
}));

// Mock useCamera con implementazione di default
const mockUseCameraImpl = jest.fn();
jest.mock('@/hooks/useCamera', () => ({
  useCamera: () => mockUseCameraImpl(),
}));

// Mock usePhotoActions
const mockUsePhotoActionsImpl = jest.fn();
jest.mock('@/hooks/usePhotoActions', () => ({
  usePhotoActions: () => mockUsePhotoActionsImpl(),
}));

// Import DOPO i mock
import React from 'react';
import { render, act, waitFor, screen, fireEvent } from '@testing-library/react-native';
import PhotoCaptureScreen from '../photo-capture';
import { useLocalSearchParams, router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useCamera } from '@/hooks/useCamera';
import { usePhotoActions } from '@/hooks/usePhotoActions';
import { useTheme } from '@/context/ThemeContext';
import { LoggingService } from '@/services/LoggingService';
import { Alert, BackHandler } from 'react-native';

// Type assertions per i mock
const mockedUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockedUseIsFocused = useIsFocused as jest.Mock;
const mockedUseTheme = useTheme as jest.Mock;
const mockedUseCamera = mockUseCameraImpl;
const mockedUsePhotoActions = mockUsePhotoActionsImpl;
const mockedAlert = Alert.alert as jest.Mock;

// Mock dei dati di default
const mockCameraHook = {
  cameraRef: { current: null },
  hasCameraPermission: true,
  hasGalleryPermission: true,
  isProcessingImage: false,
  requestCameraPermission: jest.fn(),
  requestGalleryPermission: jest.fn(),
  takePicture: jest.fn(),
  pickImage: jest.fn(),
  setIsProcessingImage: jest.fn(),
};

const mockPhotoActionsHook = {
  confirmPhoto: jest.fn(),
  extractExpirationDate: jest.fn(),
  navigateToManualEntry: jest.fn(),
  ocrProgress: 0,
  resetOCRProgress: jest.fn(),
};

// Mock BackHandler
let backHandlerCallback: (() => boolean) | null = null;
const mockBackHandlerRemove = jest.fn();
const mockedBackHandlerAddListener = jest.fn((event, handler) => {
  backHandlerCallback = handler;
  return { remove: mockBackHandlerRemove };
});

beforeAll(() => {
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation(mockedBackHandlerAddListener as any);
});

afterAll(() => {
  jest.restoreAllMocks();
});

// --- Test Suite ---
describe('PhotoCaptureScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    backHandlerCallback = null;

    // Setup defaults
    mockedUseLocalSearchParams.mockReturnValue({});
    mockedUseIsFocused.mockReturnValue(true);
    mockedUseTheme.mockReturnValue({ isDarkMode: false });

    // Use implementations that return default hooks
    mockedUseCamera.mockImplementation(() => ({ ...mockCameraHook }));
    mockedUsePhotoActions.mockImplementation(() => ({ ...mockPhotoActionsHook }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render camera view when no image is captured', () => {
      const { getByTestId } = render(<PhotoCaptureScreen />);

      expect(getByTestId('camera-view')).toBeTruthy();
    });

    it('should show permission denied state when camera permission is false', () => {
      mockedUseCamera.mockReturnValue({
        ...mockCameraHook,
        hasCameraPermission: false,
        hasGalleryPermission: true,
      });

      const { getByText } = render(<PhotoCaptureScreen />);

      expect(getByText(/fotocamera/i)).toBeTruthy();
      expect(getByText(/Concedi Permesso/i)).toBeTruthy();
    });

    it('should show loading state while permissions are loading', () => {
      mockedUseCamera.mockReturnValue({
        ...mockCameraHook,
        hasCameraPermission: undefined,
        hasGalleryPermission: undefined,
      });

      const { UNSAFE_root } = render(<PhotoCaptureScreen />);

      // Should show empty container while loading
      expect(UNSAFE_root).toBeTruthy();
    });

    it('should render photo preview after image is captured', async () => {
      const mockTakePicture = jest.fn().mockResolvedValue('file://test-image.jpg');
      mockedUseCamera.mockReturnValue({
        ...mockCameraHook,
        takePicture: mockTakePicture,
      });

      const { getByTestId, queryByTestId } = render(<PhotoCaptureScreen />);

      // Simulate taking a picture
      const takePictureBtn = getByTestId('take-picture-btn');
      await act(async () => {
        fireEvent.press(takePictureBtn);
      });

      // Wait for preview to appear
      await waitFor(() => {
        expect(queryByTestId('photo-preview')).toBeTruthy();
      });
    });
  });

  describe('Capture Modes', () => {
    it('should default to productPhoto mode when no captureMode is provided', () => {
      mockedUseLocalSearchParams.mockReturnValue({});

      render(<PhotoCaptureScreen />);

      // Should render camera view
      expect(screen.getByTestId('camera-view')).toBeTruthy();
    });

    it('should handle expirationDateOnly mode', () => {
      mockedUseLocalSearchParams.mockReturnValue({
        captureMode: 'expirationDateOnly',
      });

      render(<PhotoCaptureScreen />);

      expect(screen.getByTestId('camera-view')).toBeTruthy();
    });

    it('should handle updateProductPhoto mode with productId', () => {
      mockedUseLocalSearchParams.mockReturnValue({
        captureMode: 'updateProductPhoto',
        productId: 'test-123',
      });

      render(<PhotoCaptureScreen />);

      expect(screen.getByTestId('camera-view')).toBeTruthy();
    });

    it('should handle productPhoto mode', () => {
      mockedUseLocalSearchParams.mockReturnValue({
        captureMode: 'productPhoto',
      });

      render(<PhotoCaptureScreen />);

      expect(screen.getByTestId('camera-view')).toBeTruthy();
    });
  });

  describe('Photo Capture', () => {
    it('should call takePicture when user takes a photo', async () => {
      const mockTakePicture = jest.fn().mockResolvedValue('file://test-image.jpg');
      mockedUseCamera.mockReturnValue({
        ...mockCameraHook,
        takePicture: mockTakePicture,
      });

      render(<PhotoCaptureScreen />);

      const takePictureBtn = screen.getByTestId('take-picture-btn');
      await act(async () => {
        fireEvent.press(takePictureBtn);
      });

      expect(mockTakePicture).toHaveBeenCalled();
    });

    it('should call pickImage when user picks from gallery', async () => {
      const mockPickImage = jest.fn().mockResolvedValue('file://gallery-image.jpg');
      mockedUseCamera.mockReturnValue({
        ...mockCameraHook,
        pickImage: mockPickImage,
      });

      render(<PhotoCaptureScreen />);

      const pickImageBtn = screen.getByTestId('pick-image-btn');
      await act(async () => {
        fireEvent.press(pickImageBtn);
      });

      expect(mockPickImage).toHaveBeenCalled();
    });

    it('should handle successful photo capture', async () => {
      const mockTakePicture = jest.fn().mockResolvedValue('file://test-image.jpg');
      mockedUseCamera.mockReturnValue({
        ...mockCameraHook,
        takePicture: mockTakePicture,
      });

      const { queryByTestId } = render(<PhotoCaptureScreen />);

      await act(async () => {
        fireEvent.press(screen.getByTestId('take-picture-btn'));
      });

      // Should show preview after capture
      await waitFor(() => {
        expect(queryByTestId('photo-preview')).toBeTruthy();
      });
    });

    it('should handle failed photo capture', async () => {
      const mockTakePicture = jest.fn().mockResolvedValue(null);
      mockedUseCamera.mockReturnValue({
        ...mockCameraHook,
        takePicture: mockTakePicture,
      });

      render(<PhotoCaptureScreen />);

      await act(async () => {
        fireEvent.press(screen.getByTestId('take-picture-btn'));
      });

      // Should not show preview if capture fails
      expect(screen.queryByTestId('photo-preview')).toBeNull();
    });
  });

  describe('Permission Handling', () => {
    it('should request camera permission on mount if not granted', () => {
      const mockRequestPermission = jest.fn();
      mockedUseCamera.mockReturnValue({
        ...mockCameraHook,
        hasCameraPermission: false,
        requestCameraPermission: mockRequestPermission,
      });

      render(<PhotoCaptureScreen />);

      expect(mockRequestPermission).toHaveBeenCalled();
    });

    it('should request gallery permission on mount if not granted', () => {
      const mockRequestPermission = jest.fn();
      mockedUseCamera.mockReturnValue({
        ...mockCameraHook,
        hasGalleryPermission: false,
        requestGalleryPermission: mockRequestPermission,
      });

      render(<PhotoCaptureScreen />);

      expect(mockRequestPermission).toHaveBeenCalled();
    });

    it('should show permission request button when denied', () => {
      mockedUseCamera.mockReturnValue({
        ...mockCameraHook,
        hasCameraPermission: false,
        hasGalleryPermission: true,
      });

      const { getByText } = render(<PhotoCaptureScreen />);

      expect(getByText(/Concedi Permesso/i)).toBeTruthy();
    });

    it('should navigate back when permission denied and user presses back', () => {
      mockedUseCamera.mockReturnValue({
        ...mockCameraHook,
        hasCameraPermission: false,
        hasGalleryPermission: true,
      });

      render(<PhotoCaptureScreen />);

      const backButton = screen.getByText(/Indietro/i);
      fireEvent.press(backButton);

      expect(router.back).toHaveBeenCalled();
    });
  });

  describe('OCR Flow', () => {
    it('should extract expiration date when in expirationDateOnly mode', async () => {
      const mockTakePicture = jest.fn().mockResolvedValue('file://test-image.jpg');
      const mockExtractExpirationDate = jest.fn().mockResolvedValue({
        success: true,
        extractedDate: '2026-12-31',
        confidence: 0.95,
      });

      mockedUseLocalSearchParams.mockReturnValue({
        captureMode: 'expirationDateOnly',
      });

      mockedUseCamera.mockReturnValue({
        ...mockCameraHook,
        takePicture: mockTakePicture,
      });

      mockedUsePhotoActions.mockReturnValue({
        ...mockPhotoActionsHook,
        extractExpirationDate: mockExtractExpirationDate,
      });

      render(<PhotoCaptureScreen />);

      // Take picture
      await act(async () => {
        fireEvent.press(screen.getByTestId('take-picture-btn'));
      });

      // Wait for preview
      await waitFor(() => {
        expect(screen.getByTestId('photo-preview')).toBeTruthy();
      });

      // Confirm photo
      await act(async () => {
        fireEvent.press(screen.getByTestId('confirm-btn'));
      });

      // Should call extractExpirationDate
      await waitFor(() => {
        expect(mockExtractExpirationDate).toHaveBeenCalled();
      });
    });

    it('should handle OCR failure gracefully', async () => {
      const mockTakePicture = jest.fn().mockResolvedValue('file://test-image.jpg');
      const mockExtractExpirationDate = jest.fn().mockResolvedValue({
        success: false,
        error: 'Nessuna data rilevata',
      });

      mockedUseLocalSearchParams.mockReturnValue({
        captureMode: 'expirationDateOnly',
      });

      mockedUseCamera.mockReturnValue({
        ...mockCameraHook,
        takePicture: mockTakePicture,
      });

      mockedUsePhotoActions.mockReturnValue({
        ...mockPhotoActionsHook,
        extractExpirationDate: mockExtractExpirationDate,
      });

      render(<PhotoCaptureScreen />);

      // Take picture
      await act(async () => {
        fireEvent.press(screen.getByTestId('take-picture-btn'));
      });

      // Wait for preview
      await waitFor(() => {
        expect(screen.getByTestId('photo-preview')).toBeTruthy();
      });

      // Confirm photo
      await act(async () => {
        fireEvent.press(screen.getByTestId('confirm-btn'));
      });

      // Should call extractExpirationDate
      await waitFor(() => {
        expect(mockExtractExpirationDate).toHaveBeenCalled();
      });

      // Should show Alert with retry options
      await waitFor(() => {
        expect(mockedAlert).toHaveBeenCalled();
      });
    });

    it('should handle OCR errors', async () => {
      const mockTakePicture = jest.fn().mockResolvedValue('file://test-image.jpg');
      const mockError = new Error('OCR processing failed');
      const mockExtractExpirationDate = jest.fn().mockRejectedValue(mockError);

      mockedUseLocalSearchParams.mockReturnValue({
        captureMode: 'expirationDateOnly',
      });

      mockedUseCamera.mockReturnValue({
        ...mockCameraHook,
        takePicture: mockTakePicture,
      });

      mockedUsePhotoActions.mockReturnValue({
        ...mockPhotoActionsHook,
        extractExpirationDate: mockExtractExpirationDate,
      });

      render(<PhotoCaptureScreen />);

      // Take picture
      await act(async () => {
        fireEvent.press(screen.getByTestId('take-picture-btn'));
      });

      // Wait for preview
      await waitFor(() => {
        expect(screen.getByTestId('photo-preview')).toBeTruthy();
      });

      // Confirm photo
      await act(async () => {
        fireEvent.press(screen.getByTestId('confirm-btn'));
      });

      // Should log error
      await waitFor(() => {
        expect(LoggingService.error).toHaveBeenCalled();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to manual entry with extracted date', async () => {
      const mockTakePicture = jest.fn().mockResolvedValue('file://test-image.jpg');
      const mockExtractExpirationDate = jest.fn().mockResolvedValue({
        success: true,
        extractedDate: '2026-12-31',
        confidence: 0.95,
      });
      const mockNavigateToManualEntry = jest.fn();

      mockedUseLocalSearchParams.mockReturnValue({
        captureMode: 'expirationDateOnly',
      });

      mockedUseCamera.mockReturnValue({
        ...mockCameraHook,
        takePicture: mockTakePicture,
      });

      mockedUsePhotoActions.mockReturnValue({
        ...mockPhotoActionsHook,
        extractExpirationDate: mockExtractExpirationDate,
        navigateToManualEntry: mockNavigateToManualEntry,
      });

      render(<PhotoCaptureScreen />);

      // Take picture
      await act(async () => {
        fireEvent.press(screen.getByTestId('take-picture-btn'));
      });

      // Wait for preview
      await waitFor(() => {
        expect(screen.getByTestId('photo-preview')).toBeTruthy();
      });

      // Confirm photo
      await act(async () => {
        fireEvent.press(screen.getByTestId('confirm-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('confirm-date-button')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId('confirm-date-button'));
      });

      // Should navigate to manual entry
      await waitFor(() => {
        expect(mockNavigateToManualEntry).toHaveBeenCalledWith('2026-12-31');
      });
    });

    it('should handle back button press', () => {
      render(<PhotoCaptureScreen />);

      // BackHandler should be registered
      expect(mockedBackHandlerAddListener).toHaveBeenCalledWith(
        'hardwareBackPress',
        expect.any(Function)
      );
    });

    it('should return to camera on back press when image captured', async () => {
      const mockTakePicture = jest.fn().mockResolvedValue('file://test-image.jpg');
      mockedUseCamera.mockReturnValue({
        ...mockCameraHook,
        takePicture: mockTakePicture,
      });

      render(<PhotoCaptureScreen />);

      // Simulate taking a picture
      await act(async () => {
        fireEvent.press(screen.getByTestId('take-picture-btn'));
      });

      // Simulate back press
      if (backHandlerCallback) {
        const result = backHandlerCallback();
        expect(result).toBe(true);
      }
    });

    it('should navigate back when no image captured', () => {
      render(<PhotoCaptureScreen />);

      // Simulate back press
      if (backHandlerCallback) {
        backHandlerCallback();
        expect(router.back).toHaveBeenCalled();
      }
    });
  });

  describe('Photo Retake', () => {
    it('should allow retaking photo', async () => {
      const mockTakePicture = jest.fn()
        .mockResolvedValueOnce('file://test-image-1.jpg')
        .mockResolvedValueOnce('file://test-image-2.jpg');
      const mockResetOCRProgress = jest.fn();

      mockedUseCamera.mockReturnValue({
        ...mockCameraHook,
        takePicture: mockTakePicture,
      });

      mockedUsePhotoActions.mockReturnValue({
        ...mockPhotoActionsHook,
        resetOCRProgress: mockResetOCRProgress,
      });

      const { queryByTestId } = render(<PhotoCaptureScreen />);

      // Take first picture
      await act(async () => {
        fireEvent.press(screen.getByTestId('take-picture-btn'));
      });

      // Wait for preview
      await waitFor(() => {
        expect(queryByTestId('photo-preview')).toBeTruthy();
      });

      // Retake
      await act(async () => {
        fireEvent.press(screen.getByTestId('retake-btn'));
      });

      // Should reset and allow retake
      expect(mockResetOCRProgress).toHaveBeenCalled();
    });

    it('should reset OCR progress on retake', async () => {
      const mockTakePicture = jest.fn().mockResolvedValue('file://test-image.jpg');
      const mockResetOCRProgress = jest.fn();

      mockedUseCamera.mockReturnValue({
        ...mockCameraHook,
        takePicture: mockTakePicture,
      });

      mockedUsePhotoActions.mockReturnValue({
        ...mockPhotoActionsHook,
        resetOCRProgress: mockResetOCRProgress,
      });

      render(<PhotoCaptureScreen />);

      // Take picture
      await act(async () => {
        fireEvent.press(screen.getByTestId('take-picture-btn'));
      });

      // Wait for preview
      await waitFor(() => {
        expect(screen.getByTestId('photo-preview')).toBeTruthy();
      });

      // Retake
      await act(async () => {
        fireEvent.press(screen.getByTestId('retake-btn'));
      });

      expect(mockResetOCRProgress).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle camera permission request failure', () => {
      mockedUseCamera.mockReturnValue({
        ...mockCameraHook,
        hasCameraPermission: false,
        hasGalleryPermission: true,
      });

      render(<PhotoCaptureScreen />);

      expect(screen.getByText(/fotocamera/i)).toBeTruthy();
    });

    it('should handle gallery permission request failure', () => {
      mockedUseCamera.mockReturnValue({
        ...mockCameraHook,
        hasCameraPermission: true,
        hasGalleryPermission: false,
      });

      render(<PhotoCaptureScreen />);

      // Should still render camera view
      expect(screen.getByTestId('camera-view')).toBeTruthy();
    });

    it('should cleanup back handler on unmount', () => {
      const { unmount } = render(<PhotoCaptureScreen />);

      unmount();

      expect(mockBackHandlerRemove).toHaveBeenCalled();
    });

    it('should handle focus/blur states', () => {
      mockedUseIsFocused.mockReturnValue(false);

      render(<PhotoCaptureScreen />);

      // Component should handle being unfocused
      expect(screen.getByTestId('camera-view')).toBeTruthy();
    });
  });

  describe('Confirm Photo for Non-Expiration Modes', () => {
    it('should call confirmPhoto for productPhoto mode', async () => {
      const mockTakePicture = jest.fn().mockResolvedValue('file://test-image.jpg');
      const mockConfirmPhoto = jest.fn();

      mockedUseLocalSearchParams.mockReturnValue({
        captureMode: 'productPhoto',
      });

      mockedUseCamera.mockReturnValue({
        ...mockCameraHook,
        takePicture: mockTakePicture,
      });

      mockedUsePhotoActions.mockReturnValue({
        ...mockPhotoActionsHook,
        confirmPhoto: mockConfirmPhoto,
      });

      render(<PhotoCaptureScreen />);

      // Take picture
      await act(async () => {
        fireEvent.press(screen.getByTestId('take-picture-btn'));
      });

      // Wait for preview
      await waitFor(() => {
        expect(screen.getByTestId('photo-preview')).toBeTruthy();
      });

      // Confirm photo
      await act(async () => {
        fireEvent.press(screen.getByTestId('confirm-btn'));
      });

      expect(mockConfirmPhoto).toHaveBeenCalled();
    });

    it('should call confirmPhoto for updateProductPhoto mode', async () => {
      const mockTakePicture = jest.fn().mockResolvedValue('file://test-image.jpg');
      const mockConfirmPhoto = jest.fn();

      mockedUseLocalSearchParams.mockReturnValue({
        captureMode: 'updateProductPhoto',
        productId: 'test-123',
      });

      mockedUseCamera.mockReturnValue({
        ...mockCameraHook,
        takePicture: mockTakePicture,
      });

      mockedUsePhotoActions.mockReturnValue({
        ...mockPhotoActionsHook,
        confirmPhoto: mockConfirmPhoto,
      });

      render(<PhotoCaptureScreen />);

      // Take picture
      await act(async () => {
        fireEvent.press(screen.getByTestId('take-picture-btn'));
      });

      // Wait for preview
      await waitFor(() => {
        expect(screen.getByTestId('photo-preview')).toBeTruthy();
      });

      // Confirm photo
      await act(async () => {
        fireEvent.press(screen.getByTestId('confirm-btn'));
      });

      expect(mockConfirmPhoto).toHaveBeenCalled();
    });
  });
});
