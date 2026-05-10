// Product.ts — Product module.
//
// exports: ISODateString | ProductStatus | AddMethod | NutritionalInfo | Quantity | Product | ProductSnakeCase | LocalIcon | ProductCategory | ProductFormState | ProductDetailState | IconData | ProductCategorySnakeCase | ProductForSupabase | PRODUCT_CATEGORIES
// used_by: app\(tabs)\products.tsx
//         app\consumed-list.tsx
//         app\history-detail.tsx
//         app\manage-categories.tsx
//         app\manual-entry.tsx
//         app\scanner.tsx
//         components\CategoryFilter.tsx
//         components\CategoryIcon.tsx
//         components\ConsumeQuantityModal.tsx
//         components\ExpirationCard.tsx
//         components\ExpirationCardDetails.tsx
//         components\ExpirationCardHeader.tsx
//         components\HistoryCard.tsx
//         components\HistoryCardDetails.tsx
//         components\HistoryCardHeader.tsx
//         components\HistoryStats.tsx
//         components\ProductCard.tsx
//         components\ProductCardDetails.tsx
//         components\ProductCardHeader.tsx
//         components\ProductDetailHeader.tsx
//         components\ProductDetailInfo.tsx
//         components\QuantityDisplay.tsx
//         components\products\CategoryFilterBar.tsx
//         components\products\ProductList.tsx
//         context\CategoryContext.tsx
//         context\ManualEntryActionsContext.tsx
//         context\ManualEntryContext.tsx
//         context\ProductContext.tsx
//         context\__tests__\ProductContext.test.tsx
//         hooks\__tests__\useDashboardStats.test.ts
//         hooks\barcode\useLocalDatabaseLookup.ts
//         hooks\useBarcodeScanner.ts
//         hooks\useCategorySelection.ts
//         hooks\useDashboardStats.ts
//         hooks\useHistoryData.ts
//         hooks\useProductActions.ts
//         hooks\useProductDetail.ts
//         hooks\useProductFilters.ts
//         hooks\useProductInitialization.ts
//         hooks\useProductSave.ts
//         hooks\useQuantityCalculation.ts
//         services\CategoryMatcher.ts
//         services\CategoryService.ts
//         services\ProductStorage.ts
//         services\TemplateService.ts
//         services\__tests__\StorageService.test.ts
//         types\history.ts
//         utils\accessibility\cards.ts
//         utils\caseConverter.ts
//         utils\historyCalculations.ts
// rules:   This module is a shared type definitions hub; do not add runtime logic or side effects to this file. All exports must remain pure TypeScript types, interfaces, or const enums. Any new type added here must be accompanied by its corresponding snake_case variant and Supabase-compatible serialization type.
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

/**
 * Rappresenta una data in formato ISO 8601 (YYYY-MM-DD)
 * @example "2023-12-31"
 */
export type ISODateString = string;

/**
 * Stato possibile di un prodotto
 */
export type ProductStatus = 'active' | 'expired' | 'consumed';

/**
 * Metodo di aggiunta di un prodotto
 */
export type AddMethod = 'barcode' | 'photo' | 'manual';

/**
 * Informazioni nutrizionali di un prodotto
 */
export interface NutritionalInfo {
  calories?: number;
  proteins?: number;
  carbohydrates?: number;
  fats?: number;
}

/**
 * Rappresenta una singola quantità di un prodotto
 */
export interface Quantity {
  quantity: number;
  unit: string;
}

/**
 * Rappresenta un prodotto nel sistema
 */
export interface Product {
  /** Identificatore univoco del prodotto */
  id: string;
  /** Nome del prodotto */
  name: string;
  /** Marca del prodotto (opzionale) */
  brand?: string;
  /** ID della categoria del prodotto */
  category: string;
  /** Elenco delle quantità del prodotto */
  quantities: Quantity[];
  /** Data di acquisto in formato ISO 8601 */
  purchaseDate: ISODateString;
  /** Data di scadenza in formato ISO 8601 */
  expirationDate: ISODateString;
  /** Codice a barre del prodotto (opzionale) */
  barcode?: string;
  /** URL dell'immagine del prodotto (opzionale) */
  imageUrl?: string;
  /** Note aggiuntive sul prodotto (opzionale) */
  notes?: string;
  /** Stato attuale del prodotto */
  status: ProductStatus;
  /** Data di consumo in formato ISO 8601 (opzionale) */
  consumedDate?: ISODateString;
  /** Metodo con cui è stato aggiunto il prodotto */
  addedMethod: AddMethod;
  /** Informazioni nutrizionali (opzionale) */
  nutritionalInfo?: NutritionalInfo;
  /** Indica se il prodotto è congelato */
  isFrozen?: boolean;
}

/**
 * Rappresenta un prodotto con chiavi in snake_case per il database.
 */
export interface ProductSnakeCase {
  id: string;
  name: string;
  brand?: string;
  category: string;
  quantities: Quantity[];
  purchase_date: ISODateString;
  expiration_date: ISODateString;
  barcode?: string;
  image_url?: string;
  notes?: string;
  status: ProductStatus;
  consumed_date?: ISODateString;
  added_method: AddMethod;
  nutritional_info?: NutritionalInfo;
  is_frozen?: boolean;
}

