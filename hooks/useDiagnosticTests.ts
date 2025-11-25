import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { LoggingService } from '@/services/LoggingService';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { AuthTests, AuthTestResult } from '@/services/diagnostic/AuthTests';
import { DatabaseTests, DatabaseTestResult } from '@/services/diagnostic/DatabaseTests';
import { PerformanceTests, PerformanceTestResult } from '@/services/diagnostic/PerformanceTests';
import { SystemTests, SystemTestResult } from '@/services/diagnostic/SystemTests';
import { NotificationTests, NotificationTestResult } from '@/services/diagnostic/NotificationTests';

export interface DiagnosticTest {
  id: string;
  name: string;
  category: 'auth' | 'database' | 'performance' | 'system' | 'cache';
  run: () => Promise<void> | void;
}

export interface TestResult {
  testId: string;
  success: boolean;
  duration: number;
  error?: string;
  data?: any;
  category?: string;
}

export const useDiagnosticTests = () => {
  const { user, session } = useAuth();
  const { settings } = useSettings();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const addResult = useCallback((result: TestResult) => {
    setResults(prev => [...prev, result]);
  }, []);

  // Test Autenticazione
  const runAuthLoggingTest = useCallback(async () => {
    const result = await AuthTests.runAuthLoggingTest();
    addResult({
      testId: result.testId,
      success: result.success,
      duration: result.duration,
      error: result.error,
      data: result.data,
      category: 'auth'
    });
  }, [addResult]);

  // Test Logging Form
  const runFormStateLoggingTest = useCallback(async () => {
    const result = await AuthTests.runFormStateLoggingTest();
    addResult({
      testId: result.testId,
      success: result.success,
      duration: result.duration,
      error: result.error,
      data: result.data,
      category: 'auth'
    });
  }, [addResult]);

  // Test Connettività Database
  const runDatabaseConnectivityTest = useCallback(async () => {
    const result = await DatabaseTests.runDatabaseConnectivityTest();
    addResult({
      testId: result.testId,
      success: result.success,
      duration: result.duration,
      error: result.error,
      data: result.data,
      category: 'database'
    });
  }, [addResult]);

  // Test Performance API
  const runApiPerformanceTest = useCallback(async () => {
    const result = await PerformanceTests.runApiPerformanceTest();
    addResult({
      testId: result.testId,
      success: result.success,
      duration: result.duration,
      error: result.error,
      data: result.data,
      category: 'performance'
    });
  }, [addResult]);

  // Test Integrità Dati
  const runDataIntegrityTest = useCallback(async () => {
    const result = await DatabaseTests.runDataIntegrityTest();
    addResult({
      testId: result.testId,
      success: result.success,
      duration: result.duration,
      error: result.error,
      data: result.data,
      category: 'database'
    });
  }, [addResult]);

  // Test Salute Sistema
  const runSystemHealthTest = useCallback(async () => {
    const result = await SystemTests.runSystemHealthTest(user, settings);
    addResult({
      testId: result.testId,
      success: result.success,
      duration: result.duration,
      error: result.error,
      data: result.data,
      category: 'system'
    });
  }, [addResult, user, settings]);

  // Test Permessi Notifiche
  const runNotificationPermissionsTest = useCallback(async () => {
    const result = await NotificationTests.runNotificationPermissionsTest();
    addResult({
      testId: result.testId,
      success: result.success,
      duration: result.duration,
      error: result.error,
      data: result.data,
      category: 'system'
    });
  }, [addResult]);

  // Test Scheduling Notifiche
  const runNotificationSchedulingTest = useCallback(async () => {
    const result = await NotificationTests.runNotificationSchedulingTest();
    addResult({
      testId: result.testId,
      success: result.success,
      duration: result.duration,
      error: result.error,
      data: result.data,
      category: 'system'
    });
  }, [addResult]);

  // Elenco completo dei test disponibili
  const availableTests: DiagnosticTest[] = [
    {
      id: 'auth-logging',
      name: 'Test Sistema Logging Autenticazione',
      category: 'auth',
      run: runAuthLoggingTest
    },
    {
      id: 'form-logging',
      name: 'Test Sistema Logging Inserimento Prodotti',
      category: 'auth',
      run: runFormStateLoggingTest
    },
    {
      id: 'database-connectivity',
      name: 'Test Connettività Database',
      category: 'database',
      run: runDatabaseConnectivityTest
    },
    {
      id: 'api-performance',
      name: 'Test Performance API',
      category: 'performance',
      run: runApiPerformanceTest
    },
    {
      id: 'data-integrity',
      name: 'Test Integrità Dati',
      category: 'database',
      run: runDataIntegrityTest
    },
    {
      id: 'system-health',
      name: 'Test Salute Sistema',
      category: 'system',
      run: runSystemHealthTest
    },
    {
      id: 'notification-permissions',
      name: 'Test Permessi Notifiche',
      category: 'system',
      run: runNotificationPermissionsTest
    },
    {
      id: 'notification-scheduling',
      name: 'Test Scheduling Notifiche',
      category: 'system',
      run: runNotificationSchedulingTest
    }
  ];

  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    setResults([]);

    try {
      LoggingService.info('DiagnosticPanel', 'Iniziando sequenza completa di test diagnostici');

      // Test base
      await runAuthLoggingTest();
      await new Promise(resolve => setTimeout(resolve, 3000));

      await runFormStateLoggingTest();
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Test avanzati
      await runDatabaseConnectivityTest();
      await new Promise(resolve => setTimeout(resolve, 2000));

      await runApiPerformanceTest();
      await new Promise(resolve => setTimeout(resolve, 2000));

      await runDataIntegrityTest();
      await new Promise(resolve => setTimeout(resolve, 2000));

      await runSystemHealthTest();
      await new Promise(resolve => setTimeout(resolve, 2000));

      await runNotificationPermissionsTest();
      await new Promise(resolve => setTimeout(resolve, 2000));

      await runNotificationSchedulingTest();

      LoggingService.info('DiagnosticPanel', 'Sequenza completa di test diagnostici completata');

      Alert.alert(
        'Test Completati',
        'Tutti i test diagnostici sono stati eseguiti. Controlla i log per i dettagli completi.'
      );
    } catch (error) {
      LoggingService.error('DiagnosticPanel', 'Errore durante l\'esecuzione dei test completi', error);
      Alert.alert(
        'Errore Test',
        'Si è verificato un errore durante l\'esecuzione dei test.'
      );
    } finally {
      setIsRunning(false);
    }
  }, [
    runAuthLoggingTest,
    runFormStateLoggingTest,
    runDatabaseConnectivityTest,
    runApiPerformanceTest,
    runDataIntegrityTest,
    runSystemHealthTest,
    runNotificationPermissionsTest,
    runNotificationSchedulingTest
  ]);

  return {
    availableTests,
    isRunning,
    results,
    runAllTests,
    runTest: (testId: string) => {
      const test = availableTests.find(t => t.id === testId);
      return test?.run();
    }
  };
};