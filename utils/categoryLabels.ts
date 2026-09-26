import type { ProductCategory } from '@/types/Product';
import { categoriesIt } from '@/i18n/catalogs/it/categories';
import { categoriesEn } from '@/i18n/catalogs/en/categories';
import type { SupportedLanguage } from '@/i18n/types';

type StandardCategoryId = keyof typeof standardKeys;

const standardKeys = {
  beverages: 'standard_beverages', biscuits: 'standard_biscuits', meat: 'standard_meat',
  grains: 'standard_grains', condiments: 'standard_condiments', canned: 'standard_canned',
  sweets: 'standard_sweets', flour: 'standard_flour', cheese: 'standard_cheese',
  fruits: 'standard_fruits', ice_cream: 'standard_ice_cream', dairy: 'standard_dairy',
  milk: 'standard_milk', legumes: 'standard_legumes', jam: 'standard_jam',
  honey: 'standard_honey', pasta: 'standard_pasta', pomodoro: 'standard_pomodoro',
  fish: 'standard_fish', rice: 'standard_rice', snacks: 'standard_snacks',
  sauces: 'standard_sauces', frozen: 'standard_frozen', eggs: 'standard_eggs',
  vegan: 'standard_vegan', vegetables: 'standard_vegetables',
} as const;

export function getCategoryLabel(
  category: Pick<ProductCategory, 'id' | 'name' | 'isDefault'>,
  language: SupportedLanguage,
): string {
  if (category.isDefault === false || !Object.prototype.hasOwnProperty.call(standardKeys, category.id)) {
    return category.name;
  }
  const key = standardKeys[category.id as StandardCategoryId];
  return language === 'it' ? categoriesIt[key] : categoriesEn[key];
}

export function sortCategoriesForLanguage(
  categories: readonly ProductCategory[],
  language: SupportedLanguage,
): ProductCategory[] {
  const collator = new Intl.Collator(language === 'it' ? 'it-IT' : 'en-GB');
  return [...categories].sort((a, b) =>
    collator.compare(getCategoryLabel(a, language), getCategoryLabel(b, language))
  );
}
