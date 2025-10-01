import { LoggingService } from '@/services/LoggingService';
import { ProductStorage } from '@/services/ProductStorage';
import { SettingsService } from '@/services/SettingsService';
import { CategoryService } from '@/services/CategoryService';
import { Alert } from 'react-native';

export interface PerformanceTestResult {
  testId: string;
  success: boolean;
  duration: number;
  error?: string;
  data?: any;
}

export class PerformanceTests {
  static async runApiPerformanceTest(): Promise<PerformanceTestResult> {
    const startTime = Date.now();
    const tests = [
      { name: 'Recupero Prodotti', operation: () => ProductStorage.getProducts() },
      { name: 'Recupero Impostazioni', operation: () => SettingsService.getSettings() },
      { name: 'Recupero Categorie', operation: () => CategoryService.getCustomCategories() },
      { name: 'Recupero Cronologia', operation: () => ProductStorage.getHistory() }
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
      'Test Performance API Completato',
      `📊 Risultati (${successCount}/${testResults.length} successi):\n\n` +
      `${resultText}\n\n⏱️ Tempo medio: ${Math.round(avgTime)}ms`
    );

    return {
      testId: 'api-performance',
      success: successCount === testResults.length,
      duration: Date.now() - startTime,
      data: { tests: testResults, avgTime, successCount }    };
  }
}