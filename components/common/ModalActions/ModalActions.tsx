import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { scaleFont } from '@/utils/scaleFont';

interface ModalActionsProps {
  onCancel: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
  confirmDisabled?: boolean;
  isDarkMode: boolean;
}

export function ModalActions({
  onCancel,
  onConfirm,
  isSubmitting = false,
  confirmDisabled = false,
  isDarkMode,
}: ModalActionsProps): React.ReactElement {
  const { t } = useTranslation();
  const styles = getStyles(isDarkMode);
  const isDisabled = isSubmitting || confirmDisabled;
  const cancelLabel = t('common.cancel');
  const confirmLabel = t('common.confirm');

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, styles.cancelButton]}
        onPress={() => !isSubmitting && onCancel()}
        disabled={isSubmitting}
        accessibilityLabel={cancelLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: isSubmitting }}
      >
        <Text style={styles.cancelText}>{cancelLabel}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          styles.confirmButton,
          isDisabled && styles.buttonDisabled,
        ]}
        onPress={() => !isDisabled && onConfirm()}
        disabled={isDisabled}
        accessibilityLabel={confirmLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
      >
        {isSubmitting ? (
          <View style={styles.loadingContent}>
            <ActivityIndicator size="small" color="#ffffff" />
            <Text style={styles.confirmText}>{t('common.saving')}</Text>
          </View>
        ) : (
          <Text style={styles.confirmText}>{confirmLabel}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    button: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      flex: 1,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: isDarkMode ? '#30363d' : '#e5e7eb',
      marginRight: 8,
    },
    confirmButton: {
      backgroundColor: '#4f46e5',
      marginLeft: 8,
    },
    buttonDisabled: {
      backgroundColor: '#a5b4fc',
      opacity: 0.8,
    },
    cancelText: {
      color: isDarkMode ? '#c9d1d9' : '#374151',
      fontFamily: 'Inter-SemiBold',
      fontSize: scaleFont(16),
    },
    confirmText: {
      color: 'white',
      fontFamily: 'Inter-SemiBold',
      fontSize: scaleFont(16),
    },
    loadingContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
  });
