import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { scaleFont } from '@/utils/scaleFont';
import {
  MIN_NOTIFICATION_DAYS,
  MAX_NOTIFICATION_DAYS,
} from '@/constants/settings';

/**
 * @file components/settings/NotificationDaysModal.tsx
 * @description Modal component for editing notification days setting.
 * Provides input validation and save/cancel actions.
 *
 * @example
 * ```tsx
 * <NotificationDaysModal
 *   visible={isModalVisible}
 *   daysInput={daysInput}
 *   onChangeDays={setDaysInput}
 *   onSave={handleSave}
 *   onCancel={() => setVisible(false)}
 *   isSaving={isSaving}
 * />
 * ```
 */

/**
 * Props for NotificationDaysModal component
 */
export interface NotificationDaysModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Current input value */
  daysInput: string;
  /** Callback when input changes */
  onChangeDays: (value: string) => void;
  /** Callback when save is pressed */
  onSave: () => void;
  /** Callback when cancel is pressed or modal dismissed */
  onCancel: () => void;
  /** Whether save operation is in progress */
  isSaving: boolean;
}

/**
 * NotificationDaysModal component
 *
 * A modal dialog for editing the number of days before expiration
 * to receive notifications. Includes input validation and loading states.
 *
 * @param props - Component props
 * @returns NotificationDaysModal component
 */
export function NotificationDaysModal({
  visible,
  daysInput,
  onChangeDays,
  onSave,
  onCancel,
  isSaving,
}: NotificationDaysModalProps): React.ReactElement {
  const { isDarkMode } = useTheme();
  const styles = getStyles(isDarkMode);

  const isValid = (value: string): boolean => {
    const num = parseInt(value, 10);
    return !isNaN(num) && num >= MIN_NOTIFICATION_DAYS && num <= MAX_NOTIFICATION_DAYS;
  };

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
      accessibilityViewIsModal={true}
      accessibilityLabel="Modifica giorni di preavviso"
    >
      <View style={styles.modalOverlay} accessibilityRole="button" onTouchEnd={onCancel}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle} accessibilityRole="header">
            Giorni di Preavviso
          </Text>

          <TextInput
            style={styles.modalInput}
            placeholder={`Numero di giorni (${MIN_NOTIFICATION_DAYS}-${MAX_NOTIFICATION_DAYS})`}
            placeholderTextColor={isDarkMode ? '#8b949e' : '#94a3b8'}
            value={daysInput}
            onChangeText={onChangeDays}
            keyboardType="number-pad"
            autoFocus
            maxLength={2}
            editable={!isSaving}
            accessibilityLabel="Inserisci numero di giorni"
            accessibilityHint={`Inserisci un numero tra ${MIN_NOTIFICATION_DAYS} e ${MAX_NOTIFICATION_DAYS}`}
            testID="notification-days-input"
          />

          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={onCancel}
              disabled={isSaving}
              accessibilityLabel="Annulla modifica"
              accessibilityRole="button"
            >
              <Text style={styles.modalButtonTextCancel}>Annulla</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.modalButtonConfirm,
                (isSaving || !isValid(daysInput)) && styles.modalButtonDisabled,
              ]}
              onPress={onSave}
              disabled={isSaving || !isValid(daysInput)}
              accessibilityLabel="Salva giorni di preavviso"
              accessibilityRole="button"
              accessibilityState={{ disabled: isSaving || !isValid(daysInput) }}
            >
              {isSaving ? (
                <View style={styles.saveButtonContent}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={[styles.modalButtonTextConfirm, styles.saveButtonText]}>
                    Salvataggio...
                  </Text>
                </View>
              ) : (
                <Text style={styles.modalButtonTextConfirm}>Salva</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Styles for the NotificationDaysModal component
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
      alignItems: 'stretch',
      borderColor: isDarkMode ? '#30363d' : '#e2e8f0',
      borderWidth: 1,
    },
    modalTitle: {
      fontSize: scaleFont(18),
      fontFamily: 'Inter-Bold',
      marginBottom: 20,
      textAlign: 'center',
      color: isDarkMode ? '#c9d1d9' : '#1e293b',
    },
    modalInput: {
      borderWidth: 1,
      borderColor: isDarkMode ? '#30363d' : '#cbd5e1',
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: scaleFont(16),
      fontFamily: 'Inter-Regular',
      marginBottom: 24,
      color: isDarkMode ? '#c9d1d9' : '#1e293b',
      backgroundColor: isDarkMode ? '#0d1117' : '#ffffff',
      textAlign: 'center',
    },
    modalButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
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
