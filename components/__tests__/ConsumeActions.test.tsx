// ConsumeActions.test.tsx — ConsumeActions.test module.
//
// exports: none
// used_by: none
// rules:   none

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ConsumeActions } from '../ConsumeActions';

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    CheckCircle: (props: any) => React.createElement(Text, { testID: 'check-circle-icon' }, 'CheckCircle'),
  };
});

describe('ConsumeActions', () => {
  const mockStyles = {
    containerStyle: {},
    buttonStyle: {},
    cancelButtonStyle: {},
    confirmButtonStyle: {},
    disabledButtonStyle: {},
    buttonTextStyle: {},
    cancelButtonTextStyle: {},
  };

  const defaultProps = {
    onCancel: jest.fn(),
    onConfirm: jest.fn(),
    isConfirmDisabled: false,
    ...mockStyles,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders cancel button with "Annulla" text', () => {
    const { getByText } = render(<ConsumeActions {...defaultProps} />);
    expect(getByText('Annulla')).toBeTruthy();
  });

  it('renders confirm button with "Conferma" text', () => {
    const { getByText } = render(<ConsumeActions {...defaultProps} />);
    expect(getByText('Conferma')).toBeTruthy();
  });

  it('calls onCancel when cancel button is pressed', () => {
    const onCancel = jest.fn();
    const { getByText } = render(
      <ConsumeActions {...defaultProps} onCancel={onCancel} />
    );
    fireEvent.press(getByText('Annulla'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm button is pressed and not disabled', () => {
    const onConfirm = jest.fn();
    const { getByText } = render(
      <ConsumeActions {...defaultProps} onConfirm={onConfirm} />
    );
    fireEvent.press(getByText('Conferma'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('does not call onConfirm when confirm button is disabled', () => {
    const onConfirm = jest.fn();
    const { getByText } = render(
      <ConsumeActions {...defaultProps} onConfirm={onConfirm} isConfirmDisabled={true} />
    );
    fireEvent.press(getByText('Conferma'));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('cancel button has accessibilityLabel "Annulla"', () => {
    const { getByLabelText } = render(<ConsumeActions {...defaultProps} />);
    expect(getByLabelText('Annulla')).toBeTruthy();
  });

  it('confirm button has accessibilityLabel "Conferma"', () => {
    const { getByLabelText } = render(<ConsumeActions {...defaultProps} />);
    expect(getByLabelText('Conferma')).toBeTruthy();
  });

  it('confirm button has accessibilityState disabled when isConfirmDisabled is true', () => {
    const { getByLabelText } = render(
      <ConsumeActions {...defaultProps} isConfirmDisabled={true} />
    );
    const confirmButton = getByLabelText('Conferma');
    expect(confirmButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('confirm button does not have disabled state when isConfirmDisabled is false', () => {
    const { getByLabelText } = render(
      <ConsumeActions {...defaultProps} isConfirmDisabled={false} />
    );
    const confirmButton = getByLabelText('Conferma');
    expect(confirmButton.props.accessibilityState?.disabled).toBe(false);
  });

  it('cancel button has testID "cancel-button"', () => {
    const { getByTestId } = render(<ConsumeActions {...defaultProps} />);
    expect(getByTestId('cancel-button')).toBeTruthy();
  });

  it('confirm button has testID "confirm-button"', () => {
    const { getByTestId } = render(<ConsumeActions {...defaultProps} />);
    expect(getByTestId('confirm-button')).toBeTruthy();
  });

  it('renders the CheckCircle icon', () => {
    const { getByTestId } = render(<ConsumeActions {...defaultProps} />);
    expect(getByTestId('check-circle-icon')).toBeTruthy();
  });
});
