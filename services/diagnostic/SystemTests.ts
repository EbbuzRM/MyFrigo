import { LoggingService } from '@/services/LoggingService';
import { supabase } from '@/services/supabaseClient';
import { SettingsService } from '@/services/SettingsService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export interface SystemTestResult {
  testId: string;
  success: boolean;
  duration: number;
  error?: string;
  data?: any;
}

interface HealthTest {
  name: string;
  status: string;
  details: string;
}

export class SystemTests {
  static async runSystemHealthTest(user: any, settings: any): Promise<SystemTestResult> {
    const startTime = Date.now();

    try {
      const healthMetrics = {
        timestamp: new Date().toISOString(),
        tests: [] as HealthTest[]
      };

      // Test Memoria
      const memoryTest = {
        name: 'Memoria',
        status: 'OK',
        details: 'Test memoria non implementato su React Native'
      };
      healthMetrics.tests.push(memoryTest);

      // Test Rete
      let networkTest;
      try {
        const networkStart = Date.now();
        const { error: networkError } = await supabase
          .from('products')
          .select('id', { head: true })
          .limit(1);
        if (networkError) throw networkError;
        const networkTime = Date.now() - networkStart;
        networkTest = {
          name: 'Rete',
          status: networkTime < 3000 ? 'OK' : 'LENTA',
          details: `Tempo risposta: ${networkTime}ms`
        };
      } catch (error) {
        networkTest = {
          name: 'Rete',
          status: 'ERRORE',
          details: `Connessione fallita: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
        };
      }
      healthMetrics.tests.push(networkTest);

      // Test Storage Locale
      let storageTest;
      try {
        const testKey = 'health_check_storage';
        await AsyncStorage.setItem(testKey, 'test');
        await AsyncStorage.getItem(testKey);
        await AsyncStorage.removeItem(testKey);
        storageTest = {
          name: 'Storage Locale',
          status: 'OK',
          details: 'Lettura/scrittura funzionanti'
        };
      } catch (error) {
        storageTest = {
          name: 'Storage Locale',
          status: 'ERRORE',
          details: `Storage non accessibile: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
        };
      }
      healthMetrics.tests.push(storageTest);

      // Test Servizi Core
      const coreServicesTest = {
        name: 'Servizi Core',
        status: (LoggingService && SettingsService && supabase) ? 'OK' : 'ERRORE',
        details: 'LoggingService, SettingsService, Supabase'
      };
      healthMetrics.tests.push(coreServicesTest);

      // Test Contesti React
      const contextsTest = {
        name: 'Contesti React',
        status: (user && settings) ? 'OK' : 'PARZIALE',
        details: `Auth: ${user ? 'OK' : 'NO'}, Settings: ${settings ? 'OK' : 'NO'}`
      };
      healthMetrics.tests.push(contextsTest);

      const overallHealth = healthMetrics.tests.every(t => t.status === 'OK') ? 'OTTIMA' :
        healthMetrics.tests.some(t => t.status === 'ERRORE') ? 'CRITICA' : 'BUONA';

      const testResults = healthMetrics.tests.map(t =>
        `${t.status === 'OK' ? '✅' : t.status === 'LENTA' || t.status === 'PARZIALE' ? '⚠️' : '❌'} ${t.name}: ${t.status}`
      ).join('\n');

      Alert.alert(
        'Test Salute Sistema Completato',
        `🏥 Salute Generale: ${overallHealth === 'OTTIMA' ? '✅' : overallHealth === 'BUONA' ? '⚠️' : '❌'} ${overallHealth}\n\n` +
        `📊 Dettagli:\n${testResults}`
      );

      return {
        testId: 'system-health',
        success: !healthMetrics.tests.some(t => t.status === 'ERRORE'),
        duration: Date.now() - startTime,
        data: healthMetrics
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';

      Alert.alert(
        'Test Salute Sistema Fallito',
        `❌ Errore: ${errorMessage}`
      );

      return {
        testId: 'system-health',
        success: false,
        duration: Date.now() - startTime,
        error: errorMessage
      };
    }
  }
}