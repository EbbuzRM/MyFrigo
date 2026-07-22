// CategoryMatcher.ts — CategoryMatcher module.
//
// exports: CategoryMatcher
// used_by: hooks\useBarcodeScanner.ts
//                   hooks\useCategorySelection.ts
// rules:   - Module exports must remain as a class named `CategoryMatcher` with only static methods, as it is consumed by multiple hooks as a stateless service
//          - All category keyword maps must be maintained as private static members to prevent external mutation, with new categories added only via the `italianKeywordMap` structure
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

import { ProductCategory } from '@/types/Product';
import { LoggingService } from '@/services/LoggingService';
import categoryKeywords from './data/categoryKeywords.json';

/**
 * Centralized service for category matching and guessing.
 * Consolidates duplicate logic from useProductForm.ts and scanner.tsx
 */
export class CategoryMatcher {
  /**
   * Keyword map for matching Italian product names to categories.
   * Used primarily in manual entry form.
   * Data loaded from services/data/categoryKeywords.json
   */
  private static italianKeywordMap: Record<string, string[]> = categoryKeywords.italianKeywordMap;

  /**
   * Keyword map for matching OpenFoodFacts English categories to app categories.
   * Used primarily in barcode scanner.
   * Data loaded from services/data/categoryKeywords.json
   */
  private static offKeywordMap: Record<string, string[]> = categoryKeywords.offKeywordMap;

  /**
   * Find the first matching category ID by iterating an ordered list of candidates
   * and checking their keywords against a match predicate.
   * @param categoryIds Ordered list of category IDs to try
   * @param keywordMap Keyword map to search in
   * @param availableCategories Available categories to validate against
   * @param isMatch Predicate that returns true if a keyword matches the search input
   * @returns First matching category ID or null
   */
  private static findCategoryFromMap(
    categoryIds: string[],
    keywordMap: Record<string, string[]>,
    availableCategories: ProductCategory[],
    isMatch: (keyword: string) => boolean
  ): string | null {
    for (const categoryId of categoryIds) {
      const keywords = keywordMap[categoryId];
      if (keywords && keywords.some(isMatch)) {
        if (availableCategories.some(cat => cat.id === categoryId)) {
          return categoryId;
        }
      }
    }
    return null;
  }

  /**
   * Guess category from product name and brand using Italian keywords.
   * @param name Product name
   * @param brand Product brand
   * @param availableCategories List of available categories to validate against
   * @returns Category ID or null if no match found
   */
  static guessCategory(
    name: string,
    brand: string,
    availableCategories: ProductCategory[]
  ): string | null {
    const fullText = `${name.toLowerCase()} ${brand.toLowerCase()}`;

    LoggingService.info('CategoryMatcher', `🔍 Guess category per: "${name}" (${brand})`);

    const matchesKeyword = (keyword: string) => fullText.includes(keyword);

    // Priorità alle categorie più specifiche (ordinamento manuale per importanza)
    const categoryPriority = [
      'legumes', 'cheese', 'frozen', 'dairy', 'salumi', 'meat', 'fish', 'fruits', 'vegetables',
      'pasta', 'rice', 'flour', 'grains', 'beverages', 'canned',
      'snacks', 'sweets', 'condiments', 'sauces', 'eggs', 'jam', 'honey',
      'ice_cream', 'pomodoro', 'vegan', 'milk'
    ];

    // Cerca match seguendo l'ordine di priorità
    const match = this.findCategoryFromMap(categoryPriority, this.italianKeywordMap, availableCategories, matchesKeyword);
    if (match) {
      LoggingService.info('CategoryMatcher', `✅ Match trovato: "${match}"`);
      return match;
    }

    // Fallback: iterazione normale se nessun match con priorità
    const fallbackMatch = this.findCategoryFromMap(Object.keys(this.italianKeywordMap), this.italianKeywordMap, availableCategories, matchesKeyword);
    if (fallbackMatch) {
      LoggingService.info('CategoryMatcher', `⚠️ Match fallback: "${fallbackMatch}"`);
      return fallbackMatch;
    }

    LoggingService.info('CategoryMatcher', '❌ Nessun match trovato');
    return null;
  }

