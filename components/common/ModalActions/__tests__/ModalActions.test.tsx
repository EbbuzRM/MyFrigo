import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ModalActions } from '../ModalActions';

// Mock dependencies
jest.mock('@/utils/scaleFont', () => ({
  scaleFont: (size: number) => size,
}));

describe('ModalActions', () => {
  const defaultProps = {
    onCancel: jest.fn(),
    onConfirm: jest.fn(),
    isDarkMode: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with required props', () => {
    const { getByText } = render(<ModalActions {...defaultProps} />);
    
    expect(getByText('Annulla')).toBeTruthy();
    expect(getByText('Conferma')).toBeTruthy();
  });

  it('should call onCancel when cancel button is pressed', () => {
    const onCancelMock = jest.fn();
    const { getByText } = render(
      <ModalActions {...defaultProps} onCancel={onCancelMock} />
    );
    
    const cancelButton = getByText('Annulla');
    fireEvent.press(cancelButton);
    
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });

  it('should call onConfirm when confirm button is pressed', () => {
    const onConfirmMock = jest.fn();
    const { getByText } = render(
      <ModalActions {...defaultProps} onConfirm={onConfirmMock} />
    );
    
    const confirmButton = getByText('Conferma');
    fireEvent.press(confirmButton);
    
    expect(onConfirmMock).toHaveBeenCalledTimes(1);
  });

  it('should disable confirm button when confirmDisabled is true', () => {
    const { getByLabelText } = render(
      <ModalActions {...defaultProps} confirmDisabled={true} />
    );
    
    const confirmButton = getByLabelText('Conferma');
    expect(confirmButton.props.accessibilityState.disabled).toBe(true);
  });

  it('should disable cancel button when isSubmitting is true', () => {
    const { getByLabelText } = render(
      <ModalActions {...defaultProps} isSubmitting={true} />
    );
    
    const cancelButton = getByLabelText('Annulla');
    expect(cancelButton.props.accessibilityState.disabled).toBe(true);
  });

  it('should disable confirm button when isSubmitting is true', () => {
    const { getByLabelText } = render(
      <ModalActions {...defaultProps} isSubmitting={true} />
    );
    
    const confirmButton = getByLabelText('Conferma');
    expect(confirmButton.props.accessibilityState.disabled).toBe(true);
  });

  it('should show loading indicator when isSubmitting is true', () => {
    const { getByText, UNSAFE_getByType } = render(
      <ModalActions {...defaultProps} isSubmitting={true} />
    );
    
    const ActivityIndicator = require('react-native').ActivityIndicator;
    const loadingIndicator = UNSAFE_getByType(ActivityIndicator);
    expect(loadingIndicator).toBeTruthy();
    expect(getByText('Salvataggio...')).toBeTruthy();
  });

  it('should not show loading indicator when isSubmitting is false', () => {
    const { queryByText } = render(
      <ModalActions {...defaultProps} isSubmitting={false} />
    );
    
    expect(queryByText('Salvataggio...')).toBeNull();
  });

  it('should not call onCancel when cancel button is pressed and isSubmitting is true', () => {
    const onCancelMock = jest.fn();
    const { getByText } = render(
      <ModalActions {...defaultProps} onCancel={onCancelMock} isSubmitting={true} />
    );
    
    const cancelButton = getByText('Annulla');
    fireEvent.press(cancelButton);
    
    expect(onCancelMock).not.toHaveBeenCalled();
  });

  it('should not call onConfirm when confirm button is pressed and disabled', () => {
    const onConfirmMock = jest.fn();
    const { getByLabelText } = render(
      <ModalActions {...defaultProps} onConfirm={onConfirmMock} confirmDisabled={true} />
    );
    
    const confirmButton = getByLabelText('Conferma');
    fireEvent.press(confirmButton);
    
    expect(onConfirmMock).not.toHaveBeenCalled();
  });

  it('should have accessibility label for cancel button', () => {
    const { getByLabelText } = render(<ModalActions {...defaultProps} />);
    
    expect(getByLabelText('Annulla')).toBeTruthy();
  });

  it('should have accessibility label for confirm button', () => {
    const { getByLabelText } = render(<ModalActions {...defaultProps} />);
    
    expect(getByLabelText('Conferma')).toBeTruthy();
  });

  it('should have accessibility role button for both buttons', () => {
    const { getByLabelText } = render(<ModalActions {...defaultProps} />);
    
    const cancelButton = getByLabelText('Annulla');
    const confirmButton = getByLabelText('Conferma');
    expect(cancelButton).toBeTruthy();
    expect(confirmButton).toBeTruthy();
    expect(cancelButton.props.accessibilityRole).toBe('button');
    expect(confirmButton.props.accessibilityRole).toBe('button');
  });

  it('should render with dark mode styles for cancel button', () => {
    const { getByText } = render(
      <ModalActions {...defaultProps} isDarkMode={true} />
    );
    
    const cancelText = getByText('Annulla');
    expect(cancelText.props.style).toMatchObject({
      color: '#c9d1d9',
    });
  });

  it('should render with light mode styles for cancel button', () => {
    const { getByText } = render(
      <ModalActions {...defaultProps} isDarkMode={false} />
    );
    
    const cancelText = getByText('Annulla');
    expect(cancelText.props.style).toMatchObject({
      color: '#374151',
    });
  });

  it('should apply disabled styles to confirm button when disabled', () => {
    const { getByLabelText } = render(
      <ModalActions {...defaultProps} confirmDisabled={true} />
    );
    
    const confirmButton = getByLabelText('Conferma');
    expect(confirmButton.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: expect.anything(),
        }),
      ])
    );
  });

  it('should handle multiple button presses', () => {
    const onCancelMock = jest.fn();
    const onConfirmMock = jest.fn();
    const { getByText } = render(
      <ModalActions {...defaultProps} onCancel={onCancelMock} onConfirm={onConfirmMock} />
    );
    
    fireEvent.press(getByText('Annulla'));
    fireEvent.press(getByText('Conferma'));
    fireEvent.press(getByText('Annulla'));
    
    expect(onCancelMock).toHaveBeenCalledTimes(2);
    expect(onConfirmMock).toHaveBeenCalledTimes(1);
  });

  it('should show white loading indicator color when submitting', () => {
    const { UNSAFE_getByType } = render(
      <ModalActions {...defaultProps} isSubmitting={true} />
    );
    
    const ActivityIndicator = require('react-native').ActivityIndicator;
    const loadingIndicator = UNSAFE_getByType(ActivityIndicator);
    expect(loadingIndicator.props.color).toBe('#ffffff');
  });

  it('should disable confirm button when both isSubmitting and confirmDisabled are true', () => {
    const { getByLabelText } = render(
      <ModalActions {...defaultProps} isSubmitting={true} confirmDisabled={true} />
    );
    
    const confirmButton = getByLabelText('Conferma');
    expect(confirmButton.props.accessibilityState.disabled).toBe(true);
  });
});
