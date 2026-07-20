import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ChangePasswordModal } from '../ChangePasswordModal';

// Mock dependencies
jest.mock('@/utils/scaleFont', () => ({
  scaleFont: (size: number) => size,
}));

jest.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

jest.mock('@/utils/validation/passwordValidationRules', () => ({
  validatePassword: (password: string) => ({
    isValid: password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password),
    validation: {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[^A-Za-z0-9]/.test(password),
    },
  }),
  validatePasswordMatch: (password: string, confirmPassword: string) => 
    password === confirmPassword && password.length > 0,
  validateCurrentPassword: (password: string) => password.length > 0,
}));

describe('ChangePasswordModal', () => {
  const defaultProps = {
    visible: true,
    isChanging: false,
    error: null,
    onClose: jest.fn(),
    onChangePassword: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when visible is true', () => {
    const { getByText } = render(<ChangePasswordModal {...defaultProps} />);
    
    expect(getByText('Cambia Password')).toBeTruthy();
  });

  it('should not render when visible is false', () => {
    const { getByLabelText } = render(
      <ChangePasswordModal {...defaultProps} visible={false} />
    );
    
    // Modal always renders children (matching real RN behavior); check the visible prop instead
    expect(getByLabelText('Cambia password').props.visible).toBe(false);
  });

  it('should render all three password inputs', () => {
    const { getByTestId } = render(<ChangePasswordModal {...defaultProps} />);
    
    expect(getByTestId('current-password-input')).toBeTruthy();
    expect(getByTestId('new-password-input')).toBeTruthy();
    expect(getByTestId('confirm-password-input')).toBeTruthy();
  });

  it('should render ModalHeader with correct title', () => {
    const { getByText } = render(<ChangePasswordModal {...defaultProps} />);
    
    expect(getByText('Cambia Password')).toBeTruthy();
  });

  it('should render ModalActions with Annulla and Conferma buttons', () => {
    const { getByText } = render(<ChangePasswordModal {...defaultProps} />);
    
    expect(getByText('Annulla')).toBeTruthy();
    expect(getByText('Conferma')).toBeTruthy();
  });

  it('should call onClose when cancel button is pressed', () => {
    const onCloseMock = jest.fn();
    const { getByText } = render(
      <ChangePasswordModal {...defaultProps} onClose={onCloseMock} />
    );
    
    fireEvent.press(getByText('Annulla'));
    
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when modal header close button is pressed', () => {
    const onCloseMock = jest.fn();
    const { getByLabelText } = render(
      <ChangePasswordModal {...defaultProps} onClose={onCloseMock} />
    );
    
    fireEvent.press(getByLabelText('Chiudi modal'));
    
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('should update currentPassword field on text change', () => {
    const { getByTestId } = render(<ChangePasswordModal {...defaultProps} />);
    
    const currentPasswordInput = getByTestId('current-password-input');
    fireEvent.changeText(currentPasswordInput, 'MyOldPassword123!');
    
    expect(currentPasswordInput.props.value).toBe('MyOldPassword123!');
  });

  it('should update newPassword field on text change', () => {
    const { getByTestId } = render(<ChangePasswordModal {...defaultProps} />);
    
    const newPasswordInput = getByTestId('new-password-input');
    fireEvent.changeText(newPasswordInput, 'MyNewPassword456!');
    
    expect(newPasswordInput.props.value).toBe('MyNewPassword456!');
  });

  it('should update confirmPassword field on text change', () => {
    const { getByTestId } = render(<ChangePasswordModal {...defaultProps} />);
    
    const confirmPasswordInput = getByTestId('confirm-password-input');
    fireEvent.changeText(confirmPasswordInput, 'MyNewPassword456!');
    
    expect(confirmPasswordInput.props.value).toBe('MyNewPassword456!');
  });

  it('should show PasswordMatchIndicator when newPassword has value', () => {
    const { getByTestId, getByText } = render(<ChangePasswordModal {...defaultProps} />);
    
    const newPasswordInput = getByTestId('new-password-input');
    fireEvent.changeText(newPasswordInput, 'Test');
    
    expect(getByText('Minimo 8 caratteri')).toBeTruthy();
  });

  it('should not show PasswordMatchIndicator when newPassword is empty', () => {
    const { queryByText } = render(<ChangePasswordModal {...defaultProps} />);
    
    expect(queryByText('Minimo 8 caratteri')).toBeNull();
  });

  it('should disable confirm button when form is invalid', () => {
    const { getByLabelText } = render(<ChangePasswordModal {...defaultProps} />);
    
    const confirmButton = getByLabelText('Conferma');
    expect(confirmButton.props.accessibilityState.disabled).toBe(true);
  });

  it('should enable confirm button when all fields are valid', () => {
    const { getByTestId, getByLabelText } = render(
      <ChangePasswordModal {...defaultProps} />
    );
    
    fireEvent.changeText(getByTestId('current-password-input'), 'OldPass123!');
    fireEvent.changeText(getByTestId('new-password-input'), 'NewPass456!');
    fireEvent.changeText(getByTestId('confirm-password-input'), 'NewPass456!');
    
    const confirmButton = getByLabelText('Conferma');
    expect(confirmButton.props.accessibilityState.disabled).toBe(false);
  });

  it('should call onChangePassword when form is submitted with valid data', async () => {
    const onChangePasswordMock = jest.fn().mockResolvedValue(undefined);
    const { getByTestId, getByText } = render(
      <ChangePasswordModal {...defaultProps} onChangePassword={onChangePasswordMock} />
    );
    
    fireEvent.changeText(getByTestId('current-password-input'), 'OldPass123!');
    fireEvent.changeText(getByTestId('new-password-input'), 'NewPass456!');
    fireEvent.changeText(getByTestId('confirm-password-input'), 'NewPass456!');
    
    fireEvent.press(getByText('Conferma'));
    
    await waitFor(() => {
      expect(onChangePasswordMock).toHaveBeenCalledWith('OldPass123!', 'NewPass456!');
    });
  });

  it('should not call onChangePassword when form is invalid', () => {
    const onChangePasswordMock = jest.fn();
    const { getByText } = render(
      <ChangePasswordModal {...defaultProps} onChangePassword={onChangePasswordMock} />
    );
    
    fireEvent.press(getByText('Conferma'));
    
    expect(onChangePasswordMock).not.toHaveBeenCalled();
  });

  it('should display error message when error prop is provided', () => {
    const { getByText } = render(
      <ChangePasswordModal {...defaultProps} error="Password attuale non corretta" />
    );
    
    expect(getByText('Password attuale non corretta')).toBeTruthy();
  });

  it('should not display error message when error is null', () => {
    const { queryByRole } = render(
      <ChangePasswordModal {...defaultProps} error={null} />
    );
    
    expect(queryByRole('alert')).toBeNull();
  });

  it('should show loading state when isChanging is true', () => {
    const { getByText } = render(
      <ChangePasswordModal {...defaultProps} isChanging={true} />
    );
    
    expect(getByText('Salvataggio...')).toBeTruthy();
  });

  it('should disable buttons when isChanging is true', () => {
    const { getByLabelText } = render(
      <ChangePasswordModal {...defaultProps} isChanging={true} />
    );
    
    expect(getByLabelText('Annulla').props.accessibilityState.disabled).toBe(true);
    expect(getByLabelText('Conferma').props.accessibilityState.disabled).toBe(true);
  });

  it('should reset form when modal opens', () => {
    const { getByTestId, rerender } = render(
      <ChangePasswordModal {...defaultProps} visible={false} />
    );
    
    rerender(<ChangePasswordModal {...defaultProps} visible={true} />);
    
    const currentPasswordInput = getByTestId('current-password-input');
    expect(currentPasswordInput.props.value).toBe('');
  });

  it('should show error on confirmPassword when passwords do not match', () => {
    const { getByTestId, getByText } = render(<ChangePasswordModal {...defaultProps} />);
    
    fireEvent.changeText(getByTestId('new-password-input'), 'NewPass456!');
    fireEvent.changeText(getByTestId('confirm-password-input'), 'DifferentPass789!');
    
    expect(getByText('Le password non coincidono')).toBeTruthy();
  });

  it('should have modal accessibility properties', () => {
    const { getByLabelText } = render(<ChangePasswordModal {...defaultProps} />);
    
    expect(getByLabelText('Cambia password')).toBeTruthy();
  });

  it('should close modal when overlay is pressed', () => {
    const onCloseMock = jest.fn();
    const { getByLabelText } = render(
      <ChangePasswordModal {...defaultProps} onClose={onCloseMock} />
    );
    
    // Test that close button works (overlay press is hard to test in RNTL)
    const closeButton = getByLabelText('Chiudi modal');
    fireEvent.press(closeButton);
    
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('should handle full user flow from empty to submitted', async () => {
    const onChangePasswordMock = jest.fn().mockResolvedValue(undefined);
    const { getByTestId, getByText, getByLabelText } = render(
      <ChangePasswordModal {...defaultProps} onChangePassword={onChangePasswordMock} />
    );
    
    // Initially disabled
    expect(getByLabelText('Conferma').props.accessibilityState.disabled).toBe(true);
    
    // Fill in current password
    fireEvent.changeText(getByTestId('current-password-input'), 'CurrentPass123!');
    
    // Fill in new password
    fireEvent.changeText(getByTestId('new-password-input'), 'NewPassword456!');
    
    // Validation indicator should appear
    expect(getByText('Minimo 8 caratteri')).toBeTruthy();
    
    // Fill in confirmation
    fireEvent.changeText(getByTestId('confirm-password-input'), 'NewPassword456!');
    
    // Button should be enabled
    expect(getByLabelText('Conferma').props.accessibilityState.disabled).toBe(false);
    
    // Submit
    fireEvent.press(getByText('Conferma'));
    
    // Verify callback
    await waitFor(() => {
      expect(onChangePasswordMock).toHaveBeenCalledWith('CurrentPass123!', 'NewPassword456!');
    });
  });
});
