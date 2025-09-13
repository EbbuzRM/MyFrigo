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

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { id: 'beverages', name: 'Bevande', icon: '🥤', color: '#8B5CF6' },
  { id: 'biscuits', name: 'Biscotti', icon: '🍪', color: '#A16207' },
  { id: 'meat', name: 'Carne', icon: '🥩', color: '#EF4444' },
  { id: 'grains', name: 'Cereali', icon: '🌾', color: '#D97706' },
  { id: 'condiments', name: 'Condimenti', icon: '🧂', color: '#64748B' },
  { id: 'canned', name: 'Conserve', icon: '🥫', color: '#A16207' },
  { id: 'sweets', name: 'Dolci', icon: '🍰', color: '#EC4899' },
  { id: 'flour', name: 'Farine', localIcon: require('../assets/images/flour-icon.png'), color: '#A16207' },
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