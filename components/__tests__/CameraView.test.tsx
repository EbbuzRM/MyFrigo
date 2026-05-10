// CameraView.test.tsx — CameraView.test module.
//
// exports: none
// used_by: none
// rules:   none

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CameraView } from '../CameraView';

// Mock expo-camera
jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    CameraView: React.forwardRef((props: any, ref: any) =>
      React.createElement(View, {
        testID: 'expo-camera-view',
        accessibilityLabel: props.accessibilityLabel,
        accessibilityHint: props.accessibilityHint,
      }, props.children)
    ),
  };
});

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Camera: (props: any) => React.createElement(Text, { testID: 'camera-lucide-icon' }, 'CameraIcon'),
    Image: (props: any) => React.createElement(Text, { testID: 'image-lucide-icon' }, 'ImageIcon'),
  };
});

describe('CameraView', () => {
  const mockStyles = {
    camera: { flex: 1 },
    macroFocusFrame: { position: 'absolute' as const, top: 100, left: 50 },
    focusFrameText: { color: '#fff' },
    cameraControlsContainer: { flexDirection: 'row' as const },
    controlButton: { padding: 10 },
    captureButton: { padding: 20 },
    controlButtonText: { color: '#fff' },
  };

  // Cast as any to satisfy PhotoCaptureStyles type requirements
  const defaultProps = {
    cameraRef: React.createRef<any>(),
    styles: mockStyles,
    captureMode: 'fullProduct' as const,
    onTakePicture: jest.fn(),
    onPickImage: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the camera view', () => {
    const { getByTestId } = render(<CameraView {...defaultProps} />);
    expect(getByTestId('expo-camera-view')).toBeTruthy();
  });

  it('renders the capture button', () => {
    const { getByTestId } = render(<CameraView {...defaultProps} />);
    expect(getByTestId('capture-button')).toBeTruthy();
  });

  it('renders the pick image button', () => {
    const { getByTestId } = render(<CameraView {...defaultProps} />);
    expect(getByTestId('pick-image-button')).toBeTruthy();
  });

  it('calls onTakePicture when capture button is pressed', () => {
    const onTakePicture = jest.fn();
    const { getByTestId } = render(
      <CameraView {...{ ...defaultProps, onTakePicture }} />
    );
    fireEvent.press(getByTestId('capture-button'));
    expect(onTakePicture).toHaveBeenCalledTimes(1);
  });

  it('calls onPickImage when gallery button is pressed', () => {
    const onPickImage = jest.fn();
    const { getByTestId } = render(
      <CameraView {...{ ...defaultProps, onPickImage }} />
    );
    fireEvent.press(getByTestId('pick-image-button'));
    expect(onPickImage).toHaveBeenCalledTimes(1);
  });

  it('does not show focus frame in fullProduct mode', () => {
    const { queryByText } = render(<CameraView {...defaultProps} />);
    expect(queryByText('Fotografa la scadenza')).toBeNull();
  });

  it('shows focus frame text in expirationDateOnly mode', () => {
    const { getByText } = render(
      <CameraView {...{ ...defaultProps, captureMode: 'expirationDateOnly' as const }} />
    );
    expect(getByText('Fotografa la scadenza')).toBeTruthy();
  });

  it('renders the back button text', () => {
    const { getByText } = render(<CameraView {...defaultProps} />);
    expect(getByText('Indietro')).toBeTruthy();
  });

  it('calls router.back when back button is pressed', () => {
    const { router } = require('expo-router');
    const { getByText } = render(<CameraView {...defaultProps} />);
    fireEvent.press(getByText('Indietro'));
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('has correct accessibility labels on camera view', () => {
    const { getByLabelText } = render(<CameraView {...defaultProps} />);
    expect(getByLabelText('Vista fotocamera')).toBeTruthy();
  });

  it('has correct accessibility label on capture button', () => {
    const { getByLabelText } = render(<CameraView {...defaultProps} />);
    expect(getByLabelText('Scatta foto')).toBeTruthy();
  });

  it('has correct accessibility label on gallery button', () => {
    const { getByLabelText } = render(<CameraView {...defaultProps} />);
    expect(getByLabelText('Seleziona dalla galleria')).toBeTruthy();
  });
});
