import { Product, ProductCategory } from '@/types/Product';
import { AppSettings } from '@/services/SettingsService';
import { ProductTemplate } from '@/services/TemplateService';
import { LoggingService } from '@/services/LoggingService';

// Helper functions for key conversion
export const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
};

export const toSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

// Generic object key converter
export const convertObjectKeys = <T, U = Record<string, unknown>>(
  obj: U,
  keyConverter: (key: string) => string
): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertObjectKeys<unknown, unknown>(item, keyConverter)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const convertedKey = keyConverter(key);
      result[convertedKey] = convertObjectKeys<unknown, unknown>(
        (obj as Record<string, unknown>)[key] as unknown,
        keyConverter
      );
    }
  }
  
  return result as unknown as T;
};

/**
 * Converts a Product object from snake_case to camelCase
 * @param product The product object to convert
 * @returns The converted product object
 */
export function convertProductToCamelCase(product: Record<string, unknown>): Product {
  if (!product) {
    LoggingService.warning('caseConverter', 'Attempted to convert null or undefined product to camelCase');
    return {} as Product;
  }

  // Converti le chiavi da snake_case a camelCase
  const convertedProduct = convertObjectKeys<Product, Record<string, unknown>>(product, toCamelCase);

  // Gestisci la conversione del campo quantities da JSON string a array
  if (convertedProduct.quantities === null || convertedProduct.quantities === undefined) {
    // Se è null/undefined dal database, imposta array vuoto per l'applicazione
    convertedProduct.quantities = [];
  } else if (typeof convertedProduct.quantities === 'string') {
    try {
      const parsed = JSON.parse(convertedProduct.quantities);
      convertedProduct.quantities = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      LoggingService.error('caseConverter', 'Failed to parse quantities JSON', error);
      convertedProduct.quantities = [];
    }
  } else if (!Array.isArray(convertedProduct.quantities)) {
    // Se non è un array, imposta array vuoto
    convertedProduct.quantities = [];
  }

  return convertedProduct;
}

/**
 * Converts a Product object from camelCase to snake_case
 * @param product The product object to convert
 * @returns The converted product object
 */
export function convertProductToSnakeCase(product: Partial<Product>): Record<string, unknown> {
  if (!product) {
    LoggingService.warning('caseConverter', 'Attempted to convert null or undefined product to snake_case');
    return {};
  }
  return convertObjectKeys<Record<string, unknown>, Partial<Product>>(product, toSnakeCase);
}

/**
 * Converts a ProductCategory object from snake_case to camelCase
 * @param category The category object to convert
 * @returns The converted category object
 */
export function convertCategoryToCamelCase(category: Record<string, unknown>): ProductCategory {
  if (!category) {
    LoggingService.warning('caseConverter', 'Attempted to convert null or undefined category to camelCase');
    return {} as ProductCategory;
  }
  return convertObjectKeys<ProductCategory, Record<string, unknown>>(category, toCamelCase);
}

/**
 * Converts a ProductCategory object from camelCase to snake_case
 * @param category The category object to convert
 * @returns The converted category object
 */
export function convertCategoryToSnakeCase(category: Partial<ProductCategory>): Record<string, unknown> {
  if (!category) {
    LoggingService.warning('caseConverter', 'Attempted to convert null or undefined category to snake_case');
    return {};
  }
  return convertObjectKeys<Record<string, unknown>, Partial<ProductCategory>>(category, toSnakeCase);
}

/**
 * Converts an AppSettings object from snake_case to camelCase
 * @param settings The settings object to convert
 * @returns The converted settings object
 */
export function convertSettingsToCamelCase(settings: Record<string, unknown>): AppSettings {
  if (!settings) {
    LoggingService.warning('caseConverter', 'Attempted to convert null or undefined settings to camelCase');
    return { notificationDays: 3, theme: 'auto' };
  }
  return convertObjectKeys<AppSettings, Record<string, unknown>>(settings, toCamelCase);
}

/**
 * Converts an AppSettings object from camelCase to snake_case
 * @param settings The settings object to convert
 * @returns The converted settings object
 */
export function convertSettingsToSnakeCase(settings: Partial<AppSettings>): Record<string, unknown> {
  if (!settings) {
    LoggingService.warning('caseConverter', 'Attempted to convert null or undefined settings to snake_case');
    return {};
  }
  return convertObjectKeys<Record<string, unknown>, Partial<AppSettings>>(settings, toSnakeCase);
}

/**
 * Converts a ProductTemplate object from snake_case to camelCase
 * @param template The template object to convert
 * @returns The converted template object
 */
export function convertTemplateToCamelCase(template: Record<string, unknown>): ProductTemplate {
  if (!template) {
    LoggingService.warning('caseConverter', 'Attempted to convert null or undefined template to camelCase');
    return {} as ProductTemplate;
  }
  return convertObjectKeys<ProductTemplate, Record<string, unknown>>(template, toCamelCase);
}

/**
 * Converts a ProductTemplate object from camelCase to snake_case
 * @param template The template object to convert
 * @returns The converted template object
 */
export function convertTemplateToSnakeCase(template: Partial<ProductTemplate>): Record<string, unknown> {
  if (!template) {
    LoggingService.warning('caseConverter', 'Attempted to convert null or undefined template to snake_case');
    return {};
  }
  return convertObjectKeys<Record<string, unknown>, Partial<ProductTemplate>>(template, toSnakeCase);
}

/**
 * Converts an array of Product objects from snake_case to camelCase
 * @param products The array of product objects to convert
 * @returns The converted array of product objects
 */
export function convertProductsToCamelCase(products: Record<string, unknown>[]): Product[] {
  if (!products || !Array.isArray(products)) {
    LoggingService.warning('caseConverter', 'Attempted to convert null, undefined or non-array products to camelCase');
    return [];
  }
  return products.map(product => convertProductToCamelCase(product));
}

/**
 * Converts an array of ProductCategory objects from snake_case to camelCase
 * @param categories The array of category objects to convert
 * @returns The converted array of category objects
 */
export function convertCategoriesToCamelCase(categories: Record<string, unknown>[]): ProductCategory[] {
  if (!categories || !Array.isArray(categories)) {
    LoggingService.warning('caseConverter', 'Attempted to convert null, undefined or non-array categories to camelCase');
    return [];
  }
  return categories.map(category => convertCategoryToCamelCase(category));
}
