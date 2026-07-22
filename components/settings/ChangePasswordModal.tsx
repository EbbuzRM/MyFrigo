// ChangePasswordModal.tsx — ChangePasswordModal module.
//
// exports: ChangePasswordModalProps | ChangePasswordModal
// used_by: app\(tabs)\settings.tsx
// rules:   - All state management (visibility, loading, errors) must remain in the parent component; this component must be purely presentational and stateless
//          - Password validation must use the `usePasswordValidation` hook for consistency with the rest of the app
//          - Input state (currentPassword, newPassword, confirmPassword) is local to this component and reset when the modal opens
// agent:   unknown

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { scaleFont } from '@/utils/scaleFont';
import { usePasswordForm } from '@/hooks/usePasswordForm';
import { usePasswordVisibility } from '@/hooks/usePasswordVisibility';
import {
  validatePassword,
  validatePasswordMatch,
  validateCurrentPassword,
} from '@/utils/validation/passwordValidationRules';
import { PasswordInput } from '@/components/common/PasswordInput/PasswordInput';
import { ModalHeader } from '@/components/common/ModalHeader/ModalHeader';
import { ModalActions } from '@/components/common/ModalActions/ModalActions';
import { ErrorDisplay } from '@/components/common/ErrorDisplay/ErrorDisplay';
import { PasswordMatchIndicator } from '@/components/settings/PasswordMatchIndicator/PasswordMatchIndicator';

/**
 * @file components/settings/ChangePasswordModal.tsx
 * @description Modal component for changing the user's password.
 * Provides current password verification, new password validation,
 * and confirmation matching.
 *
 * @example
 * ```tsx
 * <ChangePasswordModal
 *   visible={isModalVisible}
 *   isChanging={isChanging}
 *   error={passwordError}
 *   onClose={() => setModalVisible(false)}
 *   onChangePassword={handleChangePassword}
 * />
 * ```
 */

/**
 * Props for ChangePasswordModal component
 */
export interface ChangePasswordModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Whether the password change operation is in progress */
  isChanging: boolean;
  /** Error message from the parent, if any */
  error: string | null;
  /** Callback when the modal is closed */
  onClose: () => void;
  /** Callback when the user confirms the password change */
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

/**
 * ChangePasswordModal component
 *
 * A modal dialog for changing the user's password. Includes
 * current password verification, new password validation with
 * real-time criteria feedback, and confirmation matching.
 *
 * @param props - Component props
 * @returns ChangePasswordModal component
 */
export function ChangePasswordModal({
  visible,
  isChanging,
  error,
  onClose,
  onChangePassword,
}: ChangePasswordModalProps): React.ReactElement {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  // Form state management
  const { values, handleChange, resetForm } = usePasswordForm();

  // Password visibility management
  const currentPasswordVisibility = usePasswordVisibility();
  const newPasswordVisibility = usePasswordVisibility();
  const confirmPasswordVisibility = usePasswordVisibility();

  // Validation state
  const [validation, setValidation] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    passwordsMatch: false,
  });

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      resetForm();
    }
  }, [visible]);

  // Update validation when newPassword or confirmPassword changes
  useEffect(() => {
    const { validation: passwordValidation } = validatePassword(values.newPassword);
    const passwordsMatch = validatePasswordMatch(
      values.newPassword,
      values.confirmPassword
    );

    setValidation({
      ...passwordValidation,
      passwordsMatch,
    });
  }, [values.newPassword, values.confirmPassword]);

  // Validation checks
  const isCurrentPasswordValid = validateCurrentPassword(values.currentPassword);
  const isNewPasswordValid = Object.values(validation)
    .slice(0, 5)
    .every((v) => v);
  const canSubmit =
    isCurrentPasswordValid && isNewPasswordValid && validation.passwordsMatch && !isChanging;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onChangePassword(values.currentPassword, values.newPassword);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={handleClose}
      accessibilityViewIsModal={true}
      accessibilityLabel="Cambia password"
    >
      <Pressable style={styles.modalOverlay} onPress={handleClose}>
        <Pressable onPress={() => {}} style={styles.modalContainer}>
          <ModalHeader
            title="Cambia Password"
            onClose={handleClose}
            isDarkMode={isDarkMode}
          />

          <PasswordInput
            label="Password attuale"
            value={values.currentPassword}
            onChangeText={(text) => handleChange('currentPassword', text)}
            showPassword={currentPasswordVisibility.showPassword}
            onToggleVisibility={currentPasswordVisibility.togglePasswordVisibility}
            isDarkMode={isDarkMode}
            placeholder="Inserisci la password attuale"
            testID="current-password-input"
          />

          <PasswordInput
            label="Nuova password"
            value={values.newPassword}
            onChangeText={(text) => handleChange('newPassword', text)}
            showPassword={newPasswordVisibility.showPassword}
            onToggleVisibility={newPasswordVisibility.togglePasswordVisibility}
            isDarkMode={isDarkMode}
            placeholder="Inserisci la nuova password"
            testID="new-password-input"
          />

          {values.newPassword.length > 0 && (
            <PasswordMatchIndicator
              newPassword={values.newPassword}
              confirmPassword={values.confirmPassword}
              isDarkMode={isDarkMode}
            />
          )}

          <PasswordInput
            label="Conferma nuova password"
            value={values.confirmPassword}
            onChangeText={(text) => handleChange('confirmPassword', text)}
            showPassword={confirmPasswordVisibility.showPassword}
            onToggleVisibility={confirmPasswordVisibility.togglePasswordVisibility}
            isDarkMode={isDarkMode}
            placeholder="Ripeti la nuova password"
            error={
              values.confirmPassword.length > 0 && !validation.passwordsMatch
                ? 'Le password non coincidono'
                : undefined
            }
            testID="confirm-password-input"
          />

          <ErrorDisplay error={error} isDarkMode={isDarkMode} />

          <ModalActions
            onCancel={handleClose}
            onConfirm={handleSubmit}
            isSubmitting={isChanging}
            confirmDisabled={!canSubmit}
            isDarkMode={isDarkMode}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/**
 * Styles for the ChangePasswordModal component
 */
const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: isDarkMode ? '#161b22' : '#ffffff',
      padding: 24,
      borderRadius: 16,
      width: '85%',
      borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
      borderWidth: 1,
    },
  });
