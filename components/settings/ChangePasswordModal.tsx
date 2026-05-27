// ChangePasswordModal.tsx — ChangePasswordModal module.
//
// exports: ChangePasswordModalProps
// used_by: app\(tabs)\settings.tsx
// rules:   - All state management (visibility, loading, errors) must remain in the parent component; this component must be purely presentational and stateless
//          - Password validation must use the `usePasswordValidation` hook for consistency with the rest of the app
//          - Input state (currentPassword, newPassword, confirmPassword) is local to this component and reset when the modal opens

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { scaleFont } from '@/utils/scaleFont';
import { usePasswordValidation } from '@/hooks/usePasswordValidation';
import { PasswordValidationDisplay } from '@/components/PasswordValidationDisplay';

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

  // Local input state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password validation hook
  const {
    password: validatedPassword,
    validation,
    handlePasswordChange,
    isPasswordValid,
    setPassword: setValidatedPassword,
  } = usePasswordValidation();

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setValidatedPassword('');
    }
  }, [visible, setValidatedPassword]);

  // Sync newPassword with validation hook
  const handleNewPasswordChange = (text: string) => {
    setNewPassword(text);
    handlePasswordChange(text);
  };

  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const canSubmit = currentPassword.length > 0 && isPasswordValid && passwordsMatch && !isChanging;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onChangePassword(currentPassword, newPassword);
  };

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
      accessibilityLabel="Cambia password"
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={onClose}
      >
        <Pressable onPress={() => {}} style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.modalTitle} accessibilityRole="header">
              Cambia Password
            </Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityLabel="Chiudi modal cambio password"
              accessibilityHint="Tocca per chiudere senza salvare"
              accessibilityRole="button"
              style={styles.closeButton}
            >
              <FontAwesome name="times" size={20} color={isDarkMode ? '#8b949e' : '#64748B'} />
            </TouchableOpacity>
          </View>

          {/* Current Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Password attuale</Text>
            <View style={styles.inputWrapper}>
              <FontAwesome name="lock" size={16} color={isDarkMode ? '#8b949e' : '#64748B'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Inserisci la password attuale"
                placeholderTextColor={isDarkMode ? '#8b949e' : '#94a3b8'}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
                editable={!isChanging}
                 autoCorrect={false}
                 testID="current-password-input"
               />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeButton}
                accessibilityLabel={showCurrentPassword ? 'Nascondi password attuale' : 'Mostra password attuale'}
                accessibilityRole="button"
              >
                <FontAwesome
                  name={showCurrentPassword ? 'eye' : 'eye-slash'}
                  size={18}
                  color={isDarkMode ? '#8b949e' : '#64748B'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nuova password</Text>
            <View style={styles.inputWrapper}>
              <FontAwesome name="lock" size={16} color={isDarkMode ? '#8b949e' : '#64748B'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Inserisci la nuova password"
                placeholderTextColor={isDarkMode ? '#8b949e' : '#94a3b8'}
                value={newPassword}
                onChangeText={handleNewPasswordChange}
                secureTextEntry={!showNewPassword}
                editable={!isChanging}
                 autoCorrect={false}
                 testID="new-password-input"
               />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeButton}
                accessibilityLabel={showNewPassword ? 'Nascondi nuova password' : 'Mostra nuova password'}
                accessibilityRole="button"
              >
                <FontAwesome
                  name={showNewPassword ? 'eye' : 'eye-slash'}
                  size={18}
                  color={isDarkMode ? '#8b949e' : '#64748B'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Password Validation Display */}
          <PasswordValidationDisplay
            validation={validation}
            visible={newPassword.length > 0}
          />

          {/* Confirm New Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Conferma nuova password</Text>
            <View style={styles.inputWrapper}>
              <FontAwesome name="lock" size={16} color={isDarkMode ? '#8b949e' : '#64748B'} style={styles.inputIcon} />
              <TextInput
                style={[
                  styles.input,
                  confirmPassword.length > 0 && !passwordsMatch && styles.inputError,
                ]}
                placeholder="Ripeti la nuova password"
                placeholderTextColor={isDarkMode ? '#8b949e' : '#94a3b8'}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!isChanging}
                 autoCorrect={false}
                 testID="confirm-password-input"
               />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
                accessibilityLabel={showConfirmPassword ? 'Nascondi conferma password' : 'Mostra conferma password'}
                accessibilityRole="button"
              >
                <FontAwesome
                  name={showConfirmPassword ? 'eye' : 'eye-slash'}
                  size={18}
                  color={isDarkMode ? '#8b949e' : '#64748B'}
                />
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <Text style={styles.matchErrorText}>Le password non coincidono</Text>
            )}
          </View>

          {/* Error message from parent */}
          {error && (
            <Text style={styles.errorText} accessibilityRole="alert">
              {error}
            </Text>
          )}

          {/* Buttons */}
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={onClose}
              disabled={isChanging}
              accessibilityLabel="Annulla cambio password"
              accessibilityHint="Tocca per chiudere senza cambiare la password"
              accessibilityRole="button"
              accessibilityState={{ disabled: isChanging }}
            >
              <Text style={styles.modalButtonTextCancel}>Annulla</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.modalButtonConfirm,
                !canSubmit && styles.modalButtonDisabled,
              ]}
               onPress={handleSubmit}
               disabled={!canSubmit}
               testID="confirm-reset-button"
               accessibilityLabel="Cambia password"
              accessibilityHint="Tocca per confermare il cambio password"
              accessibilityRole="button"
              accessibilityState={{ disabled: !canSubmit }}
            >
              {isChanging ? (
                <View style={styles.saveButtonContent}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={[styles.modalButtonTextConfirm, styles.saveButtonText]}>
                    Salvataggio...
                  </Text>
                </View>
              ) : (
                <Text style={styles.modalButtonTextConfirm}>Cambia Password</Text>
              )}
            </TouchableOpacity>
          </View>
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
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: scaleFont(18),
      fontFamily: 'Inter-Bold',
      color: isDarkMode ? '#c9d1d9' : '#1e293b',
    },
    closeButton: {
      padding: 4,
    },
    inputContainer: {
      marginBottom: 12,
    },
    inputLabel: {
      fontSize: scaleFont(14),
      fontFamily: 'Inter-SemiBold',
      color: isDarkMode ? '#c9d1d9' : '#374151',
      marginBottom: 6,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
      borderRadius: 8,
      paddingHorizontal: 12,
      backgroundColor: isDarkMode ? '#0d1117' : '#ffffff',
    },
    inputIcon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      paddingVertical: 12,
      fontSize: scaleFont(16),
      fontFamily: 'Inter-Regular',
      color: isDarkMode ? '#c9d1d9' : '#1e293b',
    },
    inputError: {
      borderColor: '#dc2626',
    },
    eyeButton: {
      padding: 4,
    },
    matchErrorText: {
      fontSize: scaleFont(12),
      fontFamily: 'Inter-Regular',
      color: '#dc2626',
      marginTop: 4,
    },
    errorText: {
      fontSize: scaleFont(14),
      fontFamily: 'Inter-Regular',
      color: '#dc2626',
      marginTop: 8,
      marginBottom: 8,
      textAlign: 'center',
    },
    modalButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    modalButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      flex: 1,
      alignItems: 'center',
    },
    modalButtonCancel: {
      backgroundColor: isDarkMode ? '#30363d' : '#e5e7eb',
      marginRight: 8,
    },
    modalButtonConfirm: {
      backgroundColor: '#4f46e5',
      marginLeft: 8,
    },
    modalButtonDisabled: {
      backgroundColor: '#a5b4fc',
      opacity: 0.8,
    },
    modalButtonTextCancel: {
      color: isDarkMode ? '#c9d1d9' : '#374151',
      fontFamily: 'Inter-SemiBold',
      fontSize: scaleFont(16),
    },
    modalButtonTextConfirm: {
      color: 'white',
      fontFamily: 'Inter-SemiBold',
      fontSize: scaleFont(16),
    },
    saveButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    saveButtonText: {
      marginLeft: 8,
    },
  });