/**
 * Tipo di icona locale per una categoria
 */
export type LocalIcon = {
  uri: string;
} | number;

/**
 * Rappresenta una categoria di prodotti
 */
export interface ProductCategory {
  /** Identificatore univoco della categoria */
  id: string;
  /** Nome della categoria */
  name: string;
  /** Icona della categoria (emoji o URL) */
  icon?: string;
  /** Colore della categoria in formato HEX */
  color: string;
  /** Icona locale della categoria (risorsa locale) */
  localIcon?: LocalIcon;
  /** ID dell'utente proprietario della categoria (per categorie personalizzate) */
  userId?: string;
  /** Indica se la categoria è predefinita */
  isDefault?: boolean;
  /** Indica se l'icona non è stata trovata */
  iconNotFound?: boolean;
}

/**
 * Stato per il form di prodotto (usato in useProductForm)
 */
export interface ProductFormState {
  name: string;
  expirationDate: ISODateString | null;
  categoryId?: string;
  iconUrl?: string;
  brand?: string;
  notes?: string;
  errors: Partial<Record<keyof Product, string>>;
  isValid: boolean;
}

/**
 * Stato per i dettagli del prodotto (usato in useProductDetail)
 */
export interface ProductDetailState {
  product: Product | null;
  isLoading: boolean;
  error?: string;
  relatedIcons?: Array<{
    id: string;
    url: string;
    categoryId?: string;
    isValid: boolean;
  }>;
}

/**
 * Dati per icone (per integrazione con IconService)
 */
export interface IconData {
  id: string;
  url: string;
  categoryId?: string;
  isValid: boolean;
}

/**
 * Rappresenta una categoria di prodotti con chiavi in snake_case per il database.
 */
export interface ProductCategorySnakeCase {
  id: string;
  name: string;
  icon?: string;
  color: string;
  local_icon?: LocalIcon;
  user_id?: string;
  is_default?: boolean;
  icon_not_found?: boolean;
}

/**
 * Rappresenta un prodotto convertito per Supabase con quantities serializzato come JSON string.
 */
export interface ProductForSupabase {
  id: string;
  name: string;
  brand?: string;
  category: string;
  quantities: string | null;
  purchase_date: ISODateString;
  expiration_date: ISODateString;
  barcode?: string;
  image_url?: string;
  notes?: string;
  status: ProductStatus;
  consumed_date?: ISODateString;
  added_method: AddMethod;
  nutritional_info?: NutritionalInfo;
  is_frozen?: boolean;
}

import flourIcon from '../assets/images/flour-icon.png';

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { id: 'beverages', name: 'Bevande', icon: '🥤', color: '#8B5CF6' },
  { id: 'biscuits', name: 'Biscotti', icon: '🍪', color: '#A16207' },
  { id: 'meat', name: 'Carne', icon: '🥩', color: '#EF4444' },
  { id: 'grains', name: 'Cereali', icon: '🌾', color: '#D97706' },
  { id: 'condiments', name: 'Condimenti', icon: '🧂', color: '#64748B' },
  { id: 'canned', name: 'Conserve', icon: '🥫', color: '#A16207' },
  { id: 'sweets', name: 'Dolci', icon: '🍰', color: '#EC4899' },
  { id: 'flour', name: 'Farine', localIcon: flourIcon, color: '#A16207' },
  { id: 'cheese', name: 'Formaggi', icon: '🧀', color: '#FACC15' },
  { id: 'fruits', name: 'Frutta', icon: '🍎', color: '#F59E0B' },
  { id: 'ice_cream', name: 'Gelati', icon: '🍦', color: '#A78BFA' },
  { id: 'dairy', name: 'Latticini', icon: '🐄', color: '#3B82F6' },
  { id: 'milk', name: 'Latte', icon: '🥛', color: '#60A5FA' },
  { id: 'legumes', name: 'Legumi', icon: '🥫', color: '#84CC16' },
  { id: 'jam', name: 'Marmellate', icon: '🍓', color: '#D946EF' },
  { id: 'honey', name: 'Miele', icon: '🍯', color: '#F59E0B' },
  { id: 'pasta', name: 'Pasta', icon: '🍝', color: '#F97316' },
  { id: 'pomodoro', name: 'Pomodoro', icon: '🍅', color: '#E53E3E' },
  { id: 'fish', name: 'Pesce', icon: '🐟', color: '#06B6D4' },
  { id: 'rice', name: 'Riso', icon: '🍚', color: '#FBBF24' },
  { id: 'snacks', name: 'Snack', icon: '🍿', color: '#EC4899' },
  { id: 'sauces', name: 'Sughi', icon: '🍲', color: '#DC2626' },
  { id: 'frozen', name: 'Surgelati', icon: '❄️', color: '#0EA5E9' },
  { id: 'eggs', name: 'Uova', icon: '🥚', color: '#FCD34D' },
  { id: 'vegan', name: 'Vegano', icon: '🌱', color: '#22C55E' },
  { id: 'vegetables', name: 'Verdure', icon: '🥬', color: '#10B981' },
];