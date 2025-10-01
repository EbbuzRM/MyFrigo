import { LoggingService } from '@/services/LoggingService';
import { AuthTests, AuthTestResult } from './AuthTests';
import { DatabaseTests, DatabaseTestResult } from './DatabaseTests';
import { PerformanceTests, PerformanceTestResult } from './PerformanceTests';
import { SystemTests, SystemTestResult } from './SystemTests';
import { DiagnosticTest, TestResult } from '@/hooks/useDiagnosticTests';

export interface TestRunnerCallbacks {
  onTestStart?: (testId: string) => void;
  onTestComplete?: (result: TestResult) => void;
  onAllTestsComplete?: (results: TestResult[]) => void;
  onError?: (error: Error) => void;
}

export class TestRunner {
  private callbacks?: TestRunnerCallbacks;

  setCallbacks(callbacks: TestRunnerCallbacks) {
    this.callbacks = callbacks;
  }

  async runTest(test: DiagnosticTest): Promise<TestResult> {
    this.callbacks?.onTestStart?.(test.id);

    try {
      let result: AuthTestResult | DatabaseTestResult | PerformanceTestResult | SystemTestResult;

      switch (test.category) {
        case 'auth':
          if (test.id === 'auth-logging') {
            result = await AuthTests.runAuthLoggingTest();
          } else if (test.id === 'form-logging') {
            result = await AuthTests.runFormStateLoggingTest();
          } else {
            throw new Error(`Test auth non riconosciuto: ${test.id}`);
          }
          break;

        case 'database':
          if (test.id === 'database-connectivity') {
            result = await DatabaseTests.runDatabaseConnectivityTest();
          } else if (test.id === 'data-integrity') {
            result = await DatabaseTests.runDataIntegrityTest();
          } else {
            throw new Error(`Test database non riconosciuto: ${test.id}`);
          }
          break;

        case 'performance':
          if (test.id === 'api-performance') {
            result = await PerformanceTests.runApiPerformanceTest();
          } else {
            throw new Error(`Test performance non riconosciuto: ${test.id}`);
          }
          break;

        case 'system':
          if (test.id === 'system-health') {
            result = await SystemTests.runSystemHealthTest(null, null); // TODO: Passare user e settings
          } else {
            throw new Error(`Test system non riconosciuto: ${test.id}`);
          }
          break;

        default:
          throw new Error(`Categoria test non riconosciuta: ${test.category}`);
      }

      const testResult: TestResult = {
        testId: result.testId,
        success: result.success,
        duration: result.duration,
        error: result.error,
        data: result.data,
        category: test.category
      };

      this.callbacks?.onTestComplete?.(testResult);
      return testResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      LoggingService.error('TestRunner', `Errore nell'esecuzione del test ${test.id}`, error);

      const testResult: TestResult = {
        testId: test.id,
        success: false,
        duration: 0,
        error: errorMessage,
        category: test.category
      };

      this.callbacks?.onTestComplete?.(testResult);
      this.callbacks?.onError?.(error instanceof Error ? error : new Error(errorMessage));

      return testResult;
    }
  }

  async runTestsSequentially(tests: DiagnosticTest[], delayMs: number = 2000): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      const result = await this.runTest(test);
      results.push(result);

      // Aggiungi delay tra i test (eccetto l'ultimo)
      if (i < tests.length - 1 && delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    this.callbacks?.onAllTestsComplete?.(results);
    return results;
  }

  async runTestsByCategory(
    tests: DiagnosticTest[],
    category: DiagnosticTest['category'],
  ): Promise<TestResult[]> {
    const categoryTests = tests.filter(test => test.category === category);
    return this.runTestsSequentially(categoryTests);
  }

  async runAllTests(tests: DiagnosticTest[]): Promise<TestResult[]> {
    LoggingService.info('TestRunner', `Iniziando esecuzione di ${tests.length} test diagnostici`);

    // Esegui prima i test di autenticazione
    const authTests = await this.runTestsByCategory(tests, 'auth');

    // Poi i test di database
    const databaseTests = await this.runTestsByCategory(tests, 'database');

    // Poi i test di performance
    const performanceTests = await this.runTestsByCategory(tests, 'performance');

    // Infine i test di sistema
    const systemTests = await this.runTestsByCategory(tests, 'system');

    const allResults = [
      ...authTests,
      ...databaseTests,
      ...performanceTests,
      ...systemTests,
    ];

    LoggingService.info('TestRunner', `Completata esecuzione di ${allResults.length} test diagnostici`);
    this.callbacks?.onAllTestsComplete?.(allResults);

    return allResults;
  }
}

// Singleton instance
export const testRunner = new TestRunner();