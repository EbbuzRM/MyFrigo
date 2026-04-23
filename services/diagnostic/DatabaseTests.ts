import { LoggingService } from '@/services/LoggingService';
import { supabase } from '@/services/supabaseClient';
import { ProductStorage } from '@/services/ProductStorage';
import { SettingsService } from '@/services/SettingsService';
import { CategoryService } from '@/services/CategoryService';
import { Alert } from 'react-native';

export interface DiagnosticData {
  [key: string]: unknown;
}

export interface DatabaseTestResult {
  testId: string;
  success: boolean;
  duration: number;
  error?: string;
  data?: DiagnosticData;
}

export class DatabaseTests {
  static async runDatabaseConnectivityTest(): Promise<DatabaseTestResult> {
    const startTime = Date.now();

    try {
      const { error: healthError } = await supabase
        .from('products')
        .select('id', { count: 'planned', head: true });

      if (healthError) throw new Error(`Database connection failed: ${healthError.message}`);

      Alert.alert(
        'Test Connettività Database Completato',
        '✅ Connessione database OK'
      );

      return {
        testId: 'database-connectivity',
        success: true,
        duration: Date.now() - startTime,
        data: { message: 'Database connection successful' }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';

      Alert.alert(
        'Test Connettività Database Fallito',
        `❌ Errore: ${errorMessage}`
      );

      return {
        testId: 'database-connectivity',
        success: false,
        duration: Date.now() - startTime,
        error: errorMessage
      };
    }
  }

  static async runDataIntegrityTest(): Promise<DatabaseTestResult> {
    const startTime = Date.now();

    try {
      const productsResult = await ProductStorage.getProducts();
      if (!productsResult.success) throw productsResult.error;
      const products = productsResult.data;

      const activeProducts = products?.filter(p => p.status === 'active') || [];
      const consumedProducts = products?.filter(p => p.status === 'consumed') || [];

      const settings = await SettingsService.getSettings();
      const isValidSettings = settings &&
        typeof settings.notificationDays === 'number' &&
        settings.notificationDays > 0 &&
        ['light', 'dark', 'auto'].includes(settings.theme);

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const hasValidSession = !!currentSession?.user?.id;

      const categories = await CategoryService.getCustomCategories();
      const hasCategories = Array.isArray(categories);
      const categoriesCount = hasCategories ? categories.length : 0;

      const issues = [];
      if (!hasValidSession) issues.push('Sessione utente non valida');
      if (!isValidSettings) issues.push('Impostazioni corrotte');
      if (!hasCategories) issues.push('Errore nel caricamento categorie');
      if (products && products.some(p => !p.id || !p.name)) issues.push('Prodotti con dati mancanti');

      Alert.alert(
        'Test Integrità Dati Completato',
        `📊 Statistiche:\n` +
        `• Prodotti totali: ${products?.length || 0}\n` +
        `• Prodotti attivi: ${activeProducts.length}\n` +
        `• Prodotti consumati: ${consumedProducts.length}\n` +
        `• Categorie: ${categoriesCount}\n` +
        `• Sessione: ${hasValidSession ? 'Valida' : 'Non valida'}\n` +
        `• Impostazioni: ${isValidSettings ? 'OK' : 'Corrotte'}\n\n` +
        `${issues.length === 0 ? '✅ Nessun problema rilevato' : `❌ Problemi: ${issues.join(', ')}`}`
      );

      return {
        testId: 'data-integrity',
        success: issues.length === 0,
        duration: Date.now() - startTime,
        data: {
          totalProducts: products?.length || 0,
          activeProducts: activeProducts.length,
          consumedProducts: consumedProducts.length,
          hasValidSession,
          isValidSettings,
          categoriesCount,
          issues
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';

      Alert.alert(
        'Test Integrità Dati Fallito',
        `❌ Errore durante il test: ${errorMessage}`
      );

      return {
        testId: 'data-integrity',
        success: false,
        duration: Date.now() - startTime,
        error: errorMessage
      };
    }
  }
}