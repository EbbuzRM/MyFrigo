import { StyleSheet } from 'react-native';

/**
 * Generates styles for the photo capture screen based on theme
 * @param isDarkMode - Whether dark mode is enabled
 * @returns StyleSheet object with all styles
 */
export const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: isDarkMode ? '#0d1117' : '#ffffff',
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: isDarkMode ? '#c9d1d9' : '#1e293b',
  },
  camera: {
    flex: 1,
  },
  macroFocusFrame: {
    position: 'absolute',
    top: '25%',
    left: '5%',
    right: '5%',
    bottom: '55%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 10,
  },
  focusFrameText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  cameraControlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 20,
    paddingHorizontal: 30,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 5,
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  confirmButton: {
    backgroundColor: '#28A745',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  ocrOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ocrProgressContainer: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 250,
  },
  ocrProgressText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    textAlign: 'center',
  },
  ocrProgressStep: {
    color: '#58a6ff',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginTop: 15,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28A745',
    borderRadius: 2,
  },
  resetOcrButton: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  resetOcrButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
});

/**
 * Type definition for the styles object returned by getStyles
 */
export type PhotoCaptureStyles = ReturnType<typeof getStyles>;
