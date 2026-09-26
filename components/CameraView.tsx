// CameraView.tsx — CameraView module.
//
// exports: CameraView
// used_by: app\photo-capture.tsx
// rules:   - CameraView component depends on `PhotoCaptureStyles` type from `@/styles/photo-capture.styles` and `CaptureMode` type from `@/hooks/useCamera`
//          - ExpoCameraView ref must be passed as a prop and typed as `React.RefObject<ExpoCameraView | null>`
//          - Component is memoized and uses `memo` for performance optimization
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import React, { memo } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { CameraView as ExpoCameraView } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import { Camera as CameraIcon, Image as ImageIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import { PhotoCaptureStyles } from '@/styles/photo-capture.styles';
import { CaptureMode } from '@/hooks/useCamera';

/**
 * Props for CameraView component
 */
interface CameraViewProps {
  /** Camera reference for taking pictures */
  cameraRef: React.RefObject<ExpoCameraView | null>;
  /** Current styles based on theme */
  styles: PhotoCaptureStyles;
  /** Current capture mode affecting camera settings */
  captureMode: CaptureMode;
  /** Callback when capture button is pressed */
  onTakePicture: () => void;
  /** Callback when gallery button is pressed */
  onPickImage: () => void;
  /** Whether the camera stream should be running (tie to screen focus) */
  isActive?: boolean;
}

/**
 * Camera interface component with controls and focus frame.
 * Displays the camera preview with capture button, gallery access,
 * and a focus frame when in expiration date capture mode.
 */
export const CameraView: React.FC<CameraViewProps> = memo(({
  cameraRef,
  styles,
  captureMode,
  onTakePicture,
  onPickImage,
  isActive = true,
}) => {
  const { t } = useTranslation();
  const isExpirationDateMode = captureMode === 'expirationDateOnly';

  return (
    <>
      <ExpoCameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        active={isActive}
        accessibilityLabel={t('scanner.cameraView')}
        accessibilityHint={t('scanner.cameraCaptureHint')}
        {...(isExpirationDateMode && {
          zoom: 0.1,
          autoFocus: 'on',
        })}
      />

      {/* Focus frame positioned absolutely over the camera */}
      {isExpirationDateMode && (
        <View style={styles.macroFocusFrame}>
          <Text style={styles.focusFrameText}>
            {t('scanner.captureExpiry')}
          </Text>
        </View>
      )}

      <View style={styles.cameraControlsContainer}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={onPickImage}
          accessibilityLabel={t('scanner.chooseGallery')}
          accessibilityRole="button"
          testID="pick-image-button"
        >
          <ImageIcon size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.captureButton}
          onPress={onTakePicture}
          accessibilityLabel={t('scanner.takePhoto')}
          accessibilityRole="button"
          testID="capture-button"
        >
          <CameraIcon size={32} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => router.back()}
          accessibilityLabel={t('common.goBack')}
          accessibilityRole="button"
        >
          <Text style={styles.controlButtonText}>{t('common.back')}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
});

CameraView.displayName = 'CameraView';
