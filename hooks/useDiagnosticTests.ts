// useDiagnosticTests.ts — useDiagnosticTests module.
//
// exports: DiagnosticTest | TestResult | useDiagnosticTests
// used_by: components\DiagnosticPanel.tsx
//                   components\diagnostic\AuthTestSection.tsx
//                   components\diagnostic\DatabaseTestSection.tsx
//                   components\diagnostic\PerformanceTestSection.tsx
//                   context\DiagnosticContext.tsx
//                   services\diagnostic\TestRunner.ts
// rules:   - Module exports (DiagnosticTest, TestResult, useDiagnosticTests) must remain stable and compatible with all consumers listed in used_by
//          - All test category types defined in DiagnosticTest interface ('auth' | 'database' | 'performance' | 'system' | 'cache') must be supported by corresponding service implementations
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { LoggingService } from '@/services/LoggingService';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { AuthTests } from '@/services/diagnostic/AuthTests';
import { DatabaseTests } from '@/services/diagnostic/DatabaseTests';
import { PerformanceTests } from '@/services/diagnostic/PerformanceTests';
import { SystemTests } from '@/services/diagnostic/SystemTests';
import { NotificationTests } from '@/services/diagnostic/NotificationTests';

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
  // Shape varies per test type (auth / db / performance / …); consumers narrow by test.id.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  category?: string;
}

export const useDiagnosticTests = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
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

  // Controllo di disponibilità notifiche
  const runNotificationReadinessTest = useCallback(async () => {
    const result = await NotificationTests.runNotificationReadinessTest();
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
      name: t('settings.diagnosticAuthLogging'),
      category: 'auth',
      run: runAuthLoggingTest
    },
    {
      id: 'form-logging',
      name: t('settings.diagnosticFormLogging'),
      category: 'auth',
      run: runFormStateLoggingTest
    },
    {
      id: 'database-connectivity',
      name: t('settings.diagnosticDatabaseConnectivity'),
      category: 'database',
      run: runDatabaseConnectivityTest
    },
    {
      id: 'api-performance',
      name: t('settings.diagnosticApiPerformance'),
      category: 'performance',
      run: runApiPerformanceTest
    },
    {
      id: 'data-integrity',
      name: t('settings.diagnosticDataIntegrity'),
      category: 'database',
      run: runDataIntegrityTest
    },
    {
      id: 'system-health',
      name: t('settings.diagnosticSystemHealth'),
      category: 'system',
      run: runSystemHealthTest
    },
    {
      id: 'notification-permissions',
      name: t('settings.diagnosticNotificationPermissions'),
      category: 'system',
      run: runNotificationPermissionsTest
    },
    {
      id: 'notification-readiness',
      name: t('settings.diagnosticNotificationReadiness'),
      category: 'system',
      run: runNotificationReadinessTest
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

      await runNotificationReadinessTest();

      LoggingService.info('DiagnosticPanel', 'Sequenza completa di test diagnostici completata');

      Alert.alert(
        t('settings.diagnosticTestsCompleted'),
        t('settings.diagnosticTestsCompletedMessage')
      );
    } catch (error) {
      LoggingService.error('DiagnosticPanel', 'Errore durante l\'esecuzione dei test completi', error);
      Alert.alert(
        t('settings.diagnosticTestError'),
        t('settings.diagnosticTestErrorMessage')
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
    runNotificationReadinessTest,
    t
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