  /**
   * Map OpenFoodFacts categories to app categories using English keywords.
   * Prioritizes specific categories over generic ones to avoid false positives.
   * @param offCategories Array of OpenFoodFacts category strings
   * @param availableCategories List of available categories to validate against
   * @returns Category ID or null if no match found
   */
  static mapOpenFoodFactsCategories(
    offCategories: string[] | undefined,
    availableCategories: ProductCategory[]
  ): string | null {
    if (!offCategories || offCategories.length === 0) {
      return null;
    }

    const lowerCaseOffCategories = offCategories.map(c => c.toLowerCase());

    LoggingService.info('CategoryMatcher', '📋 Categorie OFF ricevute:', offCategories);

    // Categorie OFF troppo generiche da ignorare (causano falsi positivi)
    const genericCategoriesToIgnore = [
      'plant-based-foods-and-beverages',
      'plant-based-foods',
      'fruits-and-vegetables-based-foods',  // Ignora: contiene "fruits" ma è troppo generica
      'vegetables-based-foods',
      'canned-plant-based-foods',
      'foods-and-beverages',
      'processed-foods',
      'unknown'
    ];

    // Filtra categorie generiche
    const filteredCategories = lowerCaseOffCategories.filter(cat =>
      !genericCategoriesToIgnore.some(generic => cat.includes(generic))
    );

    LoggingService.info('CategoryMatcher', '✅ Categorie dopo filtro generiche:', filteredCategories);

    // Ordina le categorie per specificità (più specifiche = più parole = priorità)
    const sortedCategories = [...filteredCategories].sort((a, b) => {
      const aWords = a.split('-').length;
      const bWords = b.split('-').length;
      return bWords - aWords; // Più parole = più specifico = prima
    });

    LoggingService.info('CategoryMatcher', '📊 Categorie ordinate per specificità:', sortedCategories);

    // Cerca match partendo dalle categorie più specifiche
    const allOffCategoryIds = Object.keys(this.offKeywordMap);
    for (const offCat of sortedCategories) {
      const match = this.findCategoryFromMap(
        allOffCategoryIds,
        this.offKeywordMap,
        availableCategories,
        (keyword) =>
          offCat === keyword ||
          offCat.includes(`-${keyword}`) ||
          offCat.includes(`${keyword}-`) ||
          offCat.endsWith(`-${keyword}`)
      );
      if (match) {
        LoggingService.info('CategoryMatcher', `✅ Match specifico trovato: "${offCat}" → "${match}"`);
        return match;
      }
    }

    // Fallback: cerca generica su tutte le categorie originali (solo se nessun match specifico)
    LoggingService.info('CategoryMatcher', '⚠️ Nessun match specifico, provo fallback generico...');

    const fallbackMatch = this.findCategoryFromMap(
      allOffCategoryIds,
      this.offKeywordMap,
      availableCategories,
      (keyword) => lowerCaseOffCategories.some(offCat => offCat.includes(keyword))
    );
    if (fallbackMatch) {
      LoggingService.info('CategoryMatcher', `⚠️ Match generico trovato: "${fallbackMatch}"`);
      return fallbackMatch;
    }

    LoggingService.warning('CategoryMatcher', '❌ Nessun match trovato per le categorie:', offCategories);
    return null;
  }

  /**
   * Get all keywords for a specific category (for testing or debugging).
   * @param categoryId Category ID
   * @param language 'italian' or 'english' (OFF)
   * @returns Array of keywords or empty array if category not found
   */
  static getKeywordsForCategory(
    categoryId: string,
    language: 'italian' | 'english' = 'italian'
  ): string[] {
    const map = language === 'italian' ? this.italianKeywordMap : this.offKeywordMap;
    return map[categoryId] || [];
  }

  /**
   * Add custom keywords to a category (for extensibility).
   * @param categoryId Category ID
   * @param keywords Array of keywords to add
   * @param language 'italian' or 'english' (OFF)
   */
  static addKeywords(
    categoryId: string,
    keywords: string[],
    language: 'italian' | 'english' = 'italian'
  ): void {
    const map = language === 'italian' ? this.italianKeywordMap : this.offKeywordMap;
    if (!map[categoryId]) {
      map[categoryId] = [];
    }
    map[categoryId] = [...new Set([...map[categoryId], ...keywords])];
  }
}
