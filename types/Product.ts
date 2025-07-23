export interface Product {
  id: string;
  name: string;
  brand?: string;
  category: string;
  quantity: number;
  unit: string;
  purchaseDate: string;
  expirationDate: string;
  barcode?: string;
  imageUrl?: string;
  notes?: string;
  status: 'active' | 'expired' | 'consumed';
  consumedDate?: string;
  addedMethod: 'barcode' | 'photo' | 'manual';
  nutritionalInfo?: {
    calories?: number;
    proteins?: number;
    carbohydrates?: number;
    fats?: number;
  };
}

export interface ProductCategory {
  id: string;
  name: string;
  icon?: string; 
  color: string;
  iconUrl?: string;
  localIcon?: any; 
  user_id?: string;
  is_default?: boolean;
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