// DatabaseTests.ts — DatabaseTests module.
//
// exports: DiagnosticData | DatabaseTestResult | DatabaseTests
// used_by: hooks\useDiagnosticTests.ts
//                   services\diagnostic\TestRunner.ts
// rules:   - This module contains static test methods that must remain stateless; no instance properties or constructor logic should be added.
//          - All test methods must return a `DatabaseTestResult` object and must not throw unhandled exceptions.
//          - Imports from external services (LoggingService, supabase, ProductStorage, SettingsService, CategoryService) must not be removed or changed without updating all dependent modules.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { supabase } from '@/services/supabaseClient';
import { ProductStorage } from '@/services/ProductStorage';
import { SettingsService } from '@/services/SettingsService';
import { CategoryService } from '@/services/CategoryService';
import { Alert } from 'react-native';
import i18next from 'i18next';

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
        i18next.t('settings.diagnosticDatabaseCompleted'),
        i18next.t('settings.diagnosticDatabaseOk')
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
        i18next.t('settings.diagnosticDatabaseFailed'),
        i18next.t('settings.diagnosticErrorWithMessage', { message: errorMessage })
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

      const issues: Array<'invalid_session' | 'corrupt_settings' | 'categories_failed' | 'incomplete_products'> = [];
      if (!hasValidSession) issues.push('invalid_session');
      if (!isValidSettings) issues.push('corrupt_settings');
      if (!hasCategories) issues.push('categories_failed');
      if (products && products.some(p => !p.id || !p.name)) issues.push('incomplete_products');
      const issueLabels = issues.map(issue => i18next.t(({
        invalid_session: 'settings.diagnosticInvalidSession',
        corrupt_settings: 'settings.diagnosticCorruptSettings',
        categories_failed: 'settings.diagnosticCategoriesFailed',
        incomplete_products: 'settings.diagnosticIncompleteProducts'
      } as const)[issue]));

      Alert.alert(
        i18next.t('settings.diagnosticIntegrityCompleted'),
        i18next.t('settings.diagnosticIntegritySummary', {
          total: products?.length || 0,
          active: activeProducts.length,
          consumed: consumedProducts.length,
          categories: categoriesCount,
          session: i18next.t(hasValidSession ? 'settings.diagnosticValid' : 'settings.diagnosticInvalid'),
          settings: i18next.t(isValidSettings ? 'settings.diagnosticValid' : 'settings.diagnosticCorrupt'),
          issues: issues.length === 0
            ? i18next.t('settings.diagnosticNoIssues')
            : i18next.t('settings.diagnosticIssues', { issues: issueLabels.join(', ') })
        })
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
        i18next.t('settings.diagnosticIntegrityFailed'),
        i18next.t('settings.diagnosticTestFailedWithMessage', { message: errorMessage })
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
