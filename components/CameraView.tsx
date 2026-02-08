import React, { memo } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { CameraView as ExpoCameraView } from 'expo-camera';
import { Camera as CameraIcon, Image as ImageIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import { PhotoCaptureStyles } from '@/app/_photo-capture.styles';
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
}) => {
  const isExpirationDateMode = captureMode === 'expirationDateOnly';

  return (
    <>
      <ExpoCameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        accessibilityLabel="Vista fotocamera"
        accessibilityHint="Inquadra il prodotto e tocca il pulsante centrale per scattare la foto"
        {...(isExpirationDateMode && {
          zoom: 0.1,
          autoFocus: 'on',
        })}
      />

      {/* Focus frame positioned absolutely over the camera */}
      {isExpirationDateMode && (
        <View style={styles.macroFocusFrame}>
          <Text style={styles.focusFrameText}>
            Fotografa la scadenza
          </Text>
        </View>
      )}

      <View style={styles.cameraControlsContainer}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={onPickImage}
          accessibilityLabel="Seleziona dalla galleria"
          accessibilityRole="button"
          testID="pick-image-button"
        >
          <ImageIcon size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.captureButton}
          onPress={onTakePicture}
          accessibilityLabel="Scatta foto"
          accessibilityRole="button"
          testID="capture-button"
        >
          <CameraIcon size={32} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => router.back()}
          accessibilityLabel="Torna indietro"
          accessibilityRole="button"
        >
          <Text style={styles.controlButtonText}>Indietro</Text>
        </TouchableOpacity>
      </View>
    </>
  );
});

CameraView.displayName = 'CameraView';
