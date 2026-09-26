// PerformanceTests.ts — PerformanceTests module.
//
// exports: DiagnosticData | PerformanceTestResult | PerformanceTests
// used_by: hooks\useDiagnosticTests.ts
//                   services\diagnostic\TestRunner.ts
// rules:   - Module exposes static class `PerformanceTests` with no constructor; all methods must remain static to maintain existing import pattern.
//          - Do not add or remove exported interfaces (`DiagnosticData`, `PerformanceTestResult`) without updating all dependent imports in `hooks/useDiagnosticTests.ts` and `services/diagnostic/TestRunner.ts`.
//          - Performance test operations are async and must preserve the existing `try/catch` pattern for each individual test to ensure partial success reporting.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { ProductStorage } from '@/services/ProductStorage';
import { SettingsService } from '@/services/SettingsService';
import { CategoryService } from '@/services/CategoryService';
import { Alert } from 'react-native';
import i18next from 'i18next';

export interface DiagnosticData {
  [key: string]: unknown;
}

export interface PerformanceTestResult {
  testId: string;
  success: boolean;
  duration: number;
  error?: string;
  data?: DiagnosticData;
}

export class PerformanceTests {
  static async runApiPerformanceTest(): Promise<PerformanceTestResult> {
    const startTime = Date.now();
    const tests = [
      { name: i18next.t('settings.diagnosticFetchProducts'), operation: () => ProductStorage.getProducts() },
      { name: i18next.t('settings.diagnosticFetchSettings'), operation: () => SettingsService.getSettings() },
      { name: i18next.t('settings.diagnosticFetchCategories'), operation: () => CategoryService.getCustomCategories() },
      { name: i18next.t('settings.diagnosticFetchHistory'), operation: () => ProductStorage.getHistory() }
    ];

    const testResults = [];

    for (const test of tests) {
      const testStart = Date.now();
      try {
        await test.operation();
        testResults.push({ name: test.name, time: Date.now() - testStart, success: true });
      } catch (error) {
        testResults.push({
          name: test.name,
          time: Date.now() - testStart,
          success: false,
          error
        });
      }
    }

    const avgTime = testResults.reduce((sum, r) => sum + r.time, 0) / testResults.length;
    const successCount = testResults.filter(r => r.success).length;

    const resultText = testResults.map(r =>
      `${r.success ? '✅' : '❌'} ${r.name}: ${r.time}ms`
    ).join('\n');

    Alert.alert(
      i18next.t('settings.diagnosticPerformanceCompleted'),
      i18next.t('settings.diagnosticPerformanceSummary', {
        passed: successCount,
        total: testResults.length,
        results: resultText,
        average: Math.round(avgTime)
      })
    );

    return {
      testId: 'api-performance',
      success: successCount === testResults.length,
      duration: Date.now() - startTime,
      data: { tests: testResults, avgTime, successCount }    };
  }
}
