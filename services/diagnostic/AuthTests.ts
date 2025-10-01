import { LoggingService } from '@/services/LoggingService';
import { authLogger } from '@/utils/AuthLogger';
import { formStateLogger } from '@/utils/FormStateLogger';
import { Alert } from 'react-native';

export interface AuthTestResult {
  testId: string;
  success: boolean;
  duration: number;
  error?: string;
  data?: any;
}

export class AuthTests {
  static async runAuthLoggingTest(): Promise<AuthTestResult> {
    const startTime = Date.now();

    try {
      authLogger.completeAuth(false);
      authLogger.startAuth();
      LoggingService.info('AuthTests', 'Processo di autenticazione iniziato');

      authLogger.startStep('TEST_AUTH_STEP_SUCCESS');
      authLogger.endStep('TEST_AUTH_STEP_SUCCESS');
      authLogger.completeAuth(true);

      const summary = authLogger.getAuthSummary();
      LoggingService.info('AuthTests', 'Riepilogo del test di autenticazione:', summary);

      Alert.alert(
        'Test Autenticazione Completato',
        'Il sistema di logging dell\'autenticazione funziona correttamente.'
      );

      return {
        testId: 'auth-logging',
        success: true,
        duration: Date.now() - startTime,
        data: summary
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';

      Alert.alert('Errore nel Test', 'Si è verificato un errore durante il test.');

      return {
        testId: 'auth-logging',
        success: false,
        duration: Date.now() - startTime,
        error: errorMessage
      };
    }
  }

  static async runFormStateLoggingTest(): Promise<AuthTestResult> {
    const startTime = Date.now();

    try {
      formStateLogger.logNavigation('TEST_NAVIGATION', 'screen-a', 'screen-b', { param1: 'value1' });

      const formState1 = {
        name: 'Prodotto di test',
        brand: 'Marca di test',
        quantity: '1',
        unit: 'pz',
        notes: 'Note di test'
      };

      formStateLogger.saveFormState('test-form-1', formState1);

      const formState2 = { ...formState1, quantity: '2', notes: 'Note modificate' };
      formStateLogger.saveFormState('test-form-1', formState2);

      const retrievedState = formStateLogger.getFormState('test-form-1');
      const comparison = formStateLogger.compareStates(formState1, retrievedState);
      const summary = formStateLogger.getStateSummary();

      LoggingService.info('AuthTests', 'Confronto stati:', comparison);
      LoggingService.info('AuthTests', 'Riepilogo del test di inserimento prodotti:', summary);

      Alert.alert(
        'Test Inserimento Prodotti Completato',
        'Il sistema di logging funziona correttamente.'
      );

      return {
        testId: 'form-logging',
        success: true,
        duration: Date.now() - startTime,
        data: { comparison, summary }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';

      return {
        testId: 'form-logging',
        success: false,
        duration: Date.now() - startTime,
        error: errorMessage
      };
    }
  }
}