import React from 'react';
import { Alert } from 'react-native';
import { AuthUIFeedback } from '@/types/auth';

/**
 * UI feedback component for Google Auth retry operations
 * @module components/GoogleAuthFeedback
 */

/**
 * Implementation of AuthUIFeedback using React Native Alert
 */
export class GoogleAuthFeedback implements AuthUIFeedback {
  /**
   * Shows retry feedback to the user
   */
  showRetryFeedback(attemptNumber: number, maxAttempts: number, message: string): void {
    if (attemptNumber > 1) {
      Alert.alert(
        'Recupero Profilo',
        message,
        [{ text: 'OK' }],
        { cancelable: true }
      );
    }
  }

  /**
   * Shows error when max attempts reached
   */
  showMaxAttemptsError(): void {
    Alert.alert(
      'Problema di Autenticazione',
      'Non è stato possibile recuperare completamente le informazioni del tuo profilo Google dopo diversi tentativi. Questo potrebbe essere dovuto a un problema temporaneo con i servizi di autenticazione.\n\nPuoi:\n• Riprovare ad accedere più tardi\n• Usare l\'accesso con email e password\n• Completare manualmente il profilo se necessario',
      [
        { text: 'Riprova più tardi', style: 'default' },
        { text: 'OK', style: 'cancel' }
      ]
    );
  }

  /**
   * Shows a generic error message
   */
  showError(message: string): void {
    Alert.alert('Errore', message, [{ text: 'OK' }], { cancelable: true });
  }
}

/**
 * React component wrapper for GoogleAuthFeedback
 */
export const useGoogleAuthFeedback = (): AuthUIFeedback => {
  return React.useMemo(() => new GoogleAuthFeedback(), []);
};
